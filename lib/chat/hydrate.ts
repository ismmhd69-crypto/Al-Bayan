import "server-only";
import { isLocale } from "@/lib/i18n";
import { toEvidence } from "@/lib/ask/core";
import { validateAnswerV2, type AnswerV2, type ReviewLabel } from "@/lib/ask/answer-v2";
import { getVerse } from "@/lib/sources/quran";
import { getHadith } from "@/lib/sources/hadith";
import { getLibraryHadith } from "@/lib/sources/hadith-library";
import type { Verse } from "@/lib/sources/quran-meta";
import type { Hadith } from "@/lib/sources/hadith-rules";
import { validRichAnswer, type RichAnswer } from "@/lib/ask/rich-answer";
import type { SavedAnswer } from "./answer-store";
import { refreshRelatedVideos, type VideoRefresh } from "@/lib/ask/related-videos";
import { currentVideos } from "@/lib/sources/videos";
import { lookupDisplayTranslations } from "@/lib/ask/display-translation-lookup";
import type { DisplayTranslation, RichSource } from "@/lib/ask/rich-answer";

// Opens a saved answer: puts the Quran and hadith texts back, fresh from their sources, then runs the
// same strict validator as every other answer. If any source cannot be loaded, or anything fails the
// validator, the answer is not shown (fail closed, like lib/prepared.ts).

export type HydrateDeps = {
  refreshVideos?: VideoRefresh;
  getVerse: (key: string) => Promise<Verse | undefined>;
  getHadith: (id: string) => Promise<Hadith | null>;
  getLibraryHadith?: (uuid: string) => Promise<Hadith | null>; // stored hadith ("SH<uuid>")
  /** Published display translations for freshly loaded originals (stored hadith). Optional. */
  lookupTranslations?: (sources: RichSource[], language: "en" | "de") => Promise<Map<string, DisplayTranslation>>;
};
export type HydrateResult = { ok: true; answer: SavedAnswer } | { ok: false; reason: string };

const realDeps: HydrateDeps = { getVerse, getHadith, getLibraryHadith, refreshVideos: currentVideos,
  lookupTranslations: (sources, language) => lookupDisplayTranslations(sources, language, AbortSignal.timeout(8000)) };
const REVIEWS: readonly ReviewLabel[] = ["automatic", "bayan_reviewed", "scholar_reviewed"];
const VERSE_KEY = /^\d{1,3}:\d{1,3}$/;
const HADITH_ID = /^HE(\d{1,12})$/;
const LIBRARY_HADITH_ID = /^SH([0-9a-f-]{36})$/;

export async function hydrateAnswer(stored: unknown, deps: HydrateDeps = realDeps): Promise<HydrateResult> {
  try {
    if (!stored || typeof stored !== "object" || Array.isArray(stored)) return { ok: false, reason: "shape" };
    if ([3, 4].includes((stored as { version?: number }).version ?? 0)) return hydrateRich(stored, deps);
    const a = structuredClone(stored) as AnswerV2;
    if (a.version !== 2 || typeof a.language !== "string" || !isLocale(a.language)) return { ok: false, reason: "shape" };
    if (a.origin !== "live" && a.origin !== "prepared") return { ok: false, reason: "shape" };
    if (!REVIEWS.includes(a.review)) return { ok: false, reason: "shape" };
    if (!Array.isArray(a.quran) || !Array.isArray(a.hadith)) return { ok: false, reason: "shape" };
    const language = a.language;

    const jobs: Promise<boolean>[] = [];
    for (const card of a.quran) {
      if (!Array.isArray(card?.verses)) return { ok: false, reason: "shape" };
      for (const item of card.verses) {
        if (typeof item?.key !== "string" || !VERSE_KEY.test(item.key)) return { ok: false, reason: "shape" };
        jobs.push(
          deps.getVerse(item.key).then((verse) => {
            if (!verse) return false;
            const e = toEvidence({ kind: "quran", verse }, language);
            if (e.kind !== "quran") return false;
            item.arabic = e.arabic;
            item.translation = e.translation;
            item.translation_name = e.translationName;
            item.url = e.url;
            return true;
          }),
        );
      }
    }
    for (const item of a.hadith) {
      const match = typeof item?.id === "string" ? item.id.match(HADITH_ID) : null;
      const stored = typeof item?.id === "string" ? item.id.match(LIBRARY_HADITH_ID) : null;
      if (!match && !stored) return { ok: false, reason: "shape" };
      // A stored-hadith id is only reopened from the library, never from HadeethEnc, and the reverse.
      const load = match ? deps.getHadith(match[1]) : deps.getLibraryHadith ? deps.getLibraryHadith(stored![1]) : Promise.resolve(null);
      jobs.push(
        load.then((hadith) => {
          if (!hadith) return false;
          const e = toEvidence({ kind: "hadith", hadith }, language);
          if (e.kind !== "hadith") return false;
          item.collection = e.collection;
          item.numbers = e.numbers;
          item.grade_ar = e.gradeAr;
          item.attribution_ar = e.attributionAr;
          item.arabic = e.arabic;
          item.translation = e.translation;
          item.translation_language = e.translationLanguage;
          item.url = e.url;
          // Old saved answers have no chapter heading; it is added back from the library when it exists.
          if (e.chapter) item.chapter = e.chapter;
          else delete item.chapter;
          return true;
        }),
      );
    }
    if (!(await Promise.all(jobs)).every(Boolean)) return { ok: false, reason: "source_unavailable" };

    const checked = validateAnswerV2(a, { origin: a.origin, review: a.review });
    return checked.ok ? { ok: true, answer: checked.answer } : { ok: false, reason: `invalid:${checked.reason}` };
  } catch {
    return { ok: false, reason: "error" };
  }
}

