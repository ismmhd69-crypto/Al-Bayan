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
  // Mo, 2026-09-28: Committee fatwas credited to the Committee, approved signatories in the reference.
  "permanent-committee": ["alifta.gov.sa"],
  "al-barrak": ["sh-albarrak.com"],
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

// Small words that would match almost every quote or non-substantive question particles.
export const STOP = new Set([
  "من", "في", "عن", "على", "الى", "ما", "هل", "هو", "هي", "او", "ان", "لا", "مع", "ذلك", "هذا", "هذه", "هولاء", "تلك", "الذي", "التي", "الذين",
  "كم", "متى", "اين", "كيف", "لماذا", "ماذا", "اي", "ايه", "ماهو", "ماهي", "مما", "عما", "بما", "فيما",
]);

// Question-frame, procedural, numeric, or frequency words that are not substantive Islamic subjects.
export const GENERIC = new Set([
  "حكم", "احكام", "ادله", "دليل", "مشروعيه", "جواز", "يجوز", "معني", "كيفيه", "شروط", "شرط", "احاديث", "حديث",
  "قول", "اقوال", "راي", "بيان", "توضيح", "فتوى", "فتاوى", "سؤال", "مساله",
  "مره", "مرات", "عدد", "مقدار", "نسبه", "كميه", "واحد", "اثنين", "ثلاثه", "اربعه", "خمسه", "ست", "سته", "سبع", "سبعه", "ثمانيه", "تسعه", "عشره",
  "يحق", "يجب", "شخص", "احد", "شيء", "امر", "امور", "ناس", "انسان", "عمل", "اعمال", "كل", "جميع", "بعض", "غير", "بين", "عند", "قبل", "بعد",
  "اسلام", "مسلم", "مسلمين", "دين", "شريعه",
]);

// Islamic domain keyword signatures to prevent cross-domain collisions
const DOMAINS: Record<string, Set<string>> = {
  purification: new Set(["وضأ", "طهاره", "نجاسه", "تيمم", "حدث", "جبيره", "استنجاء", "حيض", "نفاس", "سلس", "وسوسه"]),
  marriage_divorce: new Set(["نكاح", "طلق", "زوج", "عده", "خلع", "فسخ", "صداق", "مهر", "رجعه", "رجعي", "ايلاء", "ظهار"]),
  prayer: new Set(["صلو", "اذان", "اقامه", "ركوع", "سجود", "تشهد", "سهو", "قصر", "جمعه", "جماعه", "وتر", "تراويح"]),
  fasting: new Set(["صوم", "رمضان", "سحور", "افطار", "فطر", "اعتكاف"]),
  zakah_finance: new Set(["زكاه", "صدقه", "نصاب", "ربا", "بيع", "شراء", "عقد", "دين", "قرض", "تجاره", "فايده", "مصرف", "بنك"]),
  funerals: new Set(["جنازه", "دفن", "قبر", "ميت", "تعزيه", "نياحه", "حداد", "احداد"]),
  hajj: new Set(["حج", "عمره", "احرام", "طواف", "سعي", "عرفه", "مزدلفه", "مني", "جمرات", "ميقات"]),
};

function normalizeStem(w: string): string {
  let s = w.replace(/^(وال|بال|فال|كال|لل|ال)(?=.{2,})/, "");
  // strip trailing accusative alif for stems >= 4 letters (e.g. جهلا -> جهل)
  if (s.length >= 4 && s.endsWith("ا")) s = s.slice(0, -1);
  if (/^(صيام|صوم|صائم|صائما|صائمين|صيامه|صومها)$/.test(s)) return "صوم";
  if (/^(صلاة|صلوات|صلى|صلي)$/.test(s)) return "صلو";
  if (/^(زوج|زوجة|زوجات|زوجته|زوجها|ازواج)$/.test(s)) return "زوج";
  if (/^(طلاق|طلقات|مطلقة|مطلقات|تطلق|طلقت|رجعيا|رجعي)$/.test(s)) return "طلق";
  if (/^(وضوء|توضأ|يتوضأ|توضؤ)$/.test(s)) return "وضأ";
  if (/^(تارك|يتركون|يترك|ترك)$/.test(s)) return "تارك";
  if (/^(ربا|ربوية|ربوي)$/.test(s)) return "ربا";
  if (/^(تحريم|حرام|محرم|محرمات)$/.test(s)) return "حرام";
  if (/^(فرض|فروض|فرائض|واجب|وجوب)$/.test(s)) return "فرض";
  if (/^(توحيد|موحد|يوحد)$/.test(s)) return "توحيد";
  if (/^(اركان|ركن)$/.test(s)) return "اركان";
  return s;
}

export function extractSubstantiveStems(text: string): Set<string> {
  const words = (normalizeArabic(text).match(/[ء-ي]+/g) ?? [])
    .map(normalizeStem)
    .filter((w) => w.length >= 2 && !STOP.has(w) && !GENERIC.has(w));
  return new Set(words);
}

