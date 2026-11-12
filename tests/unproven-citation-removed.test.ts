import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { checkCitationBindings } from "@/lib/ask/citation-check";
import { runRichAnswer } from "@/lib/ask/rich-engine";
import { toEvidence } from "@/lib/ask/core";
import type { RichSection } from "@/lib/ask/rich-answer";
import { audit, dependencies, pack, scholarId } from "./fixtures/rich";

// Invented wording. These fixtures establish behaviour, not theology.
const originals = [{ id: "Q1", arabic: "نص اختباري أول مستقل لا يستعمل كدليل ديني" }, { id: "Q2", arabic: "نص اختباري ثان مستقل لا يستعمل كدليل ديني" }];
const items = () => [{ text: "One supported idea.", refs: ["Q1", "Q2"] }];
const clause = (over: object = {}) => ({ text: "One supported idea.", supported: "yes", scope_preserved: "yes", qualifiers_preserved: "yes",
  evidence: [{ source_id: "Q1", original_excerpt: originals[0].arabic }], ...over });
const raw = (c = clause()) => ({ citation_checks: [{ claim_id: "C1", clauses: [c] }] });

it("without permission, an unproven extra citation still blocks the sentence, exactly as before", () => {
  const result = checkCitationBindings(raw(), items(), originals);
  expect(result.blocked).toEqual(["C1"]); expect(result.removed).toEqual([]);
  expect(result.failures.map(f => f.code)).toEqual(["attached_citation_unexplained"]);
});

it("with permission, keeps the proven sentence and reports only the citations that carried proof", () => {
  const claims = items(), asked: [number, string[]][] = [];
  const result = checkCitationBindings(raw(), claims, originals, (i, proven) => { asked.push([i, proven]); return true; });
  expect(result.blocked).toEqual([]); expect(result.reasons).toEqual([]);
  expect(result.removed).toEqual([{ index: 0, refs: ["Q1"] }]); expect(asked).toEqual([[0, ["Q1"]]]);
  // The check itself never edits a sentence.
  expect(claims[0].refs).toEqual(["Q1", "Q2"]);
});

it("blocks when the caller refuses, and never asks about a sentence that has any other failure", () => {
  expect(checkCitationBindings(raw(), items(), originals, () => false).blocked).toEqual(["C1"]);
  const never = vi.fn(() => true);
  for (const bad of [clause({ supported: "no" }), clause({ scope_preserved: "no" }), clause({ qualifiers_preserved: "no" }), clause({ text: "A different idea." }),
    clause({ evidence: [{ source_id: "Q1", original_excerpt: "نص لا يوجد في الأصل إطلاقا" }] }), clause({ evidence: [{ source_id: "Q9", original_excerpt: originals[0].arabic }] }), clause({ evidence: [] })]) {
    const result = checkCitationBindings(raw(bad), items(), originals, never);
    expect(result.blocked).toEqual(["C1"]); expect(result.removed).toEqual([]);
  }
  expect(never).not.toHaveBeenCalled();
});

const section = (group: "quran" | "scholar", id: string): RichSection => { const p = pack.passages.find(x => x.id === id)!;
  return { group, outcome: "ready", presentation: "originals", claims: [], sources: [{ id, evidence: toEvidence(p.source, "en"), role: "direct", requirementIds: p.requirementIds, explanationRequirementIds: p.explanationRequirementIds ?? [] }] }; };
async function summarise(text: string, cited: string[], provenFrom: string[]) {
  const deps = dependencies(), codes: string[] = [];
  deps.simpleResearch = true; deps.onDiagnostic = (_stage, code) => { codes.push(code); };
  deps.writer.generateJson = async () => ({ status: "answer", next_step: [], no_answer_feedback: [], summary: [{ text, source_ids: cited, requirement_id: "R1" }] });
  deps.verifier.generateJson = async request => {
    const result = audit(request.prompt);
    // The checker proves the sentence from some of its citations only.
    for (const row of result.citation_checks) for (const c of row.clauses) c.evidence = c.evidence.filter((e: { source_id: string }) => provenFrom.includes(e.source_id));
    return result;
  };
  const result = await runRichAnswer({ ...pack, passages: [pack.passages[0], pack.passages[2]] }, "en", deps, new AbortController().signal, "Explain care", {}, Infinity,
    { checkedSections: [section("quran", "Q2:183"), section("scholar", scholarId)], committedSources: true });
  return { result, codes };
}

it("publishes a final summary sentence proven from one of its two citations, citing only the proven one", async () => {
  const { result, codes } = await summarise("Together, these sources describe care as a thoughtful responsibility.", ["Q2:183", scholarId], ["Q2:183"]);
  expect(result.status, JSON.stringify({ codes, result }).slice(0, 1500)).toBe("rich_answer");
  if (result.status !== "rich_answer") return;
  const summary = result.answer.sections.find(s => s.group === "summary")!;
  expect(summary.claims).toHaveLength(1);
  expect(summary.claims[0].refs).toEqual(["Q2:183"]);
  expect(summary.sources.map(s => s.id)).toEqual(["Q2:183"]);
  expect(codes).toContain("rich_unproven_citation_removed"); expect(codes).not.toContain("rich_cited_clause_not_established");
});

it("still refuses a sentence that no cited original proves", async () => {
  const { result, codes } = await summarise("Together, these sources describe care as a thoughtful responsibility.", ["Q2:183", scholarId], []);
  expect(result.status).toBe("incomplete"); expect(codes).toContain("rich_cited_clause_not_established"); expect(codes).not.toContain("rich_unproven_citation_removed");
});

it("does not remove a citation when the sentence names that kind of source", async () => {
  // The sentence names the Quran, so its Quran citation must stay. Proof from the scholar alone is not enough.
  const { result, codes } = await summarise("The Quran and Ibn Baz both describe care as a thoughtful responsibility.", ["Q2:183", scholarId], [scholarId]);
  expect(result.status).toBe("incomplete"); expect(codes).not.toContain("rich_unproven_citation_removed");
});
