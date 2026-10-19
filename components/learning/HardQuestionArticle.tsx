import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, ArrowRight, BookOpen, ChevronDown, ExternalLink } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { articleQuranReferences, articleReferences, hardQuestionArticles, hardQuestionText, splitHardQuestion, type HardQuestionArticle as Article } from "@/lib/learning/hard-questions";
import { learningText } from "@/lib/learning/text";
import LearningEvidence from "./LearningEvidence";
import HardQuestionMarkdown from "./HardQuestionMarkdown";
import AskAboutButton from "@/components/AskAboutButton";

export default function HardQuestionArticle({ article, lang }: { article: Article; lang: Locale }) {
  const t = hardQuestionText[lang], body = article.body[lang], parts = splitHardQuestion(body, lang), references = articleReferences(body);
  const index = hardQuestionArticles.findIndex((a) => a.id === article.id), previous = hardQuestionArticles[index - 1], next = hardQuestionArticles[index + 1];
  const quran = articleQuranReferences(references);
  const prose = (text: string) => <HardQuestionMarkdown text={text} lang={lang} references={references} />;
  const minutes = Math.max(2, Math.ceil(body.replace(/\[[^\]]+\]\[[^\]]+\]/g, "").split(/\s+/).length / 190));
  return <article className="page learning-page learning-reader hard-reader">
    <Link href={`/${lang}/topics`} className="back-link"><ArrowLeft className="flip-rtl" aria-hidden="true" />{t.back}</Link>
    <header className="page-head"><p className="eyebrow">{t.draft}</p><h1>{article.title[lang]}</h1><p className="learning-small">{t.minute.replace("{n}", String(minutes))}</p></header>
    <nav className="hard-jump" aria-label={t.navigate}>{[["answer", t.answer], ["deeper", t.deeper], ["followups", t.followups], ["sources", t.sources]].map(([id, label]) => <a key={id} href={`#hard-${id}`}>{label}</a>)}</nav>
    <section id="hard-answer" className="learning-core" aria-labelledby="hard-answer-title"><h2 id="hard-answer-title"><BookOpen aria-hidden="true" />{t.answer}</h2>{prose(parts.core)}</section>
    <section id="hard-deeper" aria-labelledby="hard-deeper-title"><h2 id="hard-deeper-title">{t.deeper}</h2>{prose(parts.explanation)}</section>
    <section id="hard-followups" className="learning-followups" aria-labelledby="hard-followups-title"><h2 id="hard-followups-title">{t.followups}</h2>{parts.followups.map((item) => <details key={item.question} className="learning-followup"><summary>{item.question}<ChevronDown className="chev" aria-hidden="true" /></summary>{prose(item.answer)}</details>)}</section>
    <section id="hard-sources" className="learning-other-evidence" aria-labelledby="hard-sources-title"><h2 id="hard-sources-title">{t.sources}</h2>
      {quran.length > 0 && <Suspense fallback={<p className="learning-small" role="status">{learningText[lang].evidenceLoading}</p>}><LearningEvidence lang={lang} references={quran} /></Suspense>}
      {(["hadith", "scholar", "history", "science", "comparison"] as const).map((kind) => {
        const entries = references.filter((r) => r.kind === kind);
        return entries.length > 0 && <section key={kind} className="learning-reference-group"><h3>{kind === "comparison" ? ({en:"The other tradition’s own teaching",ar:"تعليم الديانة الأخرى من مصدرها",de:"Die eigene Lehre der anderen Tradition"}[lang]) : t[kind]}</h3>{entries.map((ref) => <details key={ref.id} id={`learning-source-${ref.id}`} className="learning-source answer-source-card" tabIndex={-1}><summary><span><bdi>{ref.title}</bdi></span><ChevronDown className="chev" aria-hidden="true" /></summary><div className="learning-source-content"><p className="learning-small">{kind === "comparison" ? ({en:"This source describes the other tradition for comparison. It is not an authority for Islamic teaching.",ar:"يصف هذا المصدر الديانة الأخرى للمقارنة، وليس مرجعاً للتعليم الإسلامي.",de:"Diese Quelle beschreibt die andere Tradition zum Vergleich. Sie ist keine Autorität für islamische Lehre."}[lang]) : kind === "history" || kind === "science" ? t.researchNote : t.sourceNote}</p><a className="text-link" href={ref.url} target="_blank" rel="noopener noreferrer">{t.open}<ExternalLink aria-hidden="true" size={14} /></a></div></details>)}</section>;
      })}
    </section>
    <section className="learning-guide" aria-labelledby="hard-related-title"><h2 id="hard-related-title">{t.related}</h2>{prose(parts.related)}<Link href={`/${lang}/start`} className="text-link">{t.newIslam}</Link></section>
    <AskAboutButton lang={lang} question={article.title[lang]} label={t.ask} />
    <nav className="learning-reader-footer" aria-label={t.back}>{previous && <Link className="learning-neighbour" href={`/${lang}/topics/${previous.id}`} prefetch={false}><span><ArrowLeft className="flip-rtl" aria-hidden="true" size={16} />{t.previous}</span><strong>{previous.title[lang]}</strong></Link>}{next && <Link className="learning-neighbour" href={`/${lang}/topics/${next.id}`} prefetch={false}><span>{t.next}<ArrowRight className="flip-rtl" aria-hidden="true" size={16} /></span><strong>{next.title[lang]}</strong></Link>}</nav>
    <footer className="learning-small learning-status-note">{t.note}</footer>
  </article>;
}
