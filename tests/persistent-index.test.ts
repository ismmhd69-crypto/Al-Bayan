// Invented fixtures prove transport/source boundaries, not religious accuracy.
import { describe, expect, it, vi } from "vitest";
import { persistentSearchIndex, type IndexRpc } from "@/lib/ask/search-engine/persistent-index";
import { retrieveFromPersistentCorpus, persistentCorpusCandidates } from "@/lib/ask/search-engine/persistent-corpus";
import { storedSourcePassages, type StoredSearchSource } from "@/lib/ask/search-engine/source-passages";
import type { QuestionFrame } from "@/lib/ask/retrieval";
import type { SearchIndex } from "@/lib/ask/search-engine/contract";
import { SOURCE_LOOKUP_REVISION } from "@/lib/ask/search-engine/hybrid";

const signal = new AbortController().signal;
const space = { model: "invented", revision: "fixture", dimensions: 2, recipe: "a".repeat(64) };
const source: StoredSearchSource = { id: "00000000-0000-0000-0000-000000000001", kind: "hadith", language: "ar", title: "عنوان تجريبي", reference: "Sahih al-Bukhari, hadith 1, book 1", text_original: "عن شخص تجريبي قال رسول الله في مثال مخترع للاختبار لا يمثل نص حديث حقيقي. ".repeat(6),
  url: "https://sunnah.com/bukhari:1", scholar_id: null, grade: "sahih", grader: "fixture", collection: "Sahih al-Bukhari", numbering: "fixture", rights_id: "fixture-rights", rights_status: "granted", search_index_allowed: true, ai_processing_allowed: true, max_quote_chars: null, expires_at: null, published: true, approved_search_document: true };
const passages = storedSourcePassages(source, new Date(), 100).passages;
const index: SearchIndex = { version: 1, generation: "fixture", space, passages };
const manifest = { status: "ready", generation: "fixture", space, lookup_revision: SOURCE_LOOKUP_REVISION, expires_at: new Date(Date.now() + 3600000).toISOString(), semantic_eligible: 1 };
const concern = { id: "R1", text: "Explain the concern", phrases: ["invented"], exactReferences: [], vector: { space, values: [1, 0] } };
const frame: QuestionFrame = { language: "en", kind: "question", questionType: "general", subjects: ["fixture"], requiredFacets: ["general"],
  requirements: [{ id: "R1", text: "Explain the concern", facet: "general", searchQueries: { ar: ["مثال"] } }, { id: "R2", text: "Explain a different concern", facet: "general", searchQueries: { de: ["Beispiel"] } }], qualifiers: [], searchQueries: {} };
