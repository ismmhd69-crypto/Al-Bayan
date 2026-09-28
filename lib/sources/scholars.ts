import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { toSearchQuery, type ScholarQuote } from "./scholar-rules";

// Reads the private scholar quote library (collected short quotes, see scripts/collect-binbaz.ts).
// The library is not public, so this runs on the server only, with the secret key.
// Search goes through the database function search_approved_source_candidates, which only returns
// published quotes whose rights record allows search and AI use.

let client: SupabaseClient | null = null;

function db(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  client ??= createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

type SourceRow = {
  id: string;
  kind: string;
  scholar_id: string | null;
  title: string | null;
  reference: string;
  text_original: string;
  url: string;
  scholars: { name_ar: string; name_en: string; name_de: string } | null;
};

/** Quotes whose search text matches the question's Arabic phrases, best first. */
export async function searchScholarQuotes(phrases: string[], limit = 3): Promise<ScholarQuote[]> {
  const supabase = db();
  const query = toSearchQuery(phrases);
  if (!supabase || !query) return [];

  const { data: hits, error } = await supabase.rpc("search_approved_source_candidates", {
    query_text: query,
    answer_language: "ar",
    question_type: "general",
    required_facets: [],
    match_count: limit * 3,
  });
  if (error) throw new Error(`scholar search failed: ${error.message}`);
  const ids = [...new Set((hits as { source_id: string }[] | null ?? []).map((h) => h.source_id))].slice(0, limit * 2);
  if (ids.length === 0) return [];

  const { data: rows, error: rowError } = await supabase
    .from("sources")
    .select("id, kind, scholar_id, title, reference, text_original, url, scholars(name_ar, name_en, name_de)")
    .in("id", ids)
    .eq("published", true)
    .eq("kind", "fatwa");
  if (rowError) throw new Error(`scholar quotes could not be read: ${rowError.message}`);

  const byId = new Map((rows as unknown as SourceRow[] ?? []).map((r) => [r.id, r]));
  return ids
    .map((id) => byId.get(id))
    .filter((r): r is SourceRow => !!r && !!r.scholar_id && !!r.scholars)
    .map((r) => ({
      id: `S${r.id}`,
      scholarId: r.scholar_id!,
      scholarName: { ar: r.scholars!.name_ar, en: r.scholars!.name_en, de: r.scholars!.name_de },
      title: r.title,
      reference: r.reference,
      arabic: r.text_original,
      url: r.url,
    }))
    .slice(0, limit);
}
