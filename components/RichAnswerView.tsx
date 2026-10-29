"use client";

import { useId } from "react";
import type { Locale, Dictionary } from "@/lib/i18n";
import type { RichSection, RichGuide, RichSource } from "@/lib/ask/rich-answer";
import { richText } from "@/lib/ask/rich-text";
import { RICH_ORDER, hasDisplayTranslation, translationOnly } from "@/lib/ask/rich-answer";
import type { PatientState } from "@/lib/ask/patient-protocol";
import { ATTRIBUTION } from "@/lib/sources/quran-meta";
import { hadithAttributionFor } from "@/lib/sources/hadith-rules";
import styles from "./RichAnswerView.module.css";
import { ReportProblem } from "./ReportProblem";
import { consecutiveRuns } from "@/lib/ask/ids";
import VideoCard from "./VideoCard";
import VerseAudioButton from "./VerseAudioButton";
import { validRelatedVideos, type RelatedVideos } from "@/lib/ask/related-videos";
import type { PublicationState } from "@/lib/ask/publication";
import { VerifiedText, RevealBlock, AfterVerifiedText } from "./VerifiedReveal";
import { researchFailureText } from "@/lib/ask/research-failure-text";

const preview = ({ evidence: e, displayTranslation: t }: RichSource) => t?.status === "ready" ? t.text : e.kind !== "scholar" && e.translation ? e.translation : e.arabic;
const displayedSourceText = (source: RichSource, scholarLimit: number) => {
  const text = preview(source);
  return source.evidence.kind !== "scholar" || text.length <= scholarLimit ? text : `${text.slice(0, scholarLimit)}…`;
};
const previewLanguage = ({ evidence: e, displayTranslation: t }: RichSource, language: Locale) => t?.status === "ready" ? t.language
  : e.kind === "scholar" || !e.translation ? "ar" : e.kind === "hadith" ? e.translationLanguage ?? "ar" : language;

export function richSourceCards(section: RichSection) {
  const byId = new Map(section.sources.map(s => [s.id, s]));
  return [...consecutiveRuns(section.sources.filter(s => s.evidence.kind === "quran").map(s => s.id)).map(run => run.map(id => byId.get(id)!)),
    ...section.sources.filter(s => s.evidence.kind !== "quran").map(s => [s])];
}

