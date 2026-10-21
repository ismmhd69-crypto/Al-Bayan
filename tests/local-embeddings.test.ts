// Invented TEI responses exercise transport and identity checks, not model accuracy.
import { describe, expect, it, vi } from "vitest";
import { createServer } from "node:http";
import { localTEIEmbeddings, localEmbeddingConfig, configuredLocalEmbeddings, type LocalEmbeddingConfig } from "@/lib/ask/search-engine/local-embeddings";
import { sameSpace, textHash, type SearchPassage } from "@/lib/ask/search-engine/contract";
import { buildSearchIndex } from "@/lib/ask/search-engine/index-store";
import { retrieveFromCorpus } from "@/lib/ask/search-engine/corpus-retrieval";
import type { QuestionFrame } from "@/lib/ask/retrieval";

const config: LocalEmbeddingConfig = { endpoint: "http://127.0.0.1:8080", model: "fixture/multilingual-model", revision: "a".repeat(40), dimensions: 2,
  queryPrefix: "query: ", passagePrefix: "passage: ", pooling: "mean", dtype: "float32", serverVersion: "1.9.0", serverSha: "b".repeat(40), deploymentRecipe: "c".repeat(64) };
const info = () => ({ model_id: config.model, model_sha: config.revision, model_dtype: config.dtype, version: config.serverVersion, sha: config.serverSha,
  auto_truncate: false, model_type: { embedding: { pooling: config.pooling } }, max_input_length: 512, max_client_batch_size: 16 });
