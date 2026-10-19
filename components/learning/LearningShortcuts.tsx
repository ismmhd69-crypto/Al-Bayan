import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { learningText } from "@/lib/learning/text";

export default function LearningShortcuts({ lang }: { lang: Locale }) {
  const t = learningText[lang];
  return <nav className="learning-shortcuts" aria-label={t.shortcuts}>
    {[["becoming-muslim", t.becoming], ["understanding-prayer", t.prayer], ["ramadan", t.ramadan], ["questions-and-thoughts", t.questions]].map(([id, label]) => <Link key={id} href={`/${lang}/start/${id}`} prefetch={false} className="text-link">{label}</Link>)}
  </nav>;
}
