import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { runRichAnswer, parseRichClaims } from "@/lib/ask/rich-engine";
import { dependencies, pack, drafts, audit } from "./fixtures/rich";
import { providerShapeSchema, structuredOutputContract } from "@/lib/ai/structured-output";
import { checkCitationBindings } from "@/lib/ask/citation-check";
import { richReviewRequest, normalizeRichReview } from "@/lib/ask/rich-review-request";
const items = [{ text: "First supported idea. A second qualified idea.", refs: ["Q1", "Q2"] }];
const originals = [{ id: "Q1", arabic: "نص اختباري أول مستقل لا يستعمل كدليل ديني" }, { id: "Q2", arabic: "نص اختباري ثان مستقل لا يستعمل كدليل ديني" }];
const clause = (text: string, i: number) => ({ text, supported: "yes", scope_preserved: "yes", qualifiers_preserved: "yes", evidence: [{ source_id: originals[i].id, original_excerpt: originals[i].arabic }] });
const good = () => ({ citation_checks: [{ claim_id: "C1", clauses: [clause("First supported idea.", 0), clause("A second qualified idea.", 1)] }] });
it("keeps answer polarity in the checked wording and never overrides a negative support verdict", () => {
  const claim = { text: "No: the test protocol still requires the stated precaution.", refs: ["Q1"], requirementId: "R1" };
  const checked = clause(claim.text, 0);
  expect(checkCitationBindings({ citation_checks: [{ claim_id: "C1", clauses: [checked] }] }, [claim], originals).blocked).toEqual([]);
  expect(checkCitationBindings({ citation_checks: [{ claim_id: "C1", clauses: [{ ...checked, supported: "no" }] }] }, [claim], originals).blocked).toEqual(["C1"]);
  expect(checkCitationBindings({ citation_checks: [{ claim_id: "C1", clauses: [{ ...checked, text: claim.text.replace("No: ", "") }] }] }, [claim], originals).blocked).toEqual(["C1"]);
});
it("ignores sentence punctuation without dropping words, negations, qualifications or numeric punctuation", () => {
  const punctuation = good(); punctuation.citation_checks[0].clauses.forEach(c => { c.text = c.text.replace(/\./g, ""); });
  expect(checkCitationBindings(punctuation, items, originals).blocked).toEqual([]);
  for (const [text, reconstructed, blocked] of [
    ["إن الله تعالى هو الغني عن خلقه بينما الناس هم المحتاجون إليه سبحانه.", "إن الله تعالى هو الغني عن خلقه بينما الناس هم المحتاجون إليه سبحانه", false],
    ["First idea, with a condition.", "First idea with a condition", false],
    ["Do not do this.", "Do do this", true],
    ["This may help.", "This helps", true],
    ["This needs 1.5 units.", "This needs 15 units", true],
    ["من ١ إلى ٣ بشرط محدد.", "من ١ إلى ٣", true],
    ["Only if the condition holds.", "Only if the condition holds", false],
  ] as const) {
    const c = clause(reconstructed, 0), raw = { citation_checks: [{ claim_id: "C1", clauses: [c] }] };
    expect(checkCitationBindings(raw, [{ text, refs: ["Q1"] }], originals).blocked.length > 0).toBe(blocked);
  }
});
it("returns the exact rejected clause and borrowed source for bounded correction", () => {
  const r = good(); r.citation_checks[0].clauses[1].evidence[0].source_id = "Q3";
  expect(checkCitationBindings(r, items, originals).failures).toContainEqual(expect.objectContaining({
    claim_id: "C1", code: "proof_source_not_cited", rejected_text: items[0].text,
    clause: "A second qualified idea.", source_id: "Q3", allowed_source_ids: ["Q1", "Q2"],
  }));
});
it("requires every clause and citation to be anchored in that claim's own originals", () => {
  expect(checkCitationBindings(good(), items, originals).blocked).toEqual([]);
  const bad = good(); bad.citation_checks[0].clauses[1].evidence[0].source_id = "Q3";
  expect(checkCitationBindings(bad, items, [...originals, { id: "Q3", arabic: originals[1].arabic }]).blocked).toEqual(["C1"]);
});
it("rejects dropped clauses, unused citations, invented quotes and lost qualifications", () => {
  for (const mutate of [
    (r: ReturnType<typeof good>) => r.citation_checks[0].clauses.pop(),
    (r: ReturnType<typeof good>) => { r.citation_checks[0].clauses[1].evidence = r.citation_checks[0].clauses[0].evidence; },
    (r: ReturnType<typeof good>) => { r.citation_checks[0].clauses[1].evidence[0].original_excerpt = "عبارة مختلقة غير موجودة"; },
    (r: ReturnType<typeof good>) => { r.citation_checks[0].clauses[1].qualifiers_preserved = "no"; },
    (r: ReturnType<typeof good>) => { r.citation_checks[0].clauses[1].scope_preserved = "unsure"; },
    (r: ReturnType<typeof good>) => { r.citation_checks[0].clauses[1].evidence[0].original_excerpt = "ن".repeat(601); },
    (r: ReturnType<typeof good>) => { r.citation_checks[0].clauses[1].evidence = Array(4).fill(r.citation_checks[0].clauses[1].evidence[0]); },
  ]) { const r = good(); mutate(r); expect(checkCitationBindings(r, items, originals).blocked).toEqual(["C1"]); }
  expect(checkCitationBindings({}, items, originals).blocked).toEqual(["C1"]);
});
it("places original wording only in the bundle of claims actually citing it", () => {
  const req = richReviewRequest({ items: [{ text: "An idea.", refs: ["Q1"] }], language: "en", full: false, question: "test", serialized: { passages: originals }, guidance: null, translationCandidates: [], summaryCount: 0, earlierCount: 0 });
  const payload = JSON.parse(req.prompt);
  expect(payload.evidence_package.passages).toEqual([{ id: "Q1" }, { id: "Q2" }]);
  expect(payload.claim_evidence[0].cited_originals).toEqual([originals[0]]);
  expect(payload.restriction_context).toEqual([originals[1]]);
  if (req.schema.type === "object") {
    // Google transport omits decoding-size bounds; the full local contract keeps them.
    expect(JSON.stringify(providerShapeSchema(structuredOutputContract(req.schema).schema))).not.toMatch(/maxItems|maxLength/);
    expect(JSON.stringify(req.schema.properties.citation_checks)).toContain("qualifiers_preserved");
  }
});
it("routes coverage to eligible claims without declaring mixed summaries supported", () => {
  const req = richReviewRequest({ items: [{ text: "First point.", refs: ["Q1"] }, { text: "Second point.", refs: ["Q2"] },
    { text: "Connected answer.", refs: ["Q1", "Q2"] }], language: "en", full: true, question: "Both points?",
    serialized: { question: { requirements: [{ id: "R1" }, { id: "R2" }] }, passages: originals.map((p, i) => ({ ...p, supported_requirement_ids: [`R${i + 1}`] })) },
    guidance: null, translationCandidates: [], summaryCount: 1, earlierCount: 0 });
  expect(JSON.parse(req.prompt).eligible_claim_ids_by_requirement).toEqual({ R1: ["C1"], R2: ["C2"] });
});
it("does not stream a generic all-yes approval without citation proof", async () => {
  const deps = dependencies(), seen: string[] = [];
  deps.verifier.generateJson = async req => { const r: any = audit(req.prompt); delete r.citation_checks; return r; };
  deps.rich = { onSection: section => { if (section.outcome === "ready") seen.push(section.group); } };
  expect((await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {})).status).toBe("incomplete");
  expect(seen).toEqual([]);
});
it("does not force redundant selected sources into prose, even when labelled direct", () => {
  const local = structuredClone(pack), extra = structuredClone(local.passages[0]); extra.id = "Q2:184";
  extra.contribution = { role: "background", scope: "general", conditions: [] };
  local.passages.push(extra);
  expect(parseRichClaims(drafts.quran, "quran", local, "en")).not.toBeNull();
  extra.contribution.role = "direct";
  expect(parseRichClaims(drafts.quran, "quran", local, "en")).not.toBeNull();
});

