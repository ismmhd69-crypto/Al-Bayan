import type { TruthMotionProps } from "../TruthMotion";
import durations from "../../voiceover/truth-tr.durations.json";
import words from "../../voiceover/truth-tr.words.json";

// Video 15 (Turkish) "DOĞRULUK". Sahih al-Bukhari 6094 (data/sunnah/bukhari-78-2.json),
// Turkish hadith text: HadeethEnc 5504 without its two commands from Muslim's wording.
// Ibn Baz: binbaz.org.sa/fatwas/20267.
export const truthMotionTr: TruthMotionProps = {
  id: "truth",
  lang: "tr",
  durations,
  words,
  alias: { close: { share: ["paylaş", 0], deeds: ["etsin", 0] } },
  arabicLines: ["إِنَّ الصِّدْقَ يَهْدِي إِلَى الْبِرِّ، وَإِنَّ الْبِرَّ يَهْدِي إِلَى الْجَنَّةِ، وَإِنَّ الرَّجُلَ لَيَصْدُقُ حَتَّى يَكُونَ صِدِّيقًا", "وَإِنَّ الْكَذِبَ يَهْدِي إِلَى الْفُجُورِ، وَإِنَّ الْفُجُورَ يَهْدِي إِلَى النَّارِ، وَإِنَّ الرَّجُلَ لَيَكْذِبُ حَتَّى يُكْتَبَ عِنْدَ اللَّهِ كَذَّابًا"],
  quote1: ["المؤمن الصادق لا يكذب", "ولكن قد يكذب لنقص إيمانه وضعف إيمانه"],
  quote2: "فالواجب على كل مؤمن أن يحذر الكذب، ينبغي أن يتحرى الصدق",
};
