"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { LessonExtras } from "@/lib/learning/extras";
import { learningText, learningSourceLabel } from "@/lib/learning/text";

/** One quick-check question. Instant feedback, nothing stored or sent. */
export default function LessonQuiz({ lang, quiz, onSolved }: { lang: Locale; quiz: LessonExtras["quiz"]; onSolved?: () => void }) {
  const t = learningText[lang];
  const [tried, setTried] = useState<number[]>([]);
  const solved = tried.includes(quiz.correct);
  const last = tried.at(-1);
  return <section id="lesson-quiz" className="lesson-quiz" aria-labelledby="lesson-quiz-title">
    <h2 id="lesson-quiz-title">{t.quickCheck}</h2>
    <p className="lesson-quiz-question" id="lesson-quiz-question">{quiz.question}</p>
    <div className="lesson-quiz-options" role="group" aria-labelledby="lesson-quiz-question">
      {quiz.options.map((option, i) => {
        const state = tried.includes(i) ? (i === quiz.correct ? "ok" : "bad") : "";
        return <button key={i} type="button" className={`lesson-quiz-option ${state}`} disabled={solved && i !== quiz.correct}
          aria-pressed={tried.includes(i)} onClick={() => { setTried((value) => value.includes(i) ? value : [...value, i]); if (i === quiz.correct) onSolved?.(); }}>
          <span className="lesson-quiz-mark" aria-hidden="true">{state === "ok" ? <Check /> : state === "bad" ? <X /> : null}</span>
          <span>{option}</span>
        </button>;
      })}
    </div>
    <div className="lesson-quiz-feedback" aria-live="polite">
      {last !== undefined && (solved
        ? <p className="lesson-quiz-ok"><strong>{t.quizCorrect}</strong> {quiz.explanation}{" "}
            <span className="lesson-quiz-source">{t.quizSource}: {quiz.references.map((ref, i) => <span key={ref.id}>{i > 0 && ", "}<a href={`#learning-source-${ref.id}`}>{learningSourceLabel(ref.title, lang)}</a></span>)}</span></p>
        : <p className="lesson-quiz-bad">{t.quizWrong}</p>)}
    </div>
  </section>;
}
