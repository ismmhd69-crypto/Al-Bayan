import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const database = vi.hoisted(() => ({ originals: [] as unknown[], idOriginals: undefined as unknown[] | undefined, pageOriginals: undefined as unknown[] | undefined,
  translations: [] as unknown[], error: false, calls: [] as string[], filters: [] as unknown[] }));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ from: (table: string) => {
  database.calls.push(table);
  let kind = "url";
  const query = { select: () => query, in: (column: string, values: unknown) => { kind = column; database.filters.push([table, "in", column, values]); return query; },
    like: (column: string, value: string) => { kind = "page"; database.filters.push([table, "like", column, value]); return query; },
    eq: () => query, limit: () => query,
    abortSignal: async () => ({ data: table !== "sources" ? database.translations : kind === "id" ? database.idOriginals ?? database.originals
      : kind === "page" ? database.pageOriginals ?? database.originals : database.originals, error: database.error ? new Error("offline") : null }) };
  return query;
} }) }));
import { lookupDisplayTranslations } from "@/lib/ask/display-translation-lookup";
import { toEvidence } from "@/lib/ask/core";
import { pack, scholarId } from "./fixtures/rich";
afterEach(() => { vi.unstubAllEnvs(); database.originals = []; database.idOriginals = undefined; database.pageOriginals = undefined;
  database.translations = []; database.calls = []; database.filters = []; database.error = false; });
const source = { id: scholarId, evidence: toEvidence(pack.passages[2].source, "en") };
const storedId = "33333333-3333-3333-3333-333333333333";
function configure() {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.test"); vi.stubEnv("SUPABASE_SECRET_KEY", "fake-unit-test-only");
  database.originals = [{ id: storedId, url: source.evidence.url, text_original: source.evidence.arabic, scholar_id: "ibn-baz" }];
  database.translations = [{ source_id: storedId, lang: "en", origin: "ai", text: "Invented translation fixture", published: true, version: 1 }];
}
describe("exact excerpt display lookup, never generation or approval", () => {
  it("can resolve a generated live source id by URL and exact original without pretending it is a database id", async () => {
    configure();
    expect((await lookupDisplayTranslations([source], "en", new AbortController().signal)).get(scholarId)).toMatchObject({
      status: "ready", origin: "ai", original: source.evidence.arabic, originalHash: createHash("sha256").update(source.evidence.arabic).digest("hex"),
    });
    expect(database.calls).toEqual(["sources", "source_translations"]);
  });
  it("resolves changed presentation slugs only through the same scholar, page identity and exact excerpt", async () => {
    configure();
    const rows = structuredClone(database.originals) as Record<string, unknown>[];
    rows[0].url = "https://binbaz.org.sa/fatwas/9/changed-presentation";
    database.originals = []; database.idOriginals = []; database.pageOriginals = rows;
    expect((await lookupDisplayTranslations([source], "en", new AbortController().signal)).get(scholarId)?.status).toBe("ready");
    expect(database.filters).toContainEqual(["sources", "like", "url", "https://binbaz.org.sa/fatwas/9/%"]);
    database.pageOriginals = [{ ...rows[0], scholar_id: "another-scholar" }];
    expect((await lookupDisplayTranslations([source], "en", new AbortController().signal)).get(scholarId)?.status).toBe("unavailable");
    database.pageOriginals = [{ ...rows[0], text_original: "Another excerpt from that page" }];
    expect((await lookupDisplayTranslations([source], "en", new AbortController().signal)).get(scholarId)?.status).toBe("unavailable");
  });
  it("does not let a coincident stored ID bypass page/excerpt identity", async () => {
    configure(); database.idOriginals = [{ ...(database.originals[0] as object), id: scholarId.slice(1), url: "https://binbaz.org.sa/fatwas/10/another-page" }];
    database.originals = []; database.pageOriginals = [];
    expect((await lookupDisplayTranslations([source], "en", new AbortController().signal)).get(scholarId)?.status).toBe("unavailable");
  });
  it("considers every exact original match rather than depending on database row order", async () => {
    configure();
    database.originals.unshift({ ...(database.originals[0] as object), id: "44444444-4444-4444-4444-444444444444" });
    expect((await lookupDisplayTranslations([source], "en", new AbortController().signal)).get(scholarId)?.status).toBe("ready");
  });
  it.each([
    { text: "" }, { version: -1 }, { origin: "human", reviewer: "", reviewed_at: null },
    { origin: "human", reviewer: "Reviewer", reviewed_at: "not a date" },
  ])("rejects defective published provenance/text instead of calling it absent %#", async invalid => {
    configure(); database.translations = [{ ...(database.translations[0] as object), ...invalid }];
    expect((await lookupDisplayTranslations([source], "en", new AbortController().signal)).get(scholarId)).toEqual({ status: "rejected" });
  });
  it("rejects conflicting same-version translations rather than selecting by row order", async () => {
    configure(); database.translations.push({ ...(database.translations[0] as object), text: "Conflicting wording" });
    expect((await lookupDisplayTranslations([source], "en", new AbortController().signal)).get(scholarId)).toEqual({ status: "rejected" });
  });
  it("does not select from a truncated source or translation batch", async () => {
    configure(); database.originals = Array.from({ length: 31 }, () => database.originals[0]);
    expect((await lookupDisplayTranslations([source], "en", new AbortController().signal)).get(scholarId)).toEqual({ status: "lookup_failed" });
    configure(); database.translations = Array.from({ length: 61 }, () => database.translations[0]);
    expect((await lookupDisplayTranslations([source], "en", new AbortController().signal)).get(scholarId)).toEqual({ status: "lookup_failed" });
  });
  it("will not attach a translation of another excerpt from the same page", async () => {
    configure(); database.originals = [{ id: storedId, url: source.evidence.url, text_original: "A different original excerpt" }];
    expect((await lookupDisplayTranslations([source], "en", new AbortController().signal)).get(scholarId)).toEqual({ status: "unavailable" });
    expect(database.calls.every(table => table === "sources")).toBe(true);
  });
  it("preserves actual human review metadata, preferring it to AI text", async () => {
    configure(); database.translations.push({ source_id: storedId, lang: "en", origin: "human", text: "Human test translation", published: true, version: 2, reviewer: "Test reviewer", reviewed_at: "2026-10-20T00:00:00Z" });
    expect((await lookupDisplayTranslations([source], "en", new AbortController().signal)).get(scholarId)).toMatchObject({ status: "ready", origin: "human", reviewer: "Test reviewer" });
  });
  it("does not attach unpublished or wrong-language text", async () => {
    configure(); database.translations = [{ source_id: storedId, lang: "en", origin: "ai", text: "Unpublished", published: false, version: 1 }, { source_id: storedId, lang: "de", origin: "ai", text: "Wrong language", published: true, version: 2 }];
    expect((await lookupDisplayTranslations([source], "en", new AbortController().signal)).get(scholarId)).toEqual({ status: "unavailable" });
  });
  it("distinguishes a failed read from unavailable translation", async () => {
    configure(); database.error = true;
    expect((await lookupDisplayTranslations([source], "en", new AbortController().signal)).get(scholarId)).toEqual({ status: "lookup_failed" });
  });
  it("does not perform translation reads for Arabic", async () => {
    configure(); expect((await lookupDisplayTranslations([source], "ar", new AbortController().signal)).size).toBe(0); expect(database.calls).toEqual([]);
  });
});

