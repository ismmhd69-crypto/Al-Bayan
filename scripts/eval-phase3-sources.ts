// Read-only, local source-by-source retrieval check. Never records a visitor question.
process.loadEnvFile(".env");
try { process.loadEnvFile(".env.local"); } catch { /* optional */ }

import { writeFileSync } from "node:fs";

async function main() {
  const [{ searchQuran }, { searchHadithMulti }, { searchScholarQuotes }, { searchScholarsLive, getMappedScholarQuote }] = await Promise.all([
    import("@/lib/sources/quran"), import("@/lib/sources/hadith"),
    import("@/lib/sources/scholars"), import("@/lib/sources/scholars-live"),
  ]);
  const quranCases = [
    { id: "fasting", query: "الصيام فرض رمضان", expected: "2:183" },
    { id: "riba", query: "تحريم الربا", expected: "2:275" },
    { id: "prayer-timing", query: "الصلاة أوقات", expected: "4:103" },
    { id: "repentance", query: "توبة نصوحا", expected: "66:8" },
  ];
  const hadithCases = [
    { id: "intention", query: { ar: ["إنما الأعمال بالنيات"] }, expected: "HE66511" },
    { id: "pillars", query: { ar: ["أركان الإسلام خمسة"] }, expected: "HE66512" },
    { id: "conversion", query: { ar: ["كيف يدخل الإسلام بالشهادتين"] }, expected: "HE66512" },
    { id: "five-prayers", query: { ar: ["فرض الصلوات الخمس"] }, expected: "" },
  ];
  const scholarCases = [
    { id: "gold-rate", query: ["مقدار الزكاة في الذهب ربع العشر"], mapped: "https://binbaz.org.sa/fatwas/5743/مقدار-الزكاة-في-خمسة-وثمانين-جرامًا-من-الذهب", answer: /ربع العشر/ },
    { id: "repentance-steps", query: ["شروط التوبة الندم الإقلاع العزم"], mapped: "https://binbaz.org.sa/fatwas/18217/هل-يكفي-الندم-على-الذنب-والإقلاع-عنه-في-التوبة؟", answer: /الندم/ },
    { id: "conversion-shahada", query: ["الدخول في الإسلام النطق بالشهادتين"], mapped: "https://binbaz.org.sa/fatwas/1158/وجوب-التصديق-مع-الشهادتين", answer: /الشهادتين/ },
  ];
  const quran = [];
  for (const item of quranCases) {
    const ids = await searchQuran([item.query], 16).catch((): string[] => []);
    quran.push({ id: item.id, expected: item.expected, rank: ids.indexOf(item.expected) + 1, returned: ids.length, top: ids.slice(0, 8) });
  }
  const hadith = [];
  for (const item of hadithCases) {
    const results = await searchHadithMulti(item.query, 8).catch(() => []);
    const ids = results.map((h) => h.id);
    hadith.push({ id: item.id, expected: item.expected || null,
      rank: item.expected ? ids.indexOf(item.expected) + 1 : null, returned: ids.length, top: ids });
  }
  const stored = [];
  const live = [];
  for (const item of scholarCases) {
    const library = await searchScholarQuotes(item.query, 8).catch(() => []);
    const foundLive = await searchScholarsLive(item.query).catch(() => []);
    const mapped = await getMappedScholarQuote(item.mapped);
    stored.push({ id: item.id, returned: library.length, direct: library.filter((x) => item.answer.test(x.arabic)).length, titles: library.map((x) => x.title) });
    live.push({ id: item.id, returned: foundLive.length, direct: foundLive.filter((x) => item.answer.test(x.arabic)).length, titles: foundLive.map((x) => x.title), mappedDirect: !!mapped && item.answer.test(mapped.arabic) });
  }
  const result = { quran, hadith, stored, live };
  writeFileSync("docs/phase3-source-tests.json", JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
