"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { BookOpen, Pause, Play, RotateCcw, Volume2 } from "lucide-react";

type VerseItem = {
  num: number;
  arabic: string;
  phonetic: string;
  translation: Record<Locale, string>;
  audio: string;
};

const FATIHAH_VERSES: VerseItem[] = [
  {
    num: 1,
    arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    phonetic: "Bismillahir-Rahmanir-Rahim",
    translation: {
      en: "In the name of God, the Lord of Mercy, the Giver of Mercy.",
      ar: "بسم الله الرحمن الرحيم.",
      de: "Im Namen Gottes, des Allerbarmers, des Barmherzigen.",
    },
    audio: "/audio/fatihah/001.mp3",
  },
  {
    num: 2,
    arabic: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
    phonetic: "Al-hamdu lillahi Rabbil-'alamin",
    translation: {
      en: "Praise belongs to God, Lord of the Worlds,",
      ar: "الحمد لله رب العالمين.",
      de: "Lob gebührt Gott, dem Herrn der Welten,",
    },
    audio: "/audio/fatihah/002.mp3",
  },
  {
    num: 3,
    arabic: "الرَّحْمَٰنِ الرَّحِيمِ",
    phonetic: "Ar-Rahmanir-Rahim",
    translation: {
      en: "the Lord of Mercy, the Giver of Mercy,",
      ar: "الرحمن الرحيم.",
      de: "dem Allerbarmer, dem Barmherzigen,",
    },
    audio: "/audio/fatihah/003.mp3",
  },
  {
    num: 4,
    arabic: "مَالِكِ يَوْمِ الدِّينِ",
    phonetic: "Maliki yawmid-din",
    translation: {
      en: "Master of the Day of Judgement.",
      ar: "مالك يوم الدين.",
      de: "dem Herrscher am Tage des Gerichts.",
    },
    audio: "/audio/fatihah/004.mp3",
  },
  {
    num: 5,
    arabic: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
    phonetic: "Iyyaka na'budu wa-iyyaka nasta'in",
    translation: {
      en: "It is You we worship; it is You we ask for help.",
      ar: "إياك نعبد وإياك نستعين.",
      de: "Dir allein dienen wir, und zu Dir allein flehen wir um Hilfe.",
    },
    audio: "/audio/fatihah/005.mp3",
  },
  {
    num: 6,
    arabic: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
    phonetic: "Ihdinas-siratal-mustaqim",
    translation: {
      en: "Guide us to the straight path:",
      ar: "اهدنا الصراط المستقيم.",
      de: "Führe uns den geraden Weg,",
    },
    audio: "/audio/fatihah/006.mp3",
  },
  {
    num: 7,
    arabic: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
    phonetic: "Siratal-ladhina an'amta 'alayhim ghayril-maghdubi 'alayhim walad-dallin",
    translation: {
      en: "the path of those You have blessed, those who incur no anger and who have not gone astray.",
      ar: "صراط الذين أنعمت عليهم غير المغضوب عليهم ولا الضالين.",
      de: "den Weg derer, denen Du Gnade erwiesen hast, nicht derer, die Zorn erregt haben, und nicht der Irregehenden.",
    },
    audio: "/audio/fatihah/007.mp3",
  },
];

export default function FatihahTrainer({ lang = "en" }: { lang: Locale }) {
  const [playingVerse, setPlayingVerse] = useState<number | null>(null);
  const [rate, setRate] = useState<1 | 0.8>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const labels = {
    en: {
      title: "Surah Al-Fatihah Practice Guide",
      subtitle: "Listen verse by verse, practice along at your own pace, and compare pronunciation.",
      playFull: "Listen to entire Surah",
      pauseFull: "Pause entire Surah",
      verse: "Verse",
      speed: "Speed",
      restart: "Restart",
    },
    ar: {
      title: "مدرّب سورة الفاتحة آية بآية",
      subtitle: "استمع إلى كل آية بصوت واضح، وتدرّب على النطق بالسرعة التي تناسبك.",
      playFull: "استمع للسورة كاملة",
      pauseFull: "إيقاف السورة",
      verse: "الآية",
      speed: "السرعة",
      restart: "إعادة",
    },
    de: {
      title: "Sure Al-Fatiha Übungsbegleiter",
      subtitle: "Höre Vers für Vers an, übe in deinem eigenen Tempo und vergleiche die Aussprache.",
      playFull: "Ganze Sure anhören",
      pauseFull: "Ganze Sure anhalten",
      verse: "Vers",
      speed: "Geschwindigkeit",
      restart: "Neustart",
    },
  }[lang];

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  function playAudio(src: string, verseNum: number) {
    if (playingVerse === verseNum && audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
        setPlayingVerse(null);
      }
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(src);
    audio.playbackRate = rate;
    audioRef.current = audio;
    setPlayingVerse(verseNum);

    audio.onended = () => {
      setPlayingVerse(null);
    };

    audio.play().catch(() => setPlayingVerse(null));
  }

  function toggleRate() {
    const newRate = rate === 1 ? 0.8 : 1;
    setRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  }

  return (
    <div className="fatihah-trainer-card">
      <div className="fatihah-trainer-head">
        <div className="fatihah-trainer-title-col">
          <div className="fatihah-badge-row">
            <span className="fatihah-badge">
              <BookOpen size={13} aria-hidden="true" />
              {labels.title}
            </span>
            <button
              type="button"
              className="audio-rate-btn"
              onClick={toggleRate}
              title={labels.speed}
              aria-label={`${labels.speed}: ${rate}x`}
            >
              {rate}x
            </button>
          </div>
          <p className="fatihah-trainer-sub">{labels.subtitle}</p>
        </div>

        <button
          type="button"
          onClick={() => playAudio("/audio/fatihah_full.mp3", 0)}
          className={`fatihah-full-play-btn ${playingVerse === 0 ? "is-playing" : ""}`}
        >
          {playingVerse === 0 ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
          <span>{playingVerse === 0 ? labels.pauseFull : labels.playFull}</span>
        </button>
      </div>

      <div className="fatihah-verses-list">
        {FATIHAH_VERSES.map((v) => {
          const isCurrent = playingVerse === v.num;
          return (
            <article key={v.num} className={`fatihah-verse-card ${isCurrent ? "active-verse" : ""}`}>
              <div className="fatihah-verse-header">
                <span className="fatihah-verse-num">
                  {labels.verse} {v.num}
                </span>
                <button
                  type="button"
                  onClick={() => playAudio(v.audio, v.num)}
                  className={`fatihah-verse-play-btn ${isCurrent ? "playing" : ""}`}
                  aria-label={`Play verse ${v.num}`}
                >
                  {isCurrent ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
                  <span className="fatihah-play-label">{isCurrent ? "Pause" : "Play"}</span>
                </button>
              </div>

              <div className="fatihah-verse-ar" dir="rtl" lang="ar" translate="no">
                {v.arabic}
              </div>

              <div className="fatihah-verse-phonetic">{v.phonetic}</div>

              <div className="fatihah-verse-meaning">{v.translation[lang]}</div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
