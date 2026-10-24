import { expect, it } from "vitest";
import { conditionInventoryRequest, parseConditionInventory, conditionMatchRequest, parseConditionMatch } from "../scripts/ask-independent-conditions-experiment";
import { structuredOutputContract } from "@/lib/ai/structured-output";

const sources = [{ id: "S1", arabic: "Approve only when a form is signed and the fee is paid." }];
const extracted = { E1: { scan_complete: "yes", limits: ["when a form is signed", "the fee is paid"] } };
const inventory = parseConditionInventory(extracted, sources)!;
const items = [{ text: "Approval requires a paid fee.", refs: ["S1"] }];
const review = { C1: { E1L1: { applies: "yes", preserved: "no", explanation: "The signed form prerequisite is missing." }, E1L2: { applies: "yes", preserved: "yes", explanation: "" } } };
it("extracts source conditions without providing a draft or visitor question", () => {
  const req = conditionInventoryRequest(sources, new AbortController().signal);
  expect(Object.keys(JSON.parse(req.prompt))).toEqual(["stage", "originals"]);
  expect(req.prompt).not.toContain(items[0].text);
  expect(structuredOutputContract(req.schema).parse(JSON.stringify(extracted))).not.toBeNull();
});
it("requires every independent condition rather than crediting the preserved sibling", () => {
  expect(parseConditionMatch(review, items, inventory)?.failures).toHaveLength(1);
  const req = conditionMatchRequest(items, inventory, new AbortController().signal);
  expect(structuredOutputContract(req.schema).parse(JSON.stringify(review))).not.toBeNull();
});
it.each(["missing", "invented excerpt", "unfinished scan"])("refuses an invalid original inventory: %s", variant => {
  const raw = structuredClone(extracted);
  if (variant === "invented excerpt") raw.E1.limits[0] = "approval from a supervisor";
  if (variant === "unfinished scan") raw.E1.scan_complete = "unsure";
  expect(parseConditionInventory(variant === "missing" ? {} : raw, sources)).toBeNull();
});
it("rejects missing, unknown and uncertain condition accounts", () => {
  const raw = structuredClone(review); delete (raw.C1 as Partial<typeof raw.C1>).E1L1;
  expect(parseConditionMatch(raw, items, inventory)).toBeNull();
  expect(parseConditionMatch(review, [{ ...items[0], refs: ["S2"] }], inventory)).toBeNull();
  const uncertain = structuredClone(review); uncertain.C1.E1L1.applies = "unsure";
  expect(parseConditionMatch(uncertain, items, inventory)?.safeIds).toEqual([]);
});
it("does not treat a different teaching as subject to an unrelated requirement", () => {
  const raw = structuredClone(review);
  for (const row of Object.values(raw.C1)) { row.applies = "no"; row.preserved = "no"; row.explanation = "The claim concerns how to request a form, not its approval."; }
  expect(parseConditionMatch(raw, [{ text: "Request the form from the office.", refs: ["S1"] }], inventory)?.safeIds).toEqual(["C1"]);
});
