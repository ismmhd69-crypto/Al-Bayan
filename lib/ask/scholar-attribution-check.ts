import { getDictionary, type Locale } from "../i18n";
import type { Claim } from "./checks";

export type ScholarIdentity = { id: string; scholarId: string; name: string };
const normal = (s: string) => s.normalize("NFKC").replace(/[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06edـ]/gu, "")
  .replace(/[أإآٱ]/gu, "ا").toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

/** Code-owned common spellings of each approved scholar's name. A name match only shows the
 * author is named; it never establishes agreement, correct attribution or support. */
export const SCHOLAR_NAME_VARIANTS: Record<string, string[]> = {
  "ibn-baz": ["ابن باز", "بن باز", "عبد العزيز بن باز", "عبدالعزيز بن باز", "Ibn Baz", "Ibn Baaz", "bin Baz", "Abd al-Aziz ibn Baz", "Abdul Aziz ibn Baz", "Abdulaziz bin Baz"],
  "ibn-uthaymeen": ["ابن عثيمين", "بن عثيمين", "العثيمين", "محمد بن صالح العثيمين", "Ibn Uthaymeen", "Ibn Uthaymin", "Ibn al-Uthaymeen", "al-Uthaymeen", "Ibn Othaimeen"],
  "al-albani": ["الألباني", "الالباني", "ناصر الدين الألباني", "al-Albani", "Albani", "al-Albaani"],
  "al-fawzan": ["الفوزان", "صالح الفوزان", "al-Fawzan", "Fawzan", "Salih al-Fawzan", "Saleh al-Fawzan"],
  "othman-al-khamis": ["عثمان الخميس", "Othman al-Khamis", "Uthman al-Khamis", "al-Khamis"],
  "permanent-committee": ["اللجنة الدائمة", "اللجنة الدائمة للبحوث العلمية والإفتاء", "The Permanent Committee", "Permanent Committee"],
  "al-barrak": ["البراك", "عبد الرحمن البراك", "عبدالرحمن البراك", "al-Barrak", "Barrak", "Abd al-Rahman al-Barrak"],
};

/** Identity labels from the approved source record and existing localized UI
 * names. These labels are not evidence for the claim's religious meaning. */
export function scholarAttributionNames(sources: ScholarIdentity[], language: Locale) {
  const short = getDictionary(language).ask.scholarShort as Record<string, string>;
  return sources.map(s => ({ source_id: s.id, scholar_id: s.scholarId, full_name: s.name, short_name: short[s.scholarId] ?? s.name }));
}

// Words naming any authority. A sentence that already names one is never given another name by code.
const OTHER_AUTHORITY = /\b(?:shaykh|sheikh|imam|scholars?|committee|prophet|messenger|quran|qur'an|hadith|sunnah|according)\b|\bibn\s+\p{L}+|\bal-\p{L}+|الشيخ|الإمام|العلماء|اللجنة|النبي|الرسول|رسول الله|القرآن|الحديث|السنة|ابن\s+\p{L}+|بحسب|وفق/iu;
const KEEP_CAPITAL = /^(?:Allah|God|Islam|Muslims?|Ramadan|Hajj|Umrah|Zakat|Friday|Arabic|Quran)\b/u;

/** Code repair, before any check (Mo's live test, 2026-11-12: whole summaries were lost because the writer left
 * the scholar's name out of later sentences). Only for a sentence whose citations are ALL scholar sources by ONE
 * scholar, which names no author or other authority at all. It adds "According to <name>, " (Arabic, at the end:
 * "، كما بيّن الشيخ <name>"). This states whose source the sentence comes from; it is not evidence. The whole repaired sentence then
 * goes through every normal check and the full review, and that exact wording is what can be published.
 * German word order would change, so German is left as it is. */
export function nameSingleScholar(text: string, refs: string[], sources: ScholarIdentity[], language: Locale): string {
  if (language === "de" || !refs.length) return text;
  const labels = scholarAttributionNames(sources, language);
  const own = refs.map(id => labels.find(s => s.source_id === id));
  if (own.some(s => !s) || new Set(own.map(s => s!.scholar_id)).size !== 1) return text;
  if (!checkScholarAttributions([{ text, refs }], sources, language).blocked.length) return text;
  if (OTHER_AUTHORITY.test(text)) return text;
  const name = own[0]!.short_name;
  // Arabic names the scholar at the end. Not "بحسب" ("depending on"): it is a condition word to the missing-condition
  // guard, which would then stop checking the sentence (caught by tests/source-boundary-guards.test.ts).
  const repaired = language === "ar" ? `${text.trim().replace(/[.!؟]+$/u, "")}، كما بيّن الشيخ ${name.replace(/^الشيخ\s+/u, "")}.`
    : `According to ${name}, ${KEEP_CAPITAL.test(text) ? text : text.charAt(0).toLocaleLowerCase("en") + text.slice(1)}`;
  return Array.from(repaired).length <= 300 ? repaired : text;
}

/** Negative-only identity check. A generic plural does not name a cited author.
 * Matching a name never establishes agreement, correct attribution or support.
 * Mixed-source synthesis and unknown citations remain with the normal checks. */
export function checkScholarAttributions(items: Claim[], sources: ScholarIdentity[], language: Locale) {
  const labels = scholarAttributionNames(sources, language);
  const failures: { claim_id: string; source_ids: string[]; code: "scholar_not_named"; explanation: string }[] = [];
  for (const [index, claim] of items.entries()) {
    if (!claim.refs.length) continue;
    const own = claim.refs.map(id => labels.find(s => s.source_id === id));
    if (own.some(s => !s)) continue;
    const authors = [...new Map(own.map(s => [s!.scholar_id, s!])).values()];
    const text = ` ${normal(claim.text)} `;
    const prefixes = language === "ar" ? ["", "و", "ف", "ل", "ب", "ول", "وب"] : [""];
    const missing = authors.filter(s => ![s.full_name, s.short_name, ...(SCHOLAR_NAME_VARIANTS[s.scholar_id] ?? [])].some(name => normal(name)
      && prefixes.some(prefix => text.includes(` ${prefix}${normal(name)} `))));
    if (!missing.length) continue;
    failures.push({ claim_id: `C${index + 1}`, source_ids: [...claim.refs], code: "scholar_not_named",
      explanation: `Name the author of each cited scholarly view: ${missing.map(s => s.short_name).join("; ")}. Generic scholars or an unnamed authority is not named attribution. Preserve the cited meaning and all conditions; do not add an agreement or consensus claim.` });
  }
  return { blocked: failures.map(f => f.claim_id), reasons: failures.length ? ["scholar_not_named"] : [], failures };
}
