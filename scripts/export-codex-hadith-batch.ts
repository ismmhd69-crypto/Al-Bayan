import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env");

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
  auth: { persistSession: false },
});

const collection = process.argv.find((a) => a.startsWith("--collection="))?.split("=")[1] ?? "Sahih al-Bukhari";
const out = process.argv.find((a) => a.startsWith("--out="))?.split("=")[1] ?? "data/hadith-words-translations/codex-batch.json";
const size = Number(process.argv.find((a) => a.startsWith("--size="))?.split("=")[1] ?? 30);
const skipFile = process.argv.find((a) => a.startsWith("--skip-file="))?.split("=")[1];
const skip = new Set([
  ...(process.argv.find((a) => a.startsWith("--skip="))?.split("=")[1] ?? "").split(",").filter(Boolean),
  ...(skipFile && fs.existsSync(skipFile) ? fs.readFileSync(skipFile, "utf8").split(/\r?\n/).filter(Boolean) : []),
]);

function key(url: string): [number, string] {
  const m = /:(\d+)([a-z]*)$/i.exec(url ?? "");
  return m ? [Number(m[1]), m[2].toLowerCase()] : [Number.MAX_SAFE_INTEGER, url];
}

async function page<T>(fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await fetchPage(from, from + 999);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) return rows;
  }
}

async function main() {
  const sources = await page<{ id: string; reference: string; title: string | null; text_original: string; url: string }>((from, to) =>
    db.from("sources").select("id,reference,title,text_original,url")
      .eq("collection", collection).eq("kind", "hadith").range(from, to));
  const translations = await page<{ source_id: string; lang: string }>((from, to) =>
    db.from("source_translations").select("source_id,lang").in("lang", ["en", "de"]).range(from, to));

  const langs = new Map<string, Set<string>>();
  for (const row of translations) (langs.get(row.source_id) ?? langs.set(row.source_id, new Set()).get(row.source_id)!).add(row.lang);
  const todo = sources.filter((row) => (langs.get(row.id)?.has("en") && langs.get(row.id)?.has("de")) !== true && !skip.has(row.url));
  todo.sort((a, b) => { const ka = key(a.url), kb = key(b.url); return ka[0] - kb[0] || ka[1].localeCompare(kb[1]); });

  const batch: any[] = [];
  for (const row of todo) {
    if (batch.length >= size) break;
    if (row.text_original.length > 3000 && batch.length > 0) break;
    const needed = ["en", "de"].filter((lang) => !langs.get(row.id)?.has(lang));
    batch.push({ ...row, need: needed });
    if (row.text_original.length > 3000) break;
  }
  fs.mkdirSync(out.replace(/[\\/][^\\/]+$/, ""), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(batch, null, 2) + "\n", "utf8");
  console.log(`scope=${sources.length} untranslated=${todo.length} exported=${batch.length}`);
  console.log(`range=${batch[0]?.url ?? "none"}..${batch.at(-1)?.url ?? "none"}`);
}

main().catch((error) => { console.error(error); process.exit(1); });
