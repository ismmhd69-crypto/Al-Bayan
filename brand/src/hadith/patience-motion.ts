import type { PatienceMotionProps } from "../PatienceMotion";
import durations from "../../voiceover/patience-tr.durations.json";
import words from "../../voiceover/patience-tr.words.json";

// Video 14 (Turkish) "İLK SARSINTI". Sahih al-Bukhari 1283 (data/sunnah/bukhari-23-1.json),
// Turkish hadith text: HadeethEnc 3295 (closing words of the woman "sen bunu anlamazsın" are
// HadeethEnc's gloss and are left out). Ibn Baz: binbaz.org.sa/fatwas/16935.
export const patienceMotionTr: PatienceMotionProps = {
  id: "patience",
  lang: "tr",
  durations,
  words,
  alias: { close: { share: ["paylaş", 0], deeds: ["etsin", 0] } },
  arabicLines: ["مَرَّ النَّبِيُّ ﷺ بِامْرَأَةٍ تَبْكِي عِنْدَ قَبْرٍ فَقَالَ: اتَّقِي اللَّهَ وَاصْبِرِي", "إِنَّمَا الصَّبْرُ عِنْدَ الصَّدْمَةِ الأُولَى"],
  quote1: "الصبر الذي فيه الثواب والأجر هو ما يحصل عند أول المصيبة",
  quote2: "يصبر ويحتسب، فلا يجزع، ولا يتكلم بسوء",
};
