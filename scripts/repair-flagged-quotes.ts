import { createClient } from "@supabase/supabase-js";
import flagged from "../docs/quote-review-flagged.json" with { type: "json" };
import { getVerifier } from "../lib/ai";
import {
  checkQuoteRelevance,
  excerpt,
  isUthaymeenTafsirLesson,
  looksLikeQuestion,
  parseBinBazFatwa,
  parseUthaymeenFatwa,
  searchText,
  sharesContentWord,
  startsLikeRoomTalk,
} from "../lib/sources/scholar-excerpt";

process.loadEnvFile(".env");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const PAUSE_MS = 600;

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Missing Supabase credentials in .env");

  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const verifier = getVerifier();

  let repairedCount = 0;
  let unpublishedCount = 0;

  const stats = {
    "ibn-baz": { repaired: 0, unpublished: 0 },
    "ibn-uthaymeen": { repaired: 0, unpublished: 0 },
  };

  console.log(`Starting review of ${flagged.length} flagged quotes...\n`);

  for (let i = 0; i < flagged.length; i++) {
    const f = flagged[i];
    console.log(`[${i + 1}/${flagged.length}] Checking (${f.scholar}): "${f.title}"...`);

    let newQuote: string | null = null;
    let failReason = "";

    try {
      if (f.scholar === "ibn-baz") {
        const res = await fetch(f.url, {
          headers: { "User-Agent": "AlBayan-Collector/0.1 (non-commercial Islamic Q&A)" },
          signal: AbortSignal.timeout(15_000),
        });
        await sleep(PAUSE_MS);

        if (!res.ok) {
          failReason = `HTTP ${res.status}`;
        } else {
          const html = await res.text();
          const fatwa = parseBinBazFatwa(html, { title: f.title });
          const quote = fatwa && excerpt(fatwa.answer);

          if (!fatwa) {
            failReason = "Could not parse fatwa";
          } else if (!quote) {
            failReason = "No clean excerpt";
          } else if (quote.length < 200) {
            failReason = `Quote too short (${quote.length} chars)`;
          } else if (startsLikeRoomTalk(quote)) {
            failReason = "Starts with room talk";
          } else if (!sharesContentWord(f.title, quote)) {
            failReason = "Does not share content word with title";
          } else if (looksLikeQuestion(quote)) {
            failReason = "Looks like question";
          } else {
            // Check AI relevance
            const rel = await checkQuoteRelevance(verifier, f.title, quote);
            if (rel.answers) {
              newQuote = quote;
            } else {
              failReason = `AI relevance rejected: ${rel.reason}`;
            }
          }
        }
      } else if (f.scholar === "ibn-uthaymeen") {
        if (isUthaymeenTafsirLesson(f.title)) {
          failReason = "Tafsir lesson (not fatwa)";
        } else {
          const parts = f.url.split("/");
          const itemId = parts[parts.length - 1];
          const res = await fetch(
            `https://shekhapi.binothaimeen.net/lessons/audios/show/${itemId}/0/1?getManySectionsWithAllParent=audio_library&getAllPaths=1`,
            {
              headers: { "User-Agent": "AlBayan-Collector/0.1" },
              signal: AbortSignal.timeout(15_000),
            }
          );
          await sleep(PAUSE_MS);

          if (!res.ok) {
            failReason = `HTTP ${res.status}`;
          } else {
            const json = (await res.json()) as { data?: { objective?: { content?: { ar?: string } } } };
            const content = json.data?.objective?.content?.ar ?? "";
            const fatwa = parseUthaymeenFatwa(content, { title: f.title });
            const quote = fatwa && excerpt(fatwa.answer);

            if (!fatwa) {
              failReason = "Could not parse fatwa";
            } else if (!quote) {
              failReason = "No clean excerpt";
            } else if (quote.length < 200) {
              failReason = `Quote too short (${quote.length} chars)`;
            } else if (startsLikeRoomTalk(quote)) {
              failReason = "Starts with room talk";
            } else if (!sharesContentWord(f.title, quote)) {
              failReason = "Does not share content word with title";
            } else if (looksLikeQuestion(quote)) {
              failReason = "Looks like question";
            } else {
              // Check AI relevance
              const rel = await checkQuoteRelevance(verifier, f.title, quote);
              if (rel.answers) {
                newQuote = quote;
              } else {
                failReason = `AI relevance rejected: ${rel.reason}`;
              }
            }
          }
        }
      } else {
        failReason = `Unknown scholar: ${f.scholar}`;
      }
    } catch (err) {
      failReason = `Error: ${(err as Error).message}`;
    }

    if (newQuote) {
      // Update sources row with newQuote and ensure published = true
      const { error: srcErr } = await db
        .from("sources")
        .update({
          text_original: newQuote,
          published: true,
        })
        .eq("id", f.id);

      if (srcErr) {
        console.error(`  Error updating source ${f.id}:`, srcErr.message);
      }

      // Update source_search_documents
      const { error: docErr } = await db
        .from("source_search_documents")
        .update({
          search_text: searchText(f.title, newQuote),
        })
        .eq("source_id", f.id);

      if (docErr) {
        console.error(`  Error updating search doc for ${f.id}:`, docErr.message);
      }

      repairedCount++;
      if (f.scholar === "ibn-baz" || f.scholar === "ibn-uthaymeen") {
        stats[f.scholar].repaired++;
      }
      console.log(`  -> [REPAIRED] ${newQuote.length} chars: "${newQuote.slice(0, 80)}..."`);
    } else {
      // Set published = false (never delete)
      const { error: unpubErr } = await db
        .from("sources")
        .update({
          published: false,
        })
        .eq("id", f.id);

      if (unpubErr) {
        console.error(`  Error unpublishing source ${f.id}:`, unpubErr.message);
      }

      unpublishedCount++;
      if (f.scholar === "ibn-baz" || f.scholar === "ibn-uthaymeen") {
        stats[f.scholar].unpublished++;
      }
      console.log(`  -> [UNPUBLISHED] Reason: ${failReason}`);
    }
  }

  console.log("\n==========================================");
  console.log("CLEANUP BATCH COMPLETED");
  console.log(`Total Flagged: ${flagged.length}`);
  console.log(`Repaired: ${repairedCount}`);
  console.log(`Unpublished: ${unpublishedCount}`);
  console.log("Breakdown by scholar:");
  console.log(`  Ibn Baz: ${stats["ibn-baz"].repaired} repaired, ${stats["ibn-baz"].unpublished} unpublished`);
  console.log(`  Ibn Uthaymeen: ${stats["ibn-uthaymeen"].repaired} repaired, ${stats["ibn-uthaymeen"].unpublished} unpublished`);
  console.log("==========================================");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
