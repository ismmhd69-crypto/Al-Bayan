import "server-only";
import { cache } from "react";
import { TRANSLATIONS } from "@/lib/sources/quran-meta";
import type { PaginatedVerses, RevelationPlace, SurahDetail, SurahSummary, Verse, VersePagination } from "./types";

const ENVS = {
  prelive: { auth: "https://prelive-oauth2.quran.foundation", api: "https://apis-prelive.quran.foundation" },
  production: { auth: "https://oauth2.quran.foundation", api: "https://apis.quran.foundation" },
} as const;

function getEnvConfig() {
  const isProd = process.env.QURAN_API_ENV === "production";
  return ENVS[isProd ? "production" : "prelive"];
}

const CACHE_SECONDS = 86_400; // 1 day cache per Quran Foundation policy (max 1 week)
const TIMEOUT_MS = 10_000;

export const ALLOWED_CHAPTERS: Set<number> = new Set(
  (process.env.QURAN_CHAPTERS ?? (process.env.QURAN_API_ENV === "production" ? "" : "1,2"))
    .split(",")
    .map((n) => Number(n.trim()))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 114),
);

export function isChapterAllowed(chapter: number): boolean {
  return ALLOWED_CHAPTERS.size === 0 || ALLOWED_CHAPTERS.has(chapter);
}

// ---------------- Token Management ----------------
let tokenCache: { value: string; expires: number } | null = null;
let tokenPromise: Promise<string> | null = null;

async function requestToken(): Promise<string> {
  const id = process.env.QURAN_FOUNDATION_CLIENT_ID;
  const secret = process.env.QURAN_FOUNDATION_CLIENT_SECRET;
  if (!id || !secret) {
    throw new Error("Quran Foundation credentials are not configured in environment");
  }

  const env = getEnvConfig();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${env.auth}/oauth2/token`, {
      method: "POST",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials&scope=content%20search",
    });

    if (!res.ok) {
      throw new Error(`Quran token request failed with status ${res.status}`);
    }

    const data = (await res.json()) as { access_token?: unknown; expires_in?: unknown };
    if (typeof data.access_token !== "string" || typeof data.expires_in !== "number") {
      throw new Error("Quran token response was malformed");
    }

    tokenCache = {
      value: data.access_token,
      expires: Date.now() + (data.expires_in - 60) * 1000,
    };
    return tokenCache.value;
  } finally {
    clearTimeout(timer);
  }
}

async function getToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expires) {
    return tokenCache.value;
  }
  tokenPromise ??= requestToken().finally(() => {
    tokenPromise = null;
  });
  return tokenPromise;
}

async function authedFetch(url: string, init?: RequestInit): Promise<Response> {
  const token = await getToken();
  const clientId = process.env.QURAN_FOUNDATION_CLIENT_ID!;
  const authHeaders = {
    "x-auth-token": token,
    "x-client-id": clientId,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      ...init,
      signal: init?.signal ?? controller.signal,
      headers: {
        ...init?.headers,
        ...authHeaders,
      },
    });

    if (res.status === 401) {
      // Token might have expired early or rotated. Invalidate and retry once.
      tokenCache = null;
      const newToken = await getToken();
      return fetch(url, {
        ...init,
        signal: init?.signal ?? controller.signal,
        headers: {
          ...init?.headers,
          "x-auth-token": newToken,
          "x-client-id": clientId,
        },
      });
    }

    return res;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------- Chapter Mapping ----------------

interface ApiChapter {
  id: number;
  revelation_place: string;
  revelation_order: number;
  bismillah_pre: boolean;
  name_simple: string;
  name_complex: string;
  name_arabic: string;
  verses_count: number;
  pages: [number, number];
  translated_name?: {
    language_name: string;
    name: string;
  };
}

export function mapChapter(c: ApiChapter): SurahDetail {
  const place = c.revelation_place?.toLowerCase();
  const revelationPlace: RevelationPlace | null =
    place === "makkah" ? "makkah" : place === "madinah" ? "madinah" : null;

  return {
    id: c.id,
    nameSimple: c.name_simple ?? `Surah ${c.id}`,
    nameComplex: c.name_complex ?? c.name_simple ?? `Surah ${c.id}`,
    nameArabic: c.name_arabic ?? "",
    versesCount: c.verses_count ?? 0,
    revelationPlace,
    revelationOrder: c.revelation_order ?? null,
    bismillahPre: Boolean(c.bismillah_pre),
    translatedName: c.translated_name?.name ?? c.name_simple,
    pages: c.pages ?? [1, 1],
  };
}

// ---------------- Public API ----------------

export const getChapters = cache(async function getChapters(language: "en" | "ar" = "en"): Promise<SurahSummary[]> {
  const env = getEnvConfig();
  const langParam = language === "ar" ? "ar" : "en";
  const url = `${env.api}/content/api/v4/chapters?language=${langParam}`;

  const res = await authedFetch(url, {
    next: { revalidate: CACHE_SECONDS },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch chapters: ${res.status}`);
  }

  const data = (await res.json()) as { chapters?: ApiChapter[] };
  if (!Array.isArray(data.chapters) || data.chapters.length === 0) {
    throw new Error("No chapters returned from API");
  }

  return data.chapters.map(mapChapter);
});

