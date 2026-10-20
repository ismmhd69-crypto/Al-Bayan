"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import { Coins, Compass, Heart, Moon, ShieldCheck, Sun } from "lucide-react";

type PillarItem = {
  num: number;
  key: string;
  name: Record<Locale, string>;
  title: Record<Locale, string>;
  arabic: string;
  nature: Record<Locale, string>;
  summary: Record<Locale, string>;
  color: string;
};

const PILLARS: PillarItem[] = [
  {
    num: 1,
    key: "shahadah",
    name: { en: "Shahadah", ar: "الشهادتان", de: "Schahada" },
    title: { en: "Testimony of Faith", ar: "شهادة أن لا إله إلا الله وأن محمدًا رسول الله", de: "Glaubensbekenntnis" },
    arabic: "شَهَادَةُ أَنْ لَا إِلَٰهَ إِلَّا اللهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللهِ",
    nature: { en: "Foundation of Belief", ar: "أصل الدين وأساسه", de: "Grundlage des Glaubens" },
    summary: {
      en: "Declaring that Allah alone deserves all worship and that Muhammad is His final Messenger.",
      ar: "إفراد الله وحده بالعبادة والتصديق برسالة نبيه محمد واتباعه.",
      de: "Das Bezeugen, dass einzig Allah Anbetung gebührt und Muhammad Sein Gesandter ist.",
    },
    color: "#d97706",
  },
  {
    num: 2,
    key: "salah",
    name: { en: "Salah", ar: "إقام الصلاة", de: "Salah" },
    title: { en: "Five Daily Prayers", ar: "الصلوات الخمس المفروضة", de: "Fünf tägliche Gebete" },
    arabic: "إِقَامُ الصَّلَاةِ",
    nature: { en: "Daily Spiritual Connection", ar: "الصلة اليومية الدائمة برب العالمين", de: "Tägliche spirituelle Verbindung" },
    summary: {
      en: "The five daily obligatory prayers (Fajr, Dhuhr, Asr, Maghrib, Isha) maintaining continuous remembrance.",
      ar: "أداء الصلوات الخمس في أوقاتها بشروطها وأركانها وطمأنينتها.",
      de: "Die fünf täglichen Pflichtgebete zur stetigen Besinnung und Ausrichtung auf Gott.",
    },
    color: "#059669",
  },
  {
    num: 3,
    key: "zakah",
    name: { en: "Zakah", ar: "إيتاء الزكاة", de: "Zakah" },
    title: { en: "Obligatory Charity", ar: "حق معلوم للفقراء والمستحقين", de: "Pflichtabgabe" },
    arabic: "إِيتَاءُ الزَّكَاةِ",
    nature: { en: "Annual Social Purification", ar: "تطهير المال ونماء النفس وإعانة المحتاج", de: "Reinigung des Besitzes" },
    summary: {
      en: "A defined annual percentage (usually 2.5%) paid by eligible Muslims to support the poor and needy.",
      ar: "مقدار محدد شرعًا من المال الفائض عن النصاب يُعطى للفقراء والمستحقين.",
      de: "Eine jährliche Abgabe vom ersparten Vermögen (meist 2,5 %) zugunsten Bedürftiger.",
    },
    color: "#0284c7",
  },
  {
    num: 4,
    key: "sawm",
    name: { en: "Sawm", ar: "صوم رمضان", de: "Saum" },
    title: { en: "Fasting the Month of Ramadan", ar: "صيام شهر رمضان المبارك", de: "Fasten im Ramadan" },
    arabic: "صَوْمُ رَمَضَانَ",
    nature: { en: "Annual Spiritual Discipline", ar: "تهذيب النفس والصبر والتقوى", de: "Jährliche Selbstbeherrschung" },
    summary: {
      en: "Abstaining from food, drink, and marital relations from dawn until sunset throughout the month of Ramadan.",
      ar: "الإمساك عن المفطرات من طلوع الفجر إلى غروب الشمس بنية العبادة.",
      de: "Enthaltsamkeit von Speise, Trank und Eheleben von der Morgendämmerung bis zum Sonnenuntergang.",
    },
    color: "#7c3aed",
  },
  {
    num: 5,
    key: "hajj",
    name: { en: "Hajj", ar: "حج البيت", de: "Hadsch" },
    title: { en: "Pilgrimage to Makkah", ar: "قصد بيت الله الحرام لمن استطاع إليه سبيلًا", de: "Pilgerfahrt nach Mekka" },
    arabic: "حَجُّ الْبَيْتِ",
    nature: { en: "Once-in-a-Lifetime Journey", ar: "فريضة العمر للمستطيع ماليًا وبدنيًا", de: "Lebenslange Pflichtreise" },
    summary: {
      en: "A sacred journey to the Kaaba in Makkah performed during Dhul-Hijjah once in a lifetime for those physically and financially able.",
      ar: "رحلة عبادة إلى البيت الحرام تؤدى بمناسك مخصوصة مرة في العمر للقادر.",
      de: "Eine Pilgerreise nach Mekka zu den heiligen Stätten, einmal im Leben für jeden Fähigen verpflichtend.",
    },
    color: "#db2777",
  },
];

