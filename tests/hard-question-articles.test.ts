import { afterEach, describe, expect, it, vi } from "vitest";
import { articleQuranReferences, articleReferences, hardQuestionArticles, showHardQuestionDrafts, splitHardQuestion } from "@/lib/learning/hard-questions";
import { articleHref, hardQuestionIds } from "@/lib/learning/hard-question-links";
import { learningLessons, referenceVerseKeys } from "@/lib/learning/course";

afterEach(() => vi.unstubAllEnvs());
describe("expanded Hard Questions articles", () => {
  it("preserves the original 12 and adds nine complete articles in three languages", () => {
    expect(hardQuestionArticles).toHaveLength(21);
    expect(hardQuestionArticles.map((a) => a.id)).toEqual(hardQuestionIds);
    for (const article of hardQuestionArticles) for (const lang of ["en", "ar", "de"] as const) {
      const parts = splitHardQuestion(article.body[lang], lang);
      expect(parts.core.length).toBeGreaterThan(100);
      expect(parts.explanation.length).toBeGreaterThan(200);
      expect(parts.followups).toHaveLength(3);
      expect(parts.followups.every((f) => f.question.length > 5 && f.answer.length > 30)).toBe(true);
      const references = articleReferences(article.body[lang]);
      expect(references.map((r) => r.id).sort()).toEqual(articleReferences(article.body.en).map((r) => r.id).sort());
      for (const ref of articleQuranReferences(references)) expect(referenceVerseKeys(ref).length, ref.title).toBeGreaterThan(0);
      for (const match of article.body[lang].matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
        const href = articleHref(match[1], lang);
        expect(href, `${article.id}/${lang}: ${match[1]}`).not.toBeNull();
        if (href?.includes("/start/")) expect(learningLessons.some((l) => l.id === href.split("/").pop())).toBe(true);
      }
      expect(article.body[lang]).not.toContain("127.0.0.1");
    }
  });
  it("keeps historical and scientific evidence distinct from religious sources", () => {
    expect(articleReferences(hardQuestionArticles[5].body.en).find((r) => r.id === "chimp2005")?.kind).toBe("science");
    expect(articleReferences(hardQuestionArticles[6].body.en).find((r) => r.id === "vanputten2019")?.kind).toBe("history");
    expect(articleReferences(hardQuestionArticles[11].body.en).find((r) => r.id === "ib31487")?.kind).toBe("scholar");
    expect(articleReferences(hardQuestionArticles[12].body.en).find((r) => r.id === "ccc464")?.kind).toBe("comparison");
    expect(articleReferences(hardQuestionArticles[16].body.en).find((r) => r.id === "barrak34299")?.kind).toBe("scholar");
    expect(articleHref("javascript:alert(1)", "en")).toBeNull();
    expect(articleHref("#unwritten-candidate", "en")).toBeNull();
  });
  it("enables the authored articles in production as well as development", () => {
    vi.stubEnv("NODE_ENV", "production"); expect(showHardQuestionDrafts()).toBe(true);
    vi.stubEnv("NODE_ENV", "development"); expect(showHardQuestionDrafts()).toBe(true);
  });
});
