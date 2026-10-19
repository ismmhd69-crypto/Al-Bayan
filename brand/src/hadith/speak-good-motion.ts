import type { SpeakGoodMotionProps } from "../SpeakGoodMotion";
import durations from "../../voiceover/speak-good-en.durations.json";
import words from "../../voiceover/speak-good-en.words.json";

// Video 03 "Speak Good". Hadith: Sahih al-Bukhari 6018 (data/sunnah/bukhari-78-1.json).
// Ibn Baz: binbaz.org.sa/fatwas/23226 and binbaz.org.sa/fatwas/3349.
// Quote translations are stored AI drafts; Mo reviews before posting.
export const speakGoodMotion: SpeakGoodMotionProps = {
  id: "speak-good",
  lang: "en",
  durations,
  words,
  tx: {
    hookWords: "YOUR WORDS",
    hookUp: "LIFT YOU UP",
    hookDown: "BRING YOU DOWN",
    rumour: "rumour",
    idleChatter: "idle chatter",
    beneficial: "BENEFICIAL",
    virtueTitle: "Virtue of the Tongue",
    benefitsPeople: "BENEFITS PEOPLE",
    clarifiesTruth: "CLARIFIES TRUTH",
    reward: "REWARD",
    afflictionTitle: "Affliction of the Tongue",
    endlessChatter: "ENDLESS CHATTER",
    withoutBenefit: "WITHOUT BENEFIT",
    wastesTime: "WASTES TIME",
    narrator: "Narrated by Abu Huraira",
    stamp: "Sahih al-Bukhari 6018",
    line1: ["anybody", 0],
    line2: ["should", 0],
    stampWord: "reported",
  },
  arabicLines: [
    "مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ",
    "فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ",
  ],
  quote1: "المؤمن ينتقي، لا يحدث إلا بشيء ينتقيه، ينفع",
  quote2: [
    "الكلام الذي ينفع الناس، ويوضح الحق، وليس فيه كذب... هذا من فضائل اللسان، ومما يؤجر عليه الإنسان",
    "وإنما يكون من آفات اللسان إذا أكثر الكلام بدون فائدة، وأضاع الوقت على الناس",
  ],
};

// Turkish version. Hadith wording: HadeethEnc human translation 5437 (Bukhari 6018, the
// sentence about speech) and 5354 for the closing Muslim 1893. Ibn Baz lines are Claude's
// translation of his Arabic and must be checked by a Turkish speaker before posting.
import durationsTr from "../../voiceover/speak-good-tr.durations.json";
import wordsTr from "../../voiceover/speak-good-tr.words.json";

export const speakGoodMotionTr: SpeakGoodMotionProps = {
  ...speakGoodMotion,
  lang: "tr",
  durations: durationsTr,
  words: wordsTr,
  tx: {
    hookWords: "SÖZLERİN",
    hookUp: "YÜKSELTİR",
    hookDown: "ALÇALTIR",
    rumour: "dedikodu",
    idleChatter: "boş laf",
    beneficial: "FAYDALI",
    virtueTitle: "Dilin Fazileti",
    benefitsPeople: "İNSANLARA FAYDA",
    clarifiesTruth: "HAKKI AÇIKLAR",
    reward: "SEVAP",
    afflictionTitle: "Dilin Afeti",
    endlessChatter: "BİTMEYEN LAF",
    withoutBenefit: "FAYDASIZ",
    wastesTime: "VAKİT KAYBI",
    narrator: "Rivayet eden: Ebû Hureyre",
    stamp: "Sahih Buhârî 6018",
    line1: ["allaha", 0],
    line2: ["ya", 0],
    stampWord: "buhari",
  },
  alias: {
    hook: { words: ["sözlerin", 0], lift: ["yükseltebilir", 0], up: ["yükseltebilir", 0], bring: ["ya", 0], down: ["alçaltabilir", 0] },
    explain1: {
      believer: ["mümin", 0],
      selective: ["seçicidir", 0],
      does: ["ancak", 0],
      narrate: ["ancak", 0],
      selects: ["seçtiği", 0],
      beneficial: ["faydalı", 0],
    },
    explain2: {
      speech: ["insanlara", 0],
      benefits: ["fayda", 0],
      truth: ["hakkı", 0],
      virtues: ["faziletlerindendir", 0],
      rewarded: ["sevap", 0],
      affliction: ["afeti", 0],
      excessively: ["çok", 0],
      wastes: ["vaktini", 0],
    },
    close: { share: ["paylaş", 0], deeds: ["etsin", 0] },
  },
};
