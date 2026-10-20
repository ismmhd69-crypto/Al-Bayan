import type { SearchLanguage } from "./contract";

export type EvidenceUnit = { id: string; acceptablePassageIds: string[]; essentialQualification: string | null };
export type BenchmarkIntent = {
  id: string; split: "tuning" | "held_out"; category: string;
  questions: Record<SearchLanguage, string>; concerns: string[];
  corpusAnswerability: "yes" | "no" | "unknown";
  sourceReview: { status: "pending" | "accepted"; reviewer: string | null; at: string | null; indexGeneration: string | null };
  evidenceUnits: EvidenceUnit[];
};
export type RetrievalMeasurement = { intentId: string; language: SearchLanguage; indexGeneration: string; rankedPassageIds: string[] };

export function validateBenchmark(cases: BenchmarkIntent[]) {
  if (!Array.isArray(cases) || new Set(cases.map(c => c.id)).size !== cases.length) throw new Error("duplicate_benchmark_intent");
  const questions = new Set<string>();
  for (const c of cases) {
    if (!c.id || !["tuning", "held_out"].includes(c.split) || !c.category || !c.concerns.length) throw new Error("invalid_benchmark_contract");
    for (const lang of ["ar", "en", "de"] as const) {
      const q = c.questions[lang]?.trim(); if (!q || questions.has(q)) throw new Error("duplicate_or_missing_benchmark_question"); questions.add(q);
    }
    if (new Set(c.evidenceUnits.map(u => u.id)).size !== c.evidenceUnits.length || c.evidenceUnits.some(u => !u.id || !u.acceptablePassageIds.length || new Set(u.acceptablePassageIds).size !== u.acceptablePassageIds.length)) throw new Error("invalid_evidence_units");
    if (c.sourceReview.status === "accepted" && (!c.sourceReview.reviewer || !Number.isFinite(Date.parse(c.sourceReview.at ?? "")) || !c.sourceReview.indexGeneration || c.corpusAnswerability === "unknown" || (c.corpusAnswerability === "yes" && !c.evidenceUnits.length))) throw new Error("unsubstantiated_benchmark_review");
  }
}

/** Unreviewed questions and unknown corpus coverage never enter accuracy claims. */
export function retrievalBenchmark(cases: BenchmarkIntent[], results: RetrievalMeasurement[], cutoff = 30) {
  validateBenchmark(cases);
  if (!Number.isSafeInteger(cutoff) || cutoff < 1 || cutoff > 120) throw new Error("invalid_benchmark_cutoff");
  const keys = results.map(r => `${r.intentId}:${r.language}`);
  if (new Set(keys).size !== keys.length || results.some(r => !cases.some(c => c.id === r.intentId) || !["ar", "en", "de"].includes(r.language) || new Set(r.rankedPassageIds).size !== r.rankedPassageIds.length)) throw new Error("invalid_benchmark_measurement");
  const rows = cases.flatMap(c => (["ar", "en", "de"] as const).map(language => {
    const result = results.find(r => r.intentId === c.id && r.language === language);
    const reviewed = c.sourceReview.status === "accepted" && c.corpusAnswerability === "yes";
    const comparable = reviewed && !!result && result.indexGeneration === c.sourceReview.indexGeneration;
    const ids = new Set(result?.rankedPassageIds.slice(0, cutoff));
    const found = comparable ? c.evidenceUnits.filter(u => u.acceptablePassageIds.some(id => ids.has(id))).length : 0;
    return { intentId: c.id, language, split: c.split, status: !reviewed ? "unreviewed_or_unanswerable" : !result ? "not_run" : !comparable ? "index_mismatch" : "measured", evidenceUnits: comparable ? c.evidenceUnits.length : 0, found };
  }));
  const measured = rows.filter(r => r.status === "measured");
  const total = measured.reduce((n, r) => n + r.evidenceUnits, 0), found = measured.reduce((n, r) => n + r.found, 0);
  return { cutoff, intents: cases.length, languageVersions: cases.length * 3, reviewedIntents: cases.filter(c => c.sourceReview.status === "accepted").length,
    measuredVersions: measured.length, expectedReviewedAnswerableVersions: rows.filter(r => r.status !== "unreviewed_or_unanswerable").length,
    incompleteEvaluation: rows.some(r => r.status === "not_run" || r.status === "index_mismatch") || cases.some(c => c.sourceReview.status !== "accepted"),
    evidenceUnits: total, found, recall: total ? found / total : null,
    rows, qualification: "Retrieval recall over the measured reviewed corpus-answerable subset, not answer accuracy or religious acceptance. Missing runs and unreviewed labels are reported separately.",
  };
}
