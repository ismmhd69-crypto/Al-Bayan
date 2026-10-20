"use client";

import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import type { LearningReference } from "@/lib/learning/course";
import AudioPlayButton from "./AudioPlayButton";
import PrayerTimesVisual from "./PrayerTimesVisual";
import FatihahTrainer from "./FatihahTrainer";
import FivePillarsVisual from "./FivePillarsVisual";
import SixPillarsImanVisual from "./SixPillarsImanVisual";
import RamadanTimelineVisual from "./RamadanTimelineVisual";
import HajjJourneyVisual from "./HajjJourneyVisual";
import DuaEtiquetteVisual from "./DuaEtiquetteVisual";

export function LearningInline({ text, lang, references, lessonIds, onPrayer }: { text: string; lang: Locale; references: Record<string, LearningReference>; lessonIds: string[]; onPrayer?: (key: string) => void }) {
  const pattern = /(\[[^\]]+\]\[[^\]]+\]|\[[^\]]+\]\(#[^)]+\)|\*\*[^*]+\*\*)/g;
  const parts = text.split(pattern);
  function goTo(event: React.MouseEvent<HTMLAnchorElement>, id: string) {
    const target = document.getElementById(`learning-source-${id}`);
    if (!target) return;
    event.preventDefault();
    if (target instanceof HTMLDetailsElement) target.open = true;
    target.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
    target.focus({ preventScroll: true });
  }
  return <>{parts.map((part, i) => {
    const source = part.match(/^\[([^\]]+)\]\[([^\]]+)\]$/);
    if (source) {
      const ref = references[source[2]];
      if (!ref) return <Fragment key={i}>{source[1]}</Fragment>;
      const label = /^\d/.test(source[1]) && ref.kind === "quran" ? `${lang === "ar" ? "القرآن" : "Quran"} ${source[1]}` : source[1];
      return <a key={i} className={`ref learning-ref learning-ref--${ref.kind}`} href={`#learning-source-${ref.id}`} onClick={(event) => goTo(event, ref.id)}><bdi>{label}</bdi></a>;
    }
    const local = part.match(/^\[([^\]]+)\]\(#([^\)]+)\)$/);
    if (local) {
      const n = local[2].match(/^lesson-(\d+)/);
      if (n && lessonIds[Number(n[1]) - 1]) return <Link key={i} className="text-link" href={`/${lang}/start/${lessonIds[Number(n[1]) - 1]}`} prefetch={false}>{local[1]}</Link>;
      const prayer = local[2].match(/^prayer-(fajr|dhuhr|asr|maghrib|isha)/);
      if (prayer && onPrayer) return <button key={i} type="button" className="learning-inline-button text-link" onClick={() => onPrayer(prayer[1])}>{local[1]}</button>;
      return <Fragment key={i}>{local[1]}</Fragment>;
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      const value = part.slice(2, -2);
      if (/[\u0600-\u06ff]/.test(value) && !/[A-Za-z]/.test(value)) return <strong key={i} lang="ar" dir="rtl" translate="no">{value}</strong>;
      return <strong key={i}>{value}</strong>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  })}</>;
}

type StepRecitation = {
  ar: string;
  phonetic: string;
  meaning: Record<Locale, string>;
};

