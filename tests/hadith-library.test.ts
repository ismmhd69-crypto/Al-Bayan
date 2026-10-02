// Tests for Ask using the stored hadith library (HADITH_SOURCE=library). Made-up texts only.
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

let rpcResult: { data: unknown; error: { message: string } | null } = { data: [], error: null };
let rowsResult: { data: unknown; error: { message: string } | null } = { data: [], error: null };
const calls = { rpc: 0, from: 0 };
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    rpc: async () => { calls.rpc++; return rpcResult; },
    from: () => {
      calls.from++;
      const chain: Record<string, unknown> = {};
      for (const m of ["select", "in", "eq"]) chain[m] = () => chain;
      chain.maybeSingle = async () => ({ data: (rowsResult.data as unknown[])?.[0] ?? null, error: rowsResult.error });
      chain.then = (res: (v: unknown) => unknown) => res(rowsResult);
      return chain;
    },
  }),
}));

import {
  hadithAllowed, hadithAttributionFor, HADITH_ATTRIBUTION, isContinuationHadith, mapStoredHadith,
  MAX_LIBRARY_HADITH_CHARS, SUNNAH_ATTRIBUTION, type StoredHadithRow,
} from "@/lib/sources/hadith-rules";
import { hadithMode } from "@/lib/sources/hadith-mode";
import { searchLibraryHadith } from "@/lib/sources/hadith-library";
import { attachScholarTranslations } from "@/lib/ask/display-translations";
import { validateAnswerV2, type AnswerV2 } from "@/lib/ask/answer-v2";
import { hydrateAnswer } from "@/lib/chat/hydrate";
import { sourceKindMismatch } from "@/lib/ask/checks";
import { stripAnswer } from "@/lib/chat/answer-store";
import { attachHadithDisplay } from "@/lib/ask/display-translations";
import { toEvidence } from "@/lib/ask/core";

const UUID = "11111111-2222-4333-8444-555555555555";
const row = (over: Partial<StoredHadithRow> = {}): StoredHadithRow => ({
  id: UUID, kind: "hadith", scholar_id: null, published: true,
  reference: "Sahih al-Bukhari, hadith 2916, book 56, باب تجريبي", collection: "Sahih al-Bukhari", grade: "sahih",
  text_original: "حدثنا فلان عن فلان قال رسول الله صلى الله عليه وسلم فضل صلاة الجماعة في المسجد نص حديث تجريبي طويل بما يكفي ليكون مقتبسا",
  url: "https://sunnah.com/bukhari:2916", ...over,
});

