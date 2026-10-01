// Hides (published = false, never deletes) Ibn Baz fatwas by official fatwa number. Usage: tsx scripts/unpublish-binbaz-refs.ts 3607 3600 ...
import { createClient } from "@supabase/supabase-js";
process.loadEnvFile(".env");
const refs = process.argv.slice(2).filter((a) => /^\d+$/.test(a));
async function main() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
  const data: Array<{ id: string; title: string; url: string }> = [];
  for (let from = 0; ; from += 1000) {
    const { data: page } = await db.from("sources").select("id, title, url").eq("scholar_id", "ibn-baz").range(from, from + 999);
    data.push(...(page ?? []));
    if (!page || page.length < 1000) break;
  }
  for (const ref of refs) {
    const row = (data ?? []).find((r) => r.url.includes(`/fatwas/${ref}/`));
    if (!row) { console.log(`${ref}: not found`); continue; }
    const { error } = await db.from("sources").update({ published: false }).eq("id", row.id);
    console.log(`${ref}: ${error ? "ERROR " + error.message : "hidden"} | ${row.title}`);
  }
}
main();
