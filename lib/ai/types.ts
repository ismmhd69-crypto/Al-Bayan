// The one interface the rest of Bayan uses to talk to an AI model.
// Swapping provider (plan section 5) means adding a file next to gemini.ts and
// pointing AI_PROVIDER at it; nothing else changes.

export type JsonSchema =
  | { type: "string"; enum?: string[]; description?: string }
  | { type: "integer" | "number" | "boolean"; description?: string }
  | { type: "array"; items: JsonSchema; description?: string }
  | { type: "object"; properties: Record<string, JsonSchema>; required: string[]; description?: string };

export type JsonRequest = {
  system: string;
  prompt: string;
  schema: JsonSchema;
  maxOutputTokens?: number;
};

export interface AIProvider {
  /** Provider and exact pinned model, saved with every answer so mistakes can be traced. */
  readonly id: string;
  generateJson(request: JsonRequest): Promise<unknown>;
}
