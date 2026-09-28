// Rules for hadith from HadeethEnc.com (backup source until the Sunnah.com key arrives).
// Pure functions with no network access, so they can be tested (tests/hadith.test.ts).
//
// Mo's rule (2026-09-28): only hadith from Sahih al-Bukhari or Sahih Muslim (al-Sahihayn),
// and only when the grade says sahih or hasan. Everything else is dropped, never shown.
// Text is kept exactly as served. Only the hadith text, grade, source and numbers are used;
// HadeethEnc's explanations have no named author, so they are not shown (approved-scholars rule).

export type HadithCollection = "bukhari" | "muslim" | "agreed"; // agreed = in both (muttafaq 'alayh)

export type Hadith = {
  id: string; // "HE5913" (HadeethEnc id)
  collection: HadithCollection;
  // Hadith numbers as printed in HadeethEnc's reference (the common Fath al-Bari numbering for
  // Bukhari and Fu'ad 'Abd al-Baqi numbering for Muslim). Always shown with their collection name.
  numbers: { bukhari: number | null; muslim: number | null };
  attributionAr: string; // exactly as served, e.g. "رواه البخاري"
  gradeAr: string; // exactly as served, e.g. "صحيح"
  arabic: string; // exactly as served
  translations: { en: string | null; de: string | null }; // exactly as served, or null
  url: string;
};

export const HADITH_ATTRIBUTION = {
  text: "Hadith text, translation and grade: HadeethEnc.com",
  url: "https://hadeethenc.com",
} as const;

// Bukhari and/or Muslim only. Any other collection named in the attribution (Tirmidhi, Ahmad...)
// is fine alongside them, but at least one of the two Sahihs must be named.
export function collectionOf(attributionAr: string): HadithCollection | null {
  const a = attributionAr.trim();
  if (/^متفق عليه/.test(a)) return "agreed";
  if (!/^(رواه|أخرجه)/.test(a)) return null;
  const bukhari = /البخاري/.test(a);
  const muslim = /(^|[\s،,و])مسلم(\s|$|،|,|\.|في)/.test(a);
  if (bukhari && muslim) return "agreed";
  if (bukhari) return "bukhari";
  if (muslim) return "muslim";
  return null;
}

// The grade text must say sahih or hasan and must not mention weakness.
export function acceptableGrade(gradeAr: string): boolean {
  const g = gradeAr.trim();
  if (/ضعيف|موضوع|منكر|شاذ|لا يصح|لا أصل/.test(g)) return false;
  return /صحيح|حسن/.test(g);
}

// In the standard printed edition, Sahih Muslim's introduction (muqaddimah) fills the first pages
// of volume 1 before Kitab al-Iman. Its reports are not part of the main Sahih and are skipped.
// Conservative cut-off: anything before volume 1, page 36 counts as the introduction.
const MUSLIM_MAIN_TEXT_STARTS = { volume: 1, page: 36 };

type Ref = { volume: number; page: number; number: number };

// Reads "صحيح البخاري (6/ 192) (5027)" style entries from the reference text.
export function readReference(reference: string, book: "bukhari" | "muslim"): Ref | null {
  const name = book === "bukhari" ? "صحيح البخاري" : "صحيح مسلم";
  const m = reference.match(new RegExp(`${name}\\s*\\((\\d+)\\s*/\\s*(\\d+)\\)\\s*\\((\\d+)\\)`));
  return m ? { volume: Number(m[1]), page: Number(m[2]), number: Number(m[3]) } : null;
}

export function inMuslimIntroduction(ref: Ref): boolean {
  return ref.volume < MUSLIM_MAIN_TEXT_STARTS.volume ||
    (ref.volume === MUSLIM_MAIN_TEXT_STARTS.volume && ref.page < MUSLIM_MAIN_TEXT_STARTS.page);
}

const showable = (t: unknown): string | null =>
  typeof t === "string" && t.trim().length > 0 && !/[<>]/.test(t) ? t : null;

type Raw = Record<string, unknown>;
const str = (r: Raw, ...keys: string[]) => keys.map((k) => r[k]).find((v): v is string => typeof v === "string");

// Builds a Hadith from the Arabic record (the base: every hadith has one) plus the English and
// German records when they exist. Returns null if it breaks any rule.
export function parseHadith(ar: unknown, en: unknown, de: unknown): Hadith | null {
  const r = ar as Raw;
  if (!r || typeof r !== "object") return null;
  const id = r.id;
  // The Arabic record uses plain field names; other languages add "_ar".
  const attribution = str(r, "attribution", "attribution_ar");
  const grade = str(r, "grade", "grade_ar");
  const arabic = str(r, "hadeeth", "hadeeth_ar");
  const reference = str(r, "reference") ?? "";
  if (typeof id !== "string" || !/^\d+$/.test(id) || !attribution || !grade || !arabic) return null;

  const collection = collectionOf(attribution);
  if (!collection || !acceptableGrade(grade) || !showable(arabic)) return null;

  // The claimed collection must be backed by a real number in the reference.
  const b = readReference(reference, "bukhari");
  const mRaw = readReference(reference, "muslim");
  const m = mRaw && !inMuslimIntroduction(mRaw) ? mRaw : null;
  // Only count a Sahih the attribution names AND the reference numbers confirm.
  const inBukhari = collection !== "muslim" && !!b;
  const inMuslim = collection !== "bukhari" && !!m;
  if (!inBukhari && !inMuslim) return null;
  const confirmed: HadithCollection = inBukhari && inMuslim ? "agreed" : inBukhari ? "bukhari" : "muslim";
  const numbers = { bukhari: inBukhari ? b!.number : null, muslim: inMuslim ? m!.number : null };

  const e = en as Raw | null;
  const d = de as Raw | null;
  return {
    id: `HE${id}`,
    collection: confirmed,
    numbers,
    attributionAr: attribution,
    gradeAr: grade,
    arabic,
    translations: {
      en: e && e.id === id ? showable(e.hadeeth) : null,
      de: d && d.id === id ? showable(d.hadeeth) : null,
    },
    url: `https://hadeethenc.com/en/browse/hadith/${id}`,
  };
}
