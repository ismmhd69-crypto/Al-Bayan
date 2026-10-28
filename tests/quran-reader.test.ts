import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { FormattedTranslation } from "@/components/quran/FormattedTranslation";
import { SurahReader } from "@/components/quran/SurahReader";
import { AudioPlaybackController, type AudioInstance } from "@/lib/quran/playback";
import chaptersFixture from "./fixtures/quran-chapters.json";
import sampleVersesFixture from "./fixtures/quran-sample-verses.json";
import { getDictionary } from "@/lib/i18n";
import type { SurahDetail, Verse } from "@/lib/quran/types";

// Mock server-only
vi.mock("server-only", () => ({}));

describe("Quran Reader Service and Audio Logic", () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env.QURAN_FOUNDATION_CLIENT_ID = "test-client-id";
    process.env.QURAN_FOUNDATION_CLIENT_SECRET = "test-client-secret";
    process.env.QURAN_API_ENV = "production";
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env = { ...originalEnv };
  });

  // -------------------------------------------------------------
  // 1. Audio URL Parsing & Validation (No Guessed URLs)
  // -------------------------------------------------------------
  describe("Audio URL parsing and validation", () => {
    it("sets audioUrl to null when provider returns no audio or empty audio url", async () => {
      const { parseVersesPayload } = await import("@/lib/quran/service");

      const payloadNoAudio = {
        verses: [
          {
            id: 1,
            verse_number: 1,
            verse_key: "1:1",
            text_uthmani: "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ",
          },
        ],
      };

      const result = parseVersesPayload(payloadNoAudio, 1);
      expect(result.verses[0].audioUrl).toBeNull();

      const payloadEmptyUrl = {
        verses: [
          {
            id: 2,
            verse_number: 2,
            verse_key: "1:2",
            text_uthmani: "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ",
            audio: { url: "   " },
          },
        ],
      };

      const resultEmpty = parseVersesPayload(payloadEmptyUrl, 1);
      expect(resultEmpty.verses[0].audioUrl).toBeNull();
    });

    it("rejects untrusted or malicious audio URLs and returns null", async () => {
      const { parseVersesPayload } = await import("@/lib/quran/service");

      const untrustedPayload = {
        verses: [
          {
            id: 1,
            verse_number: 1,
            verse_key: "1:1",
            audio: { url: "http://verses.quran.foundation/insecure.mp3" }, // Insecure HTTP
          },
          {
            id: 2,
            verse_number: 2,
            verse_key: "1:2",
            audio: { url: "https://evil-site.com/audio.mp3" }, // Foreign domain
          },
          {
            id: 3,
            verse_number: 3,
            verse_key: "1:3",
            audio: { url: "javascript:alert(1)" }, // Malformed / non-http protocol
          },
        ],
      };

      const res = parseVersesPayload(untrustedPayload, 1);
      expect(res.verses[0].audioUrl).toBeNull();
      expect(res.verses[1].audioUrl).toBeNull();
      expect(res.verses[2].audioUrl).toBeNull();
    });

    it("accepts valid Quran Foundation relative and absolute HTTPS audio URLs", async () => {
      const { parseVersesPayload } = await import("@/lib/quran/service");

      const validPayload = {
        verses: [
          {
            id: 1,
            verse_number: 1,
            verse_key: "1:1",
            audio: { url: "Alafasy/mp3/001001.mp3" }, // Relative path
          },
          {
            id: 2,
            verse_number: 2,
            verse_key: "1:2",
            audio: { url: "https://verses.quran.foundation/Alafasy/mp3/001002.mp3" }, // Absolute URL
          },
        ],
      };

      const res = parseVersesPayload(validPayload, 1);
      expect(res.verses[0].audioUrl).toBe("https://verses.quran.foundation/Alafasy/mp3/001001.mp3");
      expect(res.verses[1].audioUrl).toBe("https://verses.quran.foundation/Alafasy/mp3/001002.mp3");
    });
  });

  // -------------------------------------------------------------
  // 2. Playback Generation & Stale Promise Handling
  // -------------------------------------------------------------
  describe("Playback session generation and stale callback protection", () => {
    // Helper to create a controllable mock audio instance
    function createMockAudio(): {
      audio: AudioInstance;
      resolvePlay: () => void;
      rejectPlay: (err: Error) => void;
    } {
      let resolvePlay!: () => void;
      let rejectPlay!: (err: Error) => void;
      const playPromise = new Promise<void>((res, rej) => {
        resolvePlay = res;
        rejectPlay = rej;
      });

      const audio: AudioInstance = {
        src: "",
        play: vi.fn(() => playPromise),
        pause: vi.fn(),
        onplaying: null,
        onwaiting: null,
        onended: null,
        onerror: null,
      };

      return { audio, resolvePlay, rejectPlay };
    }

    it("ignores earlier play promise rejection when switching from verse A to verse B", async () => {
      const mockA = createMockAudio();
      const mockB = createMockAudio();

      let callCount = 0;
      const factory = vi.fn((_url: string) => {
        callCount++;
        return callCount === 1 ? mockA.audio : mockB.audio;
      });

      const controller = new AudioPlaybackController(factory);
      const statusHistory: Array<unknown> = [];
      const callbacks = {
        onStatusChange: (status: unknown) => statusHistory.push(status),
      };

      // 1. Visitor clicks verse 1
      controller.toggleVerse({ verseNumber: 1, audioUrl: "https://verses.quran.foundation/1.mp3" }, callbacks);
      expect(controller.getActivePlayback()).toEqual({ verseNumber: 1, status: "loading" });

      // 2. Visitor rapidly clicks verse 2 before verse 1's play promise settles
      controller.toggleVerse({ verseNumber: 2, audioUrl: "https://verses.quran.foundation/2.mp3" }, callbacks);
      expect(controller.getActivePlayback()).toEqual({ verseNumber: 2, status: "loading" });

      // Verse 1's audio must have been stopped, source cleared, and handlers detached
      expect(mockA.audio.pause).toHaveBeenCalled();
      expect(mockA.audio.src).toBe("");
      expect(mockA.audio.onplaying).toBeNull();
      expect(mockA.audio.onerror).toBeNull();

      // 3. Verse 1's play promise now rejects (e.g. AbortError)
      mockA.rejectPlay(new Error("The play() request was interrupted"));
      await Promise.resolve(); // flush microtasks

      // Crucial: Active playback must STILL be verse 2 loading, NOT verse 1 error!
      expect(controller.getActivePlayback()).toEqual({ verseNumber: 2, status: "loading" });

      // 4. Verse 2 play succeeds
      mockB.resolvePlay();
      await Promise.resolve();

      expect(controller.getActivePlayback()).toEqual({ verseNumber: 2, status: "playing" });
    });

    it("ignores stale resume promise rejection after switching to another verse", async () => {
      let resolvePlayA!: () => void;
      let rejectPlayA!: (err: Error) => void;

      const audioA: AudioInstance = {
        src: "https://verses.quran.foundation/1.mp3",
        play: vi.fn(
          () =>
            new Promise<void>((res, rej) => {
              resolvePlayA = res;
              rejectPlayA = rej;
            })
        ),
        pause: vi.fn(),
        onplaying: null,
        onwaiting: null,
        onended: null,
        onerror: null,
      };

      const audioB: AudioInstance = {
        src: "https://verses.quran.foundation/2.mp3",
        play: vi.fn(() => Promise.resolve()),
        pause: vi.fn(),
        onplaying: null,
        onwaiting: null,
        onended: null,
        onerror: null,
      };

      const factory = (url: string) => (url.includes("1.mp3") ? audioA : audioB);
      const controller = new AudioPlaybackController(factory);
      const callbacks = { onStatusChange: vi.fn() };

      // Play verse 1 and resolve
      controller.toggleVerse({ verseNumber: 1, audioUrl: "https://verses.quran.foundation/1.mp3" }, callbacks);
      resolvePlayA();
      await Promise.resolve();
      expect(controller.getActivePlayback()).toEqual({ verseNumber: 1, status: "playing" });

      // Pause verse 1
      controller.toggleVerse({ verseNumber: 1, audioUrl: "https://verses.quran.foundation/1.mp3" }, callbacks);
      expect(controller.getActivePlayback()).toEqual({ verseNumber: 1, status: "paused" });

      // Attempt to resume verse 1 (returns pending promise)
      controller.toggleVerse({ verseNumber: 1, audioUrl: "https://verses.quran.foundation/1.mp3" }, callbacks);
      expect(controller.getActivePlayback()).toEqual({ verseNumber: 1, status: "loading" });

      // While resume is pending, user switches to verse 2
      controller.toggleVerse({ verseNumber: 2, audioUrl: "https://verses.quran.foundation/2.mp3" }, callbacks);
      await Promise.resolve();
      expect(controller.getActivePlayback()).toEqual({ verseNumber: 2, status: "playing" });

      // Stale resume promise of verse 1 rejects
      rejectPlayA(new Error("Interrupted"));
      await Promise.resolve();

      // State must remain verse 2 playing
      expect(controller.getActivePlayback()).toEqual({ verseNumber: 2, status: "playing" });
    });

    it("stops audio and clears playback when verse ends without automatic continuation", () => {
      let capturedOnEnded: (() => void) | null = null;
      const audio: AudioInstance = {
        src: "https://verses.quran.foundation/1.mp3",
        play: vi.fn(() => Promise.resolve()),
        pause: vi.fn(),
        onplaying: null,
        onwaiting: null,
        get onended() {
          return capturedOnEnded;
        },
        set onended(cb) {
          capturedOnEnded = cb;
        },
        onerror: null,
      };

      const controller = new AudioPlaybackController(() => audio);
      let active: unknown = null;
      controller.toggleVerse(
        { verseNumber: 1, audioUrl: "https://verses.quran.foundation/1.mp3" },
        { onStatusChange: (p) => (active = p) }
      );

      expect(active).toEqual({ verseNumber: 1, status: "loading" });

      // Trigger verse ended event
      if (capturedOnEnded) {
        (capturedOnEnded as () => void)();
      }

      expect(active).toBeNull();
      expect(controller.getActivePlayback()).toBeNull();
    });

    it("releases audio and ignores callbacks on navigation cleanup / unmount", async () => {
      const mock = createMockAudio();
      const controller = new AudioPlaybackController(() => mock.audio);
      let status: unknown = null;
      const callbacks = { onStatusChange: (p: unknown) => (status = p) };

      controller.toggleVerse(
        { verseNumber: 1, audioUrl: "https://verses.quran.foundation/1.mp3" },
        callbacks
      );
      expect(status).toEqual({ verseNumber: 1, status: "loading" });

      // Unmount / navigate away
      controller.stopAndRelease();

      expect(mock.audio.pause).toHaveBeenCalled();
      expect(mock.audio.src).toBe("");
      expect(mock.audio.onplaying).toBeNull();

      // Resolve or reject later
      mock.resolvePlay();
      await Promise.resolve();

      // Callback was not called after release
      expect(status).toEqual({ verseNumber: 1, status: "loading" });
    });

    it("strictly does not attempt playback if verse has no audioUrl", () => {
      const factory = vi.fn();
      const controller = new AudioPlaybackController(factory);
      const callbacks = { onStatusChange: vi.fn() };

      controller.toggleVerse({ verseNumber: 1, audioUrl: null }, callbacks);

      expect(factory).not.toHaveBeenCalled();
      expect(callbacks.onStatusChange).not.toHaveBeenCalled();
      expect(controller.getActivePlayback()).toBeNull();
    });
  });

  // -------------------------------------------------------------
  // 3. API Error Propagation (No Fixture Fallback in Runtime)
  // -------------------------------------------------------------
  describe("API error handling and test isolation", () => {
    it("throws real API errors when live verses fetch fails, without falling back to sample fixtures", async () => {
      // Mock fetch returning HTTP 500 error for verses
      globalThis.fetch = vi.fn(async (url: RequestInfo | URL) => {
        const urlStr = String(url);
        if (urlStr.includes("/oauth2/token")) {
          return new Response(JSON.stringify({ access_token: "mock-token", expires_in: 3600 }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (urlStr.includes("/verses/by_chapter/1")) {
          return new Response("Internal Server Error", { status: 500 });
        }
        return new Response("Not found", { status: 404 });
      });

      const { getChapterVerses } = await import("@/lib/quran/service");

      // Surah 1 previously fell back to sample-verses-fixture.json
      // It must now throw an error so the UI can display its error / retry state
      await expect(getChapterVerses(1)).rejects.toThrow("Verses request failed with status 500");
    });

    it("throws real API errors when live chapters fetch fails, without falling back to static metadata", async () => {
      globalThis.fetch = vi.fn(async (url: RequestInfo | URL) => {
        const urlStr = String(url);
        if (urlStr.includes("/oauth2/token")) {
          return new Response(JSON.stringify({ access_token: "mock-token", expires_in: 3600 }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response("Gateway Timeout", { status: 504 });
      });

      const { getChapters } = await import("@/lib/quran/service");

      await expect(getChapters("en")).rejects.toThrow("Failed to fetch chapters: 504");
    });
  });

  // -------------------------------------------------------------
  // 4. Deterministic Offline Suite with Explicit Mocks
  // -------------------------------------------------------------
  describe("Deterministic offline service behavior with explicit mocks", () => {
    beforeEach(() => {
      // Setup deterministic offline mock fetch using fixture files
      globalThis.fetch = vi.fn(async (url: RequestInfo | URL) => {
        const urlStr = String(url);
        if (urlStr.includes("/oauth2/token")) {
          return new Response(
            JSON.stringify({ access_token: "deterministic-token", expires_in: 3600 }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        if (urlStr.includes("/chapters")) {
          return new Response(JSON.stringify({ chapters: chaptersFixture }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (urlStr.includes("/verses/by_chapter/1")) {
          const sample = (sampleVersesFixture as Record<string, unknown>)["1"];
          return new Response(JSON.stringify(sample), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response("Not found", { status: 404 });
      });
    });

    it("loads all 114 surahs with required metadata", async () => {
      const { getChapters } = await import("@/lib/quran/service");
      const chapters = await getChapters("en");
      expect(chapters).toHaveLength(114);

      const fatihah = chapters[0];
      expect(fatihah.id).toBe(1);
      expect(fatihah.nameArabic).toBe("الفاتحة");
      expect(fatihah.nameSimple).toBe("Al-Fatihah");
      expect(fatihah.versesCount).toBe(7);
      expect(fatihah.revelationPlace).toBe("makkah");
      expect(fatihah.bismillahPre).toBe(false);

      const baqarah = chapters[1];
      expect(baqarah.id).toBe(2);
      expect(baqarah.versesCount).toBe(286);
      expect(baqarah.bismillahPre).toBe(true);

      const nas = chapters[113];
      expect(nas.id).toBe(114);
      expect(nas.nameSimple).toBe("An-Nas");
      expect(nas.versesCount).toBe(6);
    });

    it("handles Bismillah rules accurately: no bismillah_pre on Surah 1 and 9", async () => {
      const { getChapter } = await import("@/lib/quran/service");
      const ch1 = await getChapter(1);
      const ch2 = await getChapter(2);
      const ch9 = await getChapter(9);
      const ch114 = await getChapter(114);

      expect(ch1?.bismillahPre).toBe(false);
      expect(ch2?.bismillahPre).toBe(true);
      expect(ch9?.bismillahPre).toBe(false);
      expect(ch114?.bismillahPre).toBe(true);
    });

    it("rejects invalid surah numbers gracefully", async () => {
      const { getChapter, getChapterVerses } = await import("@/lib/quran/service");
      expect(await getChapter(0)).toBeNull();
      expect(await getChapter(115)).toBeNull();
      expect(await getChapter(-1)).toBeNull();

      await expect(getChapterVerses(0)).rejects.toThrow("Invalid surah number");
      await expect(getChapterVerses(115)).rejects.toThrow("Invalid surah number");
    });

    it("preserves verse order, numbers, and keys across pagination", async () => {
      const { getChapterVerses } = await import("@/lib/quran/service");
      const res = await getChapterVerses(1, { page: 1, perPage: 7 });

      expect(res.verses).toHaveLength(7);
      for (let i = 0; i < res.verses.length; i++) {
        expect(res.verses[i].verseNumber).toBe(i + 1);
        expect(res.verses[i].verseKey).toBe(`1:${i + 1}`);
        expect(res.verses[i].textUthmani.length).toBeGreaterThan(0);
        expect(res.verses[i].url).toBe(`https://quran.com/1/${i + 1}`);
      }
    });

    it("correctly identifies target page for direct verse links (#ayah-255)", () => {
      const perPage30 = 30;
      expect(Math.ceil(255 / perPage30)).toBe(9);
      expect(Math.ceil(1 / perPage30)).toBe(1);
      expect(Math.ceil(30 / perPage30)).toBe(1);
      expect(Math.ceil(31 / perPage30)).toBe(2);

      const perPage50 = 50;
      expect(Math.ceil(255 / perPage50)).toBe(6);
    });

    it("handles the internal API route for verses by chapter correctly", async () => {
      const { GET } = await import("@/app/api/quran/[surah]/verses/route");

      // 1. Invalid surah request
      const badReq = new Request("http://localhost:3000/api/quran/999/verses");
      const badRes = await GET(badReq, { params: Promise.resolve({ surah: "999" }) });
      expect(badRes.status).toBe(400);

      // 2. Valid request for Surah 1
      const validReq = new Request("http://localhost:3000/api/quran/1/verses?page=1&per_page=7");
      const validRes = await GET(validReq, { params: Promise.resolve({ surah: "1" }) });
      expect(validRes.status).toBe(200);
      const body = await validRes.json();
      expect(body.verses).toHaveLength(7);
      expect(body.verses[0].verseKey).toBe("1:1");
      expect(body.pagination.totalRecords).toBe(7);
    });
  });

  // -------------------------------------------------------------
  // 5. SurahReader UI & Rendering Tests
  // -------------------------------------------------------------
  describe("SurahReader component rendering", () => {
    it("safely renders translation text with footnote formatting without dropping content", () => {
      const plainText = "In the name of God, the Lord of Mercy, the Giver of Mercy.";
      const plainHtml = renderToString(
        React.createElement(FormattedTranslation, { text: plainText })
      );
      expect(plainHtml).toContain("In the name of God");

      const footnoteText =
        "He is the One who created death and life to test which of you is best in conduct<sup>1</sup>, and He is the Almighty.";
      const footnoteHtml = renderToString(
        React.createElement(FormattedTranslation, { text: footnoteText })
      );
      expect(footnoteHtml).toContain("best in conduct");
      expect(footnoteHtml).toContain('<sup class="quran-footnote">1</sup>');
      expect(footnoteHtml).toContain("and He is the Almighty");

      // XSS safety: script tag should not be rendered as HTML element
      const maliciousText = "Normal text <script>alert(1)</script> continues";
      const xssHtml = renderToString(
        React.createElement(FormattedTranslation, { text: maliciousText })
      );
      expect(xssHtml).not.toContain("<script>");
    });

    it("renders disabled play button with localized unavailable title when audioUrl is null", () => {
      const dict = getDictionary("en").quran;
      const mockSurah: SurahDetail = {
        id: 1,
        nameSimple: "Al-Fatihah",
        nameComplex: "Al-Fātihah",
        nameArabic: "الفاتحة",
        versesCount: 1,
        revelationPlace: "makkah",
        revelationOrder: 5,
        bismillahPre: false,
        translatedName: "The Opening",
        pages: [1, 1],
      };

      const mockVerseWithoutAudio: Verse = {
        id: 1,
        verseNumber: 1,
        verseKey: "1:1",
        textUthmani: "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ",
        translation: "In the name of God, the Lord of Mercy, the Giver of Mercy.",
        audioUrl: null, // Audio missing
        url: "https://quran.com/1/1",
      };

      const html = renderToString(
        React.createElement(SurahReader, {
          lang: "en",
          dict,
          surah: mockSurah,
          initialVerses: {
            verses: [mockVerseWithoutAudio],
            pagination: {
              perPage: 30,
              currentPage: 1,
              nextPage: null,
              totalPages: 1,
              totalRecords: 1,
            },
          },
          prevSurah: null,
          nextSurah: null,
        })
      );

      // Verify disabled state and localized tooltip/aria-label
      expect(html).toContain("quran-play-btn--disabled");
      expect(html).toContain("disabled");
      expect(html).toContain(dict.audioUnavailable);
    });
  });
});
