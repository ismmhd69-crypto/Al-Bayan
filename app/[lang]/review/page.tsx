import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, isLocale, locales } from "@/lib/i18n";
import { AnswerView } from "@/components/AskChat";
import ReviewButtons from "@/components/ReviewButtons";
import { loadPrepared } from "@/lib/prepared";
import { getReviewDecisions } from "@/lib/content";
import { TOPIC_ANSWERS } from "@/data/topic-answers";

// Review tab (public until launch, Mo 2026-09-29): each prepared answer exactly as visitors would see
// it, with Approve / Reject. Decisions are stored in the database; only approved answers appear on the
// topic pages.
export const dynamic = "force-dynamic";

export default async function ReviewPage({ params, searchParams }: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ id?: string }>;
}) {
  const { lang } = await params;
  const { id } = await searchParams;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const decisions = await getReviewDecisions("topic");
  const ids = Object.keys(TOPIC_ANSWERS);
  const statusOf = (t: string) => decisions[t]?.status ?? "draft";
  const current = id && TOPIC_ANSWERS[id] ? id : ids.find((t) => statusOf(t) === "draft") ?? ids[0];
  const file = TOPIC_ANSWERS[current];
  const answer = file ? await loadPrepared(file, lang, { allowDraft: true }) : null;
  const drafts = ids.filter((t) => t !== current && statusOf(t) === "draft");

  return (
    <article className="page">
      <header className="page-head">
        <p className="eyebrow">Review</p>
        <h1>Prepared answers</h1>
        <p className="lead">
          {ids.filter((t) => statusOf(t) === "approved").length} approved,{" "}
          {ids.filter((t) => statusOf(t) === "rejected").length} rejected,{" "}
          {ids.filter((t) => statusOf(t) === "draft").length} to review
        </p>
      </header>
      <ul className="review-list">
        {ids.map((topic) => (
          <li key={topic}>
            <Link href={`/${lang}/review?id=${topic}`} aria-current={topic === current ? "page" : undefined}>
              {topic} · {statusOf(topic)}
            </Link>
          </li>
        ))}
      </ul>
      <p>
        Language:{" "}
        {locales.map((l) => (
          <Link key={l} href={`/${l}/review?id=${current}`}>
            {l}{" "}
          </Link>
        ))}
      </p>
      <p className="review-status">
        <strong>{current}</strong>: {statusOf(current)}
      </p>
      {answer ? (
        <AnswerView a={answer} t={dict.ask} id={0} />
      ) : (
        <p>This answer could not be shown: a source failed to load or a rule failed.</p>
      )}
      {decisions[current]?.note && <p className="muted">Last note: {decisions[current]?.note}</p>}
      <ReviewButtons
        kind="topic"
        id={current}
        status={statusOf(current)}
        next={drafts.length > 0 ? `/${lang}/review?id=${drafts[0]}` : undefined}
      />
    </article>
  );
}
