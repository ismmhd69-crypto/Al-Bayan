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
