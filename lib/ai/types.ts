// The one interface the rest of Bayan uses to talk to an AI model.
// Swapping provider (plan section 5) means adding a file next to gemini.ts and
// pointing AI_PROVIDER at it; nothing else changes.

export type JsonSchema =
  | { type: "string"; enum?: string[]; description?: string; maxLength?: number }
  | { type: "integer" | "number" | "boolean"; description?: string }
  | { type: "array"; items: JsonSchema; description?: string; maxItems?: number }
  | { type: "object"; properties: Record<string, JsonSchema>; required: string[]; description?: string };

export type JsonRequest = {
  system: string;
  prompt: string;
  schema: JsonSchema;
  maxOutputTokens?: number;
  /** How much the model may "think" before answering; thinking uses up the output budget. */
  thinking?: "minimal" | "low";
  /** Overall deadline for the whole answer; the call is cancelled when it fires. */
  signal?: AbortSignal;
};

export interface AIProvider {
  /** Provider and exact pinned model, saved with every answer so mistakes can be traced. */
  readonly id: string;
  generateJson(request: JsonRequest): Promise<unknown>;
}
