// Invented storage responses and vectors prove wiring, not semantic accuracy or acceptance.
import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import type { QueryEmbedder } from "@/lib/ask/search-engine/corpus-retrieval";
const mocks = vi.hoisted(() => ({ local: vi.fn(async () => []), rpc: vi.fn(), construct: vi.fn(), embedding: vi.fn<() => QueryEmbedder | undefined>(() => undefined) }));
vi.mock("@/lib/ask/search-engine/server-corpus", () => ({ localCorpusRetriever: () => mocks.local }));
vi.mock("@/lib/ask/search-engine/server-persistent-index", () => ({ serverPersistentIndexRpc: mocks.construct }));
vi.mock("@/lib/ask/search-engine/local-embeddings", () => ({ configuredLocalEmbeddings: mocks.embedding }));
import { serverCorpusRetriever } from "@/lib/ask/search-engine/server-corpus-router";
import { storedSourcePassages, type StoredSearchSource } from "@/lib/ask/search-engine/source-passages";
import { researchEngineRevision } from "@/lib/ask/search-engine/job-policy";
import { SOURCE_LOOKUP_REVISION } from "@/lib/ask/search-engine/hybrid";
import type { QuestionFrame } from "@/lib/ask/retrieval";

const space = { model: "invented-offline", revision: "fixture", dimensions: 2, recipe: "a".repeat(64) };
const source: StoredSearchSource = { id: "00000000-0000-0000-0000-000000000081", kind: "hadith", language: "ar", title: "عنوان غير مطابق", reference: "Sahih al-Bukhari, hadith 1, book 1",
  text_original: "عن شخص تجريبي قال رسول الله في مثال مخترع للاختبار لا يمثل نص حديث حقيقي. ".repeat(3), url: "https://sunnah.com/bukhari:1", scholar_id: null, grade: "sahih", grader: "invented", collection: "Sahih al-Bukhari", numbering: "fixture",
  rights_id: "invented", rights_status: "granted", search_index_allowed: true, ai_processing_allowed: true, max_quote_chars: null, expires_at: null, published: true, approved_search_document: true };
const passage = storedSourcePassages(source).passages[0];
const frame: QuestionFrame = { language: "de", kind: "question", questionType: "general", subjects: ["fixture"], requirements: [{ id: "R1", text: "Explain an unfamiliar concern", facet: "general", searchQueries: { ar: ["نص تجريبي"] } }], requiredFacets: ["general"], qualifiers: [], searchQueries: {} };
const signal = new AbortController().signal;
function configure(semantic = false) {
  vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("VERCEL", "");
  vi.stubEnv("ASK_CORPUS_BACKEND", "persistent"); vi.stubEnv("ASK_PERSISTENT_INDEX_ACCEPTED", "true");
  vi.stubEnv("ASK_CORPUS_LEXICAL_PREVIEW", String(!semantic));
  mocks.construct.mockReturnValue(mocks.rpc);
  mocks.rpc.mockImplementation(async (op, body) => op === "manifest" ? { status: "ready", generation: "fixture", space,
    expires_at: new Date(Date.now() + 3600000).toISOString(), semantic_eligible: semantic ? 1 : 0, lookup_revision: SOURCE_LOOKUP_REVISION }
    : { status: "ready", generation: "fixture", space, lookup_revision: SOURCE_LOOKUP_REVISION, eligible: 1, semantic_eligible: semantic ? 1 : 0,
      hits: body.family === "hadith" ? [{ passage, score: 1 / 61, ranks: semantic ? { semantic: 1 } : { lexical: 1 } }] : [] });
}
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); mocks.embedding.mockReturnValue(undefined); });

describe("configured original-passage discovery backend", () => {
  it("does not construct a database client on import or constructor, and defaults to the existing local path", async () => {
    vi.stubEnv("ASK_CORPUS_BACKEND", "local");
    const retrieve = serverCorpusRetriever(["hadith"]);
    expect(mocks.construct).not.toHaveBeenCalled();
    await retrieve(frame, signal);
    expect(mocks.local).toHaveBeenCalled(); expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("refuses persistent discovery without acceptance and never silently falls back", async () => {
    vi.stubEnv("ASK_CORPUS_BACKEND", "persistent"); vi.stubEnv("ASK_PERSISTENT_INDEX_ACCEPTED", "false");
    await expect(serverCorpusRetriever(["hadith"])(frame, signal)).rejects.toThrow("acceptance_required");
    expect(mocks.construct).not.toHaveBeenCalled(); expect(mocks.local).not.toHaveBeenCalled();
  });
  it("routes only requested, enabled families through read operations and restores complete original text", async () => {
    configure();
    const result = await serverCorpusRetriever(["hadith", "scholar"])(frame, signal, ["hadith"]);
    expect(mocks.rpc.mock.calls.map(c => c[0])).toEqual(["manifest", "search"]);
    expect(mocks.rpc.mock.calls[1][1].family).toBe("hadith");
    expect(result).toHaveLength(1);
    expect(result[0].source.kind === "hadith" && result[0].source.hadith.arabic).toBe(source.text_original);
    expect(result[0].retrievedFor).toEqual(["R1"]);
  });
  it("connects the configured meaning query batch with the pinned vector recipe", async () => {
    configure(true);
    const embedQueries = vi.fn(async () => [[1, 0]]); mocks.embedding.mockReturnValue({ space, embedQueries });
    const result = await serverCorpusRetriever(["hadith"])(frame, signal);
    expect(embedQueries).toHaveBeenCalledWith([frame.requirements[0].text], signal);
    expect(mocks.rpc.mock.calls[1][1].vector).toEqual([1, 0]);
    expect(result).toHaveLength(1); expect(mocks.local).not.toHaveBeenCalled();
  });
  it("does not permit a lexical preview switch to masquerade as production meaning search", async () => {
    configure(); vi.stubEnv("NODE_ENV", "production");
    await expect(serverCorpusRetriever(["hadith"])(frame, signal)).rejects.toThrow("corpus_semantic_provider_not_ready");
    expect(mocks.rpc.mock.calls.map(c => c[0])).toEqual(["manifest"]); expect(mocks.embedding.mock.results[0].value).toBeUndefined();
  });
  it("starts no storage or embedding requests for disabled families or an invalid backend", async () => {
    configure();
    expect(await serverCorpusRetriever(["scholar"])(frame, signal, ["hadith"])).toEqual([]);
    expect(mocks.construct).not.toHaveBeenCalled(); expect(mocks.embedding).not.toHaveBeenCalled();
    vi.stubEnv("ASK_CORPUS_BACKEND", "misspelt");
    await expect(serverCorpusRetriever(["hadith"])(frame, signal)).rejects.toThrow("corpus_backend_invalid");
    expect(mocks.construct).not.toHaveBeenCalled();
  });
  it("treats backend or storage-acceptance changes as a new durable engine configuration", () => {
    const env = { ASK_JOB_BUILD_REVISION: "a".repeat(40) };
    expect(researchEngineRevision({ ...env, ASK_CORPUS_BACKEND: "persistent" })).not.toBe(researchEngineRevision(env));
    expect(researchEngineRevision({ ...env, ASK_PERSISTENT_INDEX_ACCEPTED: "true" })).not.toBe(researchEngineRevision(env));
  });
});
