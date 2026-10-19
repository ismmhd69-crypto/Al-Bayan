import content from "@/data/learning/hard-questions.json";
import type { Locale } from "@/lib/i18n";
import type { LearningReference } from "./course";

export type ArticleSourceKind = "quran" | "hadith" | "scholar" | "history" | "science" | "comparison";
export type ArticleReference = { id: string; title: string; url: string; kind: ArticleSourceKind };
export type HardQuestionArticle = {
  id: string; number: number; category: "belief" | "science" | "preservation" | "women" | "history";
  title: Record<Locale, string>; body: Record<Locale, string>; sourceMap: string; editorialNotes: string;
};
export const hardQuestionArticles = content.articles as HardQuestionArticle[];
export const hardQuestionReferences = content.references as Record<string, ArticleReference>;
// Implementation preview only. Publication approval is separate; no approval records are changed.
export function showHardQuestionDrafts() { return process.env.NODE_ENV === "development"; }
export function findHardQuestionArticle(id: string) { return hardQuestionArticles.find((article) => article.id === id); }
export function articleReferences(body: string) {
  return [...new Set([...body.matchAll(/\[[^\]]+\]\[([^\]]+)\]/g)].map((m) => m[1]))].map((id) => {
    const source = hardQuestionReferences[id];
    if (!source) throw new Error(`Unknown article reference: ${id}`);
    return source;
  });
}
export function articleQuranReferences(references: ArticleReference[]): LearningReference[] {
  return references.filter((r) => r.kind === "quran").map((r) => ({ ...r, kind: "quran" as const }));
}
export function splitHardQuestion(body: string, lang: Locale) {
  const labels = { en: ["The clear answer", "Let’s unpack it", "Follow-up answers", "Continue:"], ar: ["الجواب الواضح", "لنفهم المسألة", "أسئلة متابعة", "للمتابعة:"], de: ["Die klare Antwort", "Die Frage genauer verstehen", "Weitere Fragen", "Weiterlesen:"] }[lang];
  const positions = labels.map((label) => body.indexOf(`**${label}**`));
  if (positions.some((p) => p < 0) || positions.some((p, i) => i > 0 && p <= positions[i - 1])) throw new Error("Incomplete hard question sections");
  const section = (i: number) => body.slice(positions[i] + labels[i].length + 4, positions[i + 1] ?? body.length).trim();
  const followups = [...section(2).matchAll(/^- \*\*([^*]+)\*\*\s*([\s\S]*?)(?=^- \*\*|$)/gm)].map((m) => ({ question: m[1], answer: m[2].trim() }));
  return { core: section(0), explanation: section(1), followups, related: section(3) };
}
export const hardQuestionText = {
  en: { back: "All hard questions", answer: "The clear answer", deeper: "Let’s unpack it", followups: "Questions you may still have", sources: "Explore the evidence", related: "Keep exploring", previous: "Previous question", next: "Next question", navigate: "In this answer", draft: "Editorial draft", note: "A prepared Bayan explanation with linked sources. Independent scholarly and language review remain open.", history: "Historical and documentary evidence", science: "Scientific evidence", hadith: "Authentic hadith", scholar: "Named scholarly explanations", open: "Read the original source", sourceNote: "Read the linked passage in context. Bayan’s explanation is a paraphrase, not a quotation.", researchNote: "These sources support historical, scientific or documentary discussion. They are separate from religious teaching.", ask: "Ask a follow-up", minute: "About {n} minutes to read", newIslam: "New to Islam", listNote: "Explore a question, read the explanation and inspect its sources. You can start anywhere." },
  ar: { back: "كل الأسئلة الصعبة", answer: "الجواب الواضح", deeper: "لنفهم المسألة", followups: "أسئلة قد تبقى لديك", sources: "تصفح الأدلة", related: "واصل الاستكشاف", previous: "السؤال السابق", next: "السؤال التالي", navigate: "في هذا الجواب", draft: "مسودة تحريرية", note: "شرح أعده بيان مع مصادر مرتبطة. المراجعة الشرعية واللغوية المستقلة لا تزال مفتوحة.", history: "أدلة تاريخية ووثائق", science: "أدلة علمية تجريبية", hadith: "أحاديث صحيحة أو حسنة", scholar: "شروح منسوبة إلى علماء", open: "اقرأ المصدر الأصلي", sourceNote: "اقرأ المقطع المرتبط في سياقه. شرح بيان صياغة تفسيرية، وليس اقتباساً.", researchNote: "تدعم هذه المصادر النقاش التاريخي أو العلمي أو الوثائقي، وهي متميزة عن التعليم الديني.", ask: "اسأل سؤالاً إضافياً", minute: "نحو {n} دقائق للقراءة", newIslam: "مدخل إلى الإسلام", listNote: "اختر سؤالاً واقرأ شرحه وافحص مصادره. يمكنك البدء من أي سؤال." },
  de: { back: "Alle schwierigen Fragen", answer: "Die klare Antwort", deeper: "Die Frage genauer verstehen", followups: "Fragen, die noch offen sein könnten", sources: "Die Belege ansehen", related: "Weiter erkunden", previous: "Vorherige Frage", next: "Nächste Frage", navigate: "In dieser Antwort", draft: "Redaktioneller Entwurf", note: "Eine vorbereitete Erklärung von Bayan mit verlinkten Quellen. Die unabhängige gelehrte und sprachliche Prüfung steht noch aus.", history: "Historische Belege und Dokumente", science: "Wissenschaftliche Belege", hadith: "Authentische Hadithe", scholar: "Erklärungen genannter Gelehrter", open: "Originalquelle lesen", sourceNote: "Lies die verlinkte Stelle im Zusammenhang. Bayans Erklärung ist eine Paraphrase, kein Zitat.", researchNote: "Diese Quellen stützen historische, wissenschaftliche oder dokumentarische Erörterungen. Sie sind von religiöser Lehre getrennt.", ask: "Eine weitere Frage stellen", minute: "Etwa {n} Minuten Lesezeit", newIslam: "Neu im Islam", listNote: "Wähle eine Frage, lies die Erklärung und prüfe die Quellen. Du kannst überall beginnen." },
} satisfies Record<Locale, Record<string, string>>;
