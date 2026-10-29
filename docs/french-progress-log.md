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
- The 324 leaf strings in the current English interface dictionary have now been translated into 13 private French batches and assembled into `dictionaries/fr.ts`. Each batch passed exact key/source, nonempty-text, and placeholder checks. This dictionary is used only by the guarded local preview; it is not connected to locale routing, public navigation, or APIs.
- The code-level scan found additional visible hard-coded copy in pages, reader controls, and Ask/error/reconnect flows. Those locations are not included in the 324 dictionary strings and are still being inventoried.
- A local preview route now exists at `/dev/french-preview`. Proxy and page guards allow it only in development on a loopback host, and the Ask submission is disabled. It is a copy preview, not a connected French Ask experience. The route has not been opened in a browser.
- A project-wide TypeScript check was attempted after adding the preview route. It stopped on four TS7053 errors in the pre-existing uncommitted German helper `scripts/check-local-german.ts`; it reported no errors in the new French files. The German helper remains untouched.
- Additional Ask status, reconnect, cancellation, evidence, unavailable-translation, and incomplete-answer copy: all 93 strings in `lib/ask/rich-text.ts` are translated in four local batches and assembled to `lib/ask/rich-text-fr.ts`. Key/source parity, placeholder parity, nonempty text, no duplicate/missing keys, and the 25-entry batch limit passed. This French copy appears only in the loopback-only development preview; the live Ask flow and API locale guard are unchanged. Human review: 0; published: 0.

### Batch ledger

| Batch | IDs / scope | Translated | Inserted | Preserved | Validation | Remaining | Status |
|---|---|---:|---:|---:|---|---:|---|
| FR-P0-INVENTORY | All source kinds, collections, scholars, and publication states | 0 | 0 | 0 | Live read-only counts recorded; French rows 0 | 22,017 source translations | Complete |
| FR-UI-001 | Interface dictionary keys `meta.title` through `home.how1t` | 25 | 0 | 0 | Key/source parity, nonempty French, and placeholder parity passed | 274 interface strings; 97 learning items | Local draft saved |
| FR-UI-002 | Interface dictionary keys `home.how1` through `ask.notFatwa` | 25 | 0 | 0 | Key/source parity, nonempty French, and placeholder parity passed | 274 interface strings; 97 learning items | Local draft saved |
| FR-UI-003 | Interface dictionary keys `ask.error` through `ask.v2.views.position_a` | 25 | 0 | 0 | Key/source parity, nonempty French, and placeholder parity passed; valid French loanwords retained | 249 interface strings; 97 learning items | Local draft saved |
| FR-UI-004 | Interface dictionary keys `ask.v2.views.position_b` through `ask.scholarShort.permanent-committee` | 25 | 0 | 0 | Key/source parity, nonempty French, and placeholder parity passed; established scholar names retained | 224 interface strings; 97 learning items | Local draft saved |
| FR-UI-005 | Interface dictionary keys `ask.scholarShort.al-barrak` through `ask.video.channels.UCwMocSKEbLav6SZvwzTvDbQ` | 25 | 0 | 0 | Key/source parity, nonempty French, and placeholder parity passed; names and the French abbreviation `min` retained | 199 interface strings; 97 learning items | Local draft saved |
| FR-UI-006 | Interface dictionary keys `ask.video.channels.UCWjCSGhmSGu0VLf2mPFS0Kg` through `ask.testMode` | 25 | 0 | 0 | Key/source parity, nonempty French, and placeholder parity passed; names and collection titles retained | 174 interface strings; 97 learning items | Local draft saved |
| FR-UI-007 | Interface dictionary keys `ask.source` through `more.theme` | 25 | 0 | 0 | Key/source parity, nonempty French, and exact placeholder parity passed | 149 interface strings; 97 learning items | Local draft saved |
| FR-UI-008 | Interface dictionary keys `more.themeLight` through `about.points.4.0` | 24 | 0 | 0 | Key/source parity, nonempty French, and placeholder parity passed | 125 interface strings; 97 learning items | Local draft saved |
| FR-UI-009 | Interface dictionary keys `about.points.4.1` through `reportPage.title` | 25 | 0 | 0 | Key/source parity, nonempty French, and placeholder parity passed | 100 interface strings; 97 learning items | Local draft saved |
| FR-UI-010 | Interface dictionary keys `reportPage.subtitle` through `quran.allSurahs` | 25 | 0 | 0 | Key/source parity, nonempty French, and exact placeholder parity passed | 75 interface strings; 97 learning items | Local draft saved |
| FR-UI-011 | Interface dictionary keys `quran.surahNumber` through `quran.playVerse` | 25 | 0 | 0 | Key/source parity, nonempty French, and exact placeholder parity passed; Arabic recitation formula unchanged | 50 interface strings; 97 learning items | Local draft saved |
| FR-UI-012 | Interface dictionary keys `quran.pauseVerse` through `hadith.noMatches` | 25 | 0 | 0 | Key/source parity, nonempty French, and exact placeholder parity passed; reciter attribution and hadith collection names retained | 25 interface strings; 97 learning items | Local draft saved |
| FR-UI-013 | Interface dictionary keys `hadith.clearSearch` through `hadith.filterBooksPlaceholder` | 25 | 0 | 0 | Key/source parity, nonempty French, and exact placeholder parity passed; unavailable French translation stated clearly | 0 dictionary strings; 97 learning items | Local draft saved |

### Needs Mo

- `DB-FR-LANG-CHECK`: database French drafts are blocked by the existing language check constraint. No schema change is authorized.
- Ask/reconnect/cancellation/evidence and incomplete-answer status copy: all 93 leaf strings in `lib/ask/rich-text.ts` are translated in four local batches and assembled to `lib/ask/rich-text-fr.ts`. Key/source parity, placeholder parity, nonempty text, no duplicate/missing keys, and the 25-entry batch limit passed. The French Ask copy appears only in the loopback-only development preview; the live Ask flow and API locale guard are unchanged. Human review: 0; published: 0.

### Phase 2: New to Islam lessons (in progress)

- Translated lessons 1–14 into local French draft batches `new-to-islam-001.json` through `new-to-islam-005.json`. Original English/Arabic/German source records were not modified.
- Each batch was checked against the source lesson IDs, all link destinations and citation reference IDs, source citation labels, section heading counts, and paragraph structure. Batch size is at most five lessons; these batches contain 3, 3, 3, 3, and 2 lessons.
- French drafts remain unpublished and are not connected to public locale routing. New to Islam lessons remaining: 18 of 32. No human review is claimed.
