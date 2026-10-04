import type { IntentionMotionProps } from "../IntentionMotion";
import durations from "../../voiceover/bukhari-1-en.durations.json";
import words from "../../voiceover/bukhari-1-en.words.json";

// Motion-design pilot for Sahih al-Bukhari 1 (English). Same sources and voice as
// the reel in bukhari-1.ts: Ibn Baz, binbaz.org.sa/fatwas/8343 and /22896; the
// hadith he cites is Sahih al-Bukhari 2996 (shown in his own wording).
export const bukhari1Motion: IntentionMotionProps = {
  id: "bukhari-1",
  lang: "en",
  durations,
  words,
  arabicLines: ["إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ،", "وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى"],
  quote1: ["النية لابد منها في العبادات كلها", "وإنما النية تكون بالقلب لا باللسان"],
  quote2: ["إذا نوى العمل الطيب ثم حبسه عذر صار له أجر العاملين", "إذا مرض العبد أو سافر كتب الله له ما كان يعمل وهو صحيح مقيم"],
};
