import { createClient } from "@supabase/supabase-js";
import * as fs from "node:fs";
import * as path from "node:path";

process.loadEnvFile(".env");

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

type TitleItem = {
  id: string;
  scholar_id: string;
  reference: string;
  title: string;
};

async function main() {
  const outFile = path.join("data", "fatwa-title-translations", "all-titles.json");
  if (fs.existsSync(outFile)) {
    console.log(`Titles already extracted at ${outFile}`);
    return;
  }

  console.log("Fetching all published fatwas with titles from Supabase...");
  const allItems: TitleItem[] = [];
  const PAGE_SIZE = 1000;
  let from = 0;

  while (true) {
    const { data, error } = await db
      .from("sources")
      .select("id, scholar_id, reference, title")
      .eq("kind", "fatwa")
      .eq("published", true)
      .not("title", "is", null)
      .order("created_at", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw new Error(`Error fetching sources: ${error.message}`);
    }

    if (!data || data.length === 0) break;

    for (const row of data) {
      if (row.title && row.title.trim().length > 0) {
        allItems.push({
          id: row.id,
          scholar_id: row.scholar_id,
          reference: row.reference,
          title: row.title.trim(),
        });
      }
    }

    console.log(`Fetched ${allItems.length} titles so far...`);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  fs.writeFileSync(outFile, JSON.stringify(allItems, null, 2), "utf8");
  console.log(`Saved ${allItems.length} titles to ${outFile}`);
}

main().catch((err) => {
  console.error("Export error:", err);
  process.exit(1);
});

