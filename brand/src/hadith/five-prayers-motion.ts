import type { FivePrayersMotionProps } from "../FivePrayersMotion";
import durations from "../../voiceover/five-prayers-tr.durations.json";
import words from "../../voiceover/five-prayers-tr.words.json";

// Video 12 (Turkish) "BEŞ VAKİT". Sahih al-Bukhari 528 (data/sunnah/bukhari-9-1.json),
// Turkish hadith text: HadeethEnc 4968. Ibn Baz: binbaz.org.sa/fatwas/14806 and /20000.
export const fivePrayersMotionTr: FivePrayersMotionProps = {
  id: "five-prayers",
  lang: "tr",
  durations,
  words,
  alias: { close: { share: ["paylaş", 0], deeds: ["etsin", 0] } },
  arabicLines: ["أَرَأَيْتُمْ لَوْ أَنَّ نَهَرًا بِبَابِ أَحَدِكُمْ، يَغْتَسِلُ فِيهِ كُلَّ يَوْمٍ خَمْسًا، مَا تَقُولُ ذَلِكَ يُبْقِي مِنْ دَرَنِهِ", "فَذَلِكَ مِثْلُ الصَّلَوَاتِ الْخَمْسِ، يَمْحُو اللَّهُ بِهَا الْخَطَايَا"],
  quote1: "الواجب على كل مسلم ومسلمة المحافظة على الصلوات الخمس في أوقاتها",
  quote2: "ومعنى يكفرها: إذا اجتنبت الكبائر يكفر الصغائر",
};
