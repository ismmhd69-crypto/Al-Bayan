import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import { analyseHadithSplit } from "../lib/sources/hadith-split";

process.loadEnvFile(".env");

export type HadithExportItem = {
  id: string;
  url: string;
  reference: string;
  title: string | null;
  text_original: string;
  scope_reason: "zero_or_multi_quote" | "one_quote_not_prophet";
};

// URL sorting helper: bukhari before muslim, then numeric + letter ordering
export function compareHadithUrls(a: string, b: string): number {
  const parse = (url: string) => {
    const m = url.match(/(bukhari|muslim):(\d+)([a-z])?/i);
    if (!m) return { coll: 99, num: 999999, suffix: "" };
    return {
      coll: m[1].toLowerCase() === "bukhari" ? 1 : 2,
      num: parseInt(m[2], 10),
      suffix: (m[3] || "").toLowerCase(),
    };
  };
  const pa = parse(a);
  const pb = parse(b);
  if (pa.coll !== pb.coll) return pa.coll - pb.coll;
  if (pa.num !== pb.num) return pa.num - pb.num;
  return pa.suffix.localeCompare(pb.suffix);
}

export function getCompletedIds(): Set<string> {
  const completed = new Set<string>();
  const splitDir = path.resolve("data/hadith-split");
  if (!fs.existsSync(splitDir)) {
    fs.mkdirSync(splitDir, { recursive: true });
    return completed;
  }
  const files = fs.readdirSync(splitDir).filter((f) => f.startsWith("marks-") && f.endsWith(".json"));
  for (const file of files) {
    try {
      const content = JSON.parse(fs.readFileSync(path.join(splitDir, file), "utf8"));
      if (Array.isArray(content)) {
        for (const item of content) {
          if (item && item.id) completed.add(item.id);
        }
      }
    } catch (err: any) {
      console.warn(`Warning reading ${file}: ${err.message}`);
    }
  }
  return completed;
}

export async function fetchAllScopeHadith(): Promise<HadithExportItem[]> {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false },
  });

  const allRows: any[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db
      .from("sources")
      .select("id, url, reference, title, text_original")
      .eq("kind", "hadith")
      .eq("published", true)
      .range(from, from + 999);
    if (error) throw error;
    allRows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }

  const primaryScope: HadithExportItem[] = [];
  const secondaryScope: HadithExportItem[] = [];

  for (const row of allRows) {
    const analysis = analyseHadithSplit(row.text_original);
    if (analysis.reason !== null) {
      // 0 quotes, multiple quotes, stray quotes, continuations, etc. (primary scope)
      primaryScope.push({
        ...row,
        scope_reason: "zero_or_multi_quote",
      });
    } else if (analysis.split && analysis.split.speaker !== "prophet") {
      // exactly 1 quote, but speaker is not clearly the Prophet (secondary scope)
      secondaryScope.push({
        ...row,
        scope_reason: "one_quote_not_prophet",
      });
    }
  }

  primaryScope.sort((a, b) => compareHadithUrls(a.url, b.url));
  secondaryScope.sort((a, b) => compareHadithUrls(a.url, b.url));

  return [...primaryScope, ...secondaryScope];
}

async function main() {
  const limitArg = process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1];
  const limit = limitArg ? parseInt(limitArg, 10) : 60;
  const outArg = process.argv.find((a) => a.startsWith("--out="))?.split("=")[1];

  console.log("Fetching and categorizing scope hadith from database...");
  const scopeItems = await fetchAllScopeHadith();
  const completedIds = getCompletedIds();

  const pending = scopeItems.filter((item) => !completedIds.has(item.id));
  console.log(`Total in scope: ${scopeItems.length} (Primary + Secondary)`);
  console.log(`Already marked: ${completedIds.size}`);
  console.log(`Remaining pending: ${pending.length}`);

  const batch = pending.slice(0, limit);
  console.log(`Next batch size: ${batch.length}`);

  if (outArg) {
    fs.mkdirSync(path.dirname(outArg), { recursive: true });
    fs.writeFileSync(outArg, JSON.stringify(batch, null, 2), "utf8");
    console.log(`Wrote batch to ${outArg}`);
  }
}

if (process.argv[1]?.endsWith("export-hadith-for-marking.ts")) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
