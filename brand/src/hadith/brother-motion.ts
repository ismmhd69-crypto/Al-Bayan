import type { BrotherMotionProps } from "../BrotherMotion";
import durations from "../../voiceover/brother-tr.durations.json";
import words from "../../voiceover/brother-tr.words.json";

// Video 08 (Turkish) "KARDEŞİN İÇİN". Sahih al-Bukhari 13 (data/sunnah/bukhari-2-1.json),
// Turkish hadith text: HadeethEnc 66520. Ibn Uthaymeen: library source 43e8f539.
// The whole Arabic hadith is one line (Turkish word order differs), so the second line is empty.
export const brotherMotionTr: BrotherMotionProps = {
  id: "brother",
  lang: "tr",
  durations,
  words,
  alias: { close: { share: ["paylaş", 0], deeds: ["etsin", 0] } },
  arabicLines: ["لاَ يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ", ""],
  quote1: "لا يكمل إيمان العبد حتى يحب لأخيه ما يحب لنفسه من الخير الديني والدنيوي",
  quote2: ["وفي هذا الحديث: تحذير من الحسد", "الذي هو كراهة ما أنعم الله به على غيرك"],
};
