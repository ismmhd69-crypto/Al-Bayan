import { describe, expect, it } from "vitest";
import {
  buildSearchQueries,
  parseEvidencePackage,
  parseQuestionFrame,
  questionFrameMismatch,
  rankCandidatesForQuestion,
  repairExplicitFrame,
  type PassageForSelection,
} from "@/lib/ask/retrieval";
import type { Verse } from "@/lib/sources/quran-meta";
import { quranSearchPath } from "@/lib/sources/quran-search";

const verse = (key: string, translation: string): Verse => ({
  key,
  arabic: "نص عربي تجريبي غير قرآني",
  arabicPlain: "نص عربي تجريبي غير قرآني",
  translations: { en: translation, de: null },
  url: `https://example.test/${key}`,
});

const frame = parseQuestionFrame({
  language: "en",
  kind: "question",
  question_type: "identity",
  subjects: ["example subject"],
  requested_points: [
    { text: "identity of the example subject", facet: "identity" },
    { text: "attributes of the example subject", facet: "attributes" },
  ],
  qualifiers: [],
  search_queries_en: ["unique lasting qualities", "example subject guiding role"],
  search_queries_de: ["besondere bleibende merkmale"],
  search_queries_ar: ["وصف مميز دائم"],
})!;

const candidates: PassageForSelection[] = [
  { id: "Q9:1", source: { kind: "quran", verse: verse("9:1", "The subject is described directly") }, context: [] },
  { id: "Q9:2", source: { kind: "quran", verse: verse("9:2", "A different group is discussed and the subject is only named") }, context: [] },
];

