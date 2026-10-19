import type { TawbaMotionProps } from "../TawbaMotion";
import durations from "../../voiceover/tawba-tr.durations.json";
import words from "../../voiceover/tawba-tr.words.json";

// Video 17 (Turkish) "TÖVBE". Sahih al-Bukhari 6309 (data/sunnah/bukhari-80-1.json),
// Turkish hadith text: HadeethEnc 4313 (first narration). Ibn Baz: binbaz.org.sa/fatwas/14345 and /21544.
export const tawbaMotionTr: TawbaMotionProps = {
  id: "tawba",
  lang: "tr",
  durations,
  words,
  alias: { close: { share: ["paylaş", 0], deeds: ["etsin", 0] } },
  arabicLines: ["اللَّهُ أَفْرَحُ بِتَوْبَةِ عَبْدِهِ", "مِنْ أَحَدِكُمْ سَقَطَ عَلَى بَعِيرِهِ، وَقَدْ أَضَلَّهُ فِي أَرْضِ فَلاَةٍ"],
  quote1: "توبة صادقة، مضمونها الندم على الماضي… والإقلاع من الذنب… والعزم الصادق ألا تعود فيه",
  quote2: "فإذا تاب توبةً صادقةً محا الله ذنوبه كلها سبحانه",
};
