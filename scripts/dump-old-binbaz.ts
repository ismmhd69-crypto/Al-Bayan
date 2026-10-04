import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
process.loadEnvFile(".env");
const mine = new Set<string>();
for (const f of fs.readdirSync("docs/binbaz-batches").filter((f) => /^batch-\d+\.json$/.test(f))) {
  for (const c of JSON.parse(fs.readFileSync(`docs/binbaz-batches/${f}`, "utf8")).candidates) mine.add(c.url);
}
async function main() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
  const rows: any[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await db.from("sources").select("id, title, url, text_original, published").eq("scholar_id", "ibn-baz").range(from, from + 999);
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  const old = rows.filter((r) => !mine.has(r.url) && r.published);
  old.sort((a, b) => a.url.localeCompare(b.url));
  fs.writeFileSync("docs/binbaz-batches/_old.json", JSON.stringify(old));
  console.log(rows.length, old.length);
  const per = 70;
  for (let i = 0; i * per < old.length; i++) {
    fs.writeFileSync(`docs/binbaz-batches/_old-${String(i + 1).padStart(2, "0")}.txt`, old.slice(i * per, (i + 1) * per).map((r, k) => `#${i * per + k + 1} | ${r.title}\n${r.text_original}\n`).join("\n"));
  }
}
main();
