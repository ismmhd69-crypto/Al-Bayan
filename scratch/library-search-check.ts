// Read-only: runs the stored-hadith search on Arabic phrases for the 12 check topics (no Gemini).
import { searchLibraryHadith } from "../lib/sources/hadith-library";
const topics: [string, string[]][] = [
  ["prayer", ["فضل الصلاة المفروضة", "أهمية الصلاة في الإسلام"]], ["zakah", ["وجوب الزكاة على المسلم", "من تجب عليه الزكاة"]],
  ["fasting", ["فضل صوم رمضان", "الصيام وثوابه"]], ["intentions", ["الأعمال بالنيات", "النية في العمل"]],
  ["honesty", ["فضل الصدق", "تحريم الكذب"]], ["parents", ["بر الوالدين", "حق الوالدين على الولد"]], ["neighbours", ["حق الجار", "الإحسان إلى الجار"]],
  ["anger", ["علاج الغضب", "كظم الغيظ"]], ["patience", ["الصبر على البلاء", "ثواب الصبر"]], ["riba", ["تحريم الربا", "أكل الربا"]],
  ["divorce", ["حكم الطلاق", "الطلاق في الحيض"]], ["cleanliness", ["فضل الوضوء", "الطهارة للصلاة"]],
];
async function main() {
  for (const [name, ar] of topics) {
    const t0 = Date.now();
    try {
      const found = await searchLibraryHadith({ ar });
      console.log(`${name} (${Date.now() - t0} ms): ${found.length} hadith`);
      for (const h of found.slice(0, 2)) console.log(`   ${h.url} | ${h.arabic.replace(/\s+/g, " ").slice(0, 40)} … ${h.arabic.replace(/\s+/g, " ").slice(-60)}`);
    } catch (e) { console.log(name, "ERROR", String(e)); }
  }
}
main();
