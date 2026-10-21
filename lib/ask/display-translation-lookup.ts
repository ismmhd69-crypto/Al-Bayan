import { askTimeout } from "@/lib/ask/timing";
import "server-only";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { Locale } from "@/lib/i18n";
import type { RichSource, DisplayTranslation } from "./rich-answer";

/** Candidate display text only. A checker must compare it with this exact original before use.
 * URL plus exact original resolves live-generated ids without treating a hash as a database id.
 * Old translations are not trusted merely because they are published. No writes or generation. */
export async function lookupDisplayTranslations(sources: RichSource[], language: Locale, signal: AbortSignal): Promise<Map<string, DisplayTranslation>> {
  const result = new Map<string, DisplayTranslation>();
  if (language === "ar") return result;
  const scholars = sources.filter(s => s.evidence.kind === "scholar");
  const unavailable = (status: "unavailable" | "lookup_failed") => new Map(scholars.map(s => [s.id, { status } as DisplayTranslation]));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SECRET_KEY;
  if (!scholars.length) return result;
  if (!url || !key) return unavailable("unavailable");
  const bounded = askTimeout(signal, 1500, "display_translation_lookup");
  try {
    const canonical = (value: string) => new URL(value).href;
    const urlVariants = [...new Set(scholars.flatMap(s => [s.evidence.url, canonical(s.evidence.url), decodeURI(s.evidence.url)]))];
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: originals, error } = await db.from("sources").select("id, url, text_original")
      .in("url", urlVariants).eq("kind", "fatwa").eq("published", true).limit(30).abortSignal(bounded);
    if (error) return unavailable("lookup_failed");
    const matched = scholars.map(s => ({ source: s, original: originals?.find(o => canonical(o.url) === canonical(s.evidence.url) && o.text_original === s.evidence.arabic) }));
    const ids = matched.flatMap(m => m.original ? [m.original.id as string] : []);
    if (!ids.length) return unavailable("unavailable");
    const { data: translations, error: translationError } = await db.from("source_translations")
      .select("source_id, lang, text, origin, published, reviewer, reviewed_at, version").in("source_id", ids).eq("lang", language).eq("published", true).limit(60).abortSignal(bounded);
    if (translationError) return unavailable("lookup_failed");
    for (const { source, original } of matched) {
      const rows = (translations?.filter(t => t.source_id === original?.id && t.lang === language && t.published === true && ["ai", "human"].includes(t.origin)) ?? [])
        .sort((a, b) => b.version - a.version);
      const t = rows.find(t => t.origin === "human" && t.reviewer && t.reviewed_at) ?? rows.find(t => t.origin === "human") ?? rows.find(t => t.origin === "ai");
      result.set(source.id, t && typeof t.text === "string" && t.text.trim() && t.text.length <= 16000
        ? { status: "ready", text: t.text, language, origin: t.origin as "ai" | "human", original: source.evidence.arabic,
          originalHash: createHash("sha256").update(source.evidence.arabic).digest("hex"),
          ...(t.origin === "human" && typeof t.reviewer === "string" && t.reviewer.trim() && typeof t.reviewed_at === "string" && Number.isFinite(Date.parse(t.reviewed_at))
            ? { reviewer: t.reviewer, reviewedAt: t.reviewed_at } : {}) }
        : { status: "unavailable" });
    }
    return result;
  } catch { return unavailable("lookup_failed"); }
}
