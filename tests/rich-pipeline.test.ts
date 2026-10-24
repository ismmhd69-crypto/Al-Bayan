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
function requireHadithForCoverage(deps: ReturnType<typeof setup>) {
  const verify = deps.verifier.generateJson;
  deps.verifier.generateJson = async req => {
    const result = await verify(req) as Record<string, unknown>;
    if (req.system.startsWith("You select evidence")) for (const group of ["quran", "scholar"]) {
      for (const row of result[`${group}_assessments`] as Record<string, unknown>[]) Object.assign(row, {
        relevance: "partial", supported_requirement_ids: [], related_requirement_ids: ["R1"], distinct_contribution: "yes",
        contribution: { role: "background", scope: "general", conditions: [] },
      });
    }
    return result;
  };
}
describe("rich path through real framing, parallel retrieval and selection", () => {
  it("allocates bounded neighbour discovery after relevance ordering in the actual pipeline", async () => {
    const deps = setup(), base = pack.passages[0].source;
    if (base.kind !== "quran") throw Error("fixture");
    const keys = Array.from({ length: 16 }, (_, i) => `2:${i * 3 + 4}`);
    const verse = (key: string) => ({ ...structuredClone(base.verse), key, url: `https://quran.com/${key.replace(":", "/")}`, arabic: `نص اختباري مستقل للآية ${key}` });
    deps.search = async () => keys;
    deps.getVerse = vi.fn(async key => verse(key));
    deps.neighbours = vi.fn(async key => { const n = Number(key.split(":")[1]); return [verse(`2:${n - 1}`), verse(`2:${n + 1}`)]; });
    const ranked: string[][] = [], selected: string[][] = [];
    deps.meaningRankCandidates = async (_frame, candidates) => {
      ranked.push(candidates.map(c => c.id));
      return [...candidates].sort((a, b) => Number(b.id === "Q2:49") - Number(a.id === "Q2:49")).slice(0, 30);
    };
    deps.onCandidates = candidates => selected.push(candidates.map(c => c.id));
    await runPipeline("Explain care", "en", deps);
    expect(ranked[0]).not.toContain("Q2:50");
    expect(ranked[1]).toContain("Q2:50");
    expect(selected[0]).toContain("Q2:50");
    expect(deps.getVerse).toHaveBeenCalledWith("2:50");
    expect(deps.neighbours).toHaveBeenCalledWith("2:50");
  });

  it("reuses the seed ranking when discovery adds nothing", async () => {
    const deps = setup(); deps.neighbours = async () => [];
    deps.meaningRankCandidates = vi.fn(async (_frame, candidates) => candidates);
    await runPipeline("Explain care", "en", deps);
    expect(deps.meaningRankCandidates).toHaveBeenCalledOnce();
  });

  it("independently fetches and selects an adjacent original instead of borrowing its meaning through context", async () => {
    const deps = setup(), base = pack.passages[0].source;
    if (base.kind !== "quran") throw Error("fixture");
    const neighbor = { ...structuredClone(base.verse), key: "2:184", url: "https://quran.com/2/184", arabic: "هذا مثال مجاور مستقل يستخدم لاختبار مسار البحث وحده" };
    deps.getVerse = vi.fn(async key => key === "2:183" ? base.verse : key === "2:184" ? neighbor : undefined);
    deps.neighbours = vi.fn(async key => key === "2:183" ? [neighbor] : [base.verse]);
    const ranked: string[][] = [];
    deps.meaningRankCandidates = async (_frame, candidates) => { ranked.push(candidates.map(c => c.id)); return candidates; };
    const verify = deps.verifier.generateJson, write = deps.writer.generateJson;
    deps.verifier.generateJson = async req => {
      const result = await verify(req) as any;
      if (req.system.startsWith("You select evidence")) for (const r of result.quran_assessments) {
        if (r.source_id === "Q2:183") Object.assign(r, { relevance: "mention_only", supported_requirement_ids: [] });
      }
      return result;
    };
    deps.writer.generateJson = async req => {
      const result = structuredClone(await write(req)) as any;
      if (req.system.startsWith("You create a safe search plan")) return result;
      for (const group of ["quran", "summary"]) for (const claim of result[group] ?? []) claim.source_ids = claim.source_ids.map((id: string) => id === "Q2:183" ? "Q2:184" : id);
      return result;
    };
    const result = await runPipeline("Explain care", "en", deps);
    expect(ranked[0]).not.toContain("Q2:184");
    expect(ranked[1]).toContain("Q2:184");
    expect(deps.getVerse).toHaveBeenCalledWith("2:184");
    expect(deps.neighbours).toHaveBeenCalledWith("2:184");
    expect(result.status).toBe("rich_answer");
    if (result.status === "rich_answer") {
      const quran = result.answer.sections.find(s => s.group === "quran")!;
      expect(quran.sources.map(s => s.id)).toEqual(["Q2:184"]);
      expect(quran.sources[0].evidence.arabic).toBe(neighbor.arabic);
    }
  });

  it.each([false, true])("uses the explicit contribution plan in the real pipeline without filling a scholar quota (tiered %s)", async tiered => {
    const deps = setup(), verify = deps.verifier.generateJson, write = deps.writer.generateJson;
    deps.distinctSelection = true; if (!tiered) deps.tiered = undefined;
    let selections = 0;
    deps.verifier.generateJson = async req => {
      if (!req.system.startsWith("You select evidence")) return verify(req);
      selections++;
      expect(req.system).toContain("evidence_plan");
      expect(req.schema.type === "object" && req.schema.required).toContain("evidence_plan");
      const input = JSON.parse(req.prompt);
      const assess = (p: { source: { id: string } }) => ({ source_id: p.source.id, relevance: "partial", supported_requirement_ids: ["R1"],
        context_safe: "yes", position: "", contribution: { role: "direct", scope: "general", conditions: [] }, scope_matches_question: "yes", distinct_contribution: "yes", related_requirement_ids: [] });
      return { status: "ready", coverage: "complete", conflict_type: "none",
        ...(tiered ? Object.fromEntries(["quran", "hadith", "scholar"].map(g => [`${g}_assessments`, input[`${g}_candidates`].map(assess)])) : { assessments: input.candidates.map(assess) }),
        evidence_plan: [{ contribution: "The general principle", purpose: "answer", necessary: "yes", requirement_ids: ["R1"], source_ids: ["Q2:183"] },
          { contribution: "A complementary detail", purpose: "qualification", necessary: "yes", requirement_ids: ["R1"], source_ids: ["HE9001"] }] };
    };
    deps.writer.generateJson = async req => {
      if (req.system.startsWith("You create a safe search plan")) return write(req);
      const input = JSON.parse(req.prompt), result = await write(req) as Record<string, unknown>;
      if (input.sections_to_write.includes("summary")) {
        expect(input.evidence_package.passages.map((p: { id: string }) => p.id)).toEqual(["Q2:183", "HE9001"]);
        expect(input.evidence_package.contribution_plan).toMatchObject({ planning_only: true, cannot_establish_support: true });
      } else {
        const permitted = new Set(input.sections_to_write.flatMap((g: string) => input.citable_source_ids_by_section[g]));
        expect(input.evidence_package.passages.map((p: { id: string }) => p.id)).toEqual(["Q2:183", "HE9001"].filter(id => permitted.has(id)));
        expect(input.evidence_package).not.toHaveProperty("contribution_plan");
      }
      if (input.sections_to_write.includes("scholar")) result.scholar = [];
      if (input.sections_to_write.includes("summary")) result.summary = [{ ...drafts.summary[0], source_ids: ["Q2:183", "HE9001"] }];
      return result;
    };
    const result = await runPipeline("Explain care", "en", deps);
    expect(result.status).toBe("rich_answer"); expect(selections).toBe(1);
  });
  it("normalises a scholar-only label on a known hadith without another model call", async () => {
    const deps = setup(), verify = deps.verifier.generateJson;
    let selections = 0;
    deps.verifier.generateJson = async req => {
      const result = await verify(req) as Record<string, unknown>;
      if (req.system.startsWith("You select evidence")) {
        selections++;
        if (selections === 1) (result.hadith_assessments as { position: string }[])[0].position = "position-a";
      }
      return result;
    };
    expect((await runPipeline("Explain care", "en", deps)).status).toBe("rich_answer");
    expect(selections).toBe(1);
  });
  it("does not normalise an unknown source identity along with an irrelevant position", async () => {
    const deps = setup(), verify = deps.verifier.generateJson;
    let selections = 0;
    deps.verifier.generateJson = async req => {
      const result = await verify(req) as Record<string, unknown>;
      if (req.system.startsWith("You select evidence")) { selections++; Object.assign((result.hadith_assessments as object[])[0], { position: "position-a", source_id: "HE111111111" }); }
      return result;
    };
    expect((await runPipeline("Explain care", "en", deps)).status).toBe("incomplete");
    expect(selections).toBeLessThanOrEqual(2);
  });
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
    const diagnostics: string[] = []; deps.onDiagnostic = (_stage, code) => { diagnostics.push(code); };
    requireHadithForCoverage(deps);
    deps.searchHadith = async q => ++calls === 1 ? [] : h(q);
    deps.planEvidenceRecovery = vi.fn<RecoveryPlanner>(async () => [{ requirementId: "R1", family: "hadith", language: "ar", text: "صياغة مختلفة للبحث" }]);
    const result = await runPipeline("Explain care", "en", deps);
    expect(deps.planEvidenceRecovery).toHaveBeenCalledOnce(); expect(calls).toBe(2); expect(result.status, diagnostics.join(", ")).toBe("rich_answer");
  });
  it("withholds completion if checking newly recovered evidence fails", async () => {
    const deps = setup(), h = deps.searchHadith!; let searches = 0, selections = 0;
    requireHadithForCoverage(deps);
    const verify = deps.verifier.generateJson;
    deps.searchHadith = async q => ++searches === 1 ? [] : h(q);
    deps.planEvidenceRecovery = async () => [{ requirementId: "R1", family: "hadith", language: "ar", text: "صياغة مختلفة للبحث" }];
    deps.verifier.generateJson = async req => { if (req.system.startsWith("You select evidence") && ++selections > 1) throw new Error("checker unavailable"); return verify(req); };
    const result = await runPipeline("Explain care", "en", deps);
    expect(result.status).toBe("incomplete");
  });
  it("does not recover merely to fill an empty source family when direct coverage exists", async () => {
    const deps = setup(); deps.searchHadith = async () => [];
    deps.planEvidenceRecovery = vi.fn(async () => []);
    await runPipeline("Explain care", "en", deps);
    expect(deps.planEvidenceRecovery).not.toHaveBeenCalled();
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
  it("routes its existing unreadable-framing correction to the backup without a third attempt", async () => {
    const deps = setup(), write = deps.writer.generateJson;
    const flags: (boolean | undefined)[] = [];
    deps.writer.generateJson = async req => {
      if (req.system.startsWith("You create a safe search plan")) {
        expect(req.structuredOutput).toBe(true);
        flags.push(req.malformedResponseRetry);
        return flags.length === 1 ? null : frame;
      }
      return write(req);
    };
    expect((await runPipeline("Explain care", "en", deps)).status).toBe("rich_answer");
    expect(flags).toEqual([undefined, true]);
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
  it("does not spend its fallback selection retry to fill an empty optional source family", async () => {
    const deps = setup(), verify = deps.verifier.generateJson;
    deps.searchHadith = vi.fn(async () => []);
    const write = deps.writer.generateJson;
    deps.writer.generateJson = async req => {
      const result = structuredClone(await write(req)) as any;
      if (result.summary) result.summary[0].source_ids = ["Q2:183"];
      return result;
    };
    let selections = 0;
    deps.verifier.generateJson = async req => {
      if (req.system.startsWith("You select evidence")) selections++;
      return verify(req);
    };
    const result = await runPipeline("Explain care", "en", deps);
    expect(result.status).toBe("rich_answer");
    expect(deps.searchHadith).toHaveBeenCalledTimes(1);
    expect(selections).toBe(1);
  });
  it("recovers missing hadith once when its requested contribution is not covered by the other sources", async () => {
    const deps = setup(), original = deps.searchHadith!;
    requireHadithForCoverage(deps);
    let searches = 0;
    deps.searchHadith = async q => ++searches === 1 ? [] : original(q);
    const result = await runPipeline("Explain care in daily life", "en", deps);
    expect(searches).toBe(2);
    expect(result.status).toBe("rich_answer");
    if (result.status === "rich_answer") expect(result.answer.sections[1].outcome).toBe("ready");
  });
  it("does not invoke live scholar recovery merely because Quran and hadith already cover the concern", async () => {
    const deps = setup();
    deps.searchScholars = async () => [];
    const writer = deps.writer.generateJson;
    deps.writer.generateJson = async req => {
      const output = structuredClone(await writer(req)) as any;
      if (output.summary) output.summary[0].source_ids = ["Q2:183", "HE9001"];
      return output;
    };
    deps.searchScholarsLive = vi.fn(async () => pack.passages[2].source.kind === "scholar" ? [pack.passages[2].source.quote] : []);
    const result = await runPipeline("Explain care in daily life", "en", deps);
    expect(deps.searchScholarsLive).not.toHaveBeenCalled();
    expect(result.status).toBe("rich_answer");
    if (result.status === "rich_answer") expect(result.answer.sections[2].outcome).toBe("no_direct_evidence");
  });
  it("does not repeat a source search merely to fill an optional group", async () => {
    const deps = setup(), write = deps.writer.generateJson;
    deps.searchHadith = vi.fn(async () => []);
    deps.writer.generateJson = async req => req.system.startsWith("You write short explanations") ? {
      ...await write(req) as object, hadith: [], summary: [{ ...drafts.summary[0], source_ids: ["Q2:183"] }],
    } : write(req);
    const result = await runPipeline("Explain care in daily life", "en", deps);
    expect(deps.searchHadith).toHaveBeenCalledTimes(1);
    expect(result.status).toBe("rich_answer");
    if (result.status === "rich_answer") expect(result.answer.sections[1].outcome).toBe("no_direct_evidence");
  });

  it("reports a failed recovery as a failed search rather than claiming no direct evidence", async () => {
    const deps = setup(), write = deps.writer.generateJson;
    requireHadithForCoverage(deps);
    let calls = 0;
    deps.searchHadith = async () => { if (++calls === 1) return []; throw new Error("source down"); };
    deps.writer.generateJson = async req => req.system.startsWith("You write short explanations") ? {
      ...await write(req) as object, hadith: [], summary: [{ ...drafts.summary[0], source_ids: ["Q2:183"] }],
    } : write(req);
    const result = await runPipeline("Explain care in daily life", "en", deps);
    expect(calls).toBe(2);
    expect(result.status).toBe("incomplete");
    if (result.status === "incomplete") expect(result.sections?.[1].outcome).toBe("search_failed");
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
