import "server-only";
import type { Locale } from "@/lib/i18n";
import { searchHadithMulti } from "./hadith";
import { acceptableGrade, type Hadith, type HadithCollection } from "./hadith-rules";

// Sunnah.com is used only after Mo adds SUNNAH_API_KEY locally. Its documented API has no text
// search endpoint, so the existing HadeethEnc title catalogue finds Sahihayn references and this
// connector fetches the official Sunnah.com record by its confirmed collection number.
const API = "https://api.sunnah.com/v1";
const TIMEOUT_MS = 10_000;
const MAX_RESULTS = 6;

type RawGrade = { grade?: unknown; graded_by?: unknown };
type RawLanguage = { lang?: unknown; body?: unknown; chapterTitle?: unknown; grades?: unknown };
type RawHadith = { collection?: unknown; bookNumber?: unknown; chapterId?: unknown; hadithNumber?: unknown; hadith?: unknown };

const nonEmpty = (value: unknown): string | null => typeof value === "string" && value.trim() && !/[<>]/.test(value) ? value : null;
const number = (value: unknown): number | null => typeof value === "string" && /^\d+$/.test(value) ? Number(value) : typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;

function collection(value: unknown): HadithCollection | null {
  if (value === "bukhari") return "bukhari";
  if (value === "muslim") return "muslim";
  return null;
}

function allowedGrade(grades: unknown): { grade: string; gradedBy: string } | null {
  if (!Array.isArray(grades)) return null;
  for (const raw of grades as RawGrade[]) {
    const grade = nonEmpty(raw.grade);
    const gradedBy = nonEmpty(raw.graded_by) ?? "Sunnah.com";
    if (!grade) continue;
    // Keep the shared Arabic grade rule authoritative when Arabic grade text is supplied. The API
    // documentation also permits English language records, so accept only the exact safe English labels.
    if (acceptableGrade(grade) || /^(?:sahih|hasan)(?:\s+\([^)]*\))?$/i.test(grade)) return { grade, gradedBy };
  }
  return null;
}

function languageRecord(records: RawLanguage[], lang: string): RawLanguage | null {
  return records.find((record) => record.lang === lang) ?? null;
}

/** Converts one documented Sunnah.com response into the shared, strict Hadith shape. */
export function parseSunnahHadith(raw: unknown): Hadith | null {
  const item = raw as RawHadith;
  if (!item || typeof item !== "object") return null;
  const source = collection(item.collection);
  const printedNumber = number(item.hadithNumber);
  if (!source || !printedNumber || !Array.isArray(item.hadith)) return null;
  const records = item.hadith as RawLanguage[];
  const arabic = languageRecord(records, "ar");
  const english = languageRecord(records, "en");
  const arabicBody = nonEmpty(arabic?.body);
  if (!arabicBody) return null;
  const title = nonEmpty(arabic?.chapterTitle) ?? nonEmpty(english?.chapterTitle) ?? "";
  // Muslim's muqaddimah and Bukhari chapter headings are not accepted as hadith evidence.
  if ((source === "muslim" && /(?:مقدمة|introduction)/i.test(title)) ||
      (source === "bukhari" && /^(?:باب|chapter\b)/i.test(arabicBody))) return null;
  const grade = allowedGrade(arabic?.grades ?? english?.grades);
  if (!grade) return null;
  return {
    id: `S${source === "bukhari" ? "B" : "M"}${printedNumber}`,
    collection: source,
    numbers: { bukhari: source === "bukhari" ? printedNumber : null, muslim: source === "muslim" ? printedNumber : null },
    attributionAr: source === "bukhari" ? "رواه البخاري" : "رواه مسلم",
    gradeAr: grade.grade,
    arabic: arabicBody,
    translations: { en: nonEmpty(english?.body), de: null },
    url: `https://sunnah.com/${source}:${printedNumber}`,
  };
}

async function fetchSunnah(path: string): Promise<unknown | null> {
  const key = process.env.SUNNAH_API_KEY;
  if (!key) return null;
  try {
    const response = await fetch(`${API}${path}`, { headers: { "X-API-Key": key, Accept: "application/json" }, signal: AbortSignal.timeout(TIMEOUT_MS), next: { revalidate: 86_400 } });
    if (!response.ok) return null;
    return await response.json();
  } catch { return null; }
}

export async function getSunnahHadith(source: "bukhari" | "muslim", hadithNumber: number): Promise<Hadith | null> {
  if (!Number.isInteger(hadithNumber) || hadithNumber < 1) return null;
  const raw = await fetchSunnah(`/collections/${source}/hadiths/${hadithNumber}`);
  return raw ? parseSunnahHadith(raw) : null;
}

/** Same signature as searchHadithMulti. No user phrase is sent to Sunnah.com. */
export async function searchSunnahMulti(queries: Partial<Record<Locale, string[]>>, limit = 4): Promise<Hadith[]> {
  if (!process.env.SUNNAH_API_KEY) return [];
  const candidates = await searchHadithMulti(queries, Math.min(limit * 3, MAX_RESULTS));
  const refs = candidates.flatMap((hadith) => [
    hadith.numbers.bukhari ? (["bukhari", hadith.numbers.bukhari] as const) : null,
    hadith.numbers.muslim ? (["muslim", hadith.numbers.muslim] as const) : null,
  ]).filter((ref): ref is readonly ["bukhari" | "muslim", number] => ref !== null);
  const loaded = await Promise.all(refs.map(([source, hadithNumber]) => getSunnahHadith(source, hadithNumber)));
  const seen = new Set<string>();
  return loaded.filter((hadith): hadith is Hadith => hadith !== null).filter((hadith) => {
    const key = `${hadith.collection}:${hadith.numbers.bukhari ?? hadith.numbers.muslim}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, limit);
}
