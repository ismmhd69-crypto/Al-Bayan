import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "@/lib/i18n";
import {
  hadithSearchQueries,
  hadithTopicScore,
  hadithTopicWords,
  isContinuationHadith,
  mapStoredHadith,
  MAX_LIBRARY_HADITH_CHARS,
  type Hadith,
  type StoredHadithRow,
} from "./hadith-rules";

// Reads the stored Sahih al-Bukhari / Sahih Muslim hadith (public.sources, kind 'hadith'). Read-only.
// Search uses the same database function as the scholar quotes; it only returns published rows whose
// rights record allows search and AI use. Server only, with the secret key.

const MAX_RESULTS = 8;
const SEARCH_POOL = 50; // the database function's own maximum; fatwas share it, hadith rows are picked out afterwards
const COLUMNS = "id, kind, scholar_id, published, reference, collection, grade, text_original, url, title";

let client: SupabaseClient | null = null;

function db(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  client ??= createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

/** Stored hadith for the question's Arabic phrases, best first. Throws on any lookup failure (the caller fails closed). */
export async function searchLibraryHadith(queries: Partial<Record<Locale, string[]>>): Promise<Hadith[]> {
  const phrases = queries.ar ?? [];
  if (phrases.length === 0) return [];
  const supabase = db();
  if (!supabase) throw new Error("hadith library is not configured");

  // Every query is searched at the same time. Stopping at the first one with hits is not enough here:
  // fatwas and short "same chain" reports share the function's 50 results, so one query may hold no
  // usable hadith at all.
  const levels = await Promise.all(hadithSearchQueries(phrases).map(async (query) => {
    const { data, error } = await supabase.rpc("search_approved_source_candidates", {
      query_text: query,
      answer_language: "ar",
      question_type: "general",
      required_facets: [],
      match_count: SEARCH_POOL,
    });
    if (error) throw new Error(`hadith search failed: ${error.message}`);
    return (data as { source_id: string }[] | null) ?? [];
  }));
  // Interleave by rank (best of each query first) so every phrase gets its share of the 8 places.
  const hits = Array.from({ length: Math.max(0, ...levels.map((l) => l.length)) }, (_, i) => levels.map((l) => l[i]))
    .flat().filter((h): h is { source_id: string } => !!h);
  const ids = [...new Set(hits.map((h) => h.source_id))];
  if (ids.length === 0) return [];

  // One batched read for every hit; rows that are not published hadith are simply not returned.
  const { data: rows, error } = await supabase
    .from("sources").select(COLUMNS).in("id", ids).eq("published", true).eq("kind", "hadith");
  if (error) throw new Error(`hadith could not be read: ${error.message}`);
  const byId = new Map(((rows as StoredHadithRow[] | null) ?? []).map((r) => [r.id, r]));
  // Best match first: the number of the question's topic words found in the chapter heading and text
  // (ties keep the database order). A hadith that shares no topic word was only found through the chain word.
  const topic = hadithTopicWords(phrases);
  return ids
    .map((id, order) => ({ row: byId.get(id), order }))
    .filter((x): x is { row: StoredHadithRow; order: number } => !!x.row)
    .filter(({ row }) => !isContinuationHadith(row.text_original) && row.text_original.length <= MAX_LIBRARY_HADITH_CHARS)
    .map(({ row, order }) => ({ row, order, score: hadithTopicScore(row.reference.split(", ").slice(3).join(", "), row.text_original, topic) }))
    .filter((x) => topic.length === 0 || x.score > 0)
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .map(({ row }) => mapStoredHadith(row))
    .filter((h): h is Hadith => !!h)
    .slice(0, MAX_RESULTS);
}

/** One stored hadith by the uuid part of its "SH<uuid>" id, or null. Used to re-check and to reopen saved chats. */
export async function getLibraryHadith(uuid: string): Promise<Hadith | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(uuid)) return null;
  const supabase = db();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("sources").select(COLUMNS).eq("id", uuid).eq("published", true).eq("kind", "hadith").maybeSingle();
  if (error || !data) return null;
  return mapStoredHadith(data as StoredHadithRow);
}
