import { describe, expect, it } from "vitest";
import {
  getSiteUrl,
  buildCanonicalUrl,
  buildLanguageAlternates,
  buildWebSiteSchema,
  buildArticleSchema,
  LAUNCH_LOCALES,
  buildContentDescription,
} from "@/lib/seo";
import sitemap from "@/app/sitemap";
import { hardQuestionArticles, splitHardQuestion } from "@/lib/learning/hard-questions";
import { learningLessons, splitLearningLesson } from "@/lib/learning/course";

describe("lib/seo", () => {
  it("includes every current article and lesson in both launch languages, with no duplicate or German URLs", () => {
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls.some((url) => url.includes("/de/"))).toBe(false);
    for (const lang of LAUNCH_LOCALES) {
      for (const article of hardQuestionArticles) {
        expect(urls).toContain(buildCanonicalUrl(lang, `/topics/${article.id}`));
      }
      for (const lesson of learningLessons) {
        expect(urls).toContain(buildCanonicalUrl(lang, `/start/${lesson.id}`));
      }
    }
    for (const entry of entries) {
      expect(entry.lastModified).toBeUndefined();
      expect(Object.values(entry.alternates!.languages!)).toContain(entry.url);
    }
  });

  it("extracts a readable description from source-linked Markdown", () => {
    expect(buildContentDescription("**A clear answer** with [evidence][source-1] and [a link](https://example.com)."))
      .toBe("A clear answer with evidence and a link.");
    for (const lang of LAUNCH_LOCALES) {
      const introductions = [
        ...hardQuestionArticles.map((article) => splitHardQuestion(article.body[lang], lang).core),
        ...learningLessons.map((lesson) => splitLearningLesson(lesson.body[lang], lang).core),
      ];
      for (const introduction of introductions) {
        const description = buildContentDescription(introduction);
        expect(description.length).toBeGreaterThan(20);
        expect(Array.from(description).length).toBeLessThanOrEqual(160);
        expect(description).not.toMatch(/\[[^\]]+\]\[/);
      }
    }
  });
  it("defaults strictly to https://askbayan.org and ignores preview environment host URLs", () => {
    expect(getSiteUrl()).toBe("https://askbayan.org");
  });

  it("limits launch locales strictly to Arabic and English", () => {
    expect(LAUNCH_LOCALES).toEqual(["ar", "en"]);
  });

  it("builds correct canonical URLs with clean leading and trailing slashes", () => {
    expect(buildCanonicalUrl("ar", "/")).toBe("https://askbayan.org/ar");
    expect(buildCanonicalUrl("en", "topics/doubt")).toBe("https://askbayan.org/en/topics/doubt");
    expect(buildCanonicalUrl("ar", "/topics/doubt/")).toBe("https://askbayan.org/ar/topics/doubt");
    expect(buildCanonicalUrl("en", "/start/purpose")).toBe("https://askbayan.org/en/start/purpose");
  });

  it("builds language alternates linking directly to the matching translated page", () => {
    const alternates = buildLanguageAlternates("/start/purpose");
    expect(alternates).toEqual({
      ar: "https://askbayan.org/ar/start/purpose",
      en: "https://askbayan.org/en/start/purpose",
      "x-default": "https://askbayan.org/en/start/purpose",
    });
  });

  it("creates valid Schema.org WebSite structured data without unsupported SearchAction", () => {
    const schema = buildWebSiteSchema("ar", "Islamic Q&A");
    expect(schema["@type"]).toBe("WebSite");
    expect(schema.url).toBe("https://askbayan.org");
    expect(schema.inLanguage).toBe("ar");
    expect(schema).not.toHaveProperty("potentialAction");
  });

  it("creates valid Schema.org Article structured data without invented dates", () => {
    const schema = buildArticleSchema({
      title: "الشك والإيمان",
      description: "ما حكم الشك في الإيمان؟",
      url: "https://askbayan.org/ar/topics/doubt",
      lang: "ar",
    });
    expect(schema["@type"]).toBe("Article");
    expect(schema.headline).toBe("الشك والإيمان");
    expect(schema.inLanguage).toBe("ar");
    expect((schema.author as Record<string, unknown>)["@type"]).toBe("Organization");
    expect((schema.author as Record<string, unknown>).name).toBe("Al-Bayan");
    expect(schema).not.toHaveProperty("datePublished");
    expect(schema).not.toHaveProperty("dateModified");
  });

  it("attaches datePublished and dateModified only when verified dates are explicitly supplied", () => {
    const schema = buildArticleSchema({
      title: "Faith",
      url: "https://askbayan.org/en/topics/doubt",
      lang: "en",
      datePublished: "2026-09-30T00:00:00Z",
    });
    expect(schema.datePublished).toBe("2026-09-30T00:00:00Z");
    expect(schema).not.toHaveProperty("dateModified");
  });
});
