"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Approve / Reject for Mo's local review page. Writes only the status and an optional note.
export default function ReviewButtons({ kind, id, status }: { kind: "topic"; id: string; status: string }) {
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");
  const router = useRouter();
  async function save(next: "approved" | "rejected" | "draft") {
    setState("saving");
    const res = await fetch("/api/dev/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, id, status: next, note }),
    }).catch(() => null);
    if (!res?.ok) return setState("error");
    setState("idle");
    router.refresh();
  }
  return (
    <div className="report-form">
      <fieldset disabled={state === "saving"}>
        <legend>Status: {status}</legend>
        <label>
          Note (optional, for example what to fix)
          <textarea value={note} maxLength={1000} rows={3} onChange={(e) => setNote(e.target.value)} />
        </label>
        <div className="report-actions">
          <button type="button" className="btn btn-primary" onClick={() => save("approved")}>Approve</button>
          <button type="button" className="btn" onClick={() => save("rejected")}>Reject</button>
          <button type="button" className="btn" onClick={() => save("draft")}>Back to draft</button>
        </div>
        {state === "error" && <p role="alert">Could not save. Is the dev server running?</p>}
      </fieldset>
    </div>
  );
}
