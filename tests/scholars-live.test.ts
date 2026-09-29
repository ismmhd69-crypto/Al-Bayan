// Tests for choosing search phrases and titles in the live scholar search. No network.
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { bestTitles, getMappedScholarQuote, livePhrases } = await import("@/lib/sources/scholars-live");

describe("mapped official fatwas", () => {
  it("rejects arbitrary and non-fatwa URLs without fetching", async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    expect(await getMappedScholarQuote("https://example.com/fatwas/1/test")).toBeNull();
    expect(await getMappedScholarQuote("https://binbaz.org.sa/other/1/test")).toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
  it("parses a mapped page as a candidate attributed to Ibn Baz", async () => {
    const body = '<article class="fatwa"><h1>شروط التوبة</h1><p>ج: التوبة لها شروط، منها الندم على الذنب والإقلاع عنه، والعزم على عدم العودة إليه. ويجب أن تكون التوبة صادقة خالصة لله تعالى، وأن يترك الإنسان الذنب في الحال ويعزم على ألا يرجع إليه.</p></article>';
    const fetcher = vi.fn(async () => new Response(body, { status: 200 }));
    vi.stubGlobal("fetch", fetcher);
    const quote = await getMappedScholarQuote("https://binbaz.org.sa/fatwas/999999/شروط-التوبة");
    expect(quote?.scholarId).toBe("ibn-baz");
    expect(quote?.arabic).toContain("الإقلاع");
    expect(fetcher).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });
  it("retries a mapped page after a transient failed fetch", async () => {
    const body = '<article class="fatwa"><h1>شروط التوبة</h1><p>ج: التوبة لها شروط، منها الندم على الذنب والإقلاع عنه، والعزم على عدم العودة إليه. ويجب أن تكون التوبة صادقة خالصة لله تعالى، وأن يترك الإنسان الذنب في الحال ويعزم على ألا يرجع إليه.</p></article>';
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response("", { status: 503 }))
      .mockResolvedValueOnce(new Response(body, { status: 200 }));
    vi.stubGlobal("fetch", fetcher);
    const url = "https://binbaz.org.sa/fatwas/999998/شروط-التوبة";
    expect(await getMappedScholarQuote(url)).toBeNull();
    expect(await getMappedScholarQuote(url)).not.toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(2);
    vi.unstubAllGlobals();
  });
});

describe("livePhrases", () => {
  it("tries full phrases first, then shorter ones, never a single word, at most 4 searches", () => {
    const out = livePhrases(["حكم صلاة الجماعة في المسجد", "وجوب صلاة الجماعة على الرجال"]);
    expect(out[0]).toBe("صلاة الجماعة المسجد");
    expect(out).toContain("وجوب صلاة الجماعة");
    expect(out.length).toBeLessThanOrEqual(4);
    for (const q of out) expect(q.split(" ").length).toBeGreaterThanOrEqual(2);
  });
  it("returns nothing without usable words", () => {
    expect(livePhrases(["ما حكم", "?"])).toEqual([]);
  });
});

describe("bestTitles", () => {
  const hits = ["الأذكار بعد الصلاة", "حكم صلاة الجماعة إذا لم يكن هناك مسجد", "حكم زيارة القبور", "وجوب صلاة الجماعة على المسافر"];
  it("keeps the titles sharing the most words with the question, at least two", () => {
    expect(bestTitles(hits, (h) => h, ["حكم صلاة الجماعة في المسجد"], 2)).toEqual([
      "حكم صلاة الجماعة إذا لم يكن هناك مسجد",
      "وجوب صلاة الجماعة على المسافر",
    ]);
  });
  it("drops titles that share fewer than two words", () => {
    expect(bestTitles(hits, (h) => h, ["زيارة المريض"], 2)).toEqual([]);
  });
});
