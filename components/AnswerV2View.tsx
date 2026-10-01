"use client";

import { BookOpen, ChevronDown, ExternalLink, PlayCircle, Quote, ShieldCheck, Users } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { displaySourceId, type AnswerV2, type Cited, type HadithItem, type QuranItem, type ScholarItem, type ScholarView } from "@/lib/ask/answer-v2";
import VideoCard from "./VideoCard";
import { ReportProblem } from "./ReportProblem";
import { shouldShowScholarTranslation } from "@/lib/ask/display-choice";

type AskText = Dictionary["ask"];

const dirOf = (language: string) => (language === "ar" ? "rtl" : "ltr");
const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function AnswerV2View({ answer, t, id, draftPreview = false }: { answer: AnswerV2; t: AskText; id: number; draftPreview?: boolean }) {
  const anchor = (sourceId: string) => `source-${id}-${sourceId.replace(/[^A-Za-z0-9_-]/g, "-")}`;
  const heading = (name: string) => `answer-${id}-${name}`;
  const scholarShort = (scholarId: string, full: string) => t.scholarShort[scholarId as keyof typeof t.scholarShort] ?? full;
  const allScholars = [
    ...answer.scholars,
    ...(answer.view_handling?.mode === "reviewed_main" ? answer.view_handling.other_views : answer.view_handling?.views ?? [])
      .flatMap((view) => view.scholars),
  ];
  const quranById = new Map(answer.quran.flatMap((card) => card.verses.map((verse) => [verse.id, verse] as const)));
  const hadithById = new Map(answer.hadith.map((item) => [item.id, item]));
  const scholarById = new Map(allScholars.map((item) => [item.id, item]));

  const refText = (sourceId: string) => {
    const verse = quranById.get(sourceId);
    if (verse) return { short: displaySourceId(sourceId), long: `${t.quran} ${verse.key}` };
    const hadith = hadithById.get(sourceId);
    if (hadith) {
      const number = hadith.numbers.bukhari
        ? `${t.hadith.numberBukhari} ${hadith.numbers.bukhari}`
        : `${t.hadith.numberMuslim} ${hadith.numbers.muslim}`;
      return { short: number, long: `${t.hadith[hadith.collection]}, ${number}` };
    }
    const scholar = scholarById.get(sourceId);
    if (scholar) return { short: scholarShort(scholar.scholar_id, scholar.scholar_name), long: `${scholar.scholar_name}, ${scholar.reference}` };
    return { short: displaySourceId(sourceId), long: displaySourceId(sourceId) };
  };

  const goTo = (event: React.MouseEvent<HTMLAnchorElement>, sourceId: string) => {
    const target = document.getElementById(anchor(sourceId));
    if (!target) return;
    event.preventDefault();
    const fold = target.closest("details");
    if (fold && !fold.open) fold.open = true;
    window.history.replaceState(null, "", `#${anchor(sourceId)}`);
    window.requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "center" });
      target.focus({ preventScroll: true });
    });
  };

  const citations = (item: Cited) => (
    <span className="answer-v2-citations" role="group" aria-label={t.v2.sources}>
      {item.source_ids.map((sourceId) => {
        const label = refText(sourceId);
        return (
          <a key={sourceId} href={`#${anchor(sourceId)}`} className="ref"
            aria-label={`${t.source}: ${label.long}`} onClick={(event) => goTo(event, sourceId)}>
            <bdi dir="ltr">{label.short}</bdi>
          </a>
        );
      })}
    </span>
  );

  const sentences = (items: Cited[]) => items.map((item, index) => (
    <p className="answer-v2-sentence" key={`${item.requirement_id}-${index}`}>
      <span>{item.text}</span> {citations(item)}
    </p>
  ));

  const sourceIds = [
    ...answer.quran.flatMap((card) => card.source_ids),
    ...answer.hadith.map((item) => item.id),
    ...allScholars.map((item) => item.id),
  ];
  const reviewLabel = draftPreview ? t.v2.draftPreview : t.v2.review[answer.review];

  return (
    <article className="answer answer-v2" lang={answer.language} dir={dirOf(answer.language)}>
      <h2 className="answer-label answer-v2-status">
        <ShieldCheck aria-hidden="true" />
        {reviewLabel}
      </h2>

      <section className="answer-v2-summary" aria-labelledby={heading("summary")}>
        <h3 id={heading("summary")}>
          <BookOpen aria-hidden="true" />
          {t.v2.simpleAnswer}
        </h3>
        <div className="answer-v2-prose">
          {sentences(answer.simple_answer.sentences)}
          {answer.simple_answer.list && (
            <ol className="answer-v2-list">
              {answer.simple_answer.list.map((item, index) => (
                <li key={`${item.requirement_id}-${index}`}>
                  <span>{item.text}</span> {citations(item)}
                </li>
              ))}
            </ol>
          )}
          {answer.view_handling && <p className="answer-v2-view-note">{t.v2.scholarsDiffer}</p>}
        </div>
      </section>

      {answer.quran.length > 0 && (
        <section className="answer-v2-section" aria-labelledby={heading("quran")}>
          <h3 id={heading("quran")}><BookOpen aria-hidden="true" />{t.v2.quran}</h3>
          <div className="answer-v2-source-list">
            {answer.quran.map((card) => <QuranCard key={card.id} card={card} answerLanguage={answer.language} t={t} anchor={anchor} />)}
          </div>
        </section>
      )}

      {answer.hadith.length > 0 && (
        <section className="answer-v2-section" aria-labelledby={heading("hadith")}>
          <h3 id={heading("hadith")}><Quote aria-hidden="true" />{t.v2.hadith}</h3>
          <div className="answer-v2-source-list">
            {answer.hadith.map((item) => <HadithCard key={item.id} item={item} answerLanguage={answer.language} t={t} anchor={anchor} />)}
          </div>
        </section>
      )}

      {answer.scholars.length > 0 && (
        <section className="answer-v2-section" aria-labelledby={heading("scholars")}>
          <h3 id={heading("scholars")}><Users aria-hidden="true" />{t.v2.scholars}</h3>
          <div className="answer-v2-source-list">
            {answer.scholars.map((item) => <ScholarCard key={item.id} item={item} answerLanguage={answer.language} t={t} anchor={anchor} />)}
          </div>
        </section>
      )}

      {answer.view_handling?.mode === "reviewed_main" && (
        <details className="answer-fold answer-v2-section">
          <summary><Users aria-hidden="true" />{t.v2.otherViews}<ChevronDown aria-hidden="true" className="chev" /></summary>
          <div className="answer-fold-content">
            {answer.view_handling.other_views.map((view) => (
              <ScholarViewBlock key={view.id} view={view} answerLanguage={answer.language} t={t} anchor={anchor} citations={citations} />
            ))}
          </div>
        </details>
      )}

      {answer.view_handling?.mode === "side_by_side" && (
        <section className="answer-v2-section" aria-labelledby={heading("views")}>
          <h3 id={heading("views")}><Users aria-hidden="true" />{t.v2.scholarlyViews}</h3>
          <div className="answer-v2-views">
            {answer.view_handling.views.map((view) => (
              <ScholarViewBlock key={view.id} view={view} answerLanguage={answer.language} t={t} anchor={anchor} citations={citations} />
            ))}
          </div>
        </section>
      )}

      {answer.more_explanation && answer.more_explanation.length > 0 && (
        <details className="answer-fold answer-v2-section">
          <summary><BookOpen aria-hidden="true" />{t.v2.moreExplanation}<ChevronDown aria-hidden="true" className="chev" /></summary>
          <div className="answer-fold-content">
            {answer.more_explanation.map((section, index) => (
              <section className="answer-v2-more" key={index} aria-labelledby={heading(`more-${index}`)}>
                <h4 id={heading(`more-${index}`)}>{section.heading}</h4>
                {sentences(section.sentences)}
              </section>
            ))}
          </div>
        </details>
      )}

      {answer.limit_note && (
        <aside className="answer-v2-limit" aria-labelledby={heading("limit")}>
          <h3 id={heading("limit")}>{t.v2.limit}</h3>
          <p>{answer.limit_note}</p>
        </aside>
      )}

      {answer.videos.length > 0 && (
        <details className="answer-fold answer-v2-section video-fold">
          <summary><PlayCircle aria-hidden="true" />{t.v2.watchMore}<ChevronDown aria-hidden="true" className="chev" /></summary>
          <div className="answer-fold-content">
            <p className="muted">{t.video.note}</p>
            <ul className="evidence">
              {answer.videos.map((video) => <VideoCard key={video.youtubeId} v={video} labels={t.video} />)}
            </ul>
          </div>
        </details>
      )}

      <footer className="answer-v2-footer">
        <p>{answer.review === "automatic" ? t.checked : answer.review === "scholar_reviewed" ? t.v2.scholarChecked : t.preparedChecked}</p>
        <p>
          {answer.attribution.quran && <a href={answer.attribution.quran.url} target="_blank" rel="noopener noreferrer">{answer.attribution.quran.text}</a>}
          {answer.attribution.quran && answer.attribution.hadith && " · "}
          {answer.attribution.hadith && <a href={answer.attribution.hadith.url} target="_blank" rel="noopener noreferrer">{answer.attribution.hadith.text}</a>}
          {(answer.attribution.quran || answer.attribution.hadith) && " · "}{t.notFatwa}
        </p>
      </footer>
      <ReportProblem lang={answer.language} sourceIds={sourceIds} labels={t.report} />
    </article>
  );
}

