import { positiveMeaningFixture } from "./fixtures/meaning";
import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { runProgressiveLanes } from "@/lib/ask/progressive-lanes";
import type { QuestionFrame } from "@/lib/ask/retrieval";
import type { RichSection } from "@/lib/ask/rich-answer";
import type { VerifiedQuranCard } from "@/lib/ask/rich-answer";
import type { ProgressiveCheckpoint } from "@/lib/ask/progressive-checkpoint";
import { pack, dependencies, audit } from "./fixtures/rich";

const frame: QuestionFrame = { ...pack.question, kind: "question", checklistStatus: "complete", searchQueries: { en: ["care responsibility"], ar: ["عناية يومية"] } };
const hints = { quran: [], hadith: [], scholars: [] };
function deps() {
  const base = dependencies();
  base.search = async () => ["2:183"];
  base.getVerse = async key => key === "2:183" && pack.passages[0].source.kind === "quran" ? pack.passages[0].source.verse : undefined;
  base.searchHadith = async () => pack.passages[1].source.kind === "hadith" ? [pack.passages[1].source.hadith] : [];
  base.searchScholars = async () => pack.passages[2].source.kind === "scholar" ? [pack.passages[2].source.quote] : [];
  base.sourceAvailability = { hadith: true, scholar: true };
  base.rich = { progressive: true };
  base.verifier.generateJson = async request => {
    const input = JSON.parse(request.prompt);
    if (request.system.startsWith("You select evidence")) return { status: "ready", coverage: "complete", conflict_type: "none",
      assessments: input.candidates.map((p: { source: { id: string } }) => ({ source_id: p.source.id, relevance: "direct", supported_requirement_ids: ["R1"], context_safe: "yes", position: "",
        contribution: { role: "direct", scope: "general", conditions: [] }, scope_matches_question: "yes", related_requirement_ids: [], distinct_contribution: "yes" })) };
    if (input.stage === "narrow_meaning_review_v1") return positiveMeaningFixture(input);
    return audit(request.prompt);
  };
  return base;
}

it("shows checked Quran and Sunnah while scholarly retrieval remains pending, then checks full coverage", async () => {
  const base = deps(), shown: RichSection[] = [];
  let release!: () => void, scholarlyFinished = false, combined = 0;
  const held = new Promise<void>(resolve => { release = resolve; });
  const search = base.searchScholars!, verify = base.verifier.generateJson;
  base.searchScholars = async (...args) => { await held; scholarlyFinished = true; return search(...args); };
  base.verifier.generateJson = request => { if (request.system.startsWith("You select evidence") && !request.system.includes("Assess useful contributions")) combined++; return verify(request); };
  base.rich!.onSection = section => { shown.push(section); };
  const job = runProgressiveLanes("Explain care", frame, base, new AbortController().signal, 50_000, hints);
  try {
    await vi.waitFor(() => expect(shown.filter(s => s.outcome === "ready").map(s => s.group)).toEqual(expect.arrayContaining(["quran", "hadith"])));
    expect(scholarlyFinished).toBe(false); expect(shown.some(s => s.group === "summary")).toBe(false);
  } finally { release(); }
  const result = await job;
  expect(combined).toBe(1); expect(result.status).toBe("rich_answer");
});

it("withholds Quran whose required surrounding context fails", async () => {
  const base = deps(), shown: RichSection[] = [];
  base.neighbours = async () => { throw new DOMException("fixture", "TimeoutError"); };
  base.rich!.onSection = section => { shown.push(section); };
  await runProgressiveLanes("Explain care", frame, base, new AbortController().signal, 50_000, hints);
  expect(shown.filter(s => s.group === "quran").every(s => s.outcome !== "ready")).toBe(true);
  expect(shown.some(s => s.group === "hadith" && s.outcome === "ready")).toBe(true);
});

it("never treats successful partial lanes as complete when combined evidence is insufficient", async () => {
  const base = deps(), verify = base.verifier.generateJson;
  base.verifier.generateJson = request => request.system.startsWith("You select evidence") && !request.system.includes("Assess useful contributions")
    ? Promise.resolve({ status: "insufficient", coverage: "incomplete", conflict_type: "none", assessments: [] }) : verify(request);
  const result = await runProgressiveLanes("Explain care", frame, base, new AbortController().signal, 50_000, hints);
  expect(result).toMatchObject({ status: "incomplete", failureKind: "question_coverage", withdraw: false });
});

it("withholds an incomplete visitor-named passage even if the selector would approve its available verse", async () => {
  const base = deps(), shown: RichSection[] = [];
  base.namedEvidencePassages = [["Q2:183", "Q2:184"]];
  base.rich!.onSection = section => { shown.push(section); };
  const result = await runProgressiveLanes("Explain the named passage", frame, base, new AbortController().signal, 50_000, hints);
  expect(shown.some(s => s.group === "quran" && s.outcome === "ready")).toBe(false);
  expect(result.status).toBe("incomplete");
});