function getDomains(stems: Set<string>): Set<string> {
  const domains = new Set<string>();
  for (const [dom, domStems] of Object.entries(DOMAINS)) {
    for (const s of stems) {
      if (domStems.has(s)) domains.add(dom);
    }
  }
  return domains;
}

/**
 * Strict title relevance gate.
 * Ensures a candidate scholar quote's title is genuinely about the question's Islamic subject,
 * preventing accidental body-keyword collisions (e.g. wudu doubts matching a divorce question).
 */
export function isScholarTitleRelevant(phrases: string[], title: string | null): boolean {
  if (!title || title.trim().length === 0) return false;

  const questionText = phrases.join(" ");
  const qStems = extractSubstantiveStems(questionText);
  const tStems = extractSubstantiveStems(title);

  if (qStems.size === 0 || tStems.size === 0) return false;

  // Domain conflict check
  const qDoms = getDomains(qStems);
  const tDoms = getDomains(tStems);
  if (qDoms.size > 0 && tDoms.size > 0) {
    const hasCommonDomain = [...qDoms].some((d) => tDoms.has(d));
    if (!hasCommonDomain) return false;
  }

  // Calculate stem overlap
  const overlap = [...qStems].filter((s) => tStems.has(s));
  if (overlap.length === 0) return false;

  // Specific guard: Ramadan obligation vs voluntary/excuse fasting
  if (qStems.has("رمضان") && !tStems.has("رمضان")) {
    return false;
  }
  if (qStems.has("فرض") && qStems.has("صوم") && qStems.has("رمضان")) {
    const tNormalized = normalizeArabic(title);
    if (!tStems.has("فرض") && !tStems.has("وجوب") && !tStems.has("ركن") && !tNormalized.includes("فرض") && !tNormalized.includes("وجوب")) {
      return false;
    }
  }

  // Specific guard: Five pillars vs enjoining good
  const qNormalized = normalizeArabic(questionText);
  if (qNormalized.includes("خمس") && !normalizeArabic(title).includes("خمس")) {
    if (tStems.has("امر") || tStems.has("معروف")) return false;
  }

  // Specific guard: Riba categorical prohibition vs ignorance exception
  if ((qNormalized.includes("حرام") || qNormalized.includes("تحريم")) && tStems.has("جهل")) {
    return false;
  }

  // Specific guard: Tawhid definition vs Surah al-Ikhlas commentary
  if (qStems.has("توحيد") && tStems.has("اخلاص") && !qStems.has("اخلاص")) {
    return false;
  }

  // Minimum overlap requirements:
  // If question has >= 2 substantive stems, require at least 2 matching stems
  if (qStems.size >= 2) {
    return overlap.length >= 2;
  }

  return overlap.length >= 1;
}

function isValidSearchPhrase(words: string[]): boolean {
  if (words.length < 2) return false;
  return words.some((w) => !STOP.has(w) && !GENERIC.has(w));
}

// Turns the question's Arabic search phrases into a database search: words of one phrase must all
// appear (AND), any phrase may match (OR). Same letter unification as the stored search text.
// Never searches on a single word or on phrases without substantive topic words.
export function toSearchQuery(phrases: string[]): string {
  const parts = phrases
    .map((p) => {
      const words = (normalizeArabic(p).match(/[ء-ي]+/g) ?? [])
        .map((w) => w.replace(/^(وال|بال|فال|كال|لل|ال)(?=.{2,})/, ""))
        .filter((w) => w.length >= 2 && !STOP.has(w));
      if (!isValidSearchPhrase(words)) return "";
      return words.join(" ");
    })
    .filter((p) => p.length > 0);
  return [...new Set(parts)].slice(0, 6).join(" or ");
}

/**
 * Searches from strict to looser, tried in order until one finds something: the full phrases, their
 * first 3 words, the same without question-frame words, then their first 2 words.
 * Never falls back to broad, generic, numeric, or single-word phrases.
 */
export function searchQueryLevels(phrases: string[]): string[] {
  const words = phrases.map((p) =>
    (normalizeArabic(p).match(/[ء-ي]+/g) ?? [])
      .map((w) => w.replace(/^(وال|بال|فال|كال|لل|ال)(?=.{2,})/, ""))
      .filter((w) => w.length >= 2 && !STOP.has(w)),
  );

  const level = (n: number, dropGeneric: boolean) =>
    [...new Set(
      words
        .map((w) => (dropGeneric ? w.filter((x) => !GENERIC.has(x)) : w))
        .filter((w) => w.length >= 2)
        .map((w) => w.slice(0, n))
        .filter(isValidSearchPhrase)
        .map((w) => w.join(" ")),
    )]
      .slice(0, 6)
      .join(" or ");

  const levels = [toSearchQuery(phrases), level(3, false), level(3, true), level(2, true)];
  return [...new Set(levels.filter((q) => q.length > 0))];
}
