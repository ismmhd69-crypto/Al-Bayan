"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Volume2 } from "lucide-react";
import type { Locale } from "@/lib/i18n";

export default function AudioPlayButton({
  src,
  label,
  lang = "en",
  compact = false,
}: {
  src: string;
  label?: string;
  lang?: Locale;
  compact?: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [rate, setRate] = useState<1 | 0.8>(1);

  const defaultLabel = {
    en: "Listen to pronunciation",
    ar: "استمع إلى النطق الصحيح",
    de: "Aussprache anhören",
  }[lang];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };
    const onTimeUpdate = () => {
      if (!audio.duration) return;
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100);
    };
    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, []);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      // Pause any other playing audio on page
      document.querySelectorAll("audio").forEach((el) => {
        if (el !== audio) el.pause();
      });
      audio.playbackRate = rate;
      audio.play().catch(() => {});
    }
  }

  function toggleRate() {
    const newRate = rate === 1 ? 0.8 : 1;
    setRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  }

  function restart() {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const newProgress = Number(e.target.value);
    if (audioRef.current && duration) {
      audioRef.current.currentTime = (newProgress / 100) * duration;
      setProgress(newProgress);
    }
  }

  function formatTime(sec: number) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  }

  if (compact) {
    return (
      <div className="audio-play-pill-wrapper">
        <audio ref={audioRef} src={src} preload="metadata" />
        <button
          type="button"
          onClick={togglePlay}
          className={`audio-play-pill ${isPlaying ? "playing" : ""}`}
          aria-label={label ?? defaultLabel}
        >
          {isPlaying ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
          <span>{label ?? defaultLabel}</span>
          <Volume2 size={13} className="audio-vol-icon" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className={`bayan-audio-card ${isPlaying ? "is-playing" : ""}`}>
      <audio ref={audioRef} src={src} preload="metadata" />
      <div className="audio-card-head">
        <div className="audio-card-title">
          <Volume2 size={16} className="audio-icon-gold" aria-hidden="true" />
          <span>{label ?? defaultLabel}</span>
        </div>
        <div className="audio-card-actions">
          <button
            type="button"
            className="audio-rate-btn"
            onClick={toggleRate}
            title={lang === "ar" ? "سرعة الصوت" : lang === "de" ? "Wiedergabegeschwindigkeit" : "Playback speed"}
            aria-label={lang === "ar" ? `سرعة الصوت: ${rate}x` : lang === "de" ? `Wiedergabegeschwindigkeit: ${rate}x` : `Playback speed: ${rate}x`}
          >
            {rate}x
          </button>
          <button
            type="button"
            className="audio-icon-btn"
            onClick={restart}
            title={lang === "ar" ? "إعادة" : lang === "de" ? "Neu starten" : "Restart"}
            aria-label={lang === "ar" ? "إعادة" : lang === "de" ? "Neu starten" : "Restart"}
          >
            <RotateCcw size={14} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="audio-card-controls">
        <button
          type="button"
          className="audio-main-play-btn"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
        </button>

        <div className="audio-scrubber-col">
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={progress}
            onChange={handleSeek}
            className="audio-range-slider"
            aria-label="Audio progress"
          />
          <div className="audio-time-row">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
