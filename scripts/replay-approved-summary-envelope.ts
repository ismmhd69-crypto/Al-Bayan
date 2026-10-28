// Replay only the captured approved wording and envelope, with zero model calls.
import { readFileSync, mkdirSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { validRichAnswer, RICH_ORDER, type RichSection } from "../lib/ask/rich-answer";

const id = "b0007d6d-ea6b-44d6-ac65-a422a469dfeb";
const file = resolve(`work/local-ask-traces/${id}.jsonl`), content = readFileSync(file, "utf8");
const rows = content.trim().split(/\r?\n/).map(l => JSON.parse(l));
const terminal = rows.find(r => r.event === "terminal_result")?.data;
const draft = rows.find(r => r.event === "model_response" && r.data.call_id === "A11")?.data.value;
let request = rows.find(r => r.event === "model_request" && r.data.call_id === "A11")?.data.prompt;
if (typeof request === "string") request = JSON.parse(request);
const primary = rows.find(r => r.event === "model_response" && r.data.call_id === "A12")?.data.value;
const meaning = rows.find(r => r.event === "model_response" && r.data.call_id === "A13")?.data.value;
if (terminal?.status !== "incomplete" || primary?.complete_coverage !== "yes" || meaning?.claims?.C1?.verdict !== "yes") throw Error("approved_summary_failure_not_captured");
const ready = terminal.sections.filter((s: RichSection) => s.outcome === "ready");
const patch = draft.summary.P0, refs = patch.source_refs.map((ref: string) => request.correction.summary_citation_choices.find((c: any) => c.reference === ref)?.id);
if (refs.some((ref: unknown) => typeof ref !== "string")) throw Error("recorded_reference_missing");
const summary: RichSection = { group: "summary", outcome: "ready", claims: [{ text: patch.text, refs, requirementId: "R1" }],
  sources: ready.flatMap((s: RichSection) => s.sources).filter((s: any) => refs.includes(s.id)) };
const before = { version: 4, language: "en", review: "automatic", complete: true, sections: [...ready, summary] };
const after = { ...before, sections: RICH_ORDER.map(group => group === "summary" ? summary : terminal.sections.find((s: RichSection) => s.group === group)) };
if (validRichAnswer(before) || !validRichAnswer(after)) throw Error("envelope_failure_not_reproduced");
const directory = resolve("work/private-ask-evaluation/reliability-20261026/frozen-failures");
mkdirSync(directory, { recursive: true }); copyFileSync(file, resolve(directory, `${id}.jsonl`));
console.log(JSON.stringify({ oldEnvelopeRejected: true, completeEnvelopeAccepted: true, recordedSummaryUnchanged: true, sourceOutcomesUnchanged: true,
  sourceGroupsPresent: ready.map((s: RichSection) => s.group), originalTraceSha256: createHash("sha256").update(content).digest("hex"), liveCalls: 0 }));
