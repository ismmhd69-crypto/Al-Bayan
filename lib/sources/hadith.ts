import "server-only";
import type { Locale } from "@/lib/i18n";
import { normalizeArabic } from "@/lib/ask/checks";
import { parseHadith, type Hadith } from "./hadith-rules";
export { HADITH_ATTRIBUTION, type Hadith } from "./hadith-rules";

// HadeethEnc.com public API (backup hadith source; permission requested by Mo on 2026-09-28).
// Private testing only until they reply. Cached for one day, never stored in our database.
// Only Sahih al-Bukhari / Sahih Muslim hadith graded sahih or hasan get through (hadith-rules.ts).

const API = "https://hadeethenc.com/api/v1";
const CACHE_SECONDS = 86_400;
const TIMEOUT_MS = 10_000;
const MAX_PAGES = 20;

// `cacheToDisk: false` is for the title lists: they are held in memory for a day instead, so
// loading them does not write over a hundred pages to the server's disk cache.
async function get(path: string, cacheToDisk = true): Promise<unknown> {
  const res = await fetch(`${API}${path}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    ...(cacheToDisk ? { next: { revalidate: CACHE_SECONDS } } : { cache: "no-store" as const }),
  });
  if (!res.ok) throw new Error(`HadeethEnc request failed with status ${res.status}`);
  return res.json();
}

// ---------- catalogue: every hadith id with its short title, per language ----------

type Entry = { id: string; title: string; terms: Set<string> };

// For matching only: "Qur’ān", "Qur'an" and "Quran" all become "quran". Stored text is never changed.
function latinPlain(text: string): string {
  return text
    .toLowerCase()
    .replace(/[äöü]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue" })[c]!)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’‘`ʿʾ]/g, "");
}

// Question words and names that appear everywhere, so they never decide a match on their own.
const STOP = new Set([
  "why", "what", "doe", "do", "when", "where", "which", "who", "how", "about", "tell", "the", "and", "you", "they",
  "muslim", "islam", "allah", "god", "prophet", "messenger",
  "warum", "wieso", "weshalb", "was", "wie", "wann", "welch", "wer", "ueber", "gott", "und", "die", "der", "das",
  "لماذا", "ماذا", "كيف", "متي", "هل", "الذي", "مسلم", "مسلمون", "مسلمين", "اسلام", "الله", "نبي", "رسول", "عن",
]);

const ARABIC_PREFIXES = ["وال", "بال", "فال", "كال", "لل", "ال", "و", "ف", "ب", "ل"];
const ARABIC_SUFFIXES = ["ات", "ون", "ين", "ها", "هم", "ه"];

function arabicStem(word: string): string {
  let w = word;
  for (const p of ARABIC_PREFIXES) if (w.startsWith(p) && w.length - p.length >= 3) { w = w.slice(p.length); break; }
  for (const s of ARABIC_SUFFIXES) if (w.endsWith(s) && w.length - s.length >= 3) { w = w.slice(0, -s.length); break; }
  return w;
}

// English and German word endings, so fast / fasts / fasting / fasted / fasten / fastet match,
// while different words like "faster" stay different.
const LATIN_SUFFIXES = ["ings", "ing", "est", "ed", "es", "en", "et", "te", "s", "e", "n"];

// Strips endings repeatedly, so "intention" and "intentions" end up the same.
function latinStem(word: string): string {
  let w = word;
  for (let changed = true; changed; ) {
    changed = false;
    for (const s of LATIN_SUFFIXES) {
      if (w.endsWith(s) && w.length - s.length >= 3) {
        w = w.slice(0, -s.length);
        changed = true;
        break;
      }
    }
  }
  return w;
}

function terms(text: string): Set<string> {
  const ar = (normalizeArabic(text).match(/[ء-ي]+/g) ?? []).filter((w) => w.length >= 3).map(arabicStem);
  const lat = (latinPlain(text).match(/[a-zß]+/g) ?? []).filter((w) => w.length >= 3).map(latinStem);
  return new Set([...ar, ...lat].filter((t) => !STOP.has(t)));
}

// Loads every page of every category, a few requests at a time (not one after another), so the
// lists are ready quickly and never flood HadeethEnc.
const PARALLEL_PAGES = 6;

async function loadCatalogue(language: Locale): Promise<Entry[]> {
  type ListPage = { data?: { id?: unknown; title?: unknown }[]; meta?: { last_page?: unknown } };
  const listPath = (root: string, page: number) =>
    `/hadeeths/list/?language=${language}&category_id=${root}&page=${page}&per_page=100`;
  const pool = async <T,>(jobs: (() => Promise<T>)[]): Promise<T[]> => {
    const out: T[] = new Array(jobs.length);
    let next = 0;
    const worker = async () => {
      while (next < jobs.length) {
        const i = next++;
        out[i] = await jobs[i]();
      }
    };
    await Promise.all(Array.from({ length: Math.min(PARALLEL_PAGES, jobs.length) }, worker));
    return out;
  };

  const roots = (await get(`/categories/roots/?language=${language}`, false)) as { id?: unknown }[];
  if (!Array.isArray(roots)) throw new Error("HadeethEnc categories were not understood");
  const rootIds = roots.map((r) => r?.id).filter((id): id is string => typeof id === "string");

  // First page of each category tells how many pages it has; then fetch the rest.
  const firstPages = await pool(rootIds.map((root) => () => get(listPath(root, 1), false) as Promise<ListPage>));
  const rest = rootIds.flatMap((root, i) => {
    const last = Math.min(Number(firstPages[i]?.meta?.last_page ?? 1), MAX_PAGES);
    return Array.from({ length: Math.max(0, last - 1) }, (_, k) => () => get(listPath(root, k + 2), false) as Promise<ListPage>);
  });
  const pages = [...firstPages, ...(await pool(rest))];

  const byId = new Map<string, Entry>();
  for (const list of pages) {
    if (!Array.isArray(list?.data)) throw new Error("HadeethEnc list was not understood");
    for (const h of list.data) {
      if (typeof h.id === "string" && typeof h.title === "string" && !byId.has(h.id)) {
        byId.set(h.id, { id: h.id, title: h.title, terms: terms(h.title) });
      }
    }
  }
  return [...byId.values()];
}

