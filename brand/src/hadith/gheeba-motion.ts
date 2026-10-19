import type { GheebaMotionProps } from "../GheebaMotion";
import durations from "../../voiceover/gheeba-tr.durations.json";
import words from "../../voiceover/gheeba-tr.words.json";

// Video 18 (Turkish) "GIYBET". Sahih Muslim 2589 (data/sunnah/muslim-45-1.json),
// Turkish hadith text: HadeethEnc 5326. Ibn Uthaymeen: library source 8072391b.
export const gheebaMotionTr: GheebaMotionProps = {
  id: "gheeba",
  lang: "tr",
  durations,
  words,
  alias: { close: { share: ["paylaş", 0], deeds: ["etsin", 0] } },
  arabicLines: ["أَتَدْرُونَ مَا الْغِيبَةُ؟ قَالُوا: اللَّهُ وَرَسُولُهُ أَعْلَمُ. قَالَ: ذِكْرُكَ أَخَاكَ بِمَا يَكْرَهُ", "إِنْ كَانَ فِيهِ مَا تَقُولُ فَقَدِ اغْتَبْتَهُ، وَإِنْ لَمْ يَكُنْ فِيهِ فَقَدْ بَهَتَّهُ"],
  quote1: "الغيبة من كبائر الذنوب",
  quote2: ["فإن كان لم يعلم بذلك", "فإنه يكفي أن يستغفر له ويذكره بالخير في المجالس التي اغتابه فيها"],
};
