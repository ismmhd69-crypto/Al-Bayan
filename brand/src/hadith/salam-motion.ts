import type { SalamMotionProps } from "../SalamMotion";
import durations from "../../voiceover/salam-tr.durations.json";
import words from "../../voiceover/salam-tr.words.json";

// Video 07 (Turkish) "SELAMI YAYIN". Sahih Muslim 54 (data/sunnah/muslim-1-2.json),
// Turkish hadith text: HadeethEnc 3361. Ibn Baz: binbaz.org.sa/fatwas/22274.
export const salamMotionTr: SalamMotionProps = {
  id: "salam",
  lang: "tr",
  durations,
  words,
  alias: { close: { share: ["paylaş", 0], deeds: ["etsin", 0] } },
  arabicLines: ["لاَ تَدْخُلُونَ الْجَنَّةَ حَتَّى تُؤْمِنُوا وَلاَ تُؤْمِنُوا حَتَّى تَحَابُّوا", "أَوَلاَ أَدُلُّكُمْ عَلَى شَىْءٍ إِذَا فَعَلْتُمُوهُ تَحَابَبْتُمْ أَفْشُوا السَّلاَمَ بَيْنَكُمْ"],
  quote1: "ينبغي للمؤمن ألا يبخل بالبداءة، فيبادر بالسلام، هذه هي السنة للمؤمن",
  quote2: ["فعلى الإنسان أن يبادر به", "أمَّا الرد فهو واجب"],
};
