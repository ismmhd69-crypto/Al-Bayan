import "server-only";
import { isLocale } from "@/lib/i18n";
import { toEvidence } from "@/lib/ask/core";
import { validateAnswerV2, type AnswerV2, type ReviewLabel } from "@/lib/ask/answer-v2";
import { getVerse } from "@/lib/sources/quran";
import { getHadith } from "@/lib/sources/hadith";
import { getLibraryHadith } from "@/lib/sources/hadith-library";
import type { Verse } from "@/lib/sources/quran-meta";
import type { Hadith } from "@/lib/sources/hadith-rules";

// Opens a saved answer: puts the Quran and hadith texts back, fresh from their sources, then runs the
// same strict validator as every other answer. If any source cannot be loaded, or anything fails the
// validator, the answer is not shown (fail closed, like lib/prepared.ts).

export type HydrateDeps = {
  getVerse: (key: string) => Promise<Verse | undefined>;
  getHadith: (id: string) => Promise<Hadith | null>;
  getLibraryHadith?: (uuid: string) => Promise<Hadith | null>; // stored hadith ("SH<uuid>")
};
export type HydrateResult = { ok: true; answer: AnswerV2 } | { ok: false; reason: string };

const realDeps: HydrateDeps = { getVerse, getHadith, getLibraryHadith };
const REVIEWS: readonly ReviewLabel[] = ["automatic", "bayan_reviewed", "scholar_reviewed"];
const VERSE_KEY = /^\d{1,3}:\d{1,3}$/;
const HADITH_ID = /^HE(\d{1,12})$/;
const LIBRARY_HADITH_ID = /^SH([0-9a-f-]{36})$/;

export async function hydrateAnswer(stored: unknown, deps: HydrateDeps = realDeps): Promise<HydrateResult> {
  try {
    if (!stored || typeof stored !== "object" || Array.isArray(stored)) return { ok: false, reason: "shape" };
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
