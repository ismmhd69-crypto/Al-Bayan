// Tests for choosing search phrases and titles in the live scholar search. No network.
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { bestTitles, livePhrases } = await import("@/lib/sources/scholars-live");

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
