import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "@/lib/i18n";

export type ScholarTranslation = {
  source_id: string;
  lang: "en" | "de";
  text: string;
  origin: "ai" | "human";
  published: boolean;
};

type TranslationLookup = (sourceIds: string[], language: "en" | "de") => Promise<ScholarTranslation[]>;

let client: SupabaseClient | null = null;

function db(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  client ??= createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

async function queryTranslations(sourceIds: string[], language: "en" | "de"): Promise<ScholarTranslation[]> {
  const supabase = db();
  if (!supabase || sourceIds.length === 0) return [];
  const { data, error } = await supabase
    .from("source_translations")
    .select("source_id, lang, text, origin, published")
    .in("source_id", sourceIds)
    .eq("lang", language)
    .eq("origin", "ai");
  if (error) throw new Error(`scholar translations could not be read: ${error.message}`);
  return (data as ScholarTranslation[] | null) ?? [];
}

/** Returns display-only AI translations. It never writes and never runs for Arabic. */
export async function getScholarTranslations(
  sourceIds: string[],
  language: Locale,
  lookup: TranslationLookup = queryTranslations,
): Promise<Map<string, string>> {
  if (language !== "en" && language !== "de") return new Map();
  const ids = [...new Set(sourceIds)].filter(Boolean);
  if (ids.length === 0) return new Map();
  try {
    const rows = await lookup(ids, language);
    return new Map(rows
      .filter((row) => row.origin === "ai" && (row.published || process.env.SHOW_AI_TRANSLATIONS === "true") && row.text.trim())
      .map((row) => [row.source_id, row.text]));
  } catch {
    return new Map();
  }
}
