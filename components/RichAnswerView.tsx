"use client";

import { useId } from "react";
import type { Locale, Dictionary } from "@/lib/i18n";
import type { RichSection, RichGuide, RichSource } from "@/lib/ask/rich-answer";
import { richText } from "@/lib/ask/rich-text";
import { ATTRIBUTION } from "@/lib/sources/quran-meta";
import { hadithAttributionFor } from "@/lib/sources/hadith-rules";
import styles from "./RichAnswerView.module.css";
import { ReportProblem } from "./ReportProblem";
import { consecutiveRuns } from "@/lib/ask/ids";

const preview = ({ evidence: e, displayTranslation: t }: RichSource) => t?.status === "ready" ? t.text : e.kind !== "scholar" && e.translation ? e.translation : e.arabic;
const previewLanguage = ({ evidence: e, displayTranslation: t }: RichSource, language: Locale) => t?.status === "ready" ? t.language
  : e.kind === "scholar" || !e.translation ? "ar" : e.kind === "hadith" ? e.translationLanguage ?? "ar" : language;

export function richSourceCards(section: RichSection) {
  const byId = new Map(section.sources.map(s => [s.id, s]));
  return [...consecutiveRuns(section.sources.filter(s => s.evidence.kind === "quran").map(s => s.id)).map(run => run.map(id => byId.get(id)!)),
    ...section.sources.filter(s => s.evidence.kind !== "quran").map(s => [s])];
}

