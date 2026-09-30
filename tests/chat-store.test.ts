// Saved chats: what is stored, the list grouping, and opening a saved answer. Made-up texts only.
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/sources/quran", () => ({ getVerse: vi.fn(), ATTRIBUTION: { text: "Quran data provided by Quran Foundation", url: "https://quran.foundation" } }));
vi.mock("@/lib/sources/hadith", () => ({ getHadith: vi.fn(), HADITH_ATTRIBUTION: { text: "h", url: "https://hadeethenc.com" } }));

const { chatTitle, groupByDay, stripAnswer } = await import("@/lib/chat/answer-store");
const { hydrateAnswer } = await import("@/lib/chat/hydrate");
const { quranCardId } = await import("@/lib/ask/answer-v2");
const { ATTRIBUTION } = await import("@/lib/sources/quran-meta");
const { HADITH_ATTRIBUTION } = await import("@/lib/sources/hadith-rules");
import type { AnswerV2 } from "@/lib/ask/answer-v2";

const QUOTE_ID = "S22222222-2222-2222-2222-222222222222";

function answer(): AnswerV2 {
  const verses = [{
    id: "Q2:183", key: "2:183", arabic: "نص عربي تجريبي", translation: "Made-up translation for testing", translation_name: "M.A.S. Abdel Haleem",
    url: "https://quran.com/2/183",
  }];
  return JSON.parse(JSON.stringify({
    version: 2, language: "en", origin: "live", review: "automatic",
    simple_answer: { sentences: [
      { text: "Believers are required to fast in a set month.", source_ids: ["Q2:183"], requirement_id: "R1" },
      { text: "The Prophet taught that fasting protects the one who fasts.", source_ids: ["HE9001"], requirement_id: "R1" },
      { text: "Shaykh Ibn Baz explained that fasting builds mindfulness of God.", source_ids: [QUOTE_ID], requirement_id: "R1" },
    ] },
    quran: [{ id: quranCardId(["Q2:183"]), source_ids: ["Q2:183"], points: ["R1"], cited: true, verses }],
    hadith: [{
      id: "HE9001", points: ["R1"], cited: true, collection: "agreed", numbers: { bukhari: 1904, muslim: 1151 },
      grade_ar: "صحيح", attribution_ar: "متفق عليه", arabic: "نص حديث تجريبي", translation: "Made-up hadith text about a shield",
      translation_language: "en", url: "https://hadeethenc.com/en/browse/hadith/9001",
    }],
    scholars: [{
      id: QUOTE_ID, points: ["R1"], cited: true, scholar_id: "ibn-baz", scholar_name: "Shaykh Ibn Baz", title: "عنوان تجريبي",
      reference: "مرجع تجريبي", arabic: "نص تجريبي من كلام الشيخ في بيان الصيام", url: "https://binbaz.org.sa/fatwas/9/test",
    }],
    videos: [],
    attribution: { quran: { ...ATTRIBUTION }, hadith: { ...HADITH_ATTRIBUTION } },
    provenance: { model: "fake/writer", verifier: "fake/verifier" },
  }));
}

const fakeVerse = { key: "2:183", arabic: "نص عربي تجريبي", arabicPlain: "", translations: { en: "Made-up translation for testing", de: null }, url: "https://quran.com/2/183" };
const fakeHadith = {
  id: "HE9001", collection: "agreed" as const, numbers: { bukhari: 1904, muslim: 1151 }, attributionAr: "متفق عليه", gradeAr: "صحيح",
  arabic: "نص حديث تجريبي", translations: { en: "Made-up hadith text about a shield", de: null }, url: "https://hadeethenc.com/en/browse/hadith/9001",
};
const deps = {
  getVerse: async (key: string) => (key === "2:183" ? fakeVerse : undefined),
  getHadith: async (id: string) => (id === "9001" ? fakeHadith : null),
};

