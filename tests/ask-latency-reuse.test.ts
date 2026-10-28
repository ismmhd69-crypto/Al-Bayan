import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { modelMeaningReranker } from "@/lib/ask/search-engine/reranker";
import { pipelineMeaningRanker } from "@/lib/ask/search-engine/pipeline-ranking";
import { runRichAnswer } from "@/lib/ask/rich-engine";
import { pack, dependencies, audit } from "./fixtures/rich";

it("retains the same fair evidence ordering for frozen multi-concern scores using one model request", async () => {
  const frame = { ...pack.question, requirements: [...pack.question.requirements, { ...pack.question.requirements[0], id: "R2", text: "Explain qualifications" }], kind: "question" as const, searchQueries: {} };
  const candidates = pack.passages.map(p => ({ id: p.id, source: p.source, context: p.context }));
  const scores: Record<string, number[]> = { R1: [90, 50, 10], R2: [10, 80, 95] };
  const sequential = vi.fn(async (concern: { id: string }) => candidates.map((p, i) => ({ id: p.id, score: scores[concern.id][i] })));
  const provider = { id: "fixture", generateJson: vi.fn(async () => ({ R1: { scores: scores.R1 }, R2: { scores: scores.R2 } })) };
  const signal = new AbortController().signal;
  const old = await pipelineMeaningRanker(sequential)(frame, candidates, signal);
  const batched = await pipelineMeaningRanker(modelMeaningReranker(provider))(frame, candidates, signal);
  expect(batched).toEqual(old); expect(sequential).toHaveBeenCalledTimes(2); expect(provider.generateJson).toHaveBeenCalledOnce();
});

it("retains a bounded candidate pool after a malformed batch without retrying or approving evidence", async () => {
  const frame = { ...pack.question, requirements: [...pack.question.requirements, { ...pack.question.requirements[0], id: "R2" }], kind: "question" as const, searchQueries: {} };
  const candidates = pack.passages.map(p => ({ id: p.id, source: p.source, context: p.context }));
  const generateJson = vi.fn(async () => ({ R1: { scores: [50] } }));
  const retained = await pipelineMeaningRanker(modelMeaningReranker({ id: "fixture", generateJson }), undefined, 30, { retainCandidatesOnInvalidResult: true })(frame, candidates, new AbortController().signal);
  expect(retained.map(p => p.id).sort()).toEqual(candidates.map(p => p.id).sort()); expect(generateJson).toHaveBeenCalledOnce();
});

it("reuses exact meaning checks while retaining full primary audits, then invalidates reuse when context changes", async () => {
  const base = dependencies(); base.meaningReview = true; base.meaningApprovals = new Set();
  let meaningCalls = 0, primaryCalls = 0;
  base.verifier.generateJson = async request => {
    const input = JSON.parse(request.prompt);
    if (input.stage === "narrow_meaning_review_v1") {
      meaningCalls++;
      return { claims: Object.fromEntries(input.claims.map((c: { claim_id: string }) => [c.claim_id, { verdict: "yes", explanation: "", finding: { category: "source_support", claim_quote: "", source_id: "", source_quote: "" } }])) };
    }
    primaryCalls++; return audit(request.prompt);
  };
  const run = (evidence = pack) => runRichAnswer(evidence, "en", base, new AbortController().signal, "Explain care", {});
  expect((await run()).status).toBe("rich_answer");
  expect(meaningCalls).toBe(3); expect(primaryCalls).toBe(3);
  meaningCalls = 0; primaryCalls = 0;
  expect((await run()).status).toBe("rich_answer");
  expect(meaningCalls).toBe(1); expect(primaryCalls).toBe(3); // Final independent review always rechecks the whole answer.
  const changed = structuredClone(pack), source = changed.passages[0].source;
  if (source.kind !== "quran") throw Error("fixture");
  changed.passages[0].context = [{ ...source.verse, key: "2:184", url: "https://quran.com/2/184" }];
  meaningCalls = 0; await run(changed); expect(meaningCalls).toBeGreaterThan(1);
});

it("withholds a failed optional example without spending the correction or bypassing final coverage", async () => {
  const evidence = structuredClone(pack), base = dependencies();
  evidence.passages[2].contribution = { role: "background", scope: "general", conditions: [] };
  evidence.passages[2].requirementIds = []; evidence.passages[2].explanationRequirementIds = ["R1"];
  const write = base.writer.generateJson; let finalReviews = 0, corrections = 0;
  base.writer.generateJson = async request => {
    const input = JSON.parse(request.prompt);
    if (input.correction) corrections++;
    const response = await write(request) as any;
    if (input.sections_to_write.includes("scholar")) response.scholar = [{ text: "Two invented sentences. Another one.", source_ids: [evidence.passages[2].id], requirement_id: "R1" }];
    if (response.summary) response.summary = response.summary.map((c: any) => ({ ...c, source_ids: c.source_ids.filter((id: string) => !id.startsWith("S")) }));
    return response;
  };
  base.verifier.generateJson = async request => { if (JSON.parse(request.prompt).full_answer) finalReviews++; return audit(request.prompt); };
  const result = await runRichAnswer(evidence, "en", base, new AbortController().signal, "Explain care", {});
  expect(result.status).toBe("rich_answer"); expect(finalReviews).toBe(1); expect(corrections).toBe(0);
  if (result.status === "rich_answer") expect(result.answer.sections.find(s => s.group === "scholar")).toMatchObject({ outcome: "failed_check", claims: [] });
});
