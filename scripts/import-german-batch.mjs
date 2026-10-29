import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

process.loadEnvFile(".env");

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

export async function importGermanBatch({
  batchName,
  filePath,
  apply = false,
  logFile = "docs/german-translation-log.md"
}) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const items = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  console.log(`\n=== IMPORT BATCH: ${batchName} (${items.length} items) ===`);

  // Count before
  const { count: beforeCount, error: countErr1 } = await db
    .from("source_translations")
    .select("*", { count: "exact", head: true })
    .eq("lang", "de");
  if (countErr1) throw countErr1;

  console.log(`German rows in source_translations before: ${beforeCount}`);

  // Fetch existing translations for these IDs
  const sourceIds = items.map((it) => it.id);
  const { data: existing, error: existErr } = await db
    .from("source_translations")
    .select("source_id, lang")
    .in("source_id", sourceIds)
    .eq("lang", "de");
  if (existErr) throw existErr;

  const existingSet = new Set(existing?.map((r) => r.source_id) ?? []);
  console.log(`Already existing in DB: ${existingSet.size}`);

  const toInsert = [];
  for (const item of items) {
    if (existingSet.has(item.id)) {
      continue;
    }
    toInsert.push({
      source_id: item.id,
      lang: "de",
      text: item.de.trim(),
      origin: "ai",
      translator: "gemini-ide",
      version: 1,
      published: false
    });
  }

  console.log(`Genuinely missing rows to insert: ${toInsert.length}`);

  if (!apply) {
    console.log(`[DRY RUN] Would insert ${toInsert.length} German rows. Run with --apply to insert.`);
    return { inserted: 0, skipped: existingSet.size, attempted: items.length };
  }

  if (toInsert.length > 0) {
    // Insert in chunks of 30
    const CHUNK_SIZE = 30;
    for (let i = 0; i < toInsert.length; i += CHUNK_SIZE) {
      const chunk = toInsert.slice(i, i + CHUNK_SIZE);
      const { error: insertErr } = await db.from("source_translations").insert(chunk);
      if (insertErr) {
        throw new Error(`Insert failed at chunk [${i}..${i + chunk.length}]: ${insertErr.message}`);
      }
    }
  }

  // Count after
  const { count: afterCount, error: countErr2 } = await db
    .from("source_translations")
    .select("*", { count: "exact", head: true })
    .eq("lang", "de");
  if (countErr2) throw countErr2;

  const diff = afterCount - beforeCount;
  console.log(`German rows in source_translations after: ${afterCount} (diff: +${diff})`);
  if (diff !== toInsert.length) {
    throw new Error(`Count mismatch: expected +${toInsert.length}, got +${diff}`);
  }

  // Verify actual inserted rows in DB
  const { data: verified, error: verErr } = await db
    .from("source_translations")
    .select("source_id, text, published, origin, translator")
    .in("source_id", toInsert.map((t) => t.source_id))
    .eq("lang", "de");
  if (verErr) throw verErr;

  console.log(`Verified ${verified.length} inserted rows in DB (all published=false, origin=ai, translator=gemini-ide)`);

  // Update markdown log
  const logHeader = `# German Translation Log\n\nTranslator: \`gemini-ide\`\nOrigin: \`ai\`\nPublished: \`false\`\n\n## Needs Mo\n\n- \`e942fb99-5c68-4433-a192-d89779835490\`: Reversed statements in Arabic source (Ibn Uthaymeen).\n- \`4e6fee0f-2262-47a9-be75-292508b59dc9\`: Truncated opening formula ending with '..جنهم وإنسهم..', no ruling.\n- \`a219b561-748f-4387-af4d-a17968a16a52\`: Question title and transition only, no answer body.\n- \`48777cd6-f614-44ad-9381-0d49c0790450\`: Greeting and question restatement only, no answer.\n- \`68de1710-d5e9-4cdc-8884-e874eefb55d8\`: Truncated conditional ending with 'أما الكافر أو المنافق فإذا قيل له: من ربك؟'.\n- \`f4f2f06c-8437-4d92-9a06-53ebdf80da8f\`: Truncated conditional ending with 'أما إذا كانت لم تقصر.'.\n\n## Batch History\n\n| Batch | Items Attempted | Inserted | Skipped (Existed) | DB Before | DB After | Notes |\n|---|---:|---:|---:|---:|---:|---|\n`;

  let currentLog = fs.existsSync(logFile) ? fs.readFileSync(logFile, "utf-8") : logHeader;
  const newRow = `| ${batchName} | ${items.length} | ${toInsert.length} | ${existingSet.size} | ${beforeCount} | ${afterCount} | Stored cleanly as unpublished drafts |\n`;
  currentLog = currentLog.trimEnd() + "\n" + newRow;
  fs.writeFileSync(logFile, currentLog, "utf-8");
  console.log(`Logged to ${logFile}`);

  return { inserted: toInsert.length, skipped: existingSet.size, attempted: items.length };
}

// If run directly from CLI
if (process.argv[1]?.endsWith("import-german-batch.mjs")) {
  const inArg = process.argv.find((a) => a.startsWith("--in="))?.split("=")[1];
  const batchArg = process.argv.find((a) => a.startsWith("--batch="))?.split("=")[1] ?? "unnamed";
  const apply = process.argv.includes("--apply");
  if (!inArg) {
    console.error("Usage: node scripts/import-german-batch.mjs --in=<file> --batch=<name> [--apply]");
    process.exit(1);
  }
  importGermanBatch({ batchName: batchArg, filePath: inArg, apply }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
