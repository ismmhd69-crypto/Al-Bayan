import { describe, expect, it } from "vitest";
import { missingListedItems, parseStructuredDraft, structuredAnswerOk, type SourceText } from "@/lib/ask/checks";
import { parseQuestionFrame, repairExplicitFrame } from "@/lib/ask/retrieval";

const source: SourceText = { id: "S1", kind: "scholar", arabic: "الندم على الماضي والإقلاع من الذنب والعزم ألا يعود", translations: {} };
const policy = { requirements: [{ id: "R1", text: "steps of repentance", facet: "steps" as const }], sourceRequirements: { S1: ["R1"] } };
const sentence = (text: string) => ({ text, source_ids: ["S1"], requirement_id: "R1" });

describe("structured answers", () => {
  it("accepts a direct answer with a distinct cited explanation", () => {
    const parsed = parseStructuredDraft({ status: "answer",
      direct_answer: [sentence("Repentance requires leaving the sin, regret and resolve not to return.")],
      explanation: [{ heading: "The conditions", sentences: [
        sentence("Ibn Baz explained that sincere regret concerns the past act."),
        sentence("Ibn Baz also requires a firm decision against returning to it."),
      ] }], not_established: [],
    }, [source], "en", policy, "practice");
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.answer.claims).toHaveLength(3);
  });
  it("rejects missing citations and repeated sentences in any section", () => {
    const noRef = { ...sentence("A person must stop the sin."), source_ids: [] };
    expect(parseStructuredDraft({ status: "answer", direct_answer: [noRef], explanation: [], not_established: [] },
      [source], "en", policy, "practice").ok).toBe(false);
    // An exact repeat is dropped; the answer itself stays.
    const same = sentence("A person must stop the sin.");
    const repeated = parseStructuredDraft({ status: "answer", direct_answer: [same, same], explanation: [], not_established: [] },
      [source], "en", policy, "practice");
    expect(repeated.ok && repeated.answer.claims.map((c) => c.text)).toEqual(["A person must stop the sin."]);
  });
  it("tidies the layout instead of discarding a correct answer", () => {
    const one = parseStructuredDraft({ status: "answer",
      direct_answer: [sentence("Repentance has three conditions."), sentence("A person must stop the sin."),
        sentence("A person must regret the past act."), sentence("A person must resolve not to return.")],
      explanation: [
        { heading: "Regret", sentences: [sentence("Ibn Baz explained that regret concerns the past act.")] },
        { heading: "Resolve", sentences: [sentence("Ibn Baz also requires a firm decision against returning.")] },
      ], not_established: [],
    }, [source], "en", policy, "practice");
    expect(one.ok).toBe(true);
    if (one.ok) {
      expect(one.answer.directAnswer).toHaveLength(3); // the fourth moved into the explanation
      expect(one.answer.explanation).toHaveLength(1); // the one-sentence section joined the previous one
      expect(one.answer.claims).toHaveLength(6);
    }
    // No direct answer at all: the first explanation sentence becomes the direct answer.
    const promoted = parseStructuredDraft({ status: "answer", direct_answer: [],
      explanation: [{ heading: "Steps", sentences: [sentence("A person must stop the sin."), sentence("A person must regret it.")] }],
      not_established: [] }, [source], "en", policy, "practice");
    expect(promoted.ok && promoted.answer.directAnswer.map((c) => c.text)).toEqual(["A person must stop the sin."]);
  });
  it("keeps an unsourced limit note only for a why question", () => {
    const raw = { status: "answer", direct_answer: [sentence("This source explains the first reason.")],
      explanation: [], not_established: [{ text: "These sources do not establish every possible reason." }] };
    expect(parseStructuredDraft(raw, [source], "en", policy, "reason").ok).toBe(true);
    // For other questions the note is left out; the answer is kept.
    const practice = parseStructuredDraft(raw, [source], "en", policy, "practice");
    expect(practice.ok && practice.answer.notEstablished).toEqual([]);
  });
  it("requires the separate completeness and repetition verdicts", () => {
    expect(structuredAnswerOk({ direct_answer_complete: "yes", listed_items_complete: "yes",
      no_repetition: "yes", not_established_ok: "yes" })).toBe(true);
    expect(structuredAnswerOk({ direct_answer_complete: "yes", listed_items_complete: "no",
      no_repetition: "yes", not_established_ok: "yes" })).toBe(false);
  });
  it("catches omitted conditions only when the sealed source contains the list", () => {
    const claims = [{ text: "Repentance requires regret.", refs: ["S1"] }];
    expect(missingListedItems("How do I repent?", "en", [source], claims)).toEqual([
      "stop the sin", "resolve not to return",
    ]);
    expect(missingListedItems("How do I repent?", "en", [{ ...source, arabic: "الندم" }], claims)).toEqual([]);
  });
  it("keeps the payable rate separate from a threshold", () => {
    const gold = { ...source, arabic: "الزكاة ربع العشر إذا بلغ الذهب النصاب" };
    expect(missingListedItems("ما مقدار زكاة الذهب؟", "ar", [gold], [
      { text: "النصاب عشرون مثقالا.", refs: ["S1"] },
    ])).toEqual(["gold zakat payable rate"]);
  });
  it("requires both parts of the conversion testimony when that source lists them", () => {
    const conversion = { ...source, arabic: "يشهد أن لا إله إلا الله وأن محمد رسول الله" };
    expect(missingListedItems("Wie kann ich zum Islam konvertieren?", "de", [conversion], [
      { text: "Man bezeugt, dass Allah der einzige Gott ist.", refs: ["S1"] },
    ])).toEqual(["testimony that Muhammad is the Messenger"]);
  });
});

describe("question frame retry fallback", () => {
  it("repairs a threshold-only frame into a rate search requirement", () => {
    const frame = parseQuestionFrame({ language: "ar", kind: "question", question_type: "ruling",
      subjects: ["gold zakat"], requested_points: [
        { text: "conditions for gold zakat", facet: "conditions" },
        { text: "minimum threshold for gold zakat", facet: "quantity" },
      ], qualifiers: [], search_queries_en: ["gold zakat amount"], search_queries_de: [], search_queries_ar: ["زكاة الذهب"] });
    expect(frame).not.toBeNull();
    const repaired = repairExplicitFrame("ما شروط وجوب الزكاة في الذهب وكم مقدارها؟", frame!);
    expect(repaired.requirements.find((point) => point.facet === "quantity")?.text).toContain("rate or amount");
  });
});