describe("mapStoredHadith", () => {
  it("maps a Bukhari row", () => {
    const h = mapStoredHadith(row())!;
    expect(h.id).toBe(`SH${UUID}`);
    expect(h.collection).toBe("bukhari");
    expect(h.numbers).toEqual({ bukhari: 2916, muslim: null });
    expect(h.attributionAr).toBe("رواه البخاري");
    expect(h.gradeAr).toBe("صحيح");
    expect(h.arabic).toBe(row().text_original);
    expect(h.url).toBe("https://sunnah.com/bukhari:2916");
    expect(h.translations).toEqual({ en: null, de: null });
    expect(hadithAllowed(h)).toBe(true);
  });
  it("maps a Muslim row, including lettered numbers", () => {
    const h = mapStoredHadith(row({ collection: "Sahih Muslim", reference: "Sahih Muslim, hadith 1829 d, book 33, باب", url: "https://sunnah.com/muslim:1829d" }))!;
    expect(h.collection).toBe("muslim");
    expect(h.numbers).toEqual({ bukhari: null, muslim: 1829 });
    expect(h.attributionAr).toBe("رواه مسلم");
    expect(h.url).toBe("https://sunnah.com/muslim:1829d"); // the link keeps the letter
    expect(mapStoredHadith(row({ collection: "Sahih Muslim", reference: "Sahih Muslim, hadith 715 aa, book 33, باب", url: "https://sunnah.com/muslim:715a" }))!.numbers.muslim).toBe(715);
    expect(mapStoredHadith(row({ reference: "Sahih al-Bukhari, hadith 690b, book 10, باب", url: "https://sunnah.com/bukhari:690b" }))!.numbers.bukhari).toBe(690);
  });
  it("rejects anything that does not agree or is not a published sahih Sahihayn row", () => {
    expect(mapStoredHadith(row({ url: "https://sunnah.com/muslim:2916" }))).toBeNull();
    expect(mapStoredHadith(row({ url: "https://sunnah.com/bukhari:2917" }))).toBeNull();
    expect(mapStoredHadith(row({ url: "https://example.com/bukhari:2916" }))).toBeNull();
    expect(mapStoredHadith(row({ url: "http://sunnah.com/bukhari:2916" }))).toBeNull();
    expect(mapStoredHadith(row({ grade: "daif" }))).toBeNull();
    expect(mapStoredHadith(row({ collection: "Sunan Abi Dawud" }))).toBeNull();
    expect(mapStoredHadith(row({ reference: "Sahih Muslim, hadith 2916, book 56, باب" }))).toBeNull();
    expect(mapStoredHadith(row({ published: false }))).toBeNull();
    expect(mapStoredHadith(row({ scholar_id: "ibn-baz" }))).toBeNull();
    expect(mapStoredHadith(row({ kind: "fatwa" }))).toBeNull();
    expect(mapStoredHadith(row({ id: "not-a-uuid" }))).toBeNull();
    expect(mapStoredHadith(row({ text_original: "   " }))).toBeNull();
  });
  it("keeps a long text whole (never cut)", () => {
    const long = "كلمة ".repeat(1000);
    expect(mapStoredHadith(row({ text_original: long }))!.arabic).toBe(long);
    expect(MAX_LIBRARY_HADITH_CHARS).toBe(2500);
  });
});

describe("hadithAllowed still guards both sources", () => {
  const good = mapStoredHadith(row())!;
  it("rejects a stored hadith that breaks a rule", () => {
    expect(hadithAllowed({ ...good, gradeAr: "ضعيف" })).toBe(false);
    expect(hadithAllowed({ ...good, attributionAr: "رواه الترمذي" })).toBe(false);
    expect(hadithAllowed({ ...good, url: "https://hadeethenc.com/en/browse/hadith/1" })).toBe(false);
    expect(hadithAllowed({ ...good, collection: "agreed", numbers: { bukhari: 1, muslim: 2 } })).toBe(false);
    expect(hadithAllowed({ ...good, numbers: { bukhari: null, muslim: null } })).toBe(false);
    expect(hadithAllowed({ ...good, id: "SHnot-a-uuid" })).toBe(false);
    expect(hadithAllowed({ ...good, id: "X123" })).toBe(false);
  });
  it("still accepts a HadeethEnc hadith", () => {
    expect(hadithAllowed({ id: "HE12", collection: "bukhari", numbers: { bukhari: 1, muslim: null }, attributionAr: "رواه البخاري",
      gradeAr: "صحيح", arabic: "نص", translations: { en: null, de: null }, url: "https://hadeethenc.com/en/browse/hadith/12" })).toBe(true);
  });
});

