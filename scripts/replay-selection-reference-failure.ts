// Private offline identity/control-flow replay. Never imported by the website.
import { readFileSync, copyFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { resolveSelectionReferences, SELECTION_REFERENCE_CONTRACT } from "../lib/ask/selection-references";
import type { PassageForSelection } from "../lib/ask/retrieval";

const name = "c9b762e8-4651-45d5-adb0-88c86c41137a";
const file = resolve(`work/local-ask-traces/${name}.jsonl`), content = readFileSync(file, "utf8");
const events = content.trim().split(/\r?\n/).map(l => JSON.parse(l));
let input = events.find(e => e.event === "model_request" && e.data.call_id === "A20")?.data.prompt;
if (typeof input === "string") input = JSON.parse(input);
const selection = events.find(e => e.event === "model_response" && e.data.call_id === "A20")?.data.value;
if (!input || !selection) throw Error("recorded_selection_missing");
const items = input.candidates.map((c: any) => ({ id: c.source.id })) as PassageForSelection[];
const ids = items.map(p => p.id), bad = selection.assessments.filter((a: any) => !ids.includes(a.source_id));
const absent = ids.filter(id => !selection.assessments.some((a: any) => a.source_id === id));
if (bad.length !== 1 || absent.length !== 1) throw Error("captured_identity_failure_not_reproduced");
// Explicit offline counterfactual: the one unmatched recorded row selects the
// one unassessed candidate's fixed reference. No production ID salvage exists.
const wire = { ...selection, selection_contract: SELECTION_REFERENCE_CONTRACT,
  assessments: selection.assessments.map(({ source_id, ...fields }: any) => ({ ...fields, source_ref: `P${ids.indexOf(ids.includes(source_id) ? source_id : absent[0]) + 1}` })) };
const resolved: any = resolveSelectionReferences(wire, items);
const semantics = (a: any) => { const { source_id: _id, source_ref: _ref, ...fields } = a; return JSON.stringify(fields); };
if (!resolved || resolved.assessments.some((a: any, i: number) => semantics(a) !== semantics(selection.assessments[i]))) throw Error("recorded_decisions_changed");
const broken = structuredClone(wire); broken.assessments[0].source_ref = "P999";
if (resolveSelectionReferences(broken, items) !== null) throw Error("unknown_reference_accepted");
const combined = events.find(e => e.event === "model_response" && e.data.call_id === "A21")?.data.value;
const directory = resolve("work/private-ask-evaluation/reliability-20261026/frozen-failures");
mkdirSync(directory, { recursive: true });
for (const id of [name, "b7275d93-e7a5-415d-a247-c921785eb50a", "68c3aa8a-6f08-4b5d-aebf-3c3def2a17df", "13da27e4-0d49-48d9-a9ce-c74feedbe74d"]) copyFileSync(resolve(`work/local-ask-traces/${id}.jsonl`), resolve(directory, `${id}.jsonl`));
console.log(JSON.stringify({ malformedRecordedIds: bad.length, fixedReferencesResolve: true, recordedSupportDecisionsUnchanged: true, unknownReferencesStillRejected: true,
  oldPrewritingGate: combined?.status, oldGateDirectContributions: combined?.assessments.filter((a: any) => a.relevance === "direct").length,
  originalTraceSha256: createHash("sha256").update(content).digest("hex"), counterfactualIdentityReplayOnly: true, liveCalls: 0 }));
