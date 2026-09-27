import en from "@/dictionaries/en";
import de from "@/dictionaries/de";
import ar from "@/dictionaries/ar";

export const locales = ["ar", "en", "de"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export type Dictionary = typeof en;

const dictionaries: Record<Locale, Dictionary> = { en, de, ar };

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
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
