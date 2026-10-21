// Invented text and vectors test implementation only, never religious accuracy.
import { describe, expect, it, vi } from "vitest";
import { hybridSearch, rerankByMeaning, searchTokens, type SearchConcern, type MeaningReranker } from "@/lib/ask/search-engine/hybrid";
import type { AIProvider } from "@/lib/ai/types";
import { evidenceContextProblem, passageProblem, textHash, validateIndex, type SearchIndex, type SearchPassage, type SearchFamily } from "@/lib/ask/search-engine/contract";
import { inventorySummary } from "@/lib/ask/search-engine/inventory";
import { retrievalBenchmark, type BenchmarkIntent } from "@/lib/ask/search-engine/benchmark";
import { modelMeaningReranker } from "@/lib/ask/search-engine/reranker";
import { readBayanRightsMetadata } from "../scripts/bayan-rights-metadata";
import { prepareBenchmark } from "../scripts/prepare-ask-search-benchmark";
import { pipelineMeaningRanker } from "@/lib/ask/search-engine/pipeline-ranking";
import { uniqueResearchCandidates } from "@/lib/ask/search-engine/candidate-identity";
import { retrieveFromCorpus } from "@/lib/ask/search-engine/corpus-retrieval";
import { pack } from "./fixtures/rich";
import type { PassageForSelection, QuestionFrame } from "@/lib/ask/retrieval";

const now = new Date("2026-10-20T10:00:00Z"), space = { model: "invented-fixture", revision: "1", dimensions: 3 };
function passage(id: string, family: SearchFamily = "scholar", original = "Invented teaching about careful work.", values = [1, 0, 0]): SearchPassage {
  return { id, sourceId: `source-${id}`, parentId: `parent-${id}`, family, language: "ar", original, originalHash: textHash(original), originalVerified: true,
    title: "Invented fixture", reference: `REF ${id}`, canonicalUrl: `https://example.org/${id}`, span: { start: 5, end: 5 + original.length },
    context: { before: "An invented question.", after: "An invented qualification.", complete: true },
    permissions: { published: true, search: true, ai: true, embeddings: true, record: "fixture-only", verifiedAt: "2026-10-01T00:00:00Z", expiresAt: null, revoked: false },
    attribution: { scholarId: "fixture-scholar", grade: "sahih", grader: "fixture-grader", collection: "fixture", numbering: "fixture-edition" },
    vector: { space, values, textHash: textHash(original) } };
}
const index = (...passages: SearchPassage[]): SearchIndex => ({ version: 1, generation: "fixture-1", space, passages });
const concern: SearchConcern = { id: "R1", text: "Why do careful tasks matter?", phrases: ["careful tasks"], exactReferences: [], vector: { space, values: [1, 0, 0] } };
const run = (...passages: SearchPassage[]) => hybridSearch(index(...passages), concern, { now });

