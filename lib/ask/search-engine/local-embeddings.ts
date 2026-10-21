import { createHash } from "node:crypto";
import { abortable } from "../abort";
import { validVector, type VectorSpace } from "./contract";
import type { SourceEmbedder } from "./index-store";
import type { QueryEmbedder } from "./corpus-retrieval";

/** TEI protocol adapter, local preview only. No model download, default model or remote provider. */
export type LocalEmbeddingConfig = {
  endpoint: string; model: string; revision: string; dimensions: number;
  queryPrefix: string; passagePrefix: string; pooling: "cls" | "mean" | "last-token";
  dtype: "float16" | "float32" | "bfloat16"; serverVersion: string; serverSha: string;
  // Operator must pin a deployment with no implicit default prompt. /info cannot attest this.
  deploymentRecipe: string;
};
type Transport = (input: string, init: RequestInit) => Promise<Response>;
const fingerprint = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const SHA = /^[a-f0-9]{40}$/;
export function localEmbeddingConfig(value: unknown): LocalEmbeddingConfig {
  const c = value as LocalEmbeddingConfig;
  let url: URL;
  try { url = new URL(c?.endpoint); } catch { throw new Error("embedding_config_invalid"); }
  if (Object.keys(c).sort().join(",") !== "deploymentRecipe,dimensions,dtype,endpoint,model,passagePrefix,pooling,queryPrefix,revision,serverSha,serverVersion"
    || url.protocol !== "http:" || url.hostname !== "127.0.0.1" || url.pathname !== "/" || url.username || url.password || url.search || url.hash
    || typeof c.model !== "string" || !/^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/.test(c.model)
    || !SHA.test(c.revision) || !SHA.test(c.serverSha) || !/^[a-f0-9]{64}$/.test(c.deploymentRecipe)
    || !Number.isSafeInteger(c.dimensions) || c.dimensions < 1 || c.dimensions > 8192
    || !["cls", "mean", "last-token"].includes(c.pooling) || !["float16", "float32", "bfloat16"].includes(c.dtype)
    || typeof c.serverVersion !== "string" || !/^\d+\.\d+\.\d+(?:[-+][a-zA-Z0-9.-]+)?$/.test(c.serverVersion)
    || typeof c.queryPrefix !== "string" || c.queryPrefix.length > 500 || typeof c.passagePrefix !== "string" || c.passagePrefix.length > 500)
    throw new Error("embedding_config_invalid");
  return structuredClone(c);
}

export function configuredLocalEmbeddings(env: Record<string, string | undefined> = process.env): (SourceEmbedder & QueryEmbedder) | undefined {
  if (env.ASK_LOCAL_EMBEDDINGS !== "true") return undefined;
  if (env.NODE_ENV !== "development" || env.VERCEL) throw new Error("local_embeddings_preview_only");
  const config = env.ASK_LOCAL_EMBEDDING_CONFIG;
  if (!config || config.length > 8000) throw new Error("embedding_config_missing");
  let parsed: unknown;
  try { parsed = JSON.parse(config); } catch { throw new Error("embedding_config_invalid"); }
  return localTEIEmbeddings(localEmbeddingConfig(parsed));
}

async function json(response: Response, limit: number, signal: AbortSignal): Promise<unknown> {
  if (!response.ok || response.redirected || !response.headers.get("content-type")?.includes("application/json")) {
    await response.body?.cancel().catch(() => {}); throw new Error("embedding_http_failed");
  }
  const reader = response.body?.getReader();
  if (!reader) throw new Error("embedding_response_missing");
  const chunks: Uint8Array[] = []; let total = 0;
  try {
    while (true) {
      const { value, done } = await abortable(reader.read(), signal);
      if (done) break;
      total += value.byteLength;
      if (total > limit) throw new Error("embedding_response_too_large");
      chunks.push(value);
    }
    try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw new Error("embedding_response_invalid"); }
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}

export function localTEIEmbeddings(input: LocalEmbeddingConfig, dispatch: Transport = (url, init) => fetch(url, init)): SourceEmbedder & QueryEmbedder {
  const c = localEmbeddingConfig(input);
  const space: VectorSpace = { model: c.model, revision: c.revision, dimensions: c.dimensions, recipe: fingerprint({
    protocol: "tei-local-1", queryPrefix: c.queryPrefix, passagePrefix: c.passagePrefix,
    pooling: c.pooling, dtype: c.dtype, normalize: true, truncate: false,
    serverVersion: c.serverVersion, serverSha: c.serverSha, deploymentRecipe: c.deploymentRecipe,
  }) };
  const request = async (path: string, init: RequestInit, signal: AbortSignal, limit: number) => {
    try {
      const response = await abortable(dispatch(new URL(path, c.endpoint).href, { ...init, redirect: "error", cache: "no-store", signal }), signal);
      return await json(response, limit, signal);
    } catch (error) {
      // Provider bodies can contain originals or visitor text. Only fixed reason codes escape.
      if (signal.aborted) throw new Error("embedding_aborted");
      if (error instanceof Error && /^embedding_[a-z_]+$/.test(error.message)) throw error;
      throw new Error("embedding_transport_failed");
    }
  };
  const embed = async (texts: string[], prefix: string, parent: AbortSignal) => {
    parent.throwIfAborted();
    if (!Array.isArray(texts) || !texts.length || texts.length > 16 || texts.some(t => typeof t !== "string" || !t.trim() || t.length > 24000)) throw new Error("embedding_input_invalid");
    const body = JSON.stringify({ inputs: texts.map(t => prefix + t), truncate: false, normalize: true, prompt_name: null });
    if (Buffer.byteLength(body) > 512_000) throw new Error("embedding_input_too_large");
    const signal = AbortSignal.any([parent, AbortSignal.timeout(30_000)]);
    const info = await request("/info", { method: "GET" }, signal, 32_000) as Record<string, any> | null;
    if (!info || info.model_id !== c.model || info.model_sha !== c.revision || info.model_dtype !== c.dtype
      || info.version !== c.serverVersion || info.sha !== c.serverSha || info.auto_truncate !== false
      || info.model_type?.embedding?.pooling !== c.pooling || !Number.isSafeInteger(info.max_input_length) || info.max_input_length <= 0
      || !Number.isSafeInteger(info.max_client_batch_size) || info.max_client_batch_size < texts.length) throw new Error("embedding_deployment_mismatch");
    const output = await request("/embed", { method: "POST", headers: { "Content-Type": "application/json" }, body }, signal, 4_000_000);
    if (!Array.isArray(output) || output.length !== texts.length || output.some(v => !validVector(v, c.dimensions))) throw new Error("embedding_vector_mismatch");
    // A deployment changed during inference cannot supply this immutable vector generation.
    const after = await request("/info", { method: "GET" }, signal, 32_000);
    if (fingerprint(after) !== fingerprint(info)) throw new Error("embedding_deployment_changed");
    return output as number[][];
  };
  return { space: Object.freeze(space), embedOriginals: (texts, signal) => embed(texts, c.passagePrefix, signal),
    embedQueries: (texts, signal) => embed(texts, c.queryPrefix, signal) };
}
