"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { RichAnswerView, richSourceCards } from "./RichAnswerView";
import { RevealContext, graphemes, type TextSlice } from "./VerifiedReveal";
import { RICH_ORDER, richFailureKind, hasDisplayTranslation, translationOnly, type RichGroup, type RichStreamState } from "@/lib/ask/rich-answer";
import { emptyPublication, presentationStage, publicationSections, type ResearchStage } from "@/lib/ask/publication";
import { richText } from "@/lib/ask/rich-text";
import type { Dictionary, Locale } from "@/lib/i18n";
import styles from "./StableAnswerView.module.css";

export type RevealMemory = Map<string, Partial<Record<RichGroup, number>>>;
export function StableAnswerView({ state, language, text, working, reconnecting, memory }: { state: RichStreamState; language: Locale; text: Dictionary["ask"]; working: boolean; reconnecting?: boolean; memory: RevealMemory }) {
  const empty = useMemo(emptyPublication, []);
  const publication = state.publication ?? empty, key = state.requestId ?? "pending";
  const copy = richText[language], ui = language === "ar" ? {
    quran: "نبحث في القرآن الكريم…", hadith: "نتحقق من مصادر السنة…", scholar: "نراجع نصوص العلماء المعتمدين…", summary: "نُعِدّ خلاصة بيان…",
    quranDetail: "نبحث عن الآيات المرتبطة بسؤالك ونتحقق من نصوصها وسياقها.", hadithDetail: "نبحث في الأحاديث الصحيحة ونتحقق من ألفاظها وتخريجها.", scholarDetail: "نراجع النصوص الأصلية المتاحة في مصادر العلماء المعتمدين.", summaryDetail: "نُعِدّ خلاصة من المصادر المختارة، مع مراعاة شروطها وحدودها.",
    show: "إظهار النص كاملًا", invalid: "ظهر إشكال أثناء التحقق. احتُفظ بالمصادر، وحُجب النص المتأثر إلى حين مراجعته.",
  } : language === "de" ? {
    quran: "Wir durchsuchen den Heiligen Koran…", hadith: "Wir prüfen Quellen der Sunna…", scholar: "Wir prüfen Quellen anerkannter Gelehrter…", summary: "Bayans Fazit wird vorbereitet…",
    quranDetail: "Wir suchen passende Verse und prüfen ihren Originaltext und Zusammenhang.", hadithDetail: "Wir durchsuchen authentische Hadithe und prüfen ihren Wortlaut und ihre Quelle.", scholarDetail: "Wir lesen die Originaltexte, die aus anerkannten Gelehrtenquellen vorliegen.", summaryDetail: "Wir fassen die ausgewählten Quellen zusammen und bewahren ihre Bedingungen und Grenzen.",
    show: "Ganzen Text zeigen", invalid: "Eine spätere Prüfung hat ein Problem gefunden. Die Quellenkarten bleiben erhalten, betroffene Inhalte sind bis zur Überprüfung ausgeblendet.",
  } : {
    quran: "Searching the Holy Quran…", hadith: "Checking Sunnah sources…", scholar: "Checking approved scholars’ sources…", summary: "Preparing Bayan’s conclusion…",
    quranDetail: "Looking for relevant verses and checking their original text and surrounding context.", hadithDetail: "Searching authentic hadith and checking their wording and attribution.", scholarDetail: "Consulting the original texts available from approved scholarly sources.", summaryDetail: "Preparing one summary from the selected sources, preserving their conditions and limits.",
    show: "Show full text", invalid: "A later check found a problem. The source cards are kept; affected content is hidden pending review.",
  };
  const [counts, setCounts] = useState<Partial<Record<RichGroup, number>>>(() => memory.get(key) ?? {});
  const countRef = useRef(counts); countRef.current = counts;
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update(); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const { texts, totals } = useMemo(() => {
    const texts: Record<string, TextSlice> = {}, totals: Partial<Record<RichGroup, number>> = {}, owners = new Set<string>();
    const add = (group: RichGroup, id: string, value: string) => { const glyphs = graphemes(value, language); texts[id] = { text: value, glyphs, start: totals[group] ?? 0, group }; totals[group] = (totals[group] ?? 0) + glyphs.length; };
    for (const group of RICH_ORDER) {
      const section = publication.groups[group].section;
      if (!publication.groups[group].commitId || !section) continue;
      add(group, `${group}-title`, copy.titles[group]);
      section.claims.forEach((claim, index) => { if (!publication.groups[group].notices.some(n => n.claimIndexes.includes(index) || n.sourceIds.some(id => claim.refs.includes(id)))) add(group, `${group}-claim-${index}`, claim.text); });
      // Schedule the exact same card/verse order that the view mounts. Quran
      // cards may be grouped and sorted independently of retrieval order.
      for (const source of richSourceCards(section).flat()) {
        if (owners.has(source.id)) continue;
        if (publication.groups[group].notices.some(n => n.sourceIds.includes(source.id))) continue;
        owners.add(source.id); if (!translationOnly(source, language)) add(group, `${group}-original-${source.id}`, source.evidence.arabic);
        const translation = source.evidence.kind === "scholar" || hasDisplayTranslation(source) ? source.displayTranslation?.status === "ready" ? source.displayTranslation.text : null : source.evidence.translation;
        if (language !== "ar" && translation) add(group, `${group}-translation-${source.id}`, translation);
      }
    }
    return { texts, totals };
  }, [publication, language, copy.titles]);
  const revealed = Object.fromEntries(RICH_ORDER.map(g => [g, (counts[g] ?? 0) >= (totals[g] ?? 0)]));
  const complete = state.terminal && (state.result as { status?: string })?.status === "rich_answer";
  const candidateStage = presentationStage(publication, revealed, complete);
  const stageOrder: ResearchStage[] = ["searching_quran", "streaming_quran", "searching_sunnah", "streaming_sunnah", "searching_scholar", "streaming_scholar", "streaming_summary", "complete"];
  const stageFloor = useRef<ResearchStage>(candidateStage), mountedGroups = useRef(new Set<RichGroup>());
  if (!(state.terminal && !complete) && stageOrder.indexOf(candidateStage) > stageOrder.indexOf(stageFloor.current)) stageFloor.current = candidateStage;
  const stage = stageFloor.current;
  const current = candidateStage.includes("sunnah") ? "hadith" : candidateStage.includes("quran") ? "quran" : candidateStage.includes("scholar") ? "scholar" : "summary";
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches || reducedMotion || state.terminal && !complete) {
      memory.set(key, { ...totals }); setCounts(totals); return;
    }
    if (stage === "complete" || !publication.groups[current].commitId || (countRef.current[current] ?? 0) >= (totals[current] ?? 0)) return;
    let frame = 0, last = performance.now(), carry = 0;
    const tick = (now: number) => {
      carry += now - last; last = now;
      const advance = Math.floor(carry / 9.5); carry %= 9.5;
      if (advance) setCounts(previous => { const next = { ...previous, [current]: Math.min(totals[current] ?? 0, (previous[current] ?? 0) + advance) }; memory.set(key, next); return next; });
      if ((countRef.current[current] ?? 0) < (totals[current] ?? 0)) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame);
  }, [key, stage, current, publication, totals, reducedMotion, memory, state.terminal, complete]);
  const visible = publicationSections(publication).filter(section => {
    if (mountedGroups.current.has(section.group)) return true;
    const index = RICH_ORDER.indexOf(section.group);
    return RICH_ORDER.slice(0, index).every(g => publication.groups[g].commitId ? revealed[g] : ["empty", "blocked"].includes(publication.groups[g].status));
  });
  useEffect(() => { visible.filter(s => s.outcome === "ready").forEach(s => mountedGroups.current.add(s.group)); });
  const settled = !working && state.terminal && (stage === "complete" || !complete);
  const waiting = !publication.groups[current].commitId && working;
  const checking = publication.groups[current].status === "checking";
  const loaderTitle = state.progress === "retrying_selection" ? language === "ar" ? "حدثت مشكلة أثناء اختيار المصادر، نتحقق منها مرة أخرى…" : language === "de" ? "Bei der Auswahl der Quellen gab es ein Problem. Wir prüfen sie erneut…" : "There was a problem selecting sources. We’re checking them again…" : current === "summary" && state.progress === "correcting_summary" ? copy.progress.correcting_summary
    : checking && current === "quran" ? language === "ar" ? "نتحقق من آيات القرآن وسياقها…" : language === "de" ? "Wir prüfen die Koranverse und ihren Zusammenhang…" : "Checking the Quran sources and context…" : ui[current];
  return <div data-research-stage={stage} className={styles.reader}>
    <RevealContext.Provider value={{ texts, counts }}>
      <RichAnswerView sections={visible} language={language} text={text} complete={complete} working={!settled} staged guide={complete ? (state.result as { answer?: { guide?: import("@/lib/ask/rich-answer").RichGuide } }).answer?.guide ?? null : null}
        incomplete={settled && !complete} failureKind={richFailureKind(state.result)} publication={publication} />
    </RevealContext.Provider>
    {reconnecting && <p role="status" aria-live="polite">{language === "ar" ? "انقطع الاتصال. نتحقق مما إذا كان يمكن متابعة البحث بأمان…" : language === "de" ? "Die Verbindung wurde unterbrochen. Wir prüfen, ob die Recherche sicher fortgesetzt werden kann…" : "The connection was interrupted. Checking whether research can continue safely…"}</p>}
    {waiting && <div className={`${styles.gapLoader} ${styles[current]}`} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" /><div><strong>{loaderTitle}</strong><p>{ui[`${current}Detail` as keyof typeof ui]}</p></div>
    </div>}
  </div>;
}
