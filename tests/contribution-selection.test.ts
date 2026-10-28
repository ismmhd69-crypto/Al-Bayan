import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { parseEvidencePackage, type PassageForSelection, type QuestionFrame } from "@/lib/ask/retrieval";
import { flattenTieredSelection, tieredSelectionSchema } from "@/lib/ask/tiered";
import { selectPatientEvidence } from "@/lib/ask/patient-models";
import { researchEngineRevision } from "@/lib/ask/search-engine/job-policy";
import { pack, dependencies } from "./fixtures/rich";
import { richCoverageChecked } from "@/lib/ask/rich-engine";
import { selectionSummary } from "@/lib/ask/trace-summary";
import { safeDetails } from "@/lib/ask/diagnostics";

const frame: QuestionFrame = { ...pack.question, requirements: [{ id: "R1", text: "Explain the principle and its conditions", facet: "general", scope: "general" }], kind: "question", searchQueries: {} };
const q = (n: number): PassageForSelection => {
  const original = pack.passages[0]; if (original.source.kind !== "quran") throw Error("fixture");
  return { id: `Q2:${n}`, source: { kind: "quran", verse: { ...original.source.verse, key: `2:${n}`, arabic: `نص اختباري ${n}` } }, context: [] };
};
const h = (n: number): PassageForSelection => {
  const original = pack.passages[1]; if (original.source.kind !== "hadith") throw Error("fixture");
  return { id: `HE${n}`, source: { kind: "hadith", hadith: { ...original.source.hadith, id: `HE${n}`, arabic: `نص اختباري ${n}` } }, context: [] };
};
const s = (n: number): PassageForSelection => {
  const original = pack.passages[2]; if (original.source.kind !== "scholar") throw Error("fixture");
  const id = `S${String(n).padStart(8, "0")}-0000-4000-a000-000000000000`;
  return { id, source: { kind: "scholar", quote: { ...original.source.quote, id, arabic: `نص اختباري ${n}`, url: `https://binbaz.org.sa/fatwas/${n}/test` } }, context: [] };
};
const assessment = (p: PassageForSelection) => ({ source_id: p.id, relevance: "partial", supported_requirement_ids: ["R1"],
  context_safe: "yes", position: "", scope_matches_question: "yes", distinct_contribution: "yes", related_requirement_ids: [],
  contribution: { role: "direct", scope: "general", conditions: [] as string[] } });
const unit = (sources: string[], contribution: string, purpose = "answer", necessary = "yes") => ({
  source_ids: sources, requirement_ids: ["R1"], contribution, purpose, necessary,
});
const response = (pool: PassageForSelection[], plan: ReturnType<typeof unit>[]) => ({ status: "ready", coverage: "complete", conflict_type: "none",
  assessments: pool.map(assessment), evidence_plan: plan });
const seal = (raw: unknown, pool: PassageForSelection[], options = {}) => {
  const failures: string[] = [];
  const result = parseEvidencePackage(raw, frame, pool, { requireContributions: true, distinctSelection: true, tierOrder: true, ...options }, code => failures.push(code));
  return { result, failures, ids: result?.passages.map(p => p.id) };
};

