import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { runRichAnswer, parseRichClaims } from "@/lib/ask/rich-engine";
import { consumeRichStream, emptyRichState, reduceRichEvent, validRichAnswer, type RichEvent } from "@/lib/ask/rich-answer";
import { abortable } from "@/lib/ask/abort";
import { stripAnswer } from "@/lib/chat/answer-store";
import { hydrateAnswer } from "@/lib/chat/hydrate";
import { pack, sections, drafts, richAnswer, audit, dependencies } from "./fixtures/rich";

describe("checked rich explanations", () => {
  it("sends a checked Quran section before waiting for the remaining writer", async () => {
    const deps = dependencies(), events: string[] = [];
    let release!: () => void;
    const remaining = new Promise<void>(r => release = r);
    const write = deps.writer.generateJson;
    deps.writer.generateJson = async req => { if (JSON.parse(req.prompt).sections_to_write[0] === "hadith") await remaining; return write(req); };
    deps.rich = { onSection: section => { events.push(section.group); if (section.group === "quran") release(); } };
    const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
    expect(result.status).toBe("rich_answer");
    expect(events).toEqual(["quran", "hadith", "scholar", "summary"]);
    expect(result.status === "rich_answer" && validRichAnswer(result.answer)).toBe(true);
  });
  it.each(["direct_support", "audience_preserved", "conditions_preserved", "scope_preserved", "causal_meaning_preserved"])("withholds unsupported %s and withdraws an earlier section when the full check finds it unsafe", async field => {
    const deps = dependencies(); const withdraw = vi.fn(); deps.rich = { onWithdraw: withdraw };
    deps.verifier.generateJson = async req => {
      const result = audit(req.prompt);
      if (JSON.parse(req.prompt).full_answer) { result.claim_assessments[0][field] = "no"; result.claim_assessments[0].reason_codes = [field === "direct_support" ? "unsupported_meaning" : field === "audience_preserved" ? "audience_changed" : field === "conditions_preserved" ? "condition_lost" : field === "scope_preserved" ? "scope_broadened" : "cause_inferred"]; result.claim_assessments[0].explanation = "The explanation loses a restriction in its cited source."; result.earlier_section_safe = "no"; }
      return result;
    };
    expect(await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {})).toMatchObject({ status: "incomplete", withdraw: true });
    expect(withdraw).toHaveBeenCalledOnce();
  });
  it("rejects invented references and silent omission of selected evidence", () => {
    expect(parseRichClaims([{ ...drafts.quran[0], source_ids: ["Q2:184"] }], "quran", pack, "en")).toBeNull();
    expect(parseRichClaims([], "hadith", pack, "en")).toBeNull();
    expect(parseRichClaims(drafts.quran, "hadith", pack, "en")).toBeNull();
  });
  it("resolves absent Quran evidence and proceeds to the hadith instead of writing an empty Quran explanation", async () => {
    const deps = dependencies(), local = structuredClone(pack);
    local.passages = local.passages.filter(p => p.source.kind !== "quran"); local.cards = [];
    const write = deps.writer.generateJson;
    deps.writer.generateJson = async req => ({ ...await write(req) as object, summary: [{ ...drafts.summary[0], source_ids: ["HE9001"] }] });
    const result = await runRichAnswer(local, "en", deps, new AbortController().signal, "Explain care", { quran: "timeout" });
    expect(result.status).toBe("rich_answer");
    if (result.status === "rich_answer") expect(result.answer.sections[0]).toMatchObject({ group: "quran", outcome: "timeout", claims: [], sources: [] });
  });
  it("retains the individually checked section when the remaining writer fails", async () => {
    const deps = dependencies(), received: string[] = []; const write = deps.writer.generateJson;
    deps.rich = { onSection: s => received.push(s.group) };
    deps.writer.generateJson = async req => { if (JSON.parse(req.prompt).sections_to_write[0] === "hadith") throw new Error("provider down"); return write(req); };
    expect(await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {})).toMatchObject({ status: "incomplete", withdraw: false });
    expect(received).toEqual(["quran", "hadith", "scholar"]);
  });
  it("keeps checked sections but never completes or saves an answer after a selected Quran explanation fails", async () => {
    const deps = dependencies(), write = deps.writer.generateJson;
    deps.writer.generateJson = async req => { if (JSON.parse(req.prompt).sections_to_write[0] === "quran") throw new Error("draft failed"); return write(req); };
    const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
    expect(result.status).toBe("incomplete");
    if (result.status === "incomplete") {
      expect(result.sections?.map(s => s.outcome)).toEqual(["failed_check", "ready", "ready"]);
      expect(result.sections?.some(s => s.group === "summary")).toBe(false);
    }
  });
  it("stops waiting on cancellation even if a dependency ignores the signal", async () => {
    const stop = new AbortController(), deps = dependencies(), received = vi.fn(); deps.rich = { onSection: received };
    deps.writer.generateJson = async () => new Promise(() => {});
    const work = runRichAnswer(pack, "en", deps, stop.signal, "Explain care", {}); stop.abort();
    expect(await work).toMatchObject({ status: "incomplete" }); expect(received).not.toHaveBeenCalled();
    await expect(abortable(Promise.resolve(1), stop.signal)).rejects.toBeDefined();
  });
});

