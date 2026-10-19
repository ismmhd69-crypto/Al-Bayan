import type { TreeMotionProps } from "../TreeMotion";
import durations from "../../voiceover/tree-tr.durations.json";
import words from "../../voiceover/tree-tr.words.json";

// Video 09 (Turkish) "AĞAÇ DİK". Sahih al-Bukhari 2320 (data/sunnah), Turkish text: HadeethEnc 3911
// (third narration; HadeethEnc says "insan, hayvan ve bir şey", the Arabic says bird, human or animal).
// Ibn Baz: binbaz.org.sa/fatwas/8126.
export const treeMotionTr: TreeMotionProps = {
  id: "tree",
  lang: "tr",
  durations,
  words,
  alias: { close: { share: ["paylaş", 0], deeds: ["etsin", 0] } },
  arabicLines: ["مَا مِنْ مُسْلِمٍ يَغْرِسُ غَرْسًا، أَوْ يَزْرَعُ زَرْعًا", "فَيَأْكُلُ مِنْهُ طَيْرٌ أَوْ إِنْسَانٌ أَوْ بَهِيمَةٌ، إِلاَّ كَانَ لَهُ بِهِ صَدَقَةٌ"],
  quote1: "فهذه الزروع التي يزرعها المسلم، أو يغرسها من نخيل أو غيرها من الأشجار له بها أجر",
  quote2: ["وهكذا ما يأخذ منها ويتصدق بها على الناس، وهكذا ما يعطيه أهل بيته", "كل هذا من الخير الذي يحصل من هذا الغرس"],
};
