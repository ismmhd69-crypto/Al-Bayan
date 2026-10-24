import { expect, it } from "vitest";
import { researchCandidatePool } from "@/lib/ask/search-engine/research-candidate-pool";
import { eligibleCorpusCandidates } from "@/lib/ask/search-engine/pipeline-corpus";
import type { QuestionFrame } from "@/lib/ask/retrieval";
import { pack } from "./fixtures/rich";
import { uniqueResearchCandidates } from "@/lib/ask/search-engine/candidate-identity";

const frame: QuestionFrame = { ...pack.question, kind: "question", searchQueries: {},
  requirements: ["R1", "R2", "R3", "R4"].map(id => ({ id, text: `Invented concern ${id}`, facet: "general" })) };

it("reserves candidate space for each concern and source family before a shared cap", () => {
  const pool = frame.requirements.flatMap(r => pack.passages.map(p => ({ ...p, id: `${p.id}-${r.id}`, retrievedFor: [r.id],
    source: p.source.kind === "scholar" ? { ...p.source, quote: { ...p.source.quote, arabic: `${p.source.quote.arabic} ${r.id}` } } : p.source })));
  const result = researchCandidatePool(frame, pool, 12);
  expect(result.candidates).toHaveLength(12); expect(result.unrepresentedRequirementIds).toEqual([]);
  for (const r of frame.requirements) for (const family of ["quran", "hadith", "scholar"]) expect(result.candidates.some(p => p.source.kind === family && p.retrievedFor?.includes(r.id))).toBe(true);
});

it("keeps untagged candidates and reports missing search provenance without inventing coverage", () => {
  const result = researchCandidatePool(frame, pack.passages);
  expect(result.candidates.map(p => p.id)).toEqual(pack.passages.map(p => p.id));
  expect(result.unrepresentedRequirementIds).toEqual(["R1", "R2", "R3", "R4"]);
});

it("keeps configured source boundaries and rejects forged corpus identities", () => {
  expect(eligibleCorpusCandidates(pack.passages, { hadith: false, scholar: false }).map(p => p.id)).toEqual(["Q2:183"]);
  expect(eligibleCorpusCandidates([{ ...pack.passages[1], id: "HE999" }])).toEqual([]);
  expect(() => eligibleCorpusCandidates([pack.passages[1], pack.passages[1]])).toThrow("invalid_corpus_candidate_identity");
  expect(() => researchCandidatePool(frame, [], 121)).toThrow("research_candidate_budget_invalid");
});

it("never conceals changed originals or attribution behind an already seen source identity", () => {
  const first = pack.passages[1], changed = structuredClone(first), renamed = structuredClone(first);
  if (changed.source.kind !== "hadith" || renamed.source.kind !== "hadith") throw Error("fixture");
  changed.source.hadith.arabic += " قيد إضافي"; renamed.source.hadith.attributionAr = "رواه مسلم";
  expect(() => uniqueResearchCandidates([first, changed])).toThrow("research_candidate_identity_changed");
  expect(() => uniqueResearchCandidates([first, renamed])).toThrow("research_candidate_identity_changed");
});

it("retains additional restrictive context without mutating the earlier candidate, and detects conflicting context", () => {
  const first = structuredClone(pack.passages[0]), second = structuredClone(first);
  if (second.source.kind !== "quran") throw Error("fixture");
  second.context = [{ ...second.source.verse, key: "2:184", arabic: "سياق تجريبي مقيّد" }];
  const result = uniqueResearchCandidates([first, second]);
  expect(result[0].context).toEqual(second.context); expect(first.context).toEqual([]);
  const conflict = structuredClone(second); conflict.context[0].arabic += " تغيّر";
  expect(() => uniqueResearchCandidates([second, conflict])).toThrow("research_context_identity_changed");
});