// Kept on globalThis so the start-up warm-up (instrumentation.ts) and the Ask code share one copy,
// even though Next.js loads them as separate module instances.
type CatalogueCache = Map<Locale, { at: number; entries: Promise<Entry[]> }>;
const globalStore = globalThis as typeof globalThis & { __bayanHadithCatalogues?: CatalogueCache };
const catalogues: CatalogueCache = (globalStore.__bayanHadithCatalogues ??= new Map());

function catalogue(language: Locale): Promise<Entry[]> {
  const hit = catalogues.get(language);
  if (hit && Date.now() - hit.at < CACHE_SECONDS * 1000) return hit.entries;
  const entries = loadCatalogue(language).catch((err) => {
    catalogues.delete(language); // do not cache a failure
    throw err;
  });
  catalogues.set(language, { at: Date.now(), entries });
  return entries;
}

// ---------- search and details ----------

/** Finds hadith whose title shares search words with the queries; returns ids, best first. */
export async function searchHadithIds(queries: string[], language: Locale, limit = 10): Promise<string[]> {
  const entries = await catalogue(language);
  const wanted = new Set(queries.flatMap((q) => [...terms(q)]));
  if (wanted.size === 0) return [];
  // A single search word may match on its own; otherwise at least two different words must match.
  const needed = Math.min(2, wanted.size);
  // Rarer words count more (inverse document frequency).
  const weight = (w: string) => Math.log(1 + entries.length / (1 + entries.filter((e) => e.terms.has(w)).length));
  const weights = new Map([...wanted].map((w) => [w, weight(w)]));
  return entries
    .map((e) => {
      const hit = [...wanted].filter((w) => e.terms.has(w));
      return { id: e.id, hits: hit.length, score: hit.reduce((s, w) => s + weights.get(w)!, 0) };
    })
    .filter((x) => x.hits >= needed)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.id);
}

const inFlight = new Map<string, Promise<Hadith | null>>();

/** One hadith with Arabic, English and German, or null if it is not from the Sahihayn or not sahih/hasan. */
export function getHadith(id: string): Promise<Hadith | null> {
  if (!/^\d+$/.test(id)) return Promise.resolve(null);
  let p = inFlight.get(id);
  if (!p) {
    // Arabic is the base record; English and German are added only when they exist.
    const optional = (language: Locale) => get(`/hadeeths/one/?language=${language}&id=${id}`).catch(() => null);
    p = Promise.all([get(`/hadeeths/one/?language=ar&id=${id}`), optional("en"), optional("de")])
      .then(([ar, en, de]) => parseHadith(ar, en, de))
      .finally(() => inFlight.delete(id));
    inFlight.set(id, p);
  }
  return p;
}

/** Search plus details: only Sahihayn hadith graded sahih or hasan come back. */
export async function searchHadith(queries: string[], language: Locale, limit = 6): Promise<Hadith[]> {
  const ids = await searchHadithIds(queries, language, limit * 3);
  const found = await Promise.all(ids.map(getHadith));
  // HadeethEnc sometimes lists the same hadith under two ids: keep one per Bukhari/Muslim number.
  const seen = new Set<string>();
  return found
    .filter((h): h is Hadith => h !== null)
    .filter((h) => {
      const key = `${h.numbers.bukhari ?? "-"}/${h.numbers.muslim ?? "-"}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

/**
 * Starts loading the English and Arabic title lists in the background (called once when the
 * server starts with hadith switched on), so the first visitor's question does not wait for it.
 * Failures are ignored here; a later search simply tries again.
 */
export function warmHadithCatalogues(): void {
  for (const language of ["en", "ar"] as const) catalogue(language).catch(() => {});
}

/**
 * For the Ask pipeline: searches the English list with English phrases and the Arabic list with
 * Arabic phrases (the two largest lists), then merges them without duplicates.
 * Everything runs against the cached title lists on our server: no search phrase is sent out.
 */
export async function searchHadithMulti(queries: Partial<Record<Locale, string[]>>, limit = 4): Promise<Hadith[]> {
  const lists = await Promise.all(
    (["en", "ar"] as const)
      .filter((language) => (queries[language]?.length ?? 0) > 0)
      .map((language) => searchHadith(queries[language]!, language, limit)),
  );
  const seen = new Set<string>();
  const out: Hadith[] = [];
  // Interleave, so each language's best result comes first.
  for (let i = 0; i < limit; i++) {
    for (const list of lists) {
      const h = list[i];
      if (!h) continue;
      const key = `${h.numbers.bukhari ?? "-"}/${h.numbers.muslim ?? "-"}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(h);
    }
  }
  return out.slice(0, limit);
}
