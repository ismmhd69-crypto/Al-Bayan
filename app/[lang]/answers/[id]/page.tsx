import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Hourglass } from "lucide-react";
import { getDictionary, isLocale } from "@/lib/i18n";
import { getReviewDecisions } from "@/lib/content";
import { loadPrepared } from "@/lib/prepared";
import { PREPARED_ANSWERS } from "@/data/prepared-answers";
import { steps } from "@/data/steps";
import AskAboutButton from "@/components/AskAboutButton";
import PreparedAnswer from "@/components/PreparedAnswer";
import { AnswerV2View } from "@/components/AnswerV2View";

type Params = Promise<{ lang: string; id: string }>;

// A prepared answer that a New to Islam step opens with "Read". Rendered on each visit: verses load live
// from Quran Foundation (no long-term storage), and a new approval shows at once.
export const dynamic = "force-dynamic";

const stepFor = (id: string) => steps.find((s) => s.answerId === id);

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang, id } = await params;
  const step = stepFor(id);
  return isLocale(lang) && step ? { title: step.title[lang] } : {};
}

export default async function AnswerPage({ params }: { params: Params }) {
  const { lang, id } = await params;
  if (!isLocale(lang)) notFound();
  const step = stepFor(id);
  const file = PREPARED_ANSWERS[id];
  if (!step || !file) notFound();
  const dict = getDictionary(lang);
  // Only answers Mo approved on the review page are shown; otherwise "preparing".
  const decisions = await getReviewDecisions("prepared").catch(() => ({} as Awaited<ReturnType<typeof getReviewDecisions>>));
  // An approval counts only for the exact content that was reviewed (its fingerprint is stored with the decision).
  const answer = await loadPrepared({ ...file, status: decisions[id]?.status ?? "draft" }, lang, {
    approvalHash: decisions[id]?.contentHash ?? undefined,
  });

  return (
    <article className="page">
      <Link href={`/${lang}/start`} className="back-link">
        <ArrowLeft aria-hidden="true" className="flip-rtl" />
        {dict.start.title}
      </Link>

      <header className="page-head">
        <h1>{step.title[lang]}</h1>
        <p className="lead">{step.text[lang]}</p>
      </header>

      {answer ? (
        answer.v2 ? <AnswerV2View answer={answer.v2} t={dict.ask} id={0} /> : <PreparedAnswer a={answer} t={dict.ask} id={0} />
      ) : (
        <div className="card card-soft">
          <Hourglass aria-hidden="true" className="card-icon" />
          <p>{dict.topics.preparing}</p>
        </div>
      )}

      {step.question && (
        <AskAboutButton lang={lang} question={step.question[lang]} label={dict.topics.askAbout} />
      )}
    </article>
  );
}
