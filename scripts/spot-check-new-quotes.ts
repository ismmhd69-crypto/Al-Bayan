import { createClient } from "@supabase/supabase-js";
import { htmlToText, parseAlbaniFatwa, parseBinBazFatwa } from "@/lib/sources/scholar-excerpt";

process.loadEnvFile(".env");

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
const HEADERS = { "User-Agent": "AlBayan-Collector/0.1 (non-commercial Islamic Q&A; short credited quotes)" };

const normalize = (t: string) => t.replace(/\s+/g, " ").trim();

async function spotCheckBinBaz(samples: any[]) {
  console.log("\n=== Spot-checking Ibn Baz (5 samples) ===");
  for (const [idx, r] of samples.entries()) {
    try {
      const res = await fetch(r.url, { headers: HEADERS, signal: AbortSignal.timeout(15_000) });
      if (!res.ok) {
        console.log(`[${idx + 1}] HTTP ${res.status}: ${r.url}`);
        continue;
      }
      const html = await res.text();
      const fatwa = parseBinBazFatwa(html);
      const cleanAnswer = fatwa ? normalize(fatwa.answer) : normalize(htmlToText(html));
      const cleanQuote = normalize(r.text_original);
      const found = cleanAnswer.includes(cleanQuote);
      console.log(`[${idx + 1}] ID: ${r.id.slice(0, 8)} | Title: ${r.title.slice(0, 40)} | In live page? ${found ? "YES" : "NO"} | Chars: ${r.text_original.length}`);
    } catch (e: any) {
      console.log(`[${idx + 1}] Error: ${e.message}`);
    }
  }
}

async function spotCheckUthaymeen(samples: any[]) {
  console.log("\n=== Spot-checking Ibn Uthaymeen (5 samples) ===");
  for (const [idx, r] of samples.entries()) {
    try {
      const parts = r.url.split("/");
      const itemId = parts[parts.length - 1];
      const res = await fetch(`https://shekhapi.binothaimeen.net/lessons/audios/show/${itemId}/0/1`, {
        headers: HEADERS,
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        console.log(`[${idx + 1}] HTTP ${res.status}: ${itemId}`);
        continue;
      }
      const json = await res.json();
      const cleanAnswer = normalize(htmlToText(json.data?.objective?.content?.ar ?? ""));
      const cleanQuote = normalize(r.text_original);
      const found = cleanAnswer.includes(cleanQuote);
      console.log(`[${idx + 1}] ID: ${r.id.slice(0, 8)} | Title: ${r.title.slice(0, 40)} | In live page? ${found ? "YES" : "NO"} | Chars: ${r.text_original.length}`);
    } catch (e: any) {
      console.log(`[${idx + 1}] Error: ${e.message}`);
    }
  }
}

async function spotCheckAlbani(samples: any[]) {
  console.log("\n=== Spot-checking al-Albani (5 samples) ===");
  for (const [idx, r] of samples.entries()) {
    try {
      const res = await fetch(r.url, { headers: HEADERS, signal: AbortSignal.timeout(15_000) });
      if (!res.ok) {
        console.log(`[${idx + 1}] HTTP ${res.status}: ${r.url}`);
        continue;
      }
      const html = await res.text();
      const fatwa = parseAlbaniFatwa(html, { title: r.title });
      const cleanAnswer = fatwa ? normalize(fatwa.answer) : normalize(htmlToText(html));
      const cleanQuote = normalize(r.text_original);
      const found = cleanAnswer.includes(cleanQuote);
      console.log(`[${idx + 1}] ID: ${r.id.slice(0, 8)} | Title: ${r.title.slice(0, 40)} | In live page? ${found ? "YES" : "NO"} | Chars: ${r.text_original.length}`);
    } catch (e: any) {
      console.log(`[${idx + 1}] Error: ${e.message}`);
    }
  }
}

async function main() {
  const { data: binbaz } = await db.from("sources").select("id, title, url, text_original, created_at").eq("scholar_id", "ibn-baz").order("created_at", { ascending: false }).limit(5);
  const { data: uthaymeen } = await db.from("sources").select("id, title, url, text_original, created_at").eq("scholar_id", "ibn-uthaymeen").order("created_at", { ascending: false }).limit(5);
  const { data: albani } = await db.from("sources").select("id, title, url, text_original, created_at").eq("scholar_id", "al-albani").order("created_at", { ascending: false }).limit(5);

  if (binbaz?.length) await spotCheckBinBaz(binbaz);
  if (uthaymeen?.length) await spotCheckUthaymeen(uthaymeen);
  if (albani?.length) await spotCheckAlbani(albani);
}

main();