export function RichAnswerView({ sections, language, text, complete = false, guide = "ask_specific_followup", incomplete = false, withdrawn = false, technicalFailure = false, failureKind, cards = [], videos, patient, working = false, staged = false, publication, saveSlot }: {
  sections: RichSection[]; language: Locale; text: Dictionary["ask"]; complete?: boolean; saveSlot?: React.ReactNode; guide?: RichGuide | null; incomplete?: boolean; withdrawn?: boolean; technicalFailure?: boolean; failureKind?: import("@/lib/ask/rich-answer").RichFailureKind | null; cards?: import("@/lib/ask/rich-answer").VerifiedQuranCard[]; videos?: RelatedVideos; patient?: PatientState; working?: boolean; staged?: boolean; publication?: PublicationState;
}) {
  const prefix = useId();
  const t = richText[language];
  const researching = working || patient?.status === "working";
  const owners = new Map<string, RichSection["group"]>();
  for (const section of sections) for (const source of section.sources) if (!owners.has(source.id)) owners.set(source.id, section.group);
  const targetId = (ref: string) => `${prefix}-${owners.get(ref)}-${ref}`;
  const pillClass = (ref: string) => {
    const owner = owners.get(ref);
    if (owner === "quran") return styles.refQuran;
    if (owner === "hadith") return styles.refHadith;
    if (owner === "scholar") return styles.refScholar;
    return styles.refDefault;
  };
  const cardClass = (group: RichSection["group"]) => {
    if (group === "quran") return `${styles.passage} ${styles.passageQuran}`;
    if (group === "hadith") return `${styles.passage} ${styles.passageHadith}`;
    if (group === "scholar") return `${styles.passage} ${styles.passageScholar}`;
    return styles.passage;
  };
  const refLabel = (section: RichSection, ref: string) => {
    const e = section.sources.find(s => s.id === ref)?.evidence;
    if (!e) return ref;
    if (e.kind === "quran") return `${text.quran} ${e.key}`;
    if (e.kind === "scholar") return text.scholarShort[e.scholarId as keyof typeof text.scholarShort] ?? e.scholarName;
    return [e.numbers.bukhari && `${text.hadith.numberBukhari} ${e.numbers.bukhari}`, e.numbers.muslim && `${text.hadith.numberMuslim} ${e.numbers.muslim}`].filter(Boolean).join(" · ");
  };
  const ordered: RichSection[] = patient ? RICH_ORDER.map(group => patient.groups[group].section ?? { group, outcome: "not_checked" as const, claims: [], sources: [] })
    : researching && !staged ? RICH_ORDER.filter(g => g !== "summary").map(group => sections.find(s => s.group === group) ?? { group, outcome: "not_checked" as const, claims: [], sources: [] })
    : RICH_ORDER.flatMap(group => sections.filter(s => s.group === group));
  const firstPending = researching ? ordered.findIndex(s => s.outcome === "not_checked") : -1;
  const displayed: RichSection[] = ordered
    .filter((_, index) => firstPending < 0 || index <= firstPending)
    .filter(section => section.group !== "summary" || (staged || !researching) && (complete || patient?.status === "complete"))
    .filter(section => section.outcome === "ready" && (section.claims.length > 0 || section.presentation === "originals" && section.sources.length > 0)
      || researching && section.outcome === "not_checked")
    .filter(section => !(cards.length > 0 && section.group === "quran" && section.outcome !== "ready"));
  const problems = sections.filter(section => !section.omitted && (section.searchOutcome || ["failed_check", "timeout", "search_failed", "unavailable"].includes(section.outcome)));
  return <article className={styles.answer} dir={language === "ar" ? "rtl" : "ltr"}>
    {!withdrawn && cards.length > 0 && <section className={styles.section} aria-label={t.titles.quran}>
      <h2>{t.titles.quran}</h2><p className={styles.gap} role="status">{researching && "sourceCardWorking" in t ? t.sourceCardWorking : t.sourceCardNotice}</p>
      <div className={styles.sources}>{cards.map(card => <div className={cardClass("quran")} key={card.id}>{card.sources.map(source => source.evidence.kind === "quran" ? <div className={styles.source} key={source.id}>
        <div className={styles.sourceHead}><strong>{text.quran} <bdi>{source.evidence.key}</bdi></strong><a href={source.evidence.url} target="_blank" rel="noopener noreferrer">{t.source} ↗</a></div>
        <small>{t.sourceRoles[source.role ?? "direct"]}</small>
        <p lang="ar" dir="rtl">{source.evidence.arabic}</p>
        {language !== "ar" && source.evidence.translation && <><p lang={language}>{source.evidence.translation}</p><small>{source.evidence.translationName}</small></>}
      </div> : null)}</div>)}</div>
    </section>}
    {!withdrawn && displayed.map(section => <section className={styles.section} key={section.group} aria-labelledby={`${prefix}-${section.group}`}>
      <h2 id={`${prefix}-${section.group}`}><VerifiedText id={`${section.group}-title`}>{t.titles[section.group]}</VerifiedText></h2>
      {!!publication?.groups[section.group].notices.length && <p role="alert" className={styles.gap}>{language === "ar" ? "هذا القسم يحتاج إلى مراجعة. حُجب النص المتأثر، واحتُفظ بالمصادر المتاحة." : language === "de" ? "Dieser Abschnitt muss überprüft werden. Betroffene Inhalte sind ausgeblendet, die verfügbaren Quellenkarten bleiben erhalten." : "This section needs review. Affected content is hidden; available source cards are kept."}</p>}
      {patient && !patient.groups[section.group].section ? <p className={styles.gap} role="status" aria-live="polite">{patient.groups[section.group].reason === "evidence_changed" ? t.withdrawn : section.group === "summary" ? t.patientSummaryWaiting : t.patientStates[patient.groups[section.group].state]}</p> : <>
      {section.outcome !== "ready" ? <p className={styles.gap} role="status" aria-live="polite">{t.progress[section.group === "quran" ? "checking_quran" : section.group === "hadith" ? "checking_hadith" : "checking_scholar"]}</p> : <>
        {section.claims.map((claim, i) => publication?.groups[section.group].notices.some(n => n.claimIndexes.includes(i) || n.sourceIds.some(id => claim.refs.includes(id))) ? null : <RevealBlock id={`${section.group}-claim-${i}`} key={i}><p className={styles.claim} dir="auto"><VerifiedText id={`${section.group}-claim-${i}`}>{claim.text}</VerifiedText>{" "}
          <AfterVerifiedText id={`${section.group}-claim-${i}`}><span className={styles.refs}>{claim.refs.map(ref => <a key={ref} href={`#${targetId(ref)}`} className={pillClass(ref)} onClick={() => {
            const target = document.getElementById(targetId(ref));
            target?.focus();
          }}><bdi>{refLabel(section, ref)}</bdi></a>)}</span></AfterVerifiedText>
        </p></RevealBlock>)}
        <div className={styles.sources}>{richSourceCards({ ...section, sources: section.sources.filter(s => owners.get(s.id) === section.group) }).map(card => <RevealBlock id={`${section.group}-original-${card[0].id}`} key={card.map(s => s.id).join("-")}><div className={cardClass(section.group)}>{card.map(source => { const { id, evidence: e, displayTranslation: tr } = source; return <RevealBlock key={id} id={`${section.group}-original-${id}`}><div id={`${prefix}-${section.group}-${id}`} tabIndex={-1} className={styles.source}>
          <div className={styles.sourceHead}><strong><bdi>{refLabel(section, id)}</bdi></strong>
            <span className={styles.sourceTools}>{e.kind === "quran" && <VerseAudioButton verseKey={e.key} language={language} />}
            <a href={e.url} target="_blank" rel="noopener noreferrer">{t.source} ↗</a></span></div>
          {e.kind === "scholar" && <p>{e.title || e.reference}</p>}
          {e.kind === "hadith" && <p lang="ar" dir="rtl">{e.gradeAr} · {e.attributionAr}</p>}
          {hasDisplayTranslation(source) && language !== "ar" && <small>{tr?.status === "ready"
            ? tr.origin === "ai" ? t.aiTranslation : tr.reviewer && tr.reviewedAt ? t.humanReviewedTranslation : t.humanTranslation
            : tr?.status === "lookup_failed" ? t.translationLookupFailed : tr?.status === "not_checked" ? t.translationNotChecked : tr?.status === "rejected" ? t.translationRejected : t.missing}</small>}
          {publication?.groups[section.group].notices.some(n => n.sourceIds.includes(id)) ? <p role="alert">{language === "ar" ? "تعذّر تأكيد هذا المصدر أثناء إعادة التحقق." : language === "de" ? "Diese Quelle konnte bei der erneuten Prüfung nicht bestätigt werden." : "This source could not be confirmed during rechecking."}</p> : <>
          {staged ? <>
            {!translationOnly(source, language) && <p lang="ar" dir="rtl"><VerifiedText id={`${section.group}-original-${id}`}>{e.arabic}</VerifiedText></p>}
            {language !== "ar" && ((e.kind === "scholar" || hasDisplayTranslation(source)) ? tr?.status === "ready" ? tr.text : null : e.translation) && <p lang={language} dir="ltr"><VerifiedText id={`${section.group}-translation-${id}`}>{((e.kind === "scholar" || hasDisplayTranslation(source)) ? tr?.status === "ready" ? tr.text : "" : e.translation) ?? ""}</VerifiedText></p>}
          </> : <p className={styles.preview} lang={previewLanguage(source, language)} dir="auto">
            {displayedSourceText(source, 230)}
          </p>}
          <details><summary>{t.original}</summary><blockquote lang="ar" dir="rtl">{e.arabic}</blockquote>
            {e.kind === "hadith" && hasDisplayTranslation(source) && tr?.status === "ready" && <p lang={tr.language} dir="ltr">{tr.text}</p>}
            {e.kind !== "scholar" && !hasDisplayTranslation(source) && (e.translation ? <><p lang={e.kind === "hadith" ? e.translationLanguage ?? undefined : language} dir="auto">{e.translation}</p><small>{e.kind === "quran" ? e.translationName : e.translationLanguage?.toUpperCase()}</small></> : language !== "ar" && <p>{t.missing}</p>)}
            {e.kind === "scholar" && <>{tr?.status === "ready" && <p lang={tr.language} dir="ltr">{tr.text}</p>}<small>{e.reference}</small></>}
          </details>
          </>}
        </div></RevealBlock>; })}</div></RevealBlock>)}</div>
        {(() => {
          const otherSources = section.sources.filter(s => owners.get(s.id) !== section.group);
          if (!otherSources.length) return null;
          return (
            <details className={styles.citationsFold}>
              <summary className={styles.foldSummary}>
                <span>{t.citedExcerpts}</span>
                <span className={styles.foldCount}>{otherSources.length}</span>
              </summary>
              <div className={styles.foldContent}>
                {otherSources.map(source => (
                  <p className={styles.preview} key={source.id}>
                    <a href={`#${targetId(source.id)}`} className={pillClass(source.id)} onClick={() => document.getElementById(targetId(source.id))?.focus()}><bdi>{refLabel(section, source.id)}</bdi></a>{" · "}
                    <span dir="auto" lang={previewLanguage(source, language)}>{displayedSourceText(source, 160)}</span>
                  </p>
                ))}
              </div>
            </details>
          );
        })()}
        {section.sources.some(s => s.evidence.kind === "quran") && <small><a href={ATTRIBUTION.url} target="_blank" rel="noopener noreferrer">{ATTRIBUTION.text}</a></small>}
        {(() => { const credit = hadithAttributionFor(section.sources.filter(s => s.evidence.kind === "hadith").map(s => s.id)); return credit && <small><a href={credit.url} target="_blank" rel="noopener noreferrer">{credit.text}</a></small>; })()}
      </>}
      </>}
    </section>)}
    {complete && !researching && guide !== null && <aside className={styles.guide}><strong>{t.guidance}</strong><p>{typeof guide === "object" ? <>{guide.text}{" "}{guide.refs.map(ref => {
      const section = sections.find(s => s.sources.some(source => source.id === ref));
      return section && <a key={ref} href={`#${targetId(ref)}`} className={pillClass(ref)} onClick={() => document.getElementById(targetId(ref))?.focus()}>{refLabel(section, ref)}</a>;
    })}</> : guide === "ask_specific_followup" ? t.next : t.nextByGuide[guide]}</p></aside>}
    {complete && !researching && !withdrawn && validRelatedVideos(videos) && <details className="answer-fold video-fold">
      <summary>{text.v2.watchMore}</summary><div className="answer-fold-content">
        <p className="muted">{t.relatedVideoNotice}</p>
        <ul className="evidence">{videos.items.map(v => <VideoCard key={v.youtubeId} v={v} labels={text.video} />)}</ul>
      </div>
    </details>}
    {!researching && (
      <footer className={styles.answerFooter}>
        {complete && <p className={styles.gap}>{language === "ar" ? "ليست هذه فتوى. لحالتك الخاصة، اسأل عالمًا مؤهلًا تثق به." : language === "de" ? "Keine Fatwa. Für deine persönliche Situation frage einen qualifizierten Gelehrten, dem du vertraust." : "Not a fatwa. For your personal situation, ask a qualified scholar you trust."}</p>}
        <p className={styles.notice} role={patient ? "status" : undefined}>{staged && publication && RICH_ORDER.some(g => publication.groups[g].notices.length) ? language === "ar" ? "تحتاج هذه الإجابة إلى مراجعة. احتُفظ بالمصادر، وحُجب النص المتأثر." : language === "de" ? "Diese Antwort muss überprüft werden. Die Quellenkarten bleiben erhalten, betroffene Inhalte sind ausgeblendet." : "This answer needs review. Source cards are kept and affected content is hidden." : patient ? patient.status === "paused" ? t.patientPaused : t.patientNotice : withdrawn ? t.withdrawn : incomplete && researchFailureText(language, failureKind) ? researchFailureText(language, failureKind) : incomplete && failureKind && failureKind in t.failures ? t.failures[failureKind as keyof typeof t.failures] : incomplete && technicalFailure ? t.technicalFailure : incomplete ? sections.some(s => s.outcome === "ready" && s.presentation === "originals") ? language === "ar" ? "المصادر المختارة متاحة أعلاه، لكن لم تكتمل خلاصة بيان." : language === "de" ? "Die ausgewählten Quellen stehen oben, aber Bayans Zusammenfassung konnte nicht fertiggestellt werden." : "The selected sources remain above, but Bayan’s summary could not be completed." : sections.some(s => s.outcome === "ready" && s.claims.length) ? t.incomplete : t.noCheckedSections : text.v2.review.automatic}</p>
        {problems.length > 0 && <details className={styles.citationsFold}>
          <summary>{"researchDetails" in t ? t.researchDetails : t.limited}</summary>
          {problems.map(section => <p className={styles.gap} key={section.group}><strong>{t.titles[section.group]}: </strong>{section.searchFailureStage ? t.sourceFailures[section.searchFailureStage] : section.outcome !== "ready" ? t.outcomes[section.outcome] : section.searchOutcome ? t.outcomes[section.searchOutcome] : ""}</p>)}
        </details>}
        {complete && sections.some(s => !!s.searchOutcome || !s.omitted && ["timeout", "search_failed", "unavailable", "failed_check", "not_checked"].includes(s.outcome)) && <p className={styles.gap} role="note">{t.limited}</p>}
        <p className={styles.notice}>{t.scopeNotice}</p>
        {(complete || incomplete) && <ReportProblem leading={complete ? saveSlot : undefined} lang={language} sourceIds={withdrawn ? [] : [...new Set(sections.flatMap(s => s.sources.map(source => source.id)))]} labels={text.report}
          donateLabel={language === "ar" ? "ساهم في تكاليف الذكاء الاصطناعي لبيان" : language === "de" ? "Hilf mit, Bayans KI-Kosten zu decken" : "Help cover Bayan’s AI costs"} />}
      </footer>
    )}
  </article>;
}