function QuranCard({ card, answerLanguage, t, anchor }: { card: QuranItem; answerLanguage: AnswerV2["language"]; t: AskText; anchor: (id: string) => string }) {
  const range = card.verses.length === 1 ? card.verses[0].key
    : `${card.verses[0].key}–${card.verses[card.verses.length - 1].key.split(":")[1]}`;
  return (
    <article className="answer-source-card">
      <h4><bdi dir="ltr">{t.quran} {range}</bdi></h4>
      {card.verses.map((verse) => (
        <div className="answer-source-target quran-verse" id={anchor(verse.id)} tabIndex={-1} key={verse.id}>
          <p className="verse-ar" lang="ar" dir="rtl" translate="no">{verse.arabic}</p>
          {verse.translation && (
            <p className="verse-tr" lang={answerLanguage} dir="ltr">
              <span translate="no">{verse.translation}</span>
              <span className="verse-by">{t.translation}: {verse.translation_name}</span>
            </p>
          )}
          <a className="verse-link" href={verse.url} target="_blank" rel="noopener noreferrer">
            <bdi dir="ltr">{t.quran} {verse.key}</bdi><ExternalLink aria-hidden="true" />
          </a>
        </div>
      ))}
    </article>
  );
}

function HadithCard({ item, answerLanguage, t, anchor }: { item: HadithItem; answerLanguage: AnswerV2["language"]; t: AskText; anchor: (id: string) => string }) {
  return (
    <article className="answer-source-card answer-source-target" id={anchor(item.id)} tabIndex={-1}>
      <h4>{t.hadith[item.collection]}</h4>
      <p className="hadith-meta">
        <span>{[item.numbers.bukhari && `${t.hadith.numberBukhari} ${item.numbers.bukhari}`, item.numbers.muslim && `${t.hadith.numberMuslim} ${item.numbers.muslim}`].filter(Boolean).join(" · ")}</span>
        <span lang="ar" dir="rtl" translate="no">{item.grade_ar} · {item.attribution_ar}</span>
      </p>
      <p className="verse-ar" lang="ar" dir="rtl" translate="no">{item.arabic}</p>
      {item.translation && item.translation_language && (
        <p className="verse-tr" lang={item.translation_language} dir="ltr">
          <span translate="no">{item.translation}</span>
          <span className="verse-by">{item.translation_language !== answerLanguage ? t.hadith.englishFallback : t.hadith.translationBy}</span>
        </p>
      )}
      <a className="verse-link" href={item.url} target="_blank" rel="noopener noreferrer">{t.hadith.link}<ExternalLink aria-hidden="true" /></a>
    </article>
  );
}

