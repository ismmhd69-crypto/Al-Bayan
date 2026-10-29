import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import { Fragment, type ReactNode } from "react";
import fr from "@/dictionaries/fr";
import { richTextFr } from "@/lib/ask/rich-text-fr";
import lessonSource from "@/data/learning/new-to-islam.json";
import hardQuestionSource from "@/data/learning/hard-questions.json";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: fr.meta.title,
  description: fr.meta.description,
  robots: { index: false, follow: false },
};

function isLoopbackHost(hostHeader: string | null) {
  if (!hostHeader) return false;
  try {
    const host = new URL(`http://${hostHeader}`).hostname.toLowerCase().replace(/^\[|\]$/gu, "");
    return ["localhost", "127.0.0.1", "::1"].includes(host);
  } catch {
    return false;
  }
}

type LearningDraft = { id: string; title: string; body: string };
type PreparedDraft = {
  collection: "prepared-answers" | "topic-answers";
  source_file: string;
  topic_id: string;
  questions?: string[];
  answers: Record<string, Array<string | { text: string; source_ids?: string[]; requirement_id?: string }>>;
};

function readDraftBatches<T>(prefix: string): T[] {
  const directory = path.join(process.cwd(), "data", "french-batches");
  return fs.readdirSync(directory)
    .filter((name) => name.startsWith(prefix) && name.endsWith(".json"))
    .sort()
    .flatMap((name) => JSON.parse(fs.readFileSync(path.join(directory, name), "utf8")) as T[]);
}

function InlineDraftText({ text, refs, lessonIds, articleIds }: {
  text: string;
  refs: Record<string, { title: string; url: string }>;
  lessonIds: Set<string>;
  articleIds: Set<string>;
}) {
  const pattern = /(\[[^\]]+\]\[[^\]]+\]|\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g;
  return <>{text.split(pattern).map((part, index) => {
    const citation = part.match(/^\[([^\]]+)\]\[([^\]]+)\]$/u);
    if (citation) {
      const reference = refs[citation[2]];
      return reference
        ? <a key={index} href={reference.url} target="_blank" rel="noreferrer" title={reference.title}>{citation[1]}</a>
        : <span key={index} title={`Référence source : ${citation[2]}`}>{citation[1]}</span>;
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/u);
    if (link) {
      const rawTarget = link[2].replace(/^#/, "").replace(/^\/(?:en|ar|de)\/(?:start|topics)\//u, "");
      const id = rawTarget.match(/^(?:lesson-)?(\d+)$/u)
        ? [...lessonIds][Number(rawTarget.match(/^(?:lesson-)?(\d+)$/u)?.[1] ?? 0) - 1]
        : rawTarget;
      const anchor = lessonIds.has(id) ? `fr-preview-lesson-${id}` : articleIds.has(id) ? `fr-preview-article-${id}` : null;
      return anchor ? <a key={index} href={`#${anchor}`}>{link[1]}</a> : <span key={index}>{link[1]}</span>;
    }
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    return <Fragment key={index}>{part}</Fragment>;
  })}</>;
}

function DraftBody({ text, refs, lessonIds, articleIds }: {
  text: string;
  refs: Record<string, { title: string; url: string }>;
  lessonIds: Set<string>;
  articleIds: Set<string>;
}) {
  const nodes: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  const inline = (value: string) => <InlineDraftText text={value} refs={refs} lessonIds={lessonIds} articleIds={articleIds} />;
  const flush = () => {
    if (paragraph.length) {
      nodes.push(<p key={nodes.length}>{inline(paragraph.join(" "))}</p>);
      paragraph = [];
    }
    if (list.length) {
      nodes.push(<ul key={nodes.length}>{list.map((item, index) => <li key={index}>{inline(item)}</li>)}</ul>);
      list = [];
    }
  };
  for (const line of text.split("\n")) {
    if (!line.trim()) { flush(); continue; }
    const heading = line.match(/^\*\*([^*]+)\*\*$/u);
    if (heading) { flush(); nodes.push(<h4 key={nodes.length}>{heading[1]}</h4>); continue; }
    if (line.startsWith("- ")) { if (paragraph.length) flush(); list.push(line.slice(2)); }
    else { if (list.length) flush(); paragraph.push(line); }
  }
  flush();
  return <div className="fr-preview-prose">{nodes}</div>;
}