describe("stored Sunnah.com hadith display translations", () => {
  const hadithUuid = "55555555-5555-5555-5555-555555555555";
  const hadith = { id: `SH${hadithUuid}`, evidence: { kind: "hadith", key: `SH${hadithUuid}`, collection: "muslim", numbers: { bukhari: null, muslim: 705 },
    gradeAr: "صحيح", attributionAr: "رواه مسلم", arabic: "نص حديث تجريبي مخترع للاختبار فقط", translation: null, translationLanguage: null, url: "https://sunnah.com/muslim:705a" } } as never;
  function configureHadith() {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.test"); vi.stubEnv("SUPABASE_SECRET_KEY", "fake-unit-test-only");
    database.originals = [{ id: hadithUuid, url: "https://sunnah.com/muslim:705a", text_original: "نص حديث تجريبي مخترع للاختبار فقط" }];
    database.translations = [{ source_id: hadithUuid, lang: "en", origin: "ai", text: "Invented hadith translation fixture", published: true, version: 1 }];
  }
  it("attaches the published translation of the exact stored original", async () => {
    configureHadith();
    expect((await lookupDisplayTranslations([hadith], "en", new AbortController().signal)).get(`SH${hadithUuid}`)).toMatchObject({ status: "ready", origin: "ai", text: "Invented hadith translation fixture" });
    expect(database.filters).toContainEqual(["sources", "in", "id", [hadithUuid]]);
  });
  it("refuses a translation when the stored text or link no longer matches", async () => {
    configureHadith(); database.originals = [{ id: hadithUuid, url: "https://sunnah.com/muslim:705a", text_original: "نص آخر" }];
    expect((await lookupDisplayTranslations([hadith], "en", new AbortController().signal)).get(`SH${hadithUuid}`)).toEqual({ status: "unavailable" });
    configureHadith(); database.originals = [{ id: hadithUuid, url: "https://sunnah.com/muslim:706", text_original: "نص حديث تجريبي مخترع للاختبار فقط" }];
    expect((await lookupDisplayTranslations([hadith], "en", new AbortController().signal)).get(`SH${hadithUuid}`)).toEqual({ status: "unavailable" });
  });
  it("does not show unpublished hadith translations", async () => {
    configureHadith(); (database.translations[0] as { published: boolean }).published = false;
    expect((await lookupDisplayTranslations([hadith], "en", new AbortController().signal)).get(`SH${hadithUuid}`)).toEqual({ status: "unavailable" });
  });
});
