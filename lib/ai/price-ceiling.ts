/** Read-only OpenRouter catalogue verification, 2026-10-25: Luna is $0.10/$0.50
 * per million tokens, or $0.20/$0.75 in its high-context tier. These are routing
 * ceilings, not assumed bills; actual receipts still control settlement. */
export const modelPriceCeiling = (model: string) => model === "openai/gpt-6-luna"
  ? { prompt: 0.25, completion: 1, request: 0 }
  // Haiku's >100K tier is $0.50/$2.50; include regional routing headroom.
  : model === "anthropic/claude-haiku-5.5" ? { prompt: 0.6, completion: 3, request: 0 }
  // Public endpoint catalogue, 2026-10-26: conservative maximum across routes.
  : model === "deepseek/deepseek-v4-flash" ? { prompt: 0.6, completion: 1.32, request: 0 }
  : { prompt: 2, completion: 10, request: 0 };
export function modelReservation(body: { model: string; messages: unknown; max_tokens: number }, price = modelPriceCeiling(body.model)) {
  const maximum = modelPriceCeiling(body.model);
  if (!Number.isFinite(price.prompt) || !Number.isFinite(price.completion) || price.prompt <= 0 || price.completion <= 0
    || price.request !== 0 || price.prompt > maximum.prompt || price.completion > maximum.completion) throw Error("invalid_reservation_ceiling");
  return ((Buffer.byteLength(JSON.stringify(body.messages), "utf8") + 4096) * price.prompt + body.max_tokens * price.completion) * 2 / 1_000_000;
}
