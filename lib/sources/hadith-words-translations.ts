import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "@/lib/i18n";

// Short AI translations of only the quoted words of a stored hadith (public.hadith_words_translations,
// migration 20261002120000, prepared for Mo). Display only, read-only, same rule as the full translations:
// published rows always, unpublished AI rows only with SHOW_AI_TRANSLATIONS=true. Any failure (including
// the table not existing yet) returns nothing, and the card falls back to the full translation.

export type HadithWordsTranslation = {
  source_id: string;
  lang: "en" | "de";
  text: string;
  origin: "ai";
  published: boolean;
};

type Lookup = (sourceIds: string[], language: "en" | "de") => Promise<HadithWordsTranslation[]>;

let client: SupabaseClient | null = null;

function db(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  client ??= createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

async function query(sourceIds: string[], language: "en" | "de"): Promise<HadithWordsTranslation[]> {
  const supabase = db();
  if (!supabase || sourceIds.length === 0) return [];
  const { data, error } = await supabase
    .from("hadith_words_translations")
    .select("source_id, lang, text, origin, published")
    .in("source_id", sourceIds)
    .eq("lang", language)
    .eq("origin", "ai");
  if (error) throw new Error(`hadith words translations could not be read: ${error.message}`);
  return (data as HadithWordsTranslation[] | null) ?? [];
}

/** Words-only translations by source uuid. Never writes, never runs for Arabic, never throws. */
export async function getHadithWordsTranslations(sourceIds: string[], language: Locale, lookup: Lookup = query): Promise<Map<string, string>> {
  if (language !== "en" && language !== "de") return new Map();
  const ids = [...new Set(sourceIds)].filter(Boolean);
  if (ids.length === 0) return new Map();
  try {
    const rows = await lookup(ids, language);
    return new Map(rows
      .filter((row) => row.origin === "ai" && row.lang === language && (row.published || process.env.SHOW_AI_TRANSLATIONS === "true") && row.text.trim())
      .map((row) => [row.source_id, row.text]));
  } catch {
    return new Map();
  }
}
