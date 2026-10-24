import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import recorded from "./fixtures/ask-recorded-support-pairs.json";
import { checkCaseReferents } from "../lib/ask/case-referent-check";
import { runRichAnswer } from "../lib/ask/rich-engine";
import { dependencies, pack, strictAudit } from "./fixtures/rich";
import { focusedCases } from "../scripts/evaluate-ask-focused";

it("blocks the actual generalised case despite both live checkers approving it, without claiming the other statements are true", () => {
  const c = recorded.candidates.find(p => p.id === "HE65936")!;
  if (c.source.kind !== "hadith" || !c.source.hadith) throw Error("fixture");
  const bad = { text: "وضح النبي صلى الله عليه وسلم أن الله تعالى غني عن تعذيب الإنسان لنفسه ومشقتها في العبادات.", refs: [c.id] };
  const other = { text: "خلق الله الجن والإنس لغاية عبادته وحده دون أن يحتاج إلى رزقهم أو إطعامهم لغناه المطلق.", refs: ["Q51:56"] };
  const result = checkCaseReferents([other, bad], [{ id: c.id, arabic: c.source.hadith.arabic }]);
  expect(result.blocked).toEqual(["C2"]); // The separate causal/support gap remains undetected.
  expect(result.failures[0].source_ids).toEqual(bad.refs);
});
it.each(["الإنسان", "المرء", "المسلم", "المؤمن", "المريض", "المسافر"])("detects an unrestricted %s substitution in an unrelated invented incident", actor => {
  const source = { id: "independent-test", arabic: "مثال لغوي مختلق: رأى رجلا وقال إن هذا نفسه يحتاج إلى راحة." };
  expect(checkCaseReferents([{ text: `يحتاج ${actor} إلى راحة.`, refs: [source.id] }], [source]).blocked).toEqual(["C1"]);
});
it.each(["يحتاج هذا الإنسان إلى راحة.", "يحتاج الإنسان الذي يصفه النص إلى راحة.", "يحتاج المريض إذا وصف النص حالته إلى راحة.", "يصف النص حاجة هذا الرجل إلى راحة.", "يحتاج الإنسان إلى راحة في هذه الحالة."])("does not flag a directly bounded reference: %s", text => {
  expect(checkCaseReferents([{ text, refs: ["a"] }], [{ id: "a", arabic: "مثال لغوي مختلق عن هذا الرجل وحاجته إلى راحة." }]).blocked).toEqual([]);
});
it("abstains for explicit broader teaching, complementary sources, unrelated demonstratives and missing identities", () => {
  const claim = { text: "يحتاج الإنسان إلى راحة.", refs: ["a"] };
  for (const arabic of ["مثال لغوي مختلق عن هذا الرجل، وكل محتاج إلى راحة.", "مثال لغوي مختلق عن هذا الرجل وعن من يحتاج إلى راحة.", "مثال لغوي مختلق: هذا كتاب عن الراحة.", "مثال لغوي مختلق عن الراحة."]) {
    expect(checkCaseReferents([claim], [{ id: "a", arabic }]).blocked).toEqual([]);
  }
  expect(checkCaseReferents([{ ...claim, refs: ["a", "b"] }], [{ id: "a", arabic: "مثال عن هذا الرجل." }, { id: "b", arabic: "مثال أوسع." }]).blocked).toEqual([]);
  expect(checkCaseReferents([claim], []).blocked).toEqual([]);
});

it("does not reject the existing Arabic faithful-paraphrase fixtures, including the explicitly limited real incident", () => {
  const cases = focusedCases().filter(c => c.language === "ar" && c.variant === "faithful");
  expect(cases.length).toBeGreaterThan(0);
  for (const c of cases) {
    const passages = [c.candidate, ...(c.additionalCandidates ?? [])];
    const originals = passages.map(p => ({ id: p.id, arabic: p.source.kind === "quran" ? p.source.verse.arabic : p.source.kind === "hadith" ? p.source.hadith.arabic : p.source.quote.arabic }));
    expect(checkCaseReferents([{ text: c.summary, refs: passages.map(p => p.id) }], originals).blocked, c.id).toEqual([]);
  }
});

it("prevents actual engine streaming of the recognised substitution despite a complete positive scripted audit", async () => {
  const local = structuredClone(pack); local.passages = local.passages.slice(1, 2); local.cards = [];
  if (local.passages[0].source.kind !== "hadith") throw Error("fixture");
  local.passages[0].source.hadith.arabic = "مثال لغوي مختلق: رأى رجلا وقال إن هذا نفسه يحتاج إلى راحة.";
  const deps = dependencies(), delivered: any[] = [], codes: string[] = [];
  deps.rich = { onSection: s => delivered.push(s) }; deps.onDiagnostic = (_s, code) => codes.push(code);
  deps.writer.generateJson = async req => {
    const p = JSON.parse(req.prompt);
    return { status: "answer", no_answer_feedback: [], ...Object.fromEntries(p.sections_to_write.map((g: string) => [g, [{ text: "يحتاج الإنسان إلى راحة.", source_ids: [local.passages[0].id], requirement_id: "R1" }]])),
      ...(p.sections_to_write.includes("summary") ? { next_step: { text: "راجع النص المعروض.", kind: "learning", refs: [] } } : {}) };
  };
  deps.verifier.generateJson = async req => strictAudit(req.prompt);
  const result = await runRichAnswer(local, "ar", deps, new AbortController().signal, "اشرح النص", {});
  expect(result.status).toBe("incomplete"); expect(codes).toContain("rich_case_referent_generalized");
  expect(delivered.flatMap(s => s.claims)).toEqual([]);
});
