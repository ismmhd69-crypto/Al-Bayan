import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expandScholarSearchAliases, isScholarTitleRelevant, scholarQuoteAllowed, searchQueryLevels, type ScholarQuote } from "./scholar-rules";
import { emptySearchAudit, type SearchOptions } from "./search-audit";
import { interleaveUnique } from "@/lib/ask/library-flow";

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
export async function searchScholarQuotes(phrases: string[], limit = 3, options: SearchOptions = {}): Promise<ScholarQuote[]> {
  const audit = emptySearchAudit("scholar");
  const supabase = db();
  if (!supabase) { audit.configurationMissing = true; options.onAudit?.(audit); return []; }

  const expandedPhrases = expandScholarSearchAliases(phrases);

  // Strict first, then looser phrases (see searchQueryLevels); the evidence check still judges each quote.
  let hits: { source_id: string }[] = [];
  const queryLevels = searchQueryLevels(expandedPhrases);
  const search = async (query: string) => {
    audit.queries++;
    const { data, error } = await supabase.rpc("search_approved_source_candidates", {
      query_text: query,
      answer_language: "ar",
      question_type: "general",
      required_facets: [],
      match_count: options.allVariants ? 50 : limit * 3,
    });
    if (error) throw new Error(`scholar search failed: ${error.message}`);
    const result = (data as { source_id: string }[] | null) ?? [];
    if (result.length >= 50) audit.ceilingHits++;
    return result;
  };
  if (options.allVariants) {
    hits = interleaveUnique(await Promise.all(queryLevels.slice(0, 4).map(search)), (hit) => hit.source_id, 200);
  } else {
    for (const query of queryLevels) {
      hits = await search(query);
      if (hits.length > 0) break;
    }
  }
  const ids = [...new Set(hits.map((h) => h.source_id))].slice(0, options.allVariants ? 200 : limit * 2);
  audit.hits = ids.length;
  if (ids.length === 0) { options.onAudit?.(audit); return []; }

  const { data: rows, error: rowError } = await supabase
    .from("sources")
    .select("id, kind, scholar_id, title, reference, text_original, url, scholars(name_ar, name_en, name_de)")
    .in("id", ids)
    .eq("published", true)
    .eq("kind", "fatwa");
  if (rowError) throw new Error(`scholar quotes could not be read: ${rowError.message}`);

  const byId = new Map((rows as unknown as SourceRow[] ?? []).map((r) => [r.id, r]));
  audit.wrongKindOrUnavailable = ids.filter((id) => !byId.has(id)).length;
  const eligible = ids
    .map((id) => byId.get(id))
    .filter((r): r is SourceRow => !!r && !!r.scholar_id && !!r.scholars)
    .filter((r) => {
      if (!r.text_original?.trim()) { audit.missingText++; return false; }
      if (!isScholarTitleRelevant(expandedPhrases, r.title)) { audit.titleOrTopic++; return false; }
      return true;
    })
    .map((r): ScholarQuote => ({
      id: `S${r.id}`,
      scholarId: r.scholar_id!,
      scholarName: { ar: r.scholars!.name_ar, en: r.scholars!.name_en, de: r.scholars!.name_de },
      title: r.title,
      reference: r.reference,
      arabic: r.text_original,
      url: r.url,
    }))
    .filter((quote) => {
      if (!options.allVariants) return true; // Legacy core already applies the same gate.
      if (quote.arabic.trim().length > 600) { audit.length++; return false; }
      if (!scholarQuoteAllowed(quote)) { audit.authenticity++; return false; }
      return true;
    });
  audit.eligible = eligible.length;
  const result = eligible.slice(0, limit);
  audit.returned = result.length;
  options.onAudit?.(audit);
  return result;
}
