import type { Locale } from "@/lib/i18n";

type Text = Record<Locale, string>;

export type CategoryId = "belief" | "science" | "preservation" | "women" | "history";

export type Topic = {
  id: string;
  category: CategoryId;
  title: Text;
  question: Text;
  related: string[];
};

export const categoryOrder: CategoryId[] = ["belief", "science", "preservation", "women", "history"];

// Titles and questions only. The answers are written in phase 2 from approved sources.
export const topics: Topic[] = [
  {
    id: "purpose",
    category: "belief",
    title: { en: "Why am I here?", de: "Warum bin ich hier?", ar: "لماذا أنا هنا؟" },
    question: {
      en: "What is the purpose of life in Islam?",
      de: "Was ist der Sinn des Lebens im Islam?",
      ar: "ما الغاية من الحياة في الإسلام؟",
    },
    related: ["who-created", "suffering"],
  },
  {
    id: "who-created",
    category: "belief",
    title: { en: "Who made God?", de: "Wer hat Gott erschaffen?", ar: "من خلق الله؟" },
    question: {
      en: "If everything has a creator, who created God?",
      de: "Wenn alles einen Schöpfer hat, wer hat dann Gott erschaffen?",
      ar: "إذا كان لكل شيء خالق، فمن خلق الله؟",
    },
    related: ["purpose", "faith-reason"],
  },
  {
    id: "suffering",
    category: "belief",
    title: { en: "Why is there suffering?", de: "Warum gibt es Leid?", ar: "لماذا يوجد الألم؟" },
    question: {
      en: "If God is good, why is there suffering?",
      de: "Wenn Gott gut ist, warum gibt es dann Leid?",
      ar: "إذا كان الله رحيمًا، فلماذا يوجد الألم والمعاناة؟",
    },
    related: ["purpose", "never-heard"],
  },
  {
    id: "doubt",
    category: "belief",
    title: { en: "Doubt and faith", de: "Zweifel und Glaube", ar: "الشك والإيمان" },
    question: {
      en: "I have doubts. Does that make me a bad Muslim?",
      de: "Ich habe Zweifel. Bin ich deshalb ein schlechter Muslim?",
      ar: "عندي شكوك. هل هذا يجعلني مسلمًا سيئًا؟",
    },
    related: ["faith-reason", "who-created"],
  },
  {
    id: "faith-reason",
    category: "science",
    title: { en: "Faith and reason", de: "Glaube und Vernunft", ar: "الإيمان والعقل" },
    question: {
      en: "Does Islam ask us to believe blindly?",
      de: "Verlangt der Islam, blind zu glauben?",
      ar: "هل يطلب الإسلام منا أن نؤمن إيمانًا أعمى؟",
    },
    related: ["evolution", "doubt"],
  },
  {
    id: "evolution",
    category: "science",
    title: { en: "Evolution and Adam", de: "Evolution und Adam", ar: "التطور وآدم" },
    question: {
      en: "What does Islam say about evolution and the creation of Adam?",
      de: "Was sagt der Islam über Evolution und die Erschaffung Adams?",
      ar: "ماذا يقول الإسلام عن التطور وخلق آدم؟",
    },
    related: ["faith-reason", "who-created"],
  },
  {
    id: "quran-preserved",
    category: "preservation",
    title: { en: "Was the Quran preserved?", de: "Wurde der Koran bewahrt?", ar: "هل حُفظ القرآن؟" },
    question: {
      en: "How do we know the Quran was not changed?",
      de: "Woher wissen wir, dass der Koran nicht verändert wurde?",
      ar: "كيف نعرف أن القرآن لم يُحرَّف؟",
    },
    related: ["hadith-late"],
  },
  {
    id: "hadith-late",
    category: "preservation",
    title: { en: "When were hadith written?", de: "Wann wurden Hadithe aufgeschrieben?", ar: "متى دُوّن الحديث؟" },
    question: {
      en: "Were hadith only written down 200 years after the Prophet?",
      de: "Wurden Hadithe erst 200 Jahre nach dem Propheten aufgeschrieben?",
      ar: "هل دُوّن الحديث بعد النبي بمئتي سنة فقط؟",
    },
    related: ["quran-preserved"],
  },
  {
    id: "women-spiritual",
    category: "women",
    title: { en: "Men and women before God", de: "Mann und Frau vor Gott", ar: "الرجل والمرأة عند الله" },
    question: {
      en: "Are men and women equal before God in Islam?",
      de: "Sind Männer und Frauen im Islam vor Gott gleich?",
      ar: "هل الرجل والمرأة سواء عند الله في الإسلام؟",
    },
    related: ["inheritance"],
  },
  {
    id: "inheritance",
    category: "women",
    title: { en: "Inheritance", de: "Erbrecht", ar: "الميراث" },
    question: {
      en: "Why does a woman sometimes inherit less than a man?",
      de: "Warum erbt eine Frau manchmal weniger als ein Mann?",
      ar: "لماذا ترث المرأة أحيانًا أقل من الرجل؟",
    },
    related: ["women-spiritual"],
  },
  {
    id: "never-heard",
    category: "history",
    title: { en: "Those who never heard", de: "Wer nie davon hörte", ar: "من لم تبلغه الدعوة" },
    question: {
      en: "What happens to people who never heard of Islam?",
      de: "Was geschieht mit Menschen, die nie vom Islam gehört haben?",
      ar: "ما حكم من لم يسمع بالإسلام؟",
    },
    related: ["suffering", "sword"],
  },
  {
    id: "sword",
    category: "history",
    title: { en: "Spread by the sword?", de: "Mit dem Schwert verbreitet?", ar: "هل انتشر الإسلام بالسيف؟" },
    question: {
      en: "Was Islam spread by the sword?",
      de: "Wurde der Islam mit dem Schwert verbreitet?",
      ar: "هل انتشر الإسلام بالسيف؟",
    },
    related: ["never-heard"],
  },
];

export function getTopic(id: string): Topic | undefined {
  return topics.find((t) => t.id === id);
}

// Shown as quick buttons on Home and in an empty Ask screen.
export const popularTopicIds = ["purpose", "quran-preserved", "suffering", "sword"];
