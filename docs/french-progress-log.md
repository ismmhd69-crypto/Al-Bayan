# French support progress log

Scope: private local preparation only. French remains absent from public locale allowlists, routes, and APIs. No source text, existing translations, publication state, or database schema may be changed. Translation drafts must not be marked human-reviewed.

## 2026-10-29: Phase 0 inventory

- Git status was inspected first. The shared checkout already contains unrelated active Quran and hadith reader edits, tests, and German translation exports. Those files are protected and are not part of this work.
- Existing French files or records: none found in the repository; the live source translation inventory returned 0 French rows.
- Live source totals, including unpublished sources: 14,629 hadiths and 7,388 fatwas. The current inventory is saved in `data/french-batches/source-inventory.json`, grouped by kind, collection, scholar, and source publication status.
- Live French coverage: 0 saved drafts, 0 structurally validated, 0 human-reviewed, 0 published, 22,017 missing.
- Website source inventory: 32 New to Islam lessons, 21 Hard Questions articles, and 44 prepared answers (32 common plus 12 topic answers). No French website translation assets exist.
- Visitor-facing location inventory is not yet complete. The website's dictionaries are `dictionaries/ar.ts`, `dictionaries/en.ts`, and `dictionaries/de.ts`; text also appears in learning-content JSON, prepared-answer JSON, route metadata, reader and Ask components, accessibility attributes, and API responses. Phase 1 must finish a code-level sweep before declaring parity.
- Current launch locale check: `activeLocales` remains `ar` and `en`. German files and existing German batch artifacts are preserved.
- Existing German exporters are not reused: they hard-code `de`, export into `data/german-batches`, and the hadith exporter omits source publication state and source hashes. Existing insert tooling writes English and German rows, so it is not safe for a French batch.
- Database blocker: the live `public.source_translations.lang` constraint only accepts `ar`, `en`, and `de`. The task forbids schema changes. Therefore French drafts cannot currently be inserted into Supabase. No database write was attempted. Local website work may continue; library database drafting remains blocked unless the schema constraint is separately changed later.
- French batch manifest: `data/french-batches/manifest.json`.

### Batch ledger

| Batch | IDs / scope | Translated | Inserted | Preserved | Validation | Remaining | Status |
|---|---|---:|---:|---:|---|---:|---|
| FR-P0-INVENTORY | All source kinds, collections, scholars, and publication states | 0 | 0 | 0 | Live read-only counts recorded; French rows 0 | 22,017 source translations | Complete |
| FR-UI-001 | Interface dictionary keys `meta.title` through `home.how1t` | 25 | 0 | 0 | Key/source parity, nonempty French, and placeholder parity passed | 274 interface strings; 97 learning items | Local draft saved |
| FR-UI-002 | Interface dictionary keys `home.how1` through `ask.notFatwa` | 25 | 0 | 0 | Key/source parity, nonempty French, and placeholder parity passed | 274 interface strings; 97 learning items | Local draft saved |
| FR-UI-003 | Interface dictionary keys `ask.error` through `ask.v2.views.position_a` | 25 | 0 | 0 | Key/source parity, nonempty French, and placeholder parity passed; valid French loanwords retained | 249 interface strings; 97 learning items | Local draft saved |

### Needs Mo

- `DB-FR-LANG-CHECK`: database French drafts are blocked by the existing language check constraint. No schema change is authorized.
