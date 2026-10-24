import { expect, it } from "vitest";
import { applyTextOnlyPatch, textOnlyPatchSchema, sourceSupportTextPatch } from "@/lib/ask/text-only-patch";
import { structuredOutputContract } from "@/lib/ai/structured-output";

const patch = { original: [
  { text: "An untouched explanation.", source_ids: ["Q1"], requirement_id: "R1" },
  { text: "An explanation needing different wording.", source_ids: ["H1"], requirement_id: "R2" },
], indices: [1] };
it("locks references, concern identity and sibling wording while changing only requested text", () => {
  const edited = "The same supported meaning expressed differently.";
  expect(applyTextOnlyPatch({ P1: { text: edited } }, patch)).toEqual([patch.original[0], { ...patch.original[1], text: edited }]);
  expect(patch.original[1].text).toBe("An explanation needing different wording.");
});
it.each([
  { P1: { text: "Text", requirement_id: "R1" } },
  { P1: { text: "Text", source_ids: ["Q1"] } },
  { P0: { text: "Unrequested" }, P1: { text: "Text" } },
  {}, [{ text: "An old full claim array." }], { P1: { text: null } },
])("rejects malformed or expanded patches as a whole", input => {
  expect(applyTextOnlyPatch(input, patch)).toBeNull();
  expect(structuredOutputContract({ type: "object", properties: { hadith: textOnlyPatchSchema(patch) }, required: ["hadith"] }).parse(JSON.stringify({ hadith: input }))).toBeNull();
});

const sourceItems = [
  { text: "First stable explanation.", refs: ["Q1"], requirementId: "R1" },
  { text: "Second explanation needs a condition.", refs: ["Q1"], requirementId: "R2" },
];
const feedback = () => ({ claims: sourceItems.map((c, i) => ({ claim_id: `C${i + 1}`, text: c.text, source_ids: c.refs, requirement_id: c.requirementId })),
  support_failures: [{ claim_id: "C2", explanation: "A condition was omitted." }], citation_failures: [], contribution_failures: [] });
it("locks an eligible semantic correction to its exact failed claim and preserves its siblings", () => {
  const planned = sourceSupportTextPatch(sourceItems, feedback(), ["Q1"]);
  expect(planned?.indices).toEqual([1]);
  expect(applyTextOnlyPatch({ P1: { text: "Second explanation with its condition." } }, planned!)).toEqual([
    { text: sourceItems[0].text, source_ids: ["Q1"], requirement_id: "R1" },
    { text: "Second explanation with its condition.", source_ids: ["Q1"], requirement_id: "R2" },
  ]);
});
it.each(["stale_text", "changed_citation", "changed_requirement", "unknown_failure", "duplicate_claim", "merge_needed", "no_finding"])("does not construct a wrong semantic patch for %s", mode => {
  const f: any = feedback();
  if (mode === "stale_text") f.claims[1].text = "A different draft";
  if (mode === "changed_citation") f.claims[1].source_ids = ["Q2"];
  if (mode === "changed_requirement") f.claims[1].requirement_id = "R3";
  if (mode === "unknown_failure") f.support_failures[0].claim_id = "C99";
  if (mode === "duplicate_claim") f.claims.push(f.claims[1]);
  if (mode === "merge_needed") f.contribution_failures.push({ claim_id: "C2", duplicates: ["C1"] });
  if (mode === "no_finding") f.support_failures = [];
  expect(sourceSupportTextPatch(sourceItems, f, ["Q1"])).toBeNull();
});
it("does not borrow another group's negative finding or expose an uncited identity", () => {
  const f = feedback(); f.support_failures[0].claim_id = "C1";
  expect(sourceSupportTextPatch([sourceItems[1]], f, ["Q1"])).toBeNull();
  expect(sourceSupportTextPatch(sourceItems, feedback(), ["Q2"])).toBeNull();
});
