import { describe, expect, it } from "vitest";
import { EVAL_QUESTIONS } from "@/data/eval-questions";
import { scoreAnswer } from "@/scripts/eval-quality";
import type { AskResult } from "@/lib/ask/core";

const gold = EVAL_QUESTIONS.find((item) => item.id === "gold-zakat-conditions-amount-ar")!;
function answer(text: string): AskResult {
  return { status: "answer", answer: {
    language: "ar", claims: [{ text, refs: ["S1"] }], evidence: [{
      kind: "scholar", key: "S1", scholarId: "example", scholarName: "Scholar", title: null,
      reference: "Test", arabic: "Test", url: "https://example.test",
    }], attribution: { text: "Test", url: "https://example.test" }, model: "test", verifier: "test",
  } };
}

describe("focused answer quality warnings", () => {
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