export default function FivePillarsVisual({ lang = "en" }: { lang: Locale }) {
  const [activeNum, setActiveNum] = useState<number>(1);
  const active = PILLARS.find((p) => p.num === activeNum) ?? PILLARS[0];

  const labels = {
    en: {
      heading: "The Five Pillars of Islam",
      subtitle: "The foundational practices upon which a Muslim's practical life is established.",
      pillar: "Pillar",
      foundation: "Foundation",
      duty: "Nature of Duty",
      summary: "Core Meaning",
    },
    ar: {
      heading: "أركان الإسلام الخمسة",
      subtitle: "الأسس العملية الكبرى التي بُني عليها دين الإسلام كما في الحديث النبوي الشريف.",
      pillar: "الركن",
      foundation: "الأساس",
      duty: "طبيعة الفريضة",
      summary: "المعنى الأساسي",
    },
    de: {
      heading: "Die fünf Säulen des Islam",
      subtitle: "Die grundlegenden praktischen Pflichten, auf denen das Leben eines Muslims ruht.",
      pillar: "Säule",
      foundation: "Fundament",
      duty: "Art der Pflicht",
      summary: "Kernbedeutung",
    },
  }[lang];

  return (
    <figure className="pillars-visual-card">
      <figcaption className="pillars-visual-head">
        <h3>{labels.heading}</h3>
        <p className="pillars-visual-sub">{labels.subtitle}</p>
      </figcaption>

      {/* Architectural Pillars Navigation Bar */}
      <div className="pillars-row-wrapper">
        <div className="pillars-row" role="tablist">
          {PILLARS.map((p) => {
            const isSelected = p.num === activeNum;
            return (
              <button
                key={p.key}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveNum(p.num)}
                className={`pillar-tab ${isSelected ? "active" : ""}`}
                style={{ "--pillar-color": p.color } as React.CSSProperties}
              >
                <span className="pillar-num-badge">{labels.pillar} {p.num}</span>
                <span className="pillar-tab-name">{p.name[lang]}</span>
                <span className="pillar-tab-ar" dir="rtl">{p.arabic.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detailed Spotlight Box for Selected Pillar */}
      <div
        className="pillar-spotlight-box"
        style={{ borderInlineStartColor: active.color }}
      >
        <div className="pillar-spotlight-top">
          <div className="pillar-spotlight-meta">
            <span
              className="pillar-spotlight-badge"
              style={{ background: active.color + "1a", color: active.color, borderColor: active.color + "4d" }}
            >
              {labels.pillar} {active.num} · {active.nature[lang]}
            </span>
            <h4 className="pillar-spotlight-title">{active.title[lang]}</h4>
          </div>
          <div className="pillar-arabic-callout" dir="rtl" lang="ar" translate="no">
            {active.arabic}
          </div>
        </div>

        <p className="pillar-spotlight-summary">{active.summary[lang]}</p>
      </div>

      {/* Overview 5-Pillar Cards */}
      <div className="pillars-overview-grid" role="list">
        {PILLARS.map((p) => {
          const isSelected = p.num === activeNum;
          return (
            <div
              key={p.key}
              role="listitem"
              onClick={() => setActiveNum(p.num)}
              className={`pillar-mini-card ${isSelected ? "selected" : ""}`}
              style={{ "--mini-color": p.color } as React.CSSProperties}
            >
              <div className="pillar-mini-head">
                <span className="pillar-mini-badge">{p.num}</span>
                <span className="pillar-mini-name">{p.name[lang]}</span>
              </div>
              <div className="pillar-mini-ar" dir="rtl">{p.arabic}</div>
              <div className="pillar-mini-nature">{p.nature[lang]}</div>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
