import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

process.loadEnvFile(".env");

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

type SourceItem = {
  id: string;
  title: string | null;
  text_original: string;
};

async function main() {
  const limitArg = process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1];
  const limit = limitArg ? parseInt(limitArg, 10) : 40;

  const outArg = process.argv.find((a) => a.startsWith("--out="))?.split("=")[1];
  const outFile = outArg || path.join("data", "translations", "batch-untranslated.json");

  // Ensure output directory exists
  const dir = path.dirname(outFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // 1. Get all fatwa translations already present (en and de)
  const { data: doneTranslations, error: transError } = await db
    .from("source_translations")
    .select("source_id, lang")
    .in("lang", ["en", "de"]);

  if (transError) {
    throw new Error(`Failed to fetch source_translations: ${transError.message}`);
  }

  const completedMap = new Map<string, Set<string>>();
  for (const row of doneTranslations ?? []) {
    if (!completedMap.has(row.source_id)) {
      completedMap.set(row.source_id, new Set());
    }
    completedMap.get(row.source_id)!.add(row.lang);
  }

  // 2. Fetch published fatwas that do not have both translations
  const batch: SourceItem[] = [];
  const PAGE_SIZE = 500;
  let page = 0;

  while (batch.length < limit) {
    const { data: sources, error: sourcesError } = await db
      .from("sources")
      .select("id, title, text_original")
      .eq("kind", "fatwa")
      .eq("published", true)
      .order("created_at", { ascending: true })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (sourcesError) {
      throw new Error(`Failed to fetch sources: ${sourcesError.message}`);
    }

    if (!sources || sources.length === 0) {
      break;
    }

    for (const s of sources) {
      const langs = completedMap.get(s.id);
      const hasBoth = langs && langs.has("en") && langs.has("de");
      if (!hasBoth) {
        batch.push({
          id: s.id,
          title: s.title,
          text_original: s.text_original,
        });
        if (batch.length >= limit) {
          break;
        }
      }
    }

    if (sources.length < PAGE_SIZE) {
      break;
    }
    page++;
  }

  fs.writeFileSync(outFile, JSON.stringify(batch, null, 2), "utf-8");
  console.log(`Exported ${batch.length} untranslated fatwas to ${outFile}`);
}

main().catch((err) => {
  console.error("Export error:", err);
  process.exit(1);
});