describe("stripAnswer", () => {
  it("removes the Quran and hadith texts and keeps everything else", () => {
    const original = answer();
    const stored = stripAnswer(original);
    const verse = stored.quran[0].verses[0];
    expect([verse.arabic, verse.translation, verse.translation_name]).toEqual(["", null, null]);
    const hadith = stored.hadith[0];
    expect([hadith.arabic, hadith.translation, hadith.translation_language, hadith.grade_ar, hadith.attribution_ar]).toEqual(["", null, null, "", ""]);
    expect(JSON.stringify(stored)).not.toContain("Made-up translation");
    expect(JSON.stringify(stored)).not.toContain("Made-up hadith");
    // The sentences, ids and the scholar-library quote stay.
    expect(stored.simple_answer).toEqual(original.simple_answer);
    expect(stored.scholars).toEqual(original.scholars);
    expect(stored.quran[0].source_ids).toEqual(["Q2:183"]);
    // The answer that was passed in is not changed.
    expect(original.quran[0].verses[0].arabic).toBe("نص عربي تجريبي");
  });
});

describe("chatTitle", () => {
  it("keeps short questions, tidies spaces and cuts long ones at a word", () => {
    expect(chatTitle("  Is   music\nharam?  ")).toBe("Is music haram?");
    const long = chatTitle("What is the ruling on listening to recorded lectures while driving a car on long journeys every day?");
    expect(long.endsWith("…")).toBe(true);
    expect(long.length).toBeLessThanOrEqual(61);
    expect(chatTitle("   ")).toBe("?");
  });
});

describe("groupByDay", () => {
  it("groups by this device's calendar days, newest first, skipping empty groups", () => {
    const now = new Date(2026, 8, 30, 15, 0, 0);
    const at = (d: Date) => ({ updated_at: d.toISOString() });
    const items = [
      { id: "old", ...at(new Date(2026, 8, 20, 9)) },
      { id: "today-early", ...at(new Date(2026, 8, 30, 8)) },
      { id: "yesterday", ...at(new Date(2026, 8, 29, 23)) },
      { id: "today-late", ...at(new Date(2026, 8, 30, 14)) },
    ];
    const groups = groupByDay(items, now);
    expect(groups.map((g) => g.group)).toEqual(["today", "yesterday", "earlier"]);
    expect(groups[0].items.map((i) => i.id)).toEqual(["today-late", "today-early"]);
    expect(groupByDay([items[0]], now).map((g) => g.group)).toEqual(["earlier"]);
    expect(groupByDay([], now)).toEqual([]);
  });
});

describe("hydrateAnswer", () => {
  it("puts the texts back from their sources and passes the strict validator", async () => {
    const result = await hydrateAnswer(stripAnswer(answer()), deps);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.answer.quran[0].verses[0].arabic).toBe("نص عربي تجريبي");
    expect(result.answer.quran[0].verses[0].translation).toBe("Made-up translation for testing");
    expect(result.answer.hadith[0].translation).toBe("Made-up hadith text about a shield");
    expect(result.answer.hadith[0].grade_ar).toBe("صحيح");
    expect(result.answer).toEqual(answer());
  });

  it("shows nothing when a source cannot be loaded", async () => {
    const noVerse = await hydrateAnswer(stripAnswer(answer()), { ...deps, getVerse: async () => undefined });
    expect(noVerse).toEqual({ ok: false, reason: "source_unavailable" });
    const noHadith = await hydrateAnswer(stripAnswer(answer()), { ...deps, getHadith: async () => null });
    expect(noHadith).toEqual({ ok: false, reason: "source_unavailable" });
  });

  it("refuses wrong shapes, unknown fields and forged labels", async () => {
    expect((await hydrateAnswer(null, deps)).ok).toBe(false);
    expect((await hydrateAnswer({ version: 1 }, deps)).ok).toBe(false);
    expect((await hydrateAnswer({ ...stripAnswer(answer()), extra: true }, deps)).ok).toBe(false);
    expect((await hydrateAnswer({ ...stripAnswer(answer()), review: "god_reviewed" }, deps)).ok).toBe(false);
    const badKey = stripAnswer(answer());
    badKey.quran[0].verses[0].key = "../../etc";
    expect((await hydrateAnswer(badKey, deps)).ok).toBe(false);
  });
});