describe("hybrid search provenance and source eligibility", () => {
  it("finds meaning-only material without relying on shared words", () => {
    const semantic = passage("semantic", "hadith", "تفاصيل النص التجريبي", [1, 0, 0]);
    const lexical = passage("lexical", "scholar", "Careful tasks", [0, 1, 0]);
    const result = run(semantic, lexical);
    expect(result.hits.find(h => h.passage.id === "semantic")?.methods).toEqual(["semantic"]);
    expect(result.hits.find(h => h.passage.id === "lexical")?.methods).toContain("lexical");
    expect(result.audit.semantic).toBe("available");
    expect(result.hits[0].passage.original).toBeDefined();
  });
  it("does not claim semantic retrieval when query embeddings are absent", () => {
    const result = hybridSearch(index(passage("a")), { ...concern, vector: undefined }, { now });
    expect(result.audit.semantic).toBe("query_vector_missing");
    expect(result.hits.flatMap(h => h.methods)).not.toContain("semantic");
  });
  it("retains exact-reference results even with no overlapping question words", () => {
    const p = passage("a", "quran", "النص التجريبي");
    const result = hybridSearch(index(p), { ...concern, vector: undefined, exactReferences: [p.reference] }, { now });
    expect(result.hits[0].methods).toEqual(["exact"]);
  });
  it("does not let one source family consume the candidate pool", () => {
    const quran = Array.from({ length: 40 }, (_, i) => passage(`q${i}`, "quran"));
    const result = hybridSearch(index(...quran, passage("hadith", "hadith")), concern, { now, limit: 2 });
    expect(new Set(result.hits.map(h => h.passage.family))).toEqual(new Set(["quran", "hadith"]));
    expect(result.audit.truncated).toBeGreaterThan(0);
  });
  it.each(["unpublished", "revoked", "expired", "false_as_string", "tampered", "malformed_context", "unknown_grade", "unknown_scholar"])("filters %s before result limits", scenario => {
    const p = passage("invalid", scenario === "unknown_grade" ? "hadith" : "scholar");
    if (scenario === "unpublished") p.permissions.published = false;
    if (scenario === "revoked") p.permissions.revoked = true;
    if (scenario === "expired") p.permissions.expiresAt = "2026-10-19T00:00:00Z";
    if (scenario === "false_as_string") p.permissions.ai = "false" as unknown as boolean;
    if (scenario === "tampered") p.original += " extra";
    if (scenario === "malformed_context") p.context.before = undefined as unknown as string;
    if (scenario === "unknown_grade") delete p.attribution.grade;
    if (scenario === "unknown_scholar") delete p.attribution.scholarId;
    const result = run(p, passage("valid"));
    expect(result.hits.map(h => h.passage.id)).toEqual(["valid"]);
    expect(Object.values(result.audit.excluded)).toEqual([1]);
  });
  it("keeps a limited excerpt searchable without claiming its context is complete", () => {
    const p = passage("partial"); p.context.complete = false;
    expect(run(p).hits).toHaveLength(1);
    expect(evidenceContextProblem(p)).toBe("context_incomplete");
  });
  it("requires explicit embedding permission even for a lexically eligible source", () => {
    const p = passage("a"); p.permissions.embeddings = false;
    const result = run(p);
    expect(result.hits[0].methods).toEqual(["lexical"]);
    expect(passageProblem(p, now, true)).toBe("embedding_permission_missing");
  });
  it("fails on vectors from another space or a changed original", () => {
    const p = passage("a"); p.vector!.textHash = textHash("different text");
    expect(() => run(p)).toThrow("index_vector_mismatch");
    expect(() => hybridSearch(index(), { ...concern, vector: { space: { ...space, revision: "2" }, values: [1, 0, 0] } })).toThrow("query_vector_mismatch");
  });
  it("rejects invalid vectors and duplicate passage identities", () => {
    const p = passage("a"); p.vector!.values = [0, 0, 0];
    expect(() => validateIndex(index(p))).toThrow("index_vector_mismatch");
    expect(() => validateIndex(index(passage("a"), passage("a")))).toThrow("duplicate_passage_identity");
  });
  it("normalises Arabic lookup text while preserving the original", () => {
    const p = passage("a", "hadith", "إِلَى الْهُدَى"); const original = p.original;
    expect(searchTokens(p.original)).toEqual(["الي", "الهدي"]);
    hybridSearch(index(p), { ...concern, phrases: ["الى الهدى"], vector: undefined }, { now });
    expect(p.original).toBe(original);
  });
  it("does not discover evidence through formatting tag names or attribute numbers",()=>{
    const original='نص تجريبي [quran sura="27" aya_start="80" aya_end="80"]{ آية تجريبية للاختبار }';
    const p=passage("markup","hadith",original);
    expect(searchTokens(original)).not.toContain("quran");
    expect(searchTokens(original)).not.toContain("sura");
    expect(searchTokens(original)).not.toContain("27");
    expect(searchTokens(original)).toContain("اية");
    const result=hybridSearch(index(p),{...concern,phrases:["quran sura"],vector:undefined},{now});
    expect(result.hits).toEqual([]);
    expect(p.original).toBe(original);
  });
});

