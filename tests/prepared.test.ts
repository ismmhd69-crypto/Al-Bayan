// Prepared answers: shown only when approved, verses fetched live, and fail closed. No network.
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const verse = { key: "51:56", arabic: "وما خلقت الجن والانس الا ليعبدون", arabicPlain: "", translations: { en: "I created jinn and mankind only to worship Me", de: "Und Ich habe die Dschinn und die Menschen nur erschaffen, damit sie Mir dienen" }, url: "https://quran.com/51/56" };
const getVerse = vi.fn(async (key: string) => (key === "51:56" ? verse : undefined));
vi.mock("@/lib/sources/quran", () => ({ getVerse, ATTRIBUTION: { text: "Quran data provided by Quran Foundation", url: "https://quran.foundation" } }));
vi.mock("@/lib/sources/hadith", () => ({ getHadith: vi.fn(async () => null), HADITH_ATTRIBUTION: { text: "h", url: "https://hadeethenc.com" } }));
vi.mock("@/lib/content", () => ({ getScholarNames: vi.fn(async () => ({ "ibn-baz": { ar: "ابن باز", en: "Shaykh Ibn Baz", de: "Scheich Ibn Baz" } })) }));
const { loadPrepared } = await import("@/lib/prepared");

const answers = (ids: string[]) => ({
  direct_answer: [{ text: "People were created to worship Allah alone.", source_ids: ids }],
  explanation: [],
});
const file = (status: "draft" | "approved", ids = ["Q51:56"]) => ({
  status,
  sources: [{ id: "Q51:56", kind: "quran" as const, reference: "51:56" }],
  answers: { ar: answers(ids), en: answers(ids), de: answers(ids) },
});

describe("loadPrepared", () => {
  beforeEach(() => getVerse.mockClear());

  it("shows nothing publicly until Mo approves, but drafts load on the review page", async () => {
    expect(await loadPrepared(file("draft"), "en")).toBeNull();
    const draft = await loadPrepared(file("draft"), "en", { allowDraft: true });
    expect(draft?.prepared).toBe(true);
  });

  it("fetches the verse live and shows it like a live answer", async () => {
    const a = await loadPrepared(file("approved"), "en");
    expect(getVerse).toHaveBeenCalledWith("51:56");
    expect(a?.direct_answer[0].source_ids).toEqual(["51:56"]);
    expect(a?.evidence[0]).toMatchObject({ kind: "quran", key: "51:56", translation: verse.translations.en });
  });

  it("fails closed when a cited source is unknown, missing or rejected", async () => {
    expect(await loadPrepared(file("approved", ["Q2:999"]), "en")).toBeNull(); // not in sources
    const missingVerse = { ...file("approved", ["Q2:1"]), sources: [{ id: "Q2:1", kind: "quran" as const }] };
    expect(await loadPrepared(missingVerse, "en")).toBeNull(); // the API has no such verse
    const hadith = { ...file("approved", ["HE1"]), sources: [{ id: "HE1", kind: "hadith" as const }] };
    expect(await loadPrepared(hadith, "en")).toBeNull(); // fails the Sahihayn rules
    const offSite = { ...file("approved", ["S11111111-1111-1111-1111-111111111111"]), sources: [{ id: "S11111111-1111-1111-1111-111111111111", kind: "scholar" as const, scholar_id: "ibn-baz", reference: "x", arabic: "نص قصير من كلام الشيخ.", url: "https://example.com/x" }] };
    expect(await loadPrepared(offSite, "en")).toBeNull(); // quote not from the scholar's official site
  });
});

describe("loadPrepared scholar quotes", () => {
  it("accepts a short quote from the scholar's official site", async () => {
    const id = "S11111111-1111-1111-1111-111111111111";
    const ok = { status: "approved" as const,
      sources: [{ id, kind: "scholar" as const, scholar_id: "ibn-baz", reference: "binbaz.org.sa, fatwa 1", arabic: "نص قصير من كلام الشيخ.", url: "https://binbaz.org.sa/fatwas/1/x" }],
      answers: { ar: answers([id]), en: answers([id]), de: answers([id]) } };
    const a = await loadPrepared(ok, "en");
    expect(a?.evidence[0]).toMatchObject({ kind: "scholar", scholarName: "Shaykh Ibn Baz" });
  });
});