describe("structured retrieval", () => {
  it("ranks a mapped direct candidate above a mere keyword match without enlarging the selector input", () => {
    const items: PassageForSelection[] = [
      { id: "Q2:1", source: { kind: "quran", verse: verse("2:1", "Gold is mentioned here") }, context: [] },
      { id: "Q2:2", source: { kind: "quran", verse: verse("2:2", "The amount due is stated here") }, context: [] },
    ];
    const ranked = rankCandidatesForQuestion(frame, items, new Set(["Q2:2"]), { quran: 1, hadith: 0, scholar: 0 });
    expect(ranked.map((item) => item.id)).toEqual(["Q2:2"]);
  });
  it("catches a gold zakat threshold substituted for the amount due", () => {
    const wrong = { ...frame, requirements: [
      { id: "R1", facet: "conditions" as const, text: "conditions for gold zakat" },
      { id: "R2", facet: "quantity" as const, text: "nisab threshold for gold zakat" },
    ] };
    expect(questionFrameMismatch("ما شروط وجوب الزكاة في الذهب وكم مقدارها؟", wrong)).toBe("gold_zakat_rate_confused");
    expect(questionFrameMismatch("ما شروط وجوب الزكاة في الذهب وكم مقدارها؟", {
      ...wrong, requirements: [wrong.requirements[0], { id: "R2", facet: "quantity", text: "rate of gold zakat due" }],
    })).toBeNull();
  });

  it("keeps why, steps and objection requests in the frame", () => {
    expect(questionFrameMismatch("Why do Muslims pray five times?", frame)).toBe("reason_missing");
    expect(questionFrameMismatch("Was muss ich tun, um Muslim zu werden?", frame)).toBe("steps_missing");
    expect(questionFrameMismatch("If God is merciful, why is there Hell forever?", frame)).toBe("reason_missing");
  });
  it("uses Quran Foundation advanced search rather than autocomplete mode", () => {
    const path = quranSearchPath("who is God", [85, 208], 20);
    const params = new URL(`https://example.test${path}`).searchParams;
    expect(params.get("mode")).toBe("advanced");
    expect(params.get("query")).toBe("who is God");
    expect(params.get("size")).toBe("20");
    expect(params.get("filter_translations")).toBe("85,208");
    expect(path).not.toContain("mode=quick");
  });

  it("keeps the question purpose and prioritises its language", () => {
    expect(frame.questionType).toBe("identity");
    expect(frame.requiredFacets).toEqual(["identity", "attributes"]);
    expect(buildSearchQueries(frame, 4)).toEqual([
      "unique lasting qualities",
      "example subject guiding role",
      "وصف مميز دائم",
      "besondere bleibende merkmale",
    ]);
  });

  it("preserves quantity, time, place, comparison and separate multi-part requests", () => {
    const cases = [
      ["quantity", "amount due"],
      ["time", "time the duty begins"],
      ["place", "place where it is performed"],
      ["comparison", "difference between the two practices"],
    ] as const;
    for (const [facet, text] of cases) {
      const parsed = parseQuestionFrame({
        language: "en", kind: "question", question_type: facet === "comparison" ? "comparison" : "general",
        subjects: ["example duty"], requested_points: [{ text, facet }], qualifiers: [],
        search_queries_en: ["direct answer detail"], search_queries_de: [], search_queries_ar: [],
      });
      expect(parsed?.requirements).toEqual([{ id: "R1", text, facet }]);
    }
    const multiple = parseQuestionFrame({
      language: "en", kind: "question", question_type: "reason", subjects: ["example practice"],
      requested_points: [
        { text: "number of permitted times", facet: "quantity" },
        { text: "reason for that number", facet: "reason" },
      ], qualifiers: [], search_queries_en: ["permitted number stated reason"], search_queries_de: [], search_queries_ar: [],
    });
    expect(multiple?.requirements.map(({ id, facet }) => ({ id, facet }))).toEqual([
      { id: "R1", facet: "quantity" },
      { id: "R2", facet: "reason" },
    ]);
  });
  it("keeps repentance conditions and restoring another person's rights as separate points", () => {
    const question = "What are the conditions of sincere repentance, and what should someone do if the sin harmed another person?";
    const conditionsOnly = parseQuestionFrame({
      language: "en", kind: "question", question_type: "practice", subjects: ["sincere repentance"],
      requested_points: [{ text: "conditions of sincere repentance", facet: "conditions" }], qualifiers: [],
      search_queries_en: ["conditions of sincere repentance"], search_queries_de: [], search_queries_ar: [],
    });
    expect(conditionsOnly).not.toBeNull();
    expect(questionFrameMismatch(question, conditionsOnly!)).toBe("repentance_rights_missing");
    const repaired = repairExplicitFrame(question, conditionsOnly!);
    expect(repaired.requirements).toEqual([
      { id: "R1", text: "conditions of sincere repentance", facet: "conditions" },
      { id: "R2", text: "restoring rights after harming another person", facet: "steps" },
    ]);
    expect(questionFrameMismatch(question, repaired)).toBeNull();
  });
  it("keeps the backbiting disclosure ruling separate from repentance conditions", () => {
    const question = "What are the conditions for backbiting repentance, and must the person tell the one they spoke about?";
    const conditionsOnly = parseQuestionFrame({
      language: "en", kind: "question", question_type: "practice", subjects: ["backbiting repentance"],
      requested_points: [{ text: "conditions for backbiting repentance", facet: "conditions" }], qualifiers: [],
      search_queries_en: ["backbiting repentance conditions"], search_queries_de: [], search_queries_ar: [],
    });
    expect(conditionsOnly).not.toBeNull();
    expect(questionFrameMismatch(question, conditionsOnly!)).toBe("backbiting_disclosure_missing");
    const repaired = repairExplicitFrame(question, conditionsOnly!);
    expect(repaired.requirements).toEqual([
      { id: "R1", text: "conditions for backbiting repentance", facet: "conditions" },
      { id: "R2", text: "whether the person must tell the one they spoke about", facet: "ruling" },
    ]);
  });

  it("drops broad searches that would only find mentions of the subject", () => {
    const broad = parseQuestionFrame({
      language: "en",
      kind: "question",
      question_type: "identity",
      subjects: ["Allah", "God in Islam"],
      requested_points: [
        { text: "identity of Allah", facet: "identity" },
        { text: "attributes of Allah", facet: "attributes" },
      ],
      qualifiers: [],
      search_queries_en: ["who is Allah", "attributes Allah Islam", "concept of God in Islam"],
      search_queries_de: ["wer ist Allah", "Gottesbild im Islam"],
      search_queries_ar: ["من هو الله", "صفات الله في الإسلام"],
    })!;
    expect(buildSearchQueries(broad)).toEqual([]);
  });

  it("seals only direct, context-safe evidence", () => {
    const result = parseEvidencePackage({
      status: "ready",
      coverage: "complete",
      conflict: "none",
      assessments: [
        { source_id: "Q9:1", relevance: "direct", supported_requirement_ids: ["R1", "R2"], context_safe: "yes" },
        { source_id: "Q9:2", relevance: "mention_only", supported_requirement_ids: [], context_safe: "yes" },
      ],
    }, frame, candidates);
    expect(result?.passages.map((passage) => passage.id)).toEqual(["Q9:1"]);
  });

  it("derives coverage from assessments when the selector summary contradicts them", () => {
    const result = parseEvidencePackage({
      status: "insufficient",
      coverage: "incomplete",
      conflict: "none",
      assessments: [
        { source_id: "Q9:1", relevance: "direct", supported_requirement_ids: ["R1", "R2"], context_safe: "yes" },
        { source_id: "Q9:2", relevance: "unrelated", supported_requirement_ids: [], context_safe: "yes" },
      ],
    }, frame, candidates);
    expect(result?.passages.map((passage) => passage.id)).toEqual(["Q9:1"]);
  });

  it("refuses when a rejected passage claims to support a requirement", () => {
    expect(parseEvidencePackage({
      status: "ready",
      coverage: "complete",
      conflict: "none",
      assessments: [
        { source_id: "Q9:1", relevance: "direct", supported_requirement_ids: ["R1", "R2"], context_safe: "yes" },
        { source_id: "Q9:2", relevance: "partial", supported_requirement_ids: ["R1"], context_safe: "yes" },
      ],
    }, frame, candidates)).toBeNull();
  });

  it("refuses when a requested point has no direct evidence", () => {
    const result = parseEvidencePackage({
      status: "ready",
      coverage: "complete",
      conflict: "none",
      assessments: [
        { source_id: "Q9:1", relevance: "direct", supported_requirement_ids: ["R1"], context_safe: "yes" },
        { source_id: "Q9:2", relevance: "mention_only", supported_requirement_ids: [], context_safe: "yes" },
      ],
    }, frame, candidates);
    expect(result).toBeNull();
  });

  it("tolerates a repeated or skipped candidate, using only agreed direct verdicts", () => {
    const direct = { source_id: "Q9:1", relevance: "direct", supported_requirement_ids: ["R1", "R2"], context_safe: "yes" };
    const twice = parseEvidencePackage({ status: "ready", coverage: "complete", conflict: "none", assessments: [direct, direct] }, frame, candidates);
    expect(twice?.passages.map((p) => p.id)).toEqual(["Q9:1"]);
    // Repeated with fewer points: only the agreed ids count, so a missing point refuses.
    expect(parseEvidencePackage({ status: "ready", coverage: "complete", conflict: "none", assessments: [direct, { ...direct, supported_requirement_ids: ["R1"] }] }, frame, candidates)).toBeNull();
  });

  it("refuses duplicate, unknown, unsafe or conflicting assessments", () => {
    const base = [
      { source_id: "Q9:1", relevance: "direct", supported_requirement_ids: ["R1", "R2"], context_safe: "yes" },
      { source_id: "Q9:2", relevance: "unrelated", supported_requirement_ids: [], context_safe: "yes" },
    ];
    expect(parseEvidencePackage({ status: "conflicting", coverage: "complete", conflict: "present", assessments: base }, frame, candidates)).toBeNull();
    // Listed twice with different verdicts: not used.
    expect(parseEvidencePackage({ status: "ready", coverage: "complete", conflict: "none", assessments: [base[0], { ...base[0], relevance: "partial" }, base[1]] }, frame, candidates)).toBeNull();
    // An id that was never a candidate.
    expect(parseEvidencePackage({ status: "ready", coverage: "complete", conflict: "none", assessments: [base[0], { ...base[1], source_id: "Q9:99" }] }, frame, candidates)).toBeNull();
    expect(parseEvidencePackage({
      status: "ready",
      coverage: "complete",
      conflict: "none",
      assessments: [{ ...base[0], context_safe: "unsure" }, base[1]],
    }, frame, candidates)).toBeNull();
    expect(parseEvidencePackage({
      status: "ready",
      coverage: "complete",
      conflict: "none",
      assessments: [{ ...base[0], supported_requirement_ids: ["R1", "R9"] }, base[1]],
    }, frame, candidates)).toBeNull();
    expect(parseEvidencePackage({
      status: "ready",
      coverage: "complete",
      conflict: "none",
      assessments: [{ ...base[0], supported_requirement_ids: ["R1", "R1"] }, base[1]],
    }, frame, candidates)).toBeNull();
  });

  it("separates revelation conflict from a checked scholar difference without choosing a winner", () => {
    expect(parseEvidencePackage({
      status: "conflicting", coverage: "complete", conflict_type: "revelation_conflict", assessments: [],
    }, frame, candidates)).toBeNull();
    const scholars = ["a", "b"].map((name, index): PassageForSelection => ({
      id: `S${String(index + 1).repeat(8)}-${String(index + 1).repeat(4)}-4${String(index + 1).repeat(3)}-a${String(index + 1).repeat(3)}-${String(index + 1).repeat(12)}`,
      source: { kind: "scholar", quote: { id: "", scholarId: name, scholarName: { ar: name, en: name, de: name },
        title: name, reference: name, arabic: name, url: `https://example.test/${name}` } }, context: [],
    }));
    const assessments = scholars.map((candidate, index) => ({ source_id: candidate.id, relevance: "direct",
      supported_requirement_ids: ["R1", "R2"], context_safe: "yes", position: `position-${index + 1}` }));
    const result = parseEvidencePackage({ status: "conflicting", coverage: "complete", conflict_type: "scholar_difference", assessments }, frame, scholars);
    expect(result?.scholarDifference?.positions).toEqual({ "position-1": [scholars[0].id], "position-2": [scholars[1].id] });
    expect(parseEvidencePackage({ status: "conflicting", coverage: "complete", conflict_type: "scholar_difference",
      assessments: assessments.map((item) => ({ ...item, position: "same-position" })) }, frame, scholars)).toBeNull();
  });

  it("safely reduces more than eight direct passages without losing requested-point coverage", () => {
    const many = Array.from({ length: 10 }, (_, index): PassageForSelection => ({
      id: `Q9:${index + 1}`,
      source: { kind: "quran", verse: verse(`9:${index + 1}`, `Direct description ${index + 1}`) },
      context: [],
    }));
    const result = parseEvidencePackage({
      status: "ready",
      coverage: "complete",
      conflict: "none",
      assessments: many.map((candidate) => ({
        source_id: candidate.id,
        relevance: "direct",
        supported_requirement_ids: ["R1", "R2"],
        context_safe: "yes",
      })),
    }, frame, many);
    expect(result?.passages).toHaveLength(8);
    expect(result?.passages[0].requirementIds).toEqual(["R1", "R2"]);
  });

  it("starts a large package with the minimum passages that cover every requested point", () => {
    const many = Array.from({ length: 10 }, (_, index): PassageForSelection => ({
      id: `Q10:${index + 1}`,
      source: { kind: "quran", verse: verse(`10:${index + 1}`, `Direct detail ${index + 1}`) },
      context: [],
    }));
    const assessments = many.map((candidate, index) => ({
      source_id: candidate.id,
      relevance: "direct",
      supported_requirement_ids: index === 9 ? ["R1", "R2"] : [index % 2 === 0 ? "R1" : "R2"],
      context_safe: "yes",
    }));
    const result = parseEvidencePackage({ status: "ready", coverage: "complete", conflict: "none", assessments }, frame, many);
    expect(result?.passages[0].id).toBe("Q10:10");
    expect(result?.passages[0].requirementIds).toEqual(["R1", "R2"]);
  });
});
