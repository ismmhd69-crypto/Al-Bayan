// Targeted evidence gaps identified by the scholar library retrieval evaluation.
// Explicit subjects searched only against approved scholar sites.

export type TargetedGap = {
  id: string;
  scholar: "ibn-baz" | "ibn-uthaymeen";
  englishDescription: string;
  exactPoint: string;
  searchPhrases: string[];
};

export const TARGETED_GAPS: TargetedGap[] = [
  // --- Ibn Baz (Targets 1 to 14) ---
  {
    id: "fasting-obligation",
    scholar: "ibn-baz",
    englishDescription: "Ramadan fasting is obligatory",
    exactPoint: "Ramadan fasting is one of the pillars of Islam and an obligatory duty on every mature, sane Muslim.",
    searchPhrases: [
      "فرض صيام رمضان",
      "وجوب صيام رمضان",
      "صيام رمضان ركن",
      "على من يجب صيام رمضان",
      "فريضة الصيام",
    ],
  },
  {
    id: "fasting-fajr-cutoff",
    scholar: "ibn-baz",
    englishDescription: "Exact Fajr cutoff for food and drink while fasting",
    exactPoint: "Eating and drinking must cease upon the appearance of the true dawn (Fajr), based on Quran 2:187.",
    searchPhrases: [
      "إذا أكل بعد طلوع الفجر",
      "أكل أو شرب شاكا في طلوع الفجر",
      "سمع أذان الفجر واستمر في الأكل",
      "حد الإمساك في الصوم",
      "وقت الإمساك عن الأكل والشرب",
    ],
  },
  {
    id: "qibla-facing-kabah",
    scholar: "ibn-baz",
    englishDescription: "Facing the Ka'bah in prayer",
    exactPoint: "Facing the Ka'bah (the Qibla) is an obligatory condition for the validity of prayer when able.",
    searchPhrases: [
      "استقبال القبلة شرط لصحة الصلاة",
      "حكم استقبال القبلة في الصلاة",
      "الصلاة إلى غير القبلة",
      "وجوب استقبال الكعبة",
    ],
  },
  {
    id: "no-forced-conversion",
    scholar: "ibn-baz",
    englishDescription: "No forced conversion in Islam",
    exactPoint: "Non-Muslims are not compelled or coerced by force into accepting Islam, based on Quran 2:256.",
    searchPhrases: [
      "تفسير لا إكراه في الدين",
      "معنى لا إكراه في الدين",
      "إكراه غير المسلم على الإسلام",
      "الدخول في الإسلام بالإكراه",
    ],
  },
  {
    id: "riba-categorical-prohibition",
    scholar: "ibn-baz",
    englishDescription: "Clear categorical prohibition of riba",
    exactPoint: "Riba is categorically forbidden in the Quran and Sunnah, and is one of the major destructive sins.",
    searchPhrases: [
      "حقيقة الربا وحكمه",
      "تحريم الربا وعظم خطره",
      "أدلة تحريم الربا",
      "حكم التعامل بالربا",
    ],
  },
  {
    id: "writing-documenting-debts",
    scholar: "ibn-baz",
    englishDescription: "Writing/documenting debts",
    exactPoint: "Documenting deferred debts in writing and with witnesses is prescribed by Quran 2:282 to preserve rights.",
    searchPhrases: [
      "ما حكم كتابة الدين",
      "كتابة الديون والشهادة عليها",
      "مشروعية كتابة الدين",
      "توثيق الدين بالكتابة",
    ],
  },
  {
    id: "divorce-limit-three",
    scholar: "ibn-baz",
    englishDescription: "Two revocable divorces, then final third divorce",
    exactPoint: "A husband has two revocable divorces; after the third, the wife is not lawful until she marries another husband.",
    searchPhrases: [
      "حكم من طلق زوجته ثلاث طلقات",
      "عدد الطلقات التي يملكها الزوج",
      "الطلاق مرتان فإمساك بمعروف",
      "ما عدد الطلقات",
    ],
  },
  {
    id: "widow-waiting-period",
    scholar: "ibn-baz",
    englishDescription: "Waiting period after widowhood: four months and ten days",
    exactPoint: "The waiting period ('iddah) for a woman whose husband passes away is four months and ten days unless pregnant.",
    searchPhrases: [
      "عدة المتوفى عنها زوجها أربعة أشهر وعشرا",
      "مدة عدة المتوفى عنها زوجها",
      "عدة المتوفى عنها زوجها وما يجب عليها",
      "عدة الوفاة أربعة أشهر وعشرا",
    ],
  },
  {
    id: "hajj-umrah-obligation",
    scholar: "ibn-baz",
    englishDescription: "Hajj and Umrah obligation",
    exactPoint: "Hajj is a pillar of Islam obligatory once in a lifetime upon the able, and Umrah is likewise obligatory.",
    searchPhrases: [
      "وجوب الحج والعمرة في العمر مرة",
      "فرضية الحج في العمر مرة",
      "الحج ركن من أركان الإسلام",
      "حكم الحج والعمرة على المستطيع",
    ],
  },
  {
    id: "hajj-conduct-prohibitions",
    scholar: "ibn-baz",
    englishDescription: "Conduct during Hajj: no sin, argument, or immorality",
    exactPoint: "The pilgrim in Ihram is commanded to refrain from obscenity, sin, and useless dispute (Quran 2:197).",
    searchPhrases: [
      "معنى الرفث والفسوق والجدال في الحج",
      "فلا رفث ولا فسوق ولا جدال في الحج",
      "اجتناب الرفث والفسوق في الحج",
      "محظورات الإحرام الأخلاقية",
    ],
  },
  {
    id: "fatiha-iyyaka-na'bud",
    scholar: "ibn-baz",
    englishDescription: "Meaning of 'You alone we worship and You alone we ask for help'",
    exactPoint: "We worship Allah alone without associating partners and seek assistance exclusively from Him.",
    searchPhrases: [
      "تفسير إياك نعبد وإياك نستعين",
      "معنى إياك نعبد وإياك نستعين",
      "إخلاص العبادة والاستعانة بالله",
      "إياك نعبد وإياك نستعين",
    ],
  },
  {
    id: "intention-in-worship",
    scholar: "ibn-baz",
    englishDescription: "Sincerity and intention in worship",
    exactPoint: "Intention (niyyah) in the heart is a required condition for the validity and acceptance of every act of worship.",
    searchPhrases: [
      "اشتراط النية لصحة العمل",
      "مكان النية وحكم التلفظ بها",
      "وجوب النية في العبادات",
      "معنى إنما الأعمال بالنيات",
    ],
  },
  {
    id: "five-pillars-in-order",
    scholar: "ibn-baz",
    englishDescription: "The five pillars of Islam in order",
    exactPoint: "The five pillars of Islam are the two testimonies, prayer, zakah, fasting Ramadan, and Hajj to the House.",
    searchPhrases: [
      "بيان أركان الإسلام الخمسة",
      "أركان الإسلام الخمسة بالترتيب",
      "بني الإسلام على خمس",
      "ما هي أركان الإسلام الخمسة",
    ],
  },
  {
    id: "zakah-gold-nisab",
    scholar: "ibn-baz",
    englishDescription: "Gold zakah: nisab and 2.5 percent",
    exactPoint: "The nisab for gold is 20 mithqals (85 grams) and the required zakah is one quarter of a tenth (2.5 percent).",
    searchPhrases: [
      "نصاب الذهب والفضة",
      "حكم زكاة الحلي من الذهب والفضة",
      "نصاب زكاة الذهب ومقدار الواجب",
      "مقدار زكاة الذهب ربع العشر",
    ],
  },

  // --- Ibn Uthaymeen (Targets 15 to 20) ---
  {
    id: "fasting-exemption-illness-travel",
    scholar: "ibn-uthaymeen",
    englishDescription: "Fasting exemption for illness and travel",
    exactPoint: "The ill person and the traveler are permitted to break their fast in Ramadan and make up the missed days later.",
    searchPhrases: [
      "المسافر مخير بين الصيام والفطر",
      "فطر المسافر",
      "صيام المريض والمسافر",
      "حكم إفطار المريض في رمضان",
    ],
  },
  {
    id: "ayat-al-kursi-meaning",
    scholar: "ibn-uthaymeen",
    englishDescription: "Explanation of Ayat al-Kursi and Allah's living, eternal attributes",
    exactPoint: "Ayat al-Kursi is the greatest verse, affirming Allah's exclusive divinity and His attributes of Life and Self-Subsistence.",
    searchPhrases: [
      "آية الكرسي الحي القيوم",
      "معنى آية الكرسي",
      "فضل آية الكرسي",
      "تفسير آية الكرسي",
    ],
  },
  {
    id: "charity-versus-riba",
    scholar: "ibn-uthaymeen",
    englishDescription: "Charity versus riba",
    exactPoint: "Allah destroys interest and deprives it of blessing, while He grows, blesses, and multiplies charity.",
    searchPhrases: [
      "يمحق الله الربا ويربي الصدقات",
      "الفرق بين الصدقة والربا",
      "مقارنة بين الربا والصدقة",
      "الربا والصدقات",
    ],
  },
  {
    id: "divorce-waiting-period-quru",
    scholar: "ibn-uthaymeen",
    englishDescription: "Divorce waiting period of three menstrual cycles",
    exactPoint: "The waiting period ('iddah) for a divorced woman who menstruates is three menstrual cycles (quru').",
    searchPhrases: [
      "أين تمكث المطلقة وكم عدتها",
      "عدة المطلقة ثلاثة قروء",
      "المطلقة تحيض كم عدتها",
      "عدة المطلقة ذوات الحيض",
    ],
  },
  {
    id: "fatiha-sirat-al-mustaqim",
    scholar: "ibn-uthaymeen",
    englishDescription: "Meaning of asking Allah for the Straight Path in al-Fatiha",
    exactPoint: "Seeking guidance to the Straight Path means requesting knowledge of the truth and divine aid to adhere to it.",
    searchPhrases: [
      "اهدنا الصراط المستقيم",
      "معنى الصراط المستقيم",
      "سورة الفاتحة الصراط المستقيم",
      "طلب الهداية إلى الصراط المستقيم",
    ],
  },
  {
    id: "tawhid-three-categories",
    scholar: "ibn-uthaymeen",
    englishDescription: "Clear concise definition of tawhid and its three categories",
    exactPoint: "Tawhid is singling out Allah in His Lordship (Rububiyyah), Worship (Uluhiyyah), and Names and Attributes (Asma wa Sifat).",
    searchPhrases: [
      "أقسام التوحيد الثلاثة",
      "تعريف التوحيد وأقسامه",
      "توحيد الربوبية والألوهية والأسماء والصفات",
      "معنى التوحيد",
    ],
  },
];