export function RichAnswerView({ sections, language, text, complete = false, guide = "ask_specific_followup", incomplete = false, withdrawn = false }: {
  sections: RichSection[]; language: Locale; text: Dictionary["ask"]; complete?: boolean; guide?: RichGuide; incomplete?: boolean; withdrawn?: boolean;
}) {
  const prefix = useId();
  const t = richText[language];
  const owners = new Map<string, RichSection["group"]>();
  for (const section of sections) for (const source of section.sources) if (!owners.has(source.id)) owners.set(source.id, section.group);
  const targetId = (ref: string) => `${prefix}-${owners.get(ref)}-${ref}`;
  const refLabel = (section: RichSection, ref: string) => {
    const e = section.sources.find(s => s.id === ref)?.evidence;
    if (!e) return ref;
    if (e.kind === "quran") return `${text.quran} ${e.key}`;
    if (e.kind === "scholar") return text.scholarShort[e.scholarId as keyof typeof text.scholarShort] ?? e.scholarName;
    return [e.numbers.bukhari && `${text.hadith.numberBukhari} ${e.numbers.bukhari}`, e.numbers.muslim && `${text.hadith.numberMuslim} ${e.numbers.muslim}`].filter(Boolean).join(" · ");
  };
  return <article className={styles.answer} dir={language === "ar" ? "rtl" : "ltr"}>
    <p className={styles.notice}>{withdrawn ? t.withdrawn : incomplete ? sections.some(s => s.outcome === "ready" && s.claims.length) ? t.incomplete : t.noCheckedSections : text.v2.review.automatic}</p>
    {complete && sections.some(s => !!s.searchOutcome || ["timeout", "search_failed", "unavailable", "failed_check", "not_checked"].includes(s.outcome)) && <p className={styles.gap} role="note">{t.limited}</p>}
    {!withdrawn && sections.map(section => <section className={styles.section} key={section.group} aria-labelledby={`${prefix}-${section.group}`}>
      <h2 id={`${prefix}-${section.group}`}>{t.titles[section.group]}</h2>
      {section.searchOutcome && <p className={styles.gap}>{t.outcomes[section.searchOutcome]}</p>}
      {section.outcome !== "ready" ? <p className={styles.gap}>{t.outcomes[section.outcome]}</p> : <>
        {section.claims.map((claim, i) => <p className={styles.claim} key={i}>{claim.text}{" "}
          <span className={styles.refs}>{claim.refs.map(ref => <a key={ref} href={`#${targetId(ref)}`} onClick={() => {
            const target = document.getElementById(targetId(ref));
            target?.focus();
          }}><bdi>{refLabel(section, ref)}</bdi></a>)}</span>
        </p>)}
        <div className={styles.sources}>{richSourceCards({ ...section, sources: section.sources.filter(s => owners.get(s.id) === section.group) }).map(card => <div className={styles.passage} key={card.map(s => s.id).join("-")}>{card.map(source => { const { id, evidence: e, displayTranslation: tr } = source; return <div key={id} id={`${prefix}-${section.group}-${id}`} tabIndex={-1} className={styles.source}>
          <div className={styles.sourceHead}><strong><bdi>{refLabel(section, id)}</bdi></strong>
            <a href={e.url} target="_blank" rel="noopener noreferrer">{t.source} ↗</a></div>
          {e.kind === "scholar" && <p>{e.title || e.reference}</p>}
          {e.kind === "hadith" && <p lang="ar" dir="rtl">{e.gradeAr} · {e.attributionAr}</p>}
          {e.kind === "scholar" && language !== "ar" && <small>{tr?.status === "ready"
            ? tr.origin === "ai" ? t.aiTranslation : tr.reviewer && tr.reviewedAt ? t.humanReviewedTranslation : t.humanTranslation
            : tr?.status === "lookup_failed" ? t.translationLookupFailed : tr?.status === "not_checked" ? t.translationNotChecked : tr?.status === "rejected" ? t.translationRejected : t.missing}</small>}
          <p className={styles.preview} lang={previewLanguage(source, language)} dir="auto">
            {preview(source).slice(0, 230)}{preview(source).length > 230 ? "…" : ""}
          </p>
          <details><summary>{t.original}</summary><blockquote lang="ar" dir="rtl">{e.arabic}</blockquote>
            {e.kind !== "scholar" && (e.translation ? <><p lang={e.kind === "hadith" ? e.translationLanguage ?? undefined : language} dir="auto">{e.translation}</p><small>{e.kind === "quran" ? e.translationName : e.translationLanguage?.toUpperCase()}</small></> : language !== "ar" && <p>{t.missing}</p>)}
            {e.kind === "scholar" && <>{tr?.status === "ready" && <p lang={tr.language} dir="ltr">{tr.text}</p>}<small>{e.reference}</small></>}
          </details>
        </div>; })}</div>)}</div>
        {section.sources.filter(s => owners.get(s.id) !== section.group).map(source => <p className={styles.preview} key={source.id}>
          <a href={`#${targetId(source.id)}`} onClick={() => document.getElementById(targetId(source.id))?.focus()}><bdi>{refLabel(section, source.id)}</bdi></a>{" · "}
          <span dir="auto" lang={previewLanguage(source, language)}>{preview(source).slice(0, 160)}…</span>
        </p>)}
        {section.sources.some(s => s.evidence.kind === "quran") && <small><a href={ATTRIBUTION.url} target="_blank" rel="noopener noreferrer">{ATTRIBUTION.text}</a></small>}
        {(() => { const credit = hadithAttributionFor(section.sources.filter(s => s.evidence.kind === "hadith").map(s => s.id)); return credit && <small><a href={credit.url} target="_blank" rel="noopener noreferrer">{credit.text}</a></small>; })()}
      </>}
    </section>)}
    {complete && <aside className={styles.guide}><strong>{t.guidance}</strong><p>{typeof guide === "object" ? <>{guide.text}{" "}{guide.refs.map(ref => {
      const section = sections.find(s => s.sources.some(source => source.id === ref));
      return section && <a key={ref} href={`#${targetId(ref)}`} onClick={() => document.getElementById(targetId(ref))?.focus()}>{refLabel(section, ref)}</a>;
    })}</> : guide === "ask_specific_followup" ? t.next : t.nextByGuide[guide]}</p></aside>}
    <p className={styles.notice}>{t.scopeNotice}</p>
    {(complete || incomplete) && <ReportProblem lang={language} sourceIds={withdrawn ? [] : [...new Set(sections.flatMap(s => s.sources.map(source => source.id)))]} labels={text.report} />}
  </article>;
}
