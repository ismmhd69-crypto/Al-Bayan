import type { NightMotionProps } from "../NightMotion";
import durations from "../../voiceover/night-tr.durations.json";
import words from "../../voiceover/night-tr.words.json";

// Video 13 (Turkish) "GECENİN SON ÜÇTE BİRİ". Sahih al-Bukhari 1145 (data/sunnah/bukhari-19-1.json),
// Turkish hadith text: HadeethEnc 10412. Ibn Baz: binbaz.org.sa/fatwas/17595.
export const nightMotionTr: NightMotionProps = {
  id: "night",
  lang: "tr",
  durations,
  words,
  alias: { close: { share: ["paylaş", 0], deeds: ["etsin", 0] } },
  arabicLines: ["يَنْزِلُ رَبُّنَا تَبَارَكَ وَتَعَالَى كُلَّ لَيْلَةٍ إِلَى السَّمَاءِ الدُّنْيَا حِينَ يَبْقَى ثُلُثُ اللَّيْلِ الآخِرُ", "مَنْ يَدْعُونِي فَأَسْتَجِيبَ لَهُ، مَنْ يَسْأَلُنِي فَأُعْطِيَهُ، مَنْ يَسْتَغْفِرُنِي فَأَغْفِرَ لَهُ"],
  quote1: ["وأفضل أوقاته الثلث الأخير", "هذا الوقت هو الوقت العظيم وقت التنزل الإلهي"],
  quote2: ["وقت دعوة الرب للعباد أن يسألوه، وأن يضرعوا إليه جل وعلا", "هذا هو أفضل الوقت"],
};
