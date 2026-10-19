import type { NearMotionProps } from "../NearMotion";
import durations from "../../voiceover/near-tr.durations.json";
import words from "../../voiceover/near-tr.words.json";

// Video 20 (Turkish) "CENNET YAKIN". Sahih al-Bukhari 6488 (data/sunnah/bukhari-81-1.json),
// Turkish hadith text: HadeethEnc 3581. Ibn Baz: binbaz.org.sa/fatwas/10156.
export const nearMotionTr: NearMotionProps = {
  id: "near",
  lang: "tr",
  durations,
  words,
  alias: { close: { share: ["paylaş", 0], deeds: ["etsin", 0] } },
  arabicLines: ["الْجَنَّةُ أَقْرَبُ إِلَى أَحَدِكُمْ مِنْ شِرَاكِ نَعْلِهِ", "وَالنَّارُ مِثْلُ ذَلِكَ"],
  quote1: ["فذكر الموت فيه مصالح", "ومن أسباب الاستعداد للآخرة، والتأهب للقاء الله"],
  quote2: ["فيستحب للمسلم أن يكثر ذكر الموت، وأن يكون على باله", "حتى يعد العدة لآخرته"],
};
