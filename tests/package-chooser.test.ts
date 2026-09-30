// Capped sealed package (design phase 2). Fixed candidate and selector inputs, so the result must be
// identical every time. This proves the chooser is deterministic; it does not make live search so.
import { describe, expect, it } from "vitest";
import { chooseSealedPackage, PACKAGE_CAPS } from "@/lib/ask/package";
import { parseEvidencePackage, parseQuestionFrame, type PassageForSelection, type SelectedPassage } from "@/lib/ask/retrieval";
import type { Hadith } from "@/lib/sources/hadith-rules";
import type { ScholarQuote } from "@/lib/sources/scholar-rules";

const verse = (key: string, points: string[]): SelectedPassage => ({
  id: `Q${key}`, context: [], requirementIds: points, facets: [],
  source: { kind: "quran", verse: { key, arabic: "نص تجريبي", arabicPlain: "نص تجريبي", translations: { en: "Made-up text", de: null }, url: `https://quran.com/${key.replace(":", "/")}` } },
});
const hadith = (n: number, points: string[]): SelectedPassage => ({
  id: `HE${n}`, context: [], requirementIds: points, facets: [],
  source: { kind: "hadith", hadith: { id: `HE${n}`, collection: "bukhari", numbers: { bukhari: n, muslim: null }, attributionAr: "رواه البخاري",
    gradeAr: "صحيح", arabic: "نص حديث تجريبي", translations: { en: "Made-up hadith", de: null }, url: `https://hadeethenc.com/en/browse/hadith/${n}` } as Hadith },
});
const quote = (n: number, points: string[], url = `https://binbaz.org.sa/fatwas/${n}/x`): SelectedPassage => {
  const id = `S${String(n).repeat(8).slice(0, 8)}-0000-4000-a000-000000000000`;
  return { id, context: [], requirementIds: points, facets: [],
    source: { kind: "scholar", quote: { id, scholarId: "ibn-baz", scholarName: { ar: "ابن باز", en: "Ibn Baz", de: "Ibn Baz" },
      title: null, reference: "مرجع", arabic: "نص تجريبي", url } as ScholarQuote } };
};
const ids = (result: ReturnType<typeof chooseSealedPackage>) => result?.passages.map((p) => p.id);
const FATIHA = ["Q1:1", "Q1:2", "Q1:3", "Q1:4", "Q1:5", "Q1:6", "Q1:7"];

