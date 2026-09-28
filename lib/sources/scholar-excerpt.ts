// Rules for scholar quotes (Mo's decisions, 2026-09-28): short quotes only, at most 600 characters
// of the scholar's own answer, unchanged, with the printed source and a link to the original page.
// Pure functions with no network access, so they can be tested (tests/scholar-excerpt.test.ts).

import { normalizeArabic } from "@/lib/ask/checks";

export const MAX_QUOTE_CHARS = 600;

// Removes tags and footnote markers, decodes the few entities these pages use, and collapses
// whitespace. Words and punctuation are never changed.
export function htmlToText(html: string): string {
  return html
    .replace(/<sup[\s\S]*?<\/sup>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}

// Opening words of a question or of a letter written TO the scholar.
export function looksLikeQuestion(text: string): boolean {
  const start = text.trim().slice(0, 300);
  if (/^(سماحة|فضيلة|صاحب الفضيلة|السلام عليكم|سؤال|السؤال|س\s*[:：]|ما حكم|ما هو|ما هي|هل|يقول السائل|يسأل)/.test(start)) return true;
  return /[؟?]/.test(start);
}

// The printed collection reference, when the footnote names Majmu' Fatawa Ibn Baz.
export function printedCollection(cite: string | null): { reference: string; collection: string } | null {
  const m = cite?.match(/مجموع فتاوى ومقالات[^()]*?ابن باز\s*\(?\s*(\d+)\s*\/\s*(\d+)\s*\)?/);
  if (!m) return null;
  return { reference: `مجموع فتاوى ومقالات الشيخ ابن باز (${m[1]}/ ${m[2]})`, collection: "مجموع فتاوى ومقالات الشيخ ابن باز" };
}

export type ParsedFatwa = {
  title: string;
  answer: string; // the scholar's answer only (the question is left out)
  printedSource: string | null; // e.g. "مجموع فتاوى ومقالات الشيخ ابن باز (6/ 298)"
};

// binbaz.org.sa fatwa page: <article class="fatwa"> ... <section class="footnotes"><cite>source</cite>.
export function parseBinBazFatwa(html: string): ParsedFatwa | null {
  const start = html.indexOf('<article class="fatwa"');
  if (start < 0) return null;
  const end = html.indexOf("</article>", start);
  const article = html.slice(start, end < 0 ? undefined : end);
  const title = htmlToText(article.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "");
  const cite = article.match(/<section class="footnotes">[\s\S]*?<cite>([\s\S]*?)<\/cite>/i)?.[1];
  const body = htmlToText(
    article
      .replace(/<section class="footnotes">[\s\S]*$/i, "")
      .replace(/<h1[\s\S]*?<\/h1>/i, "")
      // audio player and download buttons of radio-programme fatwas
      .replace(/<(audio|button)[\s\S]*?<\/\1>/gi, ""),
  )
    .replace(/play\s+max\s+volume/gi, "")
    .replace(/تحميل المادة/g, "");
  // Question-and-answer formats: keep only what follows the answer mark ("ج:" or "الجواب:").
  const answerMark = body.search(/(^|\s)(ج|الجواب)\s*[:：]/);
  // Without an answer mark the whole text must be the Shaykh's own words. A page that opens with a
  // question or a letter addressed to him is skipped: his name must never carry someone else's words.
  if (answerMark < 0 && looksLikeQuestion(body)) return null;
  let answer = (answerMark >= 0 ? body.slice(answerMark).replace(/^\s*(ج|الجواب)\s*[:：]\s*/, "") : body).trim();
  // Radio programmes continue with the presenter or a follow-up question: stop the answer there.
  const dialogue = answer.search(/(^|\s)(الشيخ|المقدم|السائل|السؤال|سؤال|س)\s*[:：]/);
  if (dialogue > 0) answer = answer.slice(0, dialogue).trim();
  if (!title || answer.length < 40) return null;
  return { title, answer, printedSource: cite ? htmlToText(cite).replace(/\.$/, "") : null };
}

// The first part of the answer, ending at a sentence end, at most `max` characters. Never cuts
// inside a sentence: if no sentence end fits, nothing is returned (the fatwa is skipped).
export function excerpt(answer: string, max = MAX_QUOTE_CHARS): string | null {
  const text = answer.replace(/\s*\n\s*/g, " ").trim();
  if (text.length <= max) return text;
  const window = text.slice(0, max);
  let cut = -1;
  for (const m of window.matchAll(/[.!؟?](?=\s|$)/g)) cut = m.index! + 1;
  if (cut < 120) return null; // too little meaning survives; skip rather than mislead
  return window.slice(0, cut).trim();
}

// Search-only copy (never shown): no vowel marks, unified letters, no punctuation, at most `max`
// characters, so that whole-word database search finds "الصيام" in "والصيام" style text too.
export function searchText(title: string, quote: string, max = MAX_QUOTE_CHARS): string {
  const words = normalizeArabic(`${title} ${quote}`).match(/[ء-ي]+/g) ?? [];
  const withStems = words.flatMap((w) => {
    const bare = w.replace(/^(وال|بال|فال|كال|لل|ال|و|ف|ب|ل)(?=.{3,})/, "");
    return bare !== w ? [w, bare] : [w];
  });
  let out = "";
  for (const w of withStems) {
    if (out.length + w.length + 1 > max) break;
    out += (out ? " " : "") + w;
  }
  return out;
}
