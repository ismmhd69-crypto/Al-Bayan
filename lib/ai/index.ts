import "server-only";
import type { AIProvider } from "./types";
import { createGemini } from "./gemini";

// Exact model pinned on purpose (never "latest"), overridable per environment.
// 3.5 Flash-Lite: the free test key has no quota for 3.8 Flash, and 3.5 Flash took 12 to 48 s per reply (2026-09-27).
const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite";

export function getProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER ?? "gemini";
  switch (provider) {
    case "gemini": {
      const key = process.env.GEMINI_API_KEY;
      if (!key) throw new Error("GEMINI_API_KEY is not set");
      return createGemini(key, process.env.AI_MODEL ?? DEFAULT_GEMINI_MODEL);
    }
    default:
      throw new Error(`Unknown AI_PROVIDER: ${provider}`);
  }
}
