import { normalizeArabic } from "@/lib/ask/checks";
import { HADITH_HE_ID, HADITH_LIBRARY_ID } from "@/lib/ask/ids";

// Rules for hadith from HadeethEnc.com (backup source until the Sunnah.com key arrives).
// Pure functions with no network access, so they can be tested (tests/hadith.test.ts).
//
// Mo's rule (2026-09-28): only hadith from Sahih al-Bukhari or Sahih Muslim (al-Sahihayn),
// and only when the grade says sahih or hasan. Everything else is dropped, never shown.
// Text is kept exactly as served. Only the hadith text, grade, source and numbers are used;
// HadeethEnc's explanations have no named author, so they are not shown (approved-scholars rule).

export type HadithCollection = "bukhari" | "muslim" | "agreed"; // agreed = in both (muttafaq 'alayh)

export type Hadith = {
  id: string; // "HE5913" (HadeethEnc id) or "SH<uuid>" (stored library hadith)
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

// Stored library hadith (Sunnah.com text kept in our own database) show this line instead.
export const SUNNAH_ATTRIBUTION = {
  text: "Hadith text: Sunnah.com",
  url: "https://sunnah.com",
} as const;

// One attribution line per answer, chosen by where the hadith came from. Mixed sources return null
// (never shown): the setting keeps the two sources apart.
export function hadithAttributionFor(ids: readonly string[]): { text: string; url: string } | null {
  if (ids.length === 0) return null;
  if (ids.every((id) => HADITH_LIBRARY_ID.test(id))) return { ...SUNNAH_ATTRIBUTION };
  if (ids.every((id) => HADITH_HE_ID.test(id))) return { ...HADITH_ATTRIBUTION };
  return null;
}

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

// Defence in depth: whatever the hadith source returns, only Sahih al-Bukhari / Sahih Muslim,
// graded sahih or hasan, with a confirmed number for each collection it claims, may be used.
export function hadithAllowed(h: Hadith): boolean {
  const claimed = collectionOf(h.attributionAr);
  if (!claimed || !acceptableGrade(h.gradeAr)) return false;
  if (!h.arabic.trim()) return false;
  const stored = HADITH_LIBRARY_ID.test(h.id);
  if (stored) {
    // Stored library hadith: one collection only, and the link must be the matching Sunnah.com page.
    const link = h.url.match(SUNNAH_URL);
    if (!link || h.collection === "agreed" || link[1] !== h.collection) return false;
  } else if (!HADITH_HE_ID.test(h.id)) return false;
  const { bukhari, muslim } = h.numbers;
  if (h.collection === "bukhari") return !!bukhari && claimed !== "muslim";
  if (h.collection === "muslim") return !!muslim && claimed !== "bukhari";
  return !!bukhari && !!muslim;
}

const SUNNAH_URL = /^https:\/\/sunnah\.com\/(bukhari|muslim):(\d+[a-z]{0,3})$/;

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

// ---------- stored library hadith (public.sources, kind 'hadith') ----------

export type StoredHadithRow = {
  id: string;
  kind: string;
  scholar_id: string | null;
  published: boolean;
  reference: string;
  collection: string | null;
  grade: string | null;
  text_original: string;
  url: string;
};

// Longest stored hadith Ask will use. Longer ones are left out, never cut: the evidence step must see
// whole hadith, and the visitor must never get a hadith cut in the middle of its meaning.
export const MAX_LIBRARY_HADITH_CHARS = 2500;

const STORED_NAMES = {
  bukhari: { collection: "Sahih al-Bukhari", attributionAr: "رواه البخاري" },
  muslim: { collection: "Sahih Muslim", attributionAr: "رواه مسلم" },
} as const;

// A continuation report ("and so-and-so told us this with the same chain, like it") has no wording
// of its own, so it is a poor quote. Matched on text without diacritics.
const CONTINUATION_PHRASE = /بهذا الاسناد|في هذا الاسناد|بمثله|بمثل حديث|بنحوه|نحوه|بإسناده|باسناده|بهذا الحديث|بمعناه|مثله/;
// The last words of the text (after punctuation is removed).
const CONTINUATION_ENDING = /(بهذا الاسناد|في هذا الاسناد|بمثله|مثله|نحوه|بنحوه|بمثل حديث \S+|بمعناه|بهذا|بهذا الحديث|بإسناده|باسناده)\s*$/;
const PROPHET_WORDS = /(قال|يقول|يقول:|فقال) (رسول الله|النبي)|(رسول الله|النبي)[^.]{0,40}(قال|يقول|يقول:)/;

export function isContinuationHadith(arabic: string): boolean {
  const text = normalizeArabic(arabic).replace(/[^ء-ي\s]/g, " ").replace(/\s+/g, " ").trim();
  if (text.length < 40) return true;
  if (text.length < 220 && CONTINUATION_PHRASE.test(text) && !PROPHET_WORDS.test(text)) return true;
  // A medium-length report that ends by pointing back to an earlier one ("...from the Prophet, like it")
  // has no wording of its own to quote.
  return text.length < 700 && CONTINUATION_ENDING.test(text);
}

// Builds a Hadith from a stored row, or null if it breaks any rule (fail closed).
export function mapStoredHadith(row: StoredHadithRow): Hadith | null {
  if (row.kind !== "hadith" || !row.published || row.scholar_id !== null || row.grade !== "sahih") return null;
  const key = row.collection === STORED_NAMES.bukhari.collection ? "bukhari"
    : row.collection === STORED_NAMES.muslim.collection ? "muslim" : null;
  if (!key || !HADITH_UUID.test(row.id)) return null;
  // The reference ("Sahih al-Bukhari, hadith 2916, book 56, ...") and the link must agree with the collection.
  if (!row.reference.startsWith(`${STORED_NAMES[key].collection}, hadith `)) return null;
  const number = row.reference.match(/^[^,]+, hadith (\d+)/);
  const link = row.url.match(SUNNAH_URL);
  if (!number || !link || link[1] !== key) return null;
  const base = Number(number[1]);
  if (!Number.isInteger(base) || base <= 0 || Number(link[2].match(/^\d+/)![0]) !== base) return null;
  if (!row.text_original.trim() || /[<>]/.test(row.text_original)) return null;
  const hadith: Hadith = {
    id: `SH${row.id}`,
    collection: key,
    numbers: { bukhari: key === "bukhari" ? base : null, muslim: key === "muslim" ? base : null },
    attributionAr: STORED_NAMES[key].attributionAr,
    gradeAr: "صحيح",
    arabic: row.text_original,
    translations: { en: null, de: null },
    url: row.url,
  };
  return hadithAllowed(hadith) ? hadith : null;
}

const HADITH_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// ---------- search phrases for the stored library ----------

// The stored search text keeps the Arabic "ال" prefix (only diacritics and letter variants are unified),
// so the fatwa search's habit of stripping "ال" would miss most hadith. These queries keep each word as
// the visitor wrote it, plus the same word with "ال" added or removed. Words of one phrase must all
// appear (AND); any phrase may match (OR). Returned strict first, then looser (first two words).
const HADITH_QUERY_STOP = new Set(["ما", "هل", "كيف", "في", "من", "على", "عن", "الى", "هو", "هي", "حكم", "الحكم", "لماذا", "ماذا", "هذا", "هذه", "ان", "او", "و", "عليه", "عليها", "عليهم", "له", "لها", "به", "الله", "وسلم", "صلي", "رسول", "النبي", "يجب", "يجوز", "تجب", "علي", "الي"]);

export function hadithSearchQueries(phrases: string[]): string[] {
  const phraseWords = phraseWordLists(phrases);
  const variants = (words: string[]) => [
    words,
    words.map((w) => (w.startsWith("ال") && w.length > 4 ? w.slice(2) : w)),
    words.map((w) => (w.startsWith("ال") || w.length < 3 ? w : `ال${w}`)),
  ].map((v) => v.join(" "));
  const join = (parts: string[][]) => [...new Set(parts.flatMap(variants).filter((q) => q.length > 0))].slice(0, 8).join(" or ");
  // Query 1, one per phrase (its own result pool): every word of the phrase must appear.
  const perPhrase = phraseWords.slice(0, 3).map((words) => join([words]));
  // Query 2: any one topic word, together with a narrator-chain word. Fatwas share the database
  // function's result pool and would fill all of it for a broad topic like divorce; nearly every
  // stored hadith has "حدثنا" in its chain, nearly no fatwa does. Words of the question's frame are dropped.
  const topicWords = hadithTopicWords(phrases);
  const anyTopic = [...new Set(topicWords.flatMap((w) => variants([w])))].slice(0, 8).map((w) => `${w} حدثنا`).join(" or ");
  return [...new Set([...perPhrase, anyTopic].filter((q) => q.length > 0))];
}

function phraseWordLists(phrases: string[]): string[][] {
  return phrases
    .map((p) => (normalizeArabic(p).match(/[ء-ي]+/g) ?? []).filter((w) => w.length >= 2 && !HADITH_QUERY_STOP.has(w)))
    .filter((words) => words.length >= 1 && words.some((w) => w.length >= 3));
}

// Words that describe the kind of question, not its topic ("virtue of", "ruling on", "treatment of"...).
const HADITH_GENERIC_WORDS = new Set(["فضل", "الفضل", "علاج", "العلاج", "تحريم", "التحريم", "ثواب", "ثوابه", "وجوب", "اهميه", "الاهميه", "الاسلام", "اسلام", "المسلم", "مسلم", "وثوابه", "الثواب"]);

/** The topic words of the question's phrases (frame words like "virtue of" are dropped), at most 5. */
export function hadithTopicWords(phrases: string[]): string[] {
  return [...new Set(phraseWordLists(phrases).flat().filter((w) => w.length >= 3 && !HADITH_GENERIC_WORDS.has(w)))].slice(0, 5);
}

/** How many of the topic words appear in a hadith's chapter heading and text (with or without "ال"). */
export function hadithTopicScore(heading: string, arabic: string, topicWords: string[]): number {
  const tokens = new Set(normalizeArabic(`${heading} ${arabic}`).match(/[ء-ي]+/g) ?? []);
  const has = (w: string) => tokens.has(w) || tokens.has(w.startsWith("ال") ? w.slice(2) : `ال${w}`);
  return topicWords.filter(has).length;
}
