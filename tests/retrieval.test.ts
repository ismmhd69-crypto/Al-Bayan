import { describe, expect, it } from "vitest";
import {
  buildSearchQueries,
  parseEvidencePackage,
  parseQuestionFrame,
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
  required_facets: ["identity", "attributes"],
  qualifiers: [],
  search_queries_en: ["unique lasting qualities", "example subject guiding role"],
  search_queries_de: ["besondere bleibende merkmale"],
  search_queries_ar: ["وصف مميز دائم"],
})!;

const candidates: PassageForSelection[] = [
  { id: "Q9:1", verse: verse("9:1", "The subject is described directly"), context: [] },
  { id: "Q9:2", verse: verse("9:2", "A different group is discussed and the subject is only named"), context: [] },
];

describe("structured retrieval", () => {
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

  it("drops broad searches that would only find mentions of the subject", () => {
    const broad = parseQuestionFrame({
      language: "en",
      kind: "question",
      question_type: "identity",
      subjects: ["Allah", "God in Islam"],
      required_facets: ["identity", "attributes"],
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
        { source_id: "Q9:1", relevance: "direct", supported_facets: ["identity", "attributes"], context_safe: "yes" },
        { source_id: "Q9:2", relevance: "mention_only", supported_facets: [], context_safe: "yes" },
      ],
    }, frame, candidates);
    expect(result?.passages.map((passage) => passage.id)).toEqual(["Q9:1"]);
  });

  it("refuses when a required facet has no direct evidence", () => {
    const result = parseEvidencePackage({
      status: "ready",
      coverage: "complete",
      conflict: "none",
      assessments: [
        { source_id: "Q9:1", relevance: "direct", supported_facets: ["identity"], context_safe: "yes" },
        { source_id: "Q9:2", relevance: "mention_only", supported_facets: [], context_safe: "yes" },
      ],
    }, frame, candidates);
    expect(result).toBeNull();
  });

  it("refuses duplicate, unknown, unsafe or conflicting assessments", () => {
    const base = [
      { source_id: "Q9:1", relevance: "direct", supported_facets: ["identity", "attributes"], context_safe: "yes" },
      { source_id: "Q9:2", relevance: "unrelated", supported_facets: [], context_safe: "yes" },
    ];
    expect(parseEvidencePackage({ status: "conflicting", coverage: "complete", conflict: "present", assessments: base }, frame, candidates)).toBeNull();
    expect(parseEvidencePackage({ status: "ready", coverage: "complete", conflict: "none", assessments: [base[0], base[0]] }, frame, candidates)).toBeNull();
    expect(parseEvidencePackage({
      status: "ready",
      coverage: "complete",
      conflict: "none",
      assessments: [{ ...base[0], context_safe: "unsure" }, base[1]],
    }, frame, candidates)).toBeNull();
  });
});
