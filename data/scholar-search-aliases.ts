// Deterministic scholar search alias registry.
// Search metadata only: never displayed to visitors and never used as religious evidence.
// Helps bridge visitor/AI phrasing to formal scholar fatwa title patterns.

export type ScholarSearchAlias = {
  id: string;
  triggerPhrases: string[];
  triggerStems: string[];
  requiredContextStems?: string[];
  negativeStems?: string[];
  expansions: string[];
  reason: string;
  expectedTitleWording: string;
};

export const SCHOLAR_SEARCH_ALIASES: readonly ScholarSearchAlias[] = [
  {
    id: "fajr-cutoff-eating",
    triggerPhrases: [
      "الإمساك عن الطعام",
      "الأكل والشرب للصائم",
      "وقت الإمساك",
      "انتهاء وقت السحور",
      "الأكل بعد طلوع الفجر",
    ],
    triggerStems: ["امساك", "سحور"],
    requiredContextStems: ["صوم", "اكل", "شرب", "طعام", "مفطر", "امساك", "سحور"],
    expansions: [
      "أكل بعد طلوع الفجر",
      "طلوع الفجر بطل صومه",
    ],
    reason: "Connects morning fasting cutoff, suhoor end, and dawn eating queries to the formal scholar fatwa on eating after the appearance of dawn.",
    expectedTitleWording: "إذا أكل بعد طلوع الفجر بطل صومه",
  },
  {
    id: "qibla-facing-prayer",
    triggerPhrases: [
      "اتجاه القبلة",
      "اتجاه الصلاة",
      "استقبال القبلة",
      "استقبال الكعبة",
    ],
    triggerStems: ["قبله", "كعبه"],
    expansions: [
      "استقبال القبلة في الصلاة",
    ],
    reason: "Connects general prayer direction and Kaaba facing queries to the formal fiqh title phrase for receiving/facing the Qibla in prayer.",
    expectedTitleWording: "حكم استقبال القبلة في الصلاة في السفر",
  },
  {
    id: "riba-banking-interest",
    triggerPhrases: [
      "الفوائد البنكية",
      "فوائد البنوك",
      "التعامل بالربا",
      "أخذ الفائدة",
    ],
    triggerStems: ["ربا"],
    expansions: [
      "التعامل مع البنوك بالربا",
      "الفوائد الربوية",
    ],
    reason: "Connects general usury, bank interest, and philosophical reason queries to the specific scholar ruling on commercial bank interest transactions.",
    expectedTitleWording: "حكم التعامل مع البنوك بالربا وزكاتها",
  },
  {
    id: "widowhood-waiting-period",
    triggerPhrases: [
      "عدة الوفاة",
      "المتوفى عنها زوجها",
      "عدة المتوفى عنها زوجها",
      "وفاة الزوج",
      "أحكام المعتدة",
      "عدة الارملة",
      "عدة الأرملة",
    ],
    triggerStems: ["ارمله"],
    expansions: [
      "المعتدة عدة وفاة",
      "أحكام المعتدة عدة وفاة",
    ],
    reason: "Connects widow and deceased-husband waiting period wording to the formal fatwa title for a woman observing the post-death waiting period.",
    expectedTitleWording: "أحكام المعتدة عدة وفاة",
  },
  {
    id: "intention-in-worship",
    triggerPhrases: [
      "الأعمال بالنيات",
      "إنما الأعمال بالنيات",
      "شروط صحة العبادة",
      "صحة العبادات بالنية",
      "النية في العبادة",
    ],
    triggerStems: ["نيه"],
    expansions: [
      "محل النية",
      "حكم التلفظ بالنية",
    ],
    reason: "Connects hadith phrases and general intention conditions to the specific scholar ruling on the locus of intention and verbal pronunciation.",
    expectedTitleWording: "محل النية وحكم التلفظ بها",
  },
] as const;
