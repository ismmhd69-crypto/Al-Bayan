"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, Loader2, Lock, Send } from "lucide-react";
import type { Locale, Dictionary } from "@/lib/i18n";
import styles from "./ReportProblemForm.module.css";

const CATEGORIES = [
  "content_mistake",
  "translation_error",
  "technical_bug",
  "typo",
  "offensive",
  "other",
] as const;

type Category = (typeof CATEGORIES)[number];

interface Props {
  lang: Locale;
  t: Dictionary["reportPage"];
  initialPageUrl?: string;
  initialCategory?: string;
}

export default function ReportProblemForm({ lang, t, initialPageUrl = "", initialCategory }: Props) {
  const formId = useId();
  const defaultCategory: Category = CATEGORIES.includes(initialCategory as Category)
    ? (initialCategory as Category)
    : "content_mistake";

  const [category, setCategory] = useState<Category>(defaultCategory);
  const [comment, setComment] = useState("");
  const [pageUrl, setPageUrl] = useState(initialPageUrl);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorText, setErrorText] = useState("");

  const maxChars = 1000;
  const remainingChars = maxChars - comment.length;
  const isValid = comment.trim().length > 0 && comment.length <= maxChars;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || status === "submitting") return;

    setStatus("submitting");
    setErrorText("");

    try {
      const payload = {
        lang,
        category,
        comment: comment.trim(),
        page_url: pageUrl.trim() || null,
      };

      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setStatus("error");
        setErrorText(t.error);
        return;
      }

      setStatus("success");
    } catch {
      setStatus("error");
      setErrorText(t.error);
    }
  }

  function handleReset() {
    setComment("");
    setStatus("idle");
    setErrorText("");
  }

  if (status === "success") {
    return (
      <div className={styles.successCard} role="status">
        <div className={styles.successIcon} aria-hidden="true">
          <Check size={28} />
        </div>
        <h2 className={styles.successTitle}>{t.thanksTitle}</h2>
        <p className={styles.successMessage}>{t.thanksMessage}</p>
        <div className={styles.successActions}>
          <button type="button" onClick={handleReset} className="btn">
            {t.reportAnother}
          </button>
          <Link href={`/${lang}/more`} className="btn btn-primary">
            {t.backToMore}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <form id={formId} onSubmit={handleSubmit} className={styles.form} noValidate>
        <div className={styles.field}>
          <label htmlFor={`${formId}-category`} className={styles.label}>
            {t.categoryLabel}
          </label>
          <div className={styles.selectWrap}>
            <select
              id={`${formId}-category`}
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className={styles.select}
              disabled={status === "submitting"}
            >
              {CATEGORIES.map((catKey) => (
                <option key={catKey} value={catKey}>
                  {t.categories[catKey]}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden="true" size={18} className={styles.selectArrow} />
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor={`${formId}-comment`} className={styles.label}>
            {t.commentLabel}
          </label>
          <textarea
            id={`${formId}-comment`}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t.commentPlaceholder}
            className={styles.textarea}
            rows={5}
            maxLength={maxChars}
            required
            disabled={status === "submitting"}
          />
          <div className={styles.counterRow} aria-live="polite">
            <span>{comment.length} / {maxChars}</span>
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor={`${formId}-page`} className={styles.label}>
            {t.pageUrlLabel}
          </label>
          <input
            id={`${formId}-page`}
            type="text"
            value={pageUrl}
            onChange={(e) => setPageUrl(e.target.value)}
            placeholder={t.pageUrlPlaceholder}
            maxLength={300}
            className={styles.input}
            disabled={status === "submitting"}
          />
        </div>

        <div className={styles.privacyBox}>
          <Lock size={16} aria-hidden="true" className={styles.privacyIcon} />
          <span>{t.privacyNote}</span>
        </div>

        {status === "error" && (
          <div className={styles.errorBox} role="alert">
            {errorText}
          </div>
        )}

        <div className={styles.actions}>
          <button
            type="submit"
            disabled={!isValid || status === "submitting"}
            className={`btn btn-primary ${styles.submitBtn}`}
          >
            {status === "submitting" ? (
              <>
                <Loader2 size={18} aria-hidden="true" className={styles.spinner} />
                <span>{t.sending}</span>
              </>
            ) : (
              <>
                <Send size={16} aria-hidden="true" />
                <span>{t.send}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
