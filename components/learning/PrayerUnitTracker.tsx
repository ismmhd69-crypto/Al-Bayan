"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import type { PrayerKey } from "@/lib/learning/course";

type UnitDetail = {
  title: Record<Locale, string>;
  recitation: Record<Locale, string>;
  voice: Record<Locale, string>;
  transition: Record<Locale, string>;
  postures: { name: Record<Locale, string>; photo: string }[];
};

const UNIT_DATA: Record<PrayerKey, Record<number, UnitDetail>> = {
  fajr: {
    1: {
      title: { en: "Unit 1 of 2 (Opening)", ar: "الركعة الأولى (البداية)", de: "1. Einheit (Beginn)" },
      recitation: {
        en: "Recite Surah al-Fatihah + an additional Surah passage.",
        ar: "قراءة سورة الفاتحة + سورة أو آيات بعدها.",
        de: "Sure al-Fatihah + eine weitere Sure rezitieren.",
      },
      voice: {
        en: "Recited aloud (Jahri).",
        ar: "جهرية (بصوت مسموع).",
        de: "Laut rezitiert (Dschahr).",
      },
      transition: {
        en: "After the 2nd prostration, rise with Allahu Akbar for Unit 2 (no sitting).",
        ar: "بعد السجدة الثانية، قم مكبّرًا للركعة الثانية دون جلوس.",
        de: "Nach der 2. Niederwerfung mit Allahu Akbar zur 2. Einheit aufstehen (kein Sitzen).",
      },
      postures: [
        { name: { en: "Takbir", ar: "تكبيرة الإحرام", de: "Takbir" }, photo: "/assets/prayer/step1_takbir.jpg" },
        { name: { en: "Qiyam", ar: "القيام والقراءة", de: "Qiyam" }, photo: "/assets/prayer/step2_qiyam.jpg" },
        { name: { en: "Ruku", ar: "الركوع", de: "Ruku" }, photo: "/assets/prayer/step3_ruku.jpg" },
        { name: { en: "I'tidal", ar: "الاعتدال", de: "I'tidal" }, photo: "/assets/prayer/step4_itidal.jpg" },
        { name: { en: "Sujud", ar: "السجود", de: "Sudschud" }, photo: "/assets/prayer/step5_sujud.jpg" },
      ],
    },
    2: {
      title: { en: "Unit 2 of 2 (Final)", ar: "الركعة الثانية (الأخيرة)", de: "2. Einheit (Abschluss)" },
      recitation: {
        en: "Recite Surah al-Fatihah + an additional Surah passage.",
        ar: "قراءة سورة الفاتحة + سورة أو آيات بعدها.",
        de: "Sure al-Fatihah + eine weitere Sure rezitieren.",
      },
      voice: {
        en: "Recited aloud (Jahri).",
        ar: "جهرية (بصوت مسموع).",
        de: "Laut rezitiert (Dschahr).",
      },
      transition: {
        en: "Final Sitting: Tashahhud, blessings on the Prophet (Salawat), refuge du'a, and Taslim greetings to right and left.",
        ar: "الجلوس الأخير: التشهد، الصلاة على النبي، الاستعاذة، والتسليم عن اليمين واليسار.",
        de: "Letztes Sitzen: Taschahhud, Segenswünsche für den Propheten, Bittgebet und Friedensgruß nach rechts und links.",
      },
      postures: [
        { name: { en: "Qiyam", ar: "القيام", de: "Qiyam" }, photo: "/assets/prayer/step2_qiyam.jpg" },
        { name: { en: "Ruku", ar: "الركوع", de: "Ruku" }, photo: "/assets/prayer/step3_ruku.jpg" },
        { name: { en: "Sujud", ar: "السجود", de: "Sudschud" }, photo: "/assets/prayer/step5_sujud.jpg" },
        { name: { en: "Tashahhud", ar: "التشهد", de: "Taschahhud" }, photo: "/assets/prayer/step7_tashahhud.jpg" },
        { name: { en: "Taslim", ar: "التسليم", de: "Taslim" }, photo: "/assets/prayer/step8_taslim.jpg" },
      ],
    },
  },
  dhuhr: {
    1: {
      title: { en: "Unit 1 of 4", ar: "الركعة الأولى", de: "1. Einheit" },
      recitation: {
        en: "Opening Takbir, then Surah al-Fatihah + an additional Surah.",
        ar: "تكبيرة الإحرام، ثم قراءة الفاتحة وسورة بعدها.",
        de: "Eröffnungs-Takbir, dann Sure al-Fatihah + eine weitere Sure.",
      },
      voice: {
        en: "Recited quietly (Sirri).",
        ar: "سرية (صامتة).",
        de: "Leise rezitiert (Sirr).",
      },
      transition: {
        en: "After 2nd prostration, rise with Allahu Akbar for Unit 2 (no sitting).",
        ar: "بعد السجدة الثانية، قم مكبّرًا للركعة الثانية دون جلوس.",
        de: "Nach der 2. Niederwerfung mit Allahu Akbar zur 2. Einheit aufstehen.",
      },
      postures: [
        { name: { en: "Takbir", ar: "التكبير", de: "Takbir" }, photo: "/assets/prayer/step1_takbir.jpg" },
        { name: { en: "Qiyam", ar: "القيام", de: "Qiyam" }, photo: "/assets/prayer/step2_qiyam.jpg" },
        { name: { en: "Ruku", ar: "الركوع", de: "Ruku" }, photo: "/assets/prayer/step3_ruku.jpg" },
        { name: { en: "Sujud", ar: "السجود", de: "Sudschud" }, photo: "/assets/prayer/step5_sujud.jpg" },
      ],
    },
    2: {
      title: { en: "Unit 2 of 4 (Middle Sitting)", ar: "الركعة الثانية (التشهد الأول)", de: "2. Einheit (Erster Taschahhud)" },
      recitation: {
        en: "Surah al-Fatihah + an additional Surah.",
        ar: "قراءة الفاتحة وسورة بعدها.",
        de: "Sure al-Fatihah + eine weitere Sure.",
      },
      voice: {
        en: "Recited quietly (Sirri).",
        ar: "سرية (صامتة).",
        de: "Leise rezitiert (Sirr).",
      },
      transition: {
        en: "First Tashahhud only: Sit and recite the testimony. Then say Allahu Akbar and stand up for Unit 3! (Do not say Salawat or Taslim yet).",
        ar: "التشهد الأول: اجلس واقرأ التشهد فقط، ثم كبّر وقم للركعة الثالثة دون تسليم.",
        de: "Erster Taschahhud: Hinsetzen und das Glaubensbekenntnis sprechen. Dann mit Allahu Akbar zur 3. Einheit aufstehen!",
      },
      postures: [
        { name: { en: "Qiyam", ar: "القيام", de: "Qiyam" }, photo: "/assets/prayer/step2_qiyam.jpg" },
        { name: { en: "Ruku", ar: "الركوع", de: "Ruku" }, photo: "/assets/prayer/step3_ruku.jpg" },
        { name: { en: "Sujud", ar: "السجود", de: "Sudschud" }, photo: "/assets/prayer/step5_sujud.jpg" },
        { name: { en: "Tashahhud 1", ar: "التشهد الأول", de: "Taschahhud 1" }, photo: "/assets/prayer/step7_tashahhud.jpg" },
      ],
    },
    3: {
      title: { en: "Unit 3 of 4 (Key Difference: Only Fatihah)", ar: "الركعة الثالثة (الفاتحة فقط)", de: "3. Einheit (Nur Fatihah)" },
      recitation: {
        en: "Recite ONLY Surah al-Fatihah (no additional Surah).",
        ar: "قراءة سورة الفاتحة فقط (دون سورة بعدها).",
        de: "NUR Sure al-Fatihah rezitieren (keine weitere Sure).",
      },
      voice: {
        en: "Recited quietly (Sirri).",
        ar: "سرية (صامتة).",
        de: "Leise rezitiert (Sirr).",
      },
      transition: {
        en: "Complete Ruku and both prostrations, then rise with Allahu Akbar for Unit 4 (no sitting).",
        ar: "اركع واسجد السجدتين، ثم قم مكبّرًا للركعة الرابعة دون جلوس.",
        de: "Ruku und beide Niederwerfungen ausführen, dann mit Allahu Akbar zur 4. Einheit aufstehen (kein Sitzen).",
      },
      postures: [
        { name: { en: "Qiyam", ar: "القيام", de: "Qiyam" }, photo: "/assets/prayer/step2_qiyam.jpg" },
        { name: { en: "Ruku", ar: "الركوع", de: "Ruku" }, photo: "/assets/prayer/step3_ruku.jpg" },
        { name: { en: "I'tidal", ar: "الاعتدال", de: "I'tidal" }, photo: "/assets/prayer/step4_itidal.jpg" },
        { name: { en: "Sujud", ar: "السجود", de: "Sudschud" }, photo: "/assets/prayer/step5_sujud.jpg" },
      ],
    },
    4: {
      title: { en: "Unit 4 of 4 (Final Sitting)", ar: "الركعة الرابعة (الجلوس الأخير)", de: "4. Einheit (Abschluss)" },
      recitation: {
        en: "Recite ONLY Surah al-Fatihah (no additional Surah).",
        ar: "قراءة سورة الفاتحة فقط (دون سورة بعدها).",
        de: "NUR Sure al-Fatihah rezitieren (keine weitere Sure).",
      },
      voice: {
        en: "Recited quietly (Sirri).",
        ar: "سرية (صامتة).",
        de: "Leise rezitiert (Sirr).",
      },
      transition: {
        en: "Final Sitting: Sit for full Tashahhud, Salawat on Prophet Muhammad, refuge supplication, and closing Taslim to right and left.",
        ar: "الجلوس الأخير: التشهد كاملاً، والصلاة على النبي، والاستعاذة من الأربع، ثم التسليم يمينًا ويسارًا.",
        de: "Letztes Sitzen: Vollständiger Taschahhud, Segenswünsche für den Propheten, Bittgebet und Taslim nach rechts und links.",
      },
      postures: [
        { name: { en: "Qiyam", ar: "القيام", de: "Qiyam" }, photo: "/assets/prayer/step2_qiyam.jpg" },
        { name: { en: "Ruku", ar: "الركوع", de: "Ruku" }, photo: "/assets/prayer/step3_ruku.jpg" },
        { name: { en: "Sujud", ar: "السجود", de: "Sudschud" }, photo: "/assets/prayer/step5_sujud.jpg" },
        { name: { en: "Tashahhud", ar: "التشهد الأخير", de: "Taschahhud" }, photo: "/assets/prayer/step7_tashahhud.jpg" },
        { name: { en: "Taslim", ar: "التسليم", de: "Taslim" }, photo: "/assets/prayer/step8_taslim.jpg" },
      ],
    },
  },
  asr: {
    1: {
      title: { en: "Unit 1 of 4", ar: "الركعة الأولى", de: "1. Einheit" },
      recitation: {
        en: "Opening Takbir, then Surah al-Fatihah + an additional Surah.",
        ar: "تكبيرة الإحرام، ثم قراءة الفاتحة وسورة بعدها.",
        de: "Eröffnungs-Takbir, dann Sure al-Fatihah + eine weitere Sure.",
      },
      voice: {
        en: "Recited quietly (Sirri).",
        ar: "سرية (صامتة).",
        de: "Leise rezitiert (Sirr).",
      },
      transition: {
        en: "After 2nd prostration, rise with Allahu Akbar for Unit 2 (no sitting).",
        ar: "بعد السجدة الثانية، قم مكبّرًا للركعة الثانية دون جلوس.",
        de: "Nach der 2. Niederwerfung mit Allahu Akbar zur 2. Einheit aufstehen.",
      },
      postures: [
        { name: { en: "Takbir", ar: "التكبير", de: "Takbir" }, photo: "/assets/prayer/step1_takbir.jpg" },
        { name: { en: "Qiyam", ar: "القيام", de: "Qiyam" }, photo: "/assets/prayer/step2_qiyam.jpg" },
        { name: { en: "Ruku", ar: "الركوع", de: "Ruku" }, photo: "/assets/prayer/step3_ruku.jpg" },
        { name: { en: "Sujud", ar: "السجود", de: "Sudschud" }, photo: "/assets/prayer/step5_sujud.jpg" },
      ],
    },
    2: {
      title: { en: "Unit 2 of 4 (Middle Sitting)", ar: "الركعة الثانية (التشهد الأول)", de: "2. Einheit (Erster Taschahhud)" },
      recitation: {
        en: "Surah al-Fatihah + an additional Surah.",
        ar: "قراءة الفاتحة وسورة بعدها.",
        de: "Sure al-Fatihah + eine weitere Sure.",
      },
      voice: {
        en: "Recited quietly (Sirri).",
        ar: "سرية (صامتة).",
        de: "Leise rezitiert (Sirr).",
      },
      transition: {
        en: "First Tashahhud: Sit and recite the testimony. Then say Allahu Akbar and stand up for Unit 3! (Do not say Salawat or Taslim yet).",
        ar: "التشهد الأول: اجلس واقرأ التشهد فقط، ثم كبّر وقم للركعة الثالثة دون تسليم.",
        de: "Erster Taschahhud: Hinsetzen und das Glaubensbekenntnis sprechen. Dann mit Allahu Akbar zur 3. Einheit aufstehen!",
      },
      postures: [
        { name: { en: "Qiyam", ar: "القيام", de: "Qiyam" }, photo: "/assets/prayer/step2_qiyam.jpg" },
        { name: { en: "Ruku", ar: "الركوع", de: "Ruku" }, photo: "/assets/prayer/step3_ruku.jpg" },
        { name: { en: "Sujud", ar: "السجود", de: "Sudschud" }, photo: "/assets/prayer/step5_sujud.jpg" },
        { name: { en: "Tashahhud 1", ar: "التشهد الأول", de: "Taschahhud 1" }, photo: "/assets/prayer/step7_tashahhud.jpg" },
      ],
    },
    3: {
      title: { en: "Unit 3 of 4 (Key Difference: Only Fatihah)", ar: "الركعة الثالثة (الفاتحة فقط)", de: "3. Einheit (Nur Fatihah)" },
      recitation: {
        en: "Recite ONLY Surah al-Fatihah (no additional Surah).",
        ar: "قراءة سورة الفاتحة فقط (دون سورة بعدها).",
        de: "NUR Sure al-Fatihah rezitieren (keine weitere Sure).",
      },
      voice: {
        en: "Recited quietly (Sirri).",
        ar: "سرية (صامتة).",
        de: "Leise rezitiert (Sirr).",
      },
      transition: {
        en: "Complete Ruku and both prostrations, then rise with Allahu Akbar for Unit 4 (no sitting).",
        ar: "اركع واسجد السجدتين، ثم قم مكبّرًا للركعة الرابعة دون جلوس.",
        de: "Ruku und beide Niederwerfungen ausführen, dann mit Allahu Akbar zur 4. Einheit aufstehen (kein Sitzen).",
      },
      postures: [
        { name: { en: "Qiyam", ar: "القيام", de: "Qiyam" }, photo: "/assets/prayer/step2_qiyam.jpg" },
        { name: { en: "Ruku", ar: "الركوع", de: "Ruku" }, photo: "/assets/prayer/step3_ruku.jpg" },
        { name: { en: "I'tidal", ar: "الاعتدال", de: "I'tidal" }, photo: "/assets/prayer/step4_itidal.jpg" },
        { name: { en: "Sujud", ar: "السجود", de: "Sudschud" }, photo: "/assets/prayer/step5_sujud.jpg" },
      ],
    },
    4: {
      title: { en: "Unit 4 of 4 (Final Sitting)", ar: "الركعة الرابعة (الجلوس الأخير)", de: "4. Einheit (Abschluss)" },
      recitation: {
        en: "Recite ONLY Surah al-Fatihah (no additional Surah).",
        ar: "قراءة سورة الفاتحة فقط (دون سورة بعدها).",
        de: "NUR Sure al-Fatihah rezitieren (keine weitere Sure).",
      },
      voice: {
        en: "Recited quietly (Sirri).",
        ar: "سرية (صامتة).",
        de: "Leise rezitiert (Sirr).",
      },
      transition: {
        en: "Final Sitting: Sit for full Tashahhud, Salawat on Prophet Muhammad, refuge supplication, and closing Taslim to right and left.",
        ar: "الجلوس الأخير: التشهد كاملاً، والصلاة على النبي، والاستعاذة من الأربع، ثم التسليم يمينًا ويسارًا.",
        de: "Letztes Sitzen: Vollständiger Taschahhud, Segenswünsche für den Propheten, Bittgebet und Taslim nach rechts und links.",
      },
      postures: [
        { name: { en: "Qiyam", ar: "القيام", de: "Qiyam" }, photo: "/assets/prayer/step2_qiyam.jpg" },
        { name: { en: "Ruku", ar: "الركوع", de: "Ruku" }, photo: "/assets/prayer/step3_ruku.jpg" },
        { name: { en: "Sujud", ar: "السجود", de: "Sudschud" }, photo: "/assets/prayer/step5_sujud.jpg" },
        { name: { en: "Tashahhud", ar: "التشهد الأخير", de: "Taschahhud" }, photo: "/assets/prayer/step7_tashahhud.jpg" },
        { name: { en: "Taslim", ar: "التسليم", de: "Taslim" }, photo: "/assets/prayer/step8_taslim.jpg" },
      ],
    },
  },
  maghrib: {
    1: {
      title: { en: "Unit 1 of 3 (Aloud)", ar: "الركعة الأولى (جهرية)", de: "1. Einheit (Laut)" },
      recitation: {
        en: "Opening Takbir, then Surah al-Fatihah + an additional Surah.",
        ar: "تكبيرة الإحرام، ثم قراءة الفاتحة وسورة بعدها.",
        de: "Eröffnungs-Takbir, dann Sure al-Fatihah + eine weitere Sure.",
      },
      voice: {
        en: "Recited aloud (Jahri).",
        ar: "جهرية (بصوت مسموع).",
        de: "Laut rezitiert (Dschahr).",
      },
      transition: {
        en: "After 2nd prostration, rise with Allahu Akbar for Unit 2 (no sitting).",
        ar: "بعد السجدة الثانية، قم مكبّرًا للركعة الثانية دون جلوس.",
        de: "Nach der 2. Niederwerfung mit Allahu Akbar zur 2. Einheit aufstehen.",
      },
      postures: [
        { name: { en: "Takbir", ar: "التكبير", de: "Takbir" }, photo: "/assets/prayer/step1_takbir.jpg" },
        { name: { en: "Qiyam", ar: "القيام", de: "Qiyam" }, photo: "/assets/prayer/step2_qiyam.jpg" },
        { name: { en: "Ruku", ar: "الركوع", de: "Ruku" }, photo: "/assets/prayer/step3_ruku.jpg" },
        { name: { en: "Sujud", ar: "السجود", de: "Sudschud" }, photo: "/assets/prayer/step5_sujud.jpg" },
      ],
    },
    2: {
      title: { en: "Unit 2 of 3 (Aloud & Middle Sitting)", ar: "الركعة الثانية (جهرية والتشهد الأول)", de: "2. Einheit (Laut & 1. Taschahhud)" },
      recitation: {
        en: "Surah al-Fatihah + an additional Surah.",
        ar: "قراءة الفاتحة وسورة بعدها.",
        de: "Sure al-Fatihah + eine weitere Sure.",
      },
      voice: {
        en: "Recited aloud (Jahri).",
        ar: "جهرية (بصوت مسموع).",
        de: "Laut rezitiert (Dschahr).",
      },
      transition: {
        en: "First Tashahhud: Sit and recite the testimony. Then say Allahu Akbar and stand up for Unit 3! (Do not say Salawat or Taslim yet).",
        ar: "التشهد الأول: اجلس واقرأ التشهد فقط، ثم كبّر وقم للركعة الثالثة دون تسليم.",
        de: "Erster Taschahhud: Hinsetzen und das Glaubensbekenntnis sprechen. Dann mit Allahu Akbar zur 3. Einheit aufstehen!",
      },
      postures: [
        { name: { en: "Qiyam", ar: "القيام", de: "Qiyam" }, photo: "/assets/prayer/step2_qiyam.jpg" },
        { name: { en: "Ruku", ar: "الركوع", de: "Ruku" }, photo: "/assets/prayer/step3_ruku.jpg" },
        { name: { en: "Sujud", ar: "السجود", de: "Sudschud" }, photo: "/assets/prayer/step5_sujud.jpg" },
        { name: { en: "Tashahhud 1", ar: "التشهد الأول", de: "Taschahhud 1" }, photo: "/assets/prayer/step7_tashahhud.jpg" },
      ],
    },
    3: {
      title: { en: "Unit 3 of 3 (Quiet & Final Sitting)", ar: "الركعة الثالثة (سرية والجلوس الأخير)", de: "3. Einheit (Leise & Abschluss)" },
      recitation: {
        en: "Recite ONLY Surah al-Fatihah (quietly, no additional Surah).",
        ar: "قراءة سورة الفاتحة فقط سرًا (دون سورة بعدها).",
        de: "NUR Sure al-Fatihah leise rezitieren (keine weitere Sure).",
      },
      voice: {
        en: "Recited quietly (Sirri).",
        ar: "سرية (صامتة).",
        de: "Leise rezitiert (Sirr).",
      },
      transition: {
        en: "Final Sitting: After 2nd prostration, sit for full Tashahhud, Salawat on Prophet Muhammad, refuge supplication, and closing Taslim to right and left.",
        ar: "الجلوس الأخير: بعد السجدة الثانية، اجلس للتشهد والصلاة على النبي والاستعاذة والتسليمتين.",
        de: "Letztes Sitzen: Nach der 2. Niederwerfung für den vollständigen Taschahhud, Segenswünsche für den Propheten und Taslim sitzen.",
      },
      postures: [
        { name: { en: "Qiyam", ar: "القيام", de: "Qiyam" }, photo: "/assets/prayer/step2_qiyam.jpg" },
        { name: { en: "Ruku", ar: "الركوع", de: "Ruku" }, photo: "/assets/prayer/step3_ruku.jpg" },
        { name: { en: "Sujud", ar: "السجود", de: "Sudschud" }, photo: "/assets/prayer/step5_sujud.jpg" },
        { name: { en: "Tashahhud", ar: "التشهد الأخير", de: "Taschahhud" }, photo: "/assets/prayer/step7_tashahhud.jpg" },
        { name: { en: "Taslim", ar: "التسليم", de: "Taslim" }, photo: "/assets/prayer/step8_taslim.jpg" },
      ],
    },
  },
  isha: {
    1: {
      title: { en: "Unit 1 of 4 (Aloud)", ar: "الركعة الأولى (جهرية)", de: "1. Einheit (Laut)" },
      recitation: {
        en: "Opening Takbir, then Surah al-Fatihah + an additional Surah.",
        ar: "تكبيرة الإحرام، ثم قراءة الفاتحة وسورة بعدها.",
        de: "Eröffnungs-Takbir, dann Sure al-Fatihah + eine weitere Sure.",
      },
      voice: {
        en: "Recited aloud (Jahri).",
        ar: "جهرية (بصوت مسموع).",
        de: "Laut rezitiert (Dschahr).",
      },
      transition: {
        en: "After 2nd prostration, rise with Allahu Akbar for Unit 2 (no sitting).",
        ar: "بعد السجدة الثانية، قم مكبّرًا للركعة الثانية دون جلوس.",
        de: "Nach der 2. Niederwerfung mit Allahu Akbar zur 2. Einheit aufstehen.",
      },
      postures: [
        { name: { en: "Takbir", ar: "التكبير", de: "Takbir" }, photo: "/assets/prayer/step1_takbir.jpg" },
        { name: { en: "Qiyam", ar: "القيام", de: "Qiyam" }, photo: "/assets/prayer/step2_qiyam.jpg" },
        { name: { en: "Ruku", ar: "الركوع", de: "Ruku" }, photo: "/assets/prayer/step3_ruku.jpg" },
        { name: { en: "Sujud", ar: "السجود", de: "Sudschud" }, photo: "/assets/prayer/step5_sujud.jpg" },
      ],
    },
    2: {
      title: { en: "Unit 2 of 4 (Aloud & Middle Sitting)", ar: "الركعة الثانية (جهرية والتشهد الأول)", de: "2. Einheit (Laut & 1. Taschahhud)" },
      recitation: {
        en: "Surah al-Fatihah + an additional Surah.",
        ar: "قراءة الفاتحة وسورة بعدها.",
        de: "Sure al-Fatihah + eine weitere Sure.",
      },
      voice: {
        en: "Recited aloud (Jahri).",
        ar: "جهرية (بصوت مسموع).",
        de: "Laut rezitiert (Dschahr).",
      },
      transition: {
        en: "First Tashahhud: Sit and recite the testimony. Then say Allahu Akbar and stand up for Unit 3! (Do not say Salawat or Taslim yet).",
        ar: "التشهد الأول: اجلس واقرأ التشهد فقط، ثم كبّر وقم للركعة الثالثة دون تسليم.",
        de: "Erster Taschahhud: Hinsetzen und das Glaubensbekenntnis sprechen. Dann mit Allahu Akbar zur 3. Einheit aufstehen!",
      },
      postures: [
        { name: { en: "Qiyam", ar: "القيام", de: "Qiyam" }, photo: "/assets/prayer/step2_qiyam.jpg" },
        { name: { en: "Ruku", ar: "الركوع", de: "Ruku" }, photo: "/assets/prayer/step3_ruku.jpg" },
        { name: { en: "Sujud", ar: "السجود", de: "Sudschud" }, photo: "/assets/prayer/step5_sujud.jpg" },
        { name: { en: "Tashahhud 1", ar: "التشهد الأول", de: "Taschahhud 1" }, photo: "/assets/prayer/step7_tashahhud.jpg" },
      ],
    },
    3: {
      title: { en: "Unit 3 of 4 (Quiet & Only Fatihah)", ar: "الركعة الثالثة (سرية والفاتحة فقط)", de: "3. Einheit (Leise & nur Fatihah)" },
      recitation: {
        en: "Recite ONLY Surah al-Fatihah (quietly, no additional Surah).",
        ar: "قراءة سورة الفاتحة فقط سرًا (دون سورة بعدها).",
        de: "NUR Sure al-Fatihah leise rezitieren (keine weitere Sure).",
      },
      voice: {
        en: "Recited quietly (Sirri).",
        ar: "سرية (صامتة).",
        de: "Leise rezitiert (Sirr).",
      },
      transition: {
        en: "Complete Ruku and both prostrations, then rise with Allahu Akbar for Unit 4 (no sitting).",
        ar: "اركع واسجد السجدتين، ثم قم مكبّرًا للركعة الرابعة دون جلوس.",
        de: "Ruku und beide Niederwerfungen ausführen, dann mit Allahu Akbar zur 4. Einheit aufstehen (kein Sitzen).",
      },
      postures: [
        { name: { en: "Qiyam", ar: "القيام", de: "Qiyam" }, photo: "/assets/prayer/step2_qiyam.jpg" },
        { name: { en: "Ruku", ar: "الركوع", de: "Ruku" }, photo: "/assets/prayer/step3_ruku.jpg" },
        { name: { en: "I'tidal", ar: "الاعتدال", de: "I'tidal" }, photo: "/assets/prayer/step4_itidal.jpg" },
        { name: { en: "Sujud", ar: "السجود", de: "Sudschud" }, photo: "/assets/prayer/step5_sujud.jpg" },
      ],
    },
    4: {
      title: { en: "Unit 4 of 4 (Final Sitting)", ar: "الركعة الرابعة (الجلوس الأخير)", de: "4. Einheit (Abschluss)" },
      recitation: {
        en: "Recite ONLY Surah al-Fatihah (quietly, no additional Surah).",
        ar: "قراءة سورة الفاتحة فقط سرًا (دون سورة بعدها).",
        de: "NUR Sure al-Fatihah leise rezitieren (keine weitere Sure).",
      },
      voice: {
        en: "Recited quietly (Sirri).",
        ar: "سرية (صامتة).",
        de: "Leise rezitiert (Sirr).",
      },
      transition: {
        en: "Final Sitting: Sit for full Tashahhud, Salawat on Prophet Muhammad, refuge supplication, and closing Taslim to right and left.",
        ar: "الجلوس الأخير: التشهد كاملاً، والصلاة على النبي، والاستعاذة من الأربع، ثم التسليم يمينًا ويسارًا.",
        de: "Letztes Sitzen: Vollständiger Taschahhud, Segenswünsche für den Propheten, Bittgebet und Taslim nach rechts und links.",
      },
      postures: [
        { name: { en: "Qiyam", ar: "القيام", de: "Qiyam" }, photo: "/assets/prayer/step2_qiyam.jpg" },
        { name: { en: "Ruku", ar: "الركوع", de: "Ruku" }, photo: "/assets/prayer/step3_ruku.jpg" },
        { name: { en: "Sujud", ar: "السجود", de: "Sudschud" }, photo: "/assets/prayer/step5_sujud.jpg" },
        { name: { en: "Tashahhud", ar: "التشهد الأخير", de: "Taschahhud" }, photo: "/assets/prayer/step7_tashahhud.jpg" },
        { name: { en: "Taslim", ar: "التسليم", de: "Taslim" }, photo: "/assets/prayer/step8_taslim.jpg" },
      ],
    },
  },
};

