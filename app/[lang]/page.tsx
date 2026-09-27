import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/lib/i18n";
import { getPopularQuestions } from "@/lib/content";
import AskLauncher from "@/components/AskLauncher";
import LangSwitch from "@/components/LangSwitch";
import { Beacon } from "@/components/Logo";

export const revalidate = 3600;

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  const popular = await getPopularQuestions(lang);

  return (
    <div className="home">
      <div className="home-lang">
        <LangSwitch lang={lang} label={t.more.language} />
      </div>

      <div className="home-hero">
        <Beacon size={56} />
        <h1>{t.home.title}</h1>
        <p className="lead">{t.home.sub}</p>
      </div>

      <AskLauncher
        lang={lang}
        placeholder={t.home.placeholder}
        button={t.home.askButton}
        popularLabel={t.home.popular}
        popular={popular}
      />

      <div className="home-links">
        <Link href={`/${lang}/topics`} className="text-link">
          {t.home.browse}
        </Link>
        <Link href={`/${lang}/start`} className="text-link">
          {t.home.newHere}
        </Link>
      </div>
    </div>
  );
}
