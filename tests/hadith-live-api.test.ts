import { describe, expect, it, vi } from "vitest";
import fs from "node:fs";

vi.mock("server-only", () => ({}));

// Live integration tests are strictly opt-in to keep standard test runs offline and deterministic.
const isLiveOptIn = process.env.RUN_LIVE_HADITH_TESTS === "true";

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

const hasCredentials = Boolean(process.env.SUNNAH_API_KEY);

describe.runIf(isLiveOptIn)("Sunnah.com Live API Integration (opt-in)", () => {
  it("verifies SUNNAH_API_KEY is loaded", () => {
    expect(hasCredentials).toBe(true);
  });

  it.runIf(hasCredentials)("fetches all books for Bukhari (97) and Muslim (56 authentic books) live", async () => {
    const { getCollectionBooks } = await import("@/lib/hadith/service");

    const bukhariBooks = await getCollectionBooks("bukhari");
    expect(bukhariBooks).toHaveLength(97);
    expect(bukhariBooks[0].bookNumber).toBe("1");
    expect(bukhariBooks[0].nameEnglish).toBe("Revelation");

    const muslimBooks = await getCollectionBooks("muslim");
    // Sunnah.com returns 57 book entries for Muslim: 1 introduction (excluded by eligibility rules) + 56 authentic books
    expect(muslimBooks).toHaveLength(56);
    expect(muslimBooks[0].bookNumber).toBe("1");
    expect(muslimBooks[0].nameArabic).toContain("الإيمان");
  });

  it.runIf(hasCredentials)("fetches Bukhari 1 and Muslim 8a live with Arabic and English paired", async () => {
    const { getHadithByReference } = await import("@/lib/hadith/service");

    // Bukhari 1: Intention hadith
    const b1 = await getHadithByReference("bukhari", "1");
    expect(b1).not.toBeNull();
    expect(b1?.displayNumber).toBe("1");
    expect(b1?.arabicText).toContain("الأَعْمَالُ بِالنِّيَّاتِ");
    expect(b1?.englishText).toContain("reward of deeds");
    expect(b1?.url).toBe("https://sunnah.com/bukhari:1");

    // Muslim 8a: Faith hadith with suffix
    const m8a = await getHadithByReference("muslim", "8a");
    expect(m8a).not.toBeNull();
    expect(m8a?.displayNumber).toBe("8a");
    expect(m8a?.arabicText).toContain("يَحْيَى بْنِ يَعْمَرَ");
    expect(m8a?.englishText).toContain("Yahya b. Ya'mur");
    expect(m8a?.url).toBe("https://sunnah.com/muslim:8a");
  });

  it.runIf(hasCredentials)("verifies API errors fail directly without silent fixture fallback", async () => {
    const originalKey = process.env.SUNNAH_API_KEY;
    try {
      process.env.SUNNAH_API_KEY = "invalid-key-for-test";
      vi.resetModules();
      const freshService = await import("@/lib/hadith/service");
      await expect(freshService.getCollectionBooks("bukhari")).rejects.toThrow();
    } finally {
      process.env.SUNNAH_API_KEY = originalKey;
    }
  });
});
