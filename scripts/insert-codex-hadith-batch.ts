import { createClient } from "@supabase/supabase-js";
import * as fs from "node:fs";

process.loadEnvFile(".env");
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
  auth: { persistSession: false },
});

type Input = { id: string; url: string };
type Output = { id: string; en: string; de: string };

async function countRows() {
  const { count, error } = await db.from("source_translations").select("id", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

async function main() {
  const inputPath = process.argv.find((a) => a.startsWith("--input="))?.split("=")[1] ?? "data/hadith-words-translations/codex-batch-001.json";
  const outputPath = process.argv.find((a) => a.startsWith("--output="))?.split("=")[1] ?? "data/hadith-words-translations/codex-out-001.json";
  const batchName = process.argv.find((a) => a.startsWith("--batch="))?.split("=")[1] ?? "001";
  const input = JSON.parse(fs.readFileSync(inputPath, "utf8")) as Input[];
  const output = JSON.parse(fs.readFileSync(outputPath, "utf8")) as Output[];
  const byId = new Map(output.map((row) => [row.id, row]));
  if (input.length !== output.length || input.some((row) => !byId.has(row.id))) throw new Error("input/output ids do not match");

  const before = await countRows();
  const { data: existing, error: existingError } = await db
    .from("source_translations")
    .select("source_id,lang")
    .in("source_id", input.map((row) => row.id))
    .in("lang", ["en", "de"]);
  if (existingError) throw existingError;
  const have = new Set((existing ?? []).map((row) => `${row.source_id}:${row.lang}`));
  const rows: Array<{ source_id: string; lang: "en" | "de"; text: string; translator: "codex"; origin: "ai"; published: false }> = [];
  for (const row of input) {
    const translation = byId.get(row.id)!;
    for (const lang of ["en", "de"] as const) {
      if (have.has(`${row.id}:${lang}`)) continue;
      const text = translation[lang].trim();
      if (!text) throw new Error(`${row.url} ${lang} is empty`);
      rows.push({ source_id: row.id, lang, text, translator: "codex", origin: "ai", published: false });
    }
  }
  console.log(`source_translations before: ${before}`);
  console.log(`missing rows to insert: ${rows.length}; existing rows preserved: ${input.length * 2 - rows.length}`);
  if (rows.length) {
    const { error } = await db.from("source_translations").insert(rows);
    if (error) throw new Error(`insert: ${error.message}`);
  }
  const after = await countRows();
  if (after - before !== rows.length) throw new Error(`count mismatch: before ${before}, after ${after}, expected +${rows.length}`);
  console.log(`source_translations after: ${after}; exact increase: +${rows.length}`);

  const first = input[0].url.split(":").pop();
  const last = input.at(-1)!.url.split(":").pop();
  const collection = input[0].url.includes("sunnah.com/muslim:") ? "Sahih Muslim" : "Sahih al-Bukhari";
  const logPath = "docs/hadith-translation-log.md";
  const existingLog = fs.existsSync(logPath) ? fs.readFileSync(logPath, "utf8").trimEnd() : "# Hadith translation log\n";
  const line = `\n\nCodex batch ${batchName} inserted ${rows.length} rows for ${collection} ${first} to ${last}. The database count increased from ${before} to ${after}, exactly matching the inserted rows. Validation passed for ${input.length} hadiths.`;
  fs.writeFileSync(logPath, existingLog + line + "\n", "utf8");
  console.log(`logged Codex batch ${batchName}`);
}

main().catch((error) => { console.error(error); process.exit(1); });
