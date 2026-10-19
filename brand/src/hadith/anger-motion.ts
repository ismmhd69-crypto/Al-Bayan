import type { AngerMotionProps } from "../AngerMotion";
import durations from "../../voiceover/anger-en.durations.json";
import words from "../../voiceover/anger-en.words.json";

// Video 02 "True Strength". Hadith: Sahih al-Bukhari 6114 (data/sunnah/bukhari-78-2.json).
// Ibn Baz: binbaz.org.sa/fatwas/18877 (cites Sahih al-Bukhari 6115) and /15012.
// Quote translations are stored AI drafts; Mo reviews before posting.
export const angerMotion: AngerMotionProps = {
  id: "anger",
  lang: "en",
  durations,
  words,
  tx: {
    hook1: "WHO IS",
    hook2: "TRULY STRONG",
    dhikrMeaning: "“I seek refuge in Allah from the accursed Shaytan.”",
    pill6115: "Hadith: Sahih al-Bukhari 6115",
    wait: "DON'T RUSH",
    cards: ["LEAVE THE\nGATHERING", "MAKE\nWUDU", "READ THE\nQURAN"],
    narrator: "Narrated by Abu Huraira",
    stamp: "Sahih al-Bukhari 6114",
    line1: ["the", 1],
    line2: ["but", 0],
    stampWord: "reported",
  },
  arabicLines: ["لَيْسَ الشَّدِيدُ بِالصُّرَعَةِ،", "إِنَّمَا الشَّدِيدُ الَّذِي يَمْلِكُ نَفْسَهُ عِنْدَ الْغَضَبِ"],
  quote1: "النبي ﷺ لما رأى رجلًا اشتد به الغضب قال: إني لأعلم كلمة لو قالها لذهب عنه ما يجد",
  dhikr: "أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ",
  quote2: ["ولا تعجل في تنفيذ الغضب، واحذر أسبابه", "بالقيام من المجلس... بالاشتغال بالوضوء الشرعي... بقراءة القرآن"],
};

// Turkish version. Hadith wording: HadeethEnc human translations (5351 for Bukhari 6114,
// 3578 for Bukhari 6115, 5354 for the closing Muslim 1893). Ibn Baz lines are Claude's
// translation of his Arabic and must be checked by a Turkish speaker before posting.
import durationsTr from "../../voiceover/anger-tr.durations.json";
import wordsTr from "../../voiceover/anger-tr.words.json";

export const angerMotionTr: AngerMotionProps = {
  ...angerMotion,
  lang: "tr",
  durations: durationsTr,
  words: wordsTr,
  tx: {
    hook1: "GERÇEKTEN GÜÇLÜ",
    hook2: "OLAN KİM",
    dhikrMeaning: "«Şeytan'dan Allah'a sığınırım.»",
    pill6115: "Hadis: Sahih Buhârî 6115",
    wait: "ACELE ETME",
    cards: ["MECLİSTEN\nKALK", "ABDEST\nAL", "KUR'AN\nOKU"],
    narrator: "Rivayet eden: Ebû Hureyre",
    stamp: "Sahih Buhârî 6114",
    line1: ["gerçek", 0],
    line2: ["öfkelendiği", 0],
    stampWord: "buhari",
  },
  alias: {
    hook: { who: ["gerçekten", 0], truly: ["olan", 0], strong: ["kim", 0] },
    explain1: {
      when: ["peygamber", 0],
      intensely: ["şiddetlenen", 0],
      angry: ["adamı", 0],
      "i#0": ["öyle", 0],
      "i#1": ["eğer", 1],
      refuge: ["sığınırım", 0],
    },
    explain2: {
      do: ["öfkeni", 0],
      hasty: ["acele", 0],
      beware: ["sebeplerinden", 0],
      leaving: ["meclisten", 0],
      occupying: ["abdest", 0],
      reading: ["kuran", 0],
    },
    close: { share: ["paylaş", 0], deeds: ["etsin", 0] },
  },
};
