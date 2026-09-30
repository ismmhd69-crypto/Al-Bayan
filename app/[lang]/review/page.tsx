import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, isLocale, locales } from "@/lib/i18n";
import PreparedAnswer from "@/components/PreparedAnswer";
import ReviewButtons from "@/components/ReviewButtons";
import { loadPrepared } from "@/lib/prepared";
import { getReviewDecisions } from "@/lib/content";
import { TOPIC_ANSWERS } from "@/data/topic-answers";
import { PREPARED_ANSWERS } from "@/data/prepared-answers";

// Review tab (public until launch, Mo 2026-09-29): each prepared answer exactly as visitors would see
// it, with Approve / Reject. Decisions are stored in the database; only approved answers appear on the
// topic pages.
export const dynamic = "force-dynamic";

// Internal page (Mo, 2026-09-29): not in the menu, not for search engines; reached only by its link.
export const metadata = { title: "Review (internal)", robots: { index: false, follow: false } };

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
        <p className="eyebrow">Review · internal use only</p>
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
        <p className="card card-soft">Internal page for the Bayan team. Not linked in the menu; please do not share this link.</p>
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
        <PreparedAnswer a={answer} t={dict.ask} id={0} />
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