describe("capped sealed package", () => {
  it("gives the same package for the same fixed inputs", () => {
    const input = [verse("2:255", ["R1"]), hadith(9, ["R1"]), verse("2:3", ["R1"]), quote(1, ["R1"]), verse("2:183", ["R1"])];
    const first = chooseSealedPackage(input, ["R1"]);
    expect(chooseSealedPackage(input, ["R1"])).toEqual(first);
    expect(ids(first)).toEqual(["Q2:255", "Q2:3", "Q2:183", "HE9", ids(first)![4]]);
  });

  it("caps each source kind: 3 Quran cards, 2 hadith, 2 scholar quotes", () => {
    const input = [
      ...["2:10", "2:20", "2:30", "2:40", "2:50"].map((key) => verse(key, ["R1"])),
      ...[1, 2, 3, 4].map((n) => hadith(n, ["R1"])),
      ...[1, 2, 3].map((n) => quote(n, ["R1"])),
    ];
    const result = chooseSealedPackage(input, ["R1"])!;
    expect(result.cards.map((card) => card.id)).toEqual(["quran-2-10", "quran-2-20", "quran-2-30"]);
    expect(result.passages.filter((p) => p.source.kind === "hadith").map((p) => p.id)).toEqual(["HE1", "HE2"]);
    expect(result.passages.filter((p) => p.source.kind === "scholar")).toHaveLength(PACKAGE_CAPS.scholar);
  });

  it("groups consecutive verses into one passage card, in numeric order", () => {
    const input = ["2:185", "2:183", "3:7", "2:184", "4:1", "5:1"].map((key) => verse(key, ["R1"]));
    const result = chooseSealedPackage(input, ["R1"])!;
    expect(result.cards).toEqual([
      { id: "quran-2-183-185", sourceIds: ["Q2:183", "Q2:184", "Q2:185"], named: false },
      { id: "quran-3-7", sourceIds: ["Q3:7"], named: false },
      { id: "quran-4-1", sourceIds: ["Q4:1"], named: false },
    ]);
    expect(result.passages.map((p) => p.id)).not.toContain("Q5:1"); // a fourth card would break the cap
  });

  it("covers every point first, even with a low-ranked source", () => {
    const input = [
      ...["2:10", "2:20", "2:30"].map((key) => verse(key, ["R1"])),
      hadith(1, ["R1"]), hadith(2, ["R1"]), hadith(3, ["R2"]),
    ];
    const result = chooseSealedPackage(input, ["R1", "R2"])!;
    expect(ids(result)).toContain("HE3");
    expect(ids(result)!.filter((id) => id.startsWith("HE"))).toEqual(["HE1", "HE3"]);
  });

  it("uses the smallest covering set, then prefers sources that answer more points", () => {
    const input = [verse("2:1", ["R1"]), verse("2:9", ["R2"]), hadith(5, ["R1", "R2"])];
    const result = chooseSealedPackage(input, ["R1", "R2"])!;
    expect(result.passages[0].id).toBe("Q2:1"); // writer order: first point, then Quran before hadith
    expect(ids(result)).toEqual(["Q2:1", "HE5", "Q2:9"]);
  });

  it("refuses when no set within the caps covers every point", () => {
    const input = [hadith(1, ["R1"]), hadith(2, ["R2"]), hadith(3, ["R3"])];
    expect(chooseSealedPackage(input, ["R1", "R2", "R3"])).toBeNull();
    const verses = ["2:10", "2:20", "2:30", "2:40"].map((key, i) => verse(key, [`R${i + 1}`]));
    expect(chooseSealedPackage(verses, ["R1", "R2", "R3", "R4"])).toBeNull(); // four separate cards needed
  });

  it("ranks topic-map and visitor-named passages above retrieval order", () => {
    const input = ["2:10", "2:20", "2:30", "2:40"].map((key) => verse(key, ["R1"]));
    const result = chooseSealedPackage(input, ["R1"], { preferredIds: new Set(["Q2:40"]) })!;
    expect(ids(result)![0]).toBe("Q2:40");
    expect(ids(result)).not.toContain("Q2:30");
  });

  it("keeps a complete named passage as one card, only when all of it is direct", () => {
    const fatiha = FATIHA.map((id) => verse(id.slice(1), ["R1"]));
    const result = chooseSealedPackage([...fatiha, verse("2:2", ["R1"]), verse("3:1", ["R1"]), verse("4:1", ["R1"])], ["R1"], { namedPassages: [FATIHA] })!;
    expect(result.cards[0]).toEqual({ id: "quran-1-1-7", sourceIds: FATIHA, named: true });
    expect(result.cards).toHaveLength(3);
    expect(ids(result)!.slice(0, 7)).toEqual(FATIHA);
    // Not every verse direct: no complete card; its direct verses are ordinary verses.
    const partial = chooseSealedPackage(fatiha.filter((p) => p.id !== "Q1:4"), ["R1"], { namedPassages: [FATIHA] })!;
    expect(partial.cards.every((card) => !card.named)).toBe(true);
    expect(partial.cards.map((card) => card.id)).toEqual(["quran-1-1-3", "quran-1-5-7"]);
  });

  it("drops exact duplicate ids and repeated fatwa pages", () => {
    const shared = "https://binbaz.org.sa/fatwas/1/same";
    const result = chooseSealedPackage([quote(1, ["R1"], shared), quote(2, ["R1"], shared), verse("2:1", ["R1"]), verse("2:1", ["R1"])], ["R1"])!;
    expect(ids(result)).toEqual(["Q2:1", quote(1, ["R1"]).id]);
  });
});

describe("parseEvidencePackage uses the capped chooser", () => {
  const frame = parseQuestionFrame({ language: "en", kind: "question", question_type: "general", subjects: ["example"],
    requested_points: [{ text: "general answer", facet: "general" }], qualifiers: [],
    search_queries_en: ["example words"], search_queries_de: [], search_queries_ar: [] })!;
  it("never hands the writer more than the caps, whatever the selector marks direct", () => {
    const candidates: PassageForSelection[] = [
      ...["2:10", "2:20", "2:30", "2:40"].map((key) => verse(key, [])),
      ...[1, 2, 3].map((n) => hadith(n, [])),
    ].map(({ id, source, context }) => ({ id, source, context }));
    const result = parseEvidencePackage({ status: "ready", coverage: "complete", conflict: "none",
      assessments: candidates.map((c) => ({ source_id: c.id, relevance: "direct", supported_requirement_ids: ["R1"], context_safe: "yes" })) },
    frame, candidates)!;
    expect(result.passages.map((p) => p.id)).toEqual(["Q2:10", "Q2:20", "Q2:30", "HE1", "HE2"]);
    expect(result.cards).toHaveLength(3);
  });
});
