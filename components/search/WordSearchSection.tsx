import { Loader2 } from "lucide-react";
import type { WordSearchStatus } from "@/lib/search/use-word-search";
import "./word-search.css";

export interface WordSearchLabels {
  heading: string;
  searching: string;
  error: string;
  retry: string;
  more: string;
}

/** The "found in the text" block under a page's own search: heading, results, loading, error and "show more". */
export function WordSearchSection({ labels, status, hasMore, count, onMore, onRetry, note, children }: {
  labels: WordSearchLabels;
  status: WordSearchStatus;
  hasMore: boolean;
  count: number;
  onMore: () => void;
  onRetry: () => void;
  note?: string;
  children: React.ReactNode;
}) {
  if (status === "idle") return null;
  return (
    <section className="word-results" aria-labelledby="word-results-h">
      <h2 id="word-results-h" className="eyebrow">{labels.heading}</h2>
      {note && count > 0 && <p className="word-note">{note}</p>}
      {count > 0 && <ul className="word-list">{children}</ul>}
      <div className="word-status" role="status" aria-live="polite">
        {status === "loading" && (
          <span className="word-loading"><Loader2 aria-hidden="true" className="word-spin" />{labels.searching}</span>
        )}
      </div>
      {status === "error" && (
        <div className="word-error" role="alert">
          <p>{labels.error}</p>
          <button type="button" className="word-more" onClick={onRetry}>{labels.retry}</button>
        </div>
      )}
      {status === "done" && hasMore && (
        <button type="button" className="word-more" onClick={onMore}>{labels.more}</button>
      )}
    </section>
  );
}

/** Text with matched words wrapped in ⟦ ⟧ by the database, shown with <mark>. The text itself is never treated as markup. */
export function Highlighted({ text }: { text: string }) {
  const parts = text.split(/⟦|⟧/);
  return <>{parts.map((part, i) => (i % 2 === 1 ? <mark key={i}>{part}</mark> : <span key={i}>{part}</span>))}</>;
}
