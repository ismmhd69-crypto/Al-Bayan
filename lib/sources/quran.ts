import "server-only";
import { isRealVerse, TRANSLATIONS, type Verse } from "./quran-meta";
import { quranSearchPath } from "./quran-search";
export { ATTRIBUTION, TRANSLATIONS, type Verse } from "./quran-meta";

// Quran Foundation Content and Search APIs (plan section 4).
// Their terms: cache at most one week, keep the Quran text unmodified, credit the translation
// and Quran Foundation. We cache for one day and never store verses in our own database.
// Text is kept exactly as served: no trimming, no editing. A translation that arrives with
// markup (footnotes etc.) is not shown at all rather than being edited.
//
// Search uses Quran Foundation's own search (the one Quran.com uses), then only the verses
// found are fetched one by one. Nothing downloads the whole Quran during a question.

const ENVS = {
  prelive: { auth: "https://prelive-oauth2.quran.foundation", api: "https://apis-prelive.quran.foundation" },
  production: { auth: "https://oauth2.quran.foundation", api: "https://apis.quran.foundation" },
} as const;

const env = ENVS[process.env.QURAN_API_ENV === "production" ? "production" : "prelive"];
const CACHE_SECONDS = 86_400;
const TIMEOUT_MS = 10_000;
const RESULTS_PER_QUERY = 20;
const MAX_CONTENT_CONCURRENCY = 6;

// Pre-production keys can search the whole Quran but only fetch the text of Surahs 1 and 2,
// so results are limited to the surahs whose text we can show.
export const CHAPTERS = new Set(
  (process.env.QURAN_CHAPTERS ?? (process.env.QURAN_API_ENV === "production" ? "" : "1,2"))
    .split(",")
    .map((n) => Number(n.trim()))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 114),
);

const allowed = (key: string) => {
  const [c, v] = key.split(":").map(Number);
  return isRealVerse(c, v) && (CHAPTERS.size === 0 || CHAPTERS.has(c));
};

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
    body: "grant_type=client_credentials&scope=content%20search",
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

async function headers() {
  return { "x-auth-token": await getToken(), "x-client-id": process.env.QURAN_FOUNDATION_CLIENT_ID! };
}

// A token can stop working before its hour is up (for example after new keys are set): on a 401,
// forget it, get a fresh one and try once more.
async function authedFetch(url: string, init: RequestInit): Promise<Response> {
  const res = await fetch(url, { ...init, headers: await headers() });
  if (res.status !== 401) return res;
  token = null;
  return fetch(url, { ...init, headers: await headers() });
}

// ---------- search ----------

// Runs each bounded query through Quran Foundation's detailed search and returns candidate
// verse keys. These are not evidence yet: the ask pipeline independently checks directness,
// context and full-question coverage before the writer can see any passage.
export async function searchQuran(queries: string[], limit: number): Promise<string[]> {
  const lists = await Promise.all(
    queries.slice(0, 6).map(async (q) => {
      const url = `${env.api}${quranSearchPath(q, [TRANSLATIONS.en.id, TRANSLATIONS.de.id], RESULTS_PER_QUERY)}`;
      // Not cached: the search phrases are derived from a visitor's question and must not be kept
      // on disk. Verse text (below) is cached, because it reveals nothing about who asked what.
      const res = await authedFetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), cache: "no-store" });
      if (!res.ok) throw new Error(`Quran search failed with status ${res.status}`);
      const data = (await res.json()) as { result?: { verses?: { key?: unknown; result_type?: unknown }[] } };
      const verses = data.result?.verses;
      if (!Array.isArray(verses)) throw new Error("Quran search response was not understood");
      return verses
        .filter((v) => (v.result_type === undefined || v.result_type === "ayah") && typeof v.key === "string" && /^\d{1,3}:\d{1,3}$/.test(v.key))
        .map((v) => v.key as string);
    }),
  );
  // Interleave the lists so each query's best results come first.
  const out: string[] = [];
  for (let i = 0; i < RESULTS_PER_QUERY; i++) {
    for (const list of lists) {
      const k = list[i];
      if (k && allowed(k) && !out.includes(k)) out.push(k);
    }
  }
  return out.slice(0, limit);
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

// Shared in-flight requests, so simultaneous questions never fetch the same verse twice at once.
const inFlight = new Map<string, Promise<Verse | undefined>>();
let activeContentRequests = 0;
const contentWaiters: (() => void)[] = [];

// A finished request hands its slot straight to the next waiter, so the limit is never exceeded.
async function withContentSlot<T>(call: () => Promise<T>): Promise<T> {
  if (activeContentRequests >= MAX_CONTENT_CONCURRENCY) {
    await new Promise<void>((resolve) => contentWaiters.push(resolve));
  } else {
    activeContentRequests++;
  }
  try {
    return await call();
  } finally {
    const next = contentWaiters.shift();
    if (next) next();
    else activeContentRequests--;
  }
}

export function getVerse(key: string): Promise<Verse | undefined> {
  if (!allowed(key)) return Promise.resolve(undefined);
  let p = inFlight.get(key);
  if (!p) {
    p = withContentSlot(async () => {
      const url =
        `${env.api}/content/api/v4/verses/by_key/${key}` +
        `?fields=text_uthmani,text_imlaei_simple&translations=${TRANSLATIONS.en.id},${TRANSLATIONS.de.id}`;
      const res = await authedFetch(url, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
        next: { revalidate: CACHE_SECONDS },
      });
      if (res.status === 404) return undefined;
      if (!res.ok) throw new Error(`Quran verse request failed with status ${res.status}`);
      const data = (await res.json()) as { verse?: unknown };
      return parseVerse(data.verse);
    }).finally(() => inFlight.delete(key));
    inFlight.set(key, p);
  }
  return p;
}

// The verses just before and after, given to the AI as context only (never citable).
export async function neighbours(key: string): Promise<Verse[]> {
  const [c, n] = key.split(":").map(Number);
  const around = await Promise.all([getVerse(`${c}:${n - 1}`), getVerse(`${c}:${n + 1}`)]);
  return around.filter((v): v is Verse => !!v);
}
