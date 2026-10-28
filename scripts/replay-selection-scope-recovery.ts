// Read-only diagnosis of two saved private responses. No provider calls.
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";
import { patientSelectionNeedsReassessment } from "../lib/ask/patient-models";
for (const [id, call] of [["fec9a98b-581c-4bf3-abc4-d67e7d2a3631", "A2"], ["dc12ceb2-5109-4c8d-b1af-4e330ac9c688", "A3"]]) {
  const rows = readFileSync(`work/local-ask-traces/${id}.jsonl`, "utf8").trim().split(/\r?\n/u).map(s => JSON.parse(s));
  const response = rows.find(r => r.event === "model_response" && r.data.call_id === call)?.data.value;
  assert.ok(response?.assessments?.some((a: any) => a.relevance === "direct" && a.contribution?.role !== "direct"));
  assert.ok(rows.some(r => r.event === "stage" && r.data.code === "patient_selection_source_scope_mismatch"));
  assert.ok(patientSelectionNeedsReassessment("source_scope_mismatch"));
}
console.log("Both saved scope mismatches reproduced; the recovery path is covered by scripted pipeline tests. No provider calls.");
