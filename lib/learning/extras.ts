import extras from "@/data/learning/lesson-extras.json";
import type { Locale } from "@/lib/i18n";
import { learningReferences, lessonReferences, type LearningLesson, type LearningReference } from "./course";

// Key takeaways and one quick-check question per lesson (data/learning/lesson-extras.json).
// Written only from the lesson's own text and the sources it already cites. Visitors see a
// lesson's extras only after Mo marks them "approved"; drafts never leave this module.

type QuizText = { question: string; options: string[]; explanation: string };
export type LessonExtrasEntry = {
  status: "draft" | "approved";
  takeaways: Record<Locale, string[]>;
  takeawayRefs: string[];
  quiz: Record<Locale, QuizText> & { correct: number; refs: string[] };
};
export type LessonExtras = {
  takeaways: { text: string; reference: LearningReference }[];
  quiz: QuizText & { correct: number; references: LearningReference[] };
};

const all = extras as Record<string, LessonExtrasEntry>;
const LOCALES: Locale[] = ["ar", "en", "de"];

/** Problems that keep an entry off the page. Empty when the entry is complete and only cites the lesson's own sources. */
export function lessonExtrasProblems(lesson: LearningLesson, entry: LessonExtrasEntry): string[] {
  const problems: string[] = [];
  const cited = new Set(LOCALES.flatMap((lang) => lessonReferences(lesson.body[lang]).map((ref) => ref.id)));
  const refOk = (key: string) => !!learningReferences[key] && cited.has(learningReferences[key].id);
  if (entry.takeawayRefs.length !== 3) problems.push("takeawayRefs must have 3 entries");
  for (const key of [...entry.takeawayRefs, ...entry.quiz.refs]) if (!refOk(key)) problems.push(`reference ${key} is not cited in this lesson`);
  if (entry.quiz.refs.length < 1) problems.push("quiz needs a source");
  for (const lang of LOCALES) {
    const takeaways = entry.takeaways[lang], quiz = entry.quiz[lang];
    if (!Array.isArray(takeaways) || takeaways.length !== 3 || takeaways.some((t) => !t?.trim())) problems.push(`${lang}: 3 takeaways needed`);
    if (!quiz?.question?.trim() || !quiz.explanation?.trim()) problems.push(`${lang}: quiz question and explanation needed`);
    if (!Array.isArray(quiz?.options) || quiz.options.length !== 4 || quiz.options.some((o) => !o?.trim())) problems.push(`${lang}: 4 quiz options needed`);
    const text = [...(takeaways ?? []), quiz?.question, ...(quiz?.options ?? []), quiz?.explanation].join(" ");
    if (lang === "ar" ? !/\p{Script=Arabic}/u.test(text) : /\p{Script=Arabic}{4,}/u.test(text.replace(/«[^»]*»/g, ""))) problems.push(`${lang}: text is not in this language`);
  }
  if (!Number.isInteger(entry.quiz.correct) || entry.quiz.correct < 0 || entry.quiz.correct > 3) problems.push("quiz.correct must be 0 to 3");
  return problems;
}

/** Approved, complete extras for a lesson in one language, or null. */
export function lessonExtras(lesson: LearningLesson, lang: Locale, source: Record<string, LessonExtrasEntry> = all): LessonExtras | null {
  const entry = source[lesson.id];
  if (!entry || entry.status !== "approved" || lessonExtrasProblems(lesson, entry).length) return null;
  const quiz = entry.quiz[lang];
  return {
    takeaways: entry.takeaways[lang].map((text, i) => ({ text, reference: learningReferences[entry.takeawayRefs[i]] })),
    quiz: { ...quiz, correct: entry.quiz.correct, references: entry.quiz.refs.map((key) => learningReferences[key]) },
  };
}
