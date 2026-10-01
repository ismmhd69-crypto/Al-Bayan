import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env");

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

async function main() {
  const { count: totalPublishedFatwas, error: err1 } = await db
    .from("sources")
    .select("*", { count: "exact", head: true })
    .eq("kind", "fatwa")
    .eq("published", true);
  if (err1) throw err1;

  console.log(`Total published fatwas in sources: ${totalPublishedFatwas}`);

  const translations: Array<{ source_id: string; lang: string; origin: string; translator: string; published: boolean }> = [];
  const PAGE_SIZE = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await db
      .from("source_translations")
      .select("source_id, lang, origin, translator, published")
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    translations.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  console.log(`Total rows in source_translations: ${translations.length}`);

  const langMap = new Map<string, Set<string>>();
  for (const t of translations ?? []) {
    if (!langMap.has(t.source_id)) {
      langMap.set(t.source_id, new Set());
    }
    langMap.get(t.source_id)!.add(t.lang);
  }

  let bothCount = 0;
  let partialCount = 0;
  for (const [_, langs] of langMap.entries()) {
    if (langs.has("en") && langs.has("de")) {
      bothCount++;
    } else {
      partialCount++;
    }
  }

  console.log(`Sources with both en and de: ${bothCount}`);
  console.log(`Sources with only one of en/de: ${partialCount}`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
