import { createClient } from "@supabase/supabase-js";
process.loadEnvFile(".env");

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

async function searchBody(topicKey: string, anyOf: string[], allOf: string[] = []) {
  const { data } = await db.from("sources").select("id, scholar_id, title, reference, url, text_original").eq("published", true);
  console.log(`\n=== Body search for: ${topicKey} ===`);
  const matches = (data || []).filter(s => {
    const text = (s.title + " " + s.text_original).toLowerCase();
    const hasAny = anyOf.length === 0 || anyOf.some(q => text.includes(q));
    const hasAll = allOf.every(q => text.includes(q));
    return hasAny && hasAll;
  });
  console.log(`Found ${matches.length} matches`);
  for (const m of matches.slice(0, 3)) {
    console.log(`[${m.id}] (${m.scholar_id}) ${m.title}`);
    console.log(`  URL: ${m.url}`);
    console.log(`  Ref: ${m.reference}`);
    console.log(`  Text: ${m.text_original?.slice(0, 150)}...\n`);
  }
}

async function main() {
  await searchBody("1. How to pray", ["تكبيرة الإحرام", "ركوع", "سجود", "تشهد"], ["ركوع", "سجود"]);
  await searchBody("2. How to make wudu", ["غسل الوجه", "غسل اليدين", "مسح الرأس", "غسل الرجلين"], ["غسل"]);
  await searchBody("3. What breaks the fast", ["مفطرات", "يفطر الصائم", "الأكل والشرب"], ["صوم"]);
  await searchBody("4. Zakat on savings", ["نصاب", "حول", "النقود"], ["زكاة", "نصاب"]);
  await searchBody("5. Zakat on gold", ["ذهب", "حلي", "نصاب الذهب"], ["زكاة", "ذهب"]);
  await searchBody("6. How to repent", ["شروط التوبة", "الإقلاع", "الندم", "العزم"], ["توبة"]);
  await searchBody("7. How to become Muslim", ["الدخول في الإسلام", "نطق الشهادتين", "أشهد أن لا إله إلا الله"], ["إسلام"]);
  await searchBody("8. Is music haram", ["معازف", "موسيقى", "أغاني"], ["محرم"]);
  await searchBody("9. Is interest haram", ["ربا", "فوائد البنوك"], ["تحريم"]);
  await searchBody("10. Marriage non-Muslim", ["لا يحل", "كافر", "مشرك", "مسلمة"], ["مسلمة", "نكاح"]);
}

main();
