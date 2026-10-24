import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { checkSourceBoundaries } from "@/lib/ask/source-boundary-guards";
import { sourceWritingBoundary } from "@/lib/ask/source-writing-boundary";
import { runRichAnswer } from "@/lib/ask/rich-engine";
import { dependencies, pack, scholarId, strictAudit } from "./fixtures/rich";
import type { JsonRequest } from "@/lib/ai/types";

// Published Arabic captured in the independently reviewed R03 attempt. No
// source IDs or topic terms from this fixture are rules in production code.
const originals = [
  { id: "a", arabic: "ووصينا الإنسان بوالديه حسنا وإن جاهداك لتشرك بي ما ليس لك به علم فلا تطعهما" },
  { id: "b", arabic: "وإن جاهداك على أن تشرك بي ما ليس لك به علم فلا تطعهما وصاحبهما في الدنيا معروفا" },
  { id: "c", arabic: "إنما الطاعة في المعروف، لا طاعة لمخلوق في معصية الخالق." },
  { id: "d", arabic: "وهكذا شكر الوالدين ببرهما، بالإنفاق عليهما إذا احتاجهما، بالسمع والطاعة لهما في المعروف وحسن الكلام معهما." },
];
it("blocks the recorded borrowed alternative without declaring the wider norm false", () => {
  const c = { text: "لا طاعة للوالدين في المعصية أو الإشراك بالله، بينما تبقى صحبتهما بالمعروف واجبة.", refs: ["a", "b"] };
  const r = checkSourceBoundaries([c], originals);
  expect(r.blocked).toEqual(["C1"]); expect(r.reasons).toContain("uncited_alternative");
  expect(r.failures[0].source_ids).toEqual(c.refs); expect(r.failures[0].source_id).toBe("c");
  expect(checkSourceBoundaries([{ ...c, refs: ["a", "b", "c"] }], originals).blocked).toEqual([]);
});
it.each([
  "أوضح الشيخ أن شكر الوالدين يكون بالبر والإنفاق عليهما والسمع والطاعة لهما في المعروف وحسن الكلام معهما.",
  "أوضح الشيخ أن الطاعة للوالدين تكون بالمعروف فقط والإنفاق عليهما وحسن الكلام معهما، ولا طاعة لمخلوق في معصية الخالق.",
])("requires the recorded financial condition in both explanation and summary", text => {
  expect(checkSourceBoundaries([{ text, refs: ["d", "c"] }], originals).reasons).toContain("explicit_condition_unaccounted");
});
it.each([
  "من شكر الوالدين الإنفاق عليهما إذا احتاجهما.",
  "من شكر الوالدين الإنفاق عليهما عند حاجتهما.",
  "يشكر الإنسان والديه بحسن الكلام معهما.",
  "لا يجب الإنفاق عليهما في كل حال.",
  "الإنفاق عليهما مقيد بحاجتهما.",
  "يرتبط الإنفاق عليهما بحاجتهما.",
])("abstains for bounded paraphrases, other teachings and negated unrestricted advice: %s", text => {
  expect(checkSourceBoundaries([{ text, refs: ["d"] }], originals).blocked).toEqual([]);
});
it.each([
  ["أمثلة إدارية مختلقة، بتسليم الوثيقة إذا اكتمل الدفع، مع حفظ النسخة.", "يكون الإجراء بتسليم الوثيقة وحفظ النسخة."],
  ["مثال غير ديني، وإرسال التقرير عند وصول الطلب، ثم الأرشفة.", "يوصي الدليل بإرسال التقرير والأرشفة."],
])("recognises the same missing-condition structure on unfamiliar topics", (arabic, text) => {
  expect(checkSourceBoundaries([{ text, refs: ["invented"] }], [{ id: "invented", arabic }]).reasons).toContain("explicit_condition_unaccounted");
});
it("does not turn missing identities, long ambiguous clauses or complementary support into a lexical ruling", () => {
  expect(checkSourceBoundaries([{ text: "يجب إرسال التقرير.", refs: ["missing"] }], originals).blocked).toEqual([]);
  const a = { id: "a", arabic: "تعليمات إدارية مختلقة، إرسال التقرير إذا طلب المدير، مع الأرشفة." };
  const b = { id: "b", arabic: "في المثال الآخر إرسال التقرير مسموح دون الشرط السابق." };
  expect(checkSourceBoundaries([{ text: "يشمل الإجراء إرسال التقرير.", refs: ["a", "b"] }], [a, b]).blocked).toEqual([]);
  // These Arabic-only negative gates do not guess at English/German semantics.
  expect(checkSourceBoundaries([{ text: "Help them when needed.", refs: ["d"] }], originals).blocked).toEqual([]);
});
it("recognises foreign alternatives without source IDs or a religious topic dictionary", () => {
  const p = [{ id: "one", arabic: "مثال إداري مختلق: وإن كانت الملفات سرية فلا تطبعها." }, { id: "two", arabic: "مثال آخر عن الإتلاف وإجراءاته." }];
  expect(checkSourceBoundaries([{ text: "لا يجوز الطباعة أو الإتلاف.", refs: ["one"] }], p).reasons).toContain("uncited_alternative");
  expect(checkSourceBoundaries([{ text: "لا يجوز الطباعة أو الإتلاف.", refs: ["one", "two"] }], p).reasons).not.toContain("uncited_alternative");
});
it("abstains on explicit general scope instead of demanding an identical keyword", () => {
  const p = [{ id: "one", arabic: "مثال مختلق: يجب حفظ كل ما اؤتمن عليه الموظف." }, { id: "two", arabic: "مثال عن الوثائق والملفات." }];
  expect(checkSourceBoundaries([{ text: "يجب حفظ الوثائق أو الملفات المؤتمن عليها.", refs: ["one"] }], p).blocked).toEqual([]);
});
it("does not reject ordinary synonymous terminology merely because it occurs in another source", () => {
  const p = [{ id: "one", arabic: "مثال لغوي مختلق: يجب التعامل بالعدل." }, { id: "two", arabic: "مثال آخر عن الإنصاف." }];
  expect(checkSourceBoundaries([{ text: "يجب التعامل بالإنصاف أو العدل.", refs: ["one"] }], p).blocked).toEqual([]);
});
it("isolates source-writing positives but keeps exact attached context and final synthesis", () => {
  const input = { sections_to_write: ["quran"], citable_source_ids_by_section: { quran: ["a"], scholar: ["b"], summary: ["a", "b"] },
    source_explanations_already_drafted: { scholar: [{ text: "unchecked wider rule" }] }, source_explanations_status: "provisional", scholar_attribution_names: ["name"],
    evidence_package: { question: { requirements: ["kept"] }, contribution_plan: { planning_only: true }, passages: [
      { id: "a", arabic: "source original", surrounding_context: [{ id: "x", arabic: "restriction" }], approved_context: [{ source_id: "y", arabic: "approved restriction" }] },
      { id: "b", arabic: "different source's wider rule" },
    ] } };
  const req: JsonRequest = { system: "Rules", prompt: JSON.stringify(input), schema: { type: "object", properties: {}, required: [] }, maxOutputTokens: 2200 };
  const next = sourceWritingBoundary(req), p = JSON.parse(next.prompt);
  expect(p.evidence_package.passages).toEqual([input.evidence_package.passages[0]]);
  expect(p.evidence_package.question).toEqual(input.evidence_package.question);
  expect(p).not.toHaveProperty("source_explanations_already_drafted");
  expect(p.evidence_package).not.toHaveProperty("contribution_plan");
  expect(p.citable_source_ids_by_section).toEqual({ quran: ["a"] });
  expect(next.schema).toBe(req.schema); expect(next.maxOutputTokens).toBe(req.maxOutputTokens);
  expect(JSON.parse(req.prompt)).toEqual(input);
  const final = { ...req, prompt: JSON.stringify({ ...input, sections_to_write: ["summary"] }) };
  expect(sourceWritingBoundary(final)).toBe(final);
});
it("withholds the recognisable expansion despite positive scripted model checks and permits one corrected draft", async () => {
  const p = structuredClone(pack); p.passages = [p.passages[0], p.passages[2]]; p.cards = [];
  if (p.passages[0].source.kind !== "quran" || p.passages[1].source.kind !== "scholar") throw Error("fixture");
  p.passages[0].source.verse.arabic = originals[0].arabic; p.passages[1].source.quote.arabic = originals[2].arabic;
  const deps = dependencies(), shown: string[] = []; let corrections = 0;
  deps.verifier.generateJson = async req => strictAudit(req.prompt);
  const bad = "لا طاعة للوالدين في المعصية أو الإشراك بالله.";
  deps.writer.generateJson = async req => {
    const q = JSON.parse(req.prompt);
    if (q.sections_to_write.includes("quran")) {
      expect(q.evidence_package.passages.every((s: any) => s.type === "quran")).toBe(true);
      if (q.correction) corrections++;
    }
    return { status: "answer", no_answer_feedback: [], ...Object.fromEntries(q.sections_to_write.map((g: string) => {
      const row = {
      text: g === "quran" ? q.correction ? "يوضح النص رفض طاعة الوالدين في الدعوة إلى الإشراك بالله." : bad
        : g === "scholar" ? "يشرح ابن باز حدود الطاعة وما يرفض من أوامر الوالدين."
          : "توضح المصادر أن حسن التعامل مع الوالدين لا يعني امتثال كل طلب منهما.",
      source_ids: g === "quran" ? ["Q2:183"] : g === "scholar" ? [scholarId] : ["Q2:183", scholarId], requirement_id: "R1",
      };
      const patch = q.correction?.checker_findings?.sentence_patches?.find((p: any) => p.group === g);
      return [g, patch ? Object.fromEntries(patch.replace_indices.map((i: number) => [`P${i}`, { text: row.text }])) : [row]];
    })) };
  };
  deps.rich = { onSection: s => shown.push(...s.claims.map(c => c.text)) };
  const r = await runRichAnswer(p, "ar", deps, new AbortController().signal, "اشرح حدود الطاعة", {});
  expect(corrections).toBe(1); expect(shown).not.toContain(bad); expect(r.status).toBe("rich_answer");
});
it.each([
  ["scholar", true], ["scholar", false], ["summary", true], ["summary", false],
] as const)("checks the condition before display in %s and bounds repair (writer fixes: %s)", async (target, fixes) => {
  const p = structuredClone(pack); p.passages = [p.passages[2]]; p.cards = [];
  if (p.passages[0].source.kind !== "scholar") throw Error("fixture");
  p.passages[0].source.quote.arabic = originals[3].arabic;
  const deps = dependencies(), shown: string[] = []; let corrections = 0, unsafeVerifierCalls = 0;
  const badSource = "يذكر ابن باز أن من شكر الوالدين الإنفاق عليهما مع حسن الحديث إليهما.";
  const goodSource = "يذكر ابن باز أن من شكر الوالدين الإنفاق عليهما عند حاجتهما مع حسن الحديث إليهما.";
  const badSummary = "يمكن شكر الوالدين بالإنفاق عليهما وحسن الكلام معهما.";
  const goodSummary = "ينبغي مراعاة حاجة الوالدين عند الإنفاق عليهما وفقا لما شرحه ابن باز.";
  deps.verifier.generateJson = async req => {
    if (JSON.parse(req.prompt).claims.some((c: any) => c.claim === badSource || c.claim === badSummary)) unsafeVerifierCalls++;
    return strictAudit(req.prompt);
  };
  deps.writer.generateJson = async req => {
    const input = JSON.parse(req.prompt); if (input.correction) corrections++;
    return { status: "answer", no_answer_feedback: [], ...Object.fromEntries(input.sections_to_write.map((g: string) => {
      const bad = g === "scholar" ? badSource : badSummary, good = g === "scholar" ? goodSource : goodSummary;
      const text = g === target && (!input.correction || !fixes) ? bad : good;
      const patch = input.correction?.checker_findings?.sentence_patches?.find((p: any) => p.group === g);
      return [g, patch ? Object.fromEntries(patch.replace_indices.map((i: number) => [`P${i}`, { text }]))
        : [{ text, source_ids: [scholarId], requirement_id: "R1" }]];
    })) };
  };
  deps.rich = { onSection: s => shown.push(...s.claims.map(c => c.text)) };
  const r = await runRichAnswer(p, "ar", deps, new AbortController().signal, "اشرح شكر الوالدين", {});
  expect(corrections).toBe(1); expect(unsafeVerifierCalls).toBe(0);
  expect(shown).not.toContain(badSource); expect(shown).not.toContain(badSummary);
  expect(r.status).toBe(fixes ? "rich_answer" : "incomplete");
  if (target === "summary" && !fixes) {
    expect(r).toMatchObject({ withdraw: false }); expect(shown).toContain(goodSource);
  }
});
