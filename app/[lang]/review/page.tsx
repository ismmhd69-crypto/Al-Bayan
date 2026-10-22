import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getDictionary, isLocale, locales } from "@/lib/i18n";
import { AnswerV2View } from "@/components/AnswerV2View";
import ReviewButtons from "@/components/ReviewButtons";
import ReviewAuthGate from "@/components/ReviewAuthGate";
import { loadPrepared, preparedContentHash } from "@/lib/prepared";
import { getReviewDecisions, getProblemReports } from "@/lib/content";
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
  if (process.env.BAYAN_REVIEW_ENABLED !== "true") notFound();
  const { lang } = await params;
  const { id, kind: kindParam } = await searchParams;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);

  if (kindParam === "reports") {
    const reports = await getProblemReports(100);
    return (
      <ReviewAuthGate lang={lang}>
        <article className="page">
          <Link href={`/${lang}/more`} className="back-link">
            <ArrowLeft aria-hidden="true" className="flip-rtl" />
            {dict.more.title}
          </Link>
          <header className="page-head">
          <p className="eyebrow">Review · internal use only</p>
          <h1>Problem reports</h1>
          <p>
            <Link href={`/${lang}/review?kind=topic`}>Hard questions topics</Link>
            {" · "}
            <Link href={`/${lang}/review?kind=prepared`}>Common questions</Link>
            {" · "}
            <Link href={`/${lang}/review?kind=reports`} aria-current="page">User reports ({reports.length})</Link>
          </p>
          <p className="lead">
            {reports.length} report{reports.length === 1 ? "" : "s"} submitted
          </p>
          <p className="card card-soft">Reports submitted by visitors via Report a problem. Stored in public.problem_reports.</p>
        </header>

        {reports.length === 0 ? (
          <p className="card card-soft">No problem reports found in public.problem_reports.</p>
        ) : (
          <div style={{ display: "grid", gap: "16px" }}>
            {reports.map((r) => (
              <div key={r.id} className="card" style={{ display: "grid", gap: "8px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 600, textTransform: "uppercase", fontSize: "0.8rem", color: "var(--accent)" }}>
                    {r.category.replace(/_/g, " ")}
                  </span>
                  <span className="muted" style={{ fontSize: "0.8rem" }}>
                    {new Date(r.created_at).toLocaleString()} · Lang: {r.lang.toUpperCase()} · Status: {r.status}
                  </span>
                </div>
                <p style={{ whiteSpace: "pre-wrap" }}>{r.comment}</p>
                {r.page_url && (
                  <p className="muted" style={{ fontSize: "0.85rem" }}>
                    Page / URL: <code>{r.page_url}</code>
                  </p>
                )}
                {r.source_ids && r.source_ids.length > 0 && (
                  <p className="muted" style={{ fontSize: "0.85rem" }}>
                    Sources: {r.source_ids.join(", ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </article>
      </ReviewAuthGate>
    );
  }

  const kind = kindParam === "prepared" ? "prepared" : "topic";
  const ALL = kind === "topic" ? TOPIC_ANSWERS : PREPARED_ANSWERS;
  const decisions = await getReviewDecisions(kind);
  const ids = Object.keys(ALL);
  const statusOf = (t: string) => decisions[t]?.status === "approved"
    && decisions[t]?.contentHash !== preparedContentHash(ALL[t]) ? "draft" : decisions[t]?.status ?? "draft";
  const current = id && ALL[id] ? id : ids.find((t) => statusOf(t) === "draft") ?? ids[0];
  const file = ALL[current];
  const q = (k: string, extra = "") => `/${lang}/review?kind=${kind}&id=${k}${extra}`;
  const answer = file ? await loadPrepared(file, lang, { allowDraft: true }) : null;
  const drafts = ids.filter((t) => t !== current && statusOf(t) === "draft");

  return (
    <ReviewAuthGate lang={lang}>
      <article className="page">
        <Link href={`/${lang}/more`} className="back-link">
          <ArrowLeft aria-hidden="true" className="flip-rtl" />
          {dict.more.title}
        </Link>
        <header className="page-head">
        <p className="eyebrow">Review · internal use only</p>
        <h1>Prepared answers</h1>
        <p>
          <Link href={`/${lang}/review?kind=topic`} aria-current={kind === "topic" ? "page" : undefined}>Hard questions topics</Link>
          {" · "}
          <Link href={`/${lang}/review?kind=prepared`} aria-current={kind === "prepared" ? "page" : undefined}>Common questions</Link>
          {" · "}
          <Link href={`/${lang}/review?kind=reports`}>User reports</Link>
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
        <AnswerV2View answer={answer.v2!} t={dict.ask} id={0} draftPreview={statusOf(current) !== "approved"} />
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
    </ReviewAuthGate>
  );
}
