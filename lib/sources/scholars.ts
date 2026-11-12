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

/** Read one current stored quote, retaining the published/right/approved-site gates. */
export async function getStoredScholarQuote(id: string): Promise<ScholarQuote | null> {
  if (!/^S[a-f0-9-]{36}$/i.test(id)) return null;
  const supabase = db(); if (!supabase) return null;
  const { data, error } = await supabase.from("sources")
    .select("id, kind, scholar_id, title, reference, text_original, url, scholars(name_ar, name_en, name_de)")
    .eq("id", id.slice(1)).eq("published", true).eq("kind", "fatwa").maybeSingle();
  if (error || !data) return null;
  const r = data as unknown as SourceRow;
  if (!r.scholar_id || !r.scholars) return null;
  const quote: ScholarQuote = { id, scholarId: r.scholar_id, scholarName: { ar: r.scholars.name_ar, en: r.scholars.name_en, de: r.scholars.name_de }, title: r.title, reference: r.reference, arabic: r.text_original, url: r.url };
  if (!scholarQuoteAllowed(quote)) return null;
  // The approved index need not contain the entire quote. Read its own terms by
  // source ID, then retain the existing RPC's current rights/publication checks.
  const index = await supabase.from("source_search_documents").select("search_text").eq("source_id", r.id).eq("approved", true).eq("lang", "ar").limit(1);
  if (index.error || !index.data?.length) return null;
  const queryText = [...new Set(String(index.data[0].search_text).match(/[\p{L}\p{M}\p{N}]+/gu) ?? [])].slice(0, 8).join(" ");
  if (!queryText) return null;
  const eligibility = await supabase.rpc("search_approved_source_candidates", { query_text: queryText,
    answer_language: "ar", question_type: "general", required_facets: [], match_count: 50 }).eq("source_id", r.id);
  return !eligibility.error && Array.isArray(eligibility.data) && eligibility.data.some((row: { source_id: string }) => row.source_id === r.id) ? quote : null;
}

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
    const lookup = supabase.rpc("search_approved_source_candidates", {
      query_text: query,
      answer_language: "ar",
      question_type: "general",
      required_facets: [],
      match_count: options.allVariants ? 50 : limit * 3,
    });
    const { data, error } = await (options.signal ? lookup.abortSignal(options.signal) : lookup);
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

  const read = supabase
    .from("sources")
    .select("id, kind, scholar_id, title, reference, text_original, url, scholars(name_ar, name_en, name_de)")
    .in("id", ids)
    .eq("published", true)
    .eq("kind", "fatwa");
  const { data: rows, error: rowError } = await (options.signal ? read.abortSignal(options.signal) : read);
  if (rowError) throw new Error(`scholar quotes could not be read: ${rowError.message}`);

  const byId = new Map((rows as unknown as SourceRow[] ?? []).map((r) => [r.id, r]));
  audit.wrongKindOrUnavailable = ids.filter((id) => !byId.has(id)).length;
  const eligible = ids
    .map((id) => byId.get(id))
    .filter((r): r is SourceRow => !!r && !!r.scholar_id && !!r.scholars)
    .filter((r) => {
      if (!r.text_original?.trim()) { audit.missingText++; return false; }
      if (!options.meaningCandidates && !isScholarTitleRelevant(expandedPhrases, r.title)) { audit.titleOrTopic++; return false; }
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
