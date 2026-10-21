import { describe, expect, it } from "vitest";
import { literalBenchmarkPhrases } from "../scripts/probe-ask-search-benchmark";
import { prepareBenchmark } from "../scripts/prepare-ask-search-benchmark";

describe("fixed-question component probe framing",()=>{
  it("retains every question word without deriving queries from source answers",()=>{
    for(const c of prepareBenchmark()) for(const language of ["en","ar","de"] as const) {
      const question=c.questions[language],phrases=literalBenchmarkPhrases(question);
      expect(phrases.join(" ")).toBe(question.trim().replace(/\s+/gu," "));
      expect(phrases.every(p=>p.length<=120)).toBe(true);
      expect(phrases.length).toBeLessThanOrEqual(12);
    }
  });
  it("rejects oversized wording rather than silently dropping part of a question",()=>{
    expect(()=>literalBenchmarkPhrases("word ".repeat(101))).toThrow("question_out_of_bounds");
    expect(()=>literalBenchmarkPhrases("a".repeat(121))).toThrow("word_out_of_bounds");
  });
});
