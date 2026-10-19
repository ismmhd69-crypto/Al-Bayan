import "server-only";
import { emitAiTrace } from "@/lib/ask/trace-context";
import type { AIProvider } from "./types";
import { createGemini, GoogleBusyError } from "./gemini";
import { createNvidia } from "./nvidia";
import { createOpenRouter } from "./openrouter";

// Exact models pinned on purpose (never "latest"). Each role has an ordered chain: the first model is
// tried, and when Google says "busy" or "slow down" (429/503) the next one is tried, and so on.
// Gemini limits each model separately, so a chain absorbs a busy or exhausted model.
// The writer chain and the verifier chain must never share a model, so the writer never screens its
// own work, whichever model of the chain ends up answering. A chain entry is "model" (default
// provider) or "provider:model", so a different company can sit at the end of a chain. The NVIDIA
// models are the last resort when every Google model is busy (needs NVIDIA_API_KEY; without it those
// steps are simply left out). Tested 2026-10-01: these three answered in about 3 s with valid JSON;
// deepseek-v4.1-flash sat in the free queue for 90 s+, so it is not used.
// 2026-10-02: NVIDIA mix measured again (docs/nvidia-switch-report.md); still opt-in.
// NVIDIA is opt-in (AI_MODELS / AI_VERIFIER_MODELS) and not a default: tested 2026-10-01, its free tier
// answers short prompts in about 3 s but did not finish the real checking prompt in 40 s, which would
// only delay the "busy" message. Fast NVIDIA models seen working: google/gemma-4-31b-it,
// openai/gpt-oss-20b, nvidia/nemotron-3-super-120b-a12b.
// Mo selected Gemini 3.7 Flash as the production writer on 2026-10-01. The checker remains a
// different model so the writer never approves its own answer.
const GEMINI_DIRECT_WRITER_MODELS = ["gemini-3.7-flash"];
const GEMINI_DIRECT_VERIFIER_MODELS = ["gemini-3.1-flash-lite"];

// Mo's decision (2026-10-04): OpenRouter is the main AI door whenever OPENROUTER_API_KEY is set. Measured
// on the real 20-question run (docs/openrouter-runs, Gemini Lite mix with zero-data-retention routing):
// 20 of 20 correct or safe refusals, 11 of 17 answerable questions answered (65%), median 17.8 s,
// 95th percentile 23.5 s, no timeouts, about $0.007 per question. The first model of each chain is the
// cheap Lite mix; the second is the stronger fallback when the first is busy. The writer and checker
// chains share no model. Without an OpenRouter key the older direct Gemini defaults above are used.
const OPENROUTER_WRITER_MODELS = ["openrouter:google/gemini-3.5-flash-lite", "openrouter:google/gemini-3.8-flash"];
const OPENROUTER_VERIFIER_MODELS = ["openrouter:google/gemini-3.1-flash-lite", "openrouter:mistralai/mistral-small-3.2-24b-instruct"];
const openRouterOn = () => !!process.env.OPENROUTER_API_KEY;
const DEFAULT_WRITER_MODELS = () => (openRouterOn() ? OPENROUTER_WRITER_MODELS : GEMINI_DIRECT_WRITER_MODELS);
const DEFAULT_VERIFIER_MODELS = () => (openRouterOn() ? OPENROUTER_VERIFIER_MODELS : GEMINI_DIRECT_VERIFIER_MODELS);

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
    case "nvidia": {
      const key = process.env.NVIDIA_API_KEY;
      if (!key) throw new Error("NVIDIA_API_KEY is not set");
      return createNvidia(key, model);
    }
    case "openrouter": {
      const key = process.env.OPENROUTER_API_KEY;
      if (!key) throw new Error("OPENROUTER_API_KEY is not set");
      return createOpenRouter(key, model);
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
        emitAiTrace("fallback_selected", { model: backup.id, fallback: true });
        return backup.generateJson(request);
      }
    },
  };
}

// Tries each model in order. Only a "busy" answer moves on to the next model; any other failure is
// reported as it is. If every model is busy, the last busy error is thrown (the site shows "busy").
function withChain(models: AIProvider[]): AIProvider {
  return {
    id: models.map((m) => m.id).join("|fallback:"),
    async generateJson(request) {
      let lastBusy: unknown;
      for (const [i, model] of models.entries()) {
        try {
          emitAiTrace("chain_model_started", { model: model.id, attempt: i + 1, fallback: i > 0 });
          const result = await model.generateJson(request);
          emitAiTrace("chain_model_answered", { model: model.id, attempt: i + 1 });
          // Model id only (never the prompt or the answer), so a measurement can see who answered.
          if (process.env.ASK_DEBUG === "true") console.info(`ai answered: ${model.id}`);
          return result;
        } catch (err) {
          if (!(err instanceof GoogleBusyError) || request.signal?.aborted) throw err;
          lastBusy = err;
          emitAiTrace("chain_model_skipped", { model: model.id, attempt: i + 1, outcome: "busy" });
          if (process.env.ASK_DEBUG === "true") console.info(`ai skipped: ${model.id} (busy)${models[i + 1] ? `, using ${models[i + 1].id}` : ""}`);
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
  return chainOf("AI_MODELS", "AI_MODEL", "AI_FALLBACK_MODEL", DEFAULT_WRITER_MODELS());
}

function verifierModels(): string[] {
  return chainOf("AI_VERIFIER_MODELS", "AI_VERIFIER_MODEL", "AI_VERIFIER_FALLBACK_MODEL", DEFAULT_VERIFIER_MODELS());
}

const KNOWN_PROVIDERS = ["gemini", "vertex", "nvidia", "openrouter"];

// "nvidia:deepseek-ai/deepseek-v4.1-flash" -> provider nvidia; a bare "gemini-3.6-flash" uses the default.
function parseEntry(entry: string, fallbackProvider: string): { provider: string; model: string } {
  const colon = entry.indexOf(":");
  if (colon > 0 && KNOWN_PROVIDERS.includes(entry.slice(0, colon))) return { provider: entry.slice(0, colon), model: entry.slice(colon + 1) };
  return { provider: fallbackProvider, model: entry };
}

// Vertex and the Gemini API run the same Google models, so they count as one company when comparing.
const identity = ({ provider, model }: { provider: string; model: string }) => `${provider === "vertex" ? "gemini" : provider}/${model}`;

// A provider whose key is missing is left out of its chain instead of breaking every answer.
function usable(provider: string): boolean {
  if (provider === "nvidia") return !!process.env.NVIDIA_API_KEY;
  if (provider === "openrouter") return !!process.env.OPENROUTER_API_KEY;
  return true;
}

function build(entries: { provider: string; model: string }[]): AIProvider {
  const models = entries.filter((e) => usable(e.provider)).map((e) => create(e.provider, e.model));
  return withChain(models);
}

export function getProvider(): AIProvider {
  return build(writerModels().map((entry) => parseEntry(entry, defaultProvider())));
}

export function getVerifier(): AIProvider {
  const writer = writerModels().map((entry) => parseEntry(entry, defaultProvider()));
  const verifier = verifierModels().map((entry) => parseEntry(entry, process.env.AI_VERIFIER_PROVIDER ?? defaultProvider()));
  const writerIds = new Set(writer.map(identity));
  const shared = verifier.map(identity).filter((id) => writerIds.has(id));
  if (shared.length > 0) throw new Error(`The verifier must be a different model from the writer (shared: ${shared.join(", ")})`);
  return build(verifier);
}
