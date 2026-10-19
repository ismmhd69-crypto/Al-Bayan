import type { ThreeDeedsMotionProps } from "../ThreeDeedsMotion";
import durations from "../../voiceover/three-deeds-tr.durations.json";
import words from "../../voiceover/three-deeds-tr.words.json";

// Video 19 (Turkish) "ÜÇ AMEL". Sahih Muslim 1631 (data/sunnah/muslim-25-1.json),
// Turkish hadith text: HadeethEnc 65566. Ibn Baz: binbaz.org.sa/fatwas/15526;
// Ibn Uthaymeen: library source dda9adaa (binothaimeen.net, tape 214).
export const threeDeedsMotionTr: ThreeDeedsMotionProps = {
  id: "three-deeds",
  lang: "tr",
  durations,
  words,
  alias: { close: { share: ["paylaş", 0], deeds: ["etsin", 0] } },
  arabicLines: ["إِذَا مَاتَ الإِنْسَانُ انْقَطَعَ عَنْهُ عَمَلُهُ إِلاَّ مِنْ ثَلاَثَةٍ", "إِلاَّ مِنْ صَدَقَةٍ جَارِيَةٍ أَوْ عِلْمٍ يُنْتَفَعُ بِهِ أَوْ وَلَدٍ صَالِحٍ يَدْعُو لَهُ"],
  quote1: ["صدقة جارية قد وقفها هو مثل وقف مسجد يصلى فيه", "يجري عليه أجرها بعد وفاته، ما دامت ينتفع بها الناس"],
  quote2: "أفضل شيء للأحياء والأموات الدعاء",
};
