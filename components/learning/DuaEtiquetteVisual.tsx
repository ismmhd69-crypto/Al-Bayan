"use client";

import type { Locale } from "@/lib/i18n";
import { Compass, Hand, Heart, Sparkles } from "lucide-react";

type EtiquetteItem = {
  num: number;
  title: Record<Locale, string>;
  arabic: string;
  summary: Record<Locale, string>;
  icon: typeof Compass;
  color: string;
};

const DUA_ETIQUETTES: EtiquetteItem[] = [
  {
    num: 1,
    title: { en: "Facing the Qiblah", ar: "استقبال القبلة", de: "Zur Qiblah wenden" },
    arabic: "اسْتِقْبَالُ الْقِبْلَةِ",
    summary: {
      en: "Turning physically and spiritually toward the Kaaba in Makkah when sitting or preparing to supplicate.",
      ar: "التوجه نحو الكعبة المشرفة أدبًا وتعظيمًا عند التفرغ للدعاء ومناجاة الله.",
      de: "Sich körperlich und geistig zur Kaaba nach Mekka wenden, wenn man das Bittgebet verrichtet.",
    },
    icon: Compass,
    color: "#059669",
  },
  {
    num: 2,
    title: { en: "Raising the Hands", ar: "رفع اليدين تضرعًا", de: "Hände erheben" },
    arabic: "رَفْعُ الْيَدَيْنِ حَذْوَ الصَّدْرِ",
    summary: {
      en: "Raising both hands to chest height with open palms facing upward, embodying the posture of a humble petitioner.",
      ar: "بسط الكفين حذو الصدر وبطونهما إلى السماء مظهرًا للفقر والحاجة إلى رحمة الله وفضله.",
      de: "Beide Hände mit offenen Handflächen nach oben erheben als Haltung demütiger Bitte.",
    },
    icon: Hand,
    color: "#0284c7",
  },
  {
    num: 3,
    title: { en: "Praise & Blessings", ar: "الحمد والثناء والصلاة على النبي", de: "Lobpreis & Friedensgrüße" },
    arabic: "الْبَدْءُ بِحَمْدِ اللهِ وَالصَّلَاةِ عَلَى رَسُولِهِ",
    summary: {
      en: "Beginning the supplication with praising Allah for His grace, followed by invoking blessings on Prophet Muhammad.",
      ar: "استفتاح الدعاء بتمجيد الله والثناء عليه بما هو أهله، ثم الصلاة والتسليم على رسوله الكريم.",
      de: "Das Bittgebet mit dem Lobpreis Allahs und Segenswünschen für den Propheten Muhammad beginnen.",
    },
    icon: Sparkles,
    color: "#d97706",
  },
  {
    num: 4,
    title: { en: "Certainty & Humility", ar: "اليقين وحضور القلب والإلحاح", de: "Gewissheit & Demut" },
    arabic: "الْيَقِينُ بِالإِجَابَةِ وَحُضُورُ الْقَلْبِ",
    summary: {
      en: "Asking with firm certainty that Allah hears, without haste or hopelessness, with a focused and present heart.",
      ar: "الدعاء بعزم ويقين وثقة بوعد الله بالإجابة، دون استعجال أو فتور، مع إخلاص القلب.",
      de: "Mit festem Vertrauen auf Allahs Erhörung und aufrichtiger Konzentration des Herzens bitten.",
    },
    icon: Heart,
    color: "#7c3aed",
  },
];

export default function DuaEtiquetteVisual({ lang = "en" }: { lang: Locale }) {
  const labels = {
    en: {
      heading: "Prophetic Etiquette of Supplication (Dua)",
      subtitle: "Recommended manners taught in the authentic tradition to accompany heartfelt calling upon Allah.",
      step: "Manner",
    },
    ar: {
      heading: "آداب الدعاء في الهدي النبوي الشريف",
      subtitle: "مستحبات جليلة ينبغي للداعي استصحابها عند مناجاة ربه وسؤاله.",
      step: "الأدب",
    },
    de: {
      heading: "Prophetische Umgangsformen des Bittgebets (Dua)",
      subtitle: "Empfohlene Verhaltensweisen aus der authentischen Überlieferung beim Anrufen Gottes.",
      step: "Etikette",
    },
  }[lang];

  return (
    <figure className="dua-etiquette-card">
      <figcaption className="dua-etiquette-head">
        <h3>{labels.heading}</h3>
        <p className="dua-etiquette-sub">{labels.subtitle}</p>
      </figcaption>

      <div className="dua-etiquette-grid">
        {DUA_ETIQUETTES.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.num}
              className="dua-etiquette-item"
              style={{ "--eti-color": item.color } as React.CSSProperties}
            >
              <div className="dua-eti-top">
                <span className="dua-eti-badge">{labels.step} {item.num}</span>
                <Icon size={16} style={{ color: item.color }} aria-hidden="true" />
              </div>
              <h4 className="dua-eti-title">{item.title[lang]}</h4>
              <div className="dua-eti-ar" dir="rtl" lang="ar" translate="no">
                {item.arabic}
              </div>
              <p className="dua-eti-summary">{item.summary[lang]}</p>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
