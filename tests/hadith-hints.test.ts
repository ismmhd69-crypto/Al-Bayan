import { expect, it, vi } from "vitest";
import { resolveHadithHints, resolveLibraryHadithHint } from "@/lib/ask/hadith-hints";
import type { Hadith } from "@/lib/sources/hadith-rules";

const hint: Hadith = { id: "HE123", collection: "agreed", numbers: { bukhari: 10, muslim: 20 }, attributionAr: "متفق عليه", gradeAr: "صحيح",
  arabic: "نص مخترع للاختبار لا يمثل حديثا حقيقيا", translations: { en: null, de: null }, url: "https://hadeethenc.com/en/browse/hadith/123" };
const stored = (collection: "bukhari" | "muslim", number: number): Hadith => ({ ...hint, id: `SH${collection === "bukhari" ? "11111111" : "22222222"}-2222-4333-8444-555555555555`,
  collection, numbers: { bukhari: collection === "bukhari" ? number : null, muslim: collection === "muslim" ? number : null }, attributionAr: collection === "bukhari" ? "رواه البخاري" : "رواه مسلم",
  arabic: "أصل مخترع مستقل للاختبار لا يمثل حديثا حقيقيا", url: `https://sunnah.com/${collection}:${number}` });
const signal = () => new AbortController().signal;

it("resolves verified book references into independent stored identities and originals", async () => {
  const lookup = vi.fn(async () => hint), find = vi.fn(async (collection: "bukhari" | "muslim", number: number) => [stored(collection, number)]);
  const result = await resolveLibraryHadithHint("HE123", lookup, find, signal());
  expect(lookup).toHaveBeenCalledWith("123"); expect(find.mock.calls).toEqual([["bukhari", 10, expect.any(AbortSignal)], ["muslim", 20, expect.any(AbortSignal)]]);
  expect(result.map(h => h.id.slice(0, 2))).toEqual(["SH", "SH"]); expect(result.every(h => h.arabic !== hint.arabic)).toBe(true);
});
it("never substitutes HadeethEnc wording, wrong references or a mismatched hint identity", async () => {
  expect(await resolveLibraryHadithHint("HE123", async () => hint, async () => [hint, stored("bukhari", 11)], signal())).toEqual([]);
  const find = vi.fn(async () => []);
  expect(await resolveLibraryHadithHint("HE123", async () => ({ ...hint, id: "HE124" }), find)).toEqual([]); expect(find).not.toHaveBeenCalled();
  expect(await resolveLibraryHadithHint("SH123", async () => hint, find)).toEqual([]);
});
it("keeps optional hint failure separate from valid search results and bounds unique hints", async () => {
  const resolveHadithHint = vi.fn(async (id: string) => { if (id === "HE2") throw Error("unavailable"); return [stored("bukhari", 10)]; });
  const getHadith = vi.fn(async () => hint);
  expect((await resolveHadithHints({ resolveHadithHint, getHadith }, ["HE1", "HE1", "HE2", "HE3", "HE4"], signal()))).toHaveLength(1);
  expect(resolveHadithHint).toHaveBeenCalledTimes(3); expect(getHadith).not.toHaveBeenCalled();
});
it("preserves legacy hint lookups and Stop", async () => {
  const getHadith = vi.fn(async () => hint);
  expect(await resolveHadithHints({ getHadith }, ["HE123"], signal())).toEqual([hint]); expect(getHadith).toHaveBeenCalledWith("123");
  const controller = new AbortController(); controller.abort();
  await expect(resolveHadithHints({ getHadith }, ["HE123"], controller.signal)).rejects.toThrow();
});
