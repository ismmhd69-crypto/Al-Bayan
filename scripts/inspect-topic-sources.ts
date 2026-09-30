import { createClient } from "@supabase/supabase-js";
process.loadEnvFile(".env");

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

async function getQuote(id: string) {
  const { data } = await db.from("sources").select("*").eq("id", id).single();
  return data;
}

async function searchFatwas(keywords: string[]) {
  const { data } = await db.from("sources").select("id, scholar_id, title, reference, url, text_original").eq("published", true);
  return (data || []).filter(s => keywords.every(k => (s.title + " " + s.text_original).includes(k)));
}

async function run() {
  console.log("--- 1. Prayer ---");
  const prayer = await searchFatwas(["تكبيرة الإحرام", "ركوع", "سجود"]);
  console.log(prayer.slice(0, 2).map(p => ({ id: p.id, title: p.title, url: p.url, text: p.text_original })));

  console.log("--- 2. Wudu ---");
  const wudu = await searchFatwas(["غسل الوجه", "غسل اليدين", "مسح الرأس", "غسل الرجلين"]);
  console.log(wudu.slice(0, 2).map(p => ({ id: p.id, title: p.title, url: p.url, text: p.text_original })));

  console.log("--- 3. Fasting breakers ---");
  const fast = await searchFatwas(["الأكل", "الشرب", "الجماع", "مفطر"]);
  console.log(fast.slice(0, 2).map(p => ({ id: p.id, title: p.title, url: p.url, text: p.text_original })));

  console.log("--- 4. Zakat Savings ---");
  const q4 = await getQuote("099b0a1a-9048-47b0-91da-96c4f5243bcc");
  console.log({ id: q4?.id, title: q4?.title, url: q4?.url, text: q4?.text_original });

  console.log("--- 5. Zakat Gold ---");
  const q5 = await getQuote("250705e5-1fb7-4c73-92a1-b42da15acddc");
  console.log({ id: q5?.id, title: q5?.title, url: q5?.url, text: q5?.text_original });

  console.log("--- 6. Repentance ---");
  const q6 = await getQuote("0772d6ef-b31d-477f-b827-d1c22b506d95");
  console.log({ id: q6?.id, title: q6?.title, url: q6?.url, text: q6?.text_original });

  console.log("--- 8. Music ---");
  const q8 = await getQuote("893c05e3-5314-4874-8f7c-77348d5ef29b");
  console.log({ id: q8?.id, title: q8?.title, url: q8?.url, text: q8?.text_original });

  console.log("--- 9. Riba ---");
  const q9 = await getQuote("a53d290c-21d7-4ae5-b9c1-d616d5add625");
  console.log({ id: q9?.id, title: q9?.title, url: q9?.url, text: q9?.text_original });
}

run();
