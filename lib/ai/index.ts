import "server-only";
import type { AIProvider } from "./types";
import { createGemini } from "./gemini";

// Exact models pinned on purpose (never "latest"), overridable per environment.
// Writer: 3.5 Flash-Lite, fast (the free test key has no quota for 3.8 Flash).
// Verifier: 3.5 Flash, a different and larger model, so the writer never screens its own work.
// Both are Google for now; AI_VERIFIER_PROVIDER lets the verifier move to another company later.
const DEFAULT_WRITER_MODEL = "gemini-3.5-flash-lite";
const DEFAULT_VERIFIER_MODEL = "gemini-3.5-flash";

function create(provider: string, model: string): AIProvider {
  switch (provider) {
    case "gemini": {
      const key = process.env.GEMINI_API_KEY;
      if (!key) throw new Error("GEMINI_API_KEY is not set");
      return createGemini(key, model);
    }
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

export function getProvider(): AIProvider {
  return create(process.env.AI_PROVIDER ?? "gemini", process.env.AI_MODEL ?? DEFAULT_WRITER_MODEL);
}

export function getVerifier(): AIProvider {
  const verifier = create(
    process.env.AI_VERIFIER_PROVIDER ?? process.env.AI_PROVIDER ?? "gemini",
    process.env.AI_VERIFIER_MODEL ?? DEFAULT_VERIFIER_MODEL,
  );
  if (verifier.id === getProvider().id) throw new Error("The verifier must be a different model from the writer");
  return verifier;
}
