import { expect, it, vi } from "vitest";
import { discoverAdjacentQuranCandidates } from "@/lib/ask/search-engine/adjacent-quran-discovery";
import type { PassageForSelection } from "@/lib/ask/retrieval";
import type { Verse } from "@/lib/sources/quran-meta";

// Invented source wording; these cases prove identity and discovery behaviour only.
const verse = (key: string): Verse => ({ key, arabic: `نص اختباري مستقل للآية ${key}`, arabicPlain: "نص اختباري", translations: { en: null, de: null }, url: `https://quran.com/${key.replace(":", "/")}` });
const seed = (key: string, neighbors: Verse[]): PassageForSelection => ({ id: `Q${key}`, source: { kind: "quran", verse: verse(key) }, context: neighbors, retrievedFor: ["R1"] });
const signal = () => new AbortController().signal;
it("fetches an immediate neighbour as a distinct source, with empty own context awaiting normal checking", async () => {
  const near = verse("2:184"), read = vi.fn(async () => near), original = seed("2:183", [near]);
  const result = await discoverAdjacentQuranCandidates([original], read, signal());
  expect(read).toHaveBeenCalledExactlyOnceWith("2:184");
  expect(result).toEqual([{ id: "Q2:184", source: { kind: "quran", verse: near }, context: [], retrievedFor: ["R1"] }]);
  expect(original.context).toEqual([near]);
  expect(result[0]).not.toHaveProperty("requirementIds");
});
it("never recursively follows the new source's neighbours or arbitrary context references", async () => {
  const read = vi.fn(async () => verse("2:184"));
  await discoverAdjacentQuranCandidates([seed("2:183", [verse("2:184"), verse("35:15")])], read, signal());
  expect(read).toHaveBeenCalledTimes(1);
});
it("keeps existing identities and merges discovery provenance without duplicate fetches", async () => {
  const a = seed("2:183", [verse("2:184")]), b = seed("2:185", [verse("2:184")]); b.retrievedFor = ["R2"];
  const read = vi.fn(async () => verse("2:184"));
  const added = await discoverAdjacentQuranCandidates([a, b], read, signal());
  expect(added[0].retrievedFor?.toSorted()).toEqual(["R1", "R2"]); expect(read).toHaveBeenCalledTimes(1);
  expect(await discoverAdjacentQuranCandidates([a, seed("2:184", [])], read, signal())).toEqual([]);
});
it.each(["wrong key", "changed original", "wrong URL", "source outage"])("excludes a failed independent source read: %s", async problem => {
  const read = vi.fn(async () => {
    if (problem === "source outage") throw Error("connection failed");
    const v = verse("2:184");
    if (problem === "wrong key") v.key = "2:185";
    if (problem === "changed original") v.arabic += " نص مختلف";
    if (problem === "wrong URL") v.url = "https://example.com/2/184";
    return v;
  });
  const rejected = vi.fn();
  expect(await discoverAdjacentQuranCandidates([seed("2:183", [verse("2:184")])], read, signal(), rejected)).toEqual([]);
  expect(rejected).toHaveBeenCalledTimes(1);
});
it("does not conceal conflicting context and existing original revisions", async () => {
  const near = verse("2:184"); near.arabic += " changed";
  await expect(discoverAdjacentQuranCandidates([seed("2:183", [near]), seed("2:184", [])], async () => near, signal())).rejects.toThrow("research_context_identity_changed");
});
it("caps new identities at sixteen and keeps the complete pool within 120", async () => {
  const seeds = Array.from({ length: 20 }, (_, i) => seed(`2:${i * 3 + 2}`, [verse(`2:${i * 3 + 1}`), verse(`2:${i * 3 + 3}`)]));
  const read = vi.fn(async key => verse(key));
  expect(await discoverAdjacentQuranCandidates(seeds, read, signal())).toHaveLength(16);
  const padded = [...seeds, ...Array.from({ length: 98 }, (_, i) => seed(`3:${i + 1}`, []))];
  expect(await discoverAdjacentQuranCandidates(padded, read, signal())).toHaveLength(2);
});
it("does not spend the entire bounded pool on preceding verses while starving following verses", async () => {
  const seeds = Array.from({ length: 16 }, (_, i) => seed(`2:${i * 3 + 2}`, [verse(`2:${i * 3 + 1}`), verse(`2:${i * 3 + 3}`)]));
  const result = await discoverAdjacentQuranCandidates(seeds, async key => verse(key), signal());
  expect(result).toHaveLength(16);
  expect(result.slice(0, 2).map(c => c.id)).toEqual(["Q2:1", "Q2:3"]);
});
it("propagates cancellation without approving a partially fetched source", async () => {
  const controller = new AbortController();
  const read = async () => { controller.abort(); throw Error("aborted"); };
  await expect(discoverAdjacentQuranCandidates([seed("2:183", [verse("2:184")])], read, controller.signal)).rejects.toMatchObject({ name: "AbortError" });
});

it("uses semantic priority so a late strong seed gets both neighbours within the same fixed budget", async () => {
  const seeds = Array.from({ length: 20 }, (_, i) => seed(`2:${i * 3 + 2}`, [verse(`2:${i * 3 + 1}`), verse(`2:${i * 3 + 3}`)]));
  const read = vi.fn(async key => verse(key)), strong = seeds.at(-1)!;
  const legacy = await discoverAdjacentQuranCandidates(seeds, read, signal());
  expect(legacy.some(c => c.id === "Q2:60")).toBe(false);
  const prioritized = await discoverAdjacentQuranCandidates(seeds, read, signal(), undefined, [strong.id, ...seeds.slice(0, -1).map(c => c.id)]);
  expect(prioritized).toHaveLength(16);
  expect(prioritized.slice(0, 2).map(c => c.id)).toEqual(["Q2:58", "Q2:60"]);
  expect(prioritized.every(c => !Object.hasOwn(c, "requirementIds"))).toBe(true);
});

it("priority never enlarges the original pool limit or invents an identity", async () => {
  const strong = seed("2:183", [verse("2:182"), verse("2:184")]);
  const seeds = [...Array.from({ length: 118 }, (_, i) => seed(`3:${i + 1}`, [])), strong];
  const read = vi.fn(async key => verse(key));
  expect(await discoverAdjacentQuranCandidates(seeds, read, signal(), undefined, [strong.id])).toHaveLength(1);
  expect(read).toHaveBeenCalledOnce();
  await expect(discoverAdjacentQuranCandidates([strong], read, signal(), undefined, ["Q1:1"])).rejects.toThrow("discovery_priority_identity_invalid");
  expect(await discoverAdjacentQuranCandidates([strong], read, signal(), undefined, [])).toEqual([]);
});
