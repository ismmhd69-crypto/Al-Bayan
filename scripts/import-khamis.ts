// Imports ONLY the Othman al-Khamis fatwas I approved by hand (docs/khamis-batches/decisions.json).
// Reads data/khamis/sections.json (made by scripts/parse-khamis-book.ts from the saved book page).
// Same fields as the other scholars' import scripts: sources + source_search_documents (approved=true).
// Usage: npx tsx scripts/import-khamis.ts [--dry]   (safe to re-run: sections already stored are skipped)
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { searchText, looksLikeQuestion, startsLikeRoomTalk } from "../lib/sources/scholar-excerpt";

process.loadEnvFile(".env");
const RIGHTS_ID = "2e553d2f-01aa-4ce6-8eef-65c9045d7c80";
const SCHOLAR = "othman-al-khamis";
const URL_ = "https://othmanalkhamees.com/books/10/read";
const APPROVED_BY = "Automatic collection authorised by Mo (2026-10-01)";
const dry = process.argv.includes("--dry");

const dec = JSON.parse(fs.readFileSync("docs/khamis-batches/decisions.json", "utf-8"));
const sections = new Map<number, any>(JSON.parse(fs.readFileSync("data/khamis/sections.json", "utf-8")).map((s: any) => [s.n, s]));
const ref = (n: number) => `Fatawa al-Shaykh Othman al-Khamis, fatwa ${n}`;

async function main() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
  const { data: existing, error: exErr } = await db.from("sources").select("reference").eq("scholar_id", SCHOLAR);
  if (exErr) throw exErr;
  const have = new Set((existing ?? []).map((r) => r.reference));
  let stored = 0;
  for (const [key, title] of Object.entries<string>(dec.approved)) {
    const n = Number(key);
    const s = sections.get(n);
    if (!s) throw new Error(`section ${n} missing`);
    const answer = (s.answerFull as string).replace(/\s*\n\s*/g, " ").trim();
    let quote: string = s.excerpt;
    const cut = dec.cutAfter?.[key];
    if (cut) {
      const i = answer.indexOf(cut);
      if (i < 0) throw new Error(`cutAfter not found in ${n}`);
      quote = answer.slice(0, i + cut.length).trim();
    }
    if (!answer.startsWith(quote)) throw new Error(`quote is not the start of the answer: ${n}`);
    if (quote.length < 120 || quote.length > 600) throw new Error(`length out of bounds (${quote.length}): ${n}`);
    if (looksLikeQuestion(quote) || startsLikeRoomTalk(quote)) throw new Error(`question or room talk: ${n}`);
    if (title.length > 300) throw new Error(`title too long: ${n}`);
    if (have.has(ref(n))) { console.log(`[skip existing] ${n}`); continue; }
    if (dry) { console.log(`[dry] ${n} (${quote.length}) ${title}`); continue; }
    const { data: src, error } = await db.from("sources").insert({
      kind: "fatwa", scholar_id: SCHOLAR, title, reference: ref(n), collection: "فتاوى الشيخ عثمان الخميس",
      language: "ar", text_original: quote, url: URL_, rights_id: RIGHTS_ID, published: true,
    }).select("id").single();
    if (error || !src) throw new Error(`source insert failed for ${n}: ${error?.message}`);
    const { error: dErr } = await db.from("source_search_documents").insert({
      source_id: src.id, lang: "ar", search_text: searchText(title, quote), approved: true,
      approved_by: APPROVED_BY, approved_at: new Date().toISOString(),
    });
    if (dErr) throw new Error(`search document insert failed for ${n}: ${dErr.message}`);
    stored++;
  }
  console.log(`stored ${stored}`);
}
main().catch((e) => { console.error("Import failed:", e); process.exit(1); });
