"use client";

import { useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import type { Hadith } from "@/lib/sources/hadith-rules";

const COLLECTION = { bukhari: "Sahih al-Bukhari", muslim: "Sahih Muslim", agreed: "Bukhari & Muslim (muttafaq 'alayh)" };

// Test tool: search the backup hadith source and see exactly what would be shown.
export default function HadithTester({ lang }: { lang: string }) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ status: string; hadith?: Hadith[] } | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/dev/hadith", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q, lang }),
      });
      setResult(await res.json());
    } catch {
      setResult({ status: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">Test tool, not visible to visitors</p>
        <h1>Hadith test</h1>
        <p className="lead">
          Backup source HadeethEnc.com. Only Sahih al-Bukhari and Sahih Muslim, graded sahih or hasan. Search words
          in the page language ({lang}).
        </p>
      </header>

      <form className="search-box" onSubmit={run}>
        <Search aria-hidden="true" className="search-icon" />
        <label htmlFor="hq" className="sr-only">
          Search
        </label>
        <input id="hq" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. intention, Quran, fasting" />
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "..." : "Search"}
        </button>
      </form>

      {result && result.status !== "ok" && <p className="card card-soft">Status: {result.status}</p>}
      {result?.status === "ok" && result.hadith?.length === 0 && (
        <p className="card card-soft">No Bukhari or Muslim hadith found for these words.</p>
      )}

      {result?.hadith && result.hadith.length > 0 && (
        <ul className="evidence">
          {result.hadith.map((h) => (
            <li key={h.id} className="card" style={{ display: "grid", gap: 8 }}>
              <p className="eyebrow">
                {COLLECTION[h.collection]} · {h.gradeAr} · {h.attributionAr}
              </p>
              <p className="list-sub">
                {[h.numbers.bukhari && `Bukhari ${h.numbers.bukhari}`, h.numbers.muslim && `Muslim ${h.numbers.muslim}`]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <p className="verse-ar" lang="ar" dir="rtl" translate="no">
                {h.arabic}
              </p>
              {h.translations.en && (
                <p className="verse-tr" lang="en" dir="ltr" translate="no">
                  {h.translations.en}
                </p>
              )}
              {h.translations.de && (
                <p className="verse-tr" lang="de" dir="ltr" translate="no">
                  {h.translations.de}
                </p>
              )}
              <a className="verse-link" href={h.url} target="_blank" rel="noopener noreferrer">
                HadeethEnc {h.id}
                <ExternalLink aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
