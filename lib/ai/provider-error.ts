/** Safe rejection metadata shared with checking code. No provider body or message. */
export class OpenRouterRequestError extends Error {
  constructor(readonly httpStatus: number, readonly category: string) {
    super(`openrouter request failed with status ${httpStatus}`);
    this.name = "OpenRouterRequestError";
  }
}

/** Classify structured provider metadata without returning its message, which
 * can echo visitor text. A generic outer message often hides the actual cause. */
export function providerRejectionCategory(status: number, payload: unknown): string {
  const object = (v: unknown): Record<string, unknown> | null => v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : null;
  const error = object(object(payload)?.error), metadata = object(error?.metadata);
  const messages = typeof error?.message === "string" ? [error.message] : [];
  if (typeof metadata?.raw === "string" && metadata.raw.length <= 16_000) {
    try {
      const nested = object(object(JSON.parse(metadata.raw))?.error);
      if (typeof nested?.message === "string") messages.push(nested.message);
    } catch { /* Malformed metadata is not permission to guess or retry. */ }
  }
  const message = messages.join("\n");
  return /compiled grammar is too large|grammar.{0,30}(?:too large|complexity)/i.test(message) ? "structured_grammar_too_large"
    : /no endpoints|no (?:available )?providers|no route/i.test(message) ? "no_eligible_endpoint"
    : /parameter|schema/i.test(message) ? "parameter_or_schema_rejected"
    : [401, 403].includes(status) ? "authorization_rejected" : "provider_rejected";
}
