"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import { BookOpen, Compass, Eye, Heart, Sparkles, Sun } from "lucide-react";

type ImanPillar = {
  num: number;
  key: string;
  name: Record<Locale, string>;
  arabic: string;
  detail: Record<Locale, string>;
  color: string;
};

const IMAN_PILLARS: ImanPillar[] = [
  {
    num: 1,
    key: "allah",
    name: { en: "Belief in Allah", ar: "الإيمان بالله", de: "Der Glaube an Allah" },
    arabic: "الإِيمَانُ بِاللهِ",
    detail: {
      en: "Believing in His absolute Oneness (Tawhid), His Lordship over creation, and His unique perfect names and attributes.",
      ar: "إفراد الله بالربوبية والألوهية والأسماء والصفات، وأنه لا شريك له في ملكه ولا معبود بحق سواه.",
      de: "Der Glaube an Seine absolute Einzigkeit, Seine Schöpferkraft und Seine vollkommenen Eigenschaften.",
    },
    color: "#059669",
  },
  {
    num: 2,
    key: "angels",
    name: { en: "His Angels", ar: "الإيمان بالملائكة", de: "Seine Engel" },
    arabic: "الإِيمَانُ بِالْمَلَائِكَةِ",
    detail: {
      en: "Noble spiritual creations created from light, continuously obeying Allah and executing His commands (including Gabriel/Jibril).",
      ar: "مخلوقات نورانية مطيعة لا تعصي الله ما أمرها، منهم جبريل الموكل بالوحي.",
      de: "Wesen aus Licht, die Allahs Befehle ausführen, darunter der Engel Gabriel (Jibril).",
    },
    color: "#0284c7",
  },
  {
    num: 3,
    key: "books",
    name: { en: "His Revealed Books", ar: "الإيمان بالكتب", de: "Seine geoffenbarten Bücher" },
    arabic: "الإِيمَانُ بِالْكُتُبِ",
    detail: {
      en: "The divine revelations sent to the prophets (the Torah, Gospel, Psalms) culminating in the final, preserved Quran.",
      ar: "الكتب المنزلة على الرسل كالتوراة والإنجيل والزبور، وآخرها وخاتمها المحفوظ القرآن الكريم.",
      de: "Die göttlichen Schriften der Propheten, vollendet im geschützten Koran.",
    },
    color: "#d97706",
  },
  {
    num: 4,
    key: "messengers",
    name: { en: "His Messengers", ar: "الإيمان بالرسل", de: "Seine Gesandten" },
    arabic: "الإِيمَانُ بِالرُّسُلِ",
    detail: {
      en: "All prophets sent to guide humanity—including Noah, Abraham, Moses, Jesus, and Muhammad as the final messenger.",
      ar: "الإيمان بجميع الأنبياء والمرسلين من آدم ونوح وإبراهيم وموسى وعيسى، وخاتمهم محمد صلى الله عليه وسلم.",
      de: "Alle Propheten von Adam, Noah, Abraham, Moses, Jesus bis zum Siegel der Propheten Muhammad.",
    },
    color: "#7c3aed",
  },
  {
    num: 5,
    key: "last-day",
    name: { en: "The Last Day", ar: "الإيمان باليوم الآخر", de: "Der Jüngste Tag" },
    arabic: "الإِيمَانُ بِالْيَوْمِ الآخِرِ",
    detail: {
      en: "The Day of Resurrection, account, and divine justice where human deeds are weighed and eternal recompense begins.",
      ar: "يوم البعث والنشور والحساب والجزاء العادل، حيث يجازى المحسن بإحسانه والظالم بظلمه.",
      de: "Der Tag der Auferstehung, der Abrechnung und der göttlichen Gerechtigkeit.",
    },
    color: "#ea580c",
  },
  {
    num: 6,
    key: "decree",
    name: { en: "Divine Decree (Qadar)", ar: "الإيمان بالقدر", de: "Die göttliche Bestimmung (Qadar)" },
    arabic: "الإِيمَانُ بِالْقَدَرِ خَيْرِهِ وَشَرِّهِ",
    detail: {
      en: "Allah's eternal knowledge, writing, will, and creation of all that occurs in the universe, both its pleasant and challenging aspects.",
      ar: "علم الله الشامل وكتابته ومشيئته النافذة وخلقه لكل ما يقع في هذا الكون خيره وشره.",
      de: "Allahs allumfassendes Wissen, Sein Wille und Seine Schöpfung aller Geschehnisse.",
    },
    color: "#db2777",
  },
];

export default function SixPillarsImanVisual({ lang = "en" }: { lang: Locale }) {
  const [activeKey, setActiveKey] = useState<string>("allah");
  const active = IMAN_PILLARS.find((p) => p.key === activeKey) ?? IMAN_PILLARS[0];

  const labels = {
    en: {
      heading: "The Six Foundations of Faith (Iman)",
      subtitle: "The core articles of Islamic creed established in the authentic tradition of Hadith Jibril.",
      article: "Article",
      foundation: "Core Tenet",
    },
    ar: {
      heading: "أركان الإيمان الستة",
      subtitle: "أصول العقيدة الإسلامية الكبرى كما بينها النبي صلى الله عليه وسلم في حديث جبريل المشهور.",
      article: "الركن",
      foundation: "أصل الاعتقاد",
    },
    de: {
      heading: "Die sechs Glaubensartikel (Iman)",
      subtitle: "Die wesentlichen Fundamente des islamischen Glaubensbekenntnisses nach dem bekannten Jibril-Hadith.",
      article: "Artikel",
      foundation: "Grundsatz",
    },
  }[lang];

  return (
    <figure className="iman-visual-card">
      <figcaption className="iman-visual-head">
        <h3>{labels.heading}</h3>
        <p className="iman-visual-sub">{labels.subtitle}</p>
      </figcaption>

      {/* Grid of the 6 Articles of Faith */}
      <div className="iman-grid">
        {IMAN_PILLARS.map((p) => {
          const isSelected = p.key === activeKey;
          return (
            <div
              key={p.key}
              onClick={() => setActiveKey(p.key)}
              className={`iman-card ${isSelected ? "selected" : ""}`}
              style={{ "--iman-color": p.color } as React.CSSProperties}
            >
              <div className="iman-card-top">
                <span className="iman-badge">{labels.article} {p.num}</span>
                <span className="iman-card-name">{p.name[lang]}</span>
              </div>
              <div className="iman-card-ar" dir="rtl" lang="ar" translate="no">
                {p.arabic}
              </div>
              <p className="iman-card-detail">{p.detail[lang]}</p>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
