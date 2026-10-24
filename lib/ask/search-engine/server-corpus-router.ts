import "server-only";
import type { PipelineDeps } from "../core";
import { localAskRuntime } from "../settings";
import { localCorpusRetriever } from "./server-corpus";
import { persistentCorpusCandidates } from "./persistent-corpus";
import { serverPersistentIndexRpc } from "./server-persistent-index";
import { configuredLocalEmbeddings } from "./local-embeddings";
import { recordLocalAskEvent } from "../local-trace";

/** Selects a server-owned discovery backend, never from visitor input. Import/construction
 * neither connects nor uploads sources. The persistent request path is read-only. */
export function serverCorpusRetriever(families: ("hadith" | "scholar")[]): NonNullable<PipelineDeps["retrieveCorpusCandidates"]> {
  return async (frame, signal, requestedFamilies) => {
    signal.throwIfAborted();
    const selected = requestedFamilies ? families.filter(f => requestedFamilies.includes(f)) : families;
    if (!selected.length) return [];
    const backend = process.env.ASK_CORPUS_BACKEND ?? "local";
    if (backend === "local") return localCorpusRetriever(selected)(frame, signal);
    if (backend !== "persistent") throw new Error("corpus_backend_invalid");
    if (process.env.ASK_PERSISTENT_INDEX_ACCEPTED !== "true") throw new Error("persistent_index_acceptance_required");
    const rpc = serverPersistentIndexRpc();
    return persistentCorpusCandidates(frame, (operation, body, querySignal) => {
      if (operation !== "manifest" && operation !== "search") throw new Error("corpus_write_not_allowed");
      return rpc(operation, body, querySignal);
    }, { signal, families: selected, embedder: configuredLocalEmbeddings(),
      // Lexical inspection is a local pilot, not an accidental production fallback.
      allowLexicalOnly: localAskRuntime() && process.env.ASK_CORPUS_LEXICAL_PREVIEW === "true",
      onDiscovery: r => recordLocalAskEvent("persistent_corpus_discovery", { generation: r.generation, count: r.hits.length,
        semantic: r.semantic, unrepresentedConcerns: r.unrepresentedConcernIds, truncated: r.truncated }),
    });
  };
}
