"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import { Moon, Sun, Sunrise, Sunset, Clock, Sparkles } from "lucide-react";

type PrayerTimeInfo = {
  key: string;
  name: Record<Locale, string>;
  units: Record<Locale, string>;
  window: Record<Locale, string>;
  sign: Record<Locale, string>;
  icon: typeof Sun;
  color: string;
  bgGradient: string;
  isPrayer: boolean;
};

const PRAYERS: PrayerTimeInfo[] = [
  {
    key: "fajr",
    name: { en: "Fajr", ar: "الفجر", de: "Fadschr" },
    units: { en: "2 Units", ar: "ركعتان", de: "2 Einheiten" },
    window: {
      en: "True dawn until sunrise",
      ar: "من طلوع الفجر الصادق إلى طلوع الشمس",
      de: "Von der Morgendämmerung bis zum Sonnenaufgang",
    },
    sign: {
      en: "Horizontal white light appearing along the eastern horizon.",
      ar: "بياض معترض يمتد في الأفق الشرقي.",
      de: "Horizontales weißes Licht am östlichen Horizont.",
    },
    icon: Sparkles,
    color: "#6366f1",
    bgGradient: "linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)",
    isPrayer: true,
  },
  {
    key: "sunrise",
    name: { en: "Sunrise", ar: "الشروق", de: "Sonnenaufgang" },
    units: { en: "End of Fajr", ar: "نهاية الفجر", de: "Ende des Fadschr" },
    window: {
      en: "Sun disk crests horizon (not a prayer)",
      ar: "ظهور حاجب الشمس (ليس وقت صلاة)",
      de: "Sonnenscheibe überschreitet Horizont (kein Gebet)",
    },
    sign: {
      en: "The upper edge of the sun rises above the horizon.",
      ar: "طلوع قرص الشمس في الأفق.",
      de: "Die Obergrenze der Sonne steigt über den Horizont.",
    },
    icon: Sunrise,
    color: "#f59e0b",
    bgGradient: "linear-gradient(135deg, #78350f 0%, #b45309 50%, #f59e0b 100%)",
    isPrayer: false,
  },
  {
    key: "dhuhr",
    name: { en: "Dhuhr", ar: "الظهر", de: "Zuhr" },
    units: { en: "4 Units", ar: "4 ركعات", de: "4 Einheiten" },
    window: {
      en: "Sun passes zenith until Asr begins",
      ar: "زوال الشمس عن كبد السماء حتى يبدأ العصر",
      de: "Vom Sonnenhöchststand bis zum Asr-Beginn",
    },
    sign: {
      en: "The sun declines westward past its highest midday meridian.",
      ar: "ميل الشمس غربًا بعد وصولها إلى أعلى نقطة في السماء.",
      de: "Die Sonne neigt sich nach Westen über ihren Höchststand.",
    },
    icon: Sun,
    color: "#eab308",
    bgGradient: "linear-gradient(135deg, #0284c7 0%, #38bdf8 60%, #bae6fd 100%)",
    isPrayer: true,
  },
  {
    key: "asr",
    name: { en: "Asr", ar: "العصر", de: "Asr" },
    units: { en: "4 Units", ar: "4 ركعات", de: "4 Einheiten" },
    window: {
      en: "Shadow = height + noon shadow until yellowing",
      ar: "مصير ظل الشيء مثله بعد الزوال حتى اصفرار الشمس",
      de: "Schattenlänge = Objekthöhe bis zur Gelbfärbung",
    },
    sign: {
      en: "An object's shadow extends beyond noon length by its own height.",
      ar: "زيادة ظل الشيء بمقدار طوله عن ظله عند الزوال.",
      de: "Der Schatten eines Objekts wächst um seine eigene Länge über den Mittagsrest hinaus.",
    },
    icon: Sun,
    color: "#f97316",
    bgGradient: "linear-gradient(135deg, #ea580c 0%, #fb923c 60%, #fef08a 100%)",
    isPrayer: true,
  },
  {
    key: "maghrib",
    name: { en: "Maghrib", ar: "المغرب", de: "Maghrib" },
    units: { en: "3 Units", ar: "3 ركعات", de: "3 Einheiten" },
    window: {
      en: "Sunset until red twilight disappears",
      ar: "غروب كامل قرص الشمس حتى مغيب الشفق الأحمر",
      de: "Vom Sonnenuntergang bis zum Ende des Abendrots",
    },
    sign: {
      en: "Full disappearance of the sun disk below the western horizon.",
      ar: "سقوط قرص الشمس كاملًا وتواري ضوئها في الأفق الغربي.",
      de: "Vollständiges Verschwinden der Sonnenscheibe am Westhorizont.",
    },
    icon: Sunset,
    color: "#ec4899",
    bgGradient: "linear-gradient(135deg, #831843 0%, #be185d 50%, #f472b6 100%)",
    isPrayer: true,
  },
  {
    key: "isha",
    name: { en: "Isha", ar: "العشاء", de: "Ischa" },
    units: { en: "4 Units", ar: "4 ركعات", de: "4 Einheiten" },
    window: {
      en: "Twilight fade until the middle of the night",
      ar: "مغيب الشفق الأحمر حتى منتصف الليل",
      de: "Vom Ende des Abendrots bis zur Mitternacht",
    },
    sign: {
      en: "Complete disappearance of redness from the sky; night sets in.",
      ar: "غياب الحمرة تمامًا من السماء ودخول ظلمة الليل.",
      de: "Vollständiges Verblassen des Abendrots; Einbruch der Nacht.",
    },
    icon: Moon,
    color: "#818cf8",
    bgGradient: "linear-gradient(135deg, #090d16 0%, #0f172a 60%, #1e1b4b 100%)",
    isPrayer: true,
  },
];

