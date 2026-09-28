"use client";

import { useId, useState } from "react";
import { ChevronDown, Flag } from "lucide-react";

export type ReportLabels = {
  button: string; title: string; reason: string; comment: string; send: string; cancel: string; thanks: string; error: string;
  wrong_source: string; misquoted: string; not_answering: string; unclear: string; offensive: string; other: string;
};

const REASONS = ["wrong_source", "misquoted", "not_answering", "unclear", "offensive", "other"] as const;

// Lets a visitor flag an answer. Privacy (plan section 10): only the reason, the cited source ids and
// an optional comment are sent, never the question or anything about the visitor.
// A fold-out form under the answer (built by Codex, laid out by Claude).
export function ReportProblem({ lang, sourceIds, labels }: { lang: "ar" | "en" | "de"; sourceIds: string[]; labels: ReportLabels }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<(typeof REASONS)[number]>("wrong_source");
  const [comment, setComment] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const formId = useId();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang, reason, source_ids: sourceIds, ...(comment.trim() ? { comment: comment.trim() } : {}) }),
      });
      setState(response.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <p className="report-thanks" role="status">
        {labels.thanks}
      </p>
    );
  }
  return (
    <div className="report">
      <button type="button" className="report-toggle" aria-expanded={open} aria-controls={formId} onClick={() => setOpen(!open)}>
        <Flag aria-hidden="true" />
        {labels.button}
        <ChevronDown aria-hidden="true" className="chev" />
      </button>
      {open && (
        <form id={formId} className="report-form" onSubmit={submit}>
          <fieldset disabled={state === "sending"}>
            <legend>{labels.title}</legend>
            <label>
              {labels.reason}
              <select value={reason} onChange={(event) => setReason(event.target.value as (typeof REASONS)[number])}>
                {REASONS.map((value) => (
                  <option key={value} value={value}>
                    {labels[value]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {labels.comment}
              <textarea value={comment} maxLength={500} rows={3} onChange={(event) => setComment(event.target.value)} />
            </label>
            {state === "error" && <p role="alert">{labels.error}</p>}
            <div className="report-actions">
              <button type="submit" className="btn btn-primary">
                {labels.send}
              </button>
              <button type="button" className="btn" onClick={() => setOpen(false)}>
                {labels.cancel}
              </button>
            </div>
          </fieldset>
        </form>
      )}
    </div>
  );
}
