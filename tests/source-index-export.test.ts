import { describe, expect, it, vi } from "vitest";
import { coherentRanges, storedSourceFingerprint, storedSourcePassages, type StoredSearchSource } from "@/lib/ask/search-engine/source-passages";
import { evidenceContextProblem, passageProblem, textHash } from "@/lib/ask/search-engine/contract";
import { readBayanIndexSources, revalidateBayanIndexSources } from "../scripts/bayan-source-index-reader";

const now = new Date("2026-10-20T10:00:00Z");
const source: StoredSearchSource = { id: "00000000-0000-0000-0000-000000000001", kind: "hadith", language: "ar", title: "مثال مخترع للاختبار", reference: "Fixture 1", text_original: "هذا نص مخترع للاختبار. وهذا شرط تجريبي يحفظ كما هو.", url: "https://example.org/fixture", scholar_id: null,
  grade: "sahih", grader: "fixture-only", collection: "fixture", numbering: "fixture", rights_id: "fixture-rights", rights_status: "granted", search_index_allowed: true, ai_processing_allowed: true, max_quote_chars: 600, expires_at: null, published: true, approved_search_document: true };

describe("coherent native-source export", () => {
  it("preserves every character and records exact offsets with full parent context", () => {
    const text = `${"أ".repeat(110)}.  ${"ب".repeat(110)}؟\n\n${"ج".repeat(130)}`;
    const parts = coherentRanges(text, 160);
    expect(parts.map(p => text.slice(p.start, p.end)).join("")).toBe(text);
    const result = storedSourcePassages({ ...source, text_original: text }, now, 160);
    expect(result.passages.length).toBeGreaterThan(1);
    for (const p of result.passages) {
      expect(p.original).toBe(text.slice(p.span.start, p.span.end));
      expect(p.context.before + p.original + p.context.after).toBe(text);
      expect(p.parentOriginalHash).toBe(textHash(text));
      expect(passageProblem(p, now, false)).toBeNull();
    }
  });
  it("does not invent context or embedding rights for a stored scholarly excerpt", () => {
    const result = storedSourcePassages({ ...source, kind: "fatwa", scholar_id: "fixture", rights_status: "short_quotes_only" }, now);
    expect(result.passages).toHaveLength(1);
    expect(result.passages[0].verificationBasis).toBe("stored_source_bytes");
    expect(evidenceContextProblem(result.passages[0])).toBe("context_incomplete");
    expect(passageProblem(result.passages[0], now, true)).toBe("embedding_permission_missing");
  });
  it("keeps an oversized sentence whole rather than silently cutting its condition", () => {
    const text = "نص ".repeat(100);
    expect(coherentRanges(text, 100)).toEqual([{ start: 0, end: text.length }]);
  });
  it.each(["unpublished", "unapproved_index", "over_quote_limit", "ungraded"])("refuses %s content", mode => {
    const changed = structuredClone(source);
    if (mode === "unpublished") changed.published = false;
    if (mode === "unapproved_index") changed.approved_search_document = false;
    if (mode === "over_quote_limit") { changed.rights_status = "short_quotes_only"; changed.max_quote_chars = 5; }
    if (mode === "ungraded") changed.grade = null;
    expect(storedSourcePassages(changed, now).passages).toHaveLength(0);
  });
  it("queries one family and applies rights and publication filters before LIMIT", async () => {
    const request = vi.fn<typeof fetch>(async () => new Response(JSON.stringify([source]), { status: 201 }));
    expect(await readBayanIndexSources("fixture-token", "hadith", 20, null, undefined, request)).toEqual([source]);
    const call = request.mock.calls[0], body = JSON.parse(call[1]!.body as string);
    expect(String(call[0])).toMatch(/\/jnietkyxgnocyizvjiel\/database\/query\/read-only$/);
    expect(body.parameters).toEqual([null, 20, "hadith"]);
    expect(body.query.indexOf("s.kind=$3::text")).toBeLessThan(body.query.indexOf("limit $2"));
    expect(body.query).toContain("s.published"); expect(body.query).toContain("r.search_index_allowed");
  });
  it("rejects invalid cursor IDs before performing a network request", async () => {
    const request = vi.fn<typeof fetch>();
    await expect(readBayanIndexSources("fixture", "hadith", 20, "'; select 1", undefined, request)).rejects.toThrow("invalid_source_index_page");
    expect(request).not.toHaveBeenCalled();
  });
  it("revalidates source bytes by database SHA-256 without downloading the original", async () => {
    const request = vi.fn<typeof fetch>(async () => new Response(JSON.stringify([{ id: source.id, rights_id: source.rights_id, expires_at: null, parent_hash: textHash(source.text_original), source_fingerprint: storedSourceFingerprint(source) }]), { status: 201 }));
    const result = await revalidateBayanIndexSources("fixture", [source.id], undefined, request);
    expect(result.get(source.id)).toMatchObject({ parentOriginalHash: textHash(source.text_original), permissions: { embeddings: false } });
    const body = JSON.parse(request.mock.calls[0][1]!.body as string);
    expect(body.query).toContain("pg_catalog.sha256"); expect(body.parameters).toEqual([JSON.stringify([source.id])]);
  });
});