export default function PrayerTimesVisual({ lang = "en" }: { lang: Locale }) {
  const [selectedKey, setSelectedKey] = useState<string>("dhuhr");
  const selected = PRAYERS.find((p) => p.key === selectedKey) ?? PRAYERS[2];

  const labels = {
    en: {
      heading: "The 24-Hour Prayer Cycle & Celestial Signs",
      subtitle: "Each prayer is defined by observable signs in the sky rather than fixed clock hours.",
      units: "Obligatory Units",
      window: "Daily Planning Window",
      sign: "Astronomical Sign",
      timeline: "Day & Night Sky Continuum",
    },
    ar: {
      heading: "دورة الصلوات الخمس وعلاماتها الكونية",
      subtitle: "ترتبط مواقيت الصلوات بعلامات مشاهدة في حركة الشمس والسماء.",
      units: "عدد الركعات المفروضة",
      window: "وقت الصلاة للتخطيط اليومي",
      sign: "العلامة الكونية المشاهدة",
      timeline: "تتابع مسار السماء ليلًا ونهارًا",
    },
    de: {
      heading: "Der 24-Stunden-Gebetszyklus & Himmelszeichen",
      subtitle: "Jedes Gebet ist durch sichtbare Zeichen am Himmel bestimmt.",
      units: "Verpflichtende Einheiten",
      window: "Zeitfenster für die Tagesplanung",
      sign: "Astronomisches Zeichen",
      timeline: "Himmelsverlauf bei Tag und Nacht",
    },
  }[lang];

  return (
    <figure className="prayer-times-visual-card">
      <figcaption className="prayer-times-head">
        <h3>{labels.heading}</h3>
        <p className="prayer-times-sub">{labels.subtitle}</p>
      </figcaption>

      {/* Sky Arc Gradient Continuum */}
      <div className="sky-continuum-wrapper">
        <div className="sky-continuum-bar">
          {PRAYERS.map((item) => {
            const isSelected = item.key === selectedKey;
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setSelectedKey(item.key)}
                className={`sky-node ${isSelected ? "selected" : ""} ${!item.isPrayer ? "marker-node" : ""}`}
                style={{ background: item.bgGradient }}
                title={`${item.name[lang]} (${item.units[lang]})`}
                aria-pressed={isSelected}
              >
                <Icon size={14} className="sky-node-icon" aria-hidden="true" />
                <span className="sky-node-label">{item.name[lang]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detailed Selected Card Spotlight */}
      <div
        className="prayer-spotlight-box"
        style={{ borderInlineStartColor: selected.color }}
      >
        <div className="spotlight-header">
          <div className="spotlight-title-group">
            <span
              className="spotlight-badge"
              style={{ background: selected.color + "22", color: selected.color, borderColor: selected.color + "55" }}
            >
              {selected.units[lang]}
            </span>
            <h4 className="spotlight-name">{selected.name[lang]}</h4>
          </div>
          <div className="spotlight-icon-circle" style={{ background: selected.color + "22", color: selected.color }}>
            <selected.icon size={20} aria-hidden="true" />
          </div>
        </div>

        <div className="spotlight-details-grid">
          <div className="spotlight-item">
            <span className="spotlight-item-label">
              <Clock size={13} aria-hidden="true" />
              {labels.window}
            </span>
            <p className="spotlight-item-value">{selected.window[lang]}</p>
          </div>
          <div className="spotlight-item">
            <span className="spotlight-item-label">
              <Sun size={13} aria-hidden="true" />
              {labels.sign}
            </span>
            <p className="spotlight-item-value">{selected.sign[lang]}</p>
          </div>
        </div>
      </div>

      {/* Complete Overview Grid */}
      <div className="prayer-times-overview-grid" role="list">
        {PRAYERS.map((item) => {
          const isSelected = item.key === selectedKey;
          const Icon = item.icon;
          return (
            <div
              key={item.key}
              role="listitem"
              onClick={() => setSelectedKey(item.key)}
              className={`prayer-mini-card ${isSelected ? "active" : ""}`}
            >
              <div className="prayer-mini-top">
                <span className="prayer-mini-name">{item.name[lang]}</span>
                <Icon size={14} style={{ color: item.color }} aria-hidden="true" />
              </div>
              <div className="prayer-mini-units">{item.units[lang]}</div>
              <div className="prayer-mini-window">{item.window[lang]}</div>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