it("can complete with a redundant selected source unused, while checking real coverage", async () => {
  const local = structuredClone(pack), deps = dependencies(), write = deps.writer.generateJson;
  local.passages = local.passages.filter(p => p.source.kind === "quran");
  local.passages.push({ ...structuredClone(local.passages[0]), id: "Q2:184" });
  deps.writer.generateJson = async req => ({ ...await write(req) as object, summary: [{ ...drafts.summary[0], source_ids: ["Q2:183"] }] });
  const result = await runRichAnswer(local, "en", deps, new AbortController().signal, "Explain care", {});
  expect(result.status).toBe("rich_answer");
  if (result.status === "rich_answer") expect(result.answer.sections.flatMap(s => s.sources).some(s => s.id === "Q2:184")).toBe(false);
  local.question.requirements.push({ id: "R2", text: "A separate essential concern", facet: "conditions" });
  expect((await runRichAnswer(local, "en", deps, new AbortController().signal, "Explain both concerns", {})).status).toBe("incomplete");
});

it("constrains each coverage row to its own eligible identities without approving coverage", () => {
  const req = richReviewRequest({ items: [{ text: "First point.", refs: ["Q1"] }, { text: "Second point.", refs: ["Q2"] },
    { text: "Combined points.", refs: ["Q1", "Q2"] }], language: "en", full: true, question: "Both points?",
    serialized: { question: { requirements: [{ id: "R1" }, { id: "R2" }] }, passages: originals.map((p, i) => ({ ...p, supported_requirement_ids: [`R${i + 1}`] })) },
    guidance: null, translationCandidates: [], summaryCount: 1, earlierCount: 1 });
  if (req.schema.type !== "object") throw Error("schema");
  const coverage = req.schema.properties.requirement_coverage;
  expect(coverage).toMatchObject({ type: "object", required: ["R1", "R2"], properties: {
    R1: { properties: { requirement_id: { enum: ["R1"] }, claim_ids: { items: { enum: ["C1"] } }, fully_answered: { enum: ["yes", "no", "unsure"] } } },
    R2: { properties: { claim_ids: { items: { enum: ["C2"] } } } },
  } });
  const raw = { requirement_coverage: { R1: { requirement_id: "R1", fully_answered: "no" }, R2: { requirement_id: "R2", fully_answered: "unsure" } } };
  expect(normalizeRichReview(raw)).toEqual({ requirement_coverage: Object.values(raw.requirement_coverage) });
  expect(normalizeRichReview({ requirement_coverage: { R1: { requirement_id: "R2" } } })).toBeNull();
});

it("uses one fixed contribution field per claim rather than an expandable repeated list", () => {
  const req = richReviewRequest({ items: [{ text: "First point.", refs: ["Q1"] }, { text: "Second point.", refs: ["Q2"] }],
    language: "en", full: false, question: "Both?", serialized: { passages: originals }, guidance: null, translationCandidates: [], summaryCount: 0, earlierCount: 0 });
  if (req.schema.type !== "object") throw Error("schema");
  expect(req.schema.properties.contribution_map).toMatchObject({ type: "object", required: ["C1", "C2"],
    properties: { C1: { properties: { claim_id: { enum: ["C1"] }, duplicates: { items: { enum: ["C2"] } } } }, C2: { properties: { claim_id: { enum: ["C2"] }, duplicates: { items: { enum: ["C1"] } } } } } });
  expect(normalizeRichReview({ contribution_map: { C1: { claim_id: "C2" } } })).toBeNull();
});
