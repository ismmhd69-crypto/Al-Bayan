import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, isLocale, locales } from "@/lib/i18n";
import { AnswerView } from "@/components/AskChat";
import ReviewButtons from "@/components/ReviewButtons";
import { loadPrepared } from "@/lib/prepared";
import { getReviewDecisions } from "@/lib/content";
import { TOPIC_ANSWERS } from "@/data/topic-answers";
import { PREPARED_ANSWERS } from "@/data/prepared-answers";

// Review tab (public until launch, Mo 2026-09-29): each prepared answer exactly as visitors would see
// it, with Approve / Reject. Decisions are stored in the database; only approved answers appear on the
// topic pages.
export const dynamic = "force-dynamic";

export default async function ReviewPage({ params, searchParams }: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ id?: string; kind?: string }>;
}) {
  const { lang } = await params;
  const { id, kind: kindParam } = await searchParams;
  const kind = kindParam === "prepared" ? "prepared" : "topic";
  const ALL = kind === "topic" ? TOPIC_ANSWERS : PREPARED_ANSWERS;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const decisions = await getReviewDecisions(kind);
  const ids = Object.keys(ALL);
  const statusOf = (t: string) => decisions[t]?.status ?? "draft";
  const current = id && ALL[id] ? id : ids.find((t) => statusOf(t) === "draft") ?? ids[0];
  const file = ALL[current];
  const q = (k: string, extra = "") => `/${lang}/review?kind=${kind}&id=${k}${extra}`;
  const answer = file ? await loadPrepared(file, lang, { allowDraft: true }) : null;
  const drafts = ids.filter((t) => t !== current && statusOf(t) === "draft");

  return (
    <article className="page">
      <header className="page-head">
        <p className="eyebrow">Review</p>
        <h1>Prepared answers</h1>
        <p>
          <Link href={`/${lang}/review?kind=topic`} aria-current={kind === "topic" ? "page" : undefined}>Hard questions topics</Link>
          {" · "}
          <Link href={`/${lang}/review?kind=prepared`} aria-current={kind === "prepared" ? "page" : undefined}>Common questions</Link>
        </p>
        <p className="lead">
          {ids.filter((t) => statusOf(t) === "approved").length} approved,{" "}
          {ids.filter((t) => statusOf(t) === "rejected").length} rejected,{" "}
          {ids.filter((t) => statusOf(t) === "draft").length} to review
        </p>
      </header>
      <ul className="review-list">
        {ids.map((topic) => (
          <li key={topic}>
            <Link href={q(topic)} aria-current={topic === current ? "page" : undefined}>
              {topic} · {statusOf(topic)}
            </Link>
          </li>
        ))}
      </ul>
      <p>
        Language:{" "}
        {locales.map((l) => (
          <Link key={l} href={`/${l}/review?kind=${kind}&id=${current}`}>
            {l}{" "}
          </Link>
        ))}
      </p>
      {kind === "prepared" && file?.questions?.[lang] && (
        <p className="muted">Asked as: {file.questions[lang]!.join(" · ")}</p>
      )}
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
        kind={kind}
        id={current}
        status={statusOf(current)}
        next={drafts.length > 0 ? q(drafts[0]) : undefined}
      />
    </article>
  );
}