describe("continuation filter", () => {
  const removed = [
    "وَحَدَّثَنِيهِ أَبُو كَامِلٍ، حَدَّثَنَا حَمَّادٌ، بِهَذَا الإِسْنَادِ نَحْوَهُ ‏.‏",
    "حَدَّثَنَا أَبُو كُرَيْبٍ، حَدَّثَنَا أَبُو مُعَاوِيَةَ، حَدَّثَنَا هِشَامٌ، بِهَذَا الإِسْنَادِ ‏.‏",
    "حَدَّثَنَا أَبُو نُعَيْمٍ، عَنْ سُفْيَانَ، عَنْ أَبِي إِسْحَاقَ، نَحْوَهُ بِهَذَا‏.‏",
    "قال بمثله",
    "حَدَّثَنَا أَبُو نُعَيْمٍ، وَمُوسَى بْنُ إِسْمَاعِيلَ، قَالاَ حَدَّثَنَا هَمَّامٌ، عَنْ قَتَادَةَ، عَنْ أَنَسٍ، عَنِ النَّبِيِّ صلى الله عليه وسلم نَحْوَهُ‏.‏", // points back to an earlier report
  ];
  it("removes continuation reports and fragments", () => { for (const t of removed) expect(isContinuationHadith(t)).toBe(true); });
  it("keeps real hadith, even short ones or ones that mention the same chain words after speech", () => {
    expect(isContinuationHadith(row().text_original)).toBe(false);
    expect(isContinuationHadith("وَكُنْتُ أَغْتَسِلُ أَنَا وَالنَّبِيُّ، صلى الله عليه وسلم مِنْ إِنَاءٍ وَاحِدٍ‏.‏")).toBe(false);
    expect(isContinuationHadith("حدثنا فلان بهذا الإسناد ثم قال رسول الله صلى الله عليه وسلم " + "كلمة ".repeat(60))).toBe(false);
  });
});

describe("the setting", () => {
  it("picks one source, off by default", () => {
    expect(hadithMode("library")).toBe("library");
    expect(hadithMode("hadeethenc")).toBe("hadeethenc");
    expect(hadithMode(undefined)).toBe("off");
    expect(hadithMode("")).toBe("off");
    expect(hadithMode("LIBRARY")).toBe("off");
    expect(hadithMode("both")).toBe("off");
  });
});

describe("attribution", () => {
  it("says Sunnah.com for stored hadith and HadeethEnc for live ones", () => {
    expect(SUNNAH_ATTRIBUTION.text).toBe("Hadith text: Sunnah.com");
    expect(hadithAttributionFor([`SH${UUID}`])).toEqual({ text: "Hadith text: Sunnah.com", url: "https://sunnah.com" });
    expect(hadithAttributionFor(["HE1", "HE2"])).toEqual({ ...HADITH_ATTRIBUTION });
    expect(hadithAttributionFor([`SH${UUID}`, "HE1"])).toBeNull();
    expect(hadithAttributionFor([])).toBeNull();
  });
  it("the Sunnah id counts as a hadith (not a scholar) in the source-kind check", () => {
    expect(sourceKindMismatch("The Prophet taught that this is good.", [`SH${UUID}`])).toBe(false);
    expect(sourceKindMismatch("Shaykh Ibn Baz explained that this is good.", [`SH${UUID}`])).toBe(true);
  });
});

function answer(): AnswerV2 {
  return {
    version: 2, language: "en", origin: "live", review: "automatic",
    simple_answer: { sentences: [{ text: "The Prophet taught that fasting protects the one who fasts.", source_ids: [`SH${UUID}`], requirement_id: "R1" }] },
    quran: [],
    hadith: [{ id: `SH${UUID}`, points: ["R1"], cited: true, collection: "bukhari", numbers: { bukhari: 2916, muslim: null },
      grade_ar: "صحيح", attribution_ar: "رواه البخاري", arabic: "نص حديث تجريبي عن الصيام", translation: null, translation_language: null,
      url: "https://sunnah.com/bukhari:2916" }],
    scholars: [], videos: [],
    attribution: { hadith: { ...SUNNAH_ATTRIBUTION } },
    provenance: { model: "fake/writer", verifier: "fake/verifier" },
  } as AnswerV2;
}
const LIVE = { origin: "live", review: "automatic" } as const;