describe("semantic ranking validation", () => {
  it("loads one generation and batches query vectors for distinct question concerns", async () => {
    const load = vi.fn(async () => index(passage("care", "hadith", "الرواية التجريبية", [1, 0, 0]), passage("other", "scholar", "شرح تجريبي آخر", [0, 1, 0])));
    const embedQueries = vi.fn(async () => [[1, 0, 0], [0, 1, 0]]);
    const q: QuestionFrame = { ...pack.question, kind: "question", searchQueries: {}, requirements: [{ id: "R1", text: "Careful work", facet: "reason" }, { id: "R2", text: "Another concern", facet: "conditions" }] };
    const result = await retrieveFromCorpus(q, load, { signal: new AbortController().signal, embedder: { space, embedQueries }, limit: 2 });
    expect(load).toHaveBeenCalledOnce(); expect(embedQueries).toHaveBeenCalledWith(["Careful work", "Another concern"], expect.any(AbortSignal));
    expect(result.semantic).toBe("used"); expect(result.unrepresentedConcernIds).toEqual([]);
    expect(result.generation).toBe("fixture-1");
  });
  it("does not call an embedding service for a lexical-only generation", async () => {
    const p = passage("a"); delete p.vector;
    const embedQueries = vi.fn(async () => [[1, 0, 0]]);
    const q: QuestionFrame = { ...pack.question, kind: "question", searchQueries: {} };
    const result = await retrieveFromCorpus(q, async () => index(p), { signal: new AbortController().signal, embedder: { space, embedQueries } });
    expect(embedQueries).not.toHaveBeenCalled(); expect(result.semantic).toBe("no_indexed_vectors");
  });
  it("ranks actual pipeline candidates for every concern while preserving source families", async () => {
    const input: PassageForSelection[] = pack.passages.map(p => ({ id: p.id, source: p.source, context: [] }));
    const reranker = vi.fn<MeaningReranker>(async (_concern, rows) => rows.map((p, i) => ({ id: p.id, score: 100 - i })));
    const frame: QuestionFrame = { ...pack.question, kind: "question", searchQueries: {}, requirements: [...pack.question.requirements, { ...pack.question.requirements[0], id: "R2", text: "Another concern" }] };
    const output = await pipelineMeaningRanker(reranker)(frame, input, new AbortController().signal);
    expect(reranker).toHaveBeenCalledTimes(2);
    expect(output.map(p => p.source.kind)).toEqual(["quran", "hadith", "scholar"]);
    expect(output.every(p => input.includes(p))).toBe(true);
  });
  it("merges the same fatwa from differently spelt presentation URLs without merging different excerpts", () => {
    const base = pack.passages.find(p => p.source.kind === "scholar")!;
    if (base.source.kind !== "scholar") throw new Error("missing fixture");
    const first: PassageForSelection = { id: base.id, source: { kind: "scholar", quote: { ...base.source.quote, url: "https://binbaz.org.sa/fatwas/16567/قول" } }, context: [], retrievedFor: ["R1"] };
    const repeated: PassageForSelection = { ...first, id: "Sdifferent", source: { kind: "scholar", quote: { ...base.source.quote, url: "https://binbaz.org.sa/fatwas/16567/%D9%82%D9%88%D9%84-%D8%A2%D8%AE%D8%B1" } }, retrievedFor: ["R2"] };
    const different: PassageForSelection = { ...repeated, id: "Sother", source: { kind: "scholar", quote: { ...base.source.quote, arabic: `${base.source.quote.arabic} قيد مختلف` } } };
    const result = uniqueResearchCandidates([first, repeated, different]);
    expect(result).toHaveLength(2); expect(result[0].retrievedFor).toEqual(["R1", "R2"]);
    expect(first.retrievedFor).toEqual(["R1"]);
  });
  it("passes the concern and contextual original to the reranker without approving evidence", async () => {
    const hits = run(passage("a"), passage("b")).hits;
    const reranker = vi.fn<MeaningReranker>(async () => [{ id: "a", score: 10 }, { id: "b", score: 90 }]);
    const result = await rerankByMeaning(concern, hits, reranker, new AbortController().signal, 1);
    expect(result.map(h => h.passage.id)).toEqual(["b"]);
    expect(reranker.mock.calls[0][1][0]).toMatchObject({ before: "An invented question.", after: "An invented qualification." });
    expect(result[0]).not.toHaveProperty("approved");
  });
  it.each(["missing", "duplicate", "unknown", "nonfinite"])("refuses %s reranker results", async scenario => {
    const hits = run(passage("a"), passage("b")).hits;
    const scores = scenario === "missing" ? [{ id: "a", score: 10 }] : scenario === "duplicate" ? [{ id: "a", score: 10 }, { id: "a", score: 9 }] : scenario === "unknown" ? [{ id: "a", score: 10 }, { id: "unknown", score: 9 }] : [{ id: "a", score: 10 }, { id: "b", score: NaN }];
    await expect(rerankByMeaning(concern, hits, async () => scores, new AbortController().signal)).rejects.toThrow("invalid_reranker_result");
  });
  it("does not invoke a model after Stop", async () => {
    const controller = new AbortController(); controller.abort(); const reranker = vi.fn();
    await expect(rerankByMeaning(concern, run(passage("a")).hits, reranker, controller.signal)).rejects.toThrow();
    expect(reranker).not.toHaveBeenCalled();
  });
  it("rejects malformed model scores and labels passage content as untrusted", async () => {
    const provider = { id: "fixture", generateJson: vi.fn<AIProvider["generateJson"]>(async () => ({ rankings: [{ id: "a", score: 101 }] })) };
    await expect(modelMeaningReranker(provider)({ id: "R1", text: "Question" }, [], new AbortController().signal)).rejects.toThrow("invalid_reranker_score");
    expect(provider.generateJson.mock.calls[0][0].system).toContain("untrusted data");
  });
});

