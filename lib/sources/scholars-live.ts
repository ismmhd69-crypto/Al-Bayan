import "server-only";
import { createHash } from "node:crypto";
import {
  excerpt,
  htmlToText,
  looksLikeQuestion,
  parseBinBazFatwa,
  parseUthaymeenFatwa,
  printedCollection,
  sharesContentWord,
  startsLikeRoomTalk,
} from "./scholar-excerpt";
import type { ScholarQuote } from "./scholar-rules";
import { normalizeArabic } from "@/lib/ask/checks";

// Live search of the scholars' own websites at question time (Mo, 2026-09-29), so Ask can quote from
// their whole collections without copying them. Only the AI's Arabic search phrases are sent, never
// the visitor's words. Nothing is stored in the database; results are kept in memory for a day so a
// repeated question does not ask the site again. The quotes pass the same rules as collected ones
// (the scholar's own words, title match, at most 600 characters) and then the same evidence check.
// SCHOLARS_LIVE=off disables it.

const HEADERS = { "User-Agent": "AlBayan-Collector/0.1 (non-commercial Islamic Q&A; short credited quotes)" };
const TIMEOUT_MS = 6_000;
const PER_SITE = 2;
const CACHE_MS = 24 * 3600_000;
const MIN_QUOTE = 120;

const NAMES = {
  "ibn-baz": { ar: "عبد العزيز بن باز", en: "Shaykh Abdul-Aziz ibn Baz", de: "Scheich Abdul-Aziz ibn Baz" },
  "ibn-uthaymeen": { ar: "محمد بن صالح العثيمين", en: "Shaykh Muhammad ibn Salih al-Uthaymeen", de: "Scheich Muhammad ibn Salih al-Uthaymeen" },
} as const;

// Words that frame a question but rarely appear in a fatwa's own title or text.
const FRAME_WORDS = new Set(["حكم", "أحكام", "أدلة", "دليل", "مشروعية", "جواز", "يجوز", "معنى", "كيفية", "شروط", "الأحاديث", "الإسلام", "في", "من", "عن", "على", "ما", "هل"]);

/**
 * Up to `max` searches, strict to loose: every phrase in full first, then their first 3 meaningful
 * words, then their first 2 (never a single word). Each site stops at the first search that finds something.
 */
export function livePhrases(phrases: string[], max = 4): string[] {
  const words = phrases.map((p) => (p.match(/[ء-ي]+/g) ?? []).filter((w) => !FRAME_WORDS.has(w)));
  const out: string[] = [];
  for (const n of [Infinity, 3, 2]) {
    for (const w of words) {
      if (w.length < 2) continue;
      const q = w.slice(0, n).join(" ");
      if (!out.includes(q)) out.push(q);
    }
  }
  return out.slice(0, max);
}

const stems = (s: string) =>
  new Set(
    (normalizeArabic(s).match(/[ء-ي]+/g) ?? [])
      .map((w) => w.replace(/^(وال|بال|فال|كال|لل|ال|و|ف|ب|ل)(?=.{3,})/, ""))
      .filter((w) => w.length >= 3 && !FRAME_WORDS.has(w)),
  );

/** The titles sharing the most words with the question's phrases (at least 2 shared words). */
export function bestTitles<T>(hits: T[], title: (h: T) => string, phrases: string[], n: number): T[] {
  const wanted = stems(phrases.join(" "));
  return hits
    .map((h, i) => ({ h, i, score: [...stems(title(h))].filter((w) => wanted.has(w)).length }))
    .filter((x) => x.score >= 2)
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .slice(0, n)
    .map((x) => x.h);
}

// A stable id for a live quote (the Ask pipeline expects "S" + a uuid-shaped id).
function liveId(url: string): string {
  const h = createHash("sha1").update(url).digest("hex");
  return `S${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

const cache = new Map<string, { at: number; quotes: ScholarQuote[] }>();

async function get(url: string, init?: RequestInit): Promise<Response | null> {
  try {
    const res = await fetch(url, { ...init, headers: { ...HEADERS, ...(init?.headers ?? {}) }, signal: AbortSignal.timeout(TIMEOUT_MS), cache: "no-store" });
    return res.ok ? res : null;
  } catch {
    return null;
  }
}

function goodQuote(title: string, quote: string | null): quote is string {
  return !!quote && quote.length >= MIN_QUOTE && !looksLikeQuestion(quote) && !startsLikeRoomTalk(quote) && sharesContentWord(title, quote);
}

// ---------- binbaz.org.sa ----------
type BazHit = { reference: number; title: string };

async function binBaz(phrases: string[], wanted: string[]): Promise<ScholarQuote[]> {
  let hits: BazHit[] = [];
  for (const q of phrases) {
    // Default (any-word, ranked) search; bestTitles below keeps only titles close to the question.
    const res = await get(`https://binbaz.org.sa/api/search?type=fatwa&page=1&q=${encodeURIComponent(q)}`, { headers: { Accept: "application/json" } });
    const data = res ? ((await res.json().catch(() => null)) as { Search?: { results?: BazHit[] } } | null) : null;
    hits = (data?.Search?.results ?? []).filter((h) => Number.isInteger(h.reference) && typeof h.title === "string");
    if (bestTitles(hits, (h) => h.title, phrases, 1).length > 0) break;
  }
  const pages = await Promise.all(
    bestTitles(hits, (h) => h.title, wanted, PER_SITE).map(async (hit): Promise<ScholarQuote | null> => {
      const url = `https://binbaz.org.sa/fatwas/${hit.reference}/${encodeURIComponent(hit.title.trim().replace(/\s+/g, "-"))}`;
      const res = await get(url);
      const fatwa = res ? parseBinBazFatwa(await res.text()) : null;
      if (!fatwa || fatwa.title.replace(/\s+/g, " ") !== hit.title.trim().replace(/\s+/g, " ")) return null;
      const quote = excerpt(fatwa.answer);
      if (!goodQuote(fatwa.title, quote)) return null;
      const printed = printedCollection(fatwa.printedSource);
      return {
        id: liveId(url),
        scholarId: "ibn-baz",
        scholarName: { ...NAMES["ibn-baz"] },
        title: fatwa.title,
        reference: printed?.reference ?? `binbaz.org.sa, fatwa ${hit.reference}`,
        arabic: quote,
        url,
      };
    }),
  );
  return pages.filter((q): q is ScholarQuote => !!q);
}