const PRAYER_STEP_DATA: Record<number, { photo: string; secondaryPhoto?: string; tag: Record<Locale, string>; badge: Record<Locale, string>; recitation?: StepRecitation }> = {
  1: {
    photo: "/assets/prayer/salat_positions_chart.jpg",
    tag: { en: "Preparation & Qiblah", ar: "الاستعداد والقبلة", de: "Vorbereitung & Gebetsrichtung" },
    badge: { en: "Step 1 of 10", ar: "الخطوة 1 من 10", de: "Schritt 1 von 10" },
    recitation: {
      ar: "النِّيَّةُ فِي الْقَلْبِ • اسْتِقْبَالُ الْقِبْلَةِ",
      phonetic: "An-Niyyah fil-qalb • Istiqbal al-Qiblah",
      meaning: {
        en: "Intend the prayer in your heart and face the Qiblah (no verbal statement is prescribed).",
        ar: "انوِ الصلاة بقلبك واستقبل القبلة (ولا يُشرع التلفظ بالنية).",
        de: "Beabsichtige das Gebet im Herzen und wende dich zur Qibla (kein lautes Aussprechen).",
      },
    },
  },
  2: {
    photo: "/assets/prayer/step1_takbir.jpg",
    tag: { en: "Hands to Shoulders / Ears", ar: "رفع اليدين إلى المنكبين أو الأذنين", de: "Hände bis Schulter- / Ohrenhöhe" },
    badge: { en: "Step 2 of 10", ar: "الخطوة 2 من 10", de: "Schritt 2 von 10" },
    recitation: {
      ar: "اللهُ أَكْبَرُ",
      phonetic: "Allahu Akbar",
      meaning: {
        en: "Allah is Greatest (Opening Takbir to enter the prayer).",
        ar: "«الله أكبر» (تكبيرة الإحرام للدخول في الصلاة).",
        de: "„Allahu Akbar“ (Allah ist am größten — Eröffnungs-Takbir).",
      },
    },
  },
  3: {
    photo: "/assets/prayer/step2_qiyam.jpg",
    tag: { en: "Right Hand Over Left on Chest", ar: "وضع اليد اليمنى على اليسرى على الصدر", de: "Rechte Hand über die linke auf der Brust" },
    badge: { en: "Step 3 of 10", ar: "الخطوة 3 من 10", de: "Schritt 3 von 10" },
    recitation: {
      ar: "أَعُوذُ بِاللهِ مِنَ الشَّيْطَانِ الرَّجِيمِ • بِسْمِ اللهِ الرَّحْمَٰنِ الرَّحِيمِ • سُورَةُ الْفَاتِحَةِ",
      phonetic: "A'udhu billahi min ash-shaytan ir-rajim • Bismillahir-Rahmanir-Rahim • Surah al-Fatihah",
      meaning: {
        en: "Seek refuge, say Basmalah, and recite Surah al-Fatihah (+ an additional Surah in units 1 & 2).",
        ar: "الاستعاذة والبسملة وقراءة الفاتحة (+ سورة أخرى في الركعتين الأولى والثانية).",
        de: "Zuflucht suchen, Basmalah und Rezitation der Sure al-Fatihah (+ weitere Sure in Einheit 1 & 2).",
      },
    },
  },
  4: {
    photo: "/assets/prayer/step3_ruku.jpg",
    tag: { en: "Back Straight · Hands on Knees", ar: "استواء الظهر · اليدان على الركبتين", de: "Rücken gerade · Hände auf den Knien" },
    badge: { en: "Step 4 of 10", ar: "الخطوة 4 من 10", de: "Schritt 4 von 10" },
    recitation: {
      ar: "سُبْحَانَ رَبِّيَ الْعَظِيمِ (3 مَرَّاتٍ)",
      phonetic: "Subhana Rabbiyal-'Azim (said 3 times)",
      meaning: {
        en: "Glory be to my Lord, the Magnificent (said 3 times with calmness while bowing).",
        ar: "«سبحان ربي العظيم» (تُقال 3 مرات بطمأنينة أثناء الركوع).",
        de: "„Subhana Rabbiyal-'Azim“ (Gepriesen sei mein Herr, der Gewaltige — 3-mal gesprochen).",
      },
    },
  },
  5: {
    photo: "/assets/prayer/step4_itidal.jpg",
    tag: { en: "Upright & Settled (Pausing)", ar: "الاعتدال والطمأنينة", de: "Aufrecht & ruhig stehen" },
    badge: { en: "Step 5 of 10", ar: "الخطوة 5 من 10", de: "Schritt 5 von 10" },
    recitation: {
      ar: "سَمِعَ اللهُ لِمَنْ حَمِدَهُ • رَبَّنَا وَلَكَ الْحَمْدُ",
      phonetic: "Sami'a Allahu liman hamidah • Rabbana wa lakal-hamd",
      meaning: {
        en: "While rising: 'Allah hears whoever praises Him' • Once standing upright: 'Our Lord, to You belongs all praise'.",
        ar: "عند الرفع: «سمع الله لمن حمده» • بعد الاستواء قائمًا: «ربنا ولك الحمد».",
        de: "Beim Aufrichten: 'Sami'a Allahu liman hamidah' • Aufrecht stehend: 'Rabbana wa lakal-hamd'.",
      },
    },
  },
  6: {
    photo: "/assets/prayer/step5_sujud.jpg",
    tag: { en: "7 Points of Contact Grounded", ar: "السجود على سبعة أعضاء", de: "7 Kontaktpunkte am Boden" },
    badge: { en: "Step 6 of 10", ar: "الخطوة 6 من 10", de: "Schritt 6 von 10" },
    recitation: {
      ar: "سُبْحَانَ رَبِّيَ الأَعْلَى (3 مَرَّاتٍ)",
      phonetic: "Subhana Rabbiyal-A'la (said 3 times)",
      meaning: {
        en: "Glory be to my Lord, the Most High (said 3 times with calmness on 7 contact points).",
        ar: "«سبحان ربي الأعلى» (تُقال 3 مرات بطمأنينة في السجود).",
        de: "„Subhana Rabbiyal-A'la“ (Gepriesen sei mein Herr, der Allerhöchste — 3-mal gesprochen).",
      },
    },
  },
  7: {
    photo: "/assets/prayer/step6_jalsah.jpg",
    tag: { en: "Sitting Upright on Left Foot", ar: "الجلوس باطمئنان بين السجدتين", de: "Ruhiges Sitzen auf dem linken Fuß" },
    badge: { en: "Step 7 of 10", ar: "الخطوة 7 من 10", de: "Schritt 7 من 10" },
    recitation: {
      ar: "رَبِّ اغْفِرْ لِي ، رَبِّ اغْفِرْ لِي",
      phonetic: "Rabbighfir li, Rabbighfir li",
      meaning: {
        en: "My Lord forgive me, my Lord forgive me (sitting settled between the two prostrations).",
        ar: "«رب اغفر لي ، رب اغفر لي» (بالجلوس باطمئنان بين السجدتين).",
        de: "„Rabbighfir li, Rabbighfir li“ (Mein Herr, vergib mir; mein Herr, vergib mir).",
      },
    },
  },
  8: {
    photo: "/assets/prayer/step5_sujud.jpg",
    tag: { en: "Second Prostration (Completes 1st Unit)", ar: "السجدة الثانية (تمام الركعة الأولى)", de: "Zweite Niederwerfung (Abschluss 1. Einheit)" },
    badge: { en: "Step 8 of 10", ar: "الخطوة 8 من 10", de: "Schritt 8 von 10" },
    recitation: {
      ar: "سُبْحَانَ رَبِّيَ الأَعْلَى (3 مَرَّاتٍ)",
      phonetic: "Subhana Rabbiyal-A'la (said 3 times)",
      meaning: {
        en: "Glory be to my Lord, the Most High (said 3 times) — completes the first unit.",
        ar: "«سبحان ربي الأعلى» (تُقال 3 مرات بطمأنينة) — وبذلك تتم الركعة الأولى.",
        de: "„Subhana Rabbiyal-A'la“ (3-mal gesprochen) — vollendet die 1. Einheit.",
      },
    },
  },
  9: {
    photo: "/assets/prayer/salat_positions_drawings.jpg",
    tag: { en: "Repeat for 2nd Unit", ar: "تكرار الركعة الثانية", de: "Wiederholung für 2. Einheit" },
    badge: { en: "Step 9 of 10", ar: "الخطوة 9 من 10", de: "Schritt 9 von 10" },
    recitation: {
      ar: "اللهُ أَكْبَرُ",
      phonetic: "Allahu Akbar",
      meaning: {
        en: "Say Allahu Akbar as you rise, repeating standing recitation, bowing, upright pause, and both prostrations.",
        ar: "قل «الله أكبر» وأنت تقوم، وكرر القراءة والركوع والاعتدال والسجدتين.",
        de: "Sage beim Aufstehen „Allahu Akbar“ und wiederhole Rezitation, Verbeugung, Stehen und beide Niederwerfungen.",
      },
    },
  },
  10: {
    photo: "/assets/prayer/step7_tashahhud.jpg",
    tag: { en: "Sitting for Testimony", ar: "الجلوس للتشهد", de: "Sitzen für den Taschahhud" },
    badge: { en: "Step 10 of 10", ar: "الخطوة 10 من 10", de: "Schritt 10 von 10" },
    recitation: {
      ar: "التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ ، السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ...",
      phonetic: "At-tahiyyatu lillahi was-salawatu wat-tayyibat, as-salamu 'alayka ayyuhan-nabiyyu...",
      meaning: {
        en: "The Sitting Testimony (Tashahhud) — see the complete Arabic text, pronunciation aid, and meaning below.",
        ar: "التشهد — انظر اللفظ العربي الكامل ومساعدة النطق وشرح المعنى في القسم التالي أدناه.",
        de: "Der sitzende Taschahhud — siehe vollständigen arabischen Text, Aussprachehilfe und Bedeutung unten.",
      },
    },
  },
};

