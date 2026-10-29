import { describe, expect, it } from "vitest";
import extras from "@/data/learning/lesson-extras.json";
import { learningLessons } from "@/lib/learning/course";
import { lessonExtras, lessonExtrasProblems, type LessonExtrasEntry } from "@/lib/learning/extras";

const all = extras as Record<string, LessonExtrasEntry>;
const lesson = learningLessons.find((item) => item.id === "who-is-allah")!;
const approved = (entry: LessonExtrasEntry) => ({ [lesson.id]: { ...structuredClone(entry), status: "approved" as const } });

describe("lesson quiz and key takeaways", () => {
  it("covers every lesson, and every entry cites only sources the lesson already cites", () => {
    for (const item of learningLessons) {
      expect(all[item.id], item.id).toBeDefined();
      expect(lessonExtrasProblems(item, all[item.id]), item.id).toEqual([]);
    }
  });
  it("never shows a draft to visitors", () => {
    expect(lessonExtras(lesson, "en", { [lesson.id]: { ...all[lesson.id], status: "draft" } })).toBeNull();
  });
  it("shows approved extras with their sources in the reader's language", () => {
    const shown = lessonExtras(lesson, "de", approved(all[lesson.id]))!;
    expect(shown.takeaways).toHaveLength(3);
    expect(shown.takeaways.every((t) => t.reference?.url)).toBe(true);
    expect(shown.quiz.options).toHaveLength(4);
    expect(shown.quiz.question).toBe(all[lesson.id].quiz.de.question);
  });
  it("refuses an approved entry that cites a source outside the lesson", () => {
    const entry = structuredClone(all[lesson.id]);
    entry.quiz.refs = ["b2620"];
    expect(lessonExtrasProblems(lesson, entry).join(" ")).toMatch(/not cited/);
    expect(lessonExtras(lesson, "en", approved(entry))).toBeNull();
  });
  it("refuses an approved entry with a missing translation or a wrong answer index", () => {
    const missing = structuredClone(all[lesson.id]);
    missing.takeaways.ar = ["", "", ""];
    expect(lessonExtras(lesson, "ar", approved(missing))).toBeNull();
    const index = structuredClone(all[lesson.id]);
    index.quiz.correct = 4;
    expect(lessonExtras(lesson, "en", approved(index))).toBeNull();
  });
});