function getPostureWords(name: string): { ar: string; phonetic: string } | undefined {
  const k = name.toLowerCase();
  if (k.includes("takbir")) return { ar: "اللهُ أَكْبَرُ", phonetic: "Allahu Akbar" };
  if (k.includes("qiyam")) return { ar: "الفاتحة", phonetic: "Al-Fatihah" };
  if (k.includes("ruku")) return { ar: "سُبْحَانَ رَبِّيَ الْعَظِيمِ (3×)", phonetic: "Subhana Rabbiyal-'Azim (3×)" };
  if (k.includes("i'tidal") || k.includes("itidal")) return { ar: "سَمِعَ اللهُ لِمَنْ حَمِدَهُ", phonetic: "Sami'a Allahu..." };
  if (k.includes("sujud") || k.includes("sudschud")) return { ar: "سُبْحَانَ رَبِّيَ الأَعْلَى (3×)", phonetic: "Subhana Rabbiyal-A'la (3×)" };
  if (k.includes("jalsah")) return { ar: "رَبِّ اغْفِرْ لِي", phonetic: "Rabbighfir li" };
  if (k.includes("tashahhud")) return { ar: "التَّحِيَّاتُ لِلَّهِ", phonetic: "At-tahiyyat..." };
  if (k.includes("taslim")) return { ar: "السَّلَامُ عَلَيْكُمْ", phonetic: "As-salamu 'alaykum" };
  return undefined;
}

