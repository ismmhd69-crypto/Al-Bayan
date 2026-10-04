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
  arabicLines: ["لَيْسَ الشَّدِيدُ بِالصُّرَعَةِ،", "إِنَّمَا الشَّدِيدُ الَّذِي يَمْلِكُ نَفْسَهُ عِنْدَ الْغَضَبِ"],
  quote1: "النبي ﷺ لما رأى رجلًا اشتد به الغضب قال: إني لأعلم كلمة لو قالها لذهب عنه ما يجد",
  dhikr: "أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ",
  quote2: ["ولا تعجل في تنفيذ الغضب، واحذر أسبابه", "بالقيام من المجلس... بالاشتغال بالوضوء الشرعي... بقراءة القرآن"],
};
