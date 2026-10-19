"use client";

import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import type { LearningReference } from "@/lib/learning/course";

export function LearningInline({ text, lang, references, lessonIds, onPrayer }: { text: string; lang: Locale; references: Record<string, LearningReference>; lessonIds: string[]; onPrayer?: (key: string) => void }) {
  const pattern = /(\[[^\]]+\]\[[^\]]+\]|\[[^\]]+\]\(#[^)]+\)|\*\*[^*]+\*\*)/g;
  const parts = text.split(pattern);
  function goTo(event: React.MouseEvent<HTMLAnchorElement>, id: string) {
    const target = document.getElementById(`learning-source-${id}`);
    if (!target) return;
    event.preventDefault();
    if (target instanceof HTMLDetailsElement) target.open = true;
    target.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
    target.focus({ preventScroll: true });
  }
  return <>{parts.map((part, i) => {
    const source = part.match(/^\[([^\]]+)\]\[([^\]]+)\]$/);
    if (source) {
      const ref = references[source[2]];
      if (!ref) return <Fragment key={i}>{source[1]}</Fragment>;
      const label = /^\d/.test(source[1]) && ref.kind === "quran" ? `${lang === "ar" ? "القرآن" : "Quran"} ${source[1]}` : source[1];
      return <a key={i} className={`ref learning-ref learning-ref--${ref.kind}`} href={`#learning-source-${ref.id}`} onClick={(event) => goTo(event, ref.id)}><bdi>{label}</bdi></a>;
    }
    const local = part.match(/^\[([^\]]+)\]\(#([^\)]+)\)$/);
    if (local) {
      const n = local[2].match(/^lesson-(\d+)/);
      if (n && lessonIds[Number(n[1]) - 1]) return <Link key={i} className="text-link" href={`/${lang}/start/${lessonIds[Number(n[1]) - 1]}`} prefetch={false}>{local[1]}</Link>;
      const prayer = local[2].match(/^prayer-(fajr|dhuhr|asr|maghrib|isha)/);
      if (prayer && onPrayer) return <button key={i} type="button" className="learning-inline-button text-link" onClick={() => onPrayer(prayer[1])}>{local[1]}</button>;
      return <Fragment key={i}>{local[1]}</Fragment>;
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      const value = part.slice(2, -2);
      if (/[\u0600-\u06ff]/.test(value) && !/[A-Za-z]/.test(value)) return <strong key={i} lang="ar" dir="rtl" translate="no">{value}</strong>;
      return <strong key={i}>{value}</strong>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  })}</>;
}

export default function LearningMarkdown(props: { text: string; lang: Locale; references: Record<string, LearningReference>; lessonIds: string[]; onPrayer?: (key: string) => void }) {
  const { text } = props;
  const nodes: ReactNode[] = [];
  const lines = text.split("\n");
  let paragraph: string[] = [], items: string[] = [], ordered = false;
  const renderInline = (text: string) => <LearningInline {...props} text={text} />;
  function flushParagraph() { if (paragraph.length) { nodes.push(<p key={nodes.length}>{renderInline(paragraph.join(" "))}</p>); paragraph = []; } }
  function flushList() { if (items.length) { const children = items.map((item, i) => <li key={i}>{renderInline(item)}</li>); nodes.push(ordered ? <ol key={nodes.length}>{children}</ol> : <ul key={nodes.length}>{children}</ul>); items = []; } }
  for (const line of lines) {
    if (!line.trim()) { flushParagraph(); flushList(); continue; }
    if (/^<a id=/.test(line)) continue;
    const heading = line.match(/^\*\*([^*]+)\*\*$/);
    if (heading) { flushParagraph(); flushList(); nodes.push(/^[\u0600-\u06ff].*[،.]/.test(heading[1]) ? <p key={nodes.length} className="verse-ar" lang="ar" dir="rtl" translate="no">{heading[1]}</p> : <h3 key={nodes.length}>{heading[1]}</h3>); continue; }
    const item = line.match(/^(\d+\.|-) (.+)$/);
    if (item) { flushParagraph(); const nextOrdered = item[1] !== "-"; if (items.length && nextOrdered !== ordered) flushList(); ordered = nextOrdered; items.push(item[2]); continue; }
    flushList(); paragraph.push(line);
  }
  flushParagraph(); flushList();
  return <div className="learning-prose">{nodes}</div>;
}
