"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import { Compass, Flag, MapPin, Sparkles, Volume2 } from "lucide-react";
import AudioPlayButton from "./AudioPlayButton";

type HajjStation = {
  num: number;
  key: string;
  name: Record<Locale, string>;
  location: Record<Locale, string>;
  timing: Record<Locale, string>;
  detail: Record<Locale, string>;
};

const HAJJ_STATIONS: HajjStation[] = [
  {
    num: 1,
    key: "ihram",
    name: { en: "Miqat & Ihram", ar: "الميقات والإحرام", de: "Mīqāt & Ihrām" },
    location: { en: "Designated boundary stations", ar: "المواقيت المكانية المحددة", de: "Festgelegte Weihegrenzen" },
    timing: { en: "Before entering sacred boundary", ar: "قبل دخول حدود الحرم", de: "Vor Betreten des Heiligen Bezirks" },
    detail: {
      en: "Entering the sacred state with pure intention, wearing two unstitched white garments (for men) and modest ordinary clothing (for women), beginning the Talbiyah.",
      ar: "عقد نية النسك والتجرد في ثياب الإحرام البيضاء غير المخيطة للرجال، وبدء التلبية العظيمة.",
      de: "Eintritt in den Weihezustand in schlichter weißer Kleidung unter Anrufung der Talbiyah.",
    },
  },
  {
    num: 2,
    key: "makkah",
    name: { en: "The Kaaba & Sa'i", ar: "الطواف بالبيت والسعي", de: "Tawāf & Sa'y an der Kaaba" },
    location: { en: "Al-Masjid al-Haram, Makkah", ar: "المسجد الحرام بمكة المكرمة", de: "Al-Masdschid al-Harām, Mekka" },
    timing: { en: "Upon arrival in Makkah", ar: "عند الوصول إلى مكة", de: "Bei der Ankunft in Mekka" },
    detail: {
      en: "Circling the Kaaba counter-clockwise seven times (Tawaf), followed by walking seven times between the hills of Safa and Marwa (Sa'i).",
      ar: "الطواف حول الكعبة المشرفة سبعة أشواط، ثم السعي بين الصفا والمروة تأسّيًا بأم إسماعيل هاجر.",
      de: "Siebenfache Umrundung der Kaaba und der Gang zwischen den Hügeln Safa und Marwa.",
    },
  },
  {
    num: 3,
    key: "mina",
    name: { en: "Mina: The Tent City", ar: "المبيت بمنى (يوم التروية)", de: "Mina: Zeltstadt" },
    location: { en: "Valley of Mina", ar: "وادي منى المبارك", de: "Tal von Mina" },
    timing: { en: "8th of Dhul-Hijjah", ar: "اليوم الثامن من ذي الحجة", de: "8. Tag von Dhū l-Hiddscha" },
    detail: {
      en: "Pilgrims stay in Mina in white tents, praying Dhuhr, Asr, Maghrib, Isha, and Fajr, spiritually preparing for Arafat.",
      ar: "المبيت بمنى وأداء الصلوات قصرًا من غير جمع، استعدادًا للوقوف العظيم بعرفة.",
      de: "Aufenthalt in Mina mit Gebet und innerer Vorbereitung auf den Tag von Arafat.",
    },
  },
  {
    num: 4,
    key: "arafat",
    name: { en: "The Plain of Arafat", ar: "الوقوف بعرفة (ركن الحج الأعظم)", de: "Die Ebene von Arafat" },
    location: { en: "Plains of Mount Arafat", ar: "صعيد عرفات الطاهر", de: "Die Ebene von Arafat" },
    timing: { en: "9th of Dhul-Hijjah (Zenith to Sunset)", ar: "اليوم التاسع من زوال الشمس إلى الغروب", de: "9. Tag von Mittag bis Sonnenuntergang" },
    detail: {
      en: 'The essential core of Hajj: "Hajj is Arafat." Millions stand together in solemn supplication, repentance, and seeking Allah\'s boundless mercy.',
      ar: "الركن الأعظم لقوله ﷺ: «الحج عرفة»، تضرع ودعاء وتوبة واستغفار في أرجى أيام السنة.",
      de: "Der Höhepunkt der Pilgerfahrt: inständiges Bitten um Vergebung und Barmherzigkeit vor Gott.",
    },
  },
  {
    num: 5,
    key: "muzdalifah",
    name: { en: "Muzdalifah Night", ar: "المبيت بمزدلفة", de: "Muzdalifa" },
    location: { en: "Between Arafat and Mina", ar: "بين عرفة ومنى", de: "Zwischen Arafat und Mina" },
    timing: { en: "Night of the 10th of Dhul-Hijjah", ar: "ليلة عيد الأضحى المبارك", de: "Nacht zum Opferfest" },
    detail: {
      en: "Pilgrims gather under the open sky, praying Maghrib and Isha together, collecting small pebbles for the Jamarat, and resting.",
      ar: "جمع صلاتي المغرب والعشاء، وجمع الجمرات، والمبيت تحت أديم السماء في سكينة.",
      de: "Nächtliche Rast unter freiem Himmel und Sammeln von Kieselsteinen für die Säulen.",
    },
  },
  {
    num: 6,
    key: "jamarat-eid",
    name: { en: "Jamarat & Eid al-Adha", ar: "رمي الجمرات وطواف الإفاضة", de: "Jamarat & Opferfest" },
    location: { en: "Mina & the Kaaba", ar: "منى والحرم المكي", de: "Mina & die Kaaba" },
    timing: { en: "10th to 12th/13th of Dhul-Hijjah", ar: "يوم النحر وأيام التشريق", de: "10. bis 12./13. Tag" },
    detail: {
      en: "Symbolic stoning of the pillars (rejecting evil), offering the sacrifice, trimming/shaving hair, and performing Tawaf al-Ifadah.",
      ar: "رمي جمرة العقبة، ونحر الهدي، وحلق الرأس أو تقصيره، وأداء طواف الإفاضة والتحلل.",
      de: "Steinigung der Säulen zur Abweisung des Bösen, Opfergabe und Tawāf al-Ifāda.",
    },
  },
];