function ScholarCard({ item, answerLanguage, t, anchor }: { item: ScholarItem; answerLanguage: AnswerV2["language"]; t: AskText; anchor: (id: string) => string }) {
  return (
    <article className="answer-source-card answer-source-target" id={anchor(item.id)} tabIndex={-1}>
      <h4>{item.scholar_name}</h4>
      {item.title && <p className="quote-title" lang="ar" dir="rtl" translate="no">{item.title}</p>}
      {shouldShowScholarTranslation(answerLanguage, item.translation) && <p className="source-language-label">{t.scholarQuote.aiTranslation}</p>}
      <p className="verse-ar" lang="ar" dir="rtl" translate="no">{item.arabic}</p>
      {shouldShowScholarTranslation(answerLanguage, item.translation) && <p className="verse-tr" lang={answerLanguage} dir="ltr">{item.translation}</p>}
      {answerLanguage !== "ar" && <p className="source-language-label">{t.scholarQuote.arabicOnly}</p>}
      <p className="verse-by" lang="ar" dir="rtl" translate="no">{item.reference}</p>
      <a className="verse-link" href={item.url} target="_blank" rel="noopener noreferrer">{t.scholarQuote.link}<ExternalLink aria-hidden="true" /></a>
    </article>
  );
}

function ScholarViewBlock({ view, answerLanguage, t, anchor, citations }: {
  view: ScholarView;
  answerLanguage: AnswerV2["language"];
  t: AskText;
  anchor: (id: string) => string;
  citations: (item: Cited) => React.ReactNode;
}) {
  return (
    <section className="answer-v2-view">
      <h4>{t.v2.views[view.label_key]}</h4>
      {view.sentences.map((item, index) => (
        <p className="answer-v2-sentence" key={`${item.requirement_id}-${index}`}><span>{item.text}</span> {citations(item)}</p>
      ))}
      <div className="answer-v2-source-list">
        {view.scholars.map((item) => <ScholarCard key={item.id} item={item} answerLanguage={answerLanguage} t={t} anchor={anchor} />)}
      </div>
    </section>
  );
}
