import type { EvalQuestion } from "../data/eval-questions";
import type { AskResult } from "../lib/ask/core";

export type QualityScore = {
  accuracy: "pass" | "fail" | "review";
  completeness: "pass" | "fail" | "review";
  sourceSupport: "pass" | "fail" | "review";
  clarity: "review";
  missingPoints: string[];
  traps: string[];
};

/** Deterministic warning checks. Mo reviews meaning, citations and readability. */
export function scoreAnswer(question: EvalQuestion, result: AskResult): QualityScore {
  if (result.status !== "answer") {
    return {
      accuracy: "review", completeness: question.expect === "answer" ? "fail" : "review",
      sourceSupport: "review", clarity: "review",
      missingPoints: question.mustContain?.map((item) => item.point) ?? [], traps: [],
    };
  }
  const text = result.answer.claims.map((claim) => claim.text).join(" ").toLocaleLowerCase(question.lang);
  const missingPoints = (question.mustContain ?? []).filter((item) => !item.anyOf.some((phrase) => text.includes(phrase.toLocaleLowerCase(question.lang)))).map((item) => item.point);
  const traps = (question.mustNotConfuse ?? []).filter((item) => new RegExp(item.pattern, "iu").test(text)).map((item) => item.trap);
  const cited = result.answer.claims.length > 0
    && result.answer.claims.every((claim) => claim.refs.length > 0)
    && result.answer.evidence.length > 0;
  return {
    accuracy: traps.length ? "fail" : "review",
    completeness: question.mustContain?.length ? (missingPoints.length ? "fail" : "pass") : "review",
    sourceSupport: cited ? "review" : "fail",
    clarity: "review", missingPoints, traps,
  };
}
