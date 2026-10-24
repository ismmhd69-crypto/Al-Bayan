import type { JsonSchema } from "./types";

/** Keep strict shape/enums while avoiding provider decoding-size constraints.
 * The full original contract still validates every received response locally. */
export function providerShapeSchema(schema: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(schema).filter(([key]) => key !== "maxItems" && key !== "maxLength").map(([key, value]) => [key,
    key === "properties" ? Object.fromEntries(Object.entries(value as Record<string, Record<string, unknown>>).map(([name, child]) => [name, providerShapeSchema(child)]))
      : key === "items" ? providerShapeSchema(value as Record<string, unknown>) : structuredClone(value)]));
}

/** Compile only our declared schema vocabulary. No inferred fields, nullable
 * substitutions or response healing: optional properties stay optional. */
export function structuredOutputContract(input: JsonSchema) {
  let nodes = 0;
  const compile = (raw: JsonSchema, depth = 0): Record<string, unknown> => {
    if (++nodes > 10_000 || depth > 64 || !raw || typeof raw !== "object" || Array.isArray(raw)) throw Error("structured_schema_invalid");
    const fields = raw.type === "object" ? ["properties", "required"] : raw.type === "array" ? ["items", "maxItems"] : raw.type === "string" ? ["enum", "maxLength"] : [];
    if (Object.keys(raw).some(key => !["type", "description", ...fields].includes(key))
      || raw.description !== undefined && typeof raw.description !== "string") throw Error("structured_schema_invalid");
    const result: Record<string, unknown> = { type: raw.type, ...(raw.description !== undefined ? { description: raw.description } : {}) };
    if (raw.type === "object") {
      if (!raw.properties || typeof raw.properties !== "object" || Array.isArray(raw.properties) || !Array.isArray(raw.required)
        || raw.required.some(key => typeof key !== "string" || !Object.hasOwn(raw.properties, key))
        || new Set(raw.required).size !== raw.required.length) throw Error("structured_schema_invalid");
      result.properties = Object.fromEntries(Object.entries(raw.properties).map(([key, value]) => [key, compile(value, depth + 1)]));
      result.required = [...raw.required]; result.additionalProperties = false;
    } else if (raw.type === "array") {
      result.items = compile(raw.items, depth + 1);
      if (raw.maxItems !== undefined) {
        if (!Number.isSafeInteger(raw.maxItems) || raw.maxItems < 0) throw Error("structured_schema_invalid");
        result.maxItems = raw.maxItems;
      }
    } else if (raw.type === "string") {
      if (raw.enum !== undefined) {
        if (!Array.isArray(raw.enum) || !raw.enum.length || raw.enum.some(v => typeof v !== "string") || new Set(raw.enum).size !== raw.enum.length) throw Error("structured_schema_invalid");
        result.enum = [...raw.enum];
      }
      if (raw.maxLength !== undefined) {
        if (!Number.isSafeInteger(raw.maxLength) || raw.maxLength < 0) throw Error("structured_schema_invalid");
        result.maxLength = raw.maxLength;
      }
    } else if (!["boolean", "number", "integer"].includes(raw.type)) throw Error("structured_schema_invalid");
    return result;
  };
  const schema = compile(input);
  if (schema.type !== "object") throw Error("structured_schema_root_invalid");
  const matches = (value: unknown, node: Record<string, unknown>): boolean => {
    if (node.type === "object") {
      if (!value || typeof value !== "object" || Array.isArray(value)) return false;
      const properties = node.properties as Record<string, Record<string, unknown>>;
      return (node.required as string[]).every(key => Object.hasOwn(value, key))
        && Object.entries(value).every(([key, item]) => Object.hasOwn(properties, key) && matches(item, properties[key]));
    }
    if (node.type === "array") return Array.isArray(value) && (node.maxItems === undefined || value.length <= (node.maxItems as number))
      && value.every(item => matches(item, node.items as Record<string, unknown>));
    if (node.type === "string") return typeof value === "string" && (node.maxLength === undefined || Array.from(value).length <= (node.maxLength as number))
      && (node.enum === undefined || (node.enum as string[]).includes(value));
    if (node.type === "boolean") return typeof value === "boolean";
    return typeof value === "number" && Number.isFinite(value) && (node.type !== "integer" || Number.isInteger(value));
  };
  return { schema, parse(content: string): unknown | null {
    try {
      const value: unknown = JSON.parse(content);
      return matches(value, schema) ? value : null;
    } catch { return null; }
  } };
}
