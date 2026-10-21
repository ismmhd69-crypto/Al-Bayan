import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { runPipeline } from "@/lib/ask/core";
import { audit, dependencies, drafts, pack } from "./fixtures/rich";
import { APPROVED_CHANNELS } from "@/lib/sources/youtube-channels";
import recordedFrames from "./fixtures/ask-frame-punctuation.json";
import type { RecoveryPlanner } from "@/lib/ask/search-engine/recovery";

const frame = {
  checklist_status: "complete",
  language: "en", kind: "question", question_type: "general", subjects: ["care"],
  requested_points: [{ text: "Explain care", facet: "general", essential_conditions: [], interpretation_id: "", search_queries: { en: ["care responsibility"], de: [], ar: ["عناية يومية"] }, quran_ar: ["عناية يومية"], hadith_ar: ["عناية يومية"] }],
  qualifiers: [], search_queries_en: ["care responsibility"], search_queries_de: [], search_queries_ar: ["عناية يومية"],
  search_queries_quran_ar: ["عناية يومية"], search_queries_hadith_ar: ["عناية يومية"], interpretations: [], clarification_needed: false,
};
function setup() {
  const deps = dependencies(), write = deps.writer.generateJson;
  deps.libraryFlow = true; deps.tiered = { videoBudgetMs: 0, maxVideos: 0 };
  deps.writer.generateJson = async req => req.system.startsWith("You create a safe search plan") ? frame : write(req);
  deps.verifier.generateJson = async req => {
    if (!req.system.startsWith("You select evidence")) return audit(req.prompt);
    const prompt = JSON.parse(req.prompt);
    return { status: "ready", coverage: "complete", conflict_type: "none", ...Object.fromEntries(["quran", "hadith", "scholar"].map(group => [`${group}_assessments`, prompt[`${group}_candidates`].map((p: { source: { id: string } }) => ({ source_id: p.source.id, relevance: "direct", supported_requirement_ids: ["R1"], context_safe: "yes", position: "", contribution: { role: "direct", scope: "general", conditions: [] }, scope_matches_question: "yes" }))])) };
  };
  deps.search = async () => ["2:183"];
  deps.getVerse = async () => pack.passages[0].source.kind === "quran" ? pack.passages[0].source.verse : undefined;
  deps.searchHadith = async () => pack.passages[1].source.kind === "hadith" ? [pack.passages[1].source.hadith] : [];
  deps.searchScholars = async () => pack.passages[2].source.kind === "scholar" ? [pack.passages[2].source.quote] : [];
  return deps;
}
describe("rich path through real framing, parallel retrieval and selection", () => {
  it.each([false, true])("excludes a Quran candidate after context failure while preserving other sources (meaning ranking %s)", async meaning => {
    const deps = setup();
    deps.neighbours = vi.fn(async () => { throw new DOMException("Provider request timed out", "TimeoutError"); });
    const ranked: string[][] = [];
    if (meaning) deps.meaningRankCandidates = async (_frame, candidates) => {
      ranked.push(candidates.map(c => c.id)); return candidates;
    };
    const selected: string[][] = [];
    deps.onCandidates = candidates => selected.push(candidates.map(c => c.id));
    const result = await runPipeline("Explain care", "en", deps);
    expect(selected[0]).not.toContain("Q2:183");
    expect(selected[0]).toContain(pack.passages[1].id);
    expect(selected[0]).toContain(pack.passages[2].id);
    if (meaning) expect(ranked[0]).not.toContain("Q2:183");
    expect(result.status).not.toBe("error");
    expect(deps.neighbours).toHaveBeenCalledTimes(1);
  });
  it("still honours cancellation during context lookup", async () => {
    const deps = setup(), controller = new AbortController();
    deps.abortSignal = controller.signal;
    deps.neighbours = async () => { controller.abort(); throw new Error("disconnected"); };
    await expect(runPipeline("Explain care", "en", deps)).rejects.toMatchObject({ name: "AbortError" });
  });
  it("uses corpus-sourced hadith when the old keyword route finds none", async () => {
    const deps = setup(), source = pack.passages.find(p => p.source.kind === "hadith")!;
    deps.searchHadith = async () => [];
    deps.retrieveCorpusCandidates = vi.fn(async () => [{ id: source.id, source: source.source, context: [], retrievedFor: ["R1"], contextAvailability: "complete_parent" as const }]);
    const result = await runPipeline("Explain care", "en", deps);
    expect(deps.retrieveCorpusCandidates).toHaveBeenCalledOnce(); expect(result.status).toBe("rich_answer");
    if (result.status === "rich_answer") expect(result.answer.sections[1].outcome).toBe("ready");
  });
  it("does not re-enable an explicitly disabled source family through corpus search", async () => {
    const deps = setup(), source = pack.passages.find(p => p.source.kind === "hadith")!;
    deps.sourceAvailability = { hadith: false, scholar: true }; deps.searchHadith = async () => [];
    deps.retrieveCorpusCandidates = async () => [{ id: source.id, source: source.source, context: [], retrievedFor: ["R1"] }];
    let received: string[] = []; deps.onRetrieved = r => { received = r.hadith; };
    await runPipeline("Explain care", "en", deps);
    expect(received).toEqual([]);
  });
  it("uses a new gap-specific search phrase and rechecks recovered evidence", async () => {
    const deps = setup(), h = deps.searchHadith!; let calls = 0;
    deps.searchHadith = async q => ++calls === 1 ? [] : h(q);
    deps.planEvidenceRecovery = vi.fn<RecoveryPlanner>(async () => [{ requirementId: "R1", family: "hadith", language: "ar", text: "صياغة مختلفة للبحث" }]);
    const result = await runPipeline("Explain care", "en", deps);
    expect(deps.planEvidenceRecovery).toHaveBeenCalledOnce(); expect(calls).toBe(2); expect(result.status).toBe("rich_answer");
  });
  it("withholds completion if checking newly recovered evidence fails", async () => {
    const deps = setup(), h = deps.searchHadith!, verify = deps.verifier.generateJson; let searches = 0, selections = 0;
    deps.searchHadith = async q => ++searches === 1 ? [] : h(q);
    deps.planEvidenceRecovery = async () => [{ requirementId: "R1", family: "hadith", language: "ar", text: "صياغة مختلفة للبحث" }];
    deps.verifier.generateJson = async req => { if (req.system.startsWith("You select evidence") && ++selections > 1) throw new Error("checker unavailable"); return verify(req); };
    const result = await runPipeline("Explain care", "en", deps);
    expect(result.status).toBe("incomplete");
  });
  it("offers all retrieved candidates to meaning ranking before the small lexical caps", async () => {
    const deps = setup(), h = (await deps.searchHadith!({}))[0];
    deps.searchHadith = async () => Array.from({ length: 8 }, (_, i) => ({ ...h, id: `HE${9001 + i}` }));
    deps.meaningRankCandidates = vi.fn(async (_frame, candidates) => candidates);
    const selected: string[][] = []; deps.onCandidates = candidates => selected.push(candidates.map(c => c.id));
    await runPipeline("Explain care in daily life", "en", deps);
    expect(deps.meaningRankCandidates).toHaveBeenCalled();
    expect(selected[0].filter(id => id.startsWith("HE"))).toHaveLength(8);
  });
  it("does not silently fall back to word ranking after a semantic ranking failure", async () => {
    const deps = setup(); deps.meaningRankCandidates = async () => { throw new Error("ranking unavailable"); };
    await expect(runPipeline("Explain care", "en", deps)).rejects.toThrow("ranking unavailable");
  });
  it.each(recordedFrames)("accepts the recorded question-form checklist without a framing retry", async recorded => {
    const deps = setup(), write = deps.writer.generateJson;
    let framingCalls = 0;
    deps.writer.generateJson = async req => {
      if (req.system.startsWith("You create a safe search plan")) { framingCalls++; return recorded; }
      return write(req);
    };
    deps.search = vi.fn(deps.search);
    const result = await runPipeline("Why do we worship Allah if He does not need anything from us?", "en", deps);
    expect(framingCalls).toBe(1);
    expect(deps.search).toHaveBeenCalled();
    expect(result.status).toBe("rich_answer");
  });
  it("reports malformed internal framing as an error without claiming sources were searched", async () => {
    const deps = setup(); deps.writer.generateJson = vi.fn(async () => ({ malformed: true }));
    deps.search = vi.fn(deps.search); deps.searchHadith = vi.fn(deps.searchHadith!);
    expect(await runPipeline("Explain care", "en", deps)).toEqual({ status: "error", language: "en" });
    expect(deps.writer.generateJson).toHaveBeenCalledTimes(2);
    expect(deps.search).not.toHaveBeenCalled(); expect(deps.searchHadith).not.toHaveBeenCalled();
  });
  it("waits for combined evidence, then streams checked explanations for all selected groups", async () => {
    const deps = setup(), seen: string[] = []; let release!: () => void;
    const gate = new Promise<void>(r => release = r); const h = deps.searchHadith!, s = deps.searchScholars!;
    deps.searchHadith = async q => { seen.push("hadith search"); await gate; return h(q); };
    deps.searchScholars = async q => { seen.push("scholar search"); release(); return s(q); };
    deps.rich = { onSection: section => seen.push(section.group) };
    const result = await runPipeline("Explain care in daily life", "en", deps);
    expect(result.status).toBe("rich_answer");
    expect(seen).toEqual(["hadith search", "scholar search", "quran", "hadith", "scholar", "summary"]);
  });
  it("continues with checked hadith and scholarly evidence when Quran search fails, without hiding the failure", async () => {
    const deps = setup(), write = deps.writer.generateJson;
    deps.search = async () => { throw new Error("source down"); };
    deps.writer.generateJson = async req => req.system.startsWith("You write short explanations") ? { ...await write(req) as object, summary: [{ ...drafts.summary[0], source_ids: ["HE9001"] }] } : write(req);
    const result = await runPipeline("Explain care in daily life", "en", deps);
    expect(result.status).toBe("rich_answer");
    if (result.status === "rich_answer") expect(result.answer.sections[0].outcome).toBe("search_failed");
  });
  it("distinguishes empty results, failed searches and unavailable sources when no answer can be written", async () => {
    const deps = setup(); deps.search = async () => []; deps.searchHadith = async () => { throw new Error("down"); }; delete deps.searchScholars;
    const result = await runPipeline("Explain care in daily life", "en", deps);
    expect(result.status).toBe("incomplete");
    if (result.status === "incomplete") expect(result.sections?.map(s => s.outcome)).toEqual(["no_direct_evidence", "search_failed", "unavailable"]);
  });
  it("does not hide a partial source outage behind a successful section", async () => {
    const deps = setup(); deps.sourceProblems = { scholar: "search_failed" };
    const result = await runPipeline("Explain care in daily life", "en", deps);
    expect(result.status).toBe("rich_answer");
    if (result.status === "rich_answer") expect(result.answer.sections[2]).toMatchObject({ outcome: "ready", searchOutcome: "search_failed" });
  });
  it("recovers missing hadith once even when the scholar already covers the point", async () => {
    const deps = setup(), original = deps.searchHadith!;
    let searches = 0;
    deps.searchHadith = async q => ++searches === 1 ? [] : original(q);
    const result = await runPipeline("Explain care in daily life", "en", deps);
    expect(searches).toBe(2);
    expect(result.status).toBe("rich_answer");
    if (result.status === "rich_answer") expect(result.answer.sections[1].outcome).toBe("ready");
  });
  it("tries the approved live scholar recovery when only Quran and hadith were selected", async () => {
    const deps = setup();
    deps.searchScholars = async () => [];
    deps.searchScholarsLive = vi.fn(async () => pack.passages[2].source.kind === "scholar" ? [pack.passages[2].source.quote] : []);
    const result = await runPipeline("Explain care in daily life", "en", deps);
    expect(deps.searchScholarsLive).toHaveBeenCalledOnce();
    expect(result.status).toBe("rich_answer");
    if (result.status === "rich_answer") expect(result.answer.sections[2].outcome).toBe("ready");
  });
  it("does not force evidence into a source group after one unsuccessful recovery", async () => {
    const deps = setup(), write = deps.writer.generateJson;
    deps.searchHadith = vi.fn(async () => []);
    deps.writer.generateJson = async req => req.system.startsWith("You write short explanations") ? {
      ...await write(req) as object, hadith: [], summary: [{ ...drafts.summary[0], source_ids: ["Q2:183"] }],
    } : write(req);
    const result = await runPipeline("Explain care in daily life", "en", deps);
    expect(deps.searchHadith).toHaveBeenCalledTimes(2);
    expect(result.status).toBe("rich_answer");
    if (result.status === "rich_answer") expect(result.answer.sections[1].outcome).toBe("no_direct_evidence");
  });

  it("reports a failed recovery as a failed search rather than claiming no direct evidence", async () => {
    const deps = setup(), write = deps.writer.generateJson;
    let calls = 0;
    deps.searchHadith = async () => { if (++calls === 1) return []; throw new Error("source down"); };
    deps.writer.generateJson = async req => req.system.startsWith("You write short explanations") ? {
      ...await write(req) as object, hadith: [], summary: [{ ...drafts.summary[0], source_ids: ["Q2:183"] }],
    } : write(req);
    const result = await runPipeline("Explain care in daily life", "en", deps);
    expect(calls).toBe(2);
    expect(result.status).toBe("rich_answer");
    if (result.status === "rich_answer") expect(result.answer.sections[1].outcome).toBe("search_failed");
  });

});


