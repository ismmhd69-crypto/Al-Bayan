"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

export function AlafasyAudioButton({ verseKey }: { verseKey?: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const getAudioUrl = (key?: string) => {
    if (!key) return "https://everyayah.com/data/Alafasy_128kbps/001001.mp3";
    const parts = key.split(":");
    if (parts.length === 2) {
      const surah = parts[0].padStart(3, "0");
      const ayah = parts[1].padStart(3, "0");
      return `https://everyayah.com/data/Alafasy_128kbps/${surah}${ayah}.mp3`;
    }
    return "https://everyayah.com/data/Alafasy_128kbps/001001.mp3";
  };

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!audioRef.current) {
      audioRef.current = new Audio(getAudioUrl(verseKey));
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.onerror = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  return (
    <button
      type="button"
      className={`quran-audio-btn ${isPlaying ? "playing" : ""}`}
      onClick={toggle}
      title="Listen (Sheikh Mishary Rashid Alafasy)"
      aria-label="Listen (Sheikh Mishary Rashid Alafasy)"
    >
      {isPlaying ? (
        <Pause aria-hidden="true" className="audio-icon" />
      ) : (
        <Play aria-hidden="true" className="audio-icon" />
      )}
      <span className="quran-audio-wave" aria-hidden="true">
        <span className="wave-bar" />
        <span className="wave-bar" />
        <span className="wave-bar" />
        <span className="wave-bar" />
      </span>
    </button>
  );
}
