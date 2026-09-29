"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Approve / Reject on the review tab. Sends only the status and an optional note.
export default function ReviewButtons({ kind, id, status, next }: { kind: "topic" | "prepared"; id: string; status: string; next?: string }) {
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const router = useRouter();
  async function save(newStatus: "approved" | "rejected" | "draft") {
    setState("saving");
    const res = await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, id, status: newStatus, note }),
    }).catch(() => null);
    if (!res?.ok) return setState("error");
    setState("saved");
    setNote("");
    // After a decision, go straight to the next draft.
    if (next && next !== id && newStatus !== "draft") router.push(next);
    else router.refresh();
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
        {state === "saved" && <p role="status">Saved.</p>}
        {state === "error" && <p role="alert">Could not save. Please try again.</p>}
      </fieldset>
    </div>
  );
}
