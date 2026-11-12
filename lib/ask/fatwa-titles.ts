import { FATWA_TITLE_TRANSLATIONS } from "@/data/fatwa-title-translations";
import { validDisplayTitle, type RichSource } from "./rich-answer";

/** The AI translation of a stored fatwa's heading, for English and German readers (only imported by server code). Display only:
 * it is never sent to the writer or checker and never supports a sentence. Server-side, because the
 * table is large and must not be shipped to the browser. */
export function fatwaTitleTranslation(sourceId: string, language: string): RichSource["displayTitle"] {
  if (language !== "en" && language !== "de") return undefined;
  const entry = FATWA_TITLE_TRANSLATIONS[sourceId.replace(/^S(?!H)/, "")];
  const title = { text: entry?.[language]?.trim() ?? "", language } as const;
  return validDisplayTitle(title, language) ? title : undefined;
}