it("prevents late source completion from publishing after cancellation", async () => {
  const base = deps(), stop = new AbortController(), shown: RichSection[] = [];
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  base.search = async () => { await held; return ["2:183"]; };
  base.rich!.onSection = section => { shown.push(section); };
  const job = runProgressiveLanes("Explain care", frame, base, stop.signal, 50_000, hints).catch(e => e);
  stop.abort(new DOMException("Stopped", "AbortError"));
  expect(await job).toMatchObject({ name: "AbortError" });
  const count = shown.length; release(); await Promise.resolve(); await Promise.resolve();
  expect(shown).toHaveLength(count);
});

it("emits a selected, context-checked verse card before an unrelated verse finishes loading", async () => {
  const base = deps(), cards: VerifiedQuranCard[] = [], shown: RichSection[] = [];
  let release!: () => void, laterFinished = false;
  const held = new Promise<void>(resolve => { release = resolve; });
  const first = pack.passages[0].source;
  if (first.kind !== "quran") throw Error("fixture");
  base.search = async () => ["2:183", "2:184"];
  base.getVerse = async key => {
    if (key === "2:183") return first.verse;
    await held; laterFinished = true; return { ...first.verse, key: "2:184", url: "https://quran.com/2/184" };
  };
  base.rich!.onCard = card => { cards.push(card); };
  base.rich!.onSection = section => { shown.push(section); };
  const job = runProgressiveLanes("Explain care", frame, base, new AbortController().signal, 50_000, hints);
  try {
    await vi.waitFor(() => expect(cards.some(c => c.sources.some(s => s.id === "Q2:183"))).toBe(true));
    expect(laterFinished).toBe(false);
    expect(cards[0].sources[0].role).toBe("direct");
    await vi.waitFor(() => expect(shown.some(s => s.group === "quran" && s.outcome === "ready")).toBe(true));
    expect(laterFinished).toBe(false);
  } finally { release(); await job; }
});

it("never previews a named multi-verse unit as separate incomplete cards", async () => {
  const base = deps(), cards: VerifiedQuranCard[] = [];
  base.namedEvidencePassages = [["Q2:183", "Q2:184"]];
  base.rich!.onCard = card => { cards.push(card); };
  await runProgressiveLanes("Explain the named passage", frame, base, new AbortController().signal, 50_000, hints);
  expect(cards).toEqual([]);
});

it("keeps an early explanation when a later verse lookup times out and ignores late lookup output", async () => {
  vi.useFakeTimers();
  const base = deps(), shown: RichSection[] = [];
  const checkpoint: ProgressiveCheckpoint = { lanes: {}, meaningApprovals: new Set(), retry: 0 };
  base.progressiveCheckpoint = checkpoint;
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  const source = pack.passages[0].source;
  if (source.kind !== "quran") throw Error("fixture");
  base.search = async () => ["2:183", "2:184"];
  base.getVerse = async key => { if (key === "2:183") return source.verse; await held; return { ...source.verse, key: "2:184" }; };
  base.rich!.onCard = () => {};
  base.rich!.onSection = section => { shown.push(section); };
  try {
    const job = runProgressiveLanes("Explain care", frame, base, new AbortController().signal, 50_000, hints);
    await vi.waitFor(() => expect(shown.some(s => s.group === "quran" && s.outcome === "ready")).toBe(true));
    await vi.advanceTimersByTimeAsync(35_001);
    await job;
    expect(shown.filter(s => s.group === "quran").at(-1)?.outcome).toBe("ready");
    const count = shown.length; release(); await vi.advanceTimersByTimeAsync(0);
    expect(shown.length).toBe(count);
  } finally { release(); vi.useRealTimers(); }
});

it("continues a failed summary without repeating checked lane retrieval, selection or writing", async () => {
  const base = deps(), checkpoint: ProgressiveCheckpoint = { lanes: {}, meaningApprovals: new Set(), retry: 0 };
  base.progressiveCheckpoint = checkpoint; base.revalidateProgressive = async () => true;
  const write = base.writer.generateJson; let summaryFails = true, sourceWrites = 0;
  base.writer.generateJson = async request => {
    if (JSON.parse(request.prompt).sections_to_write?.includes("summary")) { if (summaryFails) throw Error("invented summary outage"); }
    else sourceWrites++;
    return write(request);
  };
  const first = await runProgressiveLanes("Explain care", frame, base, new AbortController().signal, 50_000, hints);
  expect(first.status).toBe("incomplete"); expect(sourceWrites).toBe(3); expect(checkpoint.combined).toBeDefined();
  checkpoint.combined!.candidatesHash = "old-order-with-unused-candidates";
  const verify = base.verifier.generateJson;
  base.verifier.generateJson = request => {
    if (request.system.startsWith("You select evidence") && !request.system.includes("Assess useful contributions")) throw Error("must reuse the refreshed complete selection");
    return verify(request);
  };
  summaryFails = false; checkpoint.retry = 1;
  base.search = async () => { throw Error("must reuse completed Quran discovery"); };
  base.searchHadith = async () => { throw Error("must reuse completed hadith discovery"); };
  base.searchScholars = async () => { throw Error("must reuse completed scholar discovery"); };
  const result = await runProgressiveLanes("Explain care", frame, base, new AbortController().signal, 50_000, hints);
  expect(result.status).toBe("rich_answer"); expect(sourceWrites).toBe(3);
});