const json = (value: unknown) => new Response(JSON.stringify(value), { headers: { "Content-Type": "application/json" } });
const fake = () => vi.fn(async (url: string, init: RequestInit) => url.endsWith("/info") ? json(info()) : json(JSON.parse(init.body as string).inputs.map(() => [1, 0])));
const signal = () => new AbortController().signal;
function passage(): SearchPassage {
  const original = "نص تجريبي لا يمثل دليلاً دينياً";
  return { id: "P1", sourceId: "S1", parentId: "D1", family: "scholar", language: "ar", original, originalHash: textHash(original), originalVerified: true,
    title: "Invented", reference: "REF1", canonicalUrl: "https://example.org/fixture", span: { start: 0, end: original.length }, context: { before: "", after: "", complete: true },
    permissions: { published: true, search: true, ai: true, embeddings: true, record: "invented-permission", verifiedAt: new Date().toISOString(), expiresAt: null, revoked: false }, attribution: { scholarId: "fixture" } };
}
describe("pinned local semantic-model adapter", () => {
  it.each(["https://remote.invalid", "http://localhost:8080", "http://127.0.0.1:8080/private", "http://user:pass@127.0.0.1:8080", "http://127.0.0.1:8080/?key=x"])("rejects endpoint %s before sending text", endpoint => {
    expect(() => localEmbeddingConfig({ ...config, endpoint })).toThrow("embedding_config_invalid");
  });
  it("is disabled by default and refuses deployed runtime or unpinned models", () => {
    expect(configuredLocalEmbeddings({})).toBeUndefined();
    expect(() => configuredLocalEmbeddings({ ASK_LOCAL_EMBEDDINGS: "true", NODE_ENV: "production" })).toThrow("local_embeddings_preview_only");
    expect(() => localTEIEmbeddings({ ...config, revision: "main" })).toThrow("embedding_config_invalid");
    expect(() => localTEIEmbeddings({ ...config, dimensions: 0 })).toThrow("embedding_config_invalid");
  });
  it("keeps source bytes unchanged and uses explicit separate query/passage prefixes without truncating", async () => {
    const fetch = fake(), adapter = localTEIEmbeddings(config, fetch), originals = ["  نص عربي كامل  ", "Unveränderte deutsche Bedeutung"];
    await adapter.embedOriginals(originals, signal()); await adapter.embedQueries(["Explain this meaning"], signal());
    const posts = fetch.mock.calls.filter(([, init]) => init.method === "POST");
    expect(JSON.parse(posts[0][1].body as string)).toEqual({ inputs: originals.map(s => "passage: " + s), truncate: false, normalize: true, prompt_name: null });
    expect(JSON.parse(posts[1][1].body as string).inputs).toEqual(["query: Explain this meaning"]);
    expect(fetch.mock.calls.every(([, init]) => init.redirect === "error" && init.cache === "no-store")).toBe(true);
  });
  it.each(["revision", "pooling", "truncation", "server", "dtype"])("refuses changed %s before inference", async field => {
    const changed = info();
    if (field === "revision") changed.model_sha = "d".repeat(40);
    if (field === "pooling") changed.model_type.embedding.pooling = "cls";
    if (field === "truncation") changed.auto_truncate = true;
    if (field === "server") changed.sha = "d".repeat(40);
    if (field === "dtype") changed.model_dtype = "float16";
    const fetch = vi.fn(async () => json(changed));
    await expect(localTEIEmbeddings(config, fetch).embedQueries(["Question"], signal())).rejects.toThrow("embedding_deployment_mismatch");
    expect(fetch).toHaveBeenCalledOnce();
  });
  it("refuses a model swapped while inference was running", async () => {
    let reads = 0;
    const fetch = vi.fn(async (url: string) => url.endsWith("/info") ? json({ ...info(), model_sha: ++reads > 1 ? "d".repeat(40) : config.revision }) : json([[1, 0]]));
    await expect(localTEIEmbeddings(config, fetch).embedQueries(["Question"], signal())).rejects.toThrow("embedding_deployment_changed");
  });
  it.each([{ output: [[1]] }, { output: [[0, 0]] }, { output: [[1, 0], [1, 0]] }, { output: [["secret", 0]] }])("rejects malformed or mismatched vectors", async ({ output }) => {
    const fetch = vi.fn(async (url: string) => json(url.endsWith("/info") ? info() : output));
    await expect(localTEIEmbeddings(config, fetch).embedQueries(["Question"], signal())).rejects.toThrow("embedding_vector_mismatch");
  });
  it("never sends originals lacking embedding permission", async () => {
    const fetch = fake(), adapter = localTEIEmbeddings(config, fetch), p = passage(); p.permissions.embeddings = false;
    const result = await buildSearchIndex([p], adapter, "fixture", signal());
    expect(fetch).not.toHaveBeenCalled(); expect(result.excluded[0].reason).toBe("embedding_permission_missing");
  });
  it("binds prefix/recipe changes to vector identity and rejects mismatched query spaces before a call", async () => {
    const adapter = localTEIEmbeddings(config, fake()), changed = localTEIEmbeddings({ ...config, queryPrefix: "different: " }, fake());
    expect(sameSpace(adapter.space, changed.space)).toBe(false);
    const { index } = await buildSearchIndex([passage()], adapter, "fixture", signal());
    const frame: QuestionFrame = { language: "en", kind: "question", searchQueries: {}, questionType: "general", subjects: ["fixture"], requirements: [{ id: "R1", text: "Explain this unfamiliar wording", facet: "general" }], requiredFacets: ["general"], qualifiers: [] };
    await expect(retrieveFromCorpus(frame, async () => index, { signal: signal(), embedder: changed })).rejects.toThrow("query_vector_mismatch");
    const result = await retrieveFromCorpus(frame, async () => index, { signal: signal(), embedder: adapter });
    expect(result.semantic).toBe("used"); expect(result.hits[0].methods).toContain("semantic");
  });
  it("cancels an unresponsive endpoint without a paid retry or exposing its error text", async () => {
    const abort = new AbortController(), fetch = vi.fn(() => new Promise<Response>(() => {}));
    const work = localTEIEmbeddings(config, fetch).embedQueries(["Private question"], abort.signal);
    abort.abort(); await expect(work).rejects.toThrow("embedding_aborted"); expect(fetch).toHaveBeenCalledOnce();
    const failed = localTEIEmbeddings(config, async () => { throw new Error("Private question secret"); });
    await expect(failed.embedQueries(["Private question"], signal())).rejects.toThrow("embedding_transport_failed");
  });
  it("does not expose response bodies or keep reading an oversized information response", async () => {
    const cancelled = vi.fn();
    const stream = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(new Uint8Array(33_000)); }, cancel: cancelled });
    const large = localTEIEmbeddings(config, async () => new Response(stream, { headers: { "Content-Type": "application/json" } }));
    await expect(large.embedQueries(["Private question"], signal())).rejects.toThrow("embedding_response_too_large");
    expect(cancelled).toHaveBeenCalledOnce();
    const failure = localTEIEmbeddings(config, async () => new Response("Private question secret", { status: 500 }));
    await expect(failure.embedQueries(["Private question"], signal())).rejects.toThrow("embedding_http_failed");
  });
  it("refuses an actual HTTP redirect without sending anything to its target", async () => {
    let targetRequests = 0;
    const server = createServer((req, res) => {
      if (req.url === "/redirect-target") { targetRequests++; res.end("must not arrive"); }
      else { res.writeHead(302, { Location: "/redirect-target" }); res.end(); }
    });
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    try {
      const address = server.address(); if (!address || typeof address === "string") throw new Error("fixture_listener");
      const adapter = localTEIEmbeddings({ ...config, endpoint: `http://127.0.0.1:${address.port}` });
      await expect(adapter.embedQueries(["Private question"], signal())).rejects.toThrow("embedding_transport_failed");
      expect(targetRequests).toBe(0);
    } finally { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
  });
  it("uses actual loopback HTTP framing without a real model or external service", async () => {
    const received: string[] = [];
    const server = createServer(async (req, res) => {
      res.setHeader("Content-Type", "application/json");
      if (req.url === "/info") return res.end(JSON.stringify(info()));
      const chunks = []; for await (const part of req) chunks.push(part);
      received.push(Buffer.concat(chunks).toString("utf8")); res.end(JSON.stringify([[1, 0]]));
    });
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    try {
      const address = server.address(); if (!address || typeof address === "string") throw new Error("fixture_listener");
      const adapter = localTEIEmbeddings({ ...config, endpoint: `http://127.0.0.1:${address.port}` });
      expect(await adapter.embedQueries(["Invented question"], signal())).toEqual([[1, 0]]);
      expect(JSON.parse(received[0]).inputs).toEqual(["query: Invented question"]);
    } finally { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
  });
});
