// Shape guarantees only: none of these invented outputs establishes religious support.
import { expect, it } from "vitest";
import type { JsonSchema } from "@/lib/ai/types";
import { structuredOutputContract, providerShapeSchema } from "@/lib/ai/structured-output";

const schema: JsonSchema = { type: "object", properties: {
  status: { type: "string", enum: ["ready", "no_answer"] },
  rows: { type: "array", maxItems: 2, items: { type: "object", properties: {
    text: { type: "string", maxLength: 8 }, accepted: { type: "boolean" }, score: { type: "number" }, index: { type: "integer" },
  }, required: ["text", "accepted"] } },
}, required: ["status", "rows"] };
const good = { status: "ready", rows: [{ text: "أهل", accepted: true, score: 1.5, index: 2 }] };
it("separates provider decoding bounds from full local acceptance", () => {
  const contract = structuredOutputContract(schema), original = structuredClone(contract.schema);
  const transport = providerShapeSchema(contract.schema);
  expect(JSON.stringify(transport)).not.toMatch(/maxItems|maxLength/);
  expect(transport).toMatchObject({ additionalProperties: false, required: ["status", "rows"] });
  expect(contract.schema).toEqual(original);
  expect(providerShapeSchema({ type: "object", properties: { maxLength: { type: "string", maxLength: 2 } } }))
    .toEqual({ type: "object", properties: { maxLength: { type: "string" } } });
  expect(contract.parse(JSON.stringify({ ...good, rows: [good.rows[0], good.rows[0], good.rows[0]] }))).toBeNull();
  expect(contract.parse(JSON.stringify({ ...good, rows: [{ text: "a".repeat(9), accepted: true }] }))).toBeNull();
});

it("closes nested object shapes without mutating the source contract or changing optional fields", () => {
  const original = structuredClone(schema), contract = structuredOutputContract(schema);
  expect(schema).toEqual(original);
  expect(contract.schema).toMatchObject({ additionalProperties: false, properties: { rows: { items: { additionalProperties: false, required: ["text", "accepted"] } } } });
  expect(contract.parse(JSON.stringify(good))).toEqual(good);
  expect(contract.parse('{"status":"no_answer","rows":[]}')).toEqual({ status: "no_answer", rows: [] });
  expect(contract.parse('{"status":"ready","rows":[{"text":"💡💡💡💡💡💡💡💡","accepted":false}]}')).not.toBeNull();
});

it.each([
  {}, { ...good, status: ["ready"] }, { ...good, extra: "invented" },
  { ...good, rows: [{ text: "ok", accepted: "true" }] }, { ...good, rows: [{ text: "ok", accepted: true, index: 1.2 }] },
  { ...good, rows: [{ text: "ok", accepted: true, extra: "invented" }] }, { ...good, rows: [{ accepted: true }] },
  { ...good, rows: [{ text: "too long a sentence", accepted: true }] }, { ...good, rows: [good.rows[0], good.rows[0], good.rows[0]] },
  { ...good, rows: null }, { ...good, status: "unknown" },
])("rejects a whole response with invalid shape %#", value => {
  expect(structuredOutputContract(schema).parse(JSON.stringify(value))).toBeNull();
});

it.each(['{"status":"ready","rows":[{"text":"ok","accepted":true}],',
  'Here is JSON: {"status":"ready","rows":[]}', '```json\n{"status":"ready","rows":[]}\n```',
  '[{"status":"ready","rows":[]}]', '{"status":"ready","rows":[{"text":"ok","accepted":true,"score":1e999}]}',
])("never heals or extracts valid fragments from invalid strict responses %#", content => {
  expect(structuredOutputContract(schema).parse(content)).toBeNull();
});

it.each([
  { type: "object", properties: {}, required: ["unknown"] },
  { type: "object", properties: { x: { type: "string", maxLength: -1 } }, required: [] },
  { type: "object", properties: { x: { type: "string", enum: ["x", "x"] } }, required: [] },
  { type: "object", properties: {}, required: [], unexpected: true },
  { type: "array", items: { type: "string" } },
])("rejects unsupported schema input before request execution %#", value => {
  expect(() => structuredOutputContract(value as JsonSchema)).toThrow(/structured_schema/);
});
