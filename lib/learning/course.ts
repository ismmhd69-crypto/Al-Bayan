import content from "@/data/learning/new-to-islam.json";
import type { Locale } from "@/lib/i18n";
import { VERSES_PER_SURAH, isRealVerse } from "@/lib/sources/quran-meta";

export type LearningReference = { id: string; url: string; title: string; kind: "quran" | "hadith" | "scholar" };
export type LearningLesson = { id: string; number: number; chapter: number; title: Record<Locale, string>; body: Record<Locale, string>; sourceMap: string; editorialNotes: string; quranAddition: boolean };
export type LearningChapter = { id: number; first: number; last: number; title: Record<Locale, string> };
export type LessonSummary = { id: string; number: number; chapter: number; title: string; minutes: number };
export const learningLessons = content.lessons as LearningLesson[];
export const learningChapters = content.chapters as LearningChapter[];
export const learningReferences = content.references as Record<string, LearningReference>;
export function findLearningLesson(id: string) { return learningLessons.find((lesson) => lesson.id === id); }
export function lessonSummary(lesson: LearningLesson, lang: Locale): LessonSummary {
  return { id: lesson.id, number: lesson.number, chapter: lesson.chapter, title: lesson.title[lang], minutes: Math.max(2, Math.ceil(lesson.body[lang].replace(/\[[^\]]+\]\[[^\]]+\]/g, "").split(/\s+/).length / 190)) };
}
export function lessonReferences(body: string): LearningReference[] {
  return [...new Set([...body.matchAll(/\[[^\]]+\]\[([^\]]+)\]/g)].map((match) => match[1]))].map((key) => learningReferences[key]).filter(Boolean);
}
/** Resolve only explicit, real source passages. A reference to a surah preserves all its verses. */
export function referenceVerseKeys(reference: LearningReference): string[] {
  if (reference.kind !== "quran") return [];
  const m = reference.title.match(/^Quran (\d+)(?::(\d+)(?:[–-](\d+))?)?(?=[:\s]|$)/);
  if (!m) return [];
  const surah = Number(m[1]), start = Number(m[2] ?? 1), end = Number(m[3] ?? m[2] ?? VERSES_PER_SURAH[surah - 1]);
  if (!isRealVerse(surah, start) || !isRealVerse(surah, end) || end < start || end - start > 20) return [];
  return Array.from({ length: end - start + 1 }, (_, i) => `${surah}:${start + i}`);
}
export const prayerKeys = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
export type PrayerKey = (typeof prayerKeys)[number];
export type LessonParts = { core: string; explanation: string; guide: string; followups: { question: string; answer: string }[]; transition: string; branches: { key: PrayerKey; text: string }[] };
export function splitLearningLesson(body: string, lang: Locale): LessonParts {
  const labels = {
    en: ["Core answer", "Let's understand it", "Bayan's guide", "Follow-up answers", "Next"],
    ar: ["الإجابة الأساسية", "لنفهم المعنى", "خطوتك مع بيان", "أسئلة متابعة", "التالي"],
    de: ["Die Antwort", "Gemeinsam verstehen", "Dein nächster Schritt mit Bayan", "Weitere Fragen", "Weiter"],
  }[lang];
  const positions = labels.map((label, index) => body.indexOf(`**${label}${index === 4 ? ":**" : ""}`));
  if (positions.some((p) => p < 0) || positions.some((p, i) => i > 0 && p <= positions[i - 1])) throw new Error("Incomplete learning lesson sections");
  const section = (n: number) => body.slice(positions[n], positions[n + 1] ?? body.length).replace(/^\*\*[^\n]*?\*\*\s*/, "").trim();
  let explanation = section(1);
  const branches: LessonParts["branches"] = [];
  explanation = explanation.replace(/<a id="prayer-(fajr|dhuhr|asr|maghrib|isha)(?:-ar|-de)?"><\/a>\s*([\s\S]*?)(?=<a id="prayer-|$)/g, (_, key: PrayerKey, text: string) => { branches.push({ key, text: text.trim() }); return ""; });
  if (branches.length) explanation = explanation.replace(/\*\*(The branches|الفروع|فروع الصلوات|Die Abläufe|Die einzelnen Gebete|Die Varianten|Gebetsabläufe|تسلسل الصلوات|Die Gebetsfolgen|Die Gebetszweige)[^*]*\*\*\s*$/, "");
  const followups = [...section(3).matchAll(/^- \*\*([^*]+)\*\*\s*([\s\S]*?)(?=^- \*\*|$)/gm)].map((m) => ({ question: m[1], answer: m[2].trim() }));
  return { core: section(0), explanation, guide: section(2), followups, transition: section(4), branches };
}
