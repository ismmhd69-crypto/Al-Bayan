import { askTimeout } from "@/lib/ask/timing";
import "server-only";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { Locale } from "@/lib/i18n";
import type { RichSource, DisplayTranslation } from "./rich-answer";
import { canonicalSourcePage } from "./search-engine/candidate-identity";
import { HADITH_LIBRARY_ID } from "./ids";

type TranslationRow = { source_id: string; lang: string; text: unknown; origin: string; published: boolean; reviewer: unknown; reviewed_at: unknown; version: number };
const TRANSLATION_COLUMNS = "source_id, lang, text, origin, published, reviewer, reviewed_at, version";

/** Picks the newest human, else AI, translation of a matched original. Conflicting or malformed rows reject. */
function chooseTranslation(source: RichSource, originalIds: string[], translations: TranslationRow[], language: Locale): DisplayTranslation {
  const rows = translations.filter(t => originalIds.includes(t.source_id) && t.lang === language && t.published === true && ["ai", "human"].includes(t.origin))
    .sort((a, b) => b.version - a.version);
  if (rows.some(t => typeof t.text !== "string" || !t.text.trim() || t.text.length > 16000 || !Number.isSafeInteger(t.version) || t.version < 1
    || t.origin === "human" && (typeof t.reviewer !== "string" || !t.reviewer.trim() || typeof t.reviewed_at !== "string" || !Number.isFinite(Date.parse(t.reviewed_at))))) return { status: "rejected" };
  const t = rows.find(t => t.origin === "human") ?? rows.find(t => t.origin === "ai");
  if (t && rows.some(other => other.origin === t.origin && other.version === t.version && other.text !== t.text)) return { status: "rejected" };
  return t && typeof t.text === "string" && t.text.trim() && t.text.length <= 16000
    ? { status: "ready", text: t.text, language: language as "en" | "de", origin: t.origin as "ai" | "human", original: source.evidence.arabic,
      originalHash: createHash("sha256").update(source.evidence.arabic).digest("hex"),
      ...(t.origin === "human" && typeof t.reviewer === "string" && t.reviewer.trim() && typeof t.reviewed_at === "string" && Number.isFinite(Date.parse(t.reviewed_at))
        ? { reviewer: t.reviewer, reviewedAt: t.reviewed_at } : {}) }
    : { status: "unavailable" };
}

/** Candidate display text only. A checker must compare it with this exact original before use.
 * URL plus exact original resolves live-generated ids without treating a hash as a database id.
 * Old translations are not trusted merely because they are published. No writes or generation. */
export async function lookupDisplayTranslations(sources: RichSource[], language: Locale, signal: AbortSignal): Promise<Map<string, DisplayTranslation>> {
  if (language === "ar") return new Map();
  const [scholars, hadith] = await Promise.all([lookupScholarTranslations(sources, language, signal), lookupStoredHadithTranslations(sources, language, signal)]);
  return new Map([...scholars, ...hadith]);
}

/** Stored Sunnah.com hadith ("SH<uuid>"): the row must still be the published original with the same link and exact text. */
async function lookupStoredHadithTranslations(sources: RichSource[], language: Locale, signal: AbortSignal): Promise<Map<string, DisplayTranslation>> {
  const hadith = sources.filter(s => s.evidence.kind === "hadith" && HADITH_LIBRARY_ID.test(s.id));
  const unavailable = (status: "unavailable" | "lookup_failed") => new Map(hadith.map(s => [s.id, { status } as DisplayTranslation]));
  if (!hadith.length) return new Map();
  if (hadith.length > 16 || new Set(hadith.map(s => s.id)).size !== hadith.length) return unavailable("lookup_failed");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return unavailable("unavailable");
  const bounded = askTimeout(signal, 4000, "display_translation_lookup");
  try {
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: originals, error } = await db.from("sources").select("id, url, text_original")
      .in("id", hadith.map(s => s.id.slice(2))).eq("kind", "hadith").eq("published", true).limit(17).abortSignal(bounded);
    if (error || (originals?.length ?? 0) > 16) return unavailable("lookup_failed");
    const matched = (s: RichSource) => (originals ?? []).some(o => o.id === s.id.slice(2) && o.url === s.evidence.url && o.text_original === s.evidence.arabic);
    const ids = hadith.filter(matched).map(s => s.id.slice(2));
    if (!ids.length) return unavailable("unavailable");
    const { data: translations, error: translationError } = await db.from("source_translations")
      .select(TRANSLATION_COLUMNS).in("source_id", ids).eq("lang", language).eq("published", true).limit(33).abortSignal(bounded);
    if (translationError || (translations?.length ?? 0) > 32) return unavailable("lookup_failed");
    return new Map(hadith.map(s => [s.id, matched(s) ? chooseTranslation(s, [s.id.slice(2)], (translations ?? []) as TranslationRow[], language) : { status: "unavailable" } as DisplayTranslation]));
  } catch { return unavailable("lookup_failed"); }
}

