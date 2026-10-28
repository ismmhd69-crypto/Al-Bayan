import { describe, expect, it, vi } from "vitest";
import fs from "node:fs";

vi.mock("server-only", () => ({}));

// Live integration tests are strictly opt-in to keep standard test runs offline and deterministic.
const isLiveOptIn = process.env.RUN_LIVE_QURAN_TESTS === "true";

if (isLiveOptIn) {
  // Load .env and .env.local into process.env for this live integration test
  for (const envFile of [".env", ".env.local"]) {
    if (fs.existsSync(envFile)) {
      const lines = fs.readFileSync(envFile, "utf8").split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
          process.env[key] = val;
        }
      }
    }
  }
}

const hasCredentials = Boolean(
  process.env.QURAN_FOUNDATION_CLIENT_ID && process.env.QURAN_FOUNDATION_CLIENT_SECRET
);

describe.runIf(isLiveOptIn)("Quran Foundation Live API Integration (opt-in)", () => {
  it("verifies production environment and credentials are loaded", () => {
    expect(process.env.QURAN_API_ENV).toBe("production");
    expect(hasCredentials).toBe(true);
  });

  it.runIf(hasCredentials)("fetches all 114 chapters live without fixture fallback", async () => {
    const { getChapters } = await import("@/lib/quran/service");
    const chapters = await getChapters("en");
    expect(chapters).toHaveLength(114);
    expect(chapters[0].nameSimple).toBe("Al-Fatihah");
    expect(chapters[113].nameSimple).toBe("An-Nas");
  });

  it.runIf(hasCredentials)("fetches verses for surahs 1, 2, and 114 live", async () => {
    const { getChapterVerses } = await import("@/lib/quran/service");

    // Surah 1: Al-Fatihah (7 verses)
    const s1 = await getChapterVerses(1, { page: 1, perPage: 7 });
    expect(s1.verses).toHaveLength(7);
    expect(s1.verses[0].verseKey).toBe("1:1");
    expect(s1.verses[0].textUthmani).toContain("بِسْمِ");
    expect(s1.verses[0].translation).toBeTruthy();
    expect(s1.verses[0].audioUrl).toBe("https://verses.quran.foundation/Alafasy/mp3/001001.mp3");

    // Surah 2: Al-Baqarah (sample page of 5 verses)
    const s2 = await getChapterVerses(2, { page: 1, perPage: 5 });
    expect(s2.verses).toHaveLength(5);
    expect(s2.verses[0].verseKey).toBe("2:1");
    expect(s2.verses[0].translation).toBe("Alif Lam Mim");
    expect(s2.verses[0].audioUrl).toBe("https://verses.quran.foundation/Alafasy/mp3/002001.mp3");
    expect(s2.pagination.totalRecords).toBe(286);

    // Surah 114: An-Nas (6 verses)
    const s114 = await getChapterVerses(114, { page: 1, perPage: 6 });
    expect(s114.verses).toHaveLength(6);
    expect(s114.verses[0].verseKey).toBe("114:1");
    expect(s114.verses[0].audioUrl).toBe("https://verses.quran.foundation/Alafasy/mp3/114001.mp3");
    expect(s114.verses[5].verseKey).toBe("114:6");
    expect(s114.verses[5].audioUrl).toBe("https://verses.quran.foundation/Alafasy/mp3/114006.mp3");
    expect(s114.pagination.totalRecords).toBe(6);
  });

  it.runIf(hasCredentials)("verifies API errors fail directly without silent fixture fallback", async () => {
    const originalClientId = process.env.QURAN_FOUNDATION_CLIENT_ID;
    try {
      process.env.QURAN_FOUNDATION_CLIENT_ID = "invalid-client-id-for-test";
      vi.resetModules();
      const freshService = await import("@/lib/quran/service");
      await expect(freshService.getChapters("en")).rejects.toThrow();
    } finally {
      process.env.QURAN_FOUNDATION_CLIENT_ID = originalClientId;
    }
  });
});