const WUDU_STEP_DATA: Record<number, { photo: string; secondaryPhoto?: string; tag: Record<Locale, string>; badge: Record<Locale, string>; recitation?: StepRecitation }> = {
  1: {
    photo: "/assets/prayer/wudu_wash_hands.png",
    tag: { en: "Wash Hands to Wrists (3x)", ar: "غسل الكفين إلى الرسغين (3 مرات)", de: "Hände bis zu den Handgelenken (3x)" },
    badge: { en: "Step 1 of 6", ar: "الخطوة 1 من 6", de: "Schritt 1 von 6" },
    recitation: {
      ar: "بِسْمِ اللهِ",
      phonetic: "Bismillah",
      meaning: {
        en: "In the name of Allah (said at the start).",
        ar: "«بسم الله» (تُقال عند ابتداء الوضوء).",
        de: "„Bismillah“ (Im Namen Allahs — zu Beginn des Wudu).",
      },
    },
  },
  2: {
    photo: "/assets/prayer/wudu_rinse_mouth.png",
    secondaryPhoto: "/assets/prayer/wudu_into_nose.png",
    tag: { en: "Rinse Mouth & Sniff Nose (3x)", ar: "المضمضة والاستنشاق (3 مرات)", de: "Mund spülen & Nase reinigen (3x)" },
    badge: { en: "Step 2 of 6", ar: "الخطوة 2 من 6", de: "Schritt 2 von 6" },
    recitation: {
      ar: "الْمَضْمَضَةُ وَالاسْتِنْشَاقُ",
      phonetic: "Al-Madmadah wal-Istinshaq",
      meaning: {
        en: "Rinse mouth with water, then sniff water into nostrils & expel it (3 times).",
        ar: "المضمضة بالماء واستنشاقه في الأنف ثم نثره باليد اليسرى (3 مرات).",
        de: "Mund ausspülen, Wasser in die Nase ziehen und ausstoßen (3-mal).",
      },
    },
  },
  3: {
    photo: "/assets/prayer/wudu_wash_face.png",
    tag: { en: "Wash Full Face (3x)", ar: "غسل الوجه كاملًا (3 مرات)", de: "Gesicht vollständig waschen (3x)" },
    badge: { en: "Step 3 of 6", ar: "الخطوة 3 من 6", de: "Schritt 3 von 6" },
    recitation: {
      ar: "غَسْلُ الْوَجْهِ كَامِلًا",
      phonetic: "Ghasl al-wajh kamilan",
      meaning: {
        en: "Wash face from hairline to chin, and ear to ear (3 times).",
        ar: "غسل الوجه من منابت شعر الرأس إلى الذقن، ومن الأذن إلى الأذن (3 مرات).",
        de: "Gesicht vom Haaransatz bis zum Kinn und von Ohr zu Ohr waschen (3-mal).",
      },
    },
  },
  4: {
    photo: "/assets/prayer/wudu_wash_arms.png",
    tag: { en: "Wash Arms to Elbows (3x)", ar: "غسل اليدين مع المرفقين (3 مرات)", de: "Arme bis zu den Ellenbogen (3x)" },
    badge: { en: "Step 4 of 6", ar: "الخطوة 4 من 6", de: "Schritt 4 von 6" },
    recitation: {
      ar: "الْيَمِينُ ثُمَّ الشِّمَالُ إِلَى الْمِرْفَقَيْنِ",
      phonetic: "Al-yamin thumma ash-shimal ilal-mirfaqayn",
      meaning: {
        en: "Wash fingertips up to elbows: start with right arm 3 times, then left arm 3 times.",
        ar: "غسل اليدين من أطراف الأصابع مع المرفقين: البدء باليمنى ثلاثًا ثم اليسرى ثلاثًا.",
        de: "Hände und Arme einschließlich Ellenbogen waschen: 3-mal rechts, dann 3-mal links.",
      },
    },
  },
  5: {
    photo: "/assets/prayer/wudu_wash_hair.png",
    secondaryPhoto: "/assets/prayer/wudu_clean_ears.png",
    tag: { en: "Wipe Head & Ears (Once)", ar: "مسح الرأس والأذنين (مرة واحدة)", de: "Kopf & Ohren überstreichen (1x)" },
    badge: { en: "Step 5 of 6", ar: "الخطوة 5 من 6", de: "Schritt 5 von 6" },
    recitation: {
      ar: "مَسْحُ الرَّأْسِ وَالأُذُنَيْنِ",
      phonetic: "Mash ar-ra's wal-udhunayn",
      meaning: {
        en: "Wipe over head with wet hands front to back and return, then wipe inside and outside ears (once).",
        ar: "مسح الرأس بيدين مبلولتين من مقدمه إلى قفاه وردهما، ومسح باطن الأذنين وظاهرهما (مرة واحدة).",
        de: "Mit feuchten Händen den Kopf von vorne nach hinten überstreichen, dann Ohren wischen (einmal).",
      },
    },
  },
  6: {
    photo: "/assets/prayer/wudu_wash_feet.png",
    tag: { en: "Wash Feet to Ankles (3x)", ar: "غسل الرجلين مع الكعبين (3 مرات)", de: "Füße bis zu den Knöcheln (3x)" },
    badge: { en: "Step 6 of 6", ar: "الخطوة 6 من 6", de: "Schritt 6 von 6" },
    recitation: {
      ar: "الْيَمِينُ ثُمَّ الشِّمَالُ مَعَ الْكَعْبَيْنِ",
      phonetic: "Al-yamin thumma ash-shimal ma'al-ka'bayn",
      meaning: {
        en: "Wash feet up to and including ankles: right foot first 3 times, then left foot 3 times.",
        ar: "غسل الرجلين مع الكعبين وتخليل الأصابع: البدء بالرجل اليمنى ثلاثًا ثم اليسرى ثلاثًا.",
        de: "Füße einschließlich Knöchel waschen: zuerst der rechte Fuß 3-mal, dann der linke 3-mal.",
      },
    },
  },
};

