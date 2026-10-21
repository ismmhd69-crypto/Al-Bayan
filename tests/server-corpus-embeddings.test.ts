import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { PrivateSearchIndexStore, buildSearchIndex } from "@/lib/ask/search-engine/index-store";
import { storedSourcePassages, type StoredSearchSource } from "@/lib/ask/search-engine/source-passages";
import { localTEIEmbeddings, type LocalEmbeddingConfig } from "@/lib/ask/search-engine/local-embeddings";
import { localCorpusRetriever } from "@/lib/ask/search-engine/server-corpus";
import type { QuestionFrame } from "@/lib/ask/retrieval";
vi.mock("server-only", () => ({}));
const state = vi.hoisted(() => ({ rows: new Map<string, any>() }));
vi.mock("@/lib/sources/index-source-state", () => ({ currentIndexSourceStates: async () => state.rows }));
vi.mock("@/lib/sources/quran", () => ({ getVerse: async () => undefined }));
const root = resolve("work/private-ask-evaluation"), directories: string[] = [];
afterEach(async () => {
  vi.unstubAllEnvs(); vi.unstubAllGlobals();
  for (const dir of directories.splice(0)) {
    const rel = relative(root, resolve(dir));
    if (!/^tei-fixture-[A-Za-z0-9]+$/.test(rel)) throw new Error("unsafe_fixture_cleanup");
    await rm(dir, { recursive: true, force: true });
  }
});
describe("local meaning adapter connected to actual corpus retrieval", () => {
  it("loads a revalidated vector generation and returns its complete hadith parent", async () => {
    const cfg: LocalEmbeddingConfig = { endpoint: "http://127.0.0.1:8080", model: "fixture/model", revision: "a".repeat(40), dimensions: 2, queryPrefix: "query: ", passagePrefix: "passage: ",
      pooling: "mean", dtype: "float32", serverVersion: "1.9.0", serverSha: "b".repeat(40), deploymentRecipe: "c".repeat(64) };
    const source: StoredSearchSource = { id: "00000000-0000-0000-0000-000000000001", kind: "hadith", language: "ar", title: "عنوان تجريبي", reference: "Sahih al-Bukhari, hadith 1, book 1",
      text_original: "نص عربي مخترع للاختبار فقط وليس حديثاً حقيقياً.", url: "https://sunnah.com/bukhari:1", scholar_id: null, grade: "sahih", grader: "fixture", collection: "Sahih al-Bukhari", numbering: "fixture",
      rights_id: "invented-only", rights_status: "granted", search_index_allowed: true, ai_processing_allowed: true, max_quote_chars: null, expires_at: null, published: true, approved_search_document: true };
    const rows = storedSourcePassages(source).passages;
    // Explicitly invented capability receipt, never a change to real rights metadata.
    rows.forEach(p => { p.permissions.embeddings = true; });
    state.rows = new Map(rows.map(p => [p.sourceId, { permissions: p.permissions, parentOriginalHash: p.parentOriginalHash, sourceFingerprint: p.sourceFingerprint }]));
    const fetch = vi.fn(async (url: string, init: RequestInit) => new Response(JSON.stringify(url.endsWith("/info") ? {
      model_id: cfg.model, model_sha: cfg.revision, model_dtype: cfg.dtype, version: cfg.serverVersion, sha: cfg.serverSha,
      auto_truncate: false, model_type: { embedding: { pooling: cfg.pooling } }, max_input_length: 512, max_client_batch_size: 16,
    } : JSON.parse(init.body as string).inputs.map(() => [1, 0])), { headers: { "Content-Type": "application/json" } }));
    const embedded = await buildSearchIndex(rows, localTEIEmbeddings(cfg, fetch), "tei-fixture", new AbortController().signal);
    await mkdir(root, { recursive: true }); const dir = await mkdtemp(resolve(root, "tei-fixture-")); directories.push(dir);
    await new PrivateSearchIndexStore(dir).publish(embedded.index, new Date(Date.now() + 60_000));
    vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("VERCEL", ""); vi.stubEnv("ASK_CORPUS_INDEX_DIR", dir);
    vi.stubEnv("ASK_LOCAL_EMBEDDINGS", "true"); vi.stubEnv("ASK_LOCAL_EMBEDDING_CONFIG", JSON.stringify(cfg)); vi.stubEnv("ASK_CORPUS_LEXICAL_PREVIEW", "false");
    vi.stubGlobal("fetch", fetch);
    const frame: QuestionFrame = { language: "de", kind: "question", questionType: "general", subjects: ["fixture"], searchQueries: {}, qualifiers: [], requiredFacets: ["general"], requirements: [{ id: "R1", text: "Eine anders formulierte Frage", facet: "general" }] };
    fetch.mockClear();
    const result = await localCorpusRetriever(["hadith"])(frame, new AbortController().signal);
    expect(result).toHaveLength(1);
    expect(result[0].source.kind === "hadith" && result[0].source.hadith.arabic).toBe(source.text_original);
    expect(result[0].retrievedFor).toEqual(["R1"]);
    expect(fetch.mock.calls.filter(([, init]) => init.method === "POST")).toHaveLength(1);
    // Revoked eligibility prevents even a query-embedding request when no eligible vectors remain.
    state.rows.clear(); fetch.mockClear();
    await expect(localCorpusRetriever(["hadith"])(frame, new AbortController().signal)).rejects.toThrow("corpus_semantic_provider_not_ready");
    expect(fetch).not.toHaveBeenCalled();
  });
});
