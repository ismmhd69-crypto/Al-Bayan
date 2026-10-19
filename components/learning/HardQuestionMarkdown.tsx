"use client";

import Link from "next/link";
import { Fragment, type ReactNode, type MouseEvent } from "react";
import type { Locale } from "@/lib/i18n";
import type { ArticleReference } from "@/lib/learning/hard-questions";
import { articleHref } from "@/lib/learning/hard-question-links";

// Deliberately small Markdown subset. No HTML injection or arbitrary URL execution.
export default function HardQuestionMarkdown({ text, lang, references }: { text: string; lang: Locale; references: ArticleReference[] }) {
  const byId = Object.fromEntries(references.map((r) => [r.id, r]));
  function openSource(event: MouseEvent<HTMLAnchorElement>, id: string) {
    const target = document.getElementById(`learning-source-${id}`);
    if (!target) return;
    event.preventDefault();
    if (target instanceof HTMLDetailsElement) target.open = true;
    target.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
    target.focus({ preventScroll: true });
  }
  function inline(value: string): ReactNode {
    return value.split(/(\[[^\]]+\]\[[^\]]+\]|\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g).map((part, i) => {
      const source = part.match(/^\[([^\]]+)\]\[([^\]]+)\]$/);
      if (source) {
        const ref = byId[source[2]];
        if (!ref) throw new Error(`Missing displayed source ${source[2]}`);
        const label = ref.kind === "quran" && /^\d/.test(source[1]) ? `${lang === "ar" ? "القرآن" : "Quran"} ${source[1]}` : source[1];
        return <a key={i} className={`ref learning-ref hard-ref--${ref.kind}`} href={`#learning-source-${ref.id}`} onClick={(event) => openSource(event, ref.id)}><bdi>{label}</bdi></a>;
      }
      const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link) { const href = articleHref(link[2], lang); return href ? <Link key={i} className="text-link" href={href} prefetch={false}>{link[1]}</Link> : <Fragment key={i}>{link[1]}</Fragment>; }
      if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
      return <Fragment key={i}>{part}</Fragment>;
    });
  }
  const nodes: ReactNode[] = []; let paragraph: string[] = [], items: string[] = [];
  function flush() {
    if (paragraph.length) { nodes.push(<p key={nodes.length}>{inline(paragraph.join(" "))}</p>); paragraph = []; }
    if (items.length) { nodes.push(<ul key={nodes.length}>{items.map((item, i) => <li key={i}>{inline(item)}</li>)}</ul>); items = []; }
  }
  for (const line of text.split("\n")) {
    if (!line.trim()) { flush(); continue; }
    const heading = line.match(/^\*\*([^*]+)\*\*$/);
    if (heading) { flush(); nodes.push(<h3 key={nodes.length}>{heading[1]}</h3>); continue; }
    if (line.startsWith("- ")) { if (paragraph.length) flush(); items.push(line.slice(2)); }
    else { if (items.length) flush(); paragraph.push(line); }
  }
  flush(); return <div className="learning-prose hard-prose">{nodes}</div>;
}
