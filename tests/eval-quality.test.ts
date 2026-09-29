import { describe, expect, it } from "vitest";
import { EVAL_QUESTIONS } from "@/data/eval-questions";
import { scoreAnswer } from "@/scripts/eval-quality";
import type { AskResult } from "@/lib/ask/core";

const gold = EVAL_QUESTIONS.find((item) => item.id === "gold-zakat-conditions-amount-ar")!;
const conversion = EVAL_QUESTIONS.find((item) => item.id === "conversion-guidance-de")!;
function answer(text: string): AskResult {
  return { status: "answer", answer: {
    language: "ar", claims: [{ text, refs: ["S1"] }],
    direct_answer: [{ text, source_ids: ["S1"] }], explanation: [], not_established: [], evidence: [{
      kind: "scholar", key: "S1", scholarId: "example", scholarName: "Scholar", title: null,
      reference: "Test", arabic: "Test", url: "https://example.test",
    }], attribution: { text: "Test", url: "https://example.test" }, model: "test", verifier: "test",
  } };
}

describe("focused answer quality warnings", () => {
  it("flags conversion wording that mentions the testimony but omits Muhammad", () => {
    const score = scoreAnswer(conversion, answer("Das Glaubensbekenntnis sagt, dass es keine Gottheit außer Allah gibt."));
    expect(score.missingPoints).toContain("Muhammad named in testimony");
  });
  it("flags a threshold answer that omits the gold zakat rate", () => {
    const score = scoreAnswer(gold, answer("مقدارها نصاب عشرون مثقال"));
    expect(score.completeness).toBe("fail");
    expect(score.accuracy).toBe("fail");
    expect(score.clarity).toBe("review");
  });
  it("recognizes the payable rate without claiming human accuracy review", () => {
    const score = scoreAnswer(gold, answer("الواجب ربع العشر بعد تحقق الشروط"));
    expect(score.completeness).toBe("pass");
    expect(score.accuracy).toBe("review");
    expect(score.sourceSupport).toBe("review");
  });
});
