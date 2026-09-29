// Word matching for prepared answers (step 1; the checker model confirms in step 2). No network.
import { describe, expect, it } from "vitest";
import { bestWording, similarity } from "@/lib/prepared-match";

const answers = {
  "how-to-repent": { questions: { en: ["How do I repent from sins?", "What are the conditions of repentance?"], ar: ["ما شروط التوبة؟", "كيف أتوب من الذنوب؟"], de: ["Wie bereue ich meine Sünden?"] } },
  "zakat-gold": { questions: { en: ["How much zakat is due on gold?"], ar: ["كم زكاة الذهب؟"], de: ["Wie viel Zakat zahlt man auf Gold?"] } },
};

describe("prepared answer matching", () => {
  it("matches the same question in other words and languages", () => {
    expect(bestWording("what are the conditions for repentance", answers)?.id).toBe("how-to-repent");
    expect(bestWording("ما هي شروط التوبة", answers)?.id).toBe("how-to-repent");
    expect(bestWording("Wie viel Zakat auf Gold?", answers)?.id).toBe("zakat-gold");
  });
  it("does not match unrelated questions", () => {
    expect(bestWording("Is music haram?", answers)).toBeNull();
    expect(bestWording("How much zakat is due on silver jewellery kept for my daughter?", answers)).toBeNull();
  });
  it("ignores filler words", () => {
    expect(similarity("What is zakat on gold in Islam?", "zakat gold")).toBe(1);
  });
});
