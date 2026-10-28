import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ScholarQuote } from "@/lib/sources/scholar-rules";

const mocks = vi.hoisted(() => ({
  getMappedScholarQuote: vi.fn(),
  searchScholarsLive: vi.fn(),
  searchScholarQuotes: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/content", () => ({ getReviewDecisions: vi.fn().mockResolvedValue({}) }));
vi.mock("@/lib/prepared", () => ({ loadPrepared: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/sources/scholars-live", () => ({
  getMappedScholarQuote: mocks.getMappedScholarQuote,
  searchScholarsLive: mocks.searchScholarsLive,
}));
vi.mock("@/lib/sources/scholars", () => ({ searchScholarQuotes: mocks.searchScholarQuotes }));

import { scholarQuotes, progressiveScholarFreshness } from "@/lib/ask/pipeline";

const quote = (id: string, url: string): ScholarQuote => ({
  id,
  scholarId: "ibn-baz",
  scholarName: { ar: "عبد العزيز بن باز", en: "Shaykh Abdul-Aziz ibn Baz", de: "Scheich Abdul-Aziz ibn Baz" },
  title: "عنوان تجريبي",
  reference: "مرجع تجريبي",
  arabic: "نص عربي تجريبي طويل بما يكفي للاختبار دون أن يكون نصا دينيا حقيقيا أو فتوى منسوبة إلى أحد",
  url,
});

describe("scholar source merging", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not let a mapped general source suppress stored or live specific results", async () => {
    const mapped = quote("S11111111-1111-1111-1111-111111111111", "https://binbaz.org.sa/fatwas/1/mapped");
    const stored = quote("S22222222-2222-2222-2222-222222222222", "https://binbaz.org.sa/fatwas/2/stored");
    const live = quote("S33333333-3333-3333-3333-333333333333", "https://binbaz.org.sa/fatwas/3/live");
    mocks.getMappedScholarQuote.mockResolvedValue(mapped);
    mocks.searchScholarQuotes.mockResolvedValue([stored, mapped]);
    mocks.searchScholarsLive.mockResolvedValue([live]);

    const result = await scholarQuotes(["عبارة بحث محددة"], [mapped.url]);

    expect(mocks.searchScholarQuotes).toHaveBeenCalledOnce();
    expect(mocks.searchScholarsLive).toHaveBeenCalledOnce();
    expect(result.map((item) => item.url)).toEqual([mapped.url, stored.url, live.url]);
  });
  it("keeps live retrieval out of the primary stored-library path", async () => {
    mocks.getMappedScholarQuote.mockResolvedValue(null);
    mocks.searchScholarQuotes.mockResolvedValue([]);
    expect(await scholarQuotes(["عبارة بحث محددة"], [], { allVariants: true })).toEqual([]);
    expect(mocks.searchScholarsLive).not.toHaveBeenCalled();
  });
  it("reuses a stored explanation only while the approved reader returns its exact current source", async () => {
    const stored = quote("S22222222-2222-2222-2222-222222222222", "https://binbaz.org.sa/fatwas/2/stored");
    const candidate = { id: stored.id, source: { kind: "scholar" as const, quote: stored }, context: [] };
    const read = () => progressiveScholarFreshness([candidate], [["عبارة بحث محددة"]], "ar", new AbortController().signal);
    mocks.searchScholarQuotes.mockResolvedValue([stored]);
    expect((await read()).has(stored.id)).toBe(true);
    expect(mocks.searchScholarQuotes).toHaveBeenCalledWith(["عبارة بحث محددة"], 8, expect.objectContaining({ allVariants: true, signal: expect.any(AbortSignal) }));
    mocks.searchScholarQuotes.mockResolvedValue([{ ...stored, arabic: stored.arabic + " تغير" }]);
    expect((await read()).size).toBe(0);
    mocks.searchScholarQuotes.mockResolvedValue([]); // Publication or permission withdrawn.
    expect((await read()).size).toBe(0);
    mocks.searchScholarQuotes.mockRejectedValue(new Error("approved reader unavailable"));
    await expect(read()).rejects.toThrow("approved reader unavailable");
  });
});
