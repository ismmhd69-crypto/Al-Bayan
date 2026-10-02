// Hides (published=false, never deletes) older Ibn Baz fatwas listed by their number in docs/binbaz-batches/_old.json (the audit dump).
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
process.loadEnvFile(".env");
const idx = process.argv.slice(2).join(",").split(",").map((s) => Number(s.trim())).filter((n) => n > 0);
const old = JSON.parse(fs.readFileSync("docs/binbaz-batches/_old.json", "utf8")) as Array<{ id: string; title: string; url: string }>;
async function main() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
  const done: string[] = [];
  for (const n of new Set(idx)) {
    const row = old[n - 1];
    if (!row) { console.log(`#${n}: not in dump`); continue; }
    const { error } = await db.from("sources").update({ published: false }).eq("id", row.id);
    if (error) { console.log(`#${n}: ERROR ${error.message}`); continue; }
    done.push(`#${n} ${row.url.match(/fatwas\/(\d+)\//)?.[1]} ${row.title}`);
  }
  fs.writeFileSync("docs/binbaz-batches/audit-old-hidden.txt", done.join("\n"), "utf-8");
  console.log(`hidden ${done.length}`);
}
main();
