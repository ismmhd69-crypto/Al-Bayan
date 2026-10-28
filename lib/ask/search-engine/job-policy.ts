import { createHash } from "node:crypto";

const CONFIG = ["AI_PROVIDER", "AI_VERIFIER_PROVIDER", "AI_MODELS", "AI_MODEL", "AI_FALLBACK_MODEL", "AI_VERIFIER_MODELS", "AI_VERIFIER_MODEL", "AI_VERIFIER_FALLBACK_MODEL",
  "OPENROUTER_PRIVACY", "OPENROUTER_SORT", "OPENROUTER_REASONING", "OPENROUTER_STRUCTURED_OUTPUTS", "NVIDIA_REASONING", "QURAN_API_ENV", "QURAN_CHAPTERS", "HADITH_SOURCE", "SCHOLAR_QUOTES", "SCHOLARS_LIVE",
  "PREPARED_PUBLISHING_ENABLED", "PREPARED_ANSWERS", "ASK_APPROVED_TOPICS", "ASK_MEANING_RANKING", "ASK_RESEARCH_RECOVERY", "ASK_CORPUS_RETRIEVAL", "ASK_CORPUS_INDEX_DIR", "ASK_CORPUS_LEXICAL_PREVIEW",
  "ASK_RICH_VIDEOS", "ASK_CLAIM_AUDIT", "ASK_LIBRARY_FLOW", "ASK_TIERED", "ASK_LEAN", "ASK_CORPUS_BACKEND", "ASK_PERSISTENT_INDEX_ACCEPTED", "VIDEOS", "MAX_VIDEOS", "ASK_VIDEO_BUDGET_MS"] as const;
const CREDENTIALS = ["OPENROUTER_API_KEY", "VERTEX_API_KEY", "GEMINI_API_KEY", "NVIDIA_API_KEY", "SUPABASE_SECRET_KEY"] as const;
const EMBEDDING_CONFIG = ["ASK_LOCAL_EMBEDDINGS", "ASK_LOCAL_EMBEDDING_CONFIG", "ASK_PATIENT_ENABLED", "ASK_FOCUSED_CHECKS", "ASK_DISTINCT_SELECTION"] as const;

/** The build revision must change with deployed code. Configuration changes also invalidate replay.
 * Credential values never enter the fingerprint; only available-provider booleans do. */
export function researchEngineRevision(env: Record<string, string | undefined> = process.env): string {
  const build = env.ASK_JOB_BUILD_REVISION ?? env.VERCEL_GIT_COMMIT_SHA;
  if (!build || !/^[a-f0-9]{40,64}$/.test(build)) throw new Error("research_build_revision_required");
  return createHash("sha256").update(JSON.stringify({ contract: "research-job-5-selection-refs-summary", build,
    config: CONFIG.map(name => [name, env[name] ?? null]), embeddings: EMBEDDING_CONFIG.map(name => [name, env[name] ? createHash("sha256").update(env[name]!).digest("hex") : null]), credentials: CREDENTIALS.map(name => [name, !!env[name]]) })).digest("hex");
}