export const getChapter = cache(async function getChapter(id: number, language: "en" | "ar" = "en"): Promise<SurahDetail | null> {
  if (id < 1 || id > 114) return null;

  const chapters = await getChapters(language);
  const found = chapters.find((c) => c.id === id);
  if (!found) return null;

  return {
    ...found,
    pages: (found as SurahDetail).pages ?? [1, 1],
  };
});

// ---------------- Verses Mapping ----------------

interface ApiVerse {
  id: number;
  verse_number: number;
  verse_key: string;
  text_uthmani?: string;
  text_imlaei_simple?: string;
  audio?: {
    url?: string;
  };
  translations?: Array<{
    id?: number;
    resource_id?: number;
    text?: string;
  }>;
}

interface ApiVerseResponse {
  verses?: ApiVerse[];
  pagination?: {
    per_page: number;
    current_page: number;
    next_page: number | null;
    total_pages: number;
    total_records: number;
  };
}

export function parseVersesPayload(data: ApiVerseResponse, chapterId: number): PaginatedVerses {
  const rawVerses = data.verses ?? [];
  const enTranslationId = TRANSLATIONS.en.id;

  const verses: Verse[] = rawVerses.map((v) => {
    const trItem = v.translations?.find((t) => t.resource_id === enTranslationId || t.id === enTranslationId);
    // Translation text is preserved safely; formatting tags are preserved, not stripped or discarded
    const translation = typeof trItem?.text === "string" && trItem.text.trim().length > 0 ? trItem.text : null;

    const [c, n] = (v.verse_key ?? `${chapterId}:${v.verse_number}`).split(":");
    const verseNum = v.verse_number ?? Number(n);

    // Validate audio URL strictly from provider - no guessed fallbacks
    let audioUrl: string | null = null;
    if (typeof v.audio?.url === "string" && v.audio.url.trim().length > 0) {
      const trimmed = v.audio.url.trim();
      const isAbsolute = /^https?:\/\//i.test(trimmed);
      const isSuspiciousRelative = /^[a-zA-Z0-9_-]+:/i.test(trimmed);

      if (isAbsolute || !isSuspiciousRelative) {
        const rawUrl = isAbsolute
          ? trimmed
          : `https://verses.quran.foundation/${trimmed.replace(/^\/+/, "")}`;
        try {
          const parsed = new URL(rawUrl);
          if (
            parsed.protocol === "https:" &&
            (parsed.hostname === "verses.quran.foundation" || parsed.hostname.endsWith(".quran.foundation")) &&
            /\.(mp3|wav|ogg|m4a|aac)$/i.test(parsed.pathname)
          ) {
            audioUrl = parsed.toString();
          }
        } catch {
          audioUrl = null;
        }
      }
    }

    return {
      id: v.id ?? Number(n),
      verseNumber: verseNum,
      verseKey: v.verse_key ?? `${chapterId}:${verseNum}`,
      textUthmani: v.text_uthmani ?? "",
      textImlaeiSimple: v.text_imlaei_simple,
      translation,
      audioUrl,
      url: `https://quran.com/${c}/${n}`,
    };
  });

  const pagination: VersePagination = {
    perPage: data.pagination?.per_page ?? verses.length,
    currentPage: data.pagination?.current_page ?? 1,
    nextPage: data.pagination?.next_page ?? null,
    totalPages: data.pagination?.total_pages ?? 1,
    totalRecords: data.pagination?.total_records ?? verses.length,
  };

  return { verses, pagination };
}

export const getChapterVerses = cache(async function getChapterVerses(
  chapterId: number,
  options?: { page?: number; perPage?: number },
): Promise<PaginatedVerses> {
  if (chapterId < 1 || chapterId > 114) {
    throw new Error(`Invalid surah number: ${chapterId}`);
  }

  if (!isChapterAllowed(chapterId)) {
    throw new Error(`Surah ${chapterId} is outside currently allowed chapters scope (${Array.from(ALLOWED_CHAPTERS).join(",")})`);
  }

  const page = Math.max(1, options?.page ?? 1);
  const perPage = Math.min(50, Math.max(1, options?.perPage ?? 30));
  const env = getEnvConfig();
  const enTranslationId = TRANSLATIONS.en.id;

  const url =
    `${env.api}/content/api/v4/verses/by_chapter/${chapterId}` +
    `?page=${page}&per_page=${perPage}&fields=text_uthmani,text_imlaei_simple&translations=${enTranslationId}&audio=7`;

  const res = await authedFetch(url, {
    next: { revalidate: CACHE_SECONDS },
  });

  if (!res.ok) {
    throw new Error(`Verses request failed with status ${res.status}`);
  }

  const data = (await res.json()) as ApiVerseResponse;
  return parseVersesPayload(data, chapterId);
});

