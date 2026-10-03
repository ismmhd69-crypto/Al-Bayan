import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

process.loadEnvFile(".env");
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

const collection = process.argv.find((a) => a.startsWith("--collection="))?.split("=")[1] ?? "Sahih Muslim";
const out = process.argv.find((a) => a.startsWith("--out="))?.split("=")[1] ?? "claude-batch.json";
const asc = process.argv.includes("--asc");
const size = Number(process.argv.find((a) => a.startsWith("--size="))?.split("=")[1] ?? 30);
const maxChars = Number(process.argv.find((a) => a.startsWith("--chars="))?.split("=")[1] ?? 12000);

function key(url: string) {
  const m = /:(\d+)([a-z]*)$/i.exec(url ?? "");
  return m ? [Number(m[1]), m[2]] as const : ([-1, url] as const);
}

async function all<T>(q: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>) {
  const rows: T[] = [];
  for (let i = 0; ; i += 1000) {
    const { data, error } = await q(i, i + 999);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

async function main() {
  const src = await all<{ id: string; url: string }>((a, b) =>
    db.from("sources").select("id,url").eq("collection", collection).eq("kind", "hadith").range(a, b));
  const tr = await all<{ source_id: string; lang: string }>((a, b) =>
    db.from("source_translations").select("source_id,lang").in("lang", ["en", "de"]).range(a, b));
  const have = new Map<string, Set<string>>();
  for (const t of tr) (have.get(t.source_id) ?? have.set(t.source_id, new Set()).get(t.source_id)!).add(t.lang);
  const todo = src.filter((s) => (have.get(s.id)?.size ?? 0) < 2);
  todo.sort((x, y) => {
    const [n1, s1] = key(x.url), [n2, s2] = key(y.url);
    const d = asc ? 1 : -1;
    if (n1 !== n2) return d * ((n1 as number) - (n2 as number));
    return d * (String(s1) < String(s2) ? -1 : String(s1) > String(s2) ? 1 : 0);
  });
  console.log(`untranslated: ${todo.length}`);
  const picked: any[] = [];
  let chars = 0;
  for (const s of todo) {
    if (picked.length >= size) break;
    const { data, error } = await db.from("sources").select("id,reference,title,text_original,url").eq("id", s.id).single();
    if (error) throw error;
    const len = data.text_original.length;
    if (picked.length && (len > 3000 || chars + len > maxChars)) break;
    picked.push({ ...data, need: ["en", "de"].filter((l) => !have.get(s.id)?.has(l)) });
    chars += len;
    if (len > 3000) break;
  }
  fs.writeFileSync(out, JSON.stringify(picked, null, 1));
  console.log(`exported ${picked.length}, ${chars} chars, ${picked[0]?.url} .. ${picked.at(-1)?.url}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