export default async function FrenchPreviewPage() {
  if (process.env.NODE_ENV !== "development" || !isLoopbackHost((await headers()).get("host"))) notFound();
  const t = fr;
  const lessons = readDraftBatches<LearningDraft>("new-to-islam-");
  const articles = readDraftBatches<LearningDraft>("hard-questions-");
  const preparedAnswers = readDraftBatches<PreparedDraft>("prepared-answers-");
  const lessonIds = new Set((lessonSource.lessons as Array<{ id: string }>).map((lesson) => lesson.id));
  const articleIds = new Set((hardQuestionSource.articles as Array<{ id: string }>).map((article) => article.id));
  const lessonReferences = lessonSource.references as Record<string, { title: string; url: string }>;
  const articleReferences = hardQuestionSource.references as Record<string, { title: string; url: string }>;
  const preparedTitle = (entry: PreparedDraft) => entry.questions?.[0] ?? entry.topic_id.replace(/-/gu, " ");

  return (
    <main className="fr-preview" id="main">
      <header className="fr-preview-header">
        <a href="#main" aria-label={t.common.brandAr} className="fr-preview-brand">{t.common.brandAr} · Bayan</a>
        <nav aria-label={t.nav.label}>
          <a href="#ask">{t.nav.ask}</a>
          <a href="#topics">{t.nav.topics}</a>
          <a href="#readers">{t.nav.quran}</a>
          <a href="#readers">{t.nav.hadith}</a>
        </nav>
      </header>

      <section className="fr-preview-hero">
        <p className="eyebrow">Aperçu privé, visible uniquement en développement local</p>
        <h1>{t.home.title}</h1>
        <p>{t.home.sub}</p>
      </section>

      <section className="fr-preview-card" id="ask" aria-labelledby="fr-preview-ask-title">
        <h2 id="fr-preview-ask-title">{t.ask.title}</h2>
        <p>{t.ask.notice}</p>
        <label htmlFor="fr-preview-question">{t.ask.placeholder}</label>
        <textarea id="fr-preview-question" placeholder={t.ask.placeholder} rows={3} />
        <button type="button" disabled>{t.ask.send}</button>
        <p role="status">{t.ask.notReady}</p>
        <p>{t.ask.parts.short} · {t.ask.parts.evidence} · {t.ask.parts.scholars}</p>
        <p>{t.ask.thinking} · {t.ask.busy}</p>
      </section>

      <section className="fr-preview-card" aria-labelledby="fr-preview-status-title">
        <h2 id="fr-preview-status-title">États et messages de recherche</h2>
        <p>{richTextFr.submitting} {richTextFr.queued}</p>
        <p>{richTextFr.reconnecting} {richTextFr.refreshing}</p>
        <p role="status">{richTextFr.patientNotice}</p>
        <p role="alert">{richTextFr.incomplete}</p>
        <p>{richTextFr.translationNotChecked}</p>
        <p>{richTextFr.outcomes.no_direct_evidence}</p>
      </section>

      <section className="fr-preview-card" id="topics" aria-labelledby="fr-preview-topics-title">
        <h2 id="fr-preview-topics-title">{t.topics.title}</h2>
        <p>{t.topics.intro}</p>
        <button type="button">{t.home.browse}</button>
        <p>{t.topics.preparing}</p>
      </section>

      <section className="fr-preview-card fr-preview-content" aria-labelledby="fr-preview-learning-title">
        <h2 id="fr-preview-learning-title">Parcours de découverte : {lessons.length} leçons françaises</h2>
        <p>Contenu provisoire local. Les liens de source renvoient aux références d’origine.</p>
        {lessons.map((lesson, index) => <details id={`fr-preview-lesson-${lesson.id}`} key={lesson.id} className="fr-preview-draft">
          <summary>{index + 1}. {lesson.title}</summary>
          <DraftBody text={lesson.body} refs={lessonReferences} lessonIds={lessonIds} articleIds={articleIds} />
        </details>)}
      </section>

      <section className="fr-preview-card fr-preview-content" aria-labelledby="fr-preview-articles-title">
        <h2 id="fr-preview-articles-title">Questions difficiles : {articles.length} articles français</h2>
        <p>Les textes restent des brouillons éditoriaux privés.</p>
        {articles.map((article) => <details id={`fr-preview-article-${article.id}`} key={article.id} className="fr-preview-draft">
          <summary>{article.title}</summary>
          <DraftBody text={article.body} refs={articleReferences} lessonIds={lessonIds} articleIds={articleIds} />
        </details>)}
      </section>

      <section className="fr-preview-card fr-preview-content" aria-labelledby="fr-preview-answers-title">
        <h2 id="fr-preview-answers-title">Réponses préparées : {preparedAnswers.length} brouillons français</h2>
        <p>Les sources et les exigences sont conservées. Les réponses ne sont pas publiées.</p>
        {preparedAnswers.map((entry) => <details key={`${entry.collection}:${entry.topic_id}`} className="fr-preview-draft">
          <summary>{preparedTitle(entry)}</summary>
          {entry.questions && <ul>{entry.questions.map((question) => <li key={question}>{question}</li>)}</ul>}
          {Object.entries(entry.answers).map(([section, items]) => <div key={section}>
            <h4>{section === "direct_answer" ? "Réponse directe" : section === "explanation" ? "Explication" : section === "list" ? "Étapes" : section === "not_established" ? "Points non établis" : section === "other_views" ? "Autres avis" : section}</h4>
            <ul>{items.map((item, index) => <li key={index}>
              <span>{typeof item === "string" ? item : item.text}</span>
              {typeof item !== "string" && <small>{item.source_ids?.join(" · ")}{item.requirement_id ? ` · ${item.requirement_id}` : ""}</small>}
            </li>)}</ul>
          </div>)}
        </details>)}
      </section>

      <section className="fr-preview-card" id="readers" aria-labelledby="fr-preview-readers-title">
        <h2 id="fr-preview-readers-title">{t.quran.title} · {t.hadith.title}</h2>
        <p>{t.quran.intro}</p>
        <label htmlFor="fr-preview-search">{t.hadith.searchPlaceholder}</label>
        <input id="fr-preview-search" placeholder={t.hadith.searchPlaceholder} />
        <p role="status">{t.quran.translationUnavailable}</p>
        <p role="status">{t.hadith.translationUnavailable}</p>
        <p role="status">Aucune traduction française approuvée du Coran n’est configurée ici. Le texte arabe reste intact.</p>
        <p role="status">Les traductions françaises des hadiths et des savants ne sont pas encore enregistrées dans la bibliothèque.</p>
        <button type="button" aria-label={t.quran.playVerse.replace("{verse}", "1")}>{t.quran.audioUnavailable}</button>
      </section>
    </main>
  );
}