async function hydrateRich(stored: unknown, deps: HydrateDeps): Promise<HydrateResult> {
  try {
    const a = structuredClone(stored) as RichAnswer;
    if (!isLocale(a.language) || !Array.isArray(a.sections) || a.sections.length !== 4) return { ok: false, reason: "shape" };
    const loaded = new Map<string, Promise<ReturnType<typeof toEvidence> | null>>();
    for (const section of a.sections) {
      if (!Array.isArray(section.sources) || section.sources.length > 20) return { ok: false, reason: "shape" };
      for (const source of section.sources) {
        const e = source.evidence;
        if (e.kind === "scholar") continue;
        if (!loaded.has(source.id)) {
          let job: Promise<ReturnType<typeof toEvidence> | null>;
          if (e.kind === "quran" && source.id === `Q${e.key}` && VERSE_KEY.test(e.key)) {
            job = deps.getVerse(e.key).then(v => v ? toEvidence({ kind: "quran", verse: v }, a.language) : null);
          } else if (e.kind === "hadith" && source.id === e.key) {
            const he = e.key.match(HADITH_ID), sh = e.key.match(LIBRARY_HADITH_ID);
            if (!he && !sh) return { ok: false, reason: "shape" };
            job = (he ? deps.getHadith(he[1]) : deps.getLibraryHadith?.(sh![1]) ?? Promise.resolve(null)).then(h => h ? toEvidence({ kind: "hadith", hadith: h }, a.language) : null);
          } else return { ok: false, reason: "shape" };
          loaded.set(source.id, job);
        }
        const fresh = await loaded.get(source.id)!;
        if (!fresh || fresh.kind !== e.kind || fresh.key !== e.key) return { ok: false, reason: "source_unavailable" };
        source.evidence = fresh;
      }
    }
    // Stored copies replace a hadith translation (which carries the Arabic original) with "not_checked".
    // Look the published translation up again for the exact original just loaded; if it cannot be
    // found, the card shows the Arabic only, as for any hadith without a checked translation.
    const pending = a.language === "ar" ? [] : a.sections.flatMap((s) => s.sources).filter((s) => s.evidence.kind === "hadith" && s.displayTranslation?.status === "not_checked");
    if (pending.length) {
      const found = deps.lookupTranslations ? await deps.lookupTranslations(pending, a.language as "en" | "de").catch(() => new Map<string, DisplayTranslation>()) : new Map<string, DisplayTranslation>();
      for (const s of pending) s.displayTranslation = found.get(s.id) ?? { status: "unavailable" };
    }
    if (a.version === 4 && a.videos) {
      const fresh = await refreshRelatedVideos(a.videos, deps.refreshVideos);
      if (fresh) a.videos = fresh; else delete a.videos;
    }
    return validRichAnswer(a) ? { ok: true, answer: a } : { ok: false, reason: "invalid_rich" };
  } catch { return { ok: false, reason: "error" }; }
}
