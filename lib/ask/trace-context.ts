import { AsyncLocalStorage } from "node:async_hooks";
import type { AIProvider, JsonRequest } from "@/lib/ai/types";
import type { Diagnostic } from "./diagnostics";

const requestContext = new AsyncLocalStorage<{ requestId: string; started: number }>();
const aiContext = new AsyncLocalStorage<{ emit: (code: string, details: unknown) => void }>();
export const withAskRequest = <T>(requestId: string, work: () => T, started = Date.now()): T => requestContext.run({ requestId, started }, work);
export const currentAskStarted = () => requestContext.getStore()?.started;
export const currentAskRequestId = () => requestContext.getStore()?.requestId;
export function emitAiTrace(code: string, details: unknown) { try { aiContext.getStore()?.emit(code, details); } catch { /* Non-interfering observer. */ } }
export const errorCategory = (error: unknown) => error instanceof Error && error.name === "TimeoutError" ? "timeout"
  : error instanceof Error && error.name === "AbortError" ? "aborted"
  : error instanceof Error && error.constructor.name === "GoogleBusyError" ? "busy" : "other";
export function requestPhase(request: JsonRequest) {
  return request.system.startsWith("You create a safe search plan") ? "frame"
    : request.system.startsWith("You select evidence") ? "selection"
    : request.system.startsWith("You write short explanations") ? "draft"
    : request.system.includes("video") && request.system.includes("title") ? "videos"
    : request.system.includes("same question") || request.system.startsWith("You compare two questions") ? "prepared" : "screening";
}
export function observedProvider(provider: AIProvider, role: "writer" | "checker", log: Diagnostic, started: number, nextCall: () => string): AIProvider {
  return { id: provider.id, async generateJson(request) {
    const callId = nextCall(), phase = requestPhase(request), callStarted = Date.now();
    const emit = (code: string, details: unknown) => {
      try { log("ai", code, Date.now() - started, { call_id: callId, role, phase, ...(details && typeof details === "object" ? details : {}) }); } catch { /* Observers cannot break model calls. */ }
    };
    emit("model_call_started", { model: provider.id, prompt_chars: request.prompt.length, schema_chars: JSON.stringify(request.schema).length, max_output_tokens: request.maxOutputTokens ?? 2048 });
    return aiContext.run({ emit }, async () => {
      try {
        const value = await provider.generateJson(request);
        emit("model_call_finished", { duration_ms: Date.now() - callStarted, valid: value !== null && typeof value === "object" && !Array.isArray(value) });
        return value;
      } catch (error) {
        emit("model_call_failed", { duration_ms: Date.now() - callStarted, outcome: errorCategory(error) });
        throw error;
      }
    });
  } };
}
