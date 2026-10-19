import { describe, expect, it } from "vitest";
import { learningChapters, learningLessons, lessonReferences, referenceVerseKeys, splitLearningLesson } from "@/lib/learning/course";
import { emptyProgress, parseReadingProgress } from "@/lib/learning/progress";

describe("New to Islam learning course", () => {
  it("keeps the approved 32-lesson six-chapter order with complete equivalents", () => {
    expect(learningLessons.map((lesson) => lesson.number)).toEqual(Array.from({ length: 32 }, (_, i) => i + 1));
    expect(learningChapters.map((chapter) => learningLessons.filter((lesson) => lesson.chapter === chapter.id).length)).toEqual([6, 5, 5, 5, 6, 5]);
    expect(new Set(learningLessons.map((lesson) => lesson.id)).size).toBe(32);
    for (const lesson of learningLessons) for (const lang of ["en", "ar", "de"] as const) {
      const parts = splitLearningLesson(lesson.body[lang], lang);
      expect(lesson.title[lang].length).toBeGreaterThan(3);
      for (const text of [parts.core, parts.explanation, parts.guide]) expect(text.length, `${lesson.number}/${lang}`).toBeGreaterThan(30);
      expect(parts.transition.trim().length, `${lesson.number}/${lang} transition`).toBeGreaterThan(3);
      expect(parts.followups.length, `${lesson.number}/${lang}`).toBeGreaterThanOrEqual(2);
      expect(parts.followups.length, `${lesson.number}/${lang}`).toBeLessThanOrEqual(3);
      expect(parts.followups.every((item) => item.answer.length > 30)).toBe(true);
      const sources = lessonReferences(lesson.body[lang]);
      expect(sources.some((source) => source.kind === "quran"), `Quran reference ${lesson.number}/${lang}`).toBe(true);
      for (const source of sources) {
        expect(source.url).toMatch(/^https:\/\/(quran\.com|sunnah\.com|binbaz\.org\.sa)\//);
        if (source.kind === "quran") expect(referenceVerseKeys(source).length, source.title).toBeGreaterThan(0);
      }
      const expected = lessonReferences(lesson.body.en).map((source) => source.id).sort();
      expect(sources.map((source) => source.id).sort()).toEqual(expected);
    }
  });
  it("preserves all prayer branches and complete sitting wordings", () => {
    const lesson = learningLessons.find((lesson) => lesson.id === "how-to-pray")!;
    for (const lang of ["en", "ar", "de"] as const) {
      const parts = splitLearningLesson(lesson.body[lang], lang);
      expect(parts.branches.map((branch) => branch.key)).toEqual(["fajr", "dhuhr", "asr", "maghrib", "isha"]);
      expect(parts.branches.every((branch) => branch.text.length > 50)).toBe(true);
      // A selected prayer must provide its own continuation without another prayer's panel.
      for (const key of ["asr", "isha"] as const) {
        const branch = parts.branches.find((entry) => entry.key === key)!;
        expect(branch.text).not.toMatch(/Dhuhr|الظهر/);
        expect(branch.text).toMatch(/Allahu akbar|الله أكبر/);
        expect(branch.text).toMatch(/fourth|الرابعة|vierten/);
        expect(branch.text).toMatch(/greetings|التسليمتين|Abschlussgrüße/);
      }
      expect(parts.explanation).toContain("التحيات لله والصلوات والطيبات");
      expect(parts.explanation).toContain("اللهم صل على محمد");
      expect(parts.explanation).toContain("اللهم إني أعوذ بك");
      expect(parts.explanation).not.toContain('<a id="prayer-');
    }
  });
  it("does not strip letter suffixes or make topic links substitute for source evidence", () => {
    const sources = lessonReferences(learningLessons[0].body.en);
    expect(sources.find((source) => source.id === "m8a")?.url).toBe("https://sunnah.com/muslim:8a");
    expect(referenceVerseKeys(sources.find((source) => source.id === "q436")!)).toEqual(["4:36"]);
    expect(referenceVerseKeys(lessonReferences(learningLessons[1].body.en).find((source) => source.id === "q112")!)).toEqual(["112:1", "112:2", "112:3", "112:4"]);
  });
});
describe("reading progress", () => {
  const ids = learningLessons.map((lesson) => lesson.id);
  it("rejects corrupt history and unknown entries without treating old steps as new readings", () => {
    expect(parseReadingProgress("broken", ids)).toEqual(emptyProgress());
    expect(parseReadingProgress(JSON.stringify({ read: ["purpose", ids[0], ids[0], 42], last: "missing" }), ids)).toEqual({ read: [ids[0]], last: null });
    expect(parseReadingProgress(JSON.stringify({ read: [], last: ids[7] }), ids)).toEqual({ read: [], last: ids[7] });
  });
});
