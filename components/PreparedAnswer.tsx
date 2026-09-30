"use client";

import { useId } from "react";
import { BookOpen, ExternalLink, Info, Landmark, PlayCircle, Quote, ScrollText, ShieldCheck } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import type { Answer, Evidence } from "@/lib/ask/core";
import VideoCard from "./VideoCard";
import { ReportProblem } from "./ReportProblem";

type AskText = Dictionary["ask"];

const dirOf = (l: string) => (l === "ar" ? "rtl" : "ltr");
const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const ORDER: Record<Evidence["kind"], number> = { quran: 0, hadith: 1, scholar: 2 };

// A prepared answer (researched in advance, approved by Mo) in the "Article" style (mockup Option A):
// the direct answer in a gold summary box, the explanation as editorial
// sections, then the sources as cards (Quran, hadith, scholars) and related videos last.
// Same rules as the live AnswerView: every sentence carries its source chip, verses and hadith are
// exactly as served (loaded live), and the "not a fatwa" footer and Report a problem stay.
export default function PreparedAnswer({ a, t, id }: { a: Answer; t: AskText; id: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const anchor = (key: string) => `pa-${id}-${uid}-${key.replace(":", "-")}`;
  const byKey = new Map(a.evidence.map((e) => [e.key, e]));
  const sources = [...a.evidence].sort((x, y) => ORDER[x.kind] - ORDER[y.kind]);
  const scholarShort = (sid: string, full: string) => t.scholarShort[sid as keyof typeof t.scholarShort] ?? full;
  const hadithNumber = (e: Extract<Evidence, { kind: "hadith" }>) =>
    e.numbers.bukhari ? `${t.hadith.numberBukhari} ${e.numbers.bukhari}` : `${t.hadith.numberMuslim} ${e.numbers.muslim}`;
  const refText = (r: string) => {
    const e = byKey.get(r);
    if (e?.kind === "scholar") return { short: scholarShort(e.scholarId, e.scholarName), long: `${e.scholarName}, ${e.reference}` };
    if (e?.kind === "hadith") return { short: hadithNumber(e), long: `${t.hadith[e.collection]}, ${hadithNumber(e)}` };
    return { short: r, long: `${t.quran} ${r}` };
  };
  // Move keyboard and screen-reader focus to the cited source card, not just the view.
  const goTo = (ev: React.MouseEvent<HTMLAnchorElement>, key: string) => {
    const el = document.getElementById(anchor(key));
    if (!el) return;
    ev.preventDefault();
    el.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "center" });
    el.focus({ preventScroll: true });
  };
  const sentences = (items: { text: string; source_ids: string[] }[]) =>
    items.map((s, i) => (
      <span key={i}>
        {s.text}{" "}
        {s.source_ids.map((r) => (
          <a key={r} href={`#${anchor(r)}`} className="ref"
            aria-label={`${t.source}: ${refText(r).long}`} onClick={(ev) => goTo(ev, r)}>
            {refText(r).short}
          </a>
        ))}{" "}
      </span>
    ));
  const lang = a.language;
  const dir = dirOf(lang);
  const hasScholars = sources.some((e) => e.kind === "scholar");
  const hasTexts = sources.some((e) => e.kind !== "scholar");

  return (
    <div className="answer pa">
      <p className="pa-label">
        <ShieldCheck aria-hidden="true" />
        {t.preparedLabel}
      </p>

      <section className="pa-summary" aria-labelledby={`${uid}-short`} lang={lang} dir={dir}>
        <h3 id={`${uid}-short`} className="pa-summary-title">
          <BookOpen aria-hidden="true" />
          {t.parts.short}
        </h3>
        {a.direct_answer.map((s, i) => (
          <p key={i} className="pa-summary-text">{sentences([s])}</p>
        ))}
      </section>

      {a.explanation.length > 0 && (
        <div className="pa-article">
          {a.explanation.map((section, index) => (
            <section className="pa-section" key={index} lang={lang} dir={dir}>
              <h3 className="pa-heading">{section.heading}</h3>
              <p className="pa-text">{sentences(section.sentences)}</p>
            </section>
          ))}
        </div>
      )}

      {a.not_established.length > 0 && (
        <aside className="pa-limit" lang={lang} dir={dir} aria-labelledby={`${uid}-limit`}>
          <Info aria-hidden="true" />
          <div>
            <h3 id={`${uid}-limit`}>{t.parts.limit}</h3>
            {a.not_established.map((note, index) => <p key={index}>{note.text}</p>)}
          </div>
        </aside>
      )}

      {hasTexts && (
        <section className="pa-sources" aria-labelledby={`${uid}-ev`}>
          <h3 id={`${uid}-ev`} className="pa-eyebrow">{t.parts.evidence}</h3>
          <ul className="pa-cards">
            {sources.filter((e) => e.kind !== "scholar").map((e) => (
              <SourceCard key={e.key} e={e} a={a} t={t} anchorId={anchor(e.key)} title={
                e.kind === "hadith" ? `${t.hadith[e.collection]} · ${hadithNumber(e)}` : `${t.quran} ${e.key}`
              } />
            ))}
          </ul>
        </section>
      )}

      {hasScholars && (
        <section className="pa-sources" aria-labelledby={`${uid}-sch`}>
          <h3 id={`${uid}-sch`} className="pa-eyebrow">{t.parts.scholars}</h3>
          <ul className="pa-cards">
            {sources.filter((e) => e.kind === "scholar").map((e) => (
              <SourceCard key={e.key} e={e} a={a} t={t} anchorId={anchor(e.key)} title={e.kind === "scholar" ? e.scholarName : ""} />
            ))}
          </ul>
        </section>
      )}

      {a.videos && a.videos.length > 0 && (
        <section className="pa-sources" aria-labelledby={`${uid}-watch`}>
          <h3 id={`${uid}-watch`} className="pa-eyebrow">
            <PlayCircle aria-hidden="true" />
            {t.parts.watch}
          </h3>
          <p className="muted">{t.video.note}</p>
          <ul className="evidence pa-videos">
            {a.videos.map((v) => (
              <VideoCard key={v.youtubeId} v={v} labels={t.video} />
            ))}
          </ul>
        </section>
      )}

      <p className="answer-foot pa-foot">
        {t.preparedChecked}{" "}
        <a href={a.attribution.url} target="_blank" rel="noopener noreferrer">
          {a.attribution.text}
        </a>
        {a.hadithAttribution && (
          <>
            {". "}
            <a href={a.hadithAttribution.url} target="_blank" rel="noopener noreferrer">
              {a.hadithAttribution.text}
            </a>
          </>
        )}
        . <strong className="pa-notfatwa">{t.notFatwa}</strong>
      </p>
      <ReportProblem
        lang={a.language}
        sourceIds={a.evidence.map((e) => (e.kind === "quran" ? `Q${e.key}` : e.key))}
        labels={t.report}
      />
    </div>
  );
}

