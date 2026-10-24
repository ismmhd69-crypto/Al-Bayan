import { expect, it, vi } from "vitest";
import { existsSync, readFileSync } from "node:fs";
vi.mock("server-only", () => ({}));
import { prepareNamedScholarRepair } from "../scripts/prepare-ask-named-scholar-repair";
import { checkScholarAttributions } from "../lib/ask/scholar-attribution-check";
import { structuredOutputContract } from "../lib/ai/structured-output";
it.skipIf(!existsSync("work/private-ask-evaluation/parents-current-full-retest-20261024.json"))("the actual parents sentences fail the identity guard and produce one localized identity-locked correction", async () => {
  const c = await prepareNamedScholarRepair(), p = JSON.parse(c.request.prompt);
  expect(p.sections_to_write).toEqual(["scholar"]);
  expect(p.scholar_attribution_names.map((s: any) => s.short_name)).toEqual(["ابن باز", "ابن باز"]);
  expect(p.correction.checker_findings.support_failures.filter((f: any) => f.code === "scholar_not_named")).toHaveLength(2);
  expect(c.request.maxOutputTokens).toBe(2200);
  expect(() => structuredOutputContract(c.request.schema)).not.toThrow();
  const sources = c.pack.passages.flatMap(p => p.source.kind === "scholar" ? [{ id: p.id, scholarId: p.source.quote.scholarId, name: p.source.quote.scholarName.ar }] : []);
  expect(checkScholarAttributions(c.original.map((c: any) => ({ text: c.text, refs: c.source_ids })), sources, "ar").blocked).toEqual(["C1", "C2"]);
  expect(readFileSync(c.reportPath, "utf8")).toBe(c.bytes);
});
