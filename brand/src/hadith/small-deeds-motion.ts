import type { SmallDeedsMotionProps } from "../SmallDeedsMotion";
import durations from "../../voiceover/small-deeds-en.durations.json";
import words from "../../voiceover/small-deeds-en.words.json";

// Video: "Small But Daily". Hadith: Sahih al-Bukhari 6464 & Sahih Muslim 783.
// Ibn Baz: binbaz.org.sa. Ibn Uthaymeen: Sharh Riyad al-Salihin.
export const smallDeedsMotion: SmallDeedsMotionProps = {
  id: "small-deeds",
  lang: "en",
  durations,
  words,
  tx: {
    hook1: "ONE HUGE DEED",
    hook2: "OR A SMALL HABIT?",
    narrator: "Narrated by Aisha",
    stamp: "Sahih al-Bukhari 6464",
    line1: ["the", 1],
    line2: ["even", 0],
    stampWord: "reported",
  },
  arabicLines: ["أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا،", "وَإِنْ قَلَّ"],
  quote1: "مُدَاوَمَةُ الْعَبْدِ عَلَى الْعَمَلِ الصَّالِحِ تَصِلُ قَلْبَهُ بِاللَّهِ دَائِمًا",
  quote2: [
    "الْعَمَلُ الْقَلِيلُ الْمُسْتَمِرُّ خَيْرٌ مِنْ كَثِيرٍ مُنْقَطِعٍ",
    "كَرَكْعَتَيِ الضُّحَى أَوْ قِرَاءَةِ صَفْحَةٍ مِنَ الْقُرْآنِ كُلَّ يَوْمٍ",
  ],
};

