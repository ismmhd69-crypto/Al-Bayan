/** Ranking is only discovery metadata. Ignore an extra non-candidate ID only
 * when EVERY supplied candidate still has exactly one valid score. Never
 * promote a context reference, guess a missing score or resolve duplicates. */
export function checkedRerankerScores(raw: unknown, candidateIds: string[]) {
  if (!candidateIds.length || candidateIds.length > 120 || new Set(candidateIds).size !== candidateIds.length
    || !Array.isArray(raw) || raw.length < candidateIds.length || raw.length > 240) throw new Error("invalid_reranker_result");
  const expected = new Set(candidateIds), seen = new Set<string>();
  const scores: { id: string; score: number }[] = [];
  let ignoredUnknownCount = 0;
  for (const row of raw) {
    if (!row || typeof row !== "object" || typeof row.id !== "string" || !row.id || row.id.length > 1000
      || seen.has(row.id) || typeof row.score !== "number" || !Number.isFinite(row.score) || row.score < 0 || row.score > 100) throw new Error("invalid_reranker_result");
    seen.add(row.id);
    if (expected.has(row.id)) scores.push({ id: row.id, score: row.score });
    else ignoredUnknownCount++;
  }
  if (scores.length !== candidateIds.length) throw new Error("invalid_reranker_result");
  return { scores, ignoredUnknownCount };
}
