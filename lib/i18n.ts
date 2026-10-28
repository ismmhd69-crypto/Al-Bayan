import en from "@/dictionaries/en";
import de from "@/dictionaries/de";
import ar from "@/dictionaries/ar";

export const locales = ["ar", "en", "de"] as const;
export type Locale = (typeof locales)[number];
// Mo (2026-10-29): launch with Arabic and English only. German code and content are kept
// for later, but German is not offered: its pages, links and API requests are not served.
export const activeLocales = ["ar", "en"] as const satisfies readonly Locale[];
export const defaultLocale: Locale = "en";

export type Dictionary = typeof en;

const dictionaries: Record<Locale, Dictionary> = { en, de, ar };

/** A language the website currently serves (Arabic or English). */
export function isLocale(value: string): value is Locale {
  return (activeLocales as readonly string[]).includes(value);
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export function dirOf(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

// Names shown in the language switch, each in its own language.
export const localeNames: Record<Locale, string> = {
  ar: "العربية",
  en: "English",
  de: "Deutsch",
};
