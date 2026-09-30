import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/sources/hadith", () => ({ searchHadithMulti: vi.fn(async () => []) }));
import { getSunnahHadith, parseSunnahHadith, searchSunnahMulti } from "@/lib/sources/sunnah";

const raw = (collection = "bukhari", number = "1", grade = "Sahih", title = "Faith") => ({
  collection, bookNumber: "1", chapterId: "1", hadithNumber: number,
  hadith: [
    { lang: "ar", body: "نص عربي تجريبي كامل لاختبار الرابط والرقم فقط", chapterTitle: title, grades: [{ grade, graded_by: "Test grader" }] },
    { lang: "en", body: "Made-up English hadith text used only for testing.", chapterTitle: title, grades: [{ grade, graded_by: "Test grader" }] },
  ],
});

afterEach(() => { vi.unstubAllGlobals(); delete process.env.SUNNAH_API_KEY; });

describe("Sunnah.com connector", () => {
  it("accepts Bukhari and Muslim only when they have a printed number and safe grade", () => {
    expect(parseSunnahHadith(raw("bukhari", "1"))?.numbers.bukhari).toBe(1);
    expect(parseSunnahHadith(raw("muslim", "2"))?.numbers.muslim).toBe(2);
  });
  it("rejects another collection, weak grades and missing numbers", () => {
    expect(parseSunnahHadith(raw("tirmidhi"))).toBeNull();
    expect(parseSunnahHadith(raw("bukhari", "1", "Daif"))).toBeNull();
    expect(parseSunnahHadith(raw("bukhari", "one"))).toBeNull();
  });
  it("rejects Muslim's introduction and Bukhari chapter headings", () => {
    expect(parseSunnahHadith(raw("muslim", "2", "Sahih", "Introduction"))).toBeNull();
    const heading = raw("bukhari"); heading.hadith[0].body = "باب تجريبي";
    expect(parseSunnahHadith(heading)).toBeNull();
  });
  it("returns nothing for API errors and timeouts without throwing", async () => {
    process.env.SUNNAH_API_KEY = "test-only";
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("timeout"); }));
    await expect(getSunnahHadith("bukhari", 1)).resolves.toBeNull();
    vi.stubGlobal("fetch", vi.fn(async () => new Response("no", { status: 500 })));
    await expect(getSunnahHadith("muslim", 1)).resolves.toBeNull();
  });
  it("does not call anything or put a key in a URL when no key exists", async () => {
    const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    await expect(searchSunnahMulti({ en: ["intention"] })).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("sends the key only in a request header", async () => {
    process.env.SUNNAH_API_KEY = "test-only";
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(raw()), { status: 200, headers: { "content-type": "application/json" } })); vi.stubGlobal("fetch", fetchMock);
    await getSunnahHadith("bukhari", 1);
    const [requestUrl, init] = fetchMock.mock.calls[0] as unknown as [string, { headers: Record<string, string> }];
    expect(String(requestUrl)).not.toContain("test-only");
    expect(init.headers["X-API-Key"]).toBe("test-only");
  });
});