it("withdraws and rebuilds an old checked lane when source revalidation reports a change", async () => {
  const base = deps(), checkpoint: ProgressiveCheckpoint = { lanes: {}, meaningApprovals: new Set(), retry: 0 }, withdrawn: string[] = [];
  base.progressiveCheckpoint = checkpoint; base.revalidateProgressive = async () => false;
  await runProgressiveLanes("Explain care", frame, base, new AbortController().signal, 50_000, hints);
  checkpoint.retry = 1; base.rich!.onWithdraw = group => { if (group) withdrawn.push(group); };
  let searches = 0; const original = base.search;
  base.search = async (...args) => { searches++; return original(...args); };
  await runProgressiveLanes("Explain care", frame, base, new AbortController().signal, 50_000, hints);
  expect(withdrawn).toEqual(expect.arrayContaining(["quran", "hadith", "scholar"])); expect(searches).toBeGreaterThan(0);
});

it("retains a freshly revalidated checked section when additional evidence research times out", async () => {
  const base = deps(), checkpoint: ProgressiveCheckpoint = { lanes: {}, meaningApprovals: new Set(), retry: 0 };
  base.progressiveCheckpoint = checkpoint; base.revalidateProgressive = async () => true;
  await runProgressiveLanes("Explain care", frame, base, new AbortController().signal, 50_000, hints);
  const existing = checkpoint.lanes.hadith!.section!;
  expect(existing.outcome).toBe("ready");
  const id = checkpoint.lanes.hadith!.pack!.passages.find(p => p.source.kind === "hadith")!.id;
  checkpoint.retry = 1; checkpoint.needsEvidence = true;
  base.planEvidenceRecovery = async () => [{ requirementId: "R1", family: "hadith", language: "en", text: "additional daily support" }];
  const hadith = pack.passages[1].source;
  if (hadith.kind !== "hadith") throw Error("fixture");
  base.searchHadith = async () => [{ ...hadith.hadith, id: "HE9002", arabic: "نص آخر للتجربة فقط", numbers: { bukhari: 1905, muslim: 1152 }, url: "https://hadeethenc.com/en/browse/hadith/9002" }];
  const shown: RichSection[] = [], verify = base.verifier.generateJson;
  base.rich!.onSection = section => { shown.push(section); };
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  base.verifier.generateJson = async request => {
    const input = JSON.parse(request.prompt);
    if (request.system.startsWith("You select evidence") && request.system.includes("Assess useful contributions") && input.candidates?.some((p: { source: { id: string } }) => p.source.id === id)) await held;
    return verify(request);
  };
  vi.useFakeTimers();
  try {
    const job = runProgressiveLanes("Explain care", frame, base, new AbortController().signal, 50_000, hints);
    await vi.waitFor(() => expect(shown.some(s => s.group === "hadith" && s.outcome === "ready")).toBe(true));
    await vi.advanceTimersByTimeAsync(35_001);
    await job;
    const survived = shown.filter(s => s.group === "hadith" && s.outcome === "ready");
    expect(survived.some(s => s.searchOutcome === "timeout" && JSON.stringify(s.claims) === JSON.stringify(existing.claims))).toBe(true);
  } finally { release(); vi.useRealTimers(); }
});

it("allows one independently checked correction in each affected source group", async () => {
  const base = deps(), write = base.writer.generateJson, corrected: string[] = [];
  base.writer.generateJson = async request => {
    const input = JSON.parse(request.prompt), requested = input.sections_to_write as string[];
    if (requested.length === 1 && ["quran", "hadith"].includes(requested[0])) {
      if (input.correction) corrected.push(requested[0]);
      else return { status: "no_answer", [requested[0]]: [], no_answer_feedback: [{ group: requested[0], reason: "cannot_paraphrase", missing_requirement_ids: ["R1"] }] };
    }
    return write(request);
  };
  const result = await runProgressiveLanes("Explain care", frame, base, new AbortController().signal, 50_000, hints);
  expect(corrected.sort()).toEqual(["hadith", "quran"]);
  expect(result.status).toBe("rich_answer");
});

it("commits a final source check before delivering it even if the request stops immediately afterward", async () => {
  const base = deps(), stop = new AbortController();
  const checkpoint: ProgressiveCheckpoint = { lanes: {}, meaningApprovals: new Set(), retry: 0 };
  base.progressiveCheckpoint = checkpoint;
  let savedBeforeDelivery = false;
  base.rich!.onSection = section => {
    if (checkpoint.combined && section.group === "quran" && section.outcome === "ready") {
      savedBeforeDelivery = JSON.stringify(checkpoint.lanes.quran?.pack) === JSON.stringify(checkpoint.combined.pack)
        && JSON.stringify(checkpoint.lanes.quran?.section) === JSON.stringify(section);
      stop.abort(new DOMException("Disconnected after checked section", "AbortError"));
    }
  };
  await runProgressiveLanes("Explain care", frame, base, stop.signal, 50_000, hints).catch(() => {});
  expect(savedBeforeDelivery).toBe(true);
});