export default function HajjJourneyVisual({ lang = "en" }: { lang: Locale }) {
  const [activeStationNum, setActiveStationNum] = useState<number>(4);
  const active = HAJJ_STATIONS.find((s) => s.num === activeStationNum) ?? HAJJ_STATIONS[3];

  const labels = {
    en: {
      heading: "The Stations of Hajj: Journey of a Lifetime",
      subtitle: "The six primary spiritual waypoints of the pilgrimage.",
      talbiyahTitle: "The Pilgrim's Chant: The Talbiyah",
      step: "Station",
      timing: "Timing",
      location: "Location",
    },
    ar: {
      heading: "محطات رحلة الحج المباركة",
      subtitle: "المعالم الروحية والمكانية الستة الكبرى لأداء فريضة العمر.",
      talbiyahTitle: "نشيد الحجاج الخالد: التلبية",
      step: "المحطة",
      timing: "الميقات الزماني",
      location: "المكان",
    },
    de: {
      heading: "Die Stationen der Pilgerfahrt (Hadsch)",
      subtitle: "Die sechs wichtigsten Wegmarken auf der geistlichen Reise des Lebens.",
      talbiyahTitle: "Der Ruf der Pilger: Die Talbiyah",
      step: "Station",
      timing: "Zeitpunkt",
      location: "Ort",
    },
  }[lang];

  return (
    <figure className="hajj-visual-card">
      <figcaption className="hajj-visual-head">
        <h3>{labels.heading}</h3>
        <p className="hajj-visual-sub">{labels.subtitle}</p>
      </figcaption>

      {/* Talbiyah Audio Box */}
      <div className="hajj-talbiyah-card">
        <div className="hajj-talbiyah-title">
          <Sparkles size={16} aria-hidden="true" />
          <span>{labels.talbiyahTitle}</span>
        </div>
        <div className="hajj-talbiyah-ar" dir="rtl" lang="ar" translate="no">
          لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ ، لَا شَرِيكَ لَكَ
        </div>
        <div className="hajj-talbiyah-phonetic">
          Labbayk Allahumma labbayk, labbayka la sharika laka labbayk, innal-hamda wan-ni&apos;mata laka wal-mulk, la sharika lak.
        </div>
        <AudioPlayButton
          src="/audio/talbiyah.mp3"
          lang={lang}
          label={lang === "ar" ? "استمع إلى التلبية بصوت مؤذني الحرمين" : lang === "de" ? "Die Talbiyah anhören" : "Listen to the Talbiyah chant"}
        />
      </div>

      {/* Stations Step Flow */}
      <div className="hajj-stations-row">
        {HAJJ_STATIONS.map((st) => {
          const isSelected = st.num === activeStationNum;
          return (
            <button
              key={st.key}
              type="button"
              onClick={() => setActiveStationNum(st.num)}
              className={`hajj-station-tab ${isSelected ? "active" : ""}`}
            >
              <span className="hajj-num-badge">{st.num}</span>
              <span className="hajj-tab-name">{st.name[lang]}</span>
            </button>
          );
        })}
      </div>

      {/* Selected Station Spotlight */}
      <div className="hajj-spotlight-box">
        <div className="hajj-spotlight-header">
          <span className="hajj-badge">{labels.step} {active.num}</span>
          <h4 className="hajj-spotlight-title">{active.name[lang]}</h4>
        </div>
        <div className="hajj-meta-row">
          <span className="hajj-meta-item">
            <MapPin size={13} aria-hidden="true" />
            <strong>{labels.location}:</strong> {active.location[lang]}
          </span>
          <span className="hajj-meta-item">
            <Compass size={13} aria-hidden="true" />
            <strong>{labels.timing}:</strong> {active.timing[lang]}
          </span>
        </div>
        <p className="hajj-spotlight-detail">{active.detail[lang]}</p>
      </div>
    </figure>
  );
}