describe("optional rich learning clips", () => {
  const clip = { youtubeId: "abcdefghijk", channelId: APPROVED_CHANNELS[0].channelId, title: "An invented learning clip", language: "en" as const, minutes: 3 };
  it("keeps retrieval off without the independent opt-in", async () => {
    const deps = setup(); deps.searchVideos = vi.fn(async () => [clip]);
    expect((await runPipeline("Explain care", "en", deps)).status).toBe("rich_answer");
    expect(deps.searchVideos).not.toHaveBeenCalled();
  });
  it("streams every written section before optional title checking, then attaches at most two learning clips", async () => {
    const deps = setup(), check = deps.verifier.generateJson, delivered: string[] = [];
    deps.richVideos = true; deps.searchVideos = async () => [clip];
    deps.rich = { onSection: s => { delivered.push(s.group); } };
    deps.verifier.generateJson = async req => {
      if (req.system.startsWith("You check optional video titles")) {
        expect(delivered).toEqual(["quran", "hadith", "scholar", "summary"]);
        expect(req.prompt).not.toContain("source_ids");
        return { verdicts: ["yes"] };
      }
      expect(req.prompt).not.toContain(clip.title);
      return check(req);
    };
    const result = await runPipeline("Explain care", "en", deps);
    expect(result.status).toBe("rich_answer");
    if (result.status === "rich_answer") expect(result.answer.videos).toEqual({ version: 1, basis: "title_only", items: [clip] });
  });
  it("keeps a complete answer when optional video search fails", async () => {
    const deps = setup(); deps.richVideos = true; deps.searchVideos = async () => { throw new Error("video outage"); };
    const result = await runPipeline("Explain care", "en", deps);
    expect(result.status).toBe("rich_answer");
    if (result.status === "rich_answer") expect(result.answer.videos).toBeUndefined();
  });
});
