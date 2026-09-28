import "server-only";
import type { AIProvider } from "./types";
import { createGemini, GoogleBusyError } from "./gemini";

// Exact models pinned on purpose (never "latest"), overridable per environment.
// Budget models by Mo's choice (2026-09-28): both cheap "Lite" models.
// Writer: 3.5 Flash-Lite. Verifier: 3.1 Flash-Lite, a different model, so the writer never
// screens its own work. Both are Google for now; AI_VERIFIER_PROVIDER lets the verifier move
// to another company later.
const DEFAULT_WRITER_MODEL = "gemini-3.5-flash-lite";
const DEFAULT_VERIFIER_MODEL = "gemini-3.1-flash-lite";

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

export function getProvider(): AIProvider {
  return create(defaultProvider(), process.env.AI_MODEL ?? DEFAULT_WRITER_MODEL);
}

export function getVerifier(): AIProvider {
  const verifier = create(
    process.env.AI_VERIFIER_PROVIDER ?? defaultProvider(),
    process.env.AI_VERIFIER_MODEL ?? DEFAULT_VERIFIER_MODEL,
  );
  if (verifier.id === getProvider().id) throw new Error("The verifier must be a different model from the writer");
  return verifier;
}
