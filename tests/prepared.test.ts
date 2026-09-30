// Prepared answers: shown only when approved, verses fetched live, and fail closed. No network.
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const verses = {
  "51:56": { key: "51:56", arabic: "وما خلقت الجن والانس الا ليعبدون", arabicPlain: "", translations: { en: "I created jinn and mankind only to worship Me", de: "Und Ich habe die Dschinn und die Menschen nur erschaffen, damit sie Mir dienen" }, url: "https://quran.com/51/56" },
  "2:2": { key: "2:2", arabic: "ذلك الكتاب لا ريب فيه هدى للمتقين", arabicPlain: "", translations: { en: "This is guidance for the mindful.", de: "Dies ist Rechtleitung für die Gottesfürchtigen." }, url: "https://quran.com/2/2" },
} as const;
const verse = verses["51:56"];
const getVerse = vi.fn(async (key: string) => verses[key as keyof typeof verses]);
vi.mock("@/lib/sources/quran", () => ({ getVerse, ATTRIBUTION: { text: "Quran data provided by Quran Foundation", url: "https://quran.foundation" } }));
vi.mock("@/lib/sources/hadith", () => ({ getHadith: vi.fn(async () => null), HADITH_ATTRIBUTION: { text: "h", url: "https://hadeethenc.com" } }));
vi.mock("@/lib/content", () => ({ getScholarNames: vi.fn(async () => ({ "ibn-baz": { ar: "ابن باز", en: "Shaykh Ibn Baz", de: "Scheich Ibn Baz" } })) }));
const { loadPrepared, preparedContentHash } = await import("@/lib/prepared");

const answers = (ids: string[]): {
  direct_answer: { text: string; source_ids: string[] }[];
  list?: { text: string; source_ids: string[] }[];
  explanation: { heading: string; sentences: { text: string; source_ids: string[] }[] }[];
} => ({
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
    const approved = file("approved");
    const a = await loadPrepared(approved, "en", { approvalHash: preparedContentHash(approved) });
    expect(getVerse).toHaveBeenCalledWith("51:56");
    expect(a?.direct_answer[0].source_ids).toEqual(["51:56"]);
    expect(a?.evidence[0]).toMatchObject({ kind: "quran", key: "51:56", translation: verse.translations.en });
    expect(a?.v2?.origin).toBe("prepared");
    expect(a?.v2?.quran[0].verses[0].arabic).toBe(verse.arabic);
  });

  it("loads and renders a source cited only by a numbered list item", async () => {
    const prepared = file("draft");
    prepared.sources.push({ id: "Q2:2", kind: "quran", reference: "2:2" });
    for (const language of ["ar", "en", "de"] as const) {
      prepared.answers[language].list = [
        { text: language === "ar" ? "اتبع الهدى الواضح." : language === "de" ? "Folge der klaren Rechtleitung." : "Follow the clear guidance.", source_ids: ["Q2:2"] },
        { text: language === "ar" ? "اعبد الله وحده." : language === "de" ? "Diene Allah allein." : "Worship Allah alone.", source_ids: ["Q51:56"] },
      ];
    }

    const answer = await loadPrepared(prepared, "en", { allowDraft: true });
    expect(getVerse).toHaveBeenCalledWith("2:2");
    expect(answer?.v2?.simple_answer.list?.[0].source_ids).toEqual(["Q2:2"]);
    expect(answer?.v2?.quran.flatMap((card) => card.source_ids)).toContain("Q2:2");
    expect(answer?.claims.some((claim) => claim.refs.includes("2:2"))).toBe(true);
  });

  it("invalidates an approval after any reader-visible content change", async () => {
    const approved = file("approved");
    const hash = preparedContentHash(approved);
    const changed = structuredClone(approved);
    changed.answers.en.direct_answer[0].text = "People have a changed explanation about worship.";
    expect(await loadPrepared(changed, "en", { approvalHash: hash })).toBeNull();
    expect(await loadPrepared(changed, "en", { allowDraft: true })).not.toBeNull();
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
    const a = await loadPrepared(ok, "en", { approvalHash: preparedContentHash(ok) });
    expect(a?.evidence[0]).toMatchObject({ kind: "scholar", scholarName: "Shaykh Ibn Baz" });
  });
});
