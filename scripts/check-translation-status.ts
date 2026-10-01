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

  const { data: translations, error: err2 } = await db
    .from("source_translations")
    .select("source_id, lang, origin, translator, published");
  if (err2) throw err2;

  console.log(`Total rows in source_translations: ${translations?.length ?? 0}`);

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
