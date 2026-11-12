import type { SecretDuaMotionProps } from "../SecretDuaMotion";
import durations from "../../voiceover/secret-dua-en.durations.json";
import words from "../../voiceover/secret-dua-en.words.json";

// Video: "The Secret Prayer". Hadith: Sahih Muslim 2733.
// Ibn Uthaymeen: Sharh Riyad al-Salihin. Ibn Baz: binbaz.org.sa.
export const secretDuaMotion: SecretDuaMotionProps = {
  id: "secret-dua",
  lang: "en",
  durations,
  words,
  tx: {
    hook1: "AN ANGEL'S DUA",
    hook2: "JUST FOR YOU?",
    narrator: "Narrated by Abu ad-Darda",
    stamp: "Sahih Muslim 2733",
    line1: ["the", 1],
    line2: ["at", 0],
    stampWord: "reported",
  },
  arabicLines: [
    "دَعْوَةُ الْمَرْءِ الْمُسْلِمِ لِأَخِيهِ بِظَهْرِ الْغَيْبِ مُسْتَجَابَةٌ،",
    "عِنْدَ رَأْسِهِ مَلَكٌ مُوَكَّلٌ كُلَّمَا دَعَا لَهُ قَالَ: آمِينَ وَلَكَ بِمِثْلٍ",
  ],
  quote1: "الدُّعَاءُ لِلْأَخِ بِظَهْرِ الْغَيْبِ دَلِيلٌ عَلَى صِدْقِ الْمَحَبَّةِ وَالْإِخْلَاصِ",
  quote2: [
    "إِذَا دَعَوْتَ لِأَخِيكَ بِالْخَيْرِ وَالْهِدَايَةِ وَالشِّفَاءِ",
    "فَإِنَّ الْمَلَكَ يَدْعُو لَكَ بِمِثْلِ مَا دَعَوْتَ لَهُ",
  ],
};

