# Comparing ranking with equal evidence access

This is a component comparison, not a claim that the repaired website answers reliably.

## What is held constant

Both methods receive the same frozen question frame, eligible candidate originals, source identities and restrictive context. They have the same downstream candidate limit, selection provider and selection rules. Current source permission validation remains a separate requirement before any live use.

- `concern_family_order`: the shared bounded concern/family pool supplies the first candidates without meaning scores.
- `meaning_ranked`: the actual pipeline meaning ranker scores the same original/context pool for each complete concern and applies the same candidate limit.

The order baseline deliberately isolates the ranking component. It is **not** the old website's upstream lexical discovery path or a measurement of the whole `ASK_MEANING_RANKING` switch. No default is changed by this tool.

Both outputs go through the actual shared evidence selector, with its implicit meaning-ranking callback disabled to prevent a second ranking pass. Authoritative originals are preserved, unknown/replacement candidates are rejected and no failed ranking silently falls back to the baseline. Run order can be counterbalanced. Counts, per-stage timing, logical ranking requests, selected identities and optional externally guarded cost deltas are recorded separately. No writer or whole-answer checker runs here.

The exact website reranker request builder is shared with preparation. Input/context hashes, equal-cap checks and code fingerprints make changed inputs distinguishable from changed ranking behaviour.

## What the numbers can establish

Without exact-input source/language review, retention and accuracy remain unmeasured. Reviewed contribution labels may identify complete alternative sets of excerpts: every excerpt in one alternative is needed together. A qualification can be a separate necessary unit.

The retention reader distinguishes:

- A necessary unit missing from the frozen candidate pool.
- A unit present in that pool but removed by ranking.
- A unit passed to selection but absent from its selected sources.
- A unit whose complete source set survives.

A pool gap cannot distinguish missing corpus content from a discovery failure. Surviving source identities do not prove supported wording, preserved qualifications, a useful explanation or answer completeness. These require the independent support/quality checks and full reviewed evaluation. A model's ready selection is not acceptance.

## Offline preflight

```powershell
npx tsx --conditions=react-server scripts/prepare-ask-matched-ranking.ts --dry-run --input=work/private-ask-evaluation/matched-ranking-inputs-20261022.json --out=work/private-ask-evaluation/a-new-ranking-preflight.json
```

The CLI requires explicit dry-run mode and has no paid mode. It does not load environment files, construct providers, contact services or alter the ledger. It enumerates the actual ranking requests and saves hashes only; placeholder zero scores are used solely to traverse request preparation and are never presented as ranking measurements. Existing reports cannot be overwritten.

The saved final preflight is `work/private-ask-evaluation/matched-ranking-preflight-20261022-final.json`. It covers six component inputs: the existing multilingual purpose-of-worship question with/without recorded restrictive context. These are **one subject across three languages and two context variants**, not six unrelated or held-out questions. Source fields come from the existing public-source regression fixture; framing is drafted and is not a replay of the original question-understanding model. Labels and fresh permission checks remain pending. Six request contracts were prepared, with zero model calls, zero cost and no semantic verdicts.

## Remaining live gate

The reusable comparison function accepts injected providers/rankers; it constructs none and performs no retries. A future live driver must first reconcile billing, install the shared spend guard, bound the batch, verify reviewed exact inputs/current permissions and record real routes/cost. There is no new CLI path that bypasses the reservation. Broader reviewed questions, held-out wording, corpus discovery comparisons and complete-answer evaluation are still required before deciding whether ranking's benefit justifies its latency/cost.

The 30% earlier-first-section target remains an end-to-end patient-streaming measure. This ranking preparation has not measured or met it.
