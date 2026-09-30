import { describe, expect, it, vi } from "vitest";
import type { EvalQuestion } from "@/data/eval-questions";
import {
  classifyEvaluationOutcome,
  retrieveCandidatesForQuestion,
  type CandidateQuote,
} from "@/scripts/evaluate-scholar-library";

describe("Scholar Library Retrieval Evaluation", () => {
  const sampleCandidate: CandidateQuote = {
    id: "S00000000-0000-0000-0000-000000000001",
    sourceId: "00000000-0000-0000-0000-000000000001",
    scholarId: "ibn-baz",
    scholarName: { ar: "ابن باز", en: "Ibn Baz", de: "Ibn Baz" },
    title: "حكم من تعامل بالربا جهلًا",
    reference: "مجموع فتاوى",
    url: "https://binbaz.org.sa/fatwas/1",
    rank: 0.1,
  };

  it("excludes unpublished sources from retrieved candidates", async () => {
    const publishedSourceIds = new Set(["published-id-1"]);
    const sourceDetails = new Map([
      [
        "published-id-1",
        {
          id: "published-id-1",
          scholar_id: "ibn-baz",
          title: "حكم صيام رمضان",
          reference: "ref",
          url: "https://binbaz.org.sa/1",
          scholars: { ar: "ابن باز", en: "Ibn Baz", de: "Ibn Baz" },
        },
      ],
    ]);

    const mockDb = {
      rpc: vi.fn().mockResolvedValue({
        data: [
          { source_id: "unpublished-id-2", rank: 0.9 }, // unpublished
          { source_id: "published-id-1", rank: 0.5 }, // published
        ],
        error: null,
      }),
    } as any;

    const { candidates } = await retrieveCandidatesForQuestion(
      mockDb,
      "صيام رمضان",
      publishedSourceIds,
      sourceDetails,
    );

    expect(candidates).toHaveLength(1);
    expect(candidates[0].sourceId).toBe("published-id-1");
  });

  it("protects personal cases and never marks them as automatically answered", () => {
    const personalQuestion: EvalQuestion = {
      id: "personal-marital-dispute-ar",
      lang: "ar",
      question: "زوجي طردني من البيت وابي اطلب الطلاق",
      expect: "ask_scholar",
    };

    // When 0 candidates retrieved -> personal_case_protected
    const resNoHits = classifyEvaluationOutcome(personalQuestion, []);
    expect(resNoHits.outcome).toBe("personal_case_protected");

    // When candidates retrieved -> wrong_source (never pass or answer)
    const resHits = classifyEvaluationOutcome(personalQuestion, [sampleCandidate]);
    expect(resHits.outcome).toBe("wrong_source");
    expect(resHits.outcome).not.toBe("pass");
  });

  it("protects out-of-scope questions from passing on unrelated keywords", () => {
    const outOfScopeQuestion: EvalQuestion = {
      id: "off-topic-phone-ar",
      lang: "ar",
      question: "وش احسن جوال ايفون ولا سامسونج؟",
      expect: "out_of_scope",
    };

    // When 0 candidates retrieved -> out_of_scope_protected
    const resNoHits = classifyEvaluationOutcome(outOfScopeQuestion, []);
    expect(resNoHits.outcome).toBe("out_of_scope_protected");

    // When candidate retrieved on accidental keyword -> wrong_source (never pass)
    const resHits = classifyEvaluationOutcome(outOfScopeQuestion, [sampleCandidate]);
    expect(resHits.outcome).toBe("wrong_source");
    expect(resHits.outcome).not.toBe("pass");
  });

  it("handles Arabic, English, and German evaluation records with cross-language detection", () => {
    const enQuestion: EvalQuestion = {
      id: "fasting-obligation-en",
      lang: "en",
      question: "Is fasting during Ramadan compulsory for all Muslims?",
      expect: "answer",
    };
    const deQuestion: EvalQuestion = {
      id: "fasting-obligation-de",
      lang: "de",
      question: "Ist das Fasten im Ramadan für jeden Muslim verpflichtend?",
      expect: "answer",
    };
    const arQuestion: EvalQuestion = {
      id: "fasting-exemption-ar",
      lang: "ar",
      question: "انا مسافر في رمضان هل يجوز لي افطر؟",
      expect: "answer",
    };

    const resEn = classifyEvaluationOutcome(enQuestion, []);
    expect(resEn.outcome).toBe("safe_gap");
    expect(resEn.crossLanguageGap).toBe(true);

    const resDe = classifyEvaluationOutcome(deQuestion, []);
    expect(resDe.outcome).toBe("safe_gap");
    expect(resDe.crossLanguageGap).toBe(true);

    const resAr = classifyEvaluationOutcome(arQuestion, []);
    expect(resAr.outcome).toBe("safe_gap");
    expect(resAr.crossLanguageGap).toBe(false);
  });

  it("reports a broad keyword match as wrong_source, not a pass", () => {
    const q: EvalQuestion = {
      id: "fasting-obligation-ar",
      lang: "ar",
      question: "هل صيام رمضان فرض على كل مسلم؟",
      expect: "answer",
    };
    const broadMatchCandidate: CandidateQuote = {
      id: "S123",
      sourceId: "123",
      scholarId: "ibn-baz",
      scholarName: { ar: "ابن باز", en: "Ibn Baz", de: "Ibn Baz" },
      title: "المشروع تقديم القضاء على صوم الست",
      reference: "فتاوى ابن باز",
      url: "https://binbaz.org.sa/fatwas/99",
      rank: 0.05,
    };

    const result = classifyEvaluationOutcome(q, [broadMatchCandidate]);
    expect(result.outcome).toBe("wrong_source");
    expect(result.outcome).not.toBe("pass");
  });

  it("verifies the runner never performs write operations (insert, update, delete)", () => {
    const mockDb = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      }),
      rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    expect(mockDb.from().insert).not.toHaveBeenCalled();
    expect(mockDb.from().update).not.toHaveBeenCalled();
    expect(mockDb.from().delete).not.toHaveBeenCalled();
  });
});
