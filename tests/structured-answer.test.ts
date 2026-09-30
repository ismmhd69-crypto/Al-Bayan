import { describe, expect, it } from "vitest";
import {
  headingOk, limitNoteOk, limitNotePermitted, listPermitted, missingListedItems, parseStructuredDraft, sourceKindMismatch,
  structuredAnswerOk, type DraftPolicy, type SourceText,
} from "@/lib/ask/checks";
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
      expect(one.answer.directAnswer).toHaveLength(4); // up to four simple-answer sentences (design 4.3)
      expect(one.answer.explanation).toHaveLength(1); // the one-sentence section joined the previous one
      expect(one.answer.claims).toHaveLength(6);
    }
    // A fifth simple-answer sentence moves into More explanation instead of failing the answer.
    const five = parseStructuredDraft({ status: "answer",
      simple_answer: ["Repentance has three conditions.", "A person must stop the sin.", "A person must regret the past act.",
        "A person must resolve not to return.", "Ibn Baz explained that regret concerns the past act."].map(sentence),
      list: [], more_explanation: [], limit_note: [] }, [source], "en", policy, "practice");
    expect(five.ok && five.answer.directAnswer).toHaveLength(4);
    expect(five.ok && five.answer.explanation[0].sentences.map((c) => c.text)).toEqual(["Ibn Baz explained that regret concerns the past act."]);
    // No direct answer at all: the first explanation sentence becomes the direct answer.
    const promoted = parseStructuredDraft({ status: "answer", direct_answer: [],
      explanation: [{ heading: "Steps", sentences: [sentence("A person must stop the sin."), sentence("A person must regret it.")] }],
      not_established: [] }, [source], "en", policy, "practice");
    expect(promoted.ok && promoted.answer.directAnswer.map((c) => c.text)).toEqual(["A person must stop the sin."]);
  });
  it("keeps an unsourced limit note only for reason, objection, steps or conditions questions", () => {
    const raw = { status: "answer", direct_answer: [sentence("This source explains the first reason.")],
      explanation: [], not_established: [{ text: "These sources do not establish every possible reason." }] };
    const ruling = { ...policy, requirements: [{ id: "R1", text: "ruling on the act", facet: "ruling" as const }] };
    const note = (questionType: string, p: DraftPolicy = ruling) => {
      const parsed = parseStructuredDraft(raw, [source], "en", p, questionType);
      return parsed.ok ? parsed.answer.notEstablished : "refused";
    };
    expect(note("reason")).toEqual(["These sources do not establish every possible reason."]);
    expect(note("objection")).toHaveLength(1);
    expect(note("practice", policy)).toHaveLength(1); // a steps point
    // For other questions the note is left out; the answer is kept.
    expect(note("ruling")).toEqual([]);
    expect(note("practice")).toEqual([]);
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

// Design phase 3: simple answer, list, More explanation and limit note, all checked like sentences.
describe("AnswerV2 draft fields", () => {
  const steps = policy; // facet "steps": a list is permitted
  const quantity = { ...policy, requirements: [{ id: "R1", text: "rate of zakat due", facet: "quantity" as const }] };
  const draft = (fields: Record<string, unknown>) => ({ status: "answer", simple_answer: [sentence("Repentance has three stated conditions.")],
    list: [], more_explanation: [], limit_note: [], ...fields });
  const parse = (fields: Record<string, unknown>, p: DraftPolicy = steps, questionType = "practice", language: "en" | "de" | "ar" = "en") =>
    parseStructuredDraft(draft(fields), [source], language, p, questionType);
  const reason = (result: ReturnType<typeof parse>) => (result.ok ? "ok" : result.reason);
  const threeSteps = ["Stop the sin now.", "Regret what was done.", "Resolve not to return to it."].map(sentence);

  it("accepts a cited list for steps and keeps it with the simple answer", () => {
    const parsed = parse({ list: threeSteps });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.answer.list.map((c) => c.text)).toEqual(["Stop the sin now.", "Regret what was done.", "Resolve not to return to it."]);
    expect(parsed.answer.claims).toHaveLength(4);
    expect(parsed.answer.list.every((c) => c.requirementId === "R1" && c.refs[0] === "S1")).toBe(true);
  });

  it("allows lists only for steps, conditions or exceptions; quantity alone never triggers one", () => {
    expect(listPermitted([{ facet: "steps" }])).toBe(true);
    expect(listPermitted([{ facet: "conditions" }, { facet: "quantity" }])).toBe(true);
    expect(listPermitted([{ facet: "exceptions" }])).toBe(true);
    expect(listPermitted([{ facet: "quantity" }])).toBe(false);
    expect(listPermitted([{ facet: "ruling" }, { facet: "reason" }])).toBe(false);
    expect(reason(parse({ list: threeSteps }, quantity, "ruling"))).toBe("list_not_allowed");
  });

  it("requires 2 to 8 short list items", () => {
    const single = parse({ list: threeSteps.slice(0, 1) });
    expect(single.ok).toBe(true);
    if (single.ok) {
      expect(single.answer.list).toEqual([]);
      expect(single.answer.directAnswer).toHaveLength(2);
    }
    const nine = Array.from({ length: 9 }, (_, n) => sentence(`Step number ${n + 1} is stated.`));
    expect(reason(parse({ list: nine }))).toBe("list_count");
    expect(reason(parse({ list: [...threeSteps.slice(0, 1), sentence(`A very long step ${"that keeps going ".repeat(12)}here.`)] }))).toBe("claim_length");
  });

  it("applies every sentence check to list items and More explanation sentences", () => {
    const bad = (text: string) => [sentence("Stop the sin now."), sentence(text)];
    expect(reason(parse({ list: bad("Say \"I repent\" aloud.") }))).toBe("quotation");
    expect(reason(parse({ list: bad("Regret it. Then stop.") }))).toBe("multiple_sentences");
    expect(reason(parse({ list: [sentence("Stop the sin now."), { ...sentence("Regret it."), source_ids: ["S9"] }] }))).toBe("unknown_ref");
    expect(reason(parse({ list: [sentence("Stop the sin now."), { ...sentence("Regret it."), source_ids: [] }] }))).toBe("ref_count");
    expect(reason(parse({ list: [sentence("Stop the sin now."), { ...sentence("Regret it."), requirement_id: "R2" }] }))).toBe("unknown_requirement");
    expect(reason(parse({ list: bad("الندم على ما فات.") }))).toBe("wrong_language"); // code checks the script; the checker model checks the language itself
    expect(reason(parse({ more_explanation: [{ heading: "Details", sentences: [sentence("Two facts. Here.")] }] }))).toBe("multiple_sentences");
    const arabicCopy = parse({ simple_answer: [sentence("التوبة لها شروط ثلاثة مذكورة.")],
      list: [sentence("الندم على الماضي والإقلاع من الذنب والعزم ألا يعود"), sentence("ترك الذنب.")] }, steps, "practice", "ar");
    expect(reason(arabicCopy)).toBe("copied_source");
  });

  it("checks German and Arabic list wording", () => {
    const german = parse({ simple_answer: [sentence("Die Reue hat drei genannte Bedingungen.")],
      list: [sentence("Die Sünde sofort beenden."), sentence("Die Tat bereuen.")] }, steps, "practice", "de");
    expect(reason(german)).toBe("ok");
    const umlauts = parse({ simple_answer: [sentence("Die Reue hat drei genannte Bedingungen.")],
      list: [sentence("Die Suende sofort beenden."), sentence("Die Tat bereuen.")] }, steps, "practice", "de");
    expect(reason(umlauts)).toBe("wrong_language");
    const arabic = parse({ simple_answer: [sentence("ذكر الشيخ أن للتوبة ثلاثة شروط.")],
      list: [sentence("ترك المعصية فورا."), sentence("الحزن على ما فات.")] }, steps, "practice", "ar");
    expect(reason(arabic)).toBe("ok");
  });

  it("requires every point in the simple answer or list, not only in More explanation", () => {
    const two = { ...policy, requirements: [...policy.requirements, { id: "R2", text: "ruling on delay", facet: "ruling" as const }],
      sourceRequirements: { S1: ["R1", "R2"] } };
    const onlyInFold = parse({ more_explanation: [{ heading: "Delay", sentences: [
      { ...sentence("Ibn Baz explained that delay is discouraged."), requirement_id: "R2" },
      { ...sentence("Ibn Baz added that it should be done soon."), requirement_id: "R2" },
    ] }] }, two);
    expect(reason(onlyInFold)).toBe("missing_requirement");
  });

  it("keeps the total at 12 AI-written cited items", () => {
    const fold = (n: number) => Array.from({ length: n }, (_, i) => sentence(`Ibn Baz explained detail number ${i + 1} of repentance.`));
    const twelve = parse({ list: threeSteps, more_explanation: [{ heading: "Details", sentences: fold(8) }] });
    expect(reason(twelve)).toBe("ok");
    const thirteen = parse({ list: threeSteps, more_explanation: [{ heading: "Details", sentences: fold(9) }] });
    expect(reason(thirteen)).toBe("claim_count");
    // More than two sections are merged, never dropped.
    const sections = parse({ more_explanation: [1, 2, 3].map((n) => ({ heading: `Part ${n}`,
      sentences: [sentence(`Ibn Baz explained a first detail in part ${n}.`), sentence(`Ibn Baz explained a second detail in part ${n}.`)] })) });
    expect(sections.ok && sections.answer.explanation.map((section) => section.sentences.length)).toEqual([2, 4]);
  });

  it("refuses a sentence that credits the Quran without citing a verse", () => {
    expect(reason(parse({ simple_answer: [sentence("The Quran lists three conditions of repentance.")] }))).toBe("source_attribution");
    expect(sourceKindMismatch("The Quran lists three conditions.", ["Q2:1"])).toBe(false);
    expect(sourceKindMismatch("Laut dem Koran gibt es drei Bedingungen.", ["HE1"])).toBe(true);
    expect(sourceKindMismatch("يذكر القرآن ثلاثة شروط.", ["S1"])).toBe(true);
  });

  it("replaces every model-written heading with fixed site wording", () => {
    const parsed = parse({ more_explanation: [{ heading: "Why delaying is forbidden",
      sentences: [sentence("Ibn Baz explained a stated detail."), sentence("Ibn Baz added a second stated detail.")] }] });
    expect(parsed.ok && parsed.answer.explanation[0].heading).toBe("Details");
    const unchecked = parse({ more_explanation: [{ heading: "The harm of delaying",
      sentences: [sentence("Ibn Baz explained a stated detail."), sentence("Ibn Baz added a second stated detail.")] }] });
    expect(unchecked.ok && unchecked.answer.explanation[0].heading).toBe("Details");
    expect(headingOk("Stopping the sin", "en")).toBe(true);
    expect(headingOk("Das ist verboten", "de")).toBe(false);
    expect(headingOk("حكم الغناء حرام", "ar")).toBe(false);
  });

  it("drops a limit note that cites, quotes or rules, and keeps a plain one", () => {
    const note = (text: string) => {
      const parsed = parse({ limit_note: [{ text }] });
      return parsed.ok ? parsed.answer.notEstablished : "refused";
    };
    expect(note("These sources do not list every step of the procedure.")).toHaveLength(1);
    expect(note("The rest is forbidden according to these sources.")).toEqual([]);
    expect(note("See S1 for the remaining steps.")).toEqual([]);
    expect(note("Verse 2:222 gives more detail.")).toEqual([]);
    expect(note("These sources say \"more\" elsewhere.")).toEqual([]);
    expect(limitNoteOk("Diese Quellen nennen nicht jeden Schritt.", "de", [source])).toBe(true);
    expect(limitNotePermitted("ruling", [{ facet: "quantity" }])).toBe(false);
    expect(limitNotePermitted("ruling", [{ facet: "conditions" }])).toBe(true);
  });
});
