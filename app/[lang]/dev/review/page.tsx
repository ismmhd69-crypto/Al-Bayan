import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, isLocale, locales } from "@/lib/i18n";
import { AnswerView } from "@/components/AskChat";
import ReviewButtons from "@/components/ReviewButtons";
import { loadPrepared } from "@/lib/prepared";
import { TOPIC_ANSWERS } from "@/data/topic-answers";

// Mo's private review page for prepared answers (local only, never on the live site).
// Shows each draft exactly as visitors would see it; Approve / Reject writes the status into the file,
// which Claude then commits. Only approved answers appear on the public topic pages.
export const dynamic = "force-dynamic";

export default async function ReviewPage({ params, searchParams }: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ id?: string }>;
}) {
  const { lang } = await params;
  const { id } = await searchParams;
  if (process.env.NODE_ENV === "production" || !isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const ids = Object.keys(TOPIC_ANSWERS);
  const current = id && TOPIC_ANSWERS[id] ? id : ids[0];
  const file = TOPIC_ANSWERS[current];
  const answer = file ? await loadPrepared(file, lang, { allowDraft: true }) : null;

  return (
    <article className="page">
      <header className="page-head">
        <p className="eyebrow">Review (local only)</p>
        <h1>Prepared answers</h1>
      </header>
      <ul className="review-list">
        {ids.map((topic) => (
          <li key={topic}>
            <Link href={`/${lang}/dev/review?id=${topic}`} aria-current={topic === current ? "page" : undefined}>
              {topic} · {TOPIC_ANSWERS[topic].status}
            </Link>
          </li>
        ))}
      </ul>
      <p>
        Language:{" "}
        {locales.map((l) => (
          <Link key={l} href={`/${l}/dev/review?id=${current}`}>
            {l}{" "}
          </Link>
        ))}
      </p>
      {answer ? (
        <AnswerView a={answer} t={dict.ask} id={0} />
      ) : (
        <p>This draft could not be shown: a source failed to load or a rule failed. Ask Claude to check it.</p>
      )}
      {file?.review_note && <p className="muted">Last note: {file.review_note}</p>}
      <ReviewButtons kind="topic" id={current} status={file?.status ?? "draft"} />
    </article>
  );
}