describe("inventory and review denominators", () => {
  it("keeps unreadable rights unknown and identifies unpublished indexed records", () => {
    const sources = [true, false].map((published, i) => ({ id: String(i), kind: "fatwa", language: "ar", published, rights_id: "r", grade: null, grader: null, scholar_id: "fixture" }));
    const report = inventorySummary(sources, sources.map(s => ({ source_id: s.id, lang: "ar", approved: true })), null, now);
    expect(report.groups.fatwa.eligibility).toEqual({ allowed: 0, excluded: 1, unknown: 1 });
    expect(report.groups.fatwa.withApprovedIndex).toBe(2);
  });
  it("keeps draft questions out of accuracy figures", () => {
    const cases = prepareBenchmark(); expect(cases).toHaveLength(100);
    const report = retrievalBenchmark(cases, []);
    expect(report.recall).toBeNull(); expect(report.incompleteEvaluation).toBe(true); expect(report.reviewedIntents).toBe(0);
  });
  it("measures alternative supporting passages and reports missing languages separately", () => {
    const c: BenchmarkIntent = { id: "intent", split: "held_out", category: "fixture", questions: { en: "Question", ar: "سؤال", de: "Frage" }, concerns: ["Concern"], corpusAnswerability: "yes",
      sourceReview: { status: "accepted", reviewer: "fixture-only", at: now.toISOString(), indexGeneration: "fixture-1" }, evidenceUnits: [{ id: "E1", acceptablePassageIds: ["a", "b"], essentialQualification: "Preserve the condition" }, { id: "E2", acceptablePassageIds: ["c"], essentialQualification: null }] };
    const report = retrievalBenchmark([c], [{ intentId: c.id, language: "en", indexGeneration: "fixture-1", rankedPassageIds: ["b"] }]);
    expect(report.recall).toBe(0.5); expect(report.incompleteEvaluation).toBe(true);
    expect(report.rows.filter(r => r.status === "not_run")).toHaveLength(2);
    expect(retrievalBenchmark([c], [{ intentId: c.id, language: "en", indexGeneration: "obsolete", rankedPassageIds: ["b"] }]).recall).toBeNull();
  });
  it("uses only the fixed Bayan read-only management endpoint without leaking credentials", async () => {
    const request = vi.fn<typeof fetch>(async () => new Response(JSON.stringify([]), { status: 201 }));
    expect(await readBayanRightsMetadata("fixture-token", request)).toEqual([]);
    expect(request.mock.calls[0][0]).toBe("https://api.supabase.com/v1/projects/jnietkyxgnocyizvjiel/database/query/read-only");
    expect(JSON.parse(request.mock.calls[0][1]!.body as string).query).toMatch(/^select .* from editorial\.source_rights order by owner$/);
  });
});
