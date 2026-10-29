"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Pause, Play } from "lucide-react";
import type { Locale } from "@/lib/i18n";

const LABELS: Record<Locale, { play: string; pause: string; unavailable: string }> = {
  en: { play: "Listen to verse {verse}", pause: "Pause verse {verse}", unavailable: "Recitation unavailable" },
  ar: { play: "استمع إلى الآية {verse}", pause: "إيقاف الآية {verse}", unavailable: "التلاوة غير متاحة" },
  de: { play: "Vers {verse} anhören", pause: "Vers {verse} anhalten", unavailable: "Rezitation nicht verfügbar" },
};

/** Play button for a Quran verse in an Ask answer (Mo, 2026-10-29). Uses the same Quran Foundation
 * recitation as the Quran page, looked up only when pressed, so answers load nothing extra. */
export default function VerseAudioButton({ verseKey, language }: { verseKey: string; language: Locale }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "playing" | "error">("idle");
  const t = LABELS[language];
  useEffect(() => () => { audio.current?.pause(); audio.current = null; }, []);

  async function url(): Promise<string | null> {
    const [surah, verse] = verseKey.split(":").map(Number);
    if (!surah || !verse) return null;
    const res = await fetch(`/api/quran/${surah}/verses?page=${Math.ceil(verse / 50)}&per_page=50`);
    if (!res.ok) return null;
    const data = (await res.json()) as { verses?: { verseKey: string; audioUrl: string | null }[] };
    return data.verses?.find((v) => v.verseKey === verseKey)?.audioUrl ?? null;
  }

  async function toggle() {
    if (state === "loading") return;
    if (state === "playing") { audio.current?.pause(); return; }
    try {
      if (!audio.current) {
        setState("loading");
        const src = await url();
        if (!src) { setState("error"); return; }
        const el = new Audio(src);
        el.dataset.verseAudio = "";
        el.addEventListener("playing", () => setState("playing"));
        el.addEventListener("pause", () => setState("idle"));
        el.addEventListener("ended", () => setState("idle"));
        el.addEventListener("error", () => setState("error"));
        audio.current = el;
      }
      // One verse at a time across the answer.
      window.dispatchEvent(new CustomEvent("bayan-verse-audio", { detail: audio.current }));
      setState("loading");
      await audio.current.play();
    } catch { setState("error"); }
  }
  useEffect(() => {
    const stopOthers = (e: Event) => { if ((e as CustomEvent).detail !== audio.current) audio.current?.pause(); };
    window.addEventListener("bayan-verse-audio", stopOthers);
    return () => window.removeEventListener("bayan-verse-audio", stopOthers);
  }, []);

  const verse = verseKey.split(":")[1] ?? verseKey;
  const label = state === "error" ? t.unavailable : (state === "playing" ? t.pause : t.play).replace("{verse}", verse);
  return (
    <button type="button" className={`answer-verse-play${state === "playing" ? " playing" : ""}`} onClick={() => void toggle()}
      aria-label={label} title={label} aria-pressed={state === "playing"} disabled={state === "error"}>
      {state === "loading" ? <Loader2 aria-hidden="true" className="spin" /> : state === "playing" ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
    </button>
  );
}