async function lookupScholarTranslations(sources: RichSource[], language: Locale, signal: AbortSignal): Promise<Map<string, DisplayTranslation>> {
  const result = new Map<string, DisplayTranslation>();
  const scholars = sources.filter(s => s.evidence.kind === "scholar");
  const unavailable = (status: "unavailable" | "lookup_failed") => new Map(scholars.map(s => [s.id, { status } as DisplayTranslation]));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SECRET_KEY;
  if (!scholars.length) return result;
  if (scholars.length > 14 || new Set(scholars.map(s => s.id)).size !== scholars.length) return unavailable("lookup_failed");
  if (!url || !key) return unavailable("unavailable");
  // A cold database connection plus up to four lookups can exceed 1.5 s; 4 s keeps translations
  // from disappearing at random on a fresh server (seen locally on 2026-10-29).
  const bounded = askTimeout(signal, 4000, "display_translation_lookup");
  try {
    const canonical = (value: string) => new URL(value).href;
    const urlVariants = [...new Set(scholars.flatMap(s => [s.evidence.url, canonical(s.evidence.url), decodeURI(s.evidence.url), canonicalSourcePage(s.evidence.url)]))];
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const columns = "id, url, text_original, scholar_id";
    const { data: originals, error } = await db.from("sources").select(columns)
      .in("url", urlVariants).eq("kind", "fatwa").eq("published", true).limit(31).abortSignal(bounded);
    if (error || (originals?.length ?? 0) > 30) return unavailable("lookup_failed");
    const rows = [...(originals ?? [])];
    const matches = (s: RichSource, o: typeof rows[number]) => s.evidence.kind === "scholar"
      && o.scholar_id === s.evidence.scholarId && o.text_original === s.evidence.arabic
      && canonicalSourcePage(o.url) === canonicalSourcePage(s.evidence.url);
    const failures = new Set<string>();
    let missing = scholars.filter(s => !rows.some(o => matches(s, o)));
    if (missing.length) {
      // An ID is a lookup aid only: live IDs may be generated hashes. Every row
      // must still match the official page, named scholar and exact original.
      const ids = [...new Set(missing.map(s => s.id.slice(1)).filter(id => /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id)))];
      if (ids.length) {
        const found = await db.from("sources").select(columns).in("id", ids).eq("kind", "fatwa").eq("published", true).limit(31).abortSignal(bounded);
        if (found.error || (found.data?.length ?? 0) > 30) missing.forEach(s => failures.add(s.id)); else rows.push(...(found.data ?? []));
      }
      missing = missing.filter(s => !rows.some(o => matches(s, o)));
      const pages = [...new Set(missing.map(s => canonicalSourcePage(s.evidence.url))
        .filter(page => /^https:\/\/binbaz\.org\.sa\/fatwas\/[0-9]+$/.test(page)))];
      // The existing provider canonicalisation identifies this family's pages by
      // numeric ID. No question/topic references or arbitrary URL patterns enter SQL.
      await Promise.all(pages.map(async page => {
        const found = await db.from("sources").select(columns).like("url", `${page}/%`)
          .eq("kind", "fatwa").eq("published", true).limit(31).abortSignal(bounded);
        if (found.error || (found.data?.length ?? 0) > 30) missing.filter(s => canonicalSourcePage(s.evidence.url) === page).forEach(s => failures.add(s.id));
        else rows.push(...(found.data ?? []));
      }));
    }
    const matched = scholars.map(s => ({ source: s, originals: rows.filter(o => matches(s, o)) }));
    const ids = [...new Set(matched.flatMap(m => m.originals.map(o => o.id as string)))];
    if (!ids.length) return new Map(scholars.map(s => [s.id, { status: failures.has(s.id) ? "lookup_failed" : "unavailable" } as DisplayTranslation]));
    const { data: translations, error: translationError } = await db.from("source_translations")
      .select(TRANSLATION_COLUMNS).in("source_id", ids).eq("lang", language).eq("published", true).limit(61).abortSignal(bounded);
    if (translationError || (translations?.length ?? 0) > 60) return unavailable("lookup_failed");
    for (const { source, originals } of matched) {
      if (!originals.length) { result.set(source.id, { status: failures.has(source.id) ? "lookup_failed" : "unavailable" }); continue; }
      result.set(source.id, chooseTranslation(source, originals.map(o => o.id as string), (translations ?? []) as TranslationRow[], language));
    }
    return result;
  } catch { return unavailable("lookup_failed"); }
}
