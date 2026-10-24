import { expect, it } from "vitest";
import { qualityBankV3 } from "../scripts/prepare-ask-quality-bank-v3";

it("versions reassessed labels without rewriting historical bank objects or implying live success", () => {
  const old = { version: 2, cases: Array.from({ length: 12 }, (_, i) => ({ id: `S${String(i + 1).padStart(2, "0")}`,
    expected: i % 2 ? "supported" : "not_fully_supported", item: { text: "نص اختبار", refs: ["Q1"] } })), unscoredApplication: { status: "unscored" } };
  const before = JSON.stringify(old), bank = qualityBankV3(old, "historical-hash");
  expect(JSON.stringify(old)).toBe(before);
  expect(bank.cases).toHaveLength(21);
  expect(new Set(bank.cases.map(c => c.id)).size).toBe(21);
  expect(bank.cases.every(c => c.liveStatus === "not_tested_v3")).toBe(true);
  expect(bank.cases.find(c => c.id === "S03")?.expected).toBe("context_needed");
  expect(bank.cases.find(c => c.id === "S11")?.expected).toBe("missing_qualification");
  expect(bank.cases.find(c => c.id === "S11")?.historicalExpected).toBe(old.cases[10].expected);
  expect(bank.cases.filter(c => c.family === "fresh_arabic_topic")).toHaveLength(6);
  expect(bank.cases.filter(c => c.family === "alternate_wording")).toHaveLength(3);
});
