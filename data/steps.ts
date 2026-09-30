import type { Locale } from "@/lib/i18n";

type Text = Record<Locale, string>;

export type Step = {
  id: string;
  title: Text;
  text: Text;
  // Either a Hard questions topic to read, or a question to hand to Ask.
  topicId?: string;
  // Or a prepared answer (data/prepared-answers) shown on /[lang]/answers/[id].
  answerId?: string;
  question?: Text;
};

export const steps: Step[] = [
  {
    id: "purpose",
    title: { en: "Why are we here?", de: "Warum sind wir hier?", ar: "لماذا خُلقنا؟" },
    text: {
      en: "What the Quran says about the purpose of a human life.",
      de: "Was der Koran über den Sinn des menschlichen Lebens sagt.",
      ar: "ما يقوله القرآن عن الغاية من حياة الإنسان.",
    },
    topicId: "purpose",
  },
  {
    id: "allah",
    title: { en: "Who is Allah?", de: "Wer ist Allah?", ar: "من هو الله؟" },
    text: {
      en: "The One God, and the question of who made Him.",
      de: "Der eine Gott, und die Frage, wer Ihn erschaffen hat.",
      ar: "الإله الواحد، وسؤال: من خلقه؟",
    },
    topicId: "who-created",
  },
  {
    id: "quran",
    title: { en: "Can the Quran be trusted?", de: "Kann man dem Koran vertrauen?", ar: "هل يمكن الوثوق بالقرآن؟" },
    text: {
      en: "How the Quran was preserved from the time of the Prophet.",
      de: "Wie der Koran seit der Zeit des Propheten bewahrt wurde.",
      ar: "كيف حُفظ القرآن منذ زمن النبي ﷺ.",
    },
    topicId: "quran-preserved",
  },
  {
    id: "prophet",
    title: { en: "Who was the Prophet Muhammad ﷺ?", de: "Wer war der Prophet Muhammad ﷺ?", ar: "من هو النبي محمد ﷺ؟" },
    text: {
      en: "His life, his character and his message.",
      de: "Sein Leben, sein Charakter und seine Botschaft.",
      ar: "سيرته وأخلاقه ورسالته.",
    },
    answerId: "prophet-muhammad",
    question: {
      en: "Who was the Prophet Muhammad?",
      de: "Wer war der Prophet Muhammad?",
      ar: "من هو النبي محمد ﷺ؟",
    },
  },
  {
    id: "pillars",
    title: { en: "The five pillars", de: "Die fünf Säulen", ar: "أركان الإسلام الخمسة" },
    text: {
      en: "The five acts of worship at the heart of Islam.",
      de: "Die fünf gottesdienstlichen Handlungen im Herzen des Islam.",
      ar: "العبادات الخمس التي هي أساس الإسلام.",
    },
    answerId: "five-pillars",
    question: {
      en: "What are the five pillars of Islam?",
      de: "Was sind die fünf Säulen des Islam?",
      ar: "ما هي أركان الإسلام الخمسة؟",
    },
  },
  {
    id: "reason",
    title: { en: "Faith and reason", de: "Glaube und Vernunft", ar: "الإيمان والعقل" },
    text: {
      en: "Why Islam asks you to think, not to follow blindly.",
      de: "Warum der Islam zum Nachdenken auffordert, nicht zum blinden Folgen.",
      ar: "لماذا يدعوك الإسلام إلى التفكر لا إلى التقليد الأعمى.",
    },
    topicId: "faith-reason",
  },
];
