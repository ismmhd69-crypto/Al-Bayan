import { expect, it } from "vitest";
import { snapshotSummaryChoices, selectedSummaryRequest, resolveSelectedSummary } from "@/lib/ask/selected-summary";
import type { Claim } from "@/lib/ask/checks";
const items: Claim[] = [
  { text: "A limited invented statement with its condition.", refs: ["source-a"], requirementId: "R1" },
  { text: "A different invented statement preserving uncertainty.", refs: ["source-b"], requirementId: "R2" },
];
const sources = { question: { requirements: [{ id: "R1" }, { id: "R2" }] }, passages: [{ id: "source-a", arabic: "نص تجريبي", surrounding_context: [{ arabic: "قيد باق" }] }] };
it("copies complete exact claims with their citations and requirements, without accepting generated wording", () => {
  const snap = snapshotSummaryChoices(items, sources, "An invented concern", "en");
  const result = resolveSelectedSummary({ selected_ids: ["E2", "E1"] }, snap, items, sources);
  expect(result.claims).toEqual([items[1], items[0]]);
  result.claims![0].refs.push("mutated-output-only");
  expect(snap.choices[1].refs).toEqual(["source-b"]); expect(items[1].refs).toEqual(["source-b"]);
  for (const raw of [{ selected_ids: ["E1"], text: "New religious consequence" }, { selected_ids: ["source-a"] }, { selected_ids: ["E1", "E1"] }, { selected_ids: [] }, ["E1"]]) {
    expect(resolveSelectedSummary(raw, snap, items, sources).error).toBe("summary_selection_invalid");
  }
  expect(selectedSummaryRequest(snap).maxOutputTokens).toBe(6600);
});
it.each(["original", "context", "requirements", "wording", "citation"])("refuses a selection after %s changes", change => {
  const current = structuredClone(items), pkg = structuredClone(sources), snap = snapshotSummaryChoices(items, sources, "Concern", "en");
  if (change === "original") pkg.passages[0].arabic += " changed";
  if (change === "context") pkg.passages[0].surrounding_context[0].arabic += " changed";
  if (change === "requirements") pkg.question.requirements.push({ id: "R3" });
  if (change === "wording") current[0].text += " Changed.";
  if (change === "citation") current[0].refs.push("other");
  expect(resolveSelectedSummary({ selected_ids: ["E1"] }, snap, current, pkg).error).toBe("summary_source_snapshot_changed");
});
it("can select four separately qualified concerns without merging or manufacturing a relation", () => {
  const four = Array.from({ length: 4 }, (_, i) => ({ text: `Independent invented point ${i + 1}, within its stated limit.`, refs: [`own-${i}`], requirementId: `R${i + 1}` }));
  const snap = snapshotSummaryChoices(four, sources, "Four concerns", "en");
  expect(resolveSelectedSummary({ selected_ids: ["E1", "E2", "E3", "E4"] }, snap, four, sources).claims).toEqual(four);
});
