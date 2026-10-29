"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Loader2, Pause, Play } from "lucide-react";
import type { Locale } from "@/lib/i18n";

const LABELS: Record<Locale, { play: string; pause: string; unavailable: string }> = {
  en: { play: "Listen to verse {verse}", pause: "Pause verse {verse}", unavailable: "Recitation unavailable" },
  ar: { play: "استمع إلى الآية {verse}", pause: "إيقاف الآية {verse}", unavailable: "التلاوة غير متاحة" },
  de: { play: "Vers {verse} anhören", pause: "Vers {verse} anhalten", unavailable: "Rezitation nicht verfügbar" },
};

type Recitation = { audioUrl: string; words: { position: number; text: string }[]; segments: [number, number, number][] };
/** Sent on window while a verse is recited: its words and the word now being recited (null when stopped). */
type RecitationEvent = { verseKey: string; audio: HTMLAudioElement; words: Recitation["words"] | null; position: number | null };
const EVENT = "bayan-recitation";
const send = (detail: RecitationEvent) => window.dispatchEvent(new CustomEvent<RecitationEvent>(EVENT, { detail }));

/** Play button for a Quran verse in an Ask answer (Mo, 2026-10-29). Uses Quran Foundation's Alafasy
 * recitation, the same as the Quran page, looked up only when pressed. Word timings from the same
 * response drive the word highlight in RecitedVerse. */
export default function VerseAudioButton({ verseKey, language }: { verseKey: string; language: Locale }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "playing" | "error">("idle");
  const t = LABELS[language];

  useEffect(() => {
    // One verse at a time across the answer.
    const stopOthers = (e: Event) => { const d = (e as CustomEvent<RecitationEvent>).detail; if (d.audio !== audio.current && d.position !== null) audio.current?.pause(); };
    window.addEventListener(EVENT, stopOthers);
    return () => { window.removeEventListener(EVENT, stopOthers); audio.current?.pause(); audio.current = null; };
  }, []);

  async function load(): Promise<HTMLAudioElement | null> {
    const res = await fetch(`/api/quran/recitation/${encodeURIComponent(verseKey)}`);
    if (!res.ok) return null;
    const r = (await res.json()) as Recitation;
    if (!r.audioUrl) return null;
    const el = new Audio(r.audioUrl);
    // Highlight only when every timed word has its text; otherwise just play.
    const words = r.words.length && r.segments.every(([p]) => r.words.some((w) => w.position === p)) ? r.words : null;
    let frame = 0, last: number | null = null;
    const tick = () => {
      const ms = el.currentTime * 1000;
      const position = r.segments.find(([, start, end]) => ms >= start && ms < end)?.[0] ?? last;
      if (position !== last) { last = position; send({ verseKey, audio: el, words, position }); }
      frame = requestAnimationFrame(tick);
    };
    const stop = (ended: boolean) => {
      cancelAnimationFrame(frame);
      if (ended) { last = null; send({ verseKey, audio: el, words: null, position: null }); }
    };
    el.addEventListener("playing", () => { setState("playing"); if (words) { cancelAnimationFrame(frame); frame = requestAnimationFrame(tick); } });
    el.addEventListener("pause", () => { setState("idle"); stop(el.ended); });
    el.addEventListener("ended", () => { setState("idle"); stop(true); });
    el.addEventListener("error", () => { setState("error"); stop(true); });
    return el;
  }

  async function toggle() {
    if (state === "loading") return;
    if (state === "playing") { audio.current?.pause(); return; }
    try {
      setState("loading");
      audio.current ??= await load();
      if (!audio.current) { setState("error"); return; }
      send({ verseKey, audio: audio.current, words: null, position: 0 });
      await audio.current.play();
    } catch { setState("error"); }
  }

  const verse = verseKey.split(":")[1] ?? verseKey;
  const label = state === "error" ? t.unavailable : (state === "playing" ? t.pause : t.play).replace("{verse}", verse);
  return (
    <button type="button" className={`answer-verse-play${state === "playing" ? " playing" : ""}`} onClick={() => void toggle()}
      aria-label={label} title={label} aria-pressed={state === "playing"} disabled={state === "error"}>
      {state === "loading" ? <Loader2 aria-hidden="true" className="spin" /> : state === "playing" ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
    </button>
  );
}

/** The verse's Arabic. While its recitation plays (or is paused part-way), it shows Quran Foundation's
 * words with the recited word highlighted; otherwise the original text is shown unchanged. */
export function RecitedVerse({ verseKey, children }: { verseKey: string; children: ReactNode }) {
  const [words, setWords] = useState<Recitation["words"] | null>(null);
  const [position, setPosition] = useState<number | null>(null);
  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent<RecitationEvent>).detail;
      if (d.verseKey !== verseKey) { if (d.position !== null) { setWords(null); setPosition(null); } return; }
      if (d.words) { setWords(d.words); setPosition(d.position); }
      else if (d.position === null) { setWords(null); setPosition(null); }
    };
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, [verseKey]);
  if (!words) return <>{children}</>;
  return <>{words.map((w, i) => <span key={w.position}>{i > 0 && " "}<span className={`recited-word${w.position === position ? " recited-word--now" : ""}`}>{w.text}</span></span>)}</>;
}
