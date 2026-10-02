// Imports reviewed words-only hadith translations into public.hadith_words_translations.
// Mo runs it, only AFTER migration 20261002120000_hadith_words_translations.sql is applied.
// Dry run by default (reads only and prints what it would do). With --apply it INSERTS new rows only:
// never updates, never deletes, never publishes (published=false, origin 'ai').
// Input: a JSON array of { id, words, en?, de? } (words exactly as exported, see export-hadith-words.ts).
// Run: npx tsx scripts/import-hadith-words.ts --in=data/hadith-words/batch-001-translated.json --translator=<model or name> [--apply]
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import { hadithWordsProblems, type HadithWordsTranslated } from "../lib/sources/hadith-words-check";

process.loadEnvFile(".env");

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);

async function main() {
  const file = arg("in");
  const translator = arg("translator")?.trim();
  const apply = process.argv.includes("--apply");
  if (!file || !fs.existsSync(file)) throw new Error("--in=<file> is required and must exist");
  if (!translator) throw new Error("--translator=<name> is required");
  const items = JSON.parse(fs.readFileSync(file, "utf8")) as HadithWordsTranslated[];
  if (!Array.isArray(items) || items.length === 0 || items.length > 200) throw new Error("expected 1 to 200 items");

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });
  const ids = [...new Set(items.map((i) => i.id))];
  const { data: rows, error } = await db.from("sources").select("id, text_original").eq("kind", "hadith").in("id", ids);
  if (error) throw new Error(`sources could not be read: ${error.message}`);
  const texts = new Map(((rows as { id: string; text_original: string }[] | null) ?? []).map((r) => [r.id, r.text_original]));
  const { data: existing, error: existingError } = await db.from("hadith_words_translations").select("source_id, lang").in("source_id", ids);
  if (existingError) throw new Error(`hadith_words_translations could not be read (is the migration applied?): ${existingError.message}`);
  const have = new Set(((existing as { source_id: string; lang: string }[] | null) ?? []).map((r) => `${r.source_id}:${r.lang}`));

  const insert: { source_id: string; lang: "en" | "de"; text: string; origin: "ai"; translator: string; published: false }[] = [];
  const rejected: { id: string; problems: string[] }[] = [];
  let skippedExisting = 0;
  for (const item of items) {
    const problems = hadithWordsProblems(item, texts.get(item.id) ?? null);
    if (problems.length > 0) { rejected.push({ id: item.id, problems }); continue; }
    for (const lang of ["en", "de"] as const) {
      const text = item[lang];
      if (text === undefined) continue;
      if (have.has(`${item.id}:${lang}`)) { skippedExisting++; continue; }
      insert.push({ source_id: item.id, lang, text, origin: "ai", translator: translator.slice(0, 120), published: false });
    }
  }

  console.log(JSON.stringify({ file, items: items.length, toInsert: insert.length, skippedExisting, rejected }, null, 1));
  if (!apply) { console.log("Dry run: nothing written. Add --apply to insert."); return; }
  if (insert.length === 0) { console.log("Nothing to insert."); return; }
  // Insert only; an existing (source_id, lang) row is left as it is.
  const { error: insertError } = await db.from("hadith_words_translations")
    .upsert(insert, { onConflict: "source_id,lang", ignoreDuplicates: true });
  if (insertError) throw new Error(`insert failed: ${insertError.message}`);
  console.log(`Inserted up to ${insert.length} rows (unpublished).`);
}

main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
