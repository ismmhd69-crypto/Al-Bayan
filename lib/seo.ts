// Shared SEO utilities for Al-Bayan. Single source of truth for production URL,
// launch languages, canonical URLs, language alternates, and structured data.

export const LAUNCH_LOCALES = ["ar", "en"] as const;
export type LaunchLocale = (typeof LAUNCH_LOCALES)[number];

/**
 * Returns the reliable production site address.
 * Defaults strictly to https://askbayan.org so preview deployments or hosting branch
 * variables cannot accidentally become production canonical URLs.
 */
export function getSiteUrl(): string {
  return (process.env.SITE_URL ?? "https://askbayan.org").replace(/\/+$/, "");
}

/**
 * Normalizes a relative path ensuring a leading slash and no trailing slash.
 */
function cleanPath(path: string): string {
  const trimmed = path.trim().replace(/\/+$/, "");
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

/**
 * Builds an absolute canonical URL for a given language and path.
 */
export function buildCanonicalUrl(lang: string, path: string = ""): string {
  const base = getSiteUrl();
  const sub = cleanPath(path);
  return `${base}/${lang}${sub === "/" ? "" : sub}`;
}

/**
 * Builds language alternate URLs (hreflang) strictly for launch languages (ar, en)
 * pointing to the matching translated subpage.
 */
export function buildLanguageAlternates(path: string = ""): Record<string, string> {
  const base = getSiteUrl();
  const sub = cleanPath(path);
  const suffix = sub === "/" ? "" : sub;
  return {
    ar: `${base}/ar${suffix}`,
    en: `${base}/en${suffix}`,
    "x-default": `${base}/en${suffix}`,
  };
}

/**
 * Builds Schema.org WebSite structured data for the root layout.
 * SearchAction is intentionally omitted because the Ask workspace does not support search query URL parameters.
 */
export function buildWebSiteSchema(lang: string, description: string) {
  const base = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Al-Bayan",
    alternateName: "البيان",
    url: base,
    inLanguage: lang,
    description,
    publisher: {
      "@type": "Organization",
      name: "Al-Bayan",
      url: base,
      logo: `${base}/icon.svg`,
    },
  };
}

/**
 * Builds Schema.org Article structured data for content pages.
 * Omits datePublished and dateModified unless real, verified dates are supplied.
 */
export function buildArticleSchema(options: {
  title: string;
  description?: string;
  url: string;
  lang: string;
  datePublished?: string;
  dateModified?: string;
}) {
  const base = getSiteUrl();
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: options.title,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": options.url,
    },
    inLanguage: options.lang,
    author: {
      "@type": "Organization",
      name: "Al-Bayan",
      url: base,
    },
    publisher: {
      "@type": "Organization",
      name: "Al-Bayan",
      url: base,
      logo: {
        "@type": "ImageObject",
        url: `${base}/icon.svg`,
      },
    },
  };

  if (options.description) {
    schema.description = options.description;
  }
  if (options.datePublished) {
    schema.datePublished = options.datePublished;
  }
  if (options.dateModified) {
    schema.dateModified = options.dateModified;
  }

  return schema;
}
