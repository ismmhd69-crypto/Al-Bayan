import "server-only";
import { TRANSLATIONS, type Verse } from "./quran-meta";
import type { SearchDoc } from "@/lib/ask/search";
export { ATTRIBUTION, TRANSLATIONS, type Verse } from "./quran-meta";

// Quran Foundation Content API (plan section 4).
// Their terms: cache at most one week, keep the Quran text unmodified, credit the translation
// and Quran Foundation. We cache for one day and never store verses in our own database.
// Text is kept exactly as served: no trimming, no editing. A translation that arrives with
// markup (footnotes etc.) is not shown at all rather than being edited.

const ENVS = {
  prelive: { auth: "https://prelive-oauth2.quran.foundation", api: "https://apis-prelive.quran.foundation" },
  production: { auth: "https://oauth2.quran.foundation", api: "https://apis.quran.foundation" },
} as const;

const env = ENVS[process.env.QURAN_API_ENV === "production" ? "production" : "prelive"];
const CACHE_SECONDS = 86_400;
const TIMEOUT_MS = 10_000;
const MAX_PAGES_PER_CHAPTER = 10; // 286 verses / 50 per page = 6 for the longest surah
const PARALLEL_CHAPTERS = 3;


// Pre-production keys only contain Surahs 1 and 2.
export const CHAPTERS = (process.env.QURAN_CHAPTERS ?? "1,2")
  .split(",")
  .map((n) => Number(n.trim()))
  .filter((n) => Number.isInteger(n) && n >= 1 && n <= 114);

// ---------- auth: one token request at a time ----------

let token: { value: string; expires: number } | null = null;
let tokenPromise: Promise<string> | null = null;

async function requestToken(): Promise<string> {
  const id = process.env.QURAN_FOUNDATION_CLIENT_ID;
  const secret = process.env.QURAN_FOUNDATION_CLIENT_SECRET;
  if (!id || !secret) throw new Error("Quran Foundation credentials are not set");
  const res = await fetch(`${env.auth}/oauth2/token`, {
    method: "POST",
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials&scope=content",
  });
  if (!res.ok) throw new Error(`Quran token request failed with status ${res.status}`);
  const data = (await res.json()) as { access_token?: unknown; expires_in?: unknown };
  if (typeof data.access_token !== "string" || typeof data.expires_in !== "number") {
    throw new Error("Quran token response was not understood");
  }
  // Renew a minute early; tokens last one hour and cannot be refreshed.
  token = { value: data.access_token, expires: Date.now() + (data.expires_in - 60) * 1000 };
  return token.value;
}

function getToken(): Promise<string> {
  if (token && Date.now() < token.expires) return Promise.resolve(token.value);
  tokenPromise ??= requestToken().finally(() => (tokenPromise = null));
  return tokenPromise;
}

// ---------- verses ----------

const showable = (t: unknown): string | null => (typeof t === "string" && t.length > 0 && !/[<>]/.test(t) ? t : null);

function parseVerse(v: unknown): Verse {
  const r = v as Record<string, unknown>;
  if (
    typeof r?.verse_key !== "string" ||
    !/^\d{1,3}:\d{1,3}$/.test(r.verse_key) ||
    typeof r.text_uthmani !== "string" ||
    typeof r.text_imlaei_simple !== "string"
  ) {
    throw new Error("Quran verse response was not understood");
  }
  const tr = Array.isArray(r.translations) ? (r.translations as { resource_id?: unknown; text?: unknown }[]) : [];
  const pick = (id: number) => showable(tr.find((t) => t.resource_id === id)?.text);
  const [c, n] = r.verse_key.split(":");
  return {
    key: r.verse_key,
    arabic: r.text_uthmani,
    arabicPlain: r.text_imlaei_simple,
    translations: { en: pick(TRANSLATIONS.en.id), de: pick(TRANSLATIONS.de.id) },
    url: `https://quran.com/${c}/${n}`,
  };
}

async function fetchChapter(chapter: number): Promise<Verse[]> {
  const verses: Verse[] = [];
  for (let page = 1; page <= MAX_PAGES_PER_CHAPTER; page++) {
    const headers = { "x-auth-token": await getToken(), "x-client-id": process.env.QURAN_FOUNDATION_CLIENT_ID! };
    const url =
      `${env.api}/content/api/v4/verses/by_chapter/${chapter}?per_page=50&page=${page}` +
      `&fields=text_uthmani,text_imlaei_simple&translations=${TRANSLATIONS.en.id},${TRANSLATIONS.de.id}`;
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT_MS), next: { revalidate: CACHE_SECONDS } });
    if (!res.ok) throw new Error(`Quran verses request failed with status ${res.status}`);
    const data = (await res.json()) as { verses?: unknown; pagination?: { next_page?: unknown } };
    if (!Array.isArray(data.verses)) throw new Error("Quran verses response was not understood");
    verses.push(...data.verses.map(parseVerse));
    if (!data.pagination?.next_page) return verses;
  }
  throw new Error(`Quran chapter ${chapter} had more pages than expected`);
}

// At most a few chapters at a time, so a cold start never floods Quran Foundation.
async function fetchAll(): Promise<Verse[]> {
  const out: Verse[][] = new Array(CHAPTERS.length);
  let next = 0;
  async function worker() {
    while (next < CHAPTERS.length) {
      const i = next++;
      out[i] = await fetchChapter(CHAPTERS[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(PARALLEL_CHAPTERS, CHAPTERS.length) }, worker));
  return out.flat();
}

let memory: { verses: Verse[]; byKey: Map<string, Verse>; docs: SearchDoc[]; at: number } | null = null;
let loading: Promise<Verse[]> | null = null;

// One shared load: simultaneous questions wait for the same download instead of starting their own.
export function getVerses(): Promise<Verse[]> {
  if (memory && Date.now() - memory.at < CACHE_SECONDS * 1000) return Promise.resolve(memory.verses);
  loading ??= fetchAll()
    .then((verses) => {
      memory = {
        verses,
        byKey: new Map(verses.map((v) => [v.key, v])),
        // Built once per load, so the search index is not rebuilt for every question.
        docs: verses.map((v) => ({ key: v.key, arabicPlain: v.arabicPlain, en: v.translations.en ?? "", de: v.translations.de ?? "" })),
        at: Date.now(),
      };
      return verses;
    })
    .finally(() => (loading = null));
  return loading;
}

export async function getSearchDocs(): Promise<SearchDoc[]> {
  await getVerses();
  return memory!.docs;
}

export async function getVerse(key: string): Promise<Verse | undefined> {
  await getVerses();
  return memory?.byKey.get(key);
}

// The verses just before and after, given to the AI as context only (never citable).
export async function neighbours(key: string): Promise<Verse[]> {
  const [c, n] = key.split(":").map(Number);
  const around = await Promise.all([getVerse(`${c}:${n - 1}`), getVerse(`${c}:${n + 1}`)]);
  return around.filter((v): v is Verse => !!v);
}
