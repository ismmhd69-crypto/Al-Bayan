import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { emptyRichState, reduceRichEvent, mergeContinuationDisplay, type RichEvent, type RichGroup } from "@/lib/ask/rich-answer";
import { runRichAnswer } from "@/lib/ask/rich-engine";
import { sections, pack, dependencies, audit } from "./fixtures/rich";

const snapshot = "a".repeat(64);
const update = (group: RichGroup, sequence: number, revision = 1): RichEvent => ({ version: 2, request_id: "fixture", sequence, type: "section_update", revision, evidence_snapshot: snapshot, section: sections.find(s => s.group === group)! });

it("inserts Quran above an already checked Sunnah section without requiring empty placeholders", () => {
  let state = reduceRichEvent(emptyRichState(), update("hadith", 1));
  expect(state.sections.map(s => s.group)).toEqual(["hadith"]);
  state = reduceRichEvent(state, update("quran", 2));
  expect(state.sections.map(s => s.group)).toEqual(["quran", "hadith"]);
  expect(() => reduceRichEvent(state, update("hadith", 3))).toThrow("invalid_group_revision");
  expect(() => reduceRichEvent(state, { ...update("scholar", 3), version: undefined })).toThrow("invalid_stream_version");
});

it("withdraws one group and its dependent summary while retaining unrelated checked material", () => {
  let state = emptyRichState();
  for (const [i, group] of (["quran", "hadith", "scholar", "summary"] as const).entries()) state = reduceRichEvent(state, update(group, i + 1));
  state = reduceRichEvent(state, { version: 2, request_id: "fixture", sequence: 5, type: "withdraw_group", group: "hadith", revision: 2 });
  expect(state.sections.map(s => s.group)).toEqual(["quran", "scholar"]);
  expect(state.withdrawn).toBe(false);
  expect(() => reduceRichEvent(state, update("hadith", 6, 1))).toThrow("invalid_group_revision");
});

it("keeps the legacy source-order contract intact", () => {
  expect(() => reduceRichEvent(emptyRichState(), { request_id: "fixture", sequence: 1, type: "section", section: sections[1] })).toThrow("invalid_section_order");
});

it("immediately removes old visible text when a resumed request invalidates its evidence", () => {
  let old = reduceRichEvent(emptyRichState(), update("quran", 1));
  old = reduceRichEvent(old, update("hadith", 2));
  const event: RichEvent = { version: 2, request_id: "new-request", sequence: 1, type: "withdraw_group", group: "quran", revision: 1 };
  const fresh = reduceRichEvent(emptyRichState(), event);
  const displayed = mergeContinuationDisplay(old, fresh, event);
  expect(displayed.sections.map(s => s.group)).toEqual(["hadith"]);
});

it("publishes safe Sunnah before waiting for an unrelated scholar correction", async () => {
  const deps = dependencies(), write = deps.writer.generateJson, check = deps.verifier.generateJson;
  const seen: string[] = []; let release!: () => void, correctionStarted = false;
  const held = new Promise<void>(resolve => { release = resolve; });
  deps.rich = { progressive: true, onSection: section => { if (section.outcome === "ready") seen.push(section.group); } };
  deps.writer.generateJson = async request => {
    if (JSON.parse(request.prompt).correction) { correctionStarted = true; await held; }
    return write(request);
  };
  deps.verifier.generateJson = async request => {
    const result = await check(request) as ReturnType<typeof audit>;
    if (JSON.parse(request.prompt).review_stage === "source_explanations") Object.assign(result.claim_assessments[2], { direct_support: "no", reason_codes: ["unsupported_meaning"], explanation: "Invented unsupported scholar statement." });
    return result;
  };
  const job = runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
  try {
    await vi.waitFor(() => expect(correctionStarted).toBe(true));
    expect(seen).toEqual(["quran", "hadith"]);
  } finally { release(); await job; }
});
