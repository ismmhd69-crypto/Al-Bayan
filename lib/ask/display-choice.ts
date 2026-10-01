import type { Locale } from "@/lib/i18n";

export function shouldShowScholarTranslation(language: Locale, translation?: string): boolean {
  return language !== "ar" && !!translation;
}

