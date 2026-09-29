import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen, ChevronRight, Compass, Heart, Link2, ShieldCheck } from "lucide-react";
import { getDictionary, isLocale } from "@/lib/i18n";
import { getPopularQuestions, getReviewDecisions, getScholarNames, getTopics } from "@/lib/content";
import AskLauncher from "@/components/AskLauncher";
import LangSwitch from "@/components/LangSwitch";
import { Beacon } from "@/components/Logo";

export const revalidate = 3600;

// Scholars whose words are actually quoted on Bayan today (the library and live search).
const QUOTED = ["ibn-baz", "ibn-uthaymeen", "al-albani", "al-barrak"];

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  const h = t.home;
  const [popular, topics, decisions, names] = await Promise.all([
    getPopularQuestions(lang),
    getTopics(lang),
    getReviewDecisions("topic").catch(() => ({}) as Awaited<ReturnType<typeof getReviewDecisions>>),
    getScholarNames().catch(() => ({}) as Awaited<ReturnType<typeof getScholarNames>>),
  ]);
  // Topics with an approved answer first, then the rest in their usual order.
  const approved = (id: string) => Number(decisions[id]?.status === "approved");
  const shown = [...topics].sort((a, b) => approved(b.id) - approved(a.id)).slice(0, 6);
  const scholars = QUOTED.map((id) => names[id]?.[lang]).filter((name): name is string => !!name);
  const how = [
    { Icon: BookOpen, title: h.how1t, text: h.how1 },
    { Icon: Link2, title: h.how2t, text: h.how2 },
    { Icon: ShieldCheck, title: h.how3t, text: h.how3 },
  ];

  return (
    <div className="home">
      <div className="home-lang">
        <LangSwitch lang={lang} label={t.more.language} />
      </div>

      <div className="home-hero">
        <Beacon size={88} />
        <h1>{h.title}</h1>
        <p className="lead">{h.sub}</p>
      </div>

      <AskLauncher lang={lang} placeholder={h.placeholder} button={h.askButton} popularLabel={h.popular} popular={popular} />

      <section className="home-section" aria-labelledby="how-h">
        <h2 id="how-h" className="eyebrow">
          {h.howTitle}
        </h2>
        <ul className="home-how">
          {how.map(({ Icon, title, text }) => (
            <li key={title} className="home-how-item">
              <Icon aria-hidden="true" className="home-how-icon" />
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ul>
      </section>

      {shown.length > 0 && (
        <section className="home-section" aria-labelledby="hard-h">
          <div className="home-section-head">
            <h2 id="hard-h" className="eyebrow">
              {h.hardTitle}
            </h2>
            <Link href={`/${lang}/topics`} className="text-link">
              {h.seeAll}
            </Link>
          </div>
          <ul className="home-topics">
            {shown.map((topic) => (
              <li key={topic.id}>
                <Link href={`/${lang}/topics/${topic.id}`} className="home-topic">
                  <span className="home-topic-title">{topic.title}</span>
                  <span className="home-topic-question">{topic.question}</span>
                  <ChevronRight aria-hidden="true" className="flip-rtl" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Link href={`/${lang}/start`} className="home-new">
        <Compass aria-hidden="true" className="home-new-icon" />
        <span>
          <strong>{h.newTitle}</strong>
          <span>{h.newText}</span>
        </span>
        <ArrowRight aria-hidden="true" className="flip-rtl" />
      </Link>

      {scholars.length > 0 && (
        <section className="home-section" aria-labelledby="scholars-h">
          <h2 id="scholars-h" className="eyebrow">
            {h.scholarsTitle}
          </h2>
          <ul className="home-scholars">
            {scholars.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </section>
      )}

      <p className="home-support">
        <Heart aria-hidden="true" />
        <span>{h.supportText}</span>
        <Link href={`/${lang}/support`} className="text-link">
          {h.supportLink}
        </Link>
      </p>
    </div>
  );
}
