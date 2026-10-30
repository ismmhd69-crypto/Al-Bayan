import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { normalizeArabic } from "@/lib/ask/checks";
import { originalExcerpt } from "./excerpt";
import type { Locale } from "@/lib/i18n";

export const HADITH_WORD_PAGE = 10;

export interface HadithWordHit {
  collection: "bukhari" | "muslim";
  /** Number as used in the reader's address, e.g. "1" or "278e". */
  number: string;
  /** Book number, when the stored reference has one. */
  book: string | null;
  /** The Arabic chapter heading, when the stored reference has one. */
  chapter: string | null;
  /** A short excerpt; matched words are wrapped in ⟦ ⟧. */
  excerpt: string;
  /** Language of the excerpt: the page language's translation, or Arabic. */
  excerptLang: "ar" | "en" | "de";
}

let client: SupabaseClient | null = null;
function db(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("hadith search is not configured");
  client ??= createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

/** Arabic script in the query searches the Arabic text; anything else searches the page language's translation. */
export function corpusFor(query: string, lang: Locale): "ar" | "en" | "de" {
  if (/[؀-ۿ]/.test(query)) return "ar";
  return lang === "de" ? "de" : "en";
}

const URL_PATTERN = /^https:\/\/sunnah\.com\/(bukhari|muslim):(\d+[a-zA-Z]*)$/;
const REFERENCE_PATTERN = /^[^,]*, hadith [^,]+, book ([^,]+)(?:, (.+))?$/s;

/** Maps one stored row to a result; a row that is not a Bukhari/Muslim reader address is dropped. */
export function toHit(row: { hit_url: string; hit_reference: string; hit_excerpt: string }, excerptLang: HadithWordHit["excerptLang"]): HadithWordHit | null {
  const url = URL_PATTERN.exec(row.hit_url);
  if (!url) return null;
  const ref = REFERENCE_PATTERN.exec(row.hit_reference);
  const excerpt = row.hit_excerpt.replace(/\s+/g, " ").trim();
  if (!excerpt) return null;
  return {
    collection: url[1] as HadithWordHit["collection"],
    number: url[2].toLowerCase(),
    book: ref?.[1]?.trim() || null,
    chapter: ref?.[2]?.replace(/[‌-‏]/g, "").trim() || null,
    excerpt,
    excerptLang,
  };
}

/** One page of hadith whose Arabic text or translation contains the visitor's words. */
export async function searchHadithText(query: string, lang: Locale, page: number, signal?: AbortSignal): Promise<{ hits: HadithWordHit[]; hasMore: boolean }> {
  const corpus = corpusFor(query, lang);
  const text = corpus === "ar" ? normalizeArabic(query) : query;
  if (!text.trim()) return { hits: [], hasMore: false };
  // One extra row tells whether another page exists.
  const call = db().rpc("search_hadith_words", {
    query_text: text,
    search_lang: corpus,
    page_size: HADITH_WORD_PAGE + 1,
    page_offset: (page - 1) * HADITH_WORD_PAGE,
  });
  const { data, error } = await (signal ? call.abortSignal(signal) : call);
  if (error) throw new Error(`hadith word search failed: ${error.message}`);
  const rows = (data as { hit_source_id: string; hit_url: string; hit_reference: string; hit_excerpt: string }[] | null) ?? [];
  const pageRows = rows.slice(0, HADITH_WORD_PAGE);

  // The Arabic index holds normalised text, so the Arabic excerpt is cut from the stored original instead.
  let originals = new Map<string, string>();
  if (corpus === "ar" && pageRows.length > 0) {
    const read = db().from("sources").select("id, text_original").in("id", pageRows.map((r) => r.hit_source_id)).eq("published", true).eq("kind", "hadith");
    const { data: texts, error: readError } = await (signal ? read.abortSignal(signal) : read);
    if (readError) throw new Error(`hadith text could not be read: ${readError.message}`);
    originals = new Map(((texts as { id: string; text_original: string }[] | null) ?? []).map((t) => [t.id, t.text_original]));
  }

  const hits = pageRows.flatMap((row) => {
    const original = originals.get(row.hit_source_id);
    if (corpus === "ar" && !original) return [];
    const hit = toHit({ ...row, hit_excerpt: corpus === "ar" ? originalExcerpt(original!, text) : row.hit_excerpt }, corpus);
    return hit ? [hit] : [];
  });
  return { hits, hasMore: rows.length > HADITH_WORD_PAGE };
}
