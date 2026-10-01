import "server-only";
import type { AnswerV2, ScholarItem, ScholarView } from "./answer-v2";
import { getScholarTranslations } from "@/lib/sources/scholar-translations";

function translatedScholar(item: ScholarItem, translations: Map<string, string>): ScholarItem {
  const text = translations.get(item.id.slice(1));
  return text ? { ...item, translation: text } : item;
}

function translatedView(view: ScholarView, translations: Map<string, string>): ScholarView {
  return { ...view, scholars: view.scholars.map((item) => translatedScholar(item, translations)) };
}

/** Adds translations after validation, so they can never affect retrieval, evidence, or quote checks. */
export async function attachScholarTranslations(answer: AnswerV2): Promise<AnswerV2> {
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
