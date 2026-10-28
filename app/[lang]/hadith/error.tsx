"use client";

import { useParams } from "next/navigation";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { HadithErrorState } from "@/components/hadith/HadithErrorState";
import "./hadith.css";

export default function HadithErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams();
  const rawLang = typeof params?.lang === "string" ? params.lang : "en";
  const lang: Locale = isLocale(rawLang) ? rawLang : "en";
  const dict = getDictionary(lang).hadith;

  return (
    <HadithErrorState
      lang={lang}
      dict={dict}
      onRetry={reset}
      errorMessage={error?.message}
    />
  );
}

