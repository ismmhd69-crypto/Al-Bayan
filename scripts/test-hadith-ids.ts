import { parseHadith } from "../lib/sources/hadith-rules";
import { hadithAllowed } from "../lib/ask/core";

const testIds = ["66511", "66512", "5913", "2956", "3004", "10849", "6637", "5027", "2837", "2885"];

async function checkOne(id: string) {
  try {
    const fetchLang = (lang: string) => fetch(`https://hadeethenc.com/api/v1/hadeeths/one/?language=${lang}&id=${id}`).then(r => r.ok ? r.json() : null).catch(() => null);
    const [ar, en, de] = await Promise.all([fetchLang("ar"), fetchLang("en"), fetchLang("de")]);
    if (!ar) {
      console.log(`HE${id}: ar fetch failed`);
      return;
    }
    const parsed = parseHadith(ar, en, de);
    if (!parsed) {
      console.log(`HE${id}: parseHadith returned null`);
      return;
    }
    const allowed = hadithAllowed(parsed);
    console.log(`HE${id}: collection=${parsed.collection}, numbers=${JSON.stringify(parsed.numbers)}, grade=${parsed.gradeAr}, allowed=${allowed}, ref=${parsed.attributionAr}`);
    console.log(`  Arabic: ${parsed.arabic.slice(0, 80)}...`);
  } catch (e: any) {
    console.log(`HE${id}: error ${e.message}`);
  }
}

async function main() {
  for (const id of testIds) {
    await checkOne(id);
  }
}

main();
