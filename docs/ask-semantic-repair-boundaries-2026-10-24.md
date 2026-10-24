# Preserve untouched source sentences during support corrections

## Implemented

Eligible source-support corrections now use the existing text-only patch mechanism. Code matches each finding to the exact current sentence, references and requirement before assigning replacement slots. Unflagged sentences retain their exact text, citation identities and question links. The model cannot append new slots, change citations or regenerate the full array for those groups.

This extends copy-repair protection to source-support and citation findings. Merge/contribution/layout repairs keep their existing path. Summaries retain their full synthesis path, especially when a source changes. Malformed, ambiguous, stale or mismatched feedback cannot lock a different sentence. Nothing is approved by preservation: all reconstructed claims still undergo normal source, context, meaning, coverage and final checks, including late withdrawal.

No source/question IDs, religious answers, new model, retry, privacy change, source-boundary change or spending reduction is introduced. Output allowances stay unchanged.

## Evidence and limits

The parents regression showed whole source sections regenerated in one coordinated correction. A Quran sentence acquired an unsupported phrase. However, both Quran sentences were themselves flagged for overlap, so the new narrow support-patch rule deliberately does **not** claim to prevent that specific Quran change.

The same trace has an exact eligible scholar support failure targeting its first sentence, while the second had no finding. Offline replay now locks the first edit slot and preserves the second sentence byte-for-byte. This demonstrates the general correction boundary, not religious approval of either sentence. The remaining overlap-repair path and semantic false approvals still need work.

A real-engine test demonstrates that the writer receives only the targeted slot, the stable sibling survives exactly, the replacement is checked, and the final answer still requires all normal verification. Negative controls cover stale wording, changed citations/requirements, unknown IDs, duplicate mappings, merge-required and missing findings. Existing full-envelope patch checks reject unauthorized edits rather than salvage them.

An existing experimental unsafe-writer test initially stopped injecting its unsafe text once the response changed from an array to a patch object. The test now injects the same defect into both shapes, preserving its intended late-rejection test; the safety assertion was not weakened.

## Status

**Implemented:** general source-support correction boundary in the active local code.

**Offline verified:** 53 initial focused tests in four files and TypeScript passed; after adapting the unsafe-writer fixture, 35 focused tests in four files and TypeScript passed. The subsequent full suite passed **1,679 tests in 159 files**, zero failures/skips. Ten immutable campaign ancestors and the original spending hash were verified unchanged; no active spending lock remains.

**Live verified:** pending. The parents attempt and failed copy-isolation component both predate this repair. No new paid call has been made to test it, and neither old result is relabelled as a success.

**Accepted:** mechanical preservation only. This does not fix the model's interpretation of all source conditions, establish useful complete answers or meet release/Mo acceptance. Goal stays open. No deployment or storage activation.
