import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { buildCanonicalUrl, buildLanguageAlternates } from "@/lib/seo";
import { getCollection, getCollectionBooks } from "@/lib/hadith/service";
import type { HadithCollectionId } from "@/lib/hadith/types";
import { CollectionBooks } from "@/components/hadith/CollectionBooks";
import { HadithErrorState } from "@/components/hadith/HadithErrorState";
import "@/app/[lang]/hadith/hadith.css";

function isNextInternalError(err: unknown): boolean {
  if (typeof err === "object" && err !== null && "digest" in err) {
    const digest = String((err as { digest?: unknown }).digest);
    return digest.startsWith("NEXT_");
  }
  return false;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; collection: string }>;
}): Promise<Metadata> {
  const { lang, collection } = await params;
  if (!isLocale(lang)) return {};

  const dict = getDictionary(lang);
  try {
    const col = await getCollection(collection);
    if (!col) return {};

    const title = col.id === "bukhari" ? dict.hadith.bukhari : dict.hadith.muslim;
    const desc = col.id === "bukhari" ? dict.hadith.bukhariDesc : dict.hadith.muslimDesc;

    return {
      title: `${title} | ${dict.hadith.title}`,
      description: desc,
      alternates: {
        canonical: buildCanonicalUrl(lang, `/hadith/${collection}`),
        languages: buildLanguageAlternates(`/hadith/${collection}`),
      },
    };
  } catch {
    return {
      title: dict.hadith.title,
    };
  }
}

export const revalidate = 86400; // 1 day

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ lang: string; collection: string }>;
}) {
  const { lang, collection } = await params;
  if (!isLocale(lang)) notFound();

  const dict = getDictionary(lang);

  let col;
  try {
    col = await getCollection(collection);
  } catch (err: unknown) {
    if (isNextInternalError(err)) throw err;
    return (
      <HadithErrorState
        lang={lang as Locale}
        dict={dict.hadith}
        errorMessage={err instanceof Error ? err.message : undefined}
      />
    );
  }

  if (!col) {
    notFound();
  }

  try {
    const books = await getCollectionBooks(col.id as HadithCollectionId);

    return (
      <CollectionBooks
        lang={lang as Locale}
        dict={dict.hadith}
        collection={col}
        books={books}
      />
    );
  } catch (err: unknown) {
    if (isNextInternalError(err)) throw err;
    return (
      <HadithErrorState
        lang={lang as Locale}
        dict={dict.hadith}
        errorMessage={err instanceof Error ? err.message : undefined}
      />
    );
  }
}
