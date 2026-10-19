import type { Locale } from "@/lib/i18n";

export const hardQuestionIds = ["purpose","who-created","suffering","doubt","faith-reason","evolution","quran-preserved","hadith-late","women-spiritual","inheritance","never-heard","sword","why-islam","prophethood-evidence","decree-and-choice","unanswered-dua","eternal-punishment","quran-4-34","aisha-age","religious-freedom","slavery"];
/** Only authored topic and course links become internal website routes. */
export function articleHref(href: string, lang: Locale): string | null {
  if (href.startsWith("#") && hardQuestionIds.includes(href.slice(1))) return `/${lang}/topics/${href.slice(1)}`;
  if (new RegExp(`^/${lang}/start/[a-z0-9-]+$`).test(href)) return href;
  return null;
}
