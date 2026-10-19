import type { DogMotionProps } from "../DogMotion";
import durations from "../../voiceover/dog-tr.durations.json";
import words from "../../voiceover/dog-tr.words.json";

// Video 10 (Turkish) "SUSUZ KÖPEK". Sahih al-Bukhari 2363 (data/sunnah/bukhari-42-1.json),
// Turkish hadith text: HadeethEnc 10100 (first narration). Ibn Baz: binbaz.org.sa/fatwas/17674.
// The scroll shows two key Arabic phrases of the hadith (end of the story, and the lesson).
export const dogMotionTr: DogMotionProps = {
  id: "dog",
  lang: "tr",
  durations,
  words,
  alias: { close: { share: ["paylaş", 0], deeds: ["etsin", 0] } },
  arabicLines: ["فَمَلأَ خُفَّهُ ثُمَّ أَمْسَكَهُ بِفِيهِ، ثُمَّ رَقِيَ، فَسَقَى الْكَلْبَ فَشَكَرَ اللَّهُ لَهُ، فَغَفَرَ لَهُ", "فِي كُلِّ كَبِدٍ رَطْبَةٍ أَجْرٌ"],
  quote1: "ونحن مأمورون بالرفق بالحيوان",
  quote2: "وعدم إيذائه، وعدم ظلمه، وعدم ضربه، إلا من حاجة",
};
