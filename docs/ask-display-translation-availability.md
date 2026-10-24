# Ask display translations: availability and matching

Checked: 22 October 2026, Istanbul time. No database writes, publication changes or paid model requests.

## Confirmed availability

The read-only report is `work/private-ask-evaluation/display-translation-availability-2026-10-21T23-26-39-939Z.json`.

| Stored material attached to published fatwas | English | German |
|---|---:|---:|
| Unpublished translation rows | 7,255 | 7,255 |
| Published translation rows | 0 | 0 |

There are 7,255 published fatwa source rows. Translation figures are row counts, not distinct-source coverage or proof that the translations faithfully match their originals. No original/translation text, visitor questions or credentials are copied into this report.

The rich lookup reads published candidates only. Therefore absent display translations are primarily an availability/publication gap, not proof that the scholarly original or its checked explanation is missing. Repairing lookup cannot make unpublished drafts eligible for display. Existing draft text has not been approved or published by this work.

## Matching repairs

- Match the named scholar, canonical official page and exact Arabic excerpt. IDs are lookup aids, never sufficient proof of identity.
- Use the existing canonical numeric-page rule for changed Ibn Baz presentation slugs. No religious topic, fatwa answer or reference hint is hardcoded. Other source families retain exact-page identity; unsupported aliases are not guessed.
- Consider all matching excerpt records rather than whichever database row arrives first.
- Reject defective published text/review metadata, conflicting same-version translations and truncated batches instead of treating them as missing or selecting by row order.
- Preserve published-only reads, target language, origin labels and independent exact-original alignment checks. Missing translations remain independent from the support of an explanation.

The real adapter performed read-only source and translation queries for one stored excerpt in English/German and a synthetic same-page presentation alias. The alias exercises matching only; it is not asserted to exist or saved as a citation. All three probes correctly returned unavailable. The report shows source matching reached the translation table, including the page-pattern fallback, without generating or publishing text.

Positive attachment, conflicting-row and wrong-excerpt scenarios are offline/scripted verification. No live positive attachment or source-faithfulness result is claimed while the eligible published pool is empty.

## Preparation still required

The existing exporter marks a source done when both translation rows exist, regardless of publication/review availability. Consequently, repeating that export will not repair this gap: these drafts already exist. Preparation must distinguish drafted, exact-original-bound, checked, reviewed and display-eligible material, and preserve source rights and human acceptance separately.

A separate bounded review preparer now uses exact source identities, current original fingerprints, language, translation version and provenance. Old rows do not prove which source revision originally produced them. Compare against the exact current excerpt before any acceptance; do not backfill an invented creation receipt. Do not use `SHOW_AI_TRANSLATIONS` or a bulk publication update to bypass this work. No paid translation generation on ordinary questions is introduced.

## Preparing existing drafts for review

```powershell
npx tsx --conditions=react-server scripts/prepare-ask-translation-review.ts --read-only --size=6
```

This reads a bounded page through the existing permission-filtered source reader, exports eligible short original excerpts and existing translation candidates to private `work/private-ask-evaluation/translation-review`, and revalidates source fingerprints/permissions before writing. Size is limited to twenty sources. An optional `--after=<source UUID>` continues from the report's `nextAfter`; no topic-specific source list is used. The sources must remain published and eligible under the current search/AI-processing and quote limits. The script does not infer embedding rights.

Each packet contains the exact Arabic original and current hash, source/rights fingerprint, candidate text hash, language, version and claimed provenance. Missing languages remain missing. The packet explicitly records that the original used when an old translation was created is unrecorded. Claimed human review is preserved as unverified metadata, not converted into this packet's acceptance. All checks remain pending and every item is marked not display-eligible. Publication facts are recorded separately; no row is published or unpublished by the exporter.

A human-readable companion preserves Arabic/English/German text literally as fenced data. A packet checksum detects accidental input changes; it is not a signature or proof of faithfulness. No website route imports these packets or treats their presence as approval. The older untranslated-source exporter remains available for its legacy purpose; the new preparer avoids its mistake of considering existing bilingual drafts completed display work.

The first read-only batch, `packet-2026-10-21T23-30-55-226Z.json`, contains six eligible source excerpts and twelve existing draft candidates, no missing candidates, and a successful immediate source revalidation. Its companion is `review-2026-10-21T23-30-55-226Z.md`. Both are private and unreviewed. No paid model call, new translation or publication occurred. This is a prepared review batch, not twelve accepted translations.

Source-faithfulness and native-language review, eligible prepared translations and Mo's acceptance remain open. No database migration or approval policy changed.

## Reproduce the read-only audit

```powershell
npx tsx --conditions=react-server scripts/audit-ask-display-translations.ts --read-only
```

The script permits only GET/HEAD requests to the configured project, writes a new private metadata report and never performs inference. It does not export full translation text or provide an import/publication command.

Implementation uses the documented [Supabase membership filter](https://supabase.com/docs/reference/javascript/in) and [pattern filter](https://supabase.com/docs/reference/javascript/like). API compatibility and read-only results are separate from religious and language review.
