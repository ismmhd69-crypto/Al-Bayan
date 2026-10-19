import type { EasyMotionProps } from "../EasyMotion";
import durations from "../../voiceover/easy-tr.durations.json";
import words from "../../voiceover/easy-tr.words.json";

// Video 21 (Turkish) "DİN KOLAYLIKTIR". Sahih al-Bukhari 39 (data/sunnah/bukhari-2-1.json),
// Turkish hadith text: HadeethEnc 5795. Ibn Baz: binbaz.org.sa/fatwas/21163.
export const easyMotionTr: EasyMotionProps = {
  id: "easy",
  lang: "tr",
  durations,
  words,
  alias: { close: { share: ["paylaş", 0], deeds: ["etsin", 0] } },
  arabicLines: ["إِنَّ الدِّينَ يُسْرٌ، وَلَنْ يُشَادَّ الدِّينَ أَحَدٌ إِلاَّ غَلَبَهُ", "فَسَدِّدُوا وَقَارِبُوا وَأَبْشِرُوا، وَاسْتَعِينُوا بِالْغَدْوَةِ وَالرَّوْحَةِ وَشَىْءٍ مِنَ الدُّلْجَةِ"],
  quote1: "فالمؤمن مأمورٌ بالثبات على الحقِّ، والحذر من الغلو والجفاء",
  quote2: ["فلا يغلُ… ويُشدد، ولا يجفُ ويقصر…", "ولكن بين ذلك، لا غلو، ولا جفاء"],
};
