import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mock = vi.hoisted(() => ({ rpc: vi.fn(), rows: [] as Record<string, unknown>[], ids: [] as string[], reads: [] as string[] }));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({
  rpc: mock.rpc,
  from: (table: string) => {
    mock.reads.push(table);
    const chain = { select: () => chain, in: (_column: string, ids: string[]) => { mock.ids = ids; return chain; }, eq: () => chain,
      then: (resolve: (result: unknown) => void) => resolve({ data: mock.rows.filter((row) => mock.ids.includes(String(row.id))), error: null }) };
    return chain;
  },
}) }));
import { searchScholarQuotes } from "@/lib/sources/scholars";
const good = "11111111-1111-4111-a111-111111111111", competing = "22222222-2222-4222-a222-222222222222";
const phrases = ["حكم الإنفاق على الأقارب", "مقدار الصدقة للفقراء"];
const row = { id: good, kind: "fatwa", scholar_id: "ibn-baz", title: "الإنفاق والصدقة للفقراء", reference: "مرجع اختبار", text_original: "نص عربي أصلي للاختبار فقط", url: "https://binbaz.org.sa/fatwas/1/test", scholars: { name_ar: "ابن باز", name_en: "Ibn Baz", name_de: "Ibn Baz" } };
describe("bounded scholar library variants", () => {
  beforeEach(() => {
    mock.rpc.mockReset(); mock.ids = []; mock.reads = []; mock.rows = [row];
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.test"; process.env.SUPABASE_SECRET_KEY = "test-only";
    mock.rpc.mockResolvedValue({ data: [{ source_id: good }], error: null });
  });
  it("the old first-hit path can be stopped by a competing hadith row", async () => {
    mock.rpc.mockResolvedValueOnce({ data: [{ source_id: competing }], error: null });
    expect(await searchScholarQuotes(phrases)).toEqual([]);
    expect(mock.rpc).toHaveBeenCalledTimes(1);
  });
  it("searches remaining variants even after hits and filters wrong-kind results before the returned cap", async () => {
    mock.rpc.mockResolvedValueOnce({ data: [{ source_id: competing }], error: null });
    const onAudit = vi.fn();
    const result = await searchScholarQuotes(phrases, 1, { allVariants: true, onAudit });
    expect(result.map((quote) => quote.id)).toEqual([`S${good}`]);
    expect(mock.rpc.mock.calls.length).toBeGreaterThan(1);
    expect(mock.rpc.mock.calls.length).toBeLessThanOrEqual(4);
    for (const [, args] of mock.rpc.mock.calls) expect(args.match_count).toBe(50);
    expect(mock.reads).toEqual(["sources"]);
    expect(onAudit).toHaveBeenCalledWith(expect.objectContaining({ wrongKindOrUnavailable: 1, eligible: 1, returned: 1 }));
  });
  it("counts text, title, length and scholar authenticity losses without bypassing them", async () => {
    for (const [change, category] of [
      [{ text_original: "" }, "missingText"], [{ title: "صلاة الجماعة في المسجد" }, "titleOrTopic"],
      [{ text_original: "كلمة ".repeat(200) }, "length"], [{ scholar_id: "unknown" }, "authenticity"],
    ] as const) {
      mock.rows = [{ ...row, ...change }]; const onAudit = vi.fn();
      expect(await searchScholarQuotes(phrases, 1, { allVariants: true, onAudit })).toEqual([]);
      expect(onAudit).toHaveBeenCalledWith(expect.objectContaining({ [category]: 1, returned: 0 }));
    }
  });
  it("continues failing closed on RPC failure", async () => {
    mock.rpc.mockResolvedValue({ data: null, error: { message: "unavailable" } });
    await expect(searchScholarQuotes(phrases, 1, { allVariants: true })).rejects.toThrow("scholar search failed");
    expect(mock.reads).toEqual([]);
  });
});
