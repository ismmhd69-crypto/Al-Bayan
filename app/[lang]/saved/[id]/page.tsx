import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/lib/i18n";
import { savedText } from "@/lib/saved/text";
import SavedAnswer from "@/components/saved/SavedAnswer";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return { title: isLocale(lang) ? savedText[lang].title : undefined, robots: { index: false, follow: false } };
}

export default async function SavedAnswerPage({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await params;
  if (!isLocale(lang) || !/^[A-Za-z0-9_-]{1,120}$/.test(id)) notFound();
  return <div className="page saved-page">
    <SavedAnswer lang={lang} id={id} text={getDictionary(lang).ask} />
  </div>;
}
