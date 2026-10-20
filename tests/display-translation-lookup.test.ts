import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const database = vi.hoisted(() => ({ originals: [] as unknown[], translations: [] as unknown[], error: false, calls: [] as string[] }));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ from: (table: string) => {
  database.calls.push(table);
  const query = { select: () => query, in: () => query, eq: () => query, limit: () => query,
    abortSignal: async () => ({ data: table === "sources" ? database.originals : database.translations, error: database.error ? new Error("offline") : null }) };
  return query;
} }) }));
import { lookupDisplayTranslations } from "@/lib/ask/display-translation-lookup";
import { toEvidence } from "@/lib/ask/core";
import { pack, scholarId } from "./fixtures/rich";
afterEach(() => { vi.unstubAllEnvs(); database.originals = []; database.translations = []; database.calls = []; database.error = false; });
const source = { id: scholarId, evidence: toEvidence(pack.passages[2].source, "en") };
const storedId = "33333333-3333-3333-3333-333333333333";
function configure() {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.test"); vi.stubEnv("SUPABASE_SECRET_KEY", "fake-unit-test-only");
  database.originals = [{ id: storedId, url: source.evidence.url, text_original: source.evidence.arabic }];
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
  it("will not attach a translation of another excerpt from the same page", async () => {
    configure(); database.originals = [{ id: storedId, url: source.evidence.url, text_original: "A different original excerpt" }];
    expect((await lookupDisplayTranslations([source], "en", new AbortController().signal)).get(scholarId)).toEqual({ status: "unavailable" });
    expect(database.calls).toEqual(["sources"]);
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
