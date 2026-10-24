import "server-only";
import { relative, resolve } from "node:path";
import type { PipelineDeps } from "../core";
import { PrivateSearchIndexStore } from "./index-store";
import { corpusCandidates } from "./corpus-candidates";
import { currentIndexSourceStates } from "@/lib/sources/index-source-state";
import { getVerse } from "@/lib/sources/quran";
import { localAskRuntime } from "../settings";
import { recordLocalAskEvent } from "../local-trace";
import { configuredLocalEmbeddings } from "./local-embeddings";

/** Local pilot adapter. Production uses a separately deployed persistent index;
 * this never assumes Vercel's filesystem is a durable corpus store. */
export function localCorpusRetriever(families: ("hadith" | "scholar")[] = ["hadith", "scholar"]): NonNullable<PipelineDeps["retrieveCorpusCandidates"]> {
  return async (frame, signal, requestedFamilies) => {
    const selectedFamilies = requestedFamilies ? families.filter(f => requestedFamilies.includes(f)) : families;
    if (!selectedFamilies.length) return [];
    if (!localAskRuntime()) throw new Error("filesystem_corpus_preview_local_only");
    const directory = process.env.ASK_CORPUS_INDEX_DIR;
    if (!directory) throw new Error("corpus_index_directory_not_configured");
    const root = resolve("work/private-ask-evaluation"), target = resolve(directory), rel = relative(root, target);
    if (!rel || rel.startsWith("..") || resolve(root, rel) !== target) throw new Error("corpus_index_directory_invalid");
    const store = new PrivateSearchIndexStore(target);
    return corpusCandidates(frame, () => store.load(ids => currentIndexSourceStates(ids, signal)), {
      signal, getVerse, families: selectedFamilies, embedder: configuredLocalEmbeddings(), allowLexicalOnly: process.env.ASK_CORPUS_LEXICAL_PREVIEW === "true",
      onDiscovery: r => recordLocalAskEvent("corpus_discovery", { generation: r.generation, count: r.hits.length, semantic: r.semantic, unrepresentedConcerns: r.unrepresentedConcernIds, truncated: r.truncated }),
    });
  };
}