// One source as a card; the chips in the text jump here (focusable target).
function SourceCard({ e, a, t, anchorId, title }: { e: Evidence; a: Answer; t: AskText; anchorId: string; title: string }) {
  const icon = e.kind === "quran" ? <BookOpen aria-hidden="true" /> : e.kind === "hadith" ? <ScrollText aria-hidden="true" /> : <Landmark aria-hidden="true" />;
  return (
    <li id={anchorId} tabIndex={-1} className={`pa-card pa-card--${e.kind}`}>
      <p className="pa-card-head">
        <span className="pa-card-title">
          {icon}
          <span>{title}</span>
        </span>
        {e.kind === "hadith" && (
          <span className="pa-card-badge" lang="ar" dir="rtl" translate="no">
            {e.gradeAr} · {e.attributionAr}
          </span>
        )}
      </p>

      {e.kind === "scholar" && e.title && (
        <p className="quote-title" lang="ar" dir="rtl" translate="no">{e.title}</p>
      )}
      <p className={e.kind === "scholar" ? "pa-quote" : "verse-ar"} lang="ar" dir="rtl" translate="no">
        {e.kind === "scholar" && <Quote aria-hidden="true" className="pa-quote-mark" />}
        {e.arabic}
      </p>

      {e.kind === "quran" && e.translation && (
        <p className="verse-tr" lang={a.language} dir="ltr">
          <span translate="no">{e.translation}</span>
          <span className="verse-by">{t.translation}: {e.translationName}</span>
        </p>
      )}
      {e.kind === "hadith" && e.translation && e.translationLanguage && (
        <p className="verse-tr" lang={e.translationLanguage} dir="ltr">
          <span translate="no">{e.translation}</span>
          <span className="verse-by">
            {e.translationLanguage !== a.language ? t.hadith.englishFallback : t.hadith.translationBy}
          </span>
        </p>
      )}
      {e.kind === "scholar" && (
        <p className="verse-by">
          {a.language !== "ar" && <>{t.scholarQuote.arabicOnly} · </>}
          <span lang="ar" dir="rtl" translate="no">{e.reference}</span>
        </p>
      )}

      <a className="verse-link" href={e.url} target="_blank" rel="noopener noreferrer">
        {e.kind === "quran" ? `${t.quran} ${e.key}` : e.kind === "hadith" ? t.hadith.link : t.scholarQuote.link}
        <ExternalLink aria-hidden="true" />
      </a>
    </li>
  );
}