describe("purposeful evidence selection preview", () => {
  it.each(["no", "unsure"])("excludes background with %s applicability while retaining other evidence", scope => {
    const pool = [q(1), h(1), s(1)], raw = response(pool, []);
    for (const [i, applicability] of [[1, scope], [2, "yes"]] as const) {
      Object.assign(raw.assessments[i], { relevance: "context", supported_requirement_ids: [], related_requirement_ids: ["R1"],
        scope_matches_question: applicability, contribution: { role: "background", scope: "general", conditions: [] } });
    }
    const reasons: string[] = [];
    const result = parseEvidencePackage(raw, frame, pool, { requireContributions: true, partialPreview: true }, code => reasons.push(code));
    expect(result?.passages.map(p => p.id)).toEqual([pool[0].id, pool[2].id]);
    expect(result?.passages.find(p => p.id === pool[2].id)?.explanationRequirementIds).toEqual(["R1"]);
    expect(reasons).toContain("source_scope_rejected");
  });
  it("excludes one scope-uncertain candidate without discarding independent checked contributions", () => {
    const pool = [q(1), q(2)], raw = response(pool, []);
    raw.assessments[0].scope_matches_question = "unsure";
    const reasons: string[] = [];
    const result = parseEvidencePackage(raw, frame, pool, { requireContributions: true, partialPreview: true }, code => reasons.push(code));
    expect(result?.passages.map(p => p.id)).toEqual([pool[1].id]);
    expect(reasons).toContain("source_scope_rejected");
  });
  it("does not manufacture evidence when every candidate is scope-uncertain", () => {
    const pool = [q(1)], raw = response(pool, []); raw.assessments[0].scope_matches_question = "unsure";
    expect(parseEvidencePackage(raw, frame, pool, { requireContributions: true, partialPreview: true })).toBeNull();
  });
  it("does not skip unknown identities or contradictory roles in an excluded candidate", () => {
    const pool = [q(1), q(2)], raw = response(pool, []); raw.assessments[0].scope_matches_question = "unsure";
    raw.assessments[0].source_id = "Q999:999";
    expect(parseEvidencePackage(raw, frame, pool, { requireContributions: true, partialPreview: true })).toBeNull();
    raw.assessments[0].source_id = pool[0].id; raw.assessments[0].contribution.role = "background";
    expect(parseEvidencePackage(raw, frame, pool, { requireContributions: true, partialPreview: true })).toBeNull();
  });
  it("does not omit a visitor-named passage to make another candidate pass", () => {
    const pool = [q(1), q(2)], raw = response(pool, []); raw.assessments[0].scope_matches_question = "unsure";
    expect(parseEvidencePackage(raw, frame, pool, { requireContributions: true, partialPreview: true, namedPassages: [[pool[0].id]] })).toBeNull();
  });
  it("does not fill spare slots with three restatements of the same principle", () => {
    const pool = [s(1), s(2), s(3)], raw = response(pool, [unit([pool[0].id], "The one supported principle")]);
    raw.assessments[1].distinct_contribution = "no"; raw.assessments[2].distinct_contribution = "no";
    expect(seal(raw, pool).ids).toEqual([pool[0].id]);
    // Reproduce the old behaviour using the very same assessment metadata.
    expect(parseEvidencePackage(raw, frame, pool, { requireContributions: true })?.passages).toHaveLength(2);
  });
  it("keeps complementary partial passages for the same concern, including low-ranked conditions", () => {
    const pool = [q(1), h(1), s(1)], raw = response(pool, [unit([pool[0].id], "The principle"), unit([pool[2].id], "Its necessary condition", "qualification")]);
    raw.assessments[2].contribution.conditions = ["A condition stated in the original"];
    const sealed = seal(raw, pool);
    expect(sealed.ids).toEqual([pool[0].id, pool[2].id]);
    expect(sealed.result?.passages[1].contribution?.conditions).toEqual(["A condition stated in the original"]);
  });
  it("preserves every excerpt jointly needed for one contribution", () => {
    const pool = [q(1), h(1), s(1)];
    expect(seal(response(pool, [unit(pool.map(p => p.id), "Several passages establish complementary parts")]), pool).ids).toHaveLength(3);
  });
  it("does not let final coverage silently omit a necessary qualification", () => {
    const pool = [q(1), h(1)], local = seal(response(pool, [unit([pool[0].id], "The principle"), unit([pool[1].id], "Its exception", "qualification")]), pool).result!;
    const claims = [{ text: "Invented test principle", refs: [pool[0].id], requirementId: "R1" }, { text: "Invented test exception", refs: [pool[1].id], requirementId: "R1" }];
    const row = { requirement_id: "R1", claim_ids: ["C1"], source_ids: [pool[0].id], fully_answered: "yes", conditions_preserved: "yes" };
    expect(richCoverageChecked([row], claims, local)).toBe(false);
    expect(richCoverageChecked([{ ...row, claim_ids: ["C1", "C2"], source_ids: pool.map(p => p.id) }], claims, local)).toBe(true);
  });
  it("logs fixed plan metadata without contribution wording or originals", () => {
    const pool = [q(1)], raw = response(pool, [unit([pool[0].id], "PRIVATE-PLANNING-MARKER")]);
    const logged = safeDetails(selectionSummary(raw, frame, pool));
    expect(logged).toMatchObject({ evidence_plan: [{ source_ids: [pool[0].id], requirement_ids: ["R1"], purpose: "answer", necessary: "yes" }] });
    expect(JSON.stringify(logged)).not.toContain("PRIVATE-PLANNING-MARKER");
    expect(JSON.stringify(logged)).not.toContain("نص اختباري");
    for (const phase of ["source_support", "answer_quality", "display_alignment"]) expect(safeDetails({ phase })).toEqual({ phase });
  });
  it("does not require a scholar or any fixed source quota for explicit general teaching", () => {
    const pool = [h(1), s(1)];
    expect(seal(response(pool, [unit([pool[0].id], "Direct teaching")]), pool).ids).toEqual([pool[0].id]);
  });
  it("never drops a necessary contribution merely to fit source limits", () => {
    const pool = [h(1), h(2), h(3)];
    const sealed = seal(response(pool, pool.map((p, i) => unit([p.id], `Required step ${i}`))), pool);
    expect(sealed.result).toBeNull(); expect(sealed.failures).toContain("package_caps_prevent_coverage");
  });
  it("skips an optional joint contribution as a whole when it exceeds caps", () => {
    const pool = [q(1), h(1), h(2), h(3)];
    expect(seal(response(pool, [unit([pool[0].id], "Necessary principle"), unit(pool.slice(1).map(p => p.id), "Optional joint explanation", "corroboration", "no")]), pool).ids).toEqual([pool[0].id]);
  });
  it.each(["no", "unsure"])("rejects planned direct sources whose distinct contribution is %s", distinct => {
    const pool = [h(1)], raw = response(pool, [unit([pool[0].id], "Claimed addition")]);
    raw.assessments[0].distinct_contribution = distinct;
    expect(seal(raw, pool).failures).toContain("evidence_plan_source_not_distinct");
  });
  it("keeps independent eligible excerpts from the same fatwa when both are needed", () => {
    const pool = [s(1), s(2)];
    if (pool[0].source.kind !== "scholar" || pool[1].source.kind !== "scholar") throw Error("fixture");
    pool[1].source.quote.url = pool[0].source.quote.url;
    expect(seal(response(pool, [unit([pool[0].id], "First part"), unit([pool[1].id], "Necessary exception", "qualification")]), pool).ids).toHaveLength(2);
  });
  it.each(["unknown_source", "unknown_requirement", "repeated_meaning", "missing_plan", "missing_coverage", "duplicate_assessment"])("rejects %s instead of guessing a package", issue => {
    const pool = [q(1), h(1)], raw: Record<string, unknown> = response(pool, [unit([pool[0].id], "First contribution")]);
    if (issue === "unknown_source") raw.evidence_plan = [unit(["HE999"], "Invented identity")];
    if (issue === "unknown_requirement") raw.evidence_plan = [{ ...unit([pool[0].id], "Wrong concern"), requirement_ids: ["R4"] }];
    if (issue === "repeated_meaning") raw.evidence_plan = [unit([pool[0].id], "Same meaning"), unit([pool[1].id], " SAME   meaning ")];
    if (issue === "missing_plan") delete raw.evidence_plan;
    if (issue === "missing_coverage") raw.evidence_plan = [unit([pool[0].id], "Optional explanation", "background", "no")];
    if (issue === "duplicate_assessment") (raw.assessments as object[]).push(assessment(pool[0]));
    expect(seal(raw, pool).result).toBeNull();
  });
  it.each(["status", "coverage", "necessary", "scope"])("rejects malformed %s arrays without coercion", field => {
    const pool = [q(1)], raw: Record<string, unknown> = response(pool, [unit([pool[0].id], "The principle")]);
    if (field === "status") raw.status = ["ready"];
    if (field === "coverage") raw.coverage = ["complete"];
    if (field === "necessary") raw.evidence_plan = [{ ...unit([pool[0].id], "The principle"), necessary: ["yes"] }];
    if (field === "scope") (raw.assessments as Record<string, unknown>[])[0].contribution = { role: "direct", scope: ["case_specific"], conditions: [] };
    expect(seal(raw, pool).result).toBeNull();
  });
  it("does not generalise a narrow case or promote background into a direct answer", () => {
    const pool = [q(1)], raw = response(pool, [unit([pool[0].id], "General conclusion")]);
    raw.assessments[0].contribution.scope = "case_specific";
    expect(seal(raw, pool).result).toBeNull();
    Object.assign(raw.assessments[0], { relevance: "context", supported_requirement_ids: [], related_requirement_ids: ["R1"], contribution: { role: "background", scope: "general", conditions: [] } });
    expect(seal(raw, pool, { partialPreview: true }).failures).toContain("evidence_plan_answer_not_direct");
  });
  it("preserves both declared scholarly positions rather than selecting only the first", () => {
    const pool = [s(1), s(2)], raw = response(pool, [unit([pool[0].id], "First view"), unit([pool[1].id], "Qualified alternative view", "difference")]);
    raw.conflict_type = "scholar_difference"; raw.assessments.forEach((a, i) => a.position = `position-${i}`);
    expect(Object.keys(seal(raw, pool).result?.scholarDifference?.positions ?? {})).toHaveLength(2);
    raw.evidence_plan.pop(); expect(seal(raw, pool).result).toBeNull();
  });
  it("does not truncate a complete visitor-named passage", () => {
    const pool = [q(1), q(2), q(3)], namedPassages = [pool.map(p => p.id)];
    expect(seal(response(pool, [unit([pool[0].id], "Partial named passage")]), pool, { namedPassages }).failures).toContain("evidence_plan_named_passage_incomplete");
    expect(seal(response(pool, [unit(pool.map(p => p.id), "Complete named passage")]), pool, { namedPassages }).result?.cards[0].named).toBe(true);
  });
  it("keeps partial background previews separate from full coverage in the real patient selector", async () => {
    const pool = [q(1)], raw = response(pool, [unit([pool[0].id], "Helpful background", "background", "no")]);
    raw.status = "insufficient"; raw.coverage = "incomplete";
    Object.assign(raw.assessments[0], { relevance: "context", supported_requirement_ids: [], related_requirement_ids: ["R1"], contribution: { role: "background", scope: "general", conditions: [] } });
    const deps = dependencies(); deps.distinctSelection = true;
    deps.verifier.generateJson = async request => {
      expect(request.system).toContain("evidence_plan");
      expect(request.schema.type === "object" && request.schema.required).toContain("evidence_plan");
      return raw;
    };
    const result = await selectPatientEvidence(frame, pool, deps, new AbortController().signal, true);
    expect(result?.partial).toBe(true); expect(result?.passages[0].explanationRequirementIds).toEqual(["R1"]);
    expect(await selectPatientEvidence(frame, pool, deps, new AbortController().signal, false)).toBeNull();
  });
  it("preserves the plan across tier flattening and includes its flag in durable-job identity", () => {
    const pool = [q(1)], raw = response(pool, [unit([pool[0].id], "Explicit principle")]);
    const flat = flattenTieredSelection({ ...raw, quran_assessments: raw.assessments, hadith_assessments: [], scholar_assessments: [] }, pool);
    expect(flat?.evidence_plan).toEqual(raw.evidence_plan); expect(seal(flat, pool).ids).toEqual([pool[0].id]);
    const schema = tieredSelectionSchema(["R1"], true, true);
    expect(schema.type === "object" && schema.required).toContain("evidence_plan");
    const env = { ASK_JOB_BUILD_REVISION: "a".repeat(40) };
    expect(researchEngineRevision({ ...env, ASK_DISTINCT_SELECTION: "true" })).not.toBe(researchEngineRevision(env));
  });
});
