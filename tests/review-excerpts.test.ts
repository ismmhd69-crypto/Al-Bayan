import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { reviewAnchors } from "@/lib/ask/review-excerpts";
import { normalizeRichReview, richReviewRequest } from "@/lib/ask/rich-review-request";
import { checkCitationBindings } from "@/lib/ask/citation-check";
import { runRichAnswer } from "@/lib/ask/rich-engine";
import { audit, dependencies, pack, drafts } from "./fixtures/rich";
const claims = [{ text: "First test point.", refs: ["Q1"], requirementId: "R1" }, { text: "Second test point.", refs: ["Q2"], requirementId: "R2" }];
const serialized = { question: { requirements: [{ id: "R1" }, { id: "R2" }] }, passages: [
  { id: "Q1", arabic: "نص تجريبي أول مستقل ليس دليلا دينيا", supported_requirement_ids: ["R1"] },
  { id: "Q2", arabic: "نص تجريبي ثان مستقل مختلف ليس دليلا دينيا", supported_requirement_ids: ["R2"] },
] };
const response = () => ({ citation_checks: Object.fromEntries(claims.map((c, i) => [`C${i + 1}`, { claim_id: `C${i + 1}`, clauses: [{
  text: c.text, supported: "yes", scope_preserved: "yes", qualifiers_preserved: "yes", evidence: [{ anchor_id: `C${i + 1}E1` }],
}] }])), requirement_coverage: { R1: { requirement_id: "R1", claim_ids: ["C1"], fully_answered: "yes", conditions_preserved: "yes" },
 R2: { requirement_id: "R2", claim_ids: ["C2"], fully_answered: "yes", conditions_preserved: "yes" } } });
it("resolves only exact original chunks and derives coverage citations from actual claims", () => {
  const raw = normalizeRichReview(response(), claims, serialized) as any;
  expect(raw.citation_checks[0].clauses[0].evidence[0]).toEqual({ source_id: "Q1", original_excerpt: serialized.passages[0].arabic });
  expect(raw.requirement_coverage.map((r: any) => r.source_ids)).toEqual([["Q1"], ["Q2"]]);
  expect(checkCitationBindings(raw, claims, serialized.passages).blocked).toEqual([]);
  const long = "كلمة تجريبية متكررة ".repeat(70);
  const chunks = reviewAnchors([claims[0]], { passages: [{ id: "Q1", arabic: long }] }).C1;
  expect(chunks.length).toBeGreaterThan(1);
  expect(chunks.every(c => Array.from(c.original_excerpt).length <= 600 && long.includes(c.original_excerpt))).toBe(true);
  expect(chunks.map(c => c.original_excerpt).join(" ")).toBe(long.trim());
});
it("rejects unknown or borrowed anchors and never overrides a negative meaning or scope finding", () => {
  for (const id of ["C2E1", "invented"]) {
    const raw = response(); raw.citation_checks.C1.clauses[0].evidence[0].anchor_id = id;
    expect(normalizeRichReview(raw, claims, serialized)).toBeNull();
  }
  const raw = response(); raw.citation_checks.C1.clauses[0].scope_preserved = "no";
  expect(checkCitationBindings(normalizeRichReview(raw, claims, serialized), claims, serialized.passages).blocked).toEqual(["C1"]);
});
it("does not ask a model to copy original proof or duplicate citation bookkeeping", () => {
  const request = richReviewRequest({ items: claims, language: "ar", full: true, question: "test", serialized,
    guidance: null, translationCandidates: [], summaryCount: 0, earlierCount: 0 });
  if (request.schema.type !== "object") throw Error("schema");
  const checks = request.schema.properties.citation_checks;
  expect(JSON.stringify(checks)).toContain("anchor_id");
  expect(JSON.stringify(checks)).not.toContain("original_excerpt");
  expect(JSON.stringify(request.schema.properties.requirement_coverage)).not.toContain("source_ids");
});
it("gives a symmetric repeated source point a concrete merge limit without skipping support checks", async () => {
  const deps = dependencies(), writer = deps.writer.generateJson; let correction = false, first = true;
  deps.writer.generateJson = async req => {
    const input = JSON.parse(req.prompt), result = structuredClone(await writer(req)) as any;
    if (!input.correction && input.sections_to_write.includes("quran")) result.quran.push({ ...drafts.quran[0], text: "The Quran explains care as an everyday responsibility." });
    if (input.correction) {
      correction = true;
      expect(input.correction.checker_findings.source_merge_plan).toEqual([{ group: "quran", maximum_sentences: 1, merge_claim_ids: ["C1", "C2"] }]);
    }
    return result;
  };
  deps.verifier.generateJson = async req => {
    const result = audit(req.prompt);
    if (first) { first = false; result.contribution_map[0].duplicates = ["C2"]; result.contribution_map[1].duplicates = ["C1"]; }
    return result;
  };
  expect((await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {})).status).toBe("rich_answer");
  expect(correction).toBe(true);
});

it("never treats a semicolon as permission to leave the second clause unchecked", () => {
  const modified = [{ ...claims[0], text: "First test point; an unsupported second assertion." }, claims[1]];
  const raw = normalizeRichReview(response(), modified, serialized);
  expect(checkCitationBindings(raw, modified, serialized.passages).blocked).toContain("C1");
});
