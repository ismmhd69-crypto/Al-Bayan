import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
beforeEach(() => { vi.resetModules(); delete (globalThis as any).__bayanHadithCatalogues; });
afterEach(() => vi.unstubAllGlobals());
function provider(failAll = false, failedLanguage?: string) {
  vi.stubGlobal("fetch", vi.fn(async (input: string) => {
    const url = new URL(String(input)), id = url.searchParams.get("id"), lang = url.searchParams.get("language");
    if (lang === failedLanguage) throw new Error("scripted catalogue connection failure");
    if (url.pathname.endsWith("/categories/roots/")) return Response.json([{ id: "1" }]);
    if (url.pathname.endsWith("/hadeeths/list/")) return Response.json({ data: ["5438", "9876", "7777"].map(id => ({ id, title: "حقوق الناس" })), meta: { last_page: 1 } });
    if (lang === "ar" && (failAll || id === "5438")) throw new Error("scripted Arabic detail connection failure");
    if (lang !== "ar") return Response.json({ id, hadeeth: "Invented display text" });
    return Response.json({ id, hadeeth: "نص اختباري مستقل ليس نقلا", grade: id === "7777" ? "ضعيف" : "صحيح", attribution: "رواه البخاري", reference: "صحيح البخاري (6/ 192) (2449)." });
  }));
}
it("keeps successful eligible originals when a sibling detail fails, reporting the partial failure", async () => {
  provider(); const { searchHadith } = await import("@/lib/sources/hadith"), failure = vi.fn();
  expect((await searchHadith(["حقوق الناس"], "ar", 6, failure)).map(h => h.id)).toEqual(["HE9876"]);
  expect(failure).toHaveBeenCalledOnce();
});
it("does not label a complete detail outage as an empty successful search", async () => {
  provider(true); const { searchHadith } = await import("@/lib/sources/hadith"), failure = vi.fn();
  await expect(searchHadith(["حقوق الناس"], "ar", 6, failure)).rejects.toThrow("connection failure");
  expect(failure).toHaveBeenCalled();
});
it("preserves another language's results after a catalogue outage and records it", async () => {
  provider(false, "de"); const { searchHadithMulti } = await import("@/lib/sources/hadith"), failure = vi.fn();
  expect((await searchHadithMulti({ ar: ["حقوق الناس"], de: ["حقوق الناس"] }, 4, failure)).map(h => h.id)).toEqual(["HE9876"]);
  expect(failure).toHaveBeenCalled();
});
