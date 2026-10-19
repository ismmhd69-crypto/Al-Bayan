import type { TwoWordsMotionProps } from "../TwoWordsMotion";
import durations from "../../voiceover/two-words-tr.durations.json";
import words from "../../voiceover/two-words-tr.words.json";

// Video 16 (Turkish) "İKİ KELİME". Sahih al-Bukhari 6406 (data/sunnah/bukhari-80-2.json),
// Turkish hadith text: HadeethEnc 5507 (its bracketed meanings are not read aloud).
// Ibn Baz: binbaz.org.sa/fatwas/5171 and /28963.
export const twoWordsMotionTr: TwoWordsMotionProps = {
  id: "two-words",
  lang: "tr",
  durations,
  words,
  alias: { close: { share: ["paylaş", 0], deeds: ["etsin", 0] } },
  arabicLines: ["كَلِمَتَانِ خَفِيفَتَانِ عَلَى اللِّسَانِ، ثَقِيلَتَانِ فِي الْمِيزَانِ، حَبِيبَتَانِ إِلَى الرَّحْمَنِ", "سُبْحَانَ اللَّهِ الْعَظِيمِ، سُبْحَانَ اللَّهِ وَبِحَمْدِهِ"],
  quote1: ["أما من سبح بينه وبين نفسه فلا بأس بذلك", "بل فيه خير عظيم وثواب جزيل"],
  quote2: "الإكثار من ذكر الله والاستغفار من أعظم الأسباب في طمأنينة القلوب، وفي راحتها",
};
