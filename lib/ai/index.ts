import "server-only";
import type { AIProvider } from "./types";
import { createGemini, GoogleBusyError } from "./gemini";

// Exact models pinned on purpose (never "latest"). Each role has an ordered chain: the first model is
// tried, and when Google says "busy" or "slow down" (429/503) the next one is tried, and so on.
// Gemini limits each model separately, so a chain absorbs a busy or exhausted model.
// The writer chain and the verifier chain must never share a model, so the writer never screens its
// own work, whichever model of the chain ends up answering. Both are Google for now;
// AI_VERIFIER_PROVIDER lets the verifier move to another company later.
const DEFAULT_WRITER_MODELS = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite"];
const DEFAULT_VERIFIER_MODELS = ["gemini-3.6-flash", "gemini-3.5-flash"];

// Mo's decision (2026-09-28): Vertex AI is the main door when VERTEX_API_KEY is set; the Gemini API
// key is the backup for the same model when Vertex is busy. Same model either way, so the answer
// rules and the "different verifier model" rule are unchanged.
function defaultProvider(): string {
  return process.env.AI_PROVIDER ?? (process.env.VERTEX_API_KEY ? "vertex" : "gemini");
}

function create(provider: string, model: string): AIProvider {
  switch (provider) {
    case "gemini": {
      const key = process.env.GEMINI_API_KEY;
      if (!key) throw new Error("GEMINI_API_KEY is not set");
      return createGemini(key, model, "gemini");
    }
    case "vertex": {
      const key = process.env.VERTEX_API_KEY;
      if (!key) throw new Error("VERTEX_API_KEY is not set");
      const vertex = createGemini(key, model, "vertex");
      const backupKey = process.env.GEMINI_API_KEY;
      return backupKey ? withBackup(vertex, createGemini(backupKey, model, "gemini")) : vertex;
    }
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

// Only a "busy" answer switches doors; any other failure is reported as it is. The id stays the
// main door's, and the backup's id is logged locally when it is used.
function withBackup(main: AIProvider, backup: AIProvider): AIProvider {
  return {
    id: main.id,
    async generateJson(request) {
      try {
        return await main.generateJson(request);
      } catch (err) {
        if (!(err instanceof GoogleBusyError) || request.signal?.aborted) throw err;
        if (process.env.ASK_DEBUG === "true") console.info(`${main.id} busy, using ${backup.id}`);
        return backup.generateJson(request);
      }
    },
  };
}

// Tries each model in order. Only a "busy" answer moves on to the next model; any other failure is
// reported as it is. If every model is busy, the last busy error is thrown (the site shows "busy").
function withChain(models: AIProvider[]): AIProvider {
  if (models.length === 1) return models[0];
  return {
    id: models.map((m) => m.id).join("|fallback:"),
    async generateJson(request) {
      let lastBusy: unknown;
      for (const [i, model] of models.entries()) {
        try {
          return await model.generateJson(request);
        } catch (err) {
          if (!(err instanceof GoogleBusyError) || request.signal?.aborted) throw err;
          lastBusy = err;
          if (process.env.ASK_DEBUG === "true" && models[i + 1]) console.info(`${model.id} busy, using ${models[i + 1].id}`);
        }
      }
      throw lastBusy;
    },
  };
}

function list(value: string | undefined): string[] {
  return (value ?? "").split(",").map((m) => m.trim()).filter(Boolean);
}

// AI_MODELS / AI_VERIFIER_MODELS: a comma-separated chain, most preferred first. The older single
// settings (AI_MODEL + AI_FALLBACK_MODEL, AI_VERIFIER_MODEL + AI_VERIFIER_FALLBACK_MODEL) still work.
function chainOf(chainVar: string, firstVar: string, fallbackVar: string, defaults: string[]): string[] {
  const chain = list(process.env[chainVar]);
  if (chain.length > 0) return [...new Set(chain)];
  const first = process.env[firstVar]?.trim();
  const fallback = process.env[fallbackVar]?.trim();
  if (!first && !fallback) return defaults;
  return [...new Set([first ?? defaults[0], ...(fallback ? [fallback] : defaults.slice(1))])];
}

function writerModels(): string[] {
  return chainOf("AI_MODELS", "AI_MODEL", "AI_FALLBACK_MODEL", DEFAULT_WRITER_MODELS);
}

function verifierModels(): string[] {
  return chainOf("AI_VERIFIER_MODELS", "AI_VERIFIER_MODEL", "AI_VERIFIER_FALLBACK_MODEL", DEFAULT_VERIFIER_MODELS);
}

export function getProvider(): AIProvider {
  const provider = defaultProvider();
  return withChain(writerModels().map((model) => create(provider, model)));
}

export function getVerifier(): AIProvider {
  const provider = process.env.AI_VERIFIER_PROVIDER ?? defaultProvider();
  const verifierChain = verifierModels();
  // Same company is the only case where model names can be compared; a different company is a different model.
  if (provider === defaultProvider()) {
    const shared = verifierChain.filter((model) => writerModels().includes(model));
    if (shared.length > 0) throw new Error(`The verifier must be a different model from the writer (shared: ${shared.join(", ")})`);
  }
  return withChain(verifierChain.map((model) => create(provider, model)));
}
