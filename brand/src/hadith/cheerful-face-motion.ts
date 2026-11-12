import type { CheerfulFaceMotionProps } from "../CheerfulFaceMotion";
import durations from "../../voiceover/cheerful-face-en.durations.json";
import words from "../../voiceover/cheerful-face-en.words.json";

// Video: "A Cheerful Face". Hadith: Sahih Muslim 2626.
// Ibn Uthaymeen: Sharh Riyad al-Salihin. Ibn Baz: binbaz.org.sa.
export const cheerfulFaceMotion: CheerfulFaceMotionProps = {
  id: "cheerful-face",
  lang: "en",
  durations,
  words,
  tx: {
    hook1: "CAN A SMILE",
    hook2: "BE WEIGHED?",
    narrator: "Narrated by Abu Dharr",
    stamp: "Sahih Muslim 2626",
    line1: ["do", 0],
    line2: ["even", 0],
    stampWord: "reported",
  },
  arabicLines: ["لَا تَحْقِرَنَّ مِنَ الْمَعْرُوفِ شَيْئًا،", "وَلَوْ أَنْ تَلْقَى أَخَاكَ بِوَجْهٍ طَلِيقٍ"],
  quote1: "إِنَّ لِقَاءَ النَّاسِ بِوَجْهٍ طَلِيقٍ يَجْلِبُ الْمَوَدَّةَ وَيُذْهِبُ الْعَدَاوَةَ",
  quote2: ["لَا تَحْقِرَنَّ شَيْئًا مِنَ الْخَيْرِ فَرُبَّ عَمَلٍ يُعَظِّمُهُ النَّيَّةُ", "وَإِدْخَالُ السُّرُورِ عَلَى الْمُسْلِمِ مِنْ أَعْظَمِ الْقُرُبَاتِ"],
};