export default function LearningMarkdown(props: {
  text: string;
  lang: Locale;
  references: Record<string, LearningReference>;
  lessonIds: string[];
  onPrayer?: (key: string) => void;
  isPrayerLesson?: boolean;
  isWuduLesson?: boolean;
  lessonId?: string;
}) {
  const { text, lang, isPrayerLesson, isWuduLesson, lessonId } = props;
  const nodes: ReactNode[] = [];
  const lines = text.split("\n");
  let paragraph: string[] = [], items: string[] = [], ordered = false;
  const renderInline = (t: string) => <LearningInline {...props} text={t} />;

  function flushParagraph() {
    if (!paragraph.length) return;

    if (paragraph[0].trim().startsWith("|")) {
      const tableLines = paragraph.filter((l) => l.trim().startsWith("|") && !l.includes("---"));
      if (tableLines.length >= 2) {
        const headerCells = tableLines[0].split("|").slice(1, -1).map((c) => c.trim());
        const dataRows = tableLines.slice(1).map((l) => l.split("|").slice(1, -1).map((c) => c.trim()));
        paragraph = [];
        if (lessonId === "daily-prayer-times") {
          nodes.push(<PrayerTimesVisual key={nodes.length} lang={lang} />);
        }
        nodes.push(
          <div key={nodes.length} className="learning-table-wrapper">
            <table className="learning-table">
              <thead>
                <tr>
                  {headerCells.map((h, i) => <th key={i}>{renderInline(h)}</th>)}
                </tr>
              </thead>
              <tbody>
                {dataRows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.map((cell, cIdx) => <td key={cIdx}>{renderInline(cell)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        return;
      }
    }

    const pText = paragraph.join(" ");
    paragraph = [];

    if (lessonId === "daily-prayer-times" && /(\badhan\b|«الأذان»|Gebetsruf)/i.test(pText)) {
      nodes.push(<p key={nodes.length}>{renderInline(pText)}</p>);
      nodes.push(
        <AudioPlayButton
          key={nodes.length}
          src="/audio/adhan.mp3"
          lang={lang}
          label={
            lang === "ar"
              ? "استمع إلى صوت الأذان (النداء للصلاة)"
              : lang === "de"
              ? "Den Adhan (Gebetsruf) anhören"
              : "Listen to the Adhan (Call to Prayer)"
          }
        />
      );
      return;
    }
    if (isPrayerLesson && /^\*\*(Finish:|الختام:|Abschluss:)\*\*/i.test(pText)) {
      const tag = { en: "Turn Right, then Turn Left", ar: "الالتفات يمينًا ثم يسارًا", de: "Nach rechts, dann nach links wenden" }[lang];
      const badge = { en: "Completion & Taslim", ar: "الختام والتسليم", de: "Abschluss & Friedensgruß" }[lang];
      const taslimPhonetic = {
        en: "As-salamu 'alaykum wa rahmatullah (Right, then Left)",
        ar: "السلام عليكم ورحمة الله (التفاتًا لليمين ثم لليسار)",
        de: "As-salamu 'alaykum wa rahmatullah (Nach rechts, dann nach links)",
      }[lang];
      const taslimMeaning = {
        en: '"Peace and the mercy of Allah be upon you" (concluding the prayer)',
        ar: "«السلام عليكم ورحمة الله» (الخروج من الصلاة)",
        de: '"Friede und die Barmherzigkeit Allahs seien mit euch" (Abschluss des Gebets)',
      }[lang];
      nodes.push(
        <article key={nodes.length} className="prayer-step-card">
          <div className="step-visual-col">
            <div className="posture-frame">
              <img src="/assets/prayer/step8_taslim.jpg" alt={tag} loading="lazy" />
            </div>
            <span className="posture-tag">{tag}</span>
          </div>
          <div className="step-detail-col">
            <div className="step-head-row">
              <span className="step-index-badge">{badge}</span>
            </div>
            <div className="step-content">
              <p>{renderInline(pText)}</p>
            </div>
            <div className="recitation-box recitation-box--compact">
              <div className="recitation-box--ar" dir="rtl">السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللهِ</div>
              <div className="recitation-box--phonetic">{taslimPhonetic}</div>
              <div className="recitation-box--meaning">{taslimMeaning}</div>
            </div>
          </div>
        </article>
      );
      return;
    }
    if (lessonId === "becoming-muslim" && /^\*\*(The declaration in Arabic|الشهادتان بالعربية|Das Bekenntnis auf Arabisch):/i.test(pText)) {
      const match = pText.match(/^\*\*([^*]+)\*\*\s*([\s\S]*)$/);
      const label = match ? match[1].replace(/:$/, "") : "";
      const arabicContent = match ? match[2] : pText;
      nodes.push(
        <div key={nodes.length} className="recitation-box recitation-box--shahadah">
          <span className="recitation-label">{label}</span>
          <p className="recitation-box--ar" dir="rtl" style={{ fontSize: "1.45rem", lineHeight: 1.8 }}>
            {renderInline(arabicContent)}
          </p>
          <AudioPlayButton
            src="/audio/shahadah.mp3"
            lang={lang}
            label={
              lang === "ar"
                ? "استمع إلى نطق الشهادتين"
                : lang === "de"
                ? "Aussprache des Glaubensbekenntnisses anhören"
                : "Listen to the Shahadah pronunciation"
            }
          />
        </div>
      );
      return;
    }
    if (
      (lessonId === "becoming-muslim" || lessonId === "learning-arabic") &&
      /^\*\*(Pronunciation aid|مساعدة على النطق|نطق اللفظ|Aussprachehilfe|Meaning explained by Bayan|Bayan's meaning guide|شرح المعنى من بيان|دليل بيان للمعنى|Bedeutung, von Bayan erklärt|Bayans Bedeutungserklärung):/i.test(pText)
    ) {
      const match = pText.match(/^\*\*([^*]+)\*\*\s*([\s\S]*)$/);
      const label = match ? match[1].replace(/:$/, "") : "";
      const content = match ? match[2] : pText;
      const isPhonetic = /^(Pronunciation aid|مساعدة على النطق|نطق اللفظ|Aussprachehilfe)/i.test(label);
      nodes.push(
        <div key={nodes.length} className="recitation-box">
          <span className="recitation-label">{label}</span>
          <p className={isPhonetic ? "recitation-box--phonetic" : "recitation-box--meaning"} dir={isPhonetic && lang === "ar" ? "rtl" : "ltr"}>
            {renderInline(content)}
          </p>
        </div>
      );
      return;
    }
    if (lessonId === "learning-arabic" && /(recitation controls|التلاوة في المصدر|Rezitationssteuerung)/i.test(pText)) {
      nodes.push(<p key={nodes.length}>{renderInline(pText)}</p>);
      nodes.push(<FatihahTrainer key={nodes.length} lang={lang} />);
      return;
    }
    if (lessonId === "five-pillars" && /(practical expression|تعبيرًا عمليًا|praktischen Ausdruck)/i.test(pText)) {
      nodes.push(<p key={nodes.length}>{renderInline(pText)}</p>);
      nodes.push(<FivePillarsVisual key={nodes.length} lang={lang} />);
      return;
    }
    if (lessonId === "muslim-beliefs" && /(first explanation of each foundation|شرح أولي لكل أصل|erste Erklärung jedes Grundsatzes)/i.test(pText)) {
      nodes.push(<p key={nodes.length}>{renderInline(pText)}</p>);
      nodes.push(<SixPillarsImanVisual key={nodes.length} lang={lang} />);
      return;
    }
    if (lessonId === "ramadan" && /(suhoor|suhur|السحور)/i.test(pText) && /(iftar|الإفطار)/i.test(pText)) {
      nodes.push(<p key={nodes.length}>{renderInline(pText)}</p>);
      nodes.push(<RamadanTimelineVisual key={nodes.length} lang={lang} />);
      return;
    }
    if (lessonId === "hajj" && /(Jabir|جابر)/i.test(pText)) {
      nodes.push(<p key={nodes.length}>{renderInline(pText)}</p>);
      nodes.push(<HajjJourneyVisual key={nodes.length} lang={lang} />);
      return;
    }
    if (isPrayerLesson && /^(Arabic:|Pronunciation aid:|Meaning guide:|اللفظ العربي:|نطق اللفظ:|المعنى:|Arabisch:|Aussprachehilfe:|Bedeutung:)/.test(pText)) {
      const match = pText.match(/^([^:]+):\s*([\s\S]*)$/);
      const label = match ? match[1] : "";
      const content = match ? match[2] : pText;
      const isAr = /^(Arabic|اللفظ العربي|Arabisch)/i.test(label);
      const isPhonetic = /^(Pronunciation aid|نطق اللفظ|Aussprachehilfe)/i.test(label);
      nodes.push(
        <div key={nodes.length} className="recitation-box">
          <span className="recitation-label">{label}</span>
          <p className={isAr ? "recitation-box--ar" : isPhonetic ? "recitation-box--phonetic" : "recitation-box--meaning"} dir={isAr ? "rtl" : "ltr"}>
            {renderInline(content)}
          </p>
        </div>
      );
      return;
    }
    nodes.push(<p key={nodes.length}>{renderInline(pText)}</p>);
  }

  function flushList() {
    if (!items.length) return;
    if ((isPrayerLesson || isWuduLesson) && ordered) {
      const stepData = isWuduLesson ? WUDU_STEP_DATA : PRAYER_STEP_DATA;
      const stepCards = items.map((item, i) => {
        const stepNum = i + 1;
        const meta = stepData[stepNum];
        return (
          <article key={i} className="prayer-step-card">
            {meta?.photo && (
              <div className="step-visual-col">
                {meta.secondaryPhoto ? (
                  <div className="posture-frame-dual">
                    <div className="posture-frame">
                      <img src={meta.photo} alt={meta.tag[lang] ?? meta.tag.en} loading="lazy" />
                    </div>
                    <div className="posture-frame">
                      <img src={meta.secondaryPhoto} alt={meta.tag[lang] ?? meta.tag.en} loading="lazy" />
                    </div>
                  </div>
                ) : (
                  <div className="posture-frame">
                    <img src={meta.photo} alt={meta.tag[lang] ?? meta.tag.en} loading="lazy" />
                  </div>
                )}
                <span className="posture-tag">{meta.tag[lang] ?? meta.tag.en}</span>
              </div>
            )}
            <div className="step-detail-col">
              <div className="step-head-row">
                <span className="step-index-badge">{meta?.badge[lang] ?? `Step ${stepNum}`}</span>
              </div>
              <div className="step-content">
                <p>{renderInline(item)}</p>
              </div>
              {meta?.recitation && (
                <div className="recitation-box recitation-box--compact">
                  <div className="recitation-box--ar" dir="rtl">{meta.recitation.ar}</div>
                  <div className="recitation-box--phonetic">{meta.recitation.phonetic}</div>
                  <div className="recitation-box--meaning">{meta.recitation.meaning[lang] ?? meta.recitation.meaning.en}</div>
                </div>
              )}
            </div>
          </article>
        );
      });
      nodes.push(<div key={nodes.length} className="prayer-steps-container">{stepCards}</div>);
    } else {
      const children = items.map((item, i) => <li key={i}>{renderInline(item)}</li>);
      nodes.push(ordered ? <ol key={nodes.length}>{children}</ol> : <ul key={nodes.length}>{children}</ul>);
    }
    items = [];
  }

  for (const line of lines) {
    if (!line.trim()) { flushParagraph(); flushList(); continue; }
    if (/^<a id=/.test(line)) continue;
    const heading = line.match(/^\*\*([^*]+)\*\*$/);
    if (heading) {
      flushParagraph();
      flushList();
      const hText = heading[1];
      if (/^[\u0600-\u06ff].*[،.]/.test(hText)) {
        nodes.push(<p key={nodes.length} className="verse-ar recitation-box recitation-box--ar" lang="ar" dir="rtl" translate="no">{hText}</p>);
        if (lessonId === "making-dua" && /ربنا آتنا/.test(hText)) {
          nodes.push(
            <AudioPlayButton
              key={nodes.length}
              src="/audio/rabbana_atina.mp3"
              lang={lang}
              label={
                lang === "ar"
                  ? "استمع إلى التلاوة (سورة البقرة: 201)"
                  : lang === "de"
                  ? "Das Quran-Bittgebet anhören (2:201)"
                  : "Listen to the Quranic supplication (2:201)"
              }
            />
          );
        }
        continue;
      }
      if (lessonId === "making-dua" && /(Bayan's guide|خطوتك مع بيان|Dein nächster Schritt mit Bayan)/i.test(hText)) {
        nodes.push(<DuaEtiquetteVisual key={nodes.length} lang={lang} />);
        nodes.push(<h3 key={nodes.length}>{hText}</h3>);
        continue;
      }
      if (isPrayerLesson && /(sitting testimony|التشهد|Taschahhud)/i.test(hText)) {
        const tag = { en: "Index Finger Pointing at Tawhid", ar: "الإشارة بالسبابة عند التوحيد", de: "Zeigefinger zur Qiblah gerichtet" }[lang];
        nodes.push(
          <div key={nodes.length} className="prayer-posture-banner">
            <div className="step-visual-col">
              <div className="posture-frame">
                <img src="/assets/prayer/step7_tashahhud.jpg" alt={tag} loading="lazy" />
              </div>
              <span className="posture-tag">{tag}</span>
            </div>
            <div className="step-detail-col">
              <h3>{hText}</h3>
            </div>
          </div>
        );
        continue;
      }
      if (isPrayerLesson && /^(Finish:|الختام:|Abschluss:)/i.test(hText)) {
        const tag = { en: "Turn Right, then Turn Left", ar: "الالتفات يمينًا ثم يسارًا", de: "Nach rechts, dann nach links wenden" }[lang];
        nodes.push(
          <div key={nodes.length} className="prayer-posture-banner">
            <div className="step-visual-col">
              <div className="posture-frame">
                <img src="/assets/prayer/step8_taslim.jpg" alt={tag} loading="lazy" />
              </div>
              <span className="posture-tag">{tag}</span>
            </div>
            <div className="step-detail-col">
              <h3>{hText}</h3>
            </div>
          </div>
        );
        continue;
      }
      nodes.push(<h3 key={nodes.length}>{hText}</h3>);
      continue;
    }
    const item = line.match(/^(\d+\.|-) (.+)$/);
    if (item) {
      flushParagraph();
      const nextOrdered = item[1] !== "-";
      if (items.length && nextOrdered !== ordered) flushList();
      ordered = nextOrdered;
      items.push(item[2]);
      continue;
    }
    flushList();
    paragraph.push(line);
  }
  flushParagraph();
  flushList();
  return <div className="learning-prose">{nodes}</div>;
}
