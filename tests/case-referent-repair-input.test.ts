import { expect, it, vi } from "vitest";
import { existsSync } from "node:fs";
vi.mock("server-only", () => ({}));
import { prepareCaseReferentRepair } from "../scripts/prepare-ask-case-referent-repair";

it.skipIf(!existsSync("work/local-ask-traces/2c2b118f-d7be-459d-83ae-95a6adad2f98.jsonl"))("captures the local-recorded bounded source correction after the scope guard overrides scripted approvals", async () => {
  const c = await prepareCaseReferentRepair(), p = JSON.parse(c.request.prompt);
  expect(c.request.maxOutputTokens).toBe(2200);
  expect(p.sections_to_write).toEqual(["hadith"]);
  expect(p.correction.reason_codes).toContain("case_referent_generalized");
  expect(p.correction.checker_findings.support_failures).toEqual(expect.arrayContaining([expect.objectContaining({ claim_id: "C4", code: "case_referent_generalized" })]));
  const original = c.pack.passages.find(p => p.id === "HE65936")!;
  if (original.source.kind !== "hadith") throw Error("source");
  expect(p.evidence_package.passages.find((s: any) => s.id === original.id).arabic).toBe(original.source.hadith.arabic);
});
