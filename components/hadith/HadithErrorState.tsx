"use client";

import Link from "next/link";
import { ArrowLeft, CircleAlert, RotateCw } from "lucide-react";
import type { Dictionary, Locale } from "@/lib/i18n";

interface HadithErrorStateProps {
  lang: Locale;
  dict: Dictionary["hadith"];
  onRetry?: () => void;
  backHref?: string;
  backLabel?: string;
  errorMessage?: string;
}

function sanitizeErrorMessage(msg?: string): string | undefined {
  if (!msg) return undefined;
  // Never expose internal Next.js error codes or framework fallbacks to visitors
  if (
    msg.includes("NEXT_") ||
    msg.includes("NEXT_HTTP_ERROR_FALLBACK") ||
    msg.includes("digest:")
  ) {
    return undefined;
  }
  return msg;
}

export function HadithErrorState({
  lang,
  dict,
  onRetry,
  backHref,
  backLabel,
  errorMessage,
}: HadithErrorStateProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const returnHref = backHref ?? `/${lang}/hadith`;
  const returnLabel = backLabel ?? dict.backToHadith;
  const safeMessage = sanitizeErrorMessage(errorMessage);

  return (
    <div className="hadith-page">
      <nav className="hadith-nav-top" aria-label="Breadcrumb">
        <Link href={returnHref} className="hadith-back-link">
          <ArrowLeft className="flip-rtl" aria-hidden="true" />
          <span>{returnLabel}</span>
        </Link>
      </nav>

      <div className="hadith-empty-state" role="alert">
        <CircleAlert aria-hidden="true" className="w-12 h-12 text-accent" />
        <h1>{dict.errorLoading}</h1>
        {safeMessage && (
          <p style={{ fontSize: "var(--fs-sm)", color: "var(--ink-3)" }}>
            {safeMessage}
          </p>
        )}
        <div style={{ display: "flex", gap: "12px", marginBlockStart: "8px" }}>
          <button
            type="button"
            onClick={handleRetry}
            className="hadith-btn hadith-btn--primary"
          >
            <RotateCw className="w-4 h-4" aria-hidden="true" />
            <span>{dict.retry}</span>
          </button>
          <Link href={returnHref} className="hadith-btn hadith-btn--secondary">
            <span>{returnLabel}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
