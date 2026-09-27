import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/lib/i18n";
import { getTopic, popularTopicIds } from "@/data/topics";
import AskChat from "@/components/AskChat";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return isLocale(lang) ? { title: getDictionary(lang).ask.title } : {};
}

export default async function AskPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  const suggestions = popularTopicIds.slice(0, 3).map((id) => getTopic(id)!.question[lang]);

  return <AskChat lang={lang} t={t.ask} backLabel={t.common.back} suggestions={suggestions} />;
}
