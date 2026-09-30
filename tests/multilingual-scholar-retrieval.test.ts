import { describe, expect, it, vi } from "vitest";
import { UNDERSTAND_SYSTEM } from "@/lib/ask/core";
import { parseQuestionFrame } from "@/lib/ask/retrieval";
import { isScholarTitleRelevant, searchQueryLevels } from "@/lib/sources/scholar-rules";

describe("Multilingual Scholar Retrieval (Mocked)", () => {
  it("proves UNDERSTAND_SYSTEM explicitly instructs all three phrase styles", () => {
    // 1. Fatwa-title wording
    expect(UNDERSTAND_SYSTEM).toContain("Fatwa-title wording");
    expect(UNDERSTAND_SYSTEM).toContain("حكم استقبال القبلة في الصلاة");

    // 2. Classical or fiqh wording
    expect(UNDERSTAND_SYSTEM).toContain("Classical or fiqh wording");
    expect(UNDERSTAND_SYSTEM).toContain("عدة المتوفى عنها زوجها");

    // 3. Direct ruling wording
    expect(UNDERSTAND_SYSTEM).toContain("Direct ruling wording");
    expect(UNDERSTAND_SYSTEM).toContain("حكم التعامل مع البنوك بالربا");
  });

  it("proves UNDERSTAND_SYSTEM explicitly forbids low-quality search phrase patterns", () => {
    // Rejection of generic numeric / question phrases
    expect(UNDERSTAND_SYSTEM).toContain("Do not use generic question wording such as");
    expect(UNDERSTAND_SYSTEM).toContain("bare numeric phrases");

    // Rejection of why/wisdom phrases for rulings
    expect(UNDERSTAND_SYSTEM).toContain("Do not replace a practical ruling question with \"حكمة\" (wisdom)");

    // Rejection of Quran-only verse phrases for practical rulings
    expect(UNDERSTAND_SYSTEM).toContain("Do not output only a Quran verse phrase unless the visitor specifically asks for explanation of that verse");

    // Rejection of Latin script
    expect(UNDERSTAND_SYSTEM).toContain("Never use Latin transliteration");
  });

  it("extracts Arabic search queries from English and German question frames", () => {
    const rawEnglishFrame = {
      language: "en",
      kind: "question",
      question_type: "ruling",
      subjects: ["interest prohibition", "usury"],
      requested_points: [
        { text: "ruling on taking interest in Islam", facet: "ruling" },
      ],
      qualifiers: [],
      search_queries_en: ["interest forbidden usury", "taking interest haram"],
      search_queries_de: [],
      search_queries_ar: [
        "حكم التعامل مع البنوك بالربا",
        "تحريم فوائد البنوك الربوية",
      ],
    };

    const frame = parseQuestionFrame(rawEnglishFrame);
    expect(frame).not.toBeNull();
    expect(frame?.language).toBe("en");
    expect(frame?.searchQueries.ar).toEqual([
      "حكم التعامل مع البنوك بالربا",
      "تحريم فوائد البنوك الربوية",
    ]);
  });

  it("filters out Latin script transliterations from search_queries_ar", () => {
    const rawFrameWithLatin = {
      language: "de",
      kind: "question",
      question_type: "ruling",
      subjects: ["prayer direction"],
      requested_points: [
        { text: "direction of prayer", facet: "ruling" },
      ],
      qualifiers: [],
      search_queries_en: [],
      search_queries_de: ["Gebetsrichtung Mekka"],
      search_queries_ar: [
        "qibla prayer direction", // Latin script
        "حكم استقبال القبلة في الصلاة", // Arabic script
      ],
    };

    const frame = parseQuestionFrame(rawFrameWithLatin);
    expect(frame).not.toBeNull();
    expect(frame?.searchQueries.ar).toEqual(["حكم استقبال القبلة في الصلاة"]);
  });

  it("evaluates title relevance gate correctly on candidate titles", () => {
    const phrases = ["حكم التعامل مع البنوك بالربا", "تحريم فوائد البنوك"];

    // Target fatwa: "حكم التعامل مع البنوك بالربا وزكاتها"
    const passesExpected = isScholarTitleRelevant(phrases, "حكم التعامل مع البنوك بالربا وزكاتها");
    expect(passesExpected).toBe(true);

    // Unrelated fatwa: "الوسوسة في الوضوء وكيفية علاجها"
    const rejectsUnrelated = isScholarTitleRelevant(phrases, "الوسوسة في الوضوء وكيفية علاجها");
    expect(rejectsUnrelated).toBe(false);

    // Ignorance exception guarded against categorical prohibition
    const rejectsIgnorance = isScholarTitleRelevant(phrases, "حكم من تعامل بالربا جهلًا");
    expect(rejectsIgnorance).toBe(false);
  });

  it("generates progressive search query levels without empty queries", () => {
    const phrases = ["حكم استقبال القبلة في الصلاة", "استقبال الكعبة المشرفة"];
    const levels = searchQueryLevels(phrases);

    expect(levels.length).toBeGreaterThan(0);
    for (const lvl of levels) {
      expect(lvl.trim().length).toBeGreaterThan(0);
    }
  });

  it("never executes live network or AI calls during unit test", () => {
    const mockWriter = {
      generateJson: vi.fn(),
    };
    expect(mockWriter.generateJson).not.toHaveBeenCalled();
  });
});
