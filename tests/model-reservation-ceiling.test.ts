import { expect, it } from "vitest";
import { modelPriceCeiling, modelReservation } from "@/lib/ai/price-ceiling";
const body = { model: "openai/gpt-6-luna", messages: [{ role: "user", content: "سلام" }], max_tokens: 1000 };
it("keeps the default reservation and permits a stricter enforced routing price", () => {
  expect(modelReservation(body)).toBe(modelReservation(body, modelPriceCeiling(body.model)));
  const narrow = modelReservation(body, { prompt: 0.10, completion: 0.50, request: 0 });
  expect(narrow).toBeGreaterThan(0); expect(narrow).toBeLessThan(modelReservation(body));
  const conservativeTokens = Buffer.byteLength(JSON.stringify(body.messages), "utf8") + 4096;
  expect(narrow).toBeGreaterThan((conservativeTokens * 0.10 + body.max_tokens * 0.50) / 1_000_000);
});
it("rejects invalid prices or an expanded ceiling", () => {
  for (const price of [{ prompt: NaN, completion: 0.50, request: 0 }, { prompt: -1, completion: 0.50, request: 0 },
    { prompt: 1, completion: 1, request: 0 }, { prompt: 0.10, completion: 0.50, request: 1 }]) expect(() => modelReservation(body, price)).toThrow("invalid_reservation_ceiling");
});
