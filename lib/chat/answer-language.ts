import type { Locale } from "@/lib/i18n";
import type { RichStreamState } from "@/lib/ask/rich-answer";

/** Prefer the server's answer language; before completion, follow an Arabic question. */
export function streamedAnswerLanguage(state: RichStreamState, question: string, fallback: Locale): Locale {
  const result = state.result as { answer?: { language?: unknown }; language?: unknown } | undefined;
  const language = result?.answer?.language ?? result?.language;
  if (language === "ar" || language === "en" || language === "de") return language;
  const letters = question.match(/\p{Letter}/gu) ?? [];
  const arabic = question.match(/\p{Script=Arabic}/gu) ?? [];
  return letters.length > 0 && arabic.length > letters.length / 2 ? "ar" : fallback;
}
