"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Pause, Play } from "lucide-react";

/** Icon buttons under a verse: play its recitation (only when a Quran Foundation audio URL exists) and copy it. */
export default function VerseActions({ audioUrl, copyText, playLabel, copyLabel, copiedLabel }: {
  audioUrl: string | null; copyText: string; playLabel: string; copyLabel: string; copiedLabel: string;
}) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    const on = () => setPlaying(true), off = () => setPlaying(false);
    el.addEventListener("play", on); el.addEventListener("pause", off); el.addEventListener("ended", off);
    return () => { el.removeEventListener("play", on); el.removeEventListener("pause", off); el.removeEventListener("ended", off); };
  }, []);
  function toggle() {
    const el = audio.current;
    if (!el) return;
    // One verse at a time: pause any other verse that is playing.
    document.querySelectorAll<HTMLAudioElement>("audio[data-verse-audio]").forEach((other) => { if (other !== el) other.pause(); });
    if (el.paused) void el.play().catch(() => setPlaying(false)); else el.pause();
  }
  async function copy() {
    try { await navigator.clipboard.writeText(copyText); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* Copying is blocked in this browser. */ }
  }
  return <div className="verse-actions">
    {audioUrl && <>
      <audio ref={audio} src={audioUrl} preload="none" data-verse-audio />
      <button type="button" className="verse-action" onClick={toggle} aria-label={playLabel} aria-pressed={playing}>{playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}</button>
    </>}
    <button type="button" className="verse-action" onClick={() => void copy()} aria-label={copied ? copiedLabel : copyLabel}>{copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}</button>
    <span className="verse-action-status" role="status">{copied ? copiedLabel : ""}</span>
  </div>;
}
