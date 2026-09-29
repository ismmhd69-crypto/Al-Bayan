// Search hints for common general questions. These are not rulings or approved answer packages.
// Every resolved passage still passes source rules, context checks and independent selection.
export type TopicHint = {
  id: string;
  match: RegExp[]; // every pattern must match the visitor's question; never sent to a source
  exclude?: RegExp[];
  quran: string[];
  hadith: string[]; // HadeethEnc ids, checked against the Sahihayn rules after fetching
  fatwas: string[]; // exact official-page URLs, checked and parsed again when fetched
};

const BAZ = "https://binbaz.org.sa/fatwas";
export const TOPIC_SOURCE_HINTS: TopicHint[] = [
  { id: "fasting-obligation", match: [/رمضان|ramadan/i, /فرض|واجب|compulsory|obligat|pflicht/i, /صيام|صوم|fast/i], quran: ["2:183", "2:185"], hadith: [], fatwas: [] },
  { id: "fasting-exemption", match: [/صيام|صوم|fast/i, /مريض|مرض|مسافر|سفر|sick|ill|travel|krank|reis/i], quran: ["2:184", "2:185"], hadith: [], fatwas: [] },
  { id: "fasting-dawn", match: [/صيام|صوم|fast/i, /فجر|ليل|أكل|شرب|dawn|night|eat|drink|morgen|nacht|essen|trink/i], quran: ["2:187"], hadith: [], fatwas: [] },
  { id: "qibla", match: [/قبل|qibla|mekka|mecca|مكة/i, /صلا|pray|beten|direction|richtung|وجه/i], quran: ["2:144"], hadith: [], fatwas: [] },
  { id: "ayat-kursi", match: [/كرسي|kursi|throne verse/i], quran: ["2:255"], hadith: [], fatwas: [] },
  { id: "no-compulsion", match: [/إكراه|إجبار|\bforced?\b|\bcompulsion\b|zwang|gezwungen/i, /دين|إسلام|islam|muslim|religion|glauben/i], quran: ["2:256"], hadith: [], fatwas: [] },
  { id: "riba-ruling", match: [/ربا|riba|interest|zinsen/i, /حكم|حرام|حلال|allowed|permitted|verbot|erlaub/i], quran: ["2:275"], hadith: [], fatwas: [] },
  { id: "charity-and-riba", match: [/صدقات|صدقة|charit|spenden/i, /ربا|riba|usury|interest|zinsen/i], quran: ["2:276"], hadith: [], fatwas: [] },
  { id: "debt-writing", match: [/دين|ديون|debt|loan|schuld/i, /كتاب|كتابة|write|record|contract|vertrag|schreib/i], quran: ["2:282"], hadith: [], fatwas: [] },
  { id: "divorce-count", match: [/طلاق|divorc|scheid/i, /كم مرة|مرتين|how many|wie oft|times/i], quran: ["2:229"], hadith: [], fatwas: [] },
  { id: "divorce-waiting", match: [/طلاق|divorc|scheid/i, /عدة|انتظار|waiting|wait|warte/i], quran: ["2:228"], hadith: [], fatwas: [] },
  { id: "widow-waiting", match: [/وفاة|أرملة|widow|husband dies|verwitw/i, /عدة|انتظار|waiting|wait|warte/i], quran: ["2:234"], hadith: [], fatwas: [] },
  { id: "hajj-completion", match: [/حج|عمرة|hajj|umrah|hadsch/i, /واجب|فرض|complete|finish|vollend|pflicht/i], quran: ["2:196"], hadith: [], fatwas: [] },
  { id: "hajj-conduct", match: [/حج|hajj|hadsch/i, /فسوق|جدال|رفث|conduct|argu|disput|streit|verhalt/i], quran: ["2:197"], hadith: [], fatwas: [] },
  { id: "fatiha-guidance", match: [/فاتحة|fatiha/i, /هد|guide|guidance|führ|leit/i], quran: ["1:6"], hadith: [], fatwas: [] },
  { id: "fatiha-worship", match: [/فاتحة|fatiha/i, /نعبد|نستعين|worship|help|anbet|hilfe/i], quran: ["1:5"], hadith: [], fatwas: [] },
  { id: "intentions", match: [/نية|نيات|intention|absicht/i, /حديث|نبي|prophet|hadith|taten|deeds|action/i], quran: [], hadith: ["HE66511"], fatwas: [] },
  { id: "five-pillars", match: [/أركان الإسلام|pillars of islam|säulen des islam/i], quran: [], hadith: ["HE66512"], fatwas: [] },
  { id: "polygyny-limit", match: [/زوجات|نساء|wives|ehefrauen/i, /كم|عدد|how many|wie viele/i], quran: ["4:3"], hadith: [], fatwas: [] },
  { id: "inheritance-children", match: [/ميراث|ورث|inherit|erbe/i, /أبناء|أولاد|children|sons|daughters|kinder/i], quran: ["4:11"], hadith: [], fatwas: [] },
  { id: "wudu-verse", match: [/وضوء|wudu|ablution|waschung/i, /مائدة|maida|quran|koran|قرآن|آية/i], quran: ["5:6"], hadith: [], fatwas: [] },
  { id: "theft-verse", match: [/سرق|theft|steal|diebstahl/i, /مائدة|maida|quran|koran|قرآن|آية|punishment|عقوبة|strafe/i], quran: ["5:38"], hadith: [], fatwas: [] },
  { id: "zakat-recipients", match: [/زكاة|zakat/i, /مصارف|مستحق|recipients|categories|empfänger|kategorien/i], quran: ["9:60"], hadith: [], fatwas: [] },
  { id: "gold-zakat-rate", match: [/ذهب|gold/i, /زكاة|zakat/i, /مقدار|نسبة|how much|rate|wie viel/i], quran: [], hadith: [], fatwas: [`${BAZ}/5743/مقدار-الزكاة-في-خمسة-وثمانين-جرامًا-من-الذهب`] },
  { id: "repentance-steps", match: [/توب|repent|bereu/i, /كيف|how|wie|شروط|steps/i], quran: [], hadith: [], fatwas: [`${BAZ}/18217/هل-يكفي-الندم-على-الذنب-والإقلاع-عنه-في-التوبة؟`] },
  { id: "conversion", match: [/مسلم|إسلام|muslim|islam/i, /أصبح|أسلم|الدخول|become|convert|werden|konvertieren/i, /كيف|كيفية|how|what should|was muss|wie werde|wie kann/i], exclude: [/إكراه|إجبار|\bforced?\b|gezwungen|zwang/i], quran: [], hadith: ["HE66512"], fatwas: [`${BAZ}/1158/وجوب-التصديق-مع-الشهادتين`, `${BAZ}/18975/ما-معنى-الشهادتين`] },
  { id: "fasting-purpose", match: [/رمضان|ramadan/i, /صيام|صوم|fast/i, /لماذا|why|warum|حكمة/i], quran: ["2:183"], hadith: [], fatwas: [] },
  { id: "prayer-timing", match: [/صلا|prayer|gebet/i, /وقت|أوقات|time|zeiten/i], quran: ["4:103", "11:114", "17:78"], hadith: [], fatwas: [] },
  { id: "marriage-justice", match: [/زوجات|نساء|wives|ehefrauen/i, /عدل|justice|fair|gerecht/i], quran: ["4:3", "4:129"], hadith: [], fatwas: [] },
  { id: "sincere-repentance", match: [/توب|repent|bereu/i, /نصوح|sincere|aufrichtig/i], quran: ["66:8"], hadith: [], fatwas: [] },
];

export function matchingTopicHints(question: string): TopicHint[] {
  return TOPIC_SOURCE_HINTS.filter((topic) => topic.match.every((pattern) => pattern.test(question))
    && !(topic.exclude ?? []).some((pattern) => pattern.test(question)));
}
