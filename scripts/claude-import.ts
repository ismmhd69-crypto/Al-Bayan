import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

process.loadEnvFile(".env");
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

const dir = "data/translations-claude";
const collection = process.argv.find((a) => a.startsWith("--collection="))?.split("=")[1] ?? "Sahih al-Bukhari";
const dry = process.argv.includes("--dry");
const logFile = "docs/hadith-translation-log-claude.md";

type In = { id: string; url: string; text_original: string; need: string[] };
type Out = { id: string; en: string; de: string };

const AR = /[؀-ۿݐ-ݿ]/;
const strip = (s: string) => s.replace(/[ً-ٰٟـ‏‎]/g, "");
const arDigits = (s: string) => s.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

function validate(i: In, o: Out) {
  const errs: string[] = [];
  for (const [lang, t] of [["en", o.en], ["de", o.de]] as const) {
    if (!i.need.includes(lang)) continue;
    if (!t?.trim()) { errs.push(`${lang} empty`); continue; }
    if (AR.test(t)) errs.push(`${lang} has Arabic letters`);
    if (/\[quran|\]\{|\{\s*‏|\[\/?quran/i.test(t)) errs.push(`${lang} quran tag left`);
    const nums = arDigits(i.text_original).match(/\d+/g) ?? [];
    for (const n of nums) if (!new RegExp("(^|[^0-9])" + n + "([^0-9]|$)").test(t)) errs.push(`${lang} number ${n} missing`);
    const ratio = t.length / Math.max(1, strip(i.text_original).length);
    if (ratio < 0.6 || ratio > 3.5) errs.push(`${lang} ratio ${ratio.toFixed(2)}`);
    if (/ae|oe|ue/.test(t) && lang === "de" && /\b\w*(?:[a-z]ae|[a-z]oe|[a-z]ue)\w*\b/.test(t) && !/[äöüß]/.test(t) && t.length > 60) errs.push("de no umlauts");
  }
  return errs;
}

async function main() {
  const ins: In[] = JSON.parse(fs.readFileSync(`${dir}/in.json`, "utf-8"));
  const outs: Out[] = JSON.parse(fs.readFileSync(`${dir}/out.json`, "utf-8"));
  const om = new Map(outs.map((o) => [o.id, o]));
  const bad: string[] = [];
  if (outs.length !== ins.length || ins.some((i) => !om.has(i.id))) bad.push("ids do not match");
  for (const i of ins) { const o = om.get(i.id); if (o) for (const e of validate(i, o)) bad.push(`${i.url.split(":")[2]}: ${e}`); }
  if (bad.length) { console.log("VALIDATION FAILED:\n" + bad.join("\n")); process.exit(2); }

  const mine = async () => (await db.from("source_translations").select("*", { count: "exact", head: true }).eq("translator", "claude")).count!;
  const before = await mine();
  // collision re-check
  const { data: ex, error } = await db.from("source_translations").select("source_id,lang").in("source_id", ins.map((i) => i.id)).in("lang", ["en", "de"]);
  if (error) throw error;
  const have = new Set(ex!.map((r) => `${r.source_id}:${r.lang}`));
  const rows: any[] = []; let skipped = 0;
  for (const i of ins) for (const lang of ["en", "de"] as const) {
    if (have.has(`${i.id}:${lang}`)) { skipped++; continue; }
    rows.push({ source_id: i.id, lang, text: om.get(i.id)![lang].trim(), origin: "ai", translator: "claude", published: false });
  }
  console.log(`validated ok; to insert ${rows.length}, already existing ${skipped}`);
  if (dry) return;
  if (rows.length) {
    const { error: e2 } = await db.from("source_translations").insert(rows);
    if (e2) throw new Error("insert: " + e2.message);
  }
  const after = await mine();
  if (after - before !== rows.length) { console.log(`COUNT MISMATCH before ${before} after ${after} expected +${rows.length}`); process.exit(3); }
  console.log(`inserted ${rows.length}; claude rows ${before} -> ${after}`);
  const nums = ins.map((i) => i.url.split(":")[2]);
  const log = fs.existsSync(logFile) ? fs.readFileSync(logFile, "utf-8") : `# Hadith translation log (Claude)\n\nTranslator: claude\nOrigin: ai\nPublished: false\n\n## Needs Mo\n\n## Self-check flags\n\n## Batch history\n\n| Batch | Collection and range | Hadith items | Rows inserted | Skipped | Total claude rows |\n|---|---|---:|---:|---|---:|\n`;
  const n = Math.max(0, ...Array.from(log.matchAll(/^\|\s*(\d+)\s*\|/gm)).map((m) => +m[1])) + 1;
  const short = collection.replace("Sahih al-", "").replace("Sahih ", "");
  fs.writeFileSync(logFile, log.trimEnd() + `\n| ${n} | ${short} ${nums[0]} to ${nums.at(-1)} | ${ins.length} | ${rows.length} | ${skipped ? skipped + " rows already existed" : "0"} | ${after} |\n`);
  fs.mkdirSync(dir + "/archive", { recursive: true });
  fs.copyFileSync(dir + "/out.json", dir + "/archive/" + short.toLowerCase().replace(/[^a-z]+/g, "-") + "-" + nums[0] + "-" + nums.at(-1) + ".json");
  console.log(`logged batch ${n}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
