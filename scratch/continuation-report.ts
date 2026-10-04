// Read-only: counts what the continuation rule and the length cap remove from the stored hadith.
import { createClient } from "@supabase/supabase-js";
import { isContinuationHadith, MAX_LIBRARY_HADITH_CHARS } from "../lib/sources/hadith-rules";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });
async function main() {
const rows: { id: string; reference: string; url: string; text_original: string }[] = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await db.from("sources").select("id, reference, url, text_original").eq("kind", "hadith").eq("published", true).range(from, from + 999);
  if (error) throw error;
  rows.push(...data!);
  if (data!.length < 1000) break;
}
const cont = rows.filter((r) => isContinuationHadith(r.text_original));
const long = rows.filter((r) => r.text_original.length > MAX_LIBRARY_HADITH_CHARS);
console.log(JSON.stringify({ total: rows.length, continuation: cont.length, overCap: long.length }));
for (const r of cont.filter((_, i) => i % Math.floor(cont.length / 10) === 0).slice(0, 10)) console.log(r.url, "|", r.text_original.replace(/\s+/g, " ").slice(0, 110));
}
main();
