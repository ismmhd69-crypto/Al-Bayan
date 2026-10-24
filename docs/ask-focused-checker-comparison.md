# Ask focused-checker comparison

This compares **claim support**, using the request builders imported by Ask's actual rich and focused paths. It does not measure retrieval, full-answer usefulness, streaming speed or religious acceptance. It does not replace the six-question end-to-end comparison in Phase 8.

## Inputs and review

`scripts/evaluate-ask-focused.ts` prepares 96 cases:

- 72 existing faithful/incorrect pairs from the fixed claim-audit fixture, across English, Arabic and German.
- 24 variants of the recorded provision/context and causal-benefit failures, across those languages, with and without restrictive context.

The recorded fixture contains only public source fields from the failing request, with no visitor text, conversation history or credentials. New Arabic/German claims and all expectation labels require independent source/language review. These are evaluation inputs, never approved Ask answers.

The default small batch uses the recorded creation/provision pair in each language: six claims, twelve method requests before any configured fallback. `--all` selects all 96 cases and requires a correspondingly complete review record. It is not permission to exceed a spending ceiling.

Prepare a private report without environment loading, provider construction or model calls. Use a new output filename; existing reports cannot be overwritten:

```powershell
npx tsx --conditions=react-server scripts/evaluate-ask-focused.ts --dry-run --all --out=work/private-ask-evaluation/focused-preflight-new.json
```

For each selected input, a reviewer must assess its exact original, context, claim, attribution and target language. Record the input hash from the report, expected outcome, actual reviewer and review date. A live run requires an exact set of review entries. Pending fields, stale hashes, missing reviews and mismatched labels block calls.

Private review-file structure (this example deliberately remains unapproved):

```json
{
  "version": 1,
  "approvals": [{
    "id": "copy the selected case ID",
    "inputHash": "copy the exact input hash after reviewing that input",
    "expected": "reject",
    "sourceFaithfulness": "pending",
    "languageReview": "pending",
    "reviewer": "",
    "reviewedAt": ""
  }]
}
```

Do not mark fields reviewed merely to unblock the command. If a fixture label is wrong, resolve and re-freeze that input before evaluation; do not silently change the result expected of one method.

## Paid comparison boundary

Paid evaluation is still blocked by the existing unsettled shared reservation. No ledger reset or override is permitted. The supplied review file alone does not bypass this restriction.

After reconciliation and actual review, a run also requires an explicit `--max-usd` ceiling, at most $0.25, within the existing shared $1.50 cap. Conservative reservations must fit the run ceiling before each call, including provider fallbacks. Uncertain billing stops further calls. Current verifier model settings are preserved; actual response-model routes are recorded so a fallback comparison cannot silently masquerade as the same-model comparison.

No paid command has been executed as part of this preparation. A future reviewed command supplies `--review`, `--max-usd` and a fresh private `--out` path. Do not add unlimited retries or resume uncertain calls automatically.

## Reading the report

- A malformed response is **invalid**, not a successful semantic rejection.
- Uncertainty is distinct from an explicit unsupported verdict.
- A false approval and an unnecessary refusal are measured separately against reviewed labels.
- Missing cases and incomplete pairs cannot pass the designated sample check.
- Check actual matched response models, cost and timing; a sample result alone does not approve a model or release.
- A grounded quote proves correspondence to an original, not semantic entailment. Independently review the checker findings, particularly false approvals and causal/context claims.

Keep reports private under existing retention/access rules. Final source-faithfulness review, native-language review and Mo's acceptance remain separate.
