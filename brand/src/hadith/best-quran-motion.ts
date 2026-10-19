import type { BestQuranMotionProps } from "../BestQuranMotion";
import durations from "../../voiceover/best-quran-tr.durations.json";
import words from "../../voiceover/best-quran-tr.words.json";

// Video 05 (Turkish) "EN HAYIRLINIZ". Sahih al-Bukhari 5027 (data/sunnah/bukhari-66-1.json),
// Turkish hadith text: HadeethEnc 5913. Ibn Baz: binbaz.org.sa/fatwas/1696 and /3536.
export const bestQuranMotionTr: BestQuranMotionProps = {
  id: "best-quran",
  lang: "tr",
  durations,
  words,
  alias: { close: { share: ["paylaş", 0], deeds: ["etsin", 0] } },
  arabicLines: ["خَيْرُكُمْ", "مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ"],
  quote1: "فخيار الناس هم أهل القرآن الذين تعلموه وعلموه الناس، وعملوا به",
  quote2: ["فتعليم كتاب الله من أفضل القربات، ومن أفضل الطاعات", "المقصود من ذلك العمل به والأخذ بما فيه والاستقامة عليه"],
};
