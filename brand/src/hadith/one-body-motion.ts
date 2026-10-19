import type { OneBodyMotionProps } from "../OneBodyMotion";
import durations from "../../voiceover/one-body-tr.durations.json";
import words from "../../voiceover/one-body-tr.words.json";

// Video 06 (Turkish) "TEK VÜCUT". Sahih al-Bukhari 6011 (data/sunnah/bukhari-78-1.json),
// Turkish hadith text: HadeethEnc 4969. Ibn Baz: binbaz.org.sa/fatwas/2968 and /5228.
export const oneBodyMotionTr: OneBodyMotionProps = {
  id: "one-body",
  lang: "tr",
  durations,
  words,
  alias: { close: { share: ["paylaş", 0], deeds: ["etsin", 0] } },
  arabicLines: ["تَرَى الْمُؤْمِنِينَ فِي تَرَاحُمِهِمْ وَتَوَادِّهِمْ وَتَعَاطُفِهِمْ كَمَثَلِ الْجَسَدِ", "إِذَا اشْتَكَى عُضْوًا تَدَاعَى لَهُ سَائِرُ جَسَدِهِ بِالسَّهَرِ وَالْحُمَّى"],
  quote1: "الواجب على المسلمين أن يهتم بعضهم ببعض",
  quote2: ["ويدعون للمحتاجين أن يغيثهم الله من فضله، وأن يزيل شدتهم ويرحمهم برحمته", "لأن المسلمين شيء واحد وبناء واحد"],
};
