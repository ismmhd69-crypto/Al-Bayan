import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/lib/i18n";
import { getPopularQuestions } from "@/lib/content";
import AskWorkspace from "@/components/AskWorkspace";
import { chatText } from "@/lib/chat-text";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return isLocale(lang) ? { title: getDictionary(lang).ask.title } : {};
}

export const revalidate = 3600;

export default async function AskPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  const suggestions = await getPopularQuestions(lang, 3);

  return (
    <AskWorkspace
      lang={lang}
      t={t.ask}
      chat={chatText[lang]}
      backLabel={t.common.back}
      suggestions={suggestions}
      testMode={process.env.QURAN_API_ENV !== "production"}
    />
  );
}
