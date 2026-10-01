import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

process.loadEnvFile(".env");

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

type TranslationItem = {
  id: string;
  en: string;
  de: string;
};

async function main() {
  const inArg = process.argv.find((a) => a.startsWith("--in="))?.split("=")[1];
  const inFile = inArg || path.join("data", "translations", "batch-translated.json");

  if (!fs.existsSync(inFile)) {
    throw new Error(`Translation file not found: ${inFile}`);
  }

  const items: TranslationItem[] = JSON.parse(fs.readFileSync(inFile, "utf-8"));
  console.log(`Loaded ${items.length} translation items from ${inFile}`);

  // Check initial count
  const { count: countBefore, error: countBeforeErr } = await db
    .from("source_translations")
    .select("*", { count: "exact", head: true });
  if (countBeforeErr) throw countBeforeErr;
  console.log(`source_translations row count before import: ${countBefore}`);

  // Fetch existing translations for these IDs to avoid unique constraint collisions
  const sourceIds = items.map((it) => it.id);
  const { data: existing, error: existErr } = await db
    .from("source_translations")
    .select("source_id, lang")
    .in("source_id", sourceIds);
  if (existErr) throw existErr;

  const existingSet = new Set(existing?.map((r) => `${r.source_id}:${r.lang}`) ?? []);

  const rowsToInsert: Array<{
    source_id: string;
    lang: "en" | "de";
    text: string;
    origin: "ai";
    translator: "gemini-ide";
    published: false;
  }> = [];

  for (const item of items) {
    if (!item.id || !item.en?.trim() || !item.de?.trim()) {
      console.warn(`Skipping incomplete item: ${item.id}`);
      continue;
    }

    if (!existingSet.has(`${item.id}:en`)) {
      rowsToInsert.push({
        source_id: item.id,
        lang: "en",
        text: item.en.trim(),
        origin: "ai",
        translator: "gemini-ide",
        published: false,
      });
    }

    if (!existingSet.has(`${item.id}:de`)) {
      rowsToInsert.push({
        source_id: item.id,
        lang: "de",
        text: item.de.trim(),
        origin: "ai",
        translator: "gemini-ide",
        published: false,
      });
    }
  }

  console.log(`Inserting ${rowsToInsert.length} new translation rows...`);

  // Insert in chunks of 50 to be safe
  const CHUNK_SIZE = 50;
  for (let i = 0; i < rowsToInsert.length; i += CHUNK_SIZE) {
    const chunk = rowsToInsert.slice(i, i + CHUNK_SIZE);
    const { error: insertErr } = await db.from("source_translations").insert(chunk);
    if (insertErr) {
      throw new Error(`DB insert error in batch [${i}..${i + chunk.length}]: ${insertErr.message}`);
    }
  }

  // Check count after
  const { count: countAfter, error: countAfterErr } = await db
    .from("source_translations")
    .select("*", { count: "exact", head: true });
  if (countAfterErr) throw countAfterErr;
  console.log(`source_translations row count after import: ${countAfter} (added ${countAfter! - countBefore!})`);
}

main().catch((err) => {
  console.error("Import error:", err);
  process.exit(1);
});