function fake(overrides: { hit?: Record<string, unknown>; semantic?: number; manifest?: Record<string, unknown> } = {}) {
  return vi.fn<IndexRpc>(async (op, body) => {
    if (op === "manifest") return { ...manifest, ...(overrides.semantic !== undefined ? { semantic_eligible: overrides.semantic } : {}), ...overrides.manifest };
    if (op === "search") return { status: "ready", generation: "fixture", space, lookup_revision: SOURCE_LOOKUP_REVISION, eligible: 1, semantic_eligible: overrides.semantic ?? 1,
      hits: body.family === "scholar" ? [] : [{ passage: passages[0], score: 1 / 61, ranks: { lexical: 1 }, ...overrides.hit }] };
    if (op === "begin") return { status: "building" };
    if (op === "append") return { status: "appended", count: (body.passages as unknown[]).length };
    return { status: "ready" };
  });
}
describe("persistent index boundary", () => {
  it("uploads only complete validated generations and publishes last", async () => {
    const rpc = fake(); await persistentSearchIndex(rpc).publish(index, new Date(manifest.expires_at), signal);
    expect(rpc.mock.calls.map(c => c[0])).toEqual(["begin", "append", "publish"]);
    const staged = (rpc.mock.calls[1][1].passages as Record<string, unknown>[])[0];
    expect(staged.original).toBe(passages[0].original); expect(staged.lexicalText).toBeTypeOf("string");
  });
  it("never publishes after an interrupted upload or retries a mutation", async () => {
    const rpc = fake().mockImplementationOnce(async () => ({ status: "building" })).mockRejectedValueOnce(new Error("lost response"));
    await expect(persistentSearchIndex(rpc).publish(index, new Date(manifest.expires_at), signal)).rejects.toThrow("lost response");
    expect(rpc.mock.calls.map(c => c[0])).toEqual(["begin", "append"]);
  });
  it("rejects altered originals before creating storage", async () => {
    const rpc = fake(); const changed = structuredClone(index); changed.passages[0].original += "tampered";
    await expect(persistentSearchIndex(rpc).publish(changed, new Date(manifest.expires_at), signal)).rejects.toThrow("ineligible_generation");
    expect(rpc).not.toHaveBeenCalled();
  });
  it("rejects recipe changes before embedding queries", async () => {
    const embedQueries = vi.fn();
    await expect(retrieveFromPersistentCorpus(frame, fake(), { signal, embedder: { space: { ...space, recipe: "b".repeat(64) }, embedQueries } })).rejects.toThrow("query_vector_mismatch");
    expect(embedQueries).not.toHaveBeenCalled();
  });
  it("skips query embedding when no currently eligible stored vectors remain", async () => {
    const embedQueries = vi.fn();
    const result = await retrieveFromPersistentCorpus(frame, fake({ semantic: 0 }), { signal, embedder: { space, embedQueries } });
    expect(embedQueries).not.toHaveBeenCalled(); expect(result.semantic).toBe("no_indexed_vectors");
  });
  it("queries each concern/family and reconstructs the complete parent once", async () => {
    const rpc = fake(), embedQueries = vi.fn(async () => [[1, 0], [0, 1]]);
    const result = await persistentCorpusCandidates(frame, rpc, { signal, embedder: { space, embedQueries } });
    expect(embedQueries).toHaveBeenCalledTimes(1); expect(rpc.mock.calls.filter(c => c[0] === "search")).toHaveLength(4);
    expect(result).toHaveLength(1); expect(result[0].retrievedFor).toEqual(["R1", "R2"]);
    if (result[0].source.kind !== "hadith") throw new Error("fixture");
    expect(result[0].source.hadith.arabic).toBe(source.text_original);
  });
  it("does not treat lexical-only retrieval as semantic-ready", async () => {
    await expect(persistentCorpusCandidates(frame, fake({ semantic: 0 }), { signal })).rejects.toThrow("corpus_semantic_provider_not_ready");
  });
  it.each([
    { score: 1 }, { ranks: { invented: 1 } }, { ranks: { lexical: 99 } }, { passage: { ...passages[0], original: "tampered" } },
  ])("rejects malformed or unsupported discovery hits: %j", async hit => {
    const store = persistentSearchIndex(fake({ hit }));
    await expect(store.search(await store.manifest(signal), concern, "hadith", signal)).rejects.toThrow(/persistent_index_invalid/);
  });
  it("cancels waiting even if an injected transport ignores the signal", async () => {
    const controller = new AbortController();
    const store = persistentSearchIndex(async () => new Promise(() => {}));
    const pending = store.manifest(controller.signal); controller.abort();
    await expect(pending).rejects.toThrow(/abort/i);
  });
  it("rejects an expired generation before search", async () => {
    const store = persistentSearchIndex(fake({ manifest: { expires_at: new Date(0).toISOString() } }));
    await expect(store.manifest(signal)).rejects.toThrow("not_ready");
  });
  it("refuses stored lexical documents from a different lookup revision",async()=>{
    const store=persistentSearchIndex(fake({manifest:{lookup_revision:"old-unmasked-metadata"}}));
    await expect(store.manifest(signal)).rejects.toThrow("lookup_revision_mismatch");
  });
});
