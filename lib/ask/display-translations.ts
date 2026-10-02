import "server-only";
import type { AnswerV2, ScholarItem, ScholarView } from "./answer-v2";
import { HADITH_LIBRARY_ID } from "./ids";
import { getScholarTranslations } from "@/lib/sources/scholar-translations";

function translatedScholar(item: ScholarItem, translations: Map<string, string>): ScholarItem {
  const text = translations.get(item.id.slice(1));
  return text ? { ...item, translation: text } : item;
}

function translatedView(view: ScholarView, translations: Map<string, string>): ScholarView {
  return { ...view, scholars: view.scholars.map((item) => translatedScholar(item, translations)) };
}

/** Adds translations after validation, so they can never affect retrieval, evidence, or quote checks. */
// Stored hadith ("SH<uuid>") get their AI translation here too, in the visitor's language only (no
// English fallback for German), flagged so the page shows the AI label instead of a source credit.
async function attachHadithTranslations(answer: AnswerV2): Promise<AnswerV2> {
  const stored = answer.hadith.filter((item) => HADITH_LIBRARY_ID.test(item.id));
  if (stored.length === 0) return answer;
  const translations = await getScholarTranslations(stored.map((item) => item.id.slice(2)), answer.language);
  if (translations.size === 0) return answer;
  return {
    ...answer,
    hadith: answer.hadith.map((item) => {
      const text = HADITH_LIBRARY_ID.test(item.id) ? translations.get(item.id.slice(2)) : undefined;
      return text && answer.language !== "ar"
        ? { ...item, translation: text, translation_language: answer.language, ai_translation: true }
        : item;
    }),
  };
}

export async function attachScholarTranslations(input: AnswerV2): Promise<AnswerV2> {
  const answer = await attachHadithTranslations(input);
  const views = answer.view_handling?.mode === "reviewed_main"
    ? answer.view_handling.other_views
    : answer.view_handling?.mode === "side_by_side" ? answer.view_handling.views : [];
  const scholars = [...answer.scholars, ...views.flatMap((view) => view.scholars)];
  const translations = await getScholarTranslations(scholars.map((item) => item.id.slice(1)), answer.language);
  if (translations.size === 0) return answer;
  return {
    ...answer,
    scholars: answer.scholars.map((item) => translatedScholar(item, translations)),
    ...(answer.view_handling?.mode === "reviewed_main"
      ? { view_handling: { ...answer.view_handling, other_views: answer.view_handling.other_views.map((view) => translatedView(view, translations)) } }
      : answer.view_handling?.mode === "side_by_side"
        ? { view_handling: { ...answer.view_handling, views: answer.view_handling.views.map((view) => translatedView(view, translations)) } }
        : {}),
  };
}
