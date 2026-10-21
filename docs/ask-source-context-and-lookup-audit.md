# Ask source-context and lookup audit

21 October 2026. Shared local repairs; no model calls, deployment, approvals or
remote database writes. The full search-engine objective remains incomplete.

## Evidence and repairs

The existing private pilot contains twenty stored hadith parents and twenty
scholarly excerpts. Its source originals, attribution and current eligibility
were revalidated through the existing read-only Bayan metadata reader before the
audit. This bounded sample is not a representative accuracy benchmark.

Three hadith parents had a saved `context.complete: true` even though their text
depends on an earlier report. The previous detector limited reference matching
to short text and omitted forms such as `نحو حديث` and `بالإسنادين`. Its loose
40-character name-to-verb match could mistake a statement about narrators for
new prophetic wording. A long chain therefore masked an unresolved antecedent.

The affected references are [Muslim 278e](https://sunnah.com/muslim:278e),
[Muslim 1343b](https://sunnah.com/muslim:1343b) and
[Muslim 2830b](https://sunnah.com/muslim:2830b). Their official pages were also
inspected: they describe earlier narration/variant relationships. This is a
context finding, not a new authenticity grade or religious interpretation.

`assessHadithContext` now returns an explicit structural finding independent of
chain length. It recognises named-report references and dependent variants,
without treating a nearby narrator verb as new prophetic speech. Fresh explicit
speech or observed action after a chain pointer can supply actual wording.
Comparisons inside a supplied complete quote are not treated as chain references.
No-dependency-detected is deliberately not a guarantee of complete context.

Source preparation marks detected dependent entries incomplete. More importantly,
`mapStoredHadith` rechecks the original whenever a library result is mapped.
Consequently a legacy generation's stale complete flag, an explicit source-ID
lookup, saved-chat hydration and durable replay cannot bypass the new check.
Corpus parent reconstruction uses that same mapper. An unresolved antecedent is
not guessed, concatenated with a nearby item or silently upgraded to evidence.
The report remains available for corpus discovery; standalone evidence use waits
for eligible exact context.

The second defect came from raw lookup tokenisation. English questions containing
the word Quran retrieved the same Arabic report because its original contained
the technical `[quran ...]` markup tag. That tag's name/attribute numbers are not
the report's religious teaching. `searchTokens` now masks only the recognised tag,
retains the enclosed verse words and normalises the lookup copy. Original bytes,
hashes, evidence checks and displayed source wording remain unchanged.

Persistent generations pin `source-lookup-v2` separately from the embedding
model/recipe. The prepared SQL and TypeScript boundary reject another lookup
revision. This prevents a future deployment from querying stale unmasked lexical
documents under the new code. Filesystem lexical ranking is recomputed from its
originals and does not silently change a stored vector's model recipe.

## Actual component probe

`npm run ask:benchmark:probe` applies the fixed benchmark wording to the existing
forty-passage lexical pilot, without topic-specific reference hints, embeddings,
query reformulation, source-derived queries or answer generation. Each word is
retained within the existing query bounds; oversized input fails rather than
silently losing text. Parent candidates pass through the actual shared mapper.

The initial diagnostic ran all 100 intents in three languages. Its private
baseline was preserved before changing lookup tokenisation. Subsequent diagnostics
default to the 75 tuning intents (225 versions); including the other 25 requires
an explicit `--include-held-out` option. The initial diagnostic exposed search
results for the draft held-out set. That exposure is recorded rather than
presenting a later tuned run as untouched held-out acceptance. A genuinely unseen
collection and frozen configuration remain required for release evaluation.

For the **same 75 tuning questions per language**, discovery produced:

| Language | Before masking tag metadata | After masking tag metadata |
|---|---:|---:|
| Arabic | 74 | 74 |
| English | 11 | 1 |
| German | 1 | 1 |

These are candidate-presence counts, **not correct-answer counts or recall**.
The removed English matches were through formatting metadata. The remaining
matches still need relevance/support review. Having no candidate in this tiny
pilot does not establish absence in the full library. This component does not
run the website's understanding, Arabic reformulation, live connectors, selector,
writer or checker. It cannot be reported as production performance.

All 100 source-review labels remain pending. The report therefore records zero
measured reviewed versions and `recall: null`; no accuracy percentage is invented.
Permissions for real embedding generation, the missing spending receipt, real
multilingual model comparison, independent source/native-language review and Mo's
acceptance remain open.

Private evidence files contain IDs, hashes and diagnostic states, not source
originals, visitor questions or credentials:

- `work/private-ask-evaluation/source-context-audit.json`
- `work/private-ask-evaluation/search-benchmark-component-baseline-20261021.json`
- `work/private-ask-evaluation/search-benchmark-component-probe.json`

`npm run ask:index:context` refreshes the context audit only while the pilot is
retained and currently eligible; it refuses a missing token or expired generation.
It does not rewrite the index or change publication/permission decisions.

## Checks and remaining limits

Regression checks cover long/short reference-only text, quoted variants, new
speech/action after a chain pointer, comparisons within actual wording, legacy
complete flags, ID-based/saved-source loading, unmodified originals and tags,
all 300 fixed query wordings, persistent lookup-version refusal and real SQL
lexical storage. Fourteen local PostgreSQL/pgvector scenario groups passed.

The full suite passed 1,075 tests across 90 files with two workers; whole-project
type checking passed. An earlier full run, concurrent with local PostgreSQL
verification, hit the existing five-second spending-ledger disk-flush test timeout.
That file passed unchanged in the focused run, and the complete suite passed with
less concurrency. Neither the timeout nor the accounting assertions was weakened.

The structural detector is conservative and incomplete. Exact antecedent linking,
representative false-exclusion review and the wider context/source-faithfulness
benchmark remain required. No religious conclusion is approved by this detector,
and this work does not replace the missing real multilingual retrieval evaluation.
