import { expect, it } from "vitest";
import { applyTextOnlyPatch, textOnlyPatchSchema } from "@/lib/ask/text-only-patch";
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
