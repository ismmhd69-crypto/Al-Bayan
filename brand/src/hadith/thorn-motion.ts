import type { ThornMotionProps } from "../ThornMotion";
import durations from "../../voiceover/thorn-tr.durations.json";
import words from "../../voiceover/thorn-tr.words.json";

// Video 11 (Turkish) "YOLDAKİ DİKEN". Sahih al-Bukhari 2472 (data/sunnah/bukhari-46-1.json),
// Turkish hadith text: HadeethEnc 6469. Ibn Baz: binbaz.org.sa/fatwas/14862;
// Ibn Uthaymeen: library source 025bb1ef (binothaimeen.net, tape 131).
export const thornMotionTr: ThornMotionProps = {
  id: "thorn",
  lang: "tr",
  durations,
  words,
  alias: { close: { share: ["paylaş", 0], deeds: ["etsin", 0] } },
  arabicLines: ["بَيْنَمَا رَجُلٌ يَمْشِي بِطَرِيقٍ، وَجَدَ غُصْنَ شَوْكٍ فَأَخَذَهُ", "فَشَكَرَ اللَّهُ لَهُ، فَغَفَرَ لَهُ"],
  quote1: "من شعب الإيمان إماطة الأذى عن الطريق",
  quote2: ["وقد أخبر النبي ﷺ أن إماطة الأذى عن الطريق صدقة", "وأن إعانتك الرجل صدقة"],
};