describe("stream integrity and history", () => {
  const event = (sequence: number, extra: object) => ({ request_id: "request-one", sequence, ...extra }) as RichEvent;
  it("keeps citations and source data together, rejects reordered or mismatched events", () => {
    const state = reduceRichEvent(emptyRichState(), event(1, { type: "section", section: sections[0] }));
    expect(state.sections[0].sources[0].id).toBe(state.sections[0].claims[0].refs[0]);
    expect(() => reduceRichEvent(state, event(1, { type: "section", section: sections[1] }))).toThrow();
    expect(() => reduceRichEvent(state, event(2, { type: "section", section: sections[2] }))).toThrow();
    expect(() => reduceRichEvent(state, { ...event(2, { type: "progress", stage: "searching" }), request_id: "other" })).toThrow();
    expect(() => reduceRichEvent(state, event(2, { type: "terminal", result: { status: "rich_answer", answer: richAnswer } }))).toThrow();
    expect(reduceRichEvent(state, event(2, { type: "withdraw" })).sections).toEqual([]);
  });
  it("decodes Arabic across single-byte chunks and refuses a truncated frame", async () => {
    const bytes = new TextEncoder().encode(`data: ${JSON.stringify(event(1, { type: "terminal", result: { status: "no_source", example: "العربية" } }))}\n\n`);
    const values: RichEvent[] = [];
    await consumeRichStream(new ReadableStream({ start(c) { for (const b of bytes) c.enqueue(Uint8Array.of(b)); c.close(); } }), e => values.push(e));
    expect(JSON.stringify(values)).toContain("العربية");
    await expect(consumeRichStream(new ReadableStream({ start(c) { c.enqueue(bytes.slice(0, -1)); c.close(); } }), () => {})).rejects.toThrow("truncated");
  });
  it("removes all Quran/hadith source text from all repeated section citations, then reloads trusted sources", async () => {
    const saved = stripAnswer(richAnswer);
    expect(JSON.stringify(saved)).not.toContain(pack.passages[0].source.kind === "quran" ? pack.passages[0].source.verse.arabic : "unexpected");
    for (const s of saved.sections) for (const source of s.sources) if (source.evidence.kind !== "scholar") expect(source.evidence.arabic).toBe("");
    const reopened = await hydrateAnswer(saved, { getVerse: async () => pack.passages[0].source.kind === "quran" ? pack.passages[0].source.verse : undefined, getHadith: async () => pack.passages[1].source.kind === "hadith" ? pack.passages[1].source.hadith : null });
    expect(reopened).toEqual({ ok: true, answer: richAnswer });
    expect(await hydrateAnswer(saved, { getVerse: async () => undefined, getHadith: async () => null })).toMatchObject({ ok: false });
    expect(validRichAnswer({ ...richAnswer, complete: false })).toBe(false);
    expect(validRichAnswer({ ...richAnswer, review: "bayan_reviewed" })).toBe(false);
  });
});
