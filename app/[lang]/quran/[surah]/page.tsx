import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CircleAlert } from "lucide-react";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { buildCanonicalUrl, buildLanguageAlternates } from "@/lib/seo";
import { getChapter, getChapters, getChapterVerses, isChapterAllowed } from "@/lib/quran/service";
import { SurahReader } from "@/components/quran/SurahReader";
import "../quran.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; surah: string }>;
}): Promise<Metadata> {
  const { lang, surah } = await params;
  if (!isLocale(lang)) return {};

  const surahNum = parseInt(surah, 10);
  if (isNaN(surahNum) || surahNum < 1 || surahNum > 114) {
    return { title: "Surah not found" };
  }

  const dict = getDictionary(lang);
  const chapter = await getChapter(surahNum, lang === "ar" ? "ar" : "en");
  if (!chapter) return { title: "Surah not found" };

  const title =
    lang === "ar"
      ? `سورة ${chapter.nameArabic} (${chapter.id})`
      : `Surah ${chapter.nameSimple} (${chapter.translatedName}) · ${dict.quran.title}`;

  const description =
    lang === "ar"
      ? `اقرأ سورة ${chapter.nameArabic} كاملة (${chapter.versesCount} آية).`
      : `Read Surah ${chapter.nameSimple} (${chapter.translatedName}) with ${chapter.versesCount} verses and English translation.`;

  return {
    title,
    description,
    alternates: {
      canonical: buildCanonicalUrl(lang, `/quran/${surahNum}`),
      languages: buildLanguageAlternates(`/quran/${surahNum}`),
    },
  };
}

export const revalidate = 86400; // 1 day

export default async function SurahPage({
  params,
}: {
  params: Promise<{ lang: string; surah: string }>;
}) {
  const { lang, surah } = await params;
  if (!isLocale(lang)) notFound();

  const dict = getDictionary(lang);
  const surahNum = parseInt(surah, 10);

  // 1. Invalid Surah State
  if (isNaN(surahNum) || surahNum < 1 || surahNum > 114) {
    return (
      <div className="page quran-page">
        <div className="quran-empty-state">
          <CircleAlert aria-hidden="true" className="w-12 h-12 text-accent" />
          <h1>{dict.quran.invalidSurahTitle}</h1>
          <p>{dict.quran.invalidSurahText}</p>
          <Link href={`/${lang}/quran`} className="quran-btn quran-btn--primary">
            <ArrowLeft aria-hidden="true" className="flip-rtl" />
            <span>{dict.quran.backToQuran}</span>
          </Link>
        </div>
      </div>
    );
  }

  // 2. Fetch chapter and neighbors
  const [allChapters, chapter] = await Promise.all([
    getChapters(lang === "ar" ? "ar" : "en"),
    getChapter(surahNum, lang === "ar" ? "ar" : "en"),
  ]);

  if (!chapter) {
    return (
      <div className="page quran-page">
        <div className="quran-empty-state">
          <CircleAlert aria-hidden="true" className="w-12 h-12 text-accent" />
          <h1>{dict.quran.invalidSurahTitle}</h1>
          <p>{dict.quran.invalidSurahText}</p>
          <Link href={`/${lang}/quran`} className="quran-btn quran-btn--primary">
            <ArrowLeft aria-hidden="true" className="flip-rtl" />
            <span>{dict.quran.backToQuran}</span>
          </Link>
        </div>
      </div>
    );
  }

  // Check if chapter is allowed under current scope (e.g. prelive restrictions)
  if (!isChapterAllowed(surahNum)) {
    return (
      <div className="page quran-page">
        <nav className="quran-nav-top" aria-label={dict.quran.allSurahs}>
          <Link href={`/${lang}/quran`} className="quran-back-link">
            <ArrowLeft aria-hidden="true" className="flip-rtl" />
            <span>{dict.quran.allSurahs}</span>
          </Link>
        </nav>
        <div className="quran-empty-state">
          <CircleAlert aria-hidden="true" className="w-12 h-12 text-accent" />
          <h2>Surah {surahNum} content unavailable in current test scope</h2>
          <p>This deployment is currently configured for a limited chapter set. Please check back soon.</p>
          <Link href={`/${lang}/quran`} className="quran-btn quran-btn--secondary">
            <span>{dict.quran.backToQuran}</span>
          </Link>
        </div>
      </div>
    );
  }

  const prevSurah = surahNum > 1 ? allChapters.find((c) => c.id === surahNum - 1) ?? null : null;
  const nextSurah = surahNum < 114 ? allChapters.find((c) => c.id === surahNum + 1) ?? null : null;

  // 3. Fetch initial verses (page 1, perPage = 30)
  let initialVerses;
  try {
    initialVerses = await getChapterVerses(surahNum, { page: 1, perPage: 30 });
  } catch (error) {
    console.error(`Failed to load verses for surah ${surahNum}:`, error);
    return (
      <div className="page quran-page">
        <nav className="quran-nav-top" aria-label={dict.quran.allSurahs}>
          <Link href={`/${lang}/quran`} className="quran-back-link">
            <ArrowLeft aria-hidden="true" className="flip-rtl" />
            <span>{dict.quran.allSurahs}</span>
          </Link>
        </nav>
        <div className="quran-empty-state">
          <CircleAlert aria-hidden="true" className="w-12 h-12 text-accent" />
          <h2>{dict.quran.errorLoading}</h2>
          <p>{error instanceof Error ? error.message : "Network error"}</p>
          <Link href={`/${lang}/quran`} className="quran-btn quran-btn--secondary">
            <span>{dict.quran.backToQuran}</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page quran-page">
      <SurahReader
        lang={lang as Locale}
        dict={dict.quran}
        surah={chapter}
        initialVerses={initialVerses}
        prevSurah={prevSurah}
        nextSurah={nextSurah}
      />
    </div>
  );
}

