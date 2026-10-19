import type { MotherMotionProps } from "../MotherMotion";
import durations from "../../voiceover/mother-tr.durations.json";
import words from "../../voiceover/mother-tr.words.json";

// Video 04 (Turkish) "ANNEN". Sahih al-Bukhari 5971 (data/sunnah/bukhari-78-1.json),
// Turkish hadith text: HadeethEnc 4182 (human translation). Ibn Baz quote:
// binbaz.org.sa/fatwas/18535; Ibn Uthaymeen quote: library source 6aefc473.
export const motherMotionTr: MotherMotionProps = {
  id: "mother",
  lang: "tr",
  durations,
  words,
  alias: { close: { share: ["paylaş", 0], deeds: ["etsin", 0] } },
  arabicLines: ["يَا رَسُولَ اللَّهِ مَنْ أَحَقُّ بِحُسْنِ صَحَابَتِي؟", "أُمُّكَ ... أُمُّكَ ... أُمُّكَ ... ثُمَّ أَبُوكَ"],
  quote1: ["بر الوالدين من أهم الواجبات ومن أعظم الفرائض", "وقد قرن الله حق الوالدين بحقه سبحانه بالتوحيد"],
  quote2: ["إذا تعارض أمر الوالد والوالدة فيجب أن تداريهما وأن تقضي شغل الوالد وشغل الوالدة", "وإن تساويا فقدم الوالدة"],
  ibnUthaymeenLink:
    "https://binothaimeen.net/ar/voice_library/lessonDetails/%D9%84%D9%82%D8%A7%D8%A1-%D8%A7%D9%84%D8%A8%D8%A7%D8%A8-%D8%A7%D9%84%D9%85%D9%81%D8%AA%D9%88%D8%AD-%5B32%5D/%D9%88%D8%A7%D8%AC%D8%A8-%D8%A7%D9%84%D9%88%D9%84%D8%AF-%D8%A5%D8%B0%D8%A7-%D8%AA%D8%B9%D8%A7%D8%B1%D8%B6-%D8%A3%D9%85%D8%B1-%D8%A7%D9%84%D9%88%D8%A7%D9%84%D8%AF-%D9%88%D8%A7%D9%84%D9%88%D8%A7%D9%84%D8%AF%D8%A9-%D9%84%D9%87/d6547a54-c206-4625-a3a9-f777a6fac1d0",
};
