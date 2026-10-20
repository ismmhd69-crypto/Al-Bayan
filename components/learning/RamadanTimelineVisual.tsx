"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import { Clock, Moon, Sparkles, Sun, Utensils } from "lucide-react";
import AudioPlayButton from "./AudioPlayButton";

type RamadanStep = {
  key: string;
  time: Record<Locale, string>;
  title: Record<Locale, string>;
  arabic: string;
  detail: Record<Locale, string>;
  dua?: {
    arabic: string;
    phonetic: string;
    meaning: Record<Locale, string>;
  };
};

const RAMADAN_STEPS: RamadanStep[] = [
  {
    key: "suhur",
    time: { en: "Before Dawn", ar: "قبل طلوع الفجر", de: "Vor der Morgendämmerung" },
    title: { en: "The Suhur Meal", ar: "وجبة السحور المباركة", de: "Das Sahur-Frühstück" },
    arabic: "السُّحُورُ",
    detail: {
      en: "Eating a wholesome pre-dawn meal and drinking water to gain physical strength and barakah for the day ahead.",
      ar: "تناول طعام خفيف وشرب الماء قبل أذان الفجر امتثالًا للبركة النبوية وتقوية للبدن.",
      de: "Eine leichte Mahlzeit vor dem Morgengrauen zur Stärkung für den bevorstehenden Fastentag.",
    },
  },
  {
    key: "fast-begins",
    time: { en: "True Dawn (Fajr)", ar: "مع أذان الفجر", de: "Morgendämmerung (Fadschr)" },
    title: { en: "Fast Begins", ar: "الإمساك وبداية الصيام", de: "Beginn des Fastens" },
    arabic: "بَدْءُ الإِمْسَاكِ",
    detail: {
      en: "The fast officially commences at true dawn. Complete abstinence from all food, drink, and marital relations begins.",
      ar: "دخول وقت الصيام الصادق؛ الإمساك الكامل عن جميع المفطرات بنية التقرب إلى الله.",
      de: "Vollständige Enthaltsamkeit von Speisen, Getränken und Intimität ab der Morgendämmerung.",
    },
  },
  {
    key: "daytime",
    time: { en: "Daytime Hours", ar: "ساعات النهار", de: "Die Tagesstunden" },
    title: { en: "Mindfulness & Good Character", ar: "حفظ الجوارح وحسن الخلق", de: "Achtsamkeit & guter Charakter" },
    arabic: "حِفْظُ الصِّيَامِ وَالصَّبْرُ",
    detail: {
      en: "Fasting goes beyond abstaining from food: Muslims guard the tongue from backbiting, avoid anger, and fulfill daily obligations.",
      ar: "صوم الجوارح عن اللغو والغيبة والغضب، وحسن التعامل وأداء الواجبات اليومية بأمانة.",
      de: "Bewahrung von Zunge und Gemüt vor Unfug, Streit und Zorn; treue Pflichterfüllung.",
    },
  },
  {
    key: "iftar",
    time: { en: "Sunset (Maghrib)", ar: "مع غروب الشمس (المغرب)", de: "Sonnenuntergang (Maghrib)" },
    title: { en: "Iftar: Breaking the Fast", ar: "الإفطار والدعاء المستجاب", de: "Iftar: Das Fastenbrechen" },
    arabic: "الإِفْطَارُ عِنْدَ الْغُرُوبِ",
    detail: {
      en: "Breaking the fast promptly upon sunset, traditionally with fresh dates and water, accompanied by supplication.",
      ar: "تعجيل الفطر فور تحقق الغروب على رطب أو تمر وماء، والتوجه إلى الله بالدعاء.",
      de: "Das unverzügliche Brechen des Fastens bei Sonnenuntergang, traditionell mit Datteln und Wasser.",
    },
    dua: {
      arabic: "ذَهَبَ الظَّمَأُ ، وَابْتَلَّتِ الْعُرُوقُ ، وَثَبَتَ الأَجْرُ إِنْ شَاءَ اللهُ",
      phonetic: "Dhahaba adh-dhama'u, wabtallatil-'uruqu, wa thabatal-ajru in sha' Allah",
      meaning: {
        en: '"The thirst has gone, the veins are moistened, and the reward is confirmed, if Allah wills."',
        ar: "«ذهب الظمأ وابتلت العروق وثبت الأجر إن شاء الله»",
        de: '"Der Durst ist vergangen, die Adern sind befeuchtet und der Lohn ist sicher, so Allah will."',
      },
    },
  },
  {
    key: "night",
    time: { en: "Night Hours", ar: "الليل والقيام", de: "Die Nachtstunden" },
    title: { en: "Taraweeh & Quran Reflection", ar: "صلاة التراويح ومدارسة القرآن", de: "Tarawih & Koranrezitation" },
    arabic: "قِيَامُ اللَّيْلِ وَالتَّرَاوِيحُ",
    detail: {
      en: "Evenings are filled with family, community, the voluntary Taraweeh prayers at the mosque, and generous reading of the Quran.",
      ar: "أداء صلاة التراويح جماعة، وتلاوة كتاب الله وتدبره، والاجتماع على الخير والصدقة.",
      de: "Gemeinschaftliches Tarawih-Gebet in der Moschee, Vertiefung in den Koran und Wohltätigkeit.",
    },
  },
];