describe("AnswerV2 with stored hadith", () => {
  it("accepts the Sunnah.com link and attribution", () => { expect(validateAnswerV2(answer(), LIVE).ok).toBe(true); });
  it("rejects the HadeethEnc attribution on a stored hadith", () => {
    const wrong = answer(); wrong.attribution = { hadith: { ...HADITH_ATTRIBUTION } };
    expect(validateAnswerV2(wrong, LIVE).ok).toBe(false);
  });
  it("rejects a wrong link, collection or number", () => {
    const a = answer(); a.hadith[0].url = "https://hadeethenc.com/en/browse/hadith/1";
    expect(validateAnswerV2(a, LIVE).ok).toBe(false);
    const b = answer(); b.hadith[0].url = "https://sunnah.com/muslim:2916";
    expect(validateAnswerV2(b, LIVE).ok).toBe(false);
    const c = answer(); c.hadith[0].numbers = { bukhari: null, muslim: null };
    expect(validateAnswerV2(c, LIVE).ok).toBe(false);
  });
  it("rejects the answer when the attribution link is missing", () => {
    const a = answer(); a.attribution = {};
    expect(validateAnswerV2(a, LIVE).ok).toBe(false);
  });
});

describe("saved chats reopen stored hadith from the library only", () => {
  const stored = () => ({ ...answer(), hadith: [{ ...answer().hadith[0], arabic: "", grade_ar: "", attribution_ar: "" }] });
  it("loads by the SH id and fails closed when it cannot", async () => {
    const ok = await hydrateAnswer(stored(), { getVerse: async () => undefined, getHadith: vi.fn(), getLibraryHadith: async () => mapStoredHadith(row()) });
    expect(ok.ok).toBe(true);
    const failed = await hydrateAnswer(stored(), { getVerse: async () => undefined, getHadith: vi.fn(), getLibraryHadith: async () => null });
    expect(failed).toEqual({ ok: false, reason: "source_unavailable" });
    const getHadith = vi.fn(async () => null);
    await hydrateAnswer(stored(), { getVerse: async () => undefined, getHadith });
    expect(getHadith).not.toHaveBeenCalled(); // never falls back to HadeethEnc
  });
});

describe("translations for stored hadith", () => {
  const prev = process.env.SHOW_AI_TRANSLATIONS;
  afterEach(() => { if (prev === undefined) delete process.env.SHOW_AI_TRANSLATIONS; else process.env.SHOW_AI_TRANSLATIONS = prev; });
  it("shows nothing extra when no translation exists (Arabic only)", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://x"; process.env.SUPABASE_SECRET_KEY = "k";
    rowsResult = { data: [], error: null };
    expect((await attachScholarTranslations(answer())).hadith[0].translation).toBeNull();
  });
  it("attaches an AI translation with the AI flag when one exists, and only when allowed", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://x"; process.env.SUPABASE_SECRET_KEY = "k";
    process.env.SHOW_AI_TRANSLATIONS = "true";
    rowsResult = { data: [{ source_id: UUID, lang: "en", text: "Made-up English text", origin: "ai", published: false }], error: null };
    const out = await attachScholarTranslations(answer());
    expect(out.hadith[0]).toMatchObject({ translation: "Made-up English text", translation_language: "en", ai_translation: true });
    delete process.env.SHOW_AI_TRANSLATIONS;
    expect((await attachScholarTranslations(answer())).hadith[0].translation).toBeNull(); // unpublished stays hidden
  });
});

