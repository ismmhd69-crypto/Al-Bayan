// Rules every scholar quote must pass before the evidence check may see it (defence in depth: the
// database already enforces most of this). Pure, so it can be tested.

import { normalizeArabic } from "@/lib/ask/checks";
import { MAX_QUOTE_CHARS } from "./scholar-excerpt";

export type ScholarQuote = {
  id: string; // "S" + database id
  scholarId: string;
  scholarName: { ar: string; en: string; de: string };
  title: string | null; // the fatwa's question or heading, as on the original page
  reference: string; // printed source, e.g. "مجموع فتاوى ومقالات الشيخ ابن باز (6/ 298)"
  arabic: string; // the scholar's own words, unchanged, at most 600 characters
  url: string; // the original fatwa page
};

// Scholars whose quotes are collected so far, with their official sites (Mo's choice, 2026-09-28).
// Permanent Committee fatwas (alifta.gov.sa) may be stored under a signatory who is on this list.
export const QUOTE_SITES: Record<string, string[]> = {
  "ibn-baz": ["binbaz.org.sa", "alifta.gov.sa"],
  "ibn-uthaymeen": ["binothaimeen.net"],
  "al-albani": ["al-albany.com"],
  "al-fawzan": ["alfawzan.af.org.sa", "alifta.gov.sa"],
};

export function scholarQuoteAllowed(q: ScholarQuote): boolean {
  const sites = QUOTE_SITES[q.scholarId];
  if (!sites) return false;
  let host: string;
  try {
    const u = new URL(q.url);
    if (u.protocol !== "https:") return false;
    host = u.hostname.replace(/^www\./, "");
  } catch {
    return false;
  }
  if (!sites.includes(host)) return false;
  const text = q.arabic.trim();
  return /^S[0-9a-f-]{36}$/.test(q.id) && text.length > 0 && text.length <= MAX_QUOTE_CHARS && /[؀-ۿ]/.test(text);
}

// Small words that would match almost every quote.
const STOP = new Set(["من", "في", "عن", "على", "الى", "ما", "هل", "هو", "هي", "او", "ان", "لا", "مع", "ذلك", "هذا"]);

// Turns the question's Arabic search phrases into a database search: words of one phrase must all
// appear (AND), any phrase may match (OR). Same letter unification as the stored search text.
export function toSearchQuery(phrases: string[]): string {
  const parts = phrases
    .map((p) =>
      (normalizeArabic(p).match(/[ء-ي]+/g) ?? [])
        .map((w) => w.replace(/^(وال|بال|فال|كال|لل|ال)(?=.{3,})/, ""))
        .filter((w) => w.length >= 2 && !STOP.has(w))
        .join(" "),
    )
    .filter((p) => p.length > 0);
  return [...new Set(parts)].slice(0, 6).join(" or ");
}