export default function RamadanTimelineVisual({ lang = "en" }: { lang: Locale }) {
  const [activeKey, setActiveKey] = useState<string>("iftar");
  const active = RAMADAN_STEPS.find((s) => s.key === activeKey) ?? RAMADAN_STEPS[3];

  const labels = {
    en: {
      heading: "The 24-Hour Fasting Day Cycle in Ramadan",
      subtitle: "From the pre-dawn Suhur to the evening Iftar and night prayers.",
      duaTitle: "Prophetic Supplication at Iftar",
    },
    ar: {
      heading: "دورة يوم الصيام في رمضان على مدار 24 ساعة",
      subtitle: "من وجبة السحور قبل الفجر وحتى بهجة الإفطار وصلاة التراويح ليلًا.",
      duaTitle: "دعاء النبي صلى الله عليه وسلم عند الإفطار",
    },
    de: {
      heading: "Der 24-Stunden-Zyklus eines Fastentages im Ramadan",
      subtitle: "Vom Sahur vor der Morgendämmerung bis zum Iftar und den Nachtgebeten.",
      duaTitle: "Prophetisches Bittgebet beim Fastenbrechen",
    },
  }[lang];

  return (
    <figure className="ramadan-visual-card">
      <figcaption className="ramadan-visual-head">
        <h3>{labels.heading}</h3>
        <p className="ramadan-visual-sub">{labels.subtitle}</p>
      </figcaption>

      {/* Horizontal Step Timeline */}
      <div className="ramadan-timeline-row">
        {RAMADAN_STEPS.map((s, idx) => {
          const isSelected = s.key === activeKey;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setActiveKey(s.key)}
              className={`ramadan-step-btn ${isSelected ? "active" : ""}`}
            >
              <span className="ramadan-step-num">{idx + 1}</span>
              <span className="ramadan-step-time">{s.time[lang]}</span>
              <span className="ramadan-step-name">{s.title[lang]}</span>
            </button>
          );
        })}
      </div>

      {/* Spotlight Card */}
      <div className="ramadan-spotlight-card">
        <div className="ramadan-spotlight-header">
          <div>
            <span className="ramadan-time-badge">{active.time[lang]}</span>
            <h4 className="ramadan-spotlight-title">{active.title[lang]}</h4>
          </div>
          <span className="ramadan-arabic-tag" dir="rtl">{active.arabic}</span>
        </div>
        <p className="ramadan-spotlight-detail">{active.detail[lang]}</p>

        {active.dua && (
          <div className="ramadan-dua-box">
            <span className="ramadan-dua-label">{labels.duaTitle}</span>
            <div className="ramadan-dua-ar" dir="rtl">{active.dua.arabic}</div>
            <div className="ramadan-dua-phonetic">{active.dua.phonetic}</div>
            <div className="ramadan-dua-meaning">{active.dua.meaning[lang]}</div>
          </div>
        )}
      </div>
    </figure>
  );
}