describe("library lookup", () => {
  afterEach(() => { calls.rpc = 0; calls.from = 0; vi.unstubAllGlobals(); });
  const env = () => { process.env.NEXT_PUBLIC_SUPABASE_URL = "http://x"; process.env.SUPABASE_SECRET_KEY = "k"; };
  it("fails closed with an error when the search fails, and never calls HadeethEnc", async () => {
    env();
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    rpcResult = { data: null, error: { message: "boom" } };
    await expect(searchLibraryHadith({ ar: ["فضل صلاة الجماعة في المسجد"] })).rejects.toThrow(/hadith search failed/);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("makes one search and one batched read, drops continuations and over-long texts", async () => {
    env();
    const other = "22222222-2222-4333-8444-555555555555";
    const third = "33333333-2222-4333-8444-555555555555";
    rpcResult = { data: [{ source_id: other }, { source_id: UUID }, { source_id: third }], error: null };
    rowsResult = { data: [
      row(),
      row({ id: other, text_original: "حَدَّثَنَا أَبُو كُرَيْبٍ، حَدَّثَنَا أَبُو مُعَاوِيَةَ، بِهَذَا الإِسْنَادِ ‏.‏" }),
      row({ id: third, text_original: "كلمة ".repeat(600) }),
    ], error: null };
    const found = await searchLibraryHadith({ ar: ["فضل صلاة الجماعة في المسجد"] });
    expect(found.map((h) => h.id)).toEqual([`SH${UUID}`]);
    expect(calls.from).toBe(1);
    expect(calls.rpc).toBeGreaterThan(0); // the queries run in parallel, never one after another
    expect(calls.rpc).toBeLessThanOrEqual(4);
  });
  it("drops a hadith that shares no topic word with the question and puts the best match first", async () => {
    env();
    const other = "22222222-2222-4333-8444-555555555555";
    rpcResult = { data: [{ source_id: other }, { source_id: UUID }], error: null };
    rowsResult = { data: [row({ id: other, text_original: "حدثنا فلان عن فلان عن النبي صلى الله عليه وسلم في أمر آخر تماما لا علاقة له بالموضوع المسؤول عنه هنا" }), row()], error: null };
    expect((await searchLibraryHadith({ ar: ["فضل صلاة الجماعة في المسجد"] })).map((h) => h.id)).toEqual([`SH${UUID}`]);
  });
  it("returns nothing without Arabic phrases", async () => { expect(await searchLibraryHadith({ en: ["prayer"] })).toEqual([]); });
});

// ---------- hadith card layout: chapter heading and display split ----------

const QUOTED = "حدثنا فلان عن فلان عن النبي صلى الله عليه وسلم قال ‏\"‏ نص تجريبي عن الصيام وجزائه ‏\"‏‏.‏";
const withChapter = (over: Partial<AnswerV2["hadith"][number]> = {}): AnswerV2 => {
  const a = answer();
  a.hadith[0] = { ...a.hadith[0], arabic: QUOTED, chapter: "باب تجريبي", ...over };
  return a;
};

describe("chapter heading", () => {
  it("comes from the stored title, unchanged, and reaches the evidence item", () => {
    const h = mapStoredHadith(row({ title: "باب مِنَ الإِيمَانِ" }))!;
    expect(h.chapter).toBe("باب مِنَ الإِيمَانِ");
    expect(toEvidence({ kind: "hadith", hadith: h }, "en")).toMatchObject({ chapter: "باب مِنَ الإِيمَانِ" });
    expect(mapStoredHadith(row())!.chapter).toBeNull();
    expect(mapStoredHadith(row({ title: "  " }))!.chapter).toBeNull();
    expect(mapStoredHadith(row({ title: "<b>باب</b>" }))!.chapter).toBeNull();
    expect("chapter" in toEvidence({ kind: "hadith", hadith: mapStoredHadith(row())! }, "en")).toBe(false);
  });
  it("the validator accepts it on stored hadith only and rejects a display split", () => {
    expect(validateAnswerV2(withChapter(), LIVE).ok).toBe(true);
    expect(validateAnswerV2(answer(), LIVE).ok).toBe(true); // old answers without a chapter
    expect(validateAnswerV2(withChapter({ chapter: " " }), LIVE).ok).toBe(false);
    const split = withChapter(); (split.hadith[0] as Record<string, unknown>).display_split = { chain: "x" };
    expect(validateAnswerV2(split, LIVE).ok).toBe(false); // the split is display-only, never stored or checked
  });
});

describe("saved chats with the new card", () => {
  it("strip the chapter, split and words translation; reopening adds the chapter back from the library", async () => {
    const shown = await attachHadithDisplay(withChapter(), true);
    expect(shown.hadith[0].display_split).toBeTruthy();
    const saved = stripAnswer({ ...shown, hadith: [{ ...shown.hadith[0], words_translation: "x" }] });
    for (const key of ["chapter", "display_split", "words_translation"]) expect(key in saved.hadith[0]).toBe(false);
    const reopened = await hydrateAnswer(saved, { getVerse: async () => undefined, getHadith: vi.fn(),
      getLibraryHadith: async () => mapStoredHadith(row({ title: "باب تجريبي", text_original: QUOTED })) });
    expect(reopened.ok && reopened.answer.hadith[0].chapter).toBe("باب تجريبي");
  });
  it("an old saved answer without a chapter still opens", async () => {
    const old = { ...answer(), hadith: [{ ...answer().hadith[0], arabic: "", grade_ar: "", attribution_ar: "" }] };
    const reopened = await hydrateAnswer(old, { getVerse: async () => undefined, getHadith: vi.fn(), getLibraryHadith: async () => mapStoredHadith(row()) });
    expect(reopened.ok).toBe(true);
  });
});

describe("display step: split and kill switch", () => {
  const prev = process.env.SHOW_AI_TRANSLATIONS;
  afterEach(() => { if (prev === undefined) delete process.env.SHOW_AI_TRANSLATIONS; else process.env.SHOW_AI_TRANSLATIONS = prev; });
  it("adds a split whose pieces rejoin to the full text; the full text is untouched", async () => {
    rowsResult = { data: [], error: null };
    const out = (await attachHadithDisplay(withChapter(), true)).hadith[0];
    const s = out.display_split!;
    expect(out.arabic).toBe(QUOTED);
    expect(s.chain + s.open + s.words + s.close + s.tail).toBe(QUOTED);
    expect(s.speaker).toBe("prophet");
  });
  it("HADITH_SPLIT=off: no split (the full-text card as before)", async () => {
    expect((await attachHadithDisplay(withChapter(), false)).hadith[0].display_split).toBeUndefined();
    const prevSplit = process.env.HADITH_SPLIT;
    process.env.HADITH_SPLIT = "off";
    rowsResult = { data: [], error: null };
    expect((await attachScholarTranslations(withChapter())).hadith[0].display_split).toBeUndefined();
    if (prevSplit === undefined) delete process.env.HADITH_SPLIT; else process.env.HADITH_SPLIT = prevSplit;
  });
  it("no split when the text has no quote, and never for HadeethEnc hadith", async () => {
    expect((await attachHadithDisplay(answer(), true)).hadith[0].display_split).toBeUndefined();
    const he = withChapter({ id: "HE5913", url: "https://hadeethenc.com/en/browse/hadith/5913" });
    delete he.hadith[0].chapter;
    expect((await attachHadithDisplay(he, true)).hadith[0].display_split).toBeUndefined();
  });
  it("words translation (Phase 2) is attached when it exists and allowed, else the card falls back", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://x"; process.env.SUPABASE_SECRET_KEY = "k";
    process.env.SHOW_AI_TRANSLATIONS = "true";
    rowsResult = { data: [{ source_id: UUID, lang: "en", text: "Made-up words", origin: "ai", published: false }], error: null };
    expect((await attachHadithDisplay(withChapter(), true)).hadith[0].words_translation).toBe("Made-up words");
    delete process.env.SHOW_AI_TRANSLATIONS;
    expect((await attachHadithDisplay(withChapter(), true)).hadith[0].words_translation).toBeUndefined();
    rowsResult = { data: null, error: { message: "relation does not exist" } };
    const out = (await attachHadithDisplay(withChapter(), true)).hadith[0];
    expect(out.words_translation).toBeUndefined();
    expect(out.display_split).toBeTruthy();
    const ar = withChapter(); ar.language = "ar";
    expect((await attachHadithDisplay(ar, true)).hadith[0].words_translation).toBeUndefined();
  });
});
