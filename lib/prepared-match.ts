import type { Locale } from "@/lib/i18n";
import { normalizeArabic } from "@/lib/ask/checks";

// Matching a visitor's question to a prepared answer (Mo, 2026-09-29: prepared answers first).
// Step 1 here (pure, testable): word overlap with the answer's stored question wordings.
// Step 2 (in pipeline.ts): the checker model must confirm it is the same question; otherwise the
// normal live pipeline answers. Both steps fail closed.

const STOP = new Set([
  "the", "a", "an", "is", "are", "in", "of", "to", "do", "does", "i", "my", "what", "how", "can", "it", "for", "on", "and", "or", "islam", "muslim", "muslims",
  "der", "die", "das", "ist", "ein", "eine", "im", "in", "zu", "und", "oder", "wie", "was", "ich", "man", "kann", "darf", "islam", "muslim", "muslime",
  "ما", "هل", "في", "من", "عن", "على", "كيف", "هو", "هي", "او", "و", "ان", "الاسلام", "المسلم",
]);

export function words(text: string): Set<string> {
  const base = normalizeArabic(text.toLocaleLowerCase())
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^(وال|بال|فال|كال|لل|ال)(?=.{3,})/, ""))
    .filter((w) => w.length >= 2 && !STOP.has(w));
  return new Set(base);
}

/** Dice similarity of the meaningful words (0 to 1). */
export function similarity(a: string, b: string): number {
  const x = words(a), y = words(b);
  if (x.size === 0 || y.size === 0) return 0;
  let shared = 0;
  for (const w of x) if (y.has(w)) shared++;
  return (2 * shared) / (x.size + y.size);
}

export type MatchCandidate = { id: string; language: Locale; wording: string; score: number };

/** The best stored wording for the question, if it is clearly similar (score at least `min`). */
export function bestWording(
  question: string,
  answers: Record<string, { questions?: Partial<Record<Locale, string[]>> }>,
  min = 0.6,
): MatchCandidate | null {
  let best: MatchCandidate | null = null;
  for (const [id, file] of Object.entries(answers)) {
    for (const [language, list] of Object.entries(file.questions ?? {}) as [Locale, string[]][]) {
      for (const wording of list ?? []) {
        const score = similarity(question, wording);
        if (score >= min && (!best || score > best.score)) best = { id, language, wording, score };
      }
    }
  }
  return best;
}
