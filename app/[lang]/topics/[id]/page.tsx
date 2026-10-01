import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight, Hourglass } from "lucide-react";
import { getDictionary, isLocale } from "@/lib/i18n";
import { getReviewDecisions, getTopic, getTopicVideos } from "@/lib/content";
import AskAboutButton from "@/components/AskAboutButton";
import { AnswerV2View } from "@/components/AnswerV2View";
import { loadPrepared } from "@/lib/prepared";
import { TOPIC_ANSWERS } from "@/data/topic-answers";
import VideoCard from "@/components/VideoCard";
import { attachScholarTranslations } from "@/lib/ask/display-translations";

type Params = Promise<{ lang: string; id: string }>;

// Rendered on each visit: approved prepared answers load their verses live from Quran Foundation
// (its rules allow no long-term storage), and a new approval shows at once.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang, id } = await params;
  const topic = isLocale(lang) ? await getTopic(id, lang) : null;
  return topic ? { title: topic.title } : {};
}

export default async function TopicPage({ params }: { params: Params }) {
  const { lang, id } = await params;
  if (!isLocale(lang)) notFound();
  const topic = await getTopic(id, lang);
  if (!topic) notFound();
  const dict = getDictionary(lang);
  const t = dict.topics;
  const related = topic.related;
  const videos = await getTopicVideos(id);
  // Only answers Mo approved on the local review page are shown; otherwise "preparing".
  const decisions = await getReviewDecisions("topic").catch(() => ({} as Awaited<ReturnType<typeof getReviewDecisions>>));
  const file = TOPIC_ANSWERS[id];
  const answer = process.env.PREPARED_PUBLISHING_ENABLED === "true" && file ? await loadPrepared({ ...file, status: decisions[id]?.status ?? "draft" }, lang, {
    approvalHash: decisions[id]?.contentHash ?? undefined,
    videos,
  }) : null;
  const displayAnswer = answer?.v2 ? { ...answer, v2: await attachScholarTranslations(answer.v2) } : answer;

  return (
    <article className="page">
      <Link href={`/${lang}/topics`} className="back-link">
        <ArrowLeft aria-hidden="true" className="flip-rtl" />
        {t.backToList}
      </Link>

      <header className="page-head">
        <p className="eyebrow">{t.categories[topic.category]}</p>
        <h1>{topic.title}</h1>
        <p className="lead">{topic.question}</p>
      </header>

      {/* A topic answer appears only with the same cited display as Ask (Codex review, finding 11),
          and only after Mo approved it. A plain text answer without sources must never appear. */}
      {displayAnswer ? (
        <AnswerV2View answer={displayAnswer.v2!} t={dict.ask} id={0} />
      ) : (
        <div className="card card-soft">
          <Hourglass aria-hidden="true" className="card-icon" />
          <p>{t.preparing}</p>
        </div>
      )}

      <AskAboutButton lang={lang} question={topic.question} label={t.askAbout} />

      {!answer && videos.length > 0 && (
        <section className="topic-group" aria-labelledby="watch-h">
          <h2 id="watch-h" className="eyebrow">
            {dict.ask.parts.watch}
          </h2>
          <p className="muted">{dict.ask.video.note}</p>
          <ul className="evidence">
            {videos.map((v) => (
              <VideoCard key={v.youtubeId} v={v} labels={dict.ask.video} />
            ))}
          </ul>
        </section>
      )}

      {related.length > 0 && (
        <section className="topic-group" aria-labelledby="related-h">
          <h2 id="related-h" className="eyebrow">
            {t.related}
          </h2>
          <ul className="list">
            {related.map((r) => (
              <li key={r.id}>
                <Link href={`/${lang}/topics/${r.id}`} className="list-row">
                  <span className="list-title">{r.title}</span>
                  <ChevronRight aria-hidden="true" className="flip-rtl" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
