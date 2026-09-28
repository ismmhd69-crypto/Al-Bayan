// Search queries for collecting scholar quotes (Arabic, phrased like fatwa titles).
// Grouped by the site's topics and the questions people ask most. Adding a query here and re-running
// the collector adds more quotes; already stored fatwas are skipped.

export type ScholarQuery = { topic: string; q: string };

export const SCHOLAR_QUERIES: ScholarQuery[] = [
  // Hard questions topics
  { topic: "purpose", q: "وما خلقت الجن والإنس إلا ليعبدون" },
  { topic: "purpose", q: "الحكمة من خلق الخلق" },
  { topic: "who-created", q: "معنى لا إله إلا الله" },
  { topic: "who-created", q: "توحيد الربوبية والألوهية" },
  { topic: "who-created", q: "أسماء الله وصفاته" },
  { topic: "suffering", q: "الحكمة من الابتلاء والمصائب" },
  { topic: "suffering", q: "الصبر على المصائب" },
  { topic: "doubt", q: "الوسوسة في العقيدة" },
  { topic: "doubt", q: "علاج الشك والوساوس" },
  { topic: "faith-reason", q: "التفكر في خلق الله" },
  { topic: "evolution", q: "نظرية داروين" },
  { topic: "evolution", q: "خلق آدم عليه السلام" },
  { topic: "quran-preserved", q: "حفظ القرآن من التحريف" },
  { topic: "quran-preserved", q: "جمع القرآن" },
  { topic: "hadith-late", q: "حجية السنة" },
  { topic: "hadith-late", q: "تدوين السنة" },
  { topic: "women-spiritual", q: "مكانة المرأة في الإسلام" },
  { topic: "inheritance", q: "ميراث المرأة" },
  { topic: "inheritance", q: "للذكر مثل حظ الأنثيين" },
  { topic: "never-heard", q: "أهل الفترة" },
  { topic: "never-heard", q: "من لم تبلغه الدعوة" },
  { topic: "sword", q: "لا إكراه في الدين" },
  { topic: "sword", q: "الجهاد في سبيل الله" },
  // New to Islam steps
  { topic: "prophet", q: "صفات النبي صلى الله عليه وسلم" },
  { topic: "prophet", q: "محبة النبي صلى الله عليه وسلم" },
  { topic: "pillars", q: "أركان الإسلام" },
  { topic: "pillars", q: "أركان الإيمان" },
  { topic: "new-muslim", q: "الدخول في الإسلام" },
  { topic: "new-muslim", q: "نطق الشهادتين" },
  // Common questions
  { topic: "fasting", q: "الحكمة من الصيام" },
  { topic: "fasting", q: "فضل صيام رمضان" },
  { topic: "prayer", q: "حكم تارك الصلاة" },
  { topic: "prayer", q: "أهمية الصلاة" },
  { topic: "zakat", q: "حكم الزكاة" },
  { topic: "hajj", q: "حكم الحج" },
  { topic: "repentance", q: "شروط التوبة" },
  { topic: "repentance", q: "طريقة التوبة من المعاصي" },
  { topic: "qadar", q: "الإيمان بالقدر" },
  { topic: "afterlife", q: "عذاب القبر ونعيمه" },
  { topic: "afterlife", q: "الجنة والنار" },
  { topic: "angels", q: "الإيمان بالملائكة" },
  { topic: "music", q: "حكم الغناء والموسيقى" },
  { topic: "riba", q: "حكم الربا" },
  { topic: "parents", q: "بر الوالدين" },
  { topic: "hijab", q: "حجاب المرأة" },
  { topic: "smoking", q: "حكم التدخين" },
  { topic: "dua", q: "آداب الدعاء" },
];