const CORE_REMEMBRANCES = {
  ruku: {
    label: { en: "Bowing (Ruku) · Said 3 Times", ar: "الركوع · يُقال 3 مرات", de: "Verbeugung (Ruku) · 3-mal gesprochen" },
    ar: "سُبْحَانَ رَبِّيَ الْعَظِيمِ (3 مَرَّاتٍ)",
    phonetic: "Subhana Rabbiyal-'Azim (said 3 times)",
    meaning: { en: "Glory be to my Lord, the Magnificent", ar: "تنزيه للرب ووصفه بالعظمة", de: "Gepriesen sei mein Herr, der Gewaltige" },
  },
  sujud: {
    label: { en: "Prostration (Sujud) · Said 3 Times", ar: "السجود · يُقال 3 مرات", de: "Niederwerfung (Sudschud) · 3-mal gesprochen" },
    ar: "سُبْحَانَ رَبِّيَ الأَعْلَى (3 مَرَّاتٍ)",
    phonetic: "Subhana Rabbiyal-A'la (said 3 times)",
    meaning: { en: "Glory be to my Lord, the Most High", ar: "تنزيه للرب ووصفه بالعلو", de: "Gepriesen sei mein Herr, der Allerhöchste" },
  },
};

export default function PrayerUnitTracker({
  prayer,
  lang,
}: {
  prayer: PrayerKey;
  lang: Locale;
}) {
  const [selectedUnit, setSelectedUnit] = useState<number>(1);
  const unitsMap = UNIT_DATA[prayer] ?? UNIT_DATA.fajr;
  const unitNumbers = Object.keys(unitsMap).map(Number).sort((a, b) => a - b);
  const currentUnit = unitsMap[selectedUnit] ?? unitsMap[unitNumbers[0]];

  const labels = {
    en: {
      heading: "Step-by-Step Unit Breakdown (Rak'ahs)",
      recitationLabel: "Recitation in this Unit",
      voiceLabel: "Voice Volume",
      transitionLabel: "How this Unit Ends",
      postureFlow: "Movement Flow for this Unit",
      unitTab: "Unit",
    },
    ar: {
      heading: "تفصيل الركعات خطوة بخطوة وفروقها",
      recitationLabel: "ما يُقرأ في هذه الركعة",
      voiceLabel: "الجهر والسر",
      transitionLabel: "كيف تنتهي هذه الركعة",
      postureFlow: "تسلسل حركات هذه الركعة",
      unitTab: "الركعة",
    },
    de: {
      heading: "Schritt-für-Schritt Ablauf der Gebetseinheiten (Raka'at)",
      recitationLabel: "Was in dieser Einheit rezitiert wird",
      voiceLabel: "Lautstärke",
      transitionLabel: "Wie diese Einheit endet",
      postureFlow: "Bewegungsablauf dieser Einheit",
      unitTab: "Einheit",
    },
  }[lang];

  return (
    <div className="prayer-unit-tracker">
      <div className="prayer-unit-header">
        <h3 className="prayer-unit-title">{labels.heading}</h3>
        <div className="prayer-unit-tabs" role="tablist">
          {unitNumbers.map((unitNum) => {
            const isSelected = selectedUnit === unitNum;
            return (
              <button
                key={unitNum}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={`prayer-unit-tab ${isSelected ? "active" : ""}`}
                onClick={() => setSelectedUnit(unitNum)}
              >
                <span>{labels.unitTab} {unitNum}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="prayer-unit-card">
        <div className="prayer-unit-card-head">
          <h4 className="prayer-unit-card-title">{currentUnit.title[lang] ?? currentUnit.title.en}</h4>
        </div>

        {/* Posture photo strip with spoken words */}
        <div className="prayer-unit-strip" aria-label={labels.postureFlow}>
          {currentUnit.postures.map((posture, idx) => {
            const words = getPostureWords(posture.name.en);
            return (
              <div key={idx} className="prayer-strip-item">
                <div className="prayer-strip-thumb">
                  <img src={posture.photo} alt={posture.name[lang] ?? posture.name.en} loading="lazy" />
                </div>
                <span className="prayer-strip-name">{posture.name[lang] ?? posture.name.en}</span>
                {words && (
                  <div className="prayer-strip-words">
                    <span className="prayer-strip-words-ar" dir="rtl">{words.ar}</span>
                    <span className="prayer-strip-words-phonetic">{words.phonetic}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Differences & Guide Grid */}
        <div className="prayer-unit-meta-grid">
          <div className="prayer-unit-meta-box">
            <span className="prayer-meta-label">{labels.recitationLabel}</span>
            <p className="prayer-meta-text">{currentUnit.recitation[lang] ?? currentUnit.recitation.en}</p>
          </div>
          <div className="prayer-unit-meta-box">
            <span className="prayer-meta-label">{labels.voiceLabel}</span>
            <p className="prayer-meta-text">{currentUnit.voice[lang] ?? currentUnit.voice.en}</p>
          </div>
          <div className="prayer-unit-meta-box prayer-unit-meta-box--full">
            <span className="prayer-meta-label">{labels.transitionLabel}</span>
            <p className="prayer-meta-text">{currentUnit.transition[lang] ?? currentUnit.transition.en}</p>
          </div>
        </div>

        {/* Core Repetitions Highlight */}
        <div className="prayer-unit-remembrances">
          <div className="prayer-remembrance-item">
            <span className="prayer-remembrance-badge">{CORE_REMEMBRANCES.ruku.label[lang] ?? CORE_REMEMBRANCES.ruku.label.en}</span>
            <span className="prayer-remembrance-ar" dir="rtl">{CORE_REMEMBRANCES.ruku.ar}</span>
            <span className="prayer-remembrance-phonetic">{CORE_REMEMBRANCES.ruku.phonetic}</span>
          </div>
          <div className="prayer-remembrance-item">
            <span className="prayer-remembrance-badge">{CORE_REMEMBRANCES.sujud.label[lang] ?? CORE_REMEMBRANCES.sujud.label.en}</span>
            <span className="prayer-remembrance-ar" dir="rtl">{CORE_REMEMBRANCES.sujud.ar}</span>
            <span className="prayer-remembrance-phonetic">{CORE_REMEMBRANCES.sujud.phonetic}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
