# Ask evaluation: missing receipt and recovery

Checked 20 October 2026. Status: the existing paid-evaluation hold remains active. This work did not reset or modify the shared ledger and made no model or billing API request.

## Current evidence

`npm run ask:spend:inspect` reads the original checkout's shared ledger, including from a Git worktree. It loads no environment secrets and makes no network request. On this check it reported:

| Item | Recorded amount or status |
|---|---|
| Entries | 266 |
| Known charges | $0.51748087 |
| Unresolved reservation | $0.113472 |
| Conservative exposure | $0.63095287 |
| Existing hard cap | $1.50 |
| Unresolved request | `google/gemini-3.1-flash-lite`, 4 October 2026 at 11:17:30.244 UTC |
| Generation ID / request fingerprint / HTTP status | None recorded for this attempt |
| Permission to start another paid evaluation | Blocked |

The ledger's SHA-256 remains `FA92584AB52E6EC22A25D6A9C3C0C3412C5392CFBDEFC747EBD5010EA85844B7`.

The retained `repaired-1.json` report finishes at 11:17:30.625 UTC and contains receipts for earlier successful calls, but no generation receipt linked to the unresolved entry. Its earlier IDs are not substitutes for the missing ID. No assumption about zero charge follows from the interrupted response or missing local receipt.

## What can resolve the old entry

The exact provider-side attempt and final charge are required. An identified generation can be checked through OpenRouter's [generation metadata API](https://openrouter.ai/docs/api/api-reference/generations/get-generation). That read requires a generation ID; guessing an adjacent generation or matching only time/model is insufficient. The [Activity dashboard](https://openrouter.ai/activity) provides request details after sign-in, as described in OpenRouter's [dashboard guide](https://openrouter.ai/blog/announcements/activity-dashboard/).

Mo has been asked for the generation ID of the relevant request around 14:17:30 Istanbul time / 11:17:30 UTC on 4 October. Never request an API key in chat. An unavailable dashboard row is not automatically proof of zero charge. A request ID or export may help identify the attempt, but a matching final billing receipt still needs verification before accounting changes. No tool added here automatically clears the stop, assigns an estimated cost, starts another run or changes the cap.

### Supplied ID checked against the provider

Mo supplied `gen-1791112635-iBGCogc0ND4IBR65J10P`. A GET-only generation metadata request on 20 October confirmed a Mistral Small 3.2 request at `2026-10-04T11:17:15.109Z`, final charge `$0.00094047`, completed normally. It matches the already recorded receipt at `repaired-1.json`, row 10 / call 3. OpenRouter's canonical model identifier includes the `-2506` suffix, while the saved request used its shorter Mistral alias. This is not the unresolved Gemini 3.1 Flash Lite request reserved about 15 seconds later. The supplied receipt was not applied to that entry. No model was invoked and the original ledger hash remains unchanged. The bounded private metadata receipt is `work/private-ask-evaluation/supplied-generation-receipt.json`; prompts and credentials were not saved or printed.

## Preventing loss of future receipts

The evaluation-only spending guard now:

- Writes a fingerprint of the exact outgoing JSON request, including enforced price settings, with the reservation before sending. It stores no messages, headers or key bytes.
- Captures available HTTP status, provider request ID and response time as soon as a response arrives. A malformed body therefore does not erase the available header metadata.
- Records the returned generation ID before validating cost. A missing or unexpected cost still stops evaluation, but the generation ID remains available for reconciliation.
- Writes through a private temporary file, flushes it, then replaces the ledger while holding the existing exclusive lock. Failed sends retain the reservation. This is local process-level crash protection, not a claim of storage durability across every power or filesystem failure.
- Rejects invalid, negative or above-reservation recorded charges instead of treating them as extra budget.

The new inspector reports only aggregate accounting data and missing-evidence states. It never prints prompt bodies, tokens, provider response content or secrets. Its `mayStartPaidEvaluation` field reports only the spending gate; source, permissions, methodology and review gates still apply.

Offline regression checks use temporary ledgers and mocked provider responses. They cover receipt-before-stop ordering, malformed responses, unknown cost, secret/prompt exclusion, unchanged hard caps and read-only hold inspection. The old shared ledger remains untouched. The production worker's encrypted attempt journal already captures known IDs/responses independently; these changes improve the separate local evaluation guard and do not deploy new billing behaviour.
