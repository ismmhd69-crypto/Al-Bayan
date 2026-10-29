import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import extras from "@/data/learning/lesson-extras.json";
import { learningLessons, learningReferences, splitLearningLesson } from "@/lib/learning/course";
import { lessonExtrasProblems, type LessonExtrasEntry } from "@/lib/learning/extras";
import { learningSourceLabel } from "@/lib/learning/text";
import "../../start/learning.css";

// Private review page for the lesson quizzes and key takeaways (Mo's local review only). Hidden on
// the live site. Shows each draft beside the lesson's own clear answer and the sources it cites.
export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

const all = extras as Record<string, LessonExtrasEntry>;

export default async function LessonExtrasReviewPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (process.env.NODE_ENV === "production" || !isLocale(lang)) notFound();
  const sourceLink = (key: string) => {
    const ref = learningReferences[key];
    return ref ? <a key={key} href={ref.url} target="_blank" rel="noopener noreferrer">{learningSourceLabel(ref.title, lang)}</a> : <strong key={key}>{key} (missing)</strong>;
  };
  const approved = learningLessons.filter((lesson) => all[lesson.id]?.status === "approved").length;
  return <div className="page learning-page" style={{ maxInlineSize: 900 }}>
    <header className="page-head">
      <h1>Lesson quiz and takeaways review</h1>
      <p className="learning-small">Private, local only. {approved} of {learningLessons.length} approved. Each draft is shown beside the lesson&apos;s clear answer. Tell Claude which lessons to approve or what to change.</p>
    </header>
    {learningLessons.map((lesson) => {
      const entry = all[lesson.id];
      if (!entry) return <section key={lesson.id}><h2>{lesson.number}. {lesson.title[lang]}</h2><p>Not written yet.</p></section>;
      const problems = lessonExtrasProblems(lesson, entry);
      const quiz = entry.quiz[lang];
      return <section key={lesson.id} id={lesson.id} style={{ display: "grid", gap: 12, paddingBlock: 20, borderBlockStart: "1px solid var(--line)" }}>
        <h2>{lesson.number}. {lesson.title[lang]} <small className="learning-small">({lesson.id} · {entry.status})</small></h2>
        {problems.length > 0 && <p role="alert" style={{ color: "#c2410c" }}>Problems: {problems.join("; ")}</p>}
        <details><summary>The lesson&apos;s clear answer</summary><p className="learning-small" style={{ whiteSpace: "pre-wrap" }}>{splitLearningLesson(lesson.body[lang], lang).core}</p></details>
        <div>
          <h3>Key takeaways</h3>
          <ol>{entry.takeaways[lang].map((text, i) => <li key={i}>{text} · {sourceLink(entry.takeawayRefs[i])}</li>)}</ol>
        </div>
        <div>
          <h3>Quick check</h3>
          <p><strong>{quiz.question}</strong></p>
          <ol type="A">{quiz.options.map((option, i) => <li key={i} style={i === entry.quiz.correct ? { color: "var(--quran-accent)", fontWeight: 700 } : undefined}>{option}{i === entry.quiz.correct ? "  ✓ correct" : ""}</li>)}</ol>
          <p>{quiz.explanation} · {entry.quiz.refs.map(sourceLink)}</p>
        </div>
      </section>;
    })}
  </div>;
}