// ---------- binothaimeen.net ----------
type UthHit = { id: string; title: { ar?: string } };
type UthDetail = {
  id: string;
  title?: { ar?: string };
  objective?: { content?: { ar?: string } };
  many_sections?: { title?: { ar?: string }; all_parent?: { title?: { ar?: string }; all_parent?: { title?: { ar?: string } } | null } | null }[];
};

async function uthaymeen(phrases: string[], wanted: string[]): Promise<ScholarQuote[]> {
  let hits: UthHit[] = [];
  for (const q of phrases) {
    const res = await get("https://shekhcp.binothaimeen.net/api/search-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageSize: 10, searchTerm: q, type: "audios", page: 1, mode: "exact" }),
    });
    const data = res ? ((await res.json().catch(() => null)) as { data?: UthHit[] } | null) : null;
    hits = (data?.data ?? []).filter((h) => typeof h.id === "string" && typeof h.title?.ar === "string");
    if (hits.length > 0) break;
  }
  const quotes: ScholarQuote[] = [];
  // Many hits are lessons, not fatwas: look at a few more than we keep.
  const details = await Promise.all(
    bestTitles(hits, (h) => htmlToText(h.title.ar ?? ""), wanted, PER_SITE * 2).map(async (hit) => {
      const res = await get(`https://shekhapi.binothaimeen.net/lessons/audios/show/${encodeURIComponent(hit.id)}/0/1?getManySectionsWithAllParent=audio_library&getAllPaths=1`);
      return res ? (((await res.json().catch(() => null)) as { data?: UthDetail } | null)?.data ?? null) : null;
    }),
  );
  for (const d of details) {
    if (!d || quotes.length >= PER_SITE) continue;
    const section = d.many_sections?.[0];
    const series = section?.all_parent?.title?.ar ?? "";
    const top = section?.all_parent?.all_parent?.title?.ar ?? "";
    const isFatwas = /فتاوى|الباب المفتوح|نور على الدرب|اللقاء الشهري|اللقاءات/.test(`${series} ${top}`);
    const html = d.objective?.content?.ar;
    if (!isFatwas || !html) continue;
    const title = htmlToText(d.title?.ar ?? "").replace(/^-\s*/, "").trim();
    const sectionTitle = section?.title?.ar?.trim() || "فتاوى";
    const fatwa = parseUthaymeenFatwa(html, { title, printedSource: `${series || top} (${sectionTitle})` });
    const quote = fatwa && excerpt(fatwa.answer);
    if (!fatwa || !goodQuote(fatwa.title, quote)) continue;
    const url = `https://binothaimeen.net/ar/voice_library/lessonDetails/${encodeURIComponent(sectionTitle.replace(/\s+/g, "-"))}/${encodeURIComponent(title.replace(/\s+/g, "-"))}/${d.id}`;
    quotes.push({
      id: liveId(url),
      scholarId: "ibn-uthaymeen",
      scholarName: { ...NAMES["ibn-uthaymeen"] },
      title: fatwa.title,
      reference: `${series || top || "فتاوى الشيخ ابن عثيمين"} (${sectionTitle})`,
      arabic: quote,
      url,
    });
  }
  return quotes;
}

/** Live quotes from Ibn Baz's and Ibn Uthaymeen's websites for the question's Arabic phrases. */
export async function searchScholarsLive(arabicPhrases: string[]): Promise<ScholarQuote[]> {
  const phrases = livePhrases(arabicPhrases);
  if (phrases.length === 0) return [];
  const key = phrases.join("|");
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.quotes;
  const [baz, uth] = await Promise.all([binBaz(phrases, arabicPhrases), uthaymeen(phrases, arabicPhrases)]);
  // Alternate the two scholars so both can appear.
  const quotes: ScholarQuote[] = [];
  for (let i = 0; i < PER_SITE; i++) for (const list of [baz, uth]) if (list[i]) quotes.push(list[i]);
  if (cache.size > 500) cache.clear();
  cache.set(key, { at: Date.now(), quotes });
  return quotes;
}
