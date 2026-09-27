import "server-only";

// Quran Foundation Content API (plan section 4).
// Their terms: cache at most one week, keep the Quran text unmodified, credit the translation.
// We cache for one day and never store verses in our own database.

const ENVS = {
  prelive: { auth: "https://prelive-oauth2.quran.foundation", api: "https://apis-prelive.quran.foundation" },
  production: { auth: "https://oauth2.quran.foundation", api: "https://apis.quran.foundation" },
} as const;

const env = ENVS[process.env.QURAN_API_ENV === "production" ? "production" : "prelive"];
const CACHE_SECONDS = 86_400;

// Translations available on the test (prelive) keys. Arabic readers see the Arabic text itself.
export const TRANSLATIONS = {
  en: { id: 85, name: "M.A.S. Abdel Haleem" },
  de: { id: 208, name: "Abu Reda Muhammad ibn Ahmad" },
} as const;

// Pre-production keys only contain Surahs 1 and 2.
export const CHAPTERS = (process.env.QURAN_CHAPTERS ?? "1,2")
  .split(",")
  .map((n) => Number(n.trim()))
  .filter((n) => Number.isInteger(n) && n >= 1 && n <= 114);

export type Verse = {
  key: string; // "2:255"
  arabic: string; // Uthmani script, exactly as served
  arabicPlain: string; // simple script without marks, used only for search
  translations: { en: string; de: string };
  url: string;
};

let token: { value: string; expires: number } | null = null;

async function getToken(): Promise<string> {
  if (token && Date.now() < token.expires) return token.value;
  const id = process.env.QURAN_FOUNDATION_CLIENT_ID;
  const secret = process.env.QURAN_FOUNDATION_CLIENT_SECRET;
  if (!id || !secret) throw new Error("Quran Foundation credentials are not set");
  const res = await fetch(`${env.auth}/oauth2/token`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials&scope=content",
  });
  if (!res.ok) throw new Error(`Quran token request failed with status ${res.status}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  // Renew a minute early; tokens last one hour and cannot be refreshed.
  token = { value: data.access_token, expires: Date.now() + (data.expires_in - 60) * 1000 };
  return token.value;
}

// Translations arrive with footnote markers like <sup foot_note=123>1</sup>.
function clean(html: string): string {
  return html
    .replace(/<sup[^>]*>.*?<\/sup>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

type ApiVerse = {
  verse_key: string;
  text_uthmani: string;
  text_imlaei_simple: string;
  translations?: { resource_id: number; text: string }[];
};

async function fetchChapter(chapter: number): Promise<Verse[]> {
  const headers = { "x-auth-token": await getToken(), "x-client-id": process.env.QURAN_FOUNDATION_CLIENT_ID! };
  const verses: Verse[] = [];
  for (let page = 1; ; page++) {
    const url =
      `${env.api}/content/api/v4/verses/by_chapter/${chapter}?per_page=50&page=${page}` +
      `&fields=text_uthmani,text_imlaei_simple&translations=${TRANSLATIONS.en.id},${TRANSLATIONS.de.id}`;
    const res = await fetch(url, { headers, next: { revalidate: CACHE_SECONDS } });
    if (!res.ok) throw new Error(`Quran verses request failed with status ${res.status}`);
    const data = (await res.json()) as { verses: ApiVerse[]; pagination: { next_page: number | null } };
    for (const v of data.verses) {
      const tr = (id: number) => clean(v.translations?.find((t) => t.resource_id === id)?.text ?? "");
      const [c, n] = v.verse_key.split(":");
      verses.push({
        key: v.verse_key,
        arabic: v.text_uthmani.trim(),
        arabicPlain: v.text_imlaei_simple,
        translations: { en: tr(TRANSLATIONS.en.id), de: tr(TRANSLATIONS.de.id) },
        url: `https://quran.com/${c}/${n}`,
      });
    }
    if (!data.pagination.next_page) break;
  }
  return verses;
}

let memory: { verses: Verse[]; at: number } | null = null;

export async function getVerses(): Promise<Verse[]> {
  if (memory && Date.now() - memory.at < CACHE_SECONDS * 1000) return memory.verses;
  const chapters = await Promise.all(CHAPTERS.map(fetchChapter));
  memory = { verses: chapters.flat(), at: Date.now() };
  return memory.verses;
}
