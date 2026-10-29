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
- Continued with lessons 15–18 in local batches `new-to-islam-006.json` and `new-to-islam-007.json`. The detailed prayer walkthrough preserves its Arabic text, transliterations, sequence, qualifications, and source links. All seven lesson batches were revalidated after tightening the citation check to track source IDs while allowing French display labels.
- New to Islam progress: 18 of 32 lessons drafted and structurally checked; 14 remain. Human review: 0; published: 0.
- Lessons 19–21 (repentance, non-Muslim family, and community support) are drafted in `new-to-islam-008.json` and passed the same structural and citation checks. Current progress: 21 of 32 lessons; 11 remain.
- Lessons 22–24 (food and drink, modesty, and work and money) are drafted in `new-to-islam-009.json` and passed citation and structure checks. Current New to Islam progress: 24 of 32 lessons; 8 remain.
- Lessons 25–32 (Ramadan, zakat, Hajj, good character, difficult thoughts, scholarly differences, reliable answers, and next steps) are drafted in `new-to-islam-010.json` through `new-to-islam-012.json`. All 32 New to Islam lessons now have French local drafts and pass structural and reference checks. Human review: 0; published: 0.

### Phase 3: Hard Questions articles (in progress)

- Translated articles 1–9 in `hard-questions-001.json` through `hard-questions-003.json`. French drafts preserve the source link destinations, citation labels, headings, and paragraph structure; all three batches passed the focused validator. No source English or existing AR/DE text was changed.
- Hard Questions progress: 9 of 21 articles drafted; 12 remain. Human review: 0; published: 0.
- Hard Questions articles 10–12 (inheritance, people unreached by the message, and historical/legal claims about conquest) are drafted in `hard-questions-004.json` and passed reference and structure checks. Current progress: 12 of 21 articles; 9 remain.
- Hard Questions articles 13–15 (why Islam, evidence for prophethood, and decree and choice) are drafted in `hard-questions-005.json` and passed reference and structure checks. Current progress: 15 of 21 articles; 6 remain.
- Hard Questions articles 16–21 (unanswered prayer, eternal punishment, Quran 4:34, Aisha's age, apostasy, and slavery) are drafted in `hard-questions-006.json` and `hard-questions-007.json`. All 21 articles now have local French drafts and passed structural and reference checks. Human review: 0; published: 0.

### Phase 4: prepared answers (in progress)

- The first 15 prepared answers are drafted in French across five local batches. Search questions and visitor-facing answer text are translated; source IDs, requirement IDs and answer section counts are preserved. Each batch passed the focused validator. Originals remain unchanged.
- Prepared answers progress: 15 of 44 drafted; 29 remain. Human review: 0; published: 0.
- Prepared-answer files in batches `prepared-answers-006.json` and `prepared-answers-007.json`: six additional complete French drafts covering interest, music, smoking, interfaith marriage, missed prayers, and the pillars of faith. Source IDs, requirement IDs, question counts, answer sections, and metadata passed focused structural validation. Prepared answers: 21 of 44 drafted; 23 remain. Human review: 0; published: 0.
- Prepared-answer batch `prepared-answers-008.json` adds complete French drafts for traveller prayers, the Prophet Muhammad, and parents’ rights. Question counts, source IDs, requirement IDs, answer sections, and metadata passed focused structural validation. Prepared answers: 24 of 44 drafted; 20 remain. Human review: 0; published: 0.
- Prepared-answer batch `prepared-answers-009.json` adds complete French drafts for Hajj steps, visiting graves and invoking the dead, and matters that break the fast. Structural checks passed for source IDs, questions, answer sections, counts, and preserved metadata. Prepared answers: 27 of 44 drafted; 17 remain. Human review: 0; published: 0.
- Prepared-answer batch `prepared-answers-010.json` adds complete French drafts covering ablution nullifiers, shirk, and zakat al-fitr. Structural checks passed for source IDs, question and answer counts, section structure, and metadata. Prepared answers: 30 of 44 drafted; 14 remain. Human review: 0; published: 0.
- Prepared-answer batch `prepared-answers-011.json` completes the 32 prepared-answer source files with gold zakat and savings zakat drafts. Structural checks passed for source IDs, question and answer counts, section structure, and metadata. The remaining 12 of the 44 total prepared-answer drafts are topic-answer files. Human review: 0; published: 0.
- Topic-answer batch `prepared-answers-012.json` adds French drafts for doubt, evolution, and faith and reason. The copy translates the existing answer text summaries and does not create French Quran quotations. Topic IDs, answer sections, source IDs, requirements, and metadata passed focused validation. Total prepared-answer drafts: 35 of 44; 9 topic-answer files remain. Human review: 0; published: 0.
- Topic-answer batch `prepared-answers-013.json` adds French drafts about writing hadith, inheritance, and people unreached by the message. Structural checks passed for topic IDs, answer sections, source IDs, requirements, and metadata. Total prepared-answer drafts: 38 of 44; 6 topic-answer files remain. Human review: 0; published: 0.
- Topic-answer batch `prepared-answers-014.json` adds French drafts on life's purpose, Quran preservation, and suffering. Structural checks passed for topic IDs, answer sections, source IDs, requirements, and metadata. Total prepared-answer drafts: 41 of 44; 3 topic-answer files remain. Human review: 0; published: 0.
- Topic-answer batch `prepared-answers-015.json` completes the 12 topic-answer files with drafts about the sword, the Creator, and women's spiritual standing. Structural checks passed for topic IDs, answer sections, source IDs, requirements, and metadata. All 44 prepared-answer drafts now exist locally; none are human-reviewed or published.

### Private preview integration checkpoint

- The loopback-only `/dev/french-preview` now loads the complete saved learning drafts: 32 New to Islam lessons, 21 Hard Questions articles, and 44 prepared answers. It formats headings and lists, links citations to their original reference URLs where the source map exists, and shows preserved source IDs and requirement IDs for prepared answers.
- The local development route returned HTTP 200 with `<html lang="fr">` and all three content groups. The Ask form remains disabled. The public locale list, APIs, and routes remain unchanged.
- Reader cards say that approved Quran French and saved French library translations are unavailable. No Quran translation was generated. French records remain unavailable from Supabase because the current language constraint still blocks `fr` and schema changes are forbidden.
- The hard-coded visitor-copy audit is still incomplete. In particular, audio controls, reader accessibility labels, and Ask progress copy outside the prepared French status strings need a full sweep before website coverage can be called complete.
- Hard-coded visitor-copy batch `hardcoded-copy-001.json` adds French versions of 24 strings in the home gateways, audio controls, reader navigation/accessibility labels, and Quran unavailable/error states. Source-file presence, unique IDs, nonempty copy, and `{rate}` placeholder parity passed. The private preview shows these drafts; the full hard-coded copy audit remains in progress, with additional Ask and reader text still to inventory.

### Phase 4: Hadith library, local drafts

| Batch | Source IDs | Translated | Inserted | Preserved | Validation | Remaining local drafts | Status |
|---|---|---:|---:|---:|---|---:|---|
| FR-LIB-HAD-BUKHARI-001 | `09c17088-3041-4121-af6a-3858bbfe2d4d` (Bukhari 1), `8d51995a-4d75-4e55-8ef0-00ba56262b9a` (Bukhari 2) | 2 | 0 | 0 | Source IDs and SHA-256 hashes, original text, references, publication state, permissions, and nonempty French passed; each narration reread against Arabic | 14,627 | Private local AI drafts; unpublished; no human review |

- The live source rows were read from project `jnietkyxgnocyizvjiel`; both had no French translation row at export time and are published sources. Their `sunnah.com` rights record has `status=granted` and `ai_processing_allowed=true`, while `translation_index_allowed=false`. The drafts therefore remain private local files and are not submitted to the database.
- The live `source_translations.lang` check still permits only `ar`, `en`, and `de`. French database insertions remain at zero; all 14,629 hadith translations are still missing in the database even when a local draft exists.
- Hadiths containing embedded Quran quotations are held for an approved attributed French Quran source. The current application Quran source list contains English and German only; no French Quran text was generated or saved.

| FR-LIB-HAD-BUKHARI-002 | `aac6a21a-f8f8-4ebc-8ab4-7342f1a50da3` (Bukhari 3) | 0 | 0 | 0 | Arabic source hash, ID, URL, reference, publication state, rights, private status, and Needs Mo reason passed; Quran 96:1–3 remains untranslated | 14,627 | Needs Mo: approved French Quran translation required |
| FR-LIB-HAD-BUKHARI-003 | `e6fab8de-a043-4b83-9da4-4983974526ac` (Bukhari 4), `7c07c22f-ce1f-4963-81cd-c70eac490f90` (Bukhari 5), `834f2c23-8696-4b30-8c99-724b513aba40` (Bukhari 6) | 1 | 0 | 0 | Arabic hashes, IDs, references, rights, and privacy passed; Bukhari 6 reread against Arabic; Bukhari 4–5 held for Quran 74:1–5 and 75:16–19 | 14,626 | One private draft; two Needs Mo |
| FR-LIB-HAD-BUKHARI-004 | `67ed0b56-fc0c-49b8-985b-eb22527c73b7` (Bukhari 7) | 0 | 0 | 0 | Arabic source hash, ID, URL, reference, publication state, rights, private status, and Needs Mo reason passed; Quran 3:64 remains untranslated | 14,626 | Needs Mo: approved French Quran translation required |
| FR-LIB-HAD-BUKHARI-005 | `bc20046e-0669-490c-b5d7-722b5a7a8ea5` (Bukhari 8), `de6ca447-faaf-4524-a83a-a64cd3e738da` (Bukhari 9), `83978758-bcb8-4f85-a1e6-6257a083bf6c` (Bukhari 10), `bfc6b6a5-067d-459c-ab93-a6ff1c4cf11d` (Bukhari 11), `d1cd3ced-e29b-43f5-9b9a-d7d5d0d259db` (Bukhari 12), `bd0d879b-d6d2-4711-aec8-1744a57864e3` (Bukhari 13) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, privacy, and unpublished state passed; all six translations reread against Arabic | 14,620 | Private local AI drafts; unpublished; no human review |
| FR-LIB-HAD-BUKHARI-006 | `1cab0fca-8c72-4912-8bea-dc69d5df3c86` (Bukhari 14), `9ac67fc6-0811-4bae-a599-76ccbe29a0a7` (Bukhari 15), `36aee9ae-886a-457f-ab2f-4b7a45b3336d` (Bukhari 16), `78207201-3fed-4e57-ad63-1435023f3f77` (Bukhari 17), `c87bcf81-a39e-4c1c-b37b-f2a6881bd200` (Bukhari 18), `659a3d16-0046-4882-9422-4392fdc83b3e` (Bukhari 19) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and unpublished state passed; all six translations reread against Arabic | 14,614 | Private local AI drafts; unpublished; no human review |

- After these six batches, 15 of 14,629 hadiths have private French drafts, 4 are held in Needs Mo for Quran quotations, 14,614 still have no French draft, database insertions remain 0, and all 14,629 remain missing from the live French translation table. The exporter and validator now enforce private, unpublished, and unreviewed status.

| FR-LIB-HAD-BUKHARI-007 | `34f7e790-e1ff-4c88-9851-ee624d06ed81` (Bukhari 20), `c308d7d5-9cae-44c4-a512-3f4befe9a117` (Bukhari 21), `f0cf92e5-2b0c-41f6-84f9-f546b6533d4d` (Bukhari 22), `677d8d62-fde8-444b-bf4d-1ad0226022e6` (Bukhari 23), `31bbe045-d996-4766-93c8-93acbf285b9b` (Bukhari 24), `a6628caf-22a5-49d4-a884-f9fc6a2a7f6d` (Bukhari 25) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and unpublished state passed; all six translations reread against Arabic, including two chains and wording variants | 14,608 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 21 private local French drafts of 14,629; 4 items remain on hold for approved French Quran quotations; 14,608 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-008 | `18767eb6-6ca8-4a65-864c-777da9671b1b` (Bukhari 26), `3f09167d-3c49-4d26-84ac-b683dd91dd7d` (Bukhari 27), `e5fe364a-f87f-43a4-96b3-e4588139ee85` (Bukhari 28), `420f1cfc-5522-4910-9f39-8cba327ec281` (Bukhari 29), `d205927b-335e-4d20-86a9-995e02924463` (Bukhari 30), `a3f045ea-0447-4c9e-b961-61da2da7ad8a` (Bukhari 31) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and unpublished state passed; all six complete translations reread against Arabic | 14,602 | Private local AI drafts; unpublished; no human review. Bukhari 32 is longer than 2,000 characters and was deferred for a one-item batch. |

- Updated hadith progress: 27 private local French drafts of 14,629; 4 items remain on hold for approved French Quran quotations; 14,602 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-009 | `0044c4c2-16fb-4bc7-aacd-d83406c04bca` (Bukhari 32), `51b999bd-1ad4-4ed3-bb12-389d37c5ac13` (Bukhari 33), `77bf8c96-1617-4aed-ada8-571b494f9d6f` (Bukhari 34), `0e3cd999-771e-4a90-bb9e-baf6ef77faa5` (Bukhari 35), `7194381f-0358-469e-a163-370afd0c1077` (Bukhari 36), `ff51df51-b9f1-4e3b-8965-beb6dcf3bb2a` (Bukhari 37) | 5 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and five complete translations passed; Bukhari 32 is held because it quotes Quran 6:82 and 31:13 | 14,597 | Five private local AI drafts; one Needs Mo |

- Updated hadith progress: 32 private local French drafts of 14,629; 5 items remain on hold for approved French Quran quotations; 14,597 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-010 | `8ef9f798-f359-4fb6-9c4c-09bf31dea478` (Bukhari 38), `408b0655-bc48-47f0-8e88-9faea41d7744` (Bukhari 39), `1fe7229f-a14f-4836-9e2f-fa6cb0496235` (Bukhari 40), `de09e74a-d0c1-4394-ac15-1c347e2e62b2` (Bukhari 41), `66eeea33-f44c-4fc8-9294-9c89e658b0ac` (Bukhari 42), `6184c6b9-2357-422c-a817-36392e0d5e35` (Bukhari 43) | 5 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and five complete translations passed; Bukhari 40 is held because it quotes Quran 2:143 | 14,592 | Five private local AI drafts; one Needs Mo |

- Correction: batch 009 did not contain a long Bukhari 38 report. The exporter deferred a different later long record; Bukhari 38 was included normally in batch 010.
- Updated hadith progress: 37 private local French drafts of 14,629; 6 items remain on hold for approved French Quran quotations; 14,592 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-011 | `bb8539fb-88a9-40eb-a6b2-57e1be658f67` (Bukhari 44), `cf458329-1c3b-4d58-88ce-fb4c4cf2455f` (Bukhari 45), `1f5a0221-da4a-4396-bb70-3c3c0ffd8b3b` (Bukhari 46), `fc3261cb-22d1-428b-9621-2a3eb9c0863b` (Bukhari 47), `b7e7951d-5ae1-4256-8445-b5a7c7682fe9` (Bukhari 48), `0bce5aa8-52d6-4562-93af-86bc6ff8351d` (Bukhari 49) | 5 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and five complete translations passed; Bukhari 45 held because it quotes Quran 5:3 | 14,587 | Five private local AI drafts; one Needs Mo |

- Updated hadith progress: 42 private local French drafts of 14,629; 7 items remain on hold for approved French Quran quotations; 14,587 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-012 | `7ef80db3-a3a9-4681-841a-9956eb40602a` (Bukhari 50), `489c6233-d805-4250-ac44-5166c7d6d17b` (Bukhari 51), `22cacfdf-9bb0-4c06-a09c-87935beabacc` (Bukhari 52), `b1727822-c2e6-4558-a859-29a0e0c73a60` (Bukhari 53), `051686d8-c75b-4ff7-af3d-7a335ca7db66` (Bukhari 54), `1efdd73a-14f1-4044-a09f-639237897849` (Bukhari 55) | 5 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and five complete translations passed; Bukhari 50 is held because it quotes Quran 31:34 | 14,582 | Five private local AI drafts; one Needs Mo |

- Updated hadith progress: 47 private local French drafts of 14,629; 8 items remain on hold for approved French Quran quotations; 14,582 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-013 | `e6b95c53-b1a2-42f4-b830-a59229c994f4` (Bukhari 56), `8187c427-96be-43a7-84ae-80b5bce76b9c` (Bukhari 57), `2c637c78-fdd0-4240-a92e-a45486ed7e35` (Bukhari 58), `4ffe628b-7dd0-412b-96d6-f8008431af71` (Bukhari 59), `4073cb5e-976f-4ba5-bfbc-4dfdf0ba89c1` (Bukhari 60), `ff0a854d-c169-4795-8936-6fa3683d3c7e` (Bukhari 61) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; two narration chains in Bukhari 59 were preserved | 14,576 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 53 private local French drafts of 14,629; 8 items remain on hold for approved French Quran quotations; 14,576 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-014 | `b33f62b6-8452-4cc1-8a94-ee68e64274b7` (Bukhari 62), `03f449a8-6aa0-4116-9b6b-f96782bdcf29` (Bukhari 63), `7042690d-401c-4090-a836-04d958812275` (Bukhari 64), `398102d4-b83c-49e5-bd3f-d5bfe3fe9df4` (Bukhari 65), `b9210a36-b36c-4ccf-b384-6c6558ca9cdf` (Bukhari 66), `831d69eb-6375-4d03-9329-7584c0d5a0cd` (Bukhari 67) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and six complete translations passed; the full Bukhari 63 dialogue and alternate transmission preserved | 14,570 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 59 private local French drafts of 14,629; 8 items remain on hold for approved French Quran quotations; 14,570 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-015 | `de52a690-18e5-4354-8328-76d56b051454` (Bukhari 68), `c804a82b-86a4-4e17-8db8-61dcbc31105a` (Bukhari 69), `f4383cb9-4bc9-4ff0-9814-0e05e597e4ce` (Bukhari 70), `437b3cc0-0d0e-4109-a103-4b3961018a85` (Bukhari 71), `b485eb03-61a3-481a-9b1b-c90b3e1c1230` (Bukhari 72), `af4fade8-d9fb-474f-b3b1-1fdba716d266` (Bukhari 73) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; variant wording and reports preserved | 14,564 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 65 private local French drafts of 14,629; 8 items remain on hold for approved French Quran quotations; 14,564 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-016 | `75866a9e-a04d-4466-a11a-0a1db85042a8` (Bukhari 74), `dcb45ab6-3bea-420a-b463-6228d4417029` (Bukhari 75), `22fe153d-7b1d-43cd-a082-aa085c84a1dc` (Bukhari 76), `bf15eecb-bae3-4d98-83b5-a776a1e1cfa4` (Bukhari 77), `a73e03d6-9a37-4c4d-9924-f351e9f2e7dc` (Bukhari 78), `c2e60dc2-1673-48be-a8a6-153889688daf` (Bukhari 79) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and six complete translations passed; the two distinct Musa and Khidr narrations were kept separate | 14,558 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 71 private local French drafts of 14,629; 8 items remain on hold for approved French Quran quotations; 14,558 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-017 | `8da13745-0efe-47d9-8701-f516b2af14c2` (Bukhari 80), `1bbcaec4-7f31-479e-829e-dd992c1d29a6` (Bukhari 81), `a75ba1e1-1e2d-4a76-b6dc-af5d35663f27` (Bukhari 82), `b4ed74e5-21ee-4fea-97a2-59cb0fd5c97e` (Bukhari 83), `d49f927c-cc95-464b-b11a-4aad3510435c` (Bukhari 84), `750f3fcf-40c7-4fe8-8920-9bcf0b9d9a64` (Bukhari 85) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and six complete translations passed; the ritual sequence and the narrator's explanation of *harj* were preserved | 14,552 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 77 private local French drafts of 14,629; 8 items remain on hold for approved French Quran quotations; 14,552 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-018 | `56812fed-bb8e-4ec8-9a2a-d94413d84aca` (Bukhari 86), `4eccabf8-e836-4b78-98ab-5f686604a64a` (Bukhari 87), `1d69ca3b-932f-4438-a91c-4ff685815d49` (Bukhari 88), `7515ca9b-4e88-4b42-8ead-437ad47987cd` (Bukhari 89), `65cf779e-3269-4f02-bd53-e1a07b8e4a5c` (Bukhari 90), `16e609ac-4f94-4f30-99d6-88bc4a345089` (Bukhari 91) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; narrator uncertainty and variant vessel names retained | 14,546 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 83 private local French drafts of 14,629; 8 items remain on hold for approved French Quran quotations; 14,546 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-019 | `c5ab6b35-301a-488d-99a2-ece7be702f57` (Bukhari 92), `8ba749dc-20c8-425f-8147-cfb05919da97` (Bukhari 93), `19e0ce72-fe5f-41d2-ad73-b72c767ff452` (Bukhari 94), `e6115a18-5782-4447-ab75-584ec003e401` (Bukhari 95), `d868b7c6-e4be-421d-926a-83a5d71447f1` (Bukhari 96), `4d56f904-1484-4fe6-896a-51b90cc179b6` (Bukhari 97) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and six complete translations passed; variant wording and repetitions preserved | 14,540 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 89 private local French drafts of 14,629; 8 items remain on hold for approved French Quran quotations; 14,540 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-020 | `e2d68c2e-195a-48ca-a41f-ec2e8a95b1cf` (Bukhari 98), `7b612c5c-2370-45f1-8236-ebc4483d2003` (Bukhari 99), `929fe9b7-d1d1-429a-8b80-e626bff56476` (Bukhari 100), `d9d2dcfd-79de-4056-935b-77aac057ed25` (Bukhari 101), `0378145f-cfa7-4e54-9316-7177af9ae47e` (Bukhari 102), `96a9ee33-fc42-4da5-bc7f-86ede5ad0f89` (Bukhari 103) | 5 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and five complete translations passed; Bukhari 103 held because it quotes Quran 84:8 | 14,535 | Five private local AI drafts; one Needs Mo |

- Updated hadith progress: 94 private local French drafts of 14,629; 9 items remain on hold for approved French Quran quotations; 14,535 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-021 | `fab3cd2a-5706-4b96-8d82-ee1b413786ed` (Bukhari 104), `997e18f8-a11d-4788-a33f-20343a770cbc` (Bukhari 105), `e9ff3352-27aa-4e66-84e6-bad0d2cb309c` (Bukhari 106), `20b2c312-bd91-41a5-8802-56dec8222a33` (Bukhari 107), `5d7e1ce1-d3cb-40f6-875c-6faaa6fde70f` (Bukhari 108), `405612b9-3257-4aa5-b562-18676a952685` (Bukhari 109) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; source variants and repeated warnings preserved | 14,529 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 100 private local French drafts of 14,629; 9 items remain on hold for approved French Quran quotations; 14,529 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-022 | `de7bbe9d-bd62-4904-9cf4-185e34064f79` (Bukhari 110), `2de39ee4-e84c-472f-8590-9f7840359153` (Bukhari 111), `889063bf-d5f8-4c92-9714-49e9726db579` (Bukhari 112), `ff9459f5-b35c-4b02-8e01-f02a81cf8c50` (Bukhari 113), `99ce84cd-8804-42bc-a00a-428a0e8a939d` (Bukhari 114), `4392635e-52a3-4d81-b4d5-b0a3711dd29f` (Bukhari 115) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and six complete translations passed; narrator's uncertainty in Bukhari 112 preserved | 14,523 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 106 private local French drafts of 14,629; 9 items remain on hold for approved French Quran quotations; 14,523 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-023 | `09e3b641-5a9f-408c-885c-96dbd040397b` (Bukhari 116), `d046ed25-5c3b-4b31-a76c-6fe9f2dafd98` (Bukhari 117), `109cde21-797c-47f8-949a-8136077800ed` (Bukhari 118), `60df5ecb-b838-421e-a828-59cb87bc4e25` (Bukhari 119), `c2de6548-be4d-46fe-a1e5-dfb93c14c306` (Bukhari 120), `c4890768-9283-40f2-b380-0b45bd00f910` (Bukhari 121) | 5 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and five complete translations passed; Bukhari 118 held because it quotes Quran 2:159–160 | 14,518 | Five private local AI drafts; one Needs Mo |

- Updated hadith progress: 111 private local French drafts of 14,629; 10 items remain on hold for approved French Quran quotations; 14,518 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-024 | `c5492745-b28b-4da6-92e9-9f3bf93bd370` (Bukhari 122) | 1 | 0 | 0 | Single-item long-report batch; Arabic hash, ID, URL, reference, rights, private status, and complete French translation passed; full report reread against Arabic | 14,517 | Private local AI draft; unpublished; no human review |

- Updated hadith progress: 112 private local French drafts of 14,629; 10 items remain on hold for approved French Quran quotations; 14,517 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-025 | `30a2f343-519e-4d88-9828-f94b237e488e` (Bukhari 123), `f7dffebc-56a7-4e9f-9636-dfe136b77fec` (Bukhari 124), `0d0d8c55-737d-4ce2-a7e7-c4d7561dc29a` (Bukhari 125), `337b2c15-9509-4a83-89e4-5d232daaf92f` (Bukhari 126), `647fce1e-b2be-4ead-98a7-c092b2cd79ae` (Bukhari 127), `e366e29e-d74a-4ab1-9301-74f93dcf80b3` (Bukhari 128) | 5 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and five complete translations passed; Bukhari 125 held because it quotes Quran 17:85 | 14,512 | Five private local AI drafts; one Needs Mo |

- Updated hadith progress: 117 private local French drafts of 14,629; 11 items remain on hold for approved French Quran quotations; 14,512 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-026 | `7fd94336-39d2-43f6-abb7-75ede2debfbe` (Bukhari 129), `23b80807-d46d-40e8-93f9-dd973ebb2e83` (Bukhari 130), `fe6853e6-911c-4980-bf1b-c3f1c914f004` (Bukhari 131), `12e94fc2-6bd1-49ad-8227-d6ab6c43ad53` (Bukhari 132), `de212029-69a9-4931-80a2-bcc23bff087b` (Bukhari 133), `633cebe7-b0d0-4703-b4f2-1deb20893496` (Bukhari 134) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and six complete translations passed; narrator variants and unspecified details preserved | 14,506 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 123 private local French drafts of 14,629; 11 items remain on hold for approved French Quran quotations; 14,506 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-027 | 93352a7d-913d-4342-80ec-b652071b2083 (Bukhari 135), e9515105-16f8-4a5a-8c3f-939e08a0f418 (Bukhari 136), b5139370-6e96-4e2f-bb48-527bb79aa289 (Bukhari 137), f9b5502d-5511-47a2-bb76-49ca03f853cf (Bukhari 138), f7c4e217-a4d0-4b56-b2fb-9a5638ee88d2 (Bukhari 139), aee91d73-033c-4cfe-b19f-34dee701397d (Bukhari 140) | 5 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and five complete translations passed; Bukhari 138 held because it quotes Quran 37:102 | 14,501 | Five private local AI drafts; one Needs Mo |

- Updated hadith progress: 128 private local French drafts of 14,629; 12 items remain on hold for approved French Quran quotations; 14,501 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-028 | 8b28d693-fdd9-4a34-bf08-dc7ef3167c6d (Bukhari 141), d1b82af8-c820-4937-8428-f210cc162476 (Bukhari 142), e5492704-d8a0-4487-bb52-5f63e2579737 (Bukhari 143), c8dff5e0-de33-4a46-a7da-61afe1bacc33 (Bukhari 144), 86aa692c-145a-49ec-b9c9-4f479a8fe327 (Bukhari 145), affc6070-6f0e-486c-9f05-e83eafdd9818 (Bukhari 146) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; transmission variants and explanatory note preserved | 14,495 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 134 private local French drafts of 14,629; 12 items remain on hold for approved French Quran quotations; 14,495 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-029 | 4f94319d-343b-4480-96b0-ae412e2a228c (Bukhari 147), 1c1b8340-28bf-4bea-9cc5-52e77f9a4d28 (Bukhari 148), 003289f2-198b-461a-a4a9-9a6184ccc665 (Bukhari 149), fb77fb5f-a907-407b-a4bd-6fb527c2ce8f (Bukhari 150), 76efbe3f-5e8f-4716-982d-df5e375cbae7 (Bukhari 151), c06eedc2-ce5f-4bb5-abde-c1aa9492ca7d (Bukhari 152) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed | 14,489 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 140 private local French drafts of 14,629; 12 items remain on hold for approved French Quran quotations; 14,489 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-030 | 0f7fbf61-1fa6-4d0c-8755-04d8dfdf725f (Bukhari 153), bcbefe5a-07c7-4e13-8fbd-95d9d4a286a8 (Bukhari 154), 99a49b99-9096-4239-92c2-c63682535a34 (Bukhari 155), c3be3793-dc23-4fc2-ac01-40f9aeaea3ca (Bukhari 156), c16a98eb-bfe9-4cd1-9d26-c9590241cbb8 (Bukhari 157), d0266cc2-3e52-4e19-bc2c-fc430992f2d8 (Bukhari 158) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; narrator-chain correction and variants preserved | 14,483 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 146 private local French drafts of 14,629; 12 items remain on hold for approved French Quran quotations; 14,483 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-031 | 0a455a8f-e535-4d8b-a87f-f4158753ad0f (Bukhari 159), c396c2e9-469f-4ae2-9ed8-ac954d9aaf92 (Bukhari 160), 72c267ed-5aa8-4a49-b5dd-5b91185e20f2 (Bukhari 161), 89fe03d3-3ee9-4d07-a546-9ae99f851289 (Bukhari 162), 6fdc68df-b206-4184-8867-1d334cd9ac94 (Bukhari 163), 4624bd56-d621-47f0-bef8-5df6c2c79263 (Bukhari 164) | 5 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and five complete translations passed; Bukhari 160 held because it quotes Quran 2:159 | 14,478 | Five private local AI drafts; one Needs Mo |

- Updated hadith progress: 151 private local French drafts of 14,629; 13 items remain on hold for approved French Quran quotations; 14,478 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-032 | eeb5fdfb-8fcc-41f1-8506-eaf5d9786da6 (Bukhari 165), 2a6f2ad3-c450-4ce4-ae95-cece175edc87 (Bukhari 166), 9e861eaa-5c4b-43a2-aff2-bfda8f061a82 (Bukhari 167), 320dd2ea-3165-4129-ba56-412148f5a903 (Bukhari 168), 18a7e33d-0f67-4419-80ab-e63fd737a225 (Bukhari 169), f3603999-6b88-43f5-b9ea-c75c336569dc (Bukhari 170) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; complete chains, quantities, and variants retained | 14,472 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 157 private local French drafts of 14,629; 13 items remain on hold for approved French Quran quotations; 14,472 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-033 | 9f02acc0-26cc-45dc-bc0b-ea77619d584b (Bukhari 171), 155a834d-61d8-48e6-b86d-958a4c023bab (Bukhari 172), 23141cfe-218b-4d51-851e-27c582213576 (Bukhari 173), e1c6e549-b563-4417-b1b3-a77c11280829 (Bukhari 174), a5de2c52-49ff-445d-bfe7-b44a704121ac (Bukhari 175), 4e1ae5cd-a9c9-4e20-9f22-9abe015fc014 (Bukhari 176) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; counts and conditions preserved | 14,466 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 163 private local French drafts of 14,629; 13 items remain on hold for approved French Quran quotations; 14,466 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-034 | df3679f6-589e-45f2-9122-7c5746d6eddf (Bukhari 177), 9ecb147a-3b36-4b80-866e-3598db9a7281 (Bukhari 178), fe09c4f5-08ff-40f2-b17d-4206806fcb20 (Bukhari 179), 7f51609e-dc6f-46d7-9310-5df8df3c34f5 (Bukhari 180), f573e99f-fbe8-4163-9198-8beaa4c43f73 (Bukhari 181), 3c935fa1-7886-4e85-8aed-434abe2f8c44 (Bukhari 182) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; matn variation and chain details preserved | 14,460 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 169 private local French drafts of 14,629; 13 items remain on hold for approved French Quran quotations; 14,460 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-035 | 4e54f53a-4486-4e9d-bf52-760b47273cad (Bukhari 183), 2aa8bcbe-cda1-4842-a91f-99428d8c1ec4 (Bukhari 184), 70eb7d19-b866-498a-8d4c-575630929f5f (Bukhari 185), 58470cc8-3255-4e28-99b9-13fa7ac3b694 (Bukhari 186), ac2035e8-6ea9-402a-83ae-657a8408d244 (Bukhari 187), 2c3908d3-5c0d-4e93-a1d4-e6e86220b615 (Bukhari 188) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; counts, narrator uncertainty, and prayer sequence preserved | 14,454 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 175 private local French drafts of 14,629; 13 items remain on hold for approved French Quran quotations; 14,454 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-036 | 99108945-ef5e-4510-a3ab-fbe21d6123ad (Bukhari 189), 6429b9d8-8acc-4c0a-92e0-ee03633dc884 (Bukhari 190), de4362c8-8740-438a-bdfc-f47c4b9604e2 (Bukhari 191), 1bf1e9b7-d445-463e-afc7-41c990c2f45e (Bukhari 192), f2de93f0-35c3-477e-86fe-f903af01e297 (Bukhari 193), fafb1929-8f1c-4bc0-9552-27f630a83331 (Bukhari 194) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; order, narrator variant, and reported action preserved | 14,448 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 181 private local French drafts of 14,629; 13 items remain on hold for approved French Quran quotations; 14,448 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-037 | 5f5b8fb3-4b33-4f86-9d1d-9ebcc3c3c25d (Bukhari 195), e913600f-d2bc-4aba-841d-a2e93a838b09 (Bukhari 196), bed95e9c-a095-4878-8a86-07088bbf8ef1 (Bukhari 197), 2b035bfd-caa3-4641-8342-2802c7724eae (Bukhari 198), c845db8d-b051-477f-ba9f-efff25b38e55 (Bukhari 199), 5b5a2fd6-c449-4be9-9c2b-2180bfff060b (Bukhari 200) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; counts, narration detail, and sequence retained | 14,442 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 187 private local French drafts of 14,629; 13 items remain on hold for approved French Quran quotations; 14,442 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-038 | bd87b001-2b78-422d-9374-ffba64404efd (Bukhari 201), 68e9a0ac-54e1-4ffd-b26a-4a2ff5958638 (Bukhari 202), 3a8a1aa2-9032-4f34-aa4c-14a16a1bd008 (Bukhari 203), 304376bc-b150-4567-a235-8ed8a2e1b38e (Bukhari 204), 366ed4d0-e17f-4acc-b055-f78d87a14b29 (Bukhari 205), b3b262dd-f256-474a-9f04-51a7fd7ae8d3 (Bukhari 206) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; narrator variants and measures preserved | 14,436 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 193 private local French drafts of 14,629; 13 items remain on hold for approved French Quran quotations; 14,436 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-039 | a5e072a7-acf4-4dae-aa9c-262524561d1a (Bukhari 207), dd84bcf1-81d4-4aee-943c-fcdfa716daf8 (Bukhari 208), ad458fa1-78e3-4e72-8d0a-2b2a54ccd940 (Bukhari 209), 460e45a2-a99e-4be0-ad5a-c52f12afcfc2 (Bukhari 210), 2a914f89-de98-4ec1-9aee-d4e401c61a98 (Bukhari 211), d7c9ab5f-f882-4e7b-9762-bebce03ffe7f (Bukhari 212) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; repeated reports and conditions preserved | 14,430 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 199 private local French drafts of 14,629; 13 items remain on hold for approved French Quran quotations; 14,430 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-040 | ee76222f-8b1d-4ddf-b546-89c1675006f5 (Bukhari 213), 7aa420cf-8957-418f-a528-01ed9c54b9fc (Bukhari 214), 39a3fdb1-aa3d-4bc8-bb39-4110751dc6d0 (Bukhari 215), 53fa2a93-b0cc-453d-9a4a-89ba49747db0 (Bukhari 216), c72a85e0-2eb7-43b5-8853-7f8487599d7f (Bukhari 217), 1b35b102-cd39-4ce3-9743-1cddc039c622 (Bukhari 218) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; repeated narrator variant preserved | 14,424 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 205 private local French drafts of 14,629; 13 items remain on hold for approved French Quran quotations; 14,424 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-041 | 11605ffc-8a23-42a4-b4b3-079a8bbfa5ff (Bukhari 219), f6ee5006-c655-4da8-bf8f-8f5f56d3407c (Bukhari 220), 9529b054-4b2b-40f9-9429-1ca68399c9a7 (Bukhari 221), 6a2ad781-a751-4a41-9471-16bd5ccc61db (Bukhari 222), 863a8e22-7967-4777-8286-96957fc68b8a (Bukhari 223), 056c8f2e-8ce5-4414-a29a-b8f86515c2a8 (Bukhari 224) | 5 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and five complete translations passed; Bukhari 221 held because the exported source contains only its narrator chain | 14,419 | Five private local AI drafts; one Needs Mo |

- Updated hadith progress: 210 private local French drafts of 14,629; 13 Quran-quote holds and one incomplete-source hold; 14,419 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-042 | 7bc28fae-967c-4d9d-8b3a-1ad4b3e82cc9 (Bukhari 225), f409c174-6fed-4144-8322-e53bd6b6baff (Bukhari 226), f8209cd9-5833-47d3-a79c-aca0c3ce5356 (Bukhari 227), 48a0ce01-1af3-441e-a8fc-0f6c4a283737 (Bukhari 228), cfad3e39-6c2d-49e1-ae67-34951f4c2e21 (Bukhari 229), 88a4add6-aab2-4951-b2f2-20be4132623e (Bukhari 230) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; narrator attribution preserved | 14,413 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 216 private local French drafts of 14,629; 13 Quran-quote holds and one incomplete-source hold; 14,413 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-043 | c3562681-6fa6-474d-afaf-f55adf2a9d06 (Bukhari 231), c016277f-a636-4924-be66-e6a1fc4e26cf (Bukhari 232), 9f1f528b-4088-4249-83ed-a2b6fe1f7044 (Bukhari 233), ed89a8c7-c465-44d9-95e9-945c1a2d2c15 (Bukhari 234), a6c7bd0d-fe5b-43ca-82e2-412d4edbe40c (Bukhari 235), 08b392b5-6ac5-4667-bdad-07b30f56dafa (Bukhari 236) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; both report variants retained | 14,407 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 222 private local French drafts of 14,629; 13 Quran-quote holds and one incomplete-source hold; 14,407 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-044 | dee2bd0c-6318-4292-97b6-7fe04c0bac88 (Bukhari 237), 2d7ecb6e-eaf1-4798-b95d-dd5b4118c0bb (Bukhari 238), 97fae600-ba6b-46af-a3a3-074a1304c2c8 (Bukhari 239), 47045c92-7278-47d8-9649-558e2b5a6f03 (Bukhari 240), 1be0de4b-a948-47bf-882a-6a7d48d1e662 (Bukhari 241), d5cae8bf-fd0a-4448-8b95-9e45763418c6 (Bukhari 242) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; named persons and source variant preserved | 14,401 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 228 private local French drafts of 14,629; 13 Quran-quote holds and one incomplete-source hold; 14,401 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-045 | 9ad78ca4-df81-4e39-b18d-d85539582a12 (Bukhari 243), 9ac4039b-08a2-4a27-8eb2-b9d8b647e16a (Bukhari 244), dc9ebda3-d717-4902-94ef-7e09c38e7387 (Bukhari 245), 0dd50816-62d8-4b17-9a1b-764c4935e40f (Bukhari 246), 589523f3-4621-4190-8eb7-1a93b5e9a813 (Bukhari 247), d5cbfff0-72dc-4159-8654-ed8b7492d56c (Bukhari 248) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; prayer wording and source variant preserved | 14,395 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 234 private local French drafts of 14,629; 13 Quran-quote holds and one incomplete-source hold; 14,395 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-046 | 92a4b6bd-01a8-47cd-aef4-fa849df61c1b (Bukhari 249), 7ed7f060-a10f-4d77-9312-dc8eee1fc903 (Bukhari 250), eaaab227-ccd6-4503-a288-0967545e9110 (Bukhari 251), f33b7d6c-4d62-44bb-a8f5-6e9582f53bb0 (Bukhari 252), 998e5279-83ea-4840-aaa5-4f32953dcc50 (Bukhari 253), 5c2b6dea-6a5e-4939-a10a-ef132c1cb31a (Bukhari 254) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; measures and chain correction retained | 14,389 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 240 private local French drafts of 14,629; 13 Quran-quote holds and one incomplete-source hold; 14,389 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-047 | e0809392-3e32-436f-bf88-467809e68742 (Bukhari 255), f0992b78-ee2c-4acd-b95b-217634bdeefb (Bukhari 256), 007a531c-0f82-4cb0-9b6a-acf536506062 (Bukhari 257), 8315681e-8c01-4397-9b79-5045692b166c (Bukhari 258), 308f26c3-2e10-45b3-acc7-dfc1d43f746e (Bukhari 259), b2999ee3-245c-4e52-9bfe-08917ef7c7d4 (Bukhari 260) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; procedural sequence and source terminology retained | 14,383 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 246 private local French drafts of 14,629; 13 Quran-quote holds and one incomplete-source hold; 14,383 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-048 | 522c7488-b3d5-4d8e-b51c-2d885d26fde1 (Bukhari 261), a31e565c-2120-4bb6-95c7-ff735d6651db (Bukhari 262), 3d590701-9962-475d-a965-45ff4b8a689c (Bukhari 263), 4fba9bf1-81a2-4e34-b76e-461fcbea75af (Bukhari 264), 78b86fb4-89a4-4e51-baf1-8e434c6d10bc (Bukhari 265), a395f5b0-7597-4f1b-a9c4-f67bedc9f4e3 (Bukhari 266) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; variant and narrator uncertainty retained | 14,377 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 252 private local French drafts of 14,629; 13 Quran-quote holds and one incomplete-source hold; 14,377 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-049 | 8aea7590-9571-48a0-a4af-1e5c4f279c33 (Bukhari 267), ef218916-b464-4b23-8452-90ed93f52a83 (Bukhari 268), 70461d1b-561b-43f3-bc2a-6e72d9dda19c (Bukhari 269), 82208255-23bc-4197-88c7-ea6fccf06531 (Bukhari 270), 8771e270-9418-48e3-b1fa-e0bbe3c02b96 (Bukhari 271), 7aea2059-c53e-4e8a-9644-6cd03b72430f (Bukhari 272) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; narrator variants and reported counts retained | 14,371 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 258 private local French drafts of 14,629; 13 Quran-quote holds and one incomplete-source hold; 14,371 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-050 | fa49c8a0-a92a-4bd6-b80a-af71bff03f45 (Bukhari 274), cc36b1c9-cb75-454e-a1f5-a6c7ba3febe0 (Bukhari 275), 8be223f5-be4d-4c47-b9b0-91a594f5249f (Bukhari 276), 1c67eb3a-a4eb-402a-90b1-6e59e4beb35e (Bukhari 277), c1bb4309-bdc1-4fd0-b023-5ad9261fc5eb (Bukhari 278), 5bbd78b1-9b04-412c-922d-9f761a0530bd (Bukhari 279) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; source variants and uncertainty retained | 14,365 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 264 private local French drafts of 14,629; 13 Quran-quote holds and one incomplete-source hold; 14,365 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-051 | 670b8ab1-0fd7-4466-82fb-5981ea0bc8a9 (Bukhari 280), 0db0cca1-3012-4c21-93d0-1913fe6d950c (Bukhari 281), ce46bc32-6f8f-459f-9022-7f3e2fab033a (Bukhari 282), 6d0143c3-3f32-4774-8fce-a4c3cfa96e8e (Bukhari 283), 1b59d3e9-b33f-45c8-9c1e-7f0994fcf3f5 (Bukhari 284), a15bea4a-d770-4b80-8606-1860ddc18632 (Bukhari 285) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; names, separate narrations, and narrator chain preserved | 14,359 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 270 private local French drafts of 14,629; 13 Quran-quote holds and one incomplete-source hold; 14,359 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-052 | 11f6b978-70da-48fc-adaa-e09720c4f601 (Bukhari 286), 5cc67c77-84df-4a34-a04e-b72098d84a6e (Bukhari 287), 7e4fa123-b114-4717-812f-0d8e38a73b5c (Bukhari 288), 50e8b9f7-bbe3-4c3a-aa1c-379a81ce13f6 (Bukhari 289), 816ec1bd-1e6f-468c-ab70-a04861e62ef1 (Bukhari 290), 46b6d10f-67aa-4d15-b616-058bf00beb84 (Bukhari 291) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; repeated transmission details preserved | 14,353 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 276 private local French drafts of 14,629; 13 Quran-quote holds and one incomplete-source hold; 14,353 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-053 | 6b5df885-7ffa-475a-94e3-a286171c771e (Bukhari 292), 2b494c96-e927-4c56-b837-c952edd88fb7 (Bukhari 293), 00d780c8-24b6-40b9-b245-48f9a21661f6 (Bukhari 294), 728bd6fb-64f2-4005-b205-415e048e19f3 (Bukhari 295), 7b10d42d-feb8-4cff-b441-aa9ab8f2d5c3 (Bukhari 296), ce84a7a7-2d10-44b1-aae3-751e13f8d9f0 (Bukhari 297) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; named narrators and chronology notes preserved | 14,347 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 282 private local French drafts of 14,629; 13 Quran-quote holds and one incomplete-source hold; 14,347 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-054 | 604c60b2-4957-46ef-9278-6e9eac191c69 (Bukhari 298), c6ee1932-771f-4797-8721-13bff6b3e004 (Bukhari 299), dd51469f-ff95-4e6e-a72c-2b52bc00707c (Bukhari 302), b4057209-0d64-41cd-8f93-36668befbd4b (Bukhari 303), 6820391c-7b2e-4c39-abfa-a7d52bf18a3e (Bukhari 304), ec7199c7-4c8c-47cd-b489-eac85403527e (Bukhari 305) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; referenced conditions and matn wording retained | 14,341 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 288 private local French drafts of 14,629; 13 Quran-quote holds and one incomplete-source hold; 14,341 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-055 | 00c402bb-b637-4ae8-bbf9-208b33ad5330 (Bukhari 306), 09d51584-4948-4198-8045-50c41af81f96 (Bukhari 307), d9d849b3-2e3e-4d14-a41e-90135bcd15ca (Bukhari 308), 6e34384f-8324-4a26-85c3-bd55ac2c2240 (Bukhari 309), e5fee632-abc3-4a34-946f-0640324fcade (Bukhari 310), faa8a028-59b4-4c00-98ef-7c35455176d9 (Bukhari 311) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; separate menstrual and continuous bleeding terms preserved | 14,335 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 294 private local French drafts of 14,629; 13 Quran-quote holds and one incomplete-source hold; 14,335 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-056 | 2a4afede-ccba-419a-b883-5735c71c83e3 (Bukhari 312), ebb98533-b422-47b6-908d-f85aede359aa (Bukhari 313), 719393cd-08eb-4c1f-9748-d8990960bf1c (Bukhari 314), cf9df41e-143f-4415-95e5-5a3407d31b26 (Bukhari 315), e21799d1-640a-43c1-96b9-b796820dd95b (Bukhari 316), f770b58a-0205-495f-9b46-e8389e4e94a2 (Bukhari 317) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; names, terminology and narration sequence preserved | 14,329 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 300 private local French drafts of 14,629; 13 Quran-quote holds and one incomplete-source hold; 14,329 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-057 | c8e79f1d-ca1b-4300-b13d-c287826a94ae (Bukhari 318), 696e70fa-e5aa-48ee-8afa-0330a4b08afb (Bukhari 319), 29588fa4-2d45-4f0f-9a67-644105d14a90 (Bukhari 320), 6dbabcc5-4f56-47a4-9678-cc3e67ae1a08 (Bukhari 321), 280e9684-76b7-46be-a7ba-b38efa086fdb (Bukhari 322), 9241e428-878a-48d1-8764-152114ead461 (Bukhari 323) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; narrator chains, ritual timing, and source wording differences retained | 14,323 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 306 private local French drafts of 14,629; 13 Quran-quote holds and one incomplete-source hold; 14,323 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-058 | dc3d5c7c-0c30-4ac2-b3b9-fee05b4fd987 (Bukhari 324), 0267a2d0-ac59-4dde-b7c2-8d06bf9d527a (Bukhari 325), ad317fee-4240-46ff-8547-b9bb8aaadfdf (Bukhari 326), 045ebc68-6961-4dab-ad11-fa947074ff58 (Bukhari 327), 4469d822-15f4-40ff-aabc-7640413e9744 (Bukhari 328), e0828e0e-ad7f-4844-90ef-afc20a71ea2c (Bukhari 329–330) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; narrator chains, reported variants, and timing details retained | 14,317 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 312 private local French drafts of 14,629; 13 Quran-quote holds and one incomplete-source hold; 14,317 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-059 | 6c91584b-85c8-4576-a2da-2efa88eed7ff (Bukhari 331), 906818bf-b302-4077-8ef0-75e58d172635 (Bukhari 332), 8036bdcf-222a-43fc-a798-0b52368e369c (Bukhari 333), cf8bb1c1-723e-4046-95c6-827336c02ea3 (Bukhari 334), 5b411f15-b222-488f-a7d8-08c2a3b39112 (Bukhari 335), e66f7557-006c-4cd2-b235-1529c6a4b536 (Bukhari 336) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; timing, narrator chains, and reported circumstances preserved | 14,311 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 318 private local French drafts of 14,629; 13 Quran-quote holds and one incomplete-source hold; 14,311 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-060 | 587205d2-36ec-4a80-9024-3fbcbc78d8e4 (Bukhari 337), 7d382654-4b25-4e77-8e8f-702b13bff778 (Bukhari 338), e6020dde-32dd-461b-bd8b-204fde15bccd (Bukhari 339), 531e8546-c11b-470f-81e4-0fa7e9d197b8 (Bukhari 340), aa2afa10-736c-46e2-a725-cda1924339af (Bukhari 341), 8fd3aca4-baf8-4a47-b85b-5f0e8cad6c02 (Bukhari 342) | 5 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, and five complete translations passed; Bukhari 342 lacks hadith wording and remains blank on hold | 14,306 | Five private local AI drafts; unpublished; no human review; one source hold |

- Updated hadith progress: 323 private local French drafts of 14,629; 13 Quran-quote holds and two incomplete-source holds; 14,306 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-061 | a7675c58-a449-4c5e-b142-ef88e8d2a9c4 (Bukhari 343) | 1 | 0 | 0 | Arabic hash, ID, URL, reference, rights, private status, and complete translation passed | 14,305 | Private local AI draft; unpublished; no human review |

- Updated hadith progress: 324 private local French drafts of 14,629; 13 Quran-quote holds and two incomplete-source holds; 14,305 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-062 | c3a74abb-3804-4426-a396-46d57b2dbab4 (Bukhari 344) | 1 | 0 | 0 | Arabic hash, ID, URL, reference, rights, private status, and full single-item translation passed; narrator uncertainty and reported speech preserved | 14,304 | Private local AI draft; unpublished; no human review |

- Updated hadith progress: 325 private local French drafts of 14,629; 13 Quran-quote holds and two incomplete-source holds; 14,304 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-063 | 7178f1c6-9719-401d-aea2-34c65ad2c9d2 (Bukhari 345), de0e2723-a4a6-48cb-8c4a-edb8671448d7 (Bukhari 346), d8b81234-5cb9-4ce3-b49a-f05601d6378d (Bukhari 347), 6a7727c4-f10a-4f5a-bf9b-597469868838 (Bukhari 348) | 3 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, and three complete translations passed; Bukhari 347 Quran quotation remains blank on hold | 14,301 | Three private local AI drafts; unpublished; no human review; one Quran quote hold |

- Updated hadith progress: 328 private local French drafts of 14,629; 14 Quran-quote holds and two incomplete-source holds; 14,301 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-064 | 75053806-0ca1-4380-881d-448918dd08cc (Bukhari 349) | 1 | 0 | 0 | Arabic hash, ID, URL, reference, rights, private status, and full single-item translation passed; narrator variants and reported sequence preserved | 14,300 | Private local AI draft; unpublished; no human review |

- Updated hadith progress: 329 private local French drafts of 14,629; 14 Quran-quote holds and two incomplete-source holds; 14,300 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-065 | 0683b548-7e26-4332-b761-5e4f2b79edc3 (Bukhari 350), da35597a-f1ec-46b4-a0d5-80f59cfb1bf7 (Bukhari 351), b5d824ec-a282-4602-8d7d-fac463a7a879 (Bukhari 352), 86420afc-8b77-4cef-bfa2-60e2604cf137 (Bukhari 353), 5e7f3f3f-6207-417f-9cd1-3d851739b0b9 (Bukhari 354), 4c9607d8-d61c-415d-8619-90dfad96b5c9 (Bukhari 355) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; chain variant and clothing descriptions preserved | 14,294 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 335 private local French drafts of 14,629; 14 Quran-quote holds and two incomplete-source holds; 14,294 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-066 | 239c5730-f76c-4bf1-b384-d42b3ee728e1 (Bukhari 356), ac22316d-23de-45ac-ad49-d14dacb89433 (Bukhari 357), 7fb0ed9b-e6b2-46f6-9007-cc90a02523c2 (Bukhari 358), 0678c6a1-12da-40cb-95fa-28f5cf42ac3f (Bukhari 359), 3eabd420-7471-4c2d-b505-07052647d3d0 (Bukhari 360), 0a57f30c-b83a-498a-aadc-c8cfc06cefb1 (Bukhari 361) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; narrator chains, dialogue and clothing descriptions retained | 14,288 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 341 private local French drafts of 14,629; 14 Quran-quote holds and two incomplete-source holds; 14,288 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-067 | 38bf3eee-5659-4100-bad6-8e84cc5399a8 (Bukhari 362), 92f76b3e-3d86-4da9-aaac-cd0ffe943271 (Bukhari 363), 5290b2e0-a9e8-48dd-8d32-c421fba84ae9 (Bukhari 364), e5297e1b-8020-44f3-907a-9252cf42323f (Bukhari 365), 2131e301-d9ac-4340-9f29-65fbde9d81a2 (Bukhari 366), 859e562b-f844-4579-9a76-817ed86dcb81 (Bukhari 367) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; clothing descriptions and chain details retained | 14,282 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 347 private local French drafts of 14,629; 14 Quran-quote holds and two incomplete-source holds; 14,282 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-068 | 92ecf68a-cc0a-49e3-a0e3-acd3a2d0eedd (Bukhari 368), 77100e8d-6c7a-4270-b98c-95edfc0cb143 (Bukhari 369), f21f175e-095b-44d8-8c84-829916c4ac30 (Bukhari 370) | 3 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all three complete translations passed; narrator sequence and repeated proclamation retained | 14,279 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 350 private local French drafts of 14,629; 14 Quran-quote holds and two incomplete-source holds; 14,279 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-069 | d7522930-a5e9-4abc-96d3-67ca7ef4b228 (Bukhari 371) | 1 | 0 | 0 | Arabic hash, ID, URL, reference, rights, private status, and full single-item translation passed; reported uncertainty and narration sequence preserved | 14,278 | Private local AI draft; unpublished; no human review |

- Updated hadith progress: 351 private local French drafts of 14,629; 14 Quran-quote holds and two incomplete-source holds; 14,278 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-070 | 73ab7fc8-fd73-4e12-ab74-c9a06cd34966 (Bukhari 372), af20f3e5-0ca7-4873-a917-ae1c06bd4190 (Bukhari 373), 76de97ca-47cc-4034-a119-f490373467c8 (Bukhari 374), f579151e-f55b-438d-b122-0ffd664a309c (Bukhari 375), 3143bca3-ccb7-47b0-ae92-d8f6533215ee (Bukhari 376), ce43f368-9425-4b60-a09a-8bc32eed8d43 (Bukhari 377) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; alternative wording and final source commentary retained | 14,272 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 357 private local French drafts of 14,629; 14 Quran-quote holds and two incomplete-source holds; 14,272 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-071 | 828ea572-f487-4ea1-8011-4d16f16d7438 (Bukhari 378), 14f96ffb-8547-4070-a178-714b7e8ce5e3 (Bukhari 379), 5a4b7b30-0554-4830-812c-cf9cfe388e35 (Bukhari 380), eccb4956-0b52-4ba6-abea-23b54705739c (Bukhari 381), a06b364f-85e9-4173-8760-5c1af96c9e40 (Bukhari 382), 3437c213-fda4-43ee-9981-c132770429a4 (Bukhari 383) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; narrator chain and prayer sequence details preserved | 14,266 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 363 private local French drafts of 14,629; 14 Quran-quote holds and two incomplete-source holds; 14,266 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-072 | 3cb8b688-f8c7-469e-a5b9-6dbbed57faef (Bukhari 384), 618f1cf3-bb23-4e72-ba2b-6fd80a2552f6 (Bukhari 385), 818368ca-ee42-4329-b3c7-5e4a114100b6 (Bukhari 386), 4b83b3f7-03aa-40ce-9c63-de132a7df97b (Bukhari 387), 59fb542f-4fec-4f80-94b9-eee06e6240bb (Bukhari 388), 6ae7d0f3-f27e-4c69-862b-599d15cca70c (Bukhari 389) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; narrator uncertainty and action details preserved | 14,260 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 369 private local French drafts of 14,629; 14 Quran-quote holds and two incomplete-source holds; 14,260 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-073 | c828deed-d276-478d-9dfe-e41c899d501f (Bukhari 390), dadc05d2-7622-424c-8a6b-e20b7c3b55a0 (Bukhari 391), 84ca741c-fb81-4481-a676-faff54c5da66 (Bukhari 392), fbea8ff7-34a5-439f-b7eb-27aaca74d5e2 (Bukhari 393), 489e2c14-9d35-455b-96bb-478c2ef6c1eb (Bukhari 394), fad75c64-d14e-485e-9399-be0feb87616b (Bukhari 395–396) | 5 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, and five complete translations passed; Bukhari 395–396 Quran quotation remains blank on hold | 14,255 | Five private local AI drafts; unpublished; no human review; one Quran quote hold |

- Updated hadith progress: 374 private local French drafts of 14,629; 15 Quran-quote holds and two incomplete-source holds; 14,255 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-074 | 40f7ebb9-ab36-41bb-b5ed-d18481372464 (Bukhari 397), d502bf73-cfc3-4feb-925a-fadd4e99d1a2 (Bukhari 398), 1cd6f6e5-3eb7-4613-be20-1baecf978d88 (Bukhari 399), b884e851-766b-4fae-aa80-9e6a876bef18 (Bukhari 400), 94c7c6d5-a0b5-4e8c-81d7-7ae12ad93f68 (Bukhari 401), ed544027-03ab-46ae-af90-521b118622f9 (Bukhari 402) | 4 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, and four complete translations passed; Bukhari 399 and 402 Quran quotations remain blank on hold | 14,251 | Four private local AI drafts; unpublished; no human review; two Quran quote holds |

- Updated hadith progress: 378 private local French drafts of 14,629; 17 Quran-quote holds and two incomplete-source holds; 14,251 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-075 | 4e84ad79-c62c-46e2-b211-ccbcd08dcefd (Bukhari 402b), b6f040c7-3be5-44d7-9464-049771c5daeb (Bukhari 403), 84db0ccb-4c10-48d5-bf7c-550fc754f62d (Bukhari 404), 7eff2a70-b9ee-48c7-8bd5-9ccf2e753ca4 (Bukhari 405), 03942509-fbbf-48f4-99ec-13dbb307e769 (Bukhari 406), 7d9bfb06-14f9-4232-9711-ae247358de69 (Bukhari 407) | 5 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, and five complete translations passed; Bukhari 402b lacks the referenced wording and remains blank on hold | 14,246 | Five private local AI drafts; unpublished; no human review; one source hold |

- Updated hadith progress: 383 private local French drafts of 14,629; 17 Quran-quote holds and three incomplete-source holds; 14,246 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-076 | a5338e46-adc8-4afd-adf9-5c2ba98b21eb (Bukhari 408–409), 49088c40-6fde-4920-909b-f6a6c704a54d (Bukhari 410–411), c1e1e875-675c-465e-bfce-4621d7ae43d9 (Bukhari 412), 1c28b156-aaf7-4a03-8cee-22688208d109 (Bukhari 413), f0b72248-2ad2-441c-ac8b-da9c65e04bff (Bukhari 414), fe2b2a61-d1d0-4b56-9e26-1544822d9c73 (Bukhari 415) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; shared transmission details retained | 14,240 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 389 private local French drafts of 14,629; 17 Quran-quote holds and three incomplete-source holds; 14,240 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-077 | 558500ab-18b4-4b36-afdb-d5b8b360bec6 (Bukhari 416), 09dc0519-b691-4ec0-9c83-fa5faa63dad3 (Bukhari 417), 921ae432-e65f-4d74-b66d-8c37957c6f20 (Bukhari 418), a831bcbf-fa85-4ad5-940d-c8f1b2354d7d (Bukhari 419), d00b1ce5-a5e7-4e3c-95ca-a3d8c3e5c078 (Bukhari 420), 58d37cf8-5004-41ab-a67d-2cb40b1dcfb1 (Bukhari 421) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; variants and full distribution account preserved | 14,234 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 395 private local French drafts of 14,629; 17 Quran-quote holds and three incomplete-source holds; 14,234 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-078 | e14f9b76-5a68-4a53-b7ac-585ddd178bff (Bukhari 422), b4392942-ba4d-4206-9bad-ad251c7da3e8 (Bukhari 423), f9644bb1-859d-4003-8306-825641f57ea9 (Bukhari 424) | 3 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all three complete translations passed; legal term and narrator sequence preserved | 14,231 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 398 private local French drafts of 14,629; 17 Quran-quote holds and three incomplete-source holds; 14,231 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-079 | 8e222978-823d-4765-8509-017669a106a5 (Bukhari 425) | 1 | 0 | 0 | Arabic hash, ID, URL, reference, rights, private status, and full single-item translation passed; alternate narrator name and reported speech preserved | 14,230 | Private local AI draft; unpublished; no human review |

- Updated hadith progress: 399 private local French drafts of 14,629; 17 Quran-quote holds and three incomplete-source holds; 14,230 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-080 | ff69a3a8-bd37-4bac-aab4-5868b9a40d6b (Bukhari 426), 6ac181d4-6215-4cf3-8a0f-23478592d268 (Bukhari 427), 3c766dc1-becb-4854-9523-d633bb4e2f31 (Bukhari 428), fb852e65-7b1d-4682-94b9-04f2bbfc4153 (Bukhari 429), 94c3d38e-53ad-4010-b35e-a81ece866084 (Bukhari 430), 1cb4471e-5bff-43b9-9e23-71f1910d3d62 (Bukhari 431) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; names, terms and narrative sequence preserved | 14,224 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 405 private local French drafts of 14,629; 17 Quran-quote holds and three incomplete-source holds; 14,224 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-081 | 989c79e0-f262-46dd-aa0f-002f5a3f651b (Bukhari 432), fe4d5def-d59a-4c85-b0ab-ce8dff867ee9 (Bukhari 433), 092ea3a8-f60d-4073-8bf9-dfe7c968434a (Bukhari 434), 0203bbcc-a963-4dcf-b554-e3e0d25aa6fe (Bukhari 435–436), 508dcfc7-3e82-49bb-bdd4-778ae8c07e61 (Bukhari 437), bbe0751a-605d-446b-997f-228b625ae33d (Bukhari 438) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; narrator variants and prayer details retained | 14,218 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 411 private local French drafts of 14,629; 17 Quran-quote holds and three incomplete-source holds; 14,218 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-082 | ae166293-4ae4-40f6-833e-60e05b40c3db (Bukhari 439), bb326308-d047-4390-a886-2b559ce70e48 (Bukhari 440), 4f40c56c-a50f-4468-9021-000b0bddea99 (Bukhari 441), 6dd2fe50-cdb1-412e-a837-3b8c3b754490 (Bukhari 442), 7bab81f3-dac3-4070-8f1b-794c00834e65 (Bukhari 443), e1cedb7b-2c4d-48d7-b2a5-bfa69957acdf (Bukhari 444) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; narrator uncertainty and sequence preserved | 14,212 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 417 private local French drafts of 14,629; 17 Quran-quote holds and three incomplete-source holds; 14,212 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-083 | d84426c2-3291-4728-99ab-eafdd9c5b3ee (Bukhari 445), 36f7e951-f859-439e-8ae0-ec79543f5322 (Bukhari 446), 1d3100c7-cd6a-4ff0-a5e5-38c4efae6225 (Bukhari 447), e453d3c9-9d24-4518-9e78-79477c9b8193 (Bukhari 448), 5e199624-60dc-4e00-9d53-326e87c54e28 (Bukhari 449), 543843f2-03fb-4520-86dd-374604fe21a7 (Bukhari 450) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; narrator uncertainty and material details preserved | 14,206 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 423 private local French drafts of 14,629; 17 Quran-quote holds and three incomplete-source holds; 14,206 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-084 | 1574b131-7335-49f0-be9c-959ce0b30c2e (Bukhari 451), 5103c44b-cdab-4803-af79-8d6a0d3eb698 (Bukhari 452), 2004ca76-a008-403d-8ed9-07bc98fcb12c (Bukhari 453), e54e79ae-3d9b-4076-80d9-3a97a92c2bdc (Bukhari 454–455), 5bb1cce6-2dca-4e48-9d6a-086e29188c6e (Bukhari 456), 23180f9e-d8a3-4c9e-b157-07e01f453c3f (Bukhari 457) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; variants and narrator details retained | 14,200 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 429 private local French drafts of 14,629; 17 Quran-quote holds and three incomplete-source holds; 14,200 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-085 | 4a5d7dc2-17de-4d80-a628-5d0cd9a90baf (Bukhari 458), 3ec27e0f-f502-4e66-bec5-8bb22d960518 (Bukhari 459), 615bc562-6b49-41d7-8350-bcd30462692c (Bukhari 460), fef62d7c-3c17-4f0a-bea3-be74c16e3f60 (Bukhari 461), d4152a10-c8b2-429d-8c64-f75e40df9e28 (Bukhari 462), 6d0f2b36-baf1-4ef0-a201-3b7c456e5887 (Bukhari 463) | 5 | 0 | 0 | Arabic hashes, IDs, URLs, references, and five complete translations passed; Bukhari 461 Quran quotation remains blank on hold | 14,195 | Five private local AI drafts; unpublished; no human review; one Quran quote hold |

- Updated hadith progress: 434 private local French drafts of 14,629; 18 Quran-quote holds and three incomplete-source holds; 14,195 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-086 | d82636a5-3f82-46c4-8f6e-6f82018d8842 (Bukhari 464), 6930f743-1ec3-424c-b4e3-c3fd359a6ea7 (Bukhari 465), 2abf3904-6b1b-42de-8459-f24ae9cadfd1 (Bukhari 466), c181d141-9480-409a-b892-4178e2cec166 (Bukhari 467), 38abc9f6-52a6-47b0-a708-31f06e9c845e (Bukhari 468), 351cc959-9410-485c-bf07-b737fddc448f (Bukhari 469) | 5 | 0 | 0 | Arabic hashes, IDs, URLs, references, and five complete translations passed; Bukhari 464 Quran quotation remains blank on hold | 14,190 | Five private local AI drafts; unpublished; no human review; one Quran quote hold |

- Updated hadith progress: 439 private local French drafts of 14,629; 19 Quran-quote holds and three incomplete-source holds; 14,190 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-087 | cd8e251e-3f7d-4186-9ba8-fb1fbbf6fb17 (Bukhari 470), 124d8f02-beef-4121-b662-9ceccd70f2bf (Bukhari 471), 20c87339-1c73-4f80-8d99-3db1d7c1f36d (Bukhari 472), 801fe7bd-6408-439e-bfc0-9d2ca94a6178 (Bukhari 473), 28bf090f-90e2-4008-9c20-6f3797ce6245 (Bukhari 474), 97bc3cf6-812c-4a6a-b015-0702010a5651 (Bukhari 475) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; alternates and narrator details retained | 14,184 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 445 private local French drafts of 14,629; 19 Quran-quote holds and three incomplete-source holds; 14,184 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-088 | 33e0b84d-3432-452f-8722-876a38a7dde7 (Bukhari 476), 9e7a85ea-aa2d-4086-80ff-3c8a6de1f7d4 (Bukhari 477), 69869557-4bb7-4217-a17e-0bea103028c0 (Bukhari 478), c6baa56e-10d5-4dc0-a1d5-5e1264c318a9 (Bukhari 480), 7cf87c4a-fe82-49ce-91c1-4dea7b4a41b7 (Bukhari 481), f1f0fbe3-fe3b-4dae-a209-26bb7ee404dd (Bukhari 482) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; alternate narrator, prayer uncertainty, chains, and narrative sequence preserved | 14,178 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 451 private local French drafts of 14,629; 19 Quran-quote holds and three incomplete-source holds; 14,178 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-089 | c35bd8a3-eebc-4212-928b-6b4905ae1440 (Bukhari 483), 1ef49a0d-240a-4fa0-af98-e5abe23d1b38 (Bukhari 484), 3a280096-cc89-4a32-9de3-32171a7a067b (Bukhari 485), 0aeed7c6-8c98-4411-bac1-a940d9a544d6 (Bukhari 486), 88715623-b2d5-4aaf-be07-a8d688116d76 (Bukhari 487), 21a271c4-80e3-4467-a223-82bb4ffb7a5b (Bukhari 488) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; road locations and named places retained | 14,172 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 457 private local French drafts of 14,629; 19 Quran-quote holds and three incomplete-source holds; 14,172 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-090 | 265e7479-85b3-4d75-9e3c-3c81d39307b9 (Bukhari 489), 6cd3e514-44fb-4440-8da2-68800a9b93a3 (Bukhari 490), 5de624a9-78e7-4d20-90e3-c38050ddeef1 (Bukhari 491), 27a574d9-f9db-432c-8c9a-973e8064fc34 (Bukhari 492), b59cfbe3-62ed-4958-95c6-4f4162f04c26 (Bukhari 493), 22eefc5d-162c-4940-9c66-1956ae1611ea (Bukhari 494) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; place descriptions, age qualification, and prayer barrier detail preserved | 14,166 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 463 private local French drafts of 14,629; 19 Quran-quote holds and three incomplete-source holds; 14,166 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-091 | 061544a0-9320-4318-a53e-0c818069dff6 (Bukhari 495), dea292ec-c9c1-403b-b90d-9b63a548e94a (Bukhari 496), 69592e80-8dfe-44c6-8219-90df00e6acdb (Bukhari 497), 861cf587-2f71-45a0-9823-e5e376a3a28f (Bukhari 498), 18956e0b-f69e-4f85-849f-ea45f8b35b21 (Bukhari 499), 5bd6b880-75d7-45f8-a18f-40c8d7fdee21 (Bukhari 500) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; prayer counts, qualified items, and placement relations preserved | 14,160 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 469 private local French drafts of 14,629; 19 Quran-quote holds and three incomplete-source holds; 14,160 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-092 | e4ee8446-872a-496d-b16d-65f66e02cf0a (Bukhari 501), ad4cba50-9e2a-45d0-86ed-292cad83467f (Bukhari 502), aab9f445-74dc-4683-a85d-9ce936b7f46d (Bukhari 503), 51ae5f14-e3db-4f34-bb49-8d462ebbb1cb (Bukhari 504), 13ea657a-9330-4add-9300-a4de3bc2806d (Bukhari 505), e994cd52-6983-4d16-8ca6-1ef4d87075a9 (Bukhari 506) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; alternate pillar report and mosque column reference retained | 14,154 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 475 private local French drafts of 14,629; 19 Quran-quote holds and three incomplete-source holds; 14,154 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-093 | 6a5732fc-0295-43bb-8ef5-75cb0e65da0b (Bukhari 507), a633353e-e078-407d-ac48-0c9f17d0dc12 (Bukhari 508), 269c3a1b-dcc3-4687-ad6e-eedb170b1417 (Bukhari 509), 4dcb66fc-56ce-4cf3-b5f6-89bff88a82b7 (Bukhari 510), bf9d2758-95a8-4c48-8a2e-c31f919d9b82 (Bukhari 511), f5828736-f2da-4608-aff6-75ab4ab5407e (Bukhari 512) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; hadith body detail and variant chains preserved | 14,148 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 481 private local French drafts of 14,629; 19 Quran-quote holds and three incomplete-source holds; 14,148 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-094 | 21ce4976-84cf-4c23-b46b-a0eae7b8600a (Bukhari 513), 48c2e956-a3e6-404f-aaab-7f4c64df7320 (Bukhari 514), c00f9493-6d90-4176-9c4b-ad92d6b69fd2 (Bukhari 515), 617e09ac-f1ca-4e0a-ad9d-f9cea18bdf9d (Bukhari 516), d585896d-fab8-4569-936c-cda8559d0e0d (Bukhari 517), 8b21a9a4-f8e8-42fd-83af-db2f8a811133 (Bukhari 518) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; family references, narrator routes, and added wording variant retained | 14,142 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 487 private local French drafts of 14,629; 19 Quran-quote holds and three incomplete-source holds; 14,142 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-095 | cf6d4103-1324-414e-ad61-a0aa85f6f76c (Bukhari 519), 47e56c3b-3101-4342-ada8-224993a2df2c (Bukhari 520), 6eb97a2a-8886-47b9-86d3-c58733f92141 (Bukhari 521–522), 40990832-3a80-4978-bb36-84b51749be1e (Bukhari 523), a382cc29-dfd4-4d42-aa45-1d83d5734338 (Bukhari 524), d87d7ef8-9e82-47b0-8e98-37124bb4e22f (Bukhari 525) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; repeated prayers, delegated wording, and uncertain duration preserved | 14,136 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 493 private local French drafts of 14,629; 19 Quran-quote holds and three incomplete-source holds; 14,136 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-096 | bb6c7cfe-35a7-410d-84fb-407a666cc5cf (Bukhari 526), c2e30d12-ac65-4633-886d-6f2a7a8da3fb (Bukhari 527), 30fd44e7-7def-4f25-8a56-6265e2e8eea7 (Bukhari 528), 1a080d99-8bb4-4268-96ed-3d32c6cd3edc (Bukhari 529), ec5b1bde-a00d-4566-9884-3f4cab449408 (Bukhari 530), 6bdc83ea-349c-4b26-8109-59286cfaaf6e (Bukhari 531) | 5 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, and private status passed; five complete translations validated; Bukhari 526 remains blank on hold for embedded Quran 11:114 | 14,131 | Five private local AI drafts; unpublished; no human review; one Quran quote hold |

- Updated hadith progress: 498 private local French drafts of 14,629; 20 Quran-quote holds and three incomplete-source holds; 14,131 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-097 | fd571eae-38e2-465b-accd-13b1db0be610 (Bukhari 532), cd4e33b7-7ac7-4e72-a104-0d8a5b1f6e24 (Bukhari 533–534), c7180b8a-95e7-4025-85b3-a7860daf1e27 (Bukhari 535), b9bc40bf-a8db-4b8c-9ecb-695eafc9b41a (Bukhari 536–537), 84f4b728-cab3-4432-8d89-2ba39a535215 (Bukhari 538), b7c4995d-b05d-423f-a8b5-ea926a650045 (Bukhari 539) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; two narrator lines and variant wording retained | 14,125 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 504 private local French drafts of 14,629; 20 Quran-quote holds and three incomplete-source holds; 14,125 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-098 | 803f062a-c819-40bc-b751-3ad4cac2524e (Bukhari 540), 17dac191-bd7b-442e-97f6-41efe65d9389 (Bukhari 541), cd0297a2-ae3e-40ce-b667-e574d4a11a17 (Bukhari 542), 5d7665cf-b1c9-4326-b9c5-dc459183b6f7 (Bukhari 543), f34fc671-8c17-416b-84c4-88bfb8885b97 (Bukhari 544), 85ceff72-c7ca-4041-9d0c-90b79524a769 (Bukhari 545) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; prayer timing details, uncertainty, and text variants preserved | 14,119 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 510 private local French drafts of 14,629; 20 Quran-quote holds and three incomplete-source holds; 14,119 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-099 | 1b3146bf-02bc-41a2-81e6-5bf39dec5c13 (Bukhari 546), 3cf349ed-cdf7-4858-b23a-e05609ad240f (Bukhari 547), 33d32ecc-4dff-4bdf-a85f-b8c76576f80a (Bukhari 548), 3f5d3dd2-89cc-4b3a-9f36-ad0612f338b0 (Bukhari 549), 427f6cad-0c6e-44f0-8289-2a5ce7125a5c (Bukhari 550), cd622d1f-e292-409a-9892-b71c7d861985 (Bukhari 551) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; time qualifications and variants preserved | 14,113 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 516 private local French drafts of 14,629; 20 Quran-quote holds and three incomplete-source holds; 14,113 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-100 | 2f81890a-b970-4f6c-ae7f-4aa24114c936 (Bukhari 552), c4306883-411b-4d15-a886-bc4d4a6c4d6c (Bukhari 553), 39c1bf9b-3087-4a51-afe8-0c4b4400d4c7 (Bukhari 554), 0ee6be22-311e-4ded-8db2-8e9ffe6acf33 (Bukhari 555), 2a7f4aff-1f5f-4a03-80ce-15a27bdc0915 (Bukhari 556), 15237036-389b-451f-bd4e-ce4830f7df06 (Bukhari 557) | 5 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, and private status passed; five complete translations validated; Bukhari 554 remains blank on hold for embedded Quran 50:39 | 14,108 | Five private local AI drafts; unpublished; no human review; one Quran quote hold |

- Updated hadith progress: 521 private local French drafts of 14,629; 21 Quran-quote holds and three incomplete-source holds; 14,108 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-101 | 12318cf5-7088-46f1-a116-6ab82e383d32 (Bukhari 558), 6eba2c69-448d-4a5d-b3dd-65c3e816046f (Bukhari 559), 698322a8-5c75-4e63-adff-126280415403 (Bukhari 560), 2cb093a8-3154-432d-8826-24e00a5f700f (Bukhari 561), 73fca41a-742e-4c88-b9a0-a393874241ba (Bukhari 562), cc0878b6-c500-4bb3-9e39-c74230f6090d (Bukhari 563) | 6 | 0 | 0 | Arabic source hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; reported numbers and narrator uncertainty preserved | 14,102 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 527 private local French drafts of 14,629; 21 Quran-quote holds and three incomplete-source holds; 14,102 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-102 | cbc76763-26b0-4a8d-a943-d8b3f906f48a (Bukhari 564), f0db8197-940f-4e13-b460-6ee6d513d1d5 (Bukhari 565), 2e546329-ecbe-4752-9f3a-8649741580be (Bukhari 566), 241b7954-34da-4337-8064-4ae3c4053287 (Bukhari 567), 7bfad6db-9a1f-4b62-8a53-a5e647bb0df8 (Bukhari 568), 0ecfbea3-a790-4b35-8dbe-0e5ca374e89a (Bukhari 569) | 6 | 0 | 0 | Arabic source hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; century wording and narrator notes preserved | 14,096 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 533 private local French drafts of 14,629; 21 Quran-quote holds and three incomplete-source holds; 14,096 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-103 | 7cf732a9-a13f-4e38-83f1-2ff20d2558a2 (Bukhari 570–571) | 1 | 0 | 0 | Arabic hash, ID, URL, reference, rights, private status, and complete long single-item translation passed; narrator layers and repeated report detail preserved | 14,095 | Private local AI draft; unpublished; no human review |

- Updated hadith progress: 534 private local French drafts of 14,629; 21 Quran-quote holds and three incomplete-source holds; 14,095 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-104 | a8974a9a-1bd6-4727-87a5-5a5cb9c136e6 (Bukhari 572), 944b068e-c0e7-484a-9b39-3b0cc63c3cc6 (Bukhari 573), fcf3c0ad-4803-4b71-b54c-330b19b315af (Bukhari 574), 0bab21b6-8444-47b7-80ca-698e0d67a8b1 (Bukhari 575), 470dfd89-9f92-4c34-9a83-6d6a1ef077fd (Bukhari 576) | 4 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, and private status passed; four complete translations validated; Bukhari 573 remains blank on hold for embedded Quran 50:39 | 14,091 | Four private local AI drafts; unpublished; no human review; one Quran quote hold |

- Updated hadith progress: 538 private local French drafts of 14,629; 22 Quran-quote holds and three incomplete-source holds; 14,091 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-105 | 6fd68749-da69-4d0d-a11f-b9e4db422da3 (Bukhari 577), 69f8cacf-926c-44a6-8007-3fa948d11765 (Bukhari 578), 40c31822-94c7-4d4f-983a-de6a09505599 (Bukhari 579), 248d92ca-d6c8-4f7d-b26d-3811d8d29af4 (Bukhari 580), 6ec7e3ea-a71b-40d2-8c23-95b8c53e304f (Bukhari 581), d96b3ae4-d69d-48b2-a5a7-93f99dc24eef (Bukhari 582–583) | 6 | 0 | 0 | Arabic source hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; narrated numbers and repeated report wording preserved | 14,085 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 544 private local French drafts of 14,629; 22 Quran-quote holds and three incomplete-source holds; 14,085 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-106 | f459ad55-df52-4379-85dc-90334c41405d (Bukhari 584), 1773f907-b7de-4b19-a9dc-f32121081154 (Bukhari 585), dbd7ddc5-b5ba-4104-95db-9d9738732bb2 (Bukhari 586), 3597c32c-f903-4c0a-973d-1c762b43159c (Bukhari 587), 0a32e39d-e1f6-4248-b881-d63f05e5a10c (Bukhari 588), c18400c3-24d3-485f-8cfb-f2e9ec8d089d (Bukhari 589) | 6 | 0 | 0 | Arabic source hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; exclusions and prayer windows retained | 14,079 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 550 private local French drafts of 14,629; 22 Quran-quote holds and three incomplete-source holds; 14,079 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-107 | db0e9997-2e59-4f14-9afc-b1aaa08eef86 (Bukhari 590), 221b64a1-81e4-4f86-bff1-80a99f7a25a6 (Bukhari 591), 1fbba49b-66de-45cc-ba7f-e8a296c71a6a (Bukhari 592), f04e4780-3147-472f-bb69-e4f3d9bff5ed (Bukhari 593), b5415d3c-876b-48f9-a0da-ca79dc5914fd (Bukhari 594), 80de9b46-005f-466f-a61f-96b750368f76 (Bukhari 595) | 6 | 0 | 0 | Arabic source hashes, IDs, URLs, references, rights, private status, and all six complete translations passed; prayer timings, related variants, and travel narrative retained | 14,073 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 556 private local French drafts of 14,629; 22 Quran-quote holds and three incomplete-source holds; 14,073 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
| FR-LIB-HAD-BUKHARI-108 | 3ab76c1b-4c64-4360-bcf0-9b6cf6738098 (Bukhari 596), d71afbda-638d-40d2-a263-95f7cb7555da (Bukhari 597), aa14eb23-529a-4443-a30b-baaa6deee0fa (Bukhari 598), e5bc3c1a-daa7-4d12-ba83-82710f596be0 (Bukhari 599), e3d4356d-c94c-4e2a-a778-b2fa9df76401 (Bukhari 600), 009a9330-cb26-4eed-a5db-71ea9392d95f (Bukhari 601) | 5 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, and private status passed; five complete translations validated; Bukhari 597 remains blank on hold for embedded Quran 20:14 | 14,068 | Five private local AI drafts; unpublished; no human review; one Quran quote hold |

- Updated hadith progress: 561 private local French drafts of 14,629; 23 Quran-quote holds and three incomplete-source holds; 14,068 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

### 2026-10-29: saved chat interface copy

- `FR-UI-HC-002` saved 25 French labels and messages from `lib/chat-text.ts`: `recent`, `newChat`, `openRecent`, `close`, `today`, `yesterday`, `earlier`, `oneQuestion`, `manyQuestions`, `deleteChat`, `deleteAsk`, `deleteYes`, `deleteNo`, `deleteAll`, `deleteAllAsk`, `savedInAccount`, `nothingSaved`, `keepTitle`, `keepText`, `signInButton`, `loading`, `empty`, `loadError`, `retry`, and `openError`.
- `FR-UI-HC-003` saved the remaining 5: `saveError`, `unavailable`, `opened`, `started`, and `deleted`.
- Both batches passed source-file, unique-ID, nonempty French, and placeholder checks. The guarded local preview loads these draft batches. No locale route, public API, or Ask submission behavior changed.
- Code-level visitor-copy coverage increased from 24 to 54 saved strings. The full copy audit remains incomplete; account and other page-specific/control text still need review. Neither batch is human-reviewed or published.

### 2026-10-29: account and privacy interface copy

- `FR-UI-HC-004` saved 25 French account labels: `title`, `intro`, `signInTitle`, `signUpTitle`, `forgotTitle`, `resetTitle`, `email`, `password`, `newPassword`, `passwordHint`, `show`, `hide`, `consent`, `privacyLink`, `signIn`, `createAccount`, `sendReset`, `saveNewPassword`, `signOut`, `resend`, `noAccount`, `haveAccount`, `forgot`, `back`, and `working`.
- `FR-UI-HC-005` saved the remaining 24 account and data-control messages: `checkEmail`, `resetSent`, `passwordChanged`, `wrongLogin`, `notConfirmed`, `confirmationResent`, `weakPassword`, `invalidEmail`, `consentRequired`, `error`, `tooMany`, `signedInAs`, `saved`, `yourData`, `exportData`, `researchPrivacy`, `deleteChats`, `deleteChatsAsk`, `deleteAccount`, `deleteAccountAsk`, `deleteYes`, `deleteNo`, `chatsDeleted`, and `accountDeleted`.
- Both batches passed source-file, unique-ID, nonempty French, and placeholder checks. The consent, deletion and privacy messages remain drafts and are not integrated into account flows.
- Code-level visitor-copy coverage increased from 54 to 103 saved strings. The full audit remains incomplete; page-specific copy, learning visual labels, and other controls still need review. Human review: 0; published: 0.

### 2026-10-29: learning and reading controls

- `FR-UI-HC-006` saved 25 French learning labels and messages (`title` through `sources`); `FR-UI-HC-007` saved the next 25 (`quran` through `guideStatus`); `FR-UI-HC-008` saved the final 10 (`noPersonal`, `expand`, `collapse`, and the five prayer names). All entries come from `lib/learning/text.ts` and the artifacts hold each source string and French draft.
- The three batches passed source-file, unique-ID, nonempty French, and placeholder checks. The prayer names retain the forms already used in French lesson drafts.
- Code-level visitor-copy coverage increased from 103 to 163 saved strings. The private preview reads these saved artifacts; the full source-code audit remains incomplete, including the interactive learning visuals and other reader and Ask controls. No live locale or route was changed. Human review: 0; published: 0.

### 2026-10-29: Ask research progress and review messages

- `FR-UI-HC-009` saved 18 French messages from `components/StableAnswerView.tsx` and `components/RichAnswerView.tsx`: source-search stages and details, retrying source selection, reconnecting, review notices, the incomplete-summary message, and the personal-ruling notice. Full source IDs and English text are retained in the batch artifact.
- The batch passed source-file, unique-ID, nonempty French, and placeholder checks. It is displayed as a private draft only; the live Ask flow and API language checks were not changed.
- Code-level visitor-copy coverage increased from 163 to 181 saved strings. Other hard-coded page, reader, and interactive learning text still needs an inventory and translation. Human review: 0; published: 0.

### 2026-10-29: Hard Questions interface and section labels

- `FR-UI-HC-010` saved 25 French page labels, review notices and source-description messages from `lib/learning/hard-questions.ts`. `FR-UI-HC-011` saved the final section label. The four French section labels match the headings used by the saved article drafts: `La réponse claire`, `Approfondissons`, `Questions complémentaires`, and `Pour continuer :`.
- Both batches passed source-file, unique-ID, nonempty French, and placeholder checks. The saved translations remain draft-only and are shown in the private preview.
- Code-level visitor-copy coverage increased from 181 to 207 saved strings. French page parsing remains private-preview-only; this work did not make `/fr` routes active. Other page and interactive visual text still needs review. Human review: 0; published: 0.

### 2026-10-29: learning audio and Quran reference labels

- `FR-UI-HC-012` saved the Talbiyah audio control label and the Quran source label from the learning reader components. The established prayer-name transliterations remain unchanged.
- The batch passed source-file, unique-ID, nonempty French, and placeholder checks. Code-level visitor-copy coverage increased from 207 to 209 saved strings. The broader interactive visual inventory remains open.

### 2026-10-29: shared navigation label

- `FR-UI-HC-013` saved the French close-menu accessibility label from `components/Shell.tsx`. It passed its focused source-file, unique-ID, nonempty-text, and placeholder checks.
- Code-level visitor-copy coverage increased from 209 to 210 saved strings. The comprehensive code audit remains open because several interactive learning visuals contain additional embedded copy.

### 2026-10-29: six pillars learning visual

- `FR-UI-HC-014` saved 16 French labels and descriptions from `components/learning/SixPillarsImanVisual.tsx`. Each record keeps the corresponding Arabic source wording alongside the English field and private French draft. This avoids carrying English additions that are not present in the Arabic wording.
- The focused validator checked unique IDs, source-file presence, nonempty French, and placeholders; the Arabic/French pairs were compared while drafting. The copy remains AI-drafted, with no human review or publication.
- Code-level visitor-copy coverage increased from 210 to 226 saved strings. Other interactive learning visuals remain to be inventoried and reviewed.

### 2026-10-29: supplication etiquette visual

- `FR-UI-HC-015` saved 11 French headings and explanations from `components/learning/DuaEtiquetteVisual.tsx`. Each record keeps the related Arabic source wording, including the conditions and recommended wording used in the visual.
- The focused validator checked source-file presence, unique IDs, nonempty French, and placeholders; the Arabic/French pairs were compared during drafting. The material remains private AI draft content with no human review or publication.
- Code-level visitor-copy coverage increased from 226 to 237 saved strings. Other interactive learning visuals remain to be inventoried.

### 2026-10-29: Ramadan timeline visual and held quote

- `FR-UI-HC-016` saved 17 French headings, times and explanations from `components/learning/RamadanTimelineVisual.tsx`, using the Arabic wording in that component as the source. The batch validator checked IDs, file presence, nonempty French and placeholders; the Arabic/French pairs were compared during drafting.
- The visual also contains a purported Prophetic supplication at iftar, but its code has no source ID, link or rights record. The French quote meaning and its Prophet-attribution label remain blank and are recorded under Needs Mo until the exact source and an approved, permitted French version are confirmed.
- Code-level visitor-copy coverage increased from 237 to 254 saved strings. Website Needs Mo: 1 item. No Quran meaning was generated; no live code, locale route or database was changed.

### 2026-10-29: daily prayer-times visual

- FR-UI-HC-017 saved 25 French labels and descriptions from components/learning/PrayerTimesVisual.tsx; FR-UI-HC-018 saved the final 5. Each draft keeps the exact Arabic wording and the lesson’s mapped source references.
- The batches passed source-file, unique-ID, nonempty French, and placeholder checks. Mapped references were preserved: resident prayer counts to Ibn Baz 17464; time signs to Muslim 612d/612e; the Asr shadow boundary to Ibn Baz 3961/9516; and the night boundary to Ibn Baz 17595.
- Code-level visitor-copy coverage increased from 254 to 284 saved strings. All remain private AI drafts, with no human review or publication.

### 2026-10-29: five pillars learning visual

- `FR-UI-HC-019` saved 24 French labels and descriptions from `components/learning/FivePillarsVisual.tsx`; `FR-UI-HC-020` saved the remaining two Hajj descriptions. The paired Arabic wording is retained where the component provides it, and the five-pillars lesson references are recorded.
- The Zakah description includes an unsupported flat “usually 2.5%” rate. Its French wording is saved only as a private draft and is marked Needs Mo; the mapped lesson says an individual calculation needs relevant details and does not support that figure. The draft must not be used until a supporting source and conditions are approved.
- The batches passed the focused source-file, unique-ID, nonempty-text and placeholder checks. Code-level visitor-copy coverage increased from 284 to 310 saved strings. Website Needs Mo: 2 items, including the existing Ramadan supplication attribution hold. No live code or public locale routing changed.

### 2026-10-29: Hajj journey visual

- `FR-UI-HC-021` and `FR-UI-HC-022` saved French drafts for all 30 labels and station descriptions in `components/learning/HajjJourneyVisual.tsx`. Where paired Arabic text exists, the French follows it; extra English-only details were omitted when they did not appear in that Arabic wording. No French version of the Arabic Talbiyah recitation was generated.
- All 30 strings are held under Needs Mo. The mapped Hajj lesson cites Muslim 1218a for orientation examples and explicitly warns that those examples are not a full ritual sequence; the visual supplies no per-claim sources for its six stations, timings and detailed rulings. The drafts must not be used until those claims receive source review.
- Both batches passed the focused source-file, unique-ID, nonempty-text and placeholder checks. Code-level visitor-copy coverage increased from 310 to 340 saved strings. Website Needs Mo: 3 items, including the Ramadan supplication and the unsupported Zakah rate. No live code or public locale routing changed.

### 2026-10-29: interactive prayer-unit trainer

- `FR-UI-HC-023` and `FR-UI-HC-024` saved French for the 39 distinct English values and six display labels in `components/learning/PrayerUnitTracker.tsx`. The French follows paired Arabic instructions, keeps all unit counts, preserves the stop/continue distinctions in the middle sitting, and does not translate the Arabic recitations or their pronunciation aids.
- The source map for the prayer lesson supplies the referenced reports and scholar guidance for these steps. This remains an AI draft with no human review or publication.
- Both batches passed source-file, unique-ID, nonempty-French and placeholder checks. A cross-file audit also confirmed 385 saved hardcoded-copy records with 385 unique IDs. Coverage increased from 340 to 385; the three previously recorded Needs Mo items remain open.

### 2026-10-29: prayer and ablution step guide; Al-Fatiha controls

- `FR-UI-HC-025` through `FR-UI-HC-027` saved French for the 52 distinct English labels and explanations in `components/learning/LearningMarkdown.tsx`. Arabic source wording and mapped lesson references are retained. The Arabic prayer phrases and Latin pronunciation aid remain recitation text; no French Quran wording was generated.
- Eleven ablution strings are held because the mapped lesson says full washing is required but repeated washing is recommended, while the visual shows three repetitions without that distinction. One additional label for pointing the index finger during tashahhud is held because the local lesson source map does not identify its source. Both issues are recorded under Needs Mo.
- `FR-UI-HC-028` translated ten Al-Fatiha practice controls and accessibility labels. The seven Quran verse meanings were left untouched because the application has no confirmed approved, attributed French Quran translation. That is recorded as a website blocker.
- All four batches passed the focused source, unique-ID, nonempty-text and placeholder checks. A full saved-copy audit confirmed 447 rows and 447 unique IDs; the manifest now records six website Needs Mo items. None were integrated into public locale routing.

### 2026-10-29: remaining Ask, answer and comparison labels

- `FR-UI-HC-029` saved ten additional visitor-facing strings: Ask clarification topic names, the Hard Questions comparison-source label and note, and Rich Answer review, source-verification, disclaimer and donation labels. These are private French drafts; no Ask or answer flow was connected to French.
- The word “English” in `lib/i18n.ts` is the language’s self-name in the locale switcher. It is intentionally retained as a name, not translated as French visitor copy.
- The batch passed source-file, unique-ID, nonempty-text and placeholder checks. The saved hardcoded-copy inventory now contains 457 rows; website Needs Mo remains six.

### 2026-10-29: conditional learning-audio labels

- `FR-UI-HC-030` saved four more strings from conditional branches in `LearningMarkdown.tsx`: the Adhan, Shahadah and Quran-invocation audio labels, plus the French meaning field for the final greeting in prayer. The Arabic and phonetic recitations stay unchanged; no Quran verse wording was translated.
- The batch passed source-file, unique-ID, nonempty-French and placeholder checks. The code-level visitor-copy inventory now contains 461 rows; website Needs Mo remains six.

### 2026-10-29: visitor-copy audit reconciliation

- The direct website text audit now covers all visitor-facing English strings found in locale objects, JSX, accessibility labels, audio controls, learning visuals, the Ask interface and answer notices. The audit excludes the internal review page and the explicitly non-visitor Hadith test tool. Their staff-only labels were not counted as public website copy.
- All eligible discovered strings have local French drafts, except the specifically held material already listed under Needs Mo. No French Quran verse text was created. The 461 unique rows are kept as private local files, not wired into public routing or API behavior.

### 2026-10-29: Bukhari 602–607 source review

- Read-only export `FR-LIB-HAD-BUKHARI-109` saved the exact Arabic and source hash for Bukhari 602 as a one-record batch. The report contains the rare vocative `يا غنثر`; no source-backed French meaning is confirmed, so the entire report remains Needs Mo rather than guessing an insult.
- `FR-LIB-HAD-BUKHARI-110` saved French drafts for Bukhari 603, 604, 605, 606 and 607. The short variants, narrator chains and the wording “sauf l’iqama” were retained without filling in additional text from another report.
- Both batches passed the focused validator, including Arabic source-hash checks, IDs, rights metadata, unpublished/private state and the single-record handling for Bukhari 602. Five local drafts were added; one source remains held. No database writes, publication, human review or public route changes occurred.
- Bukhari local drafts: 566 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 27. Total local hadith rows not drafted: 14,063, including all held records.

### 2026-10-29: Bukhari 608–613 source review

- `FR-LIB-HAD-BUKHARI-111` saved private French drafts for Bukhari 608, 609, 611, 612 and 613, preserving narrator chains, the two-report structure in 612, and the unspecified identity of the narrator in 613.
- Bukhari 610 remains blank and held under Needs Mo because its closing Arabic phrase is a Quran quotation and no approved, attributed French Quran translation is configured. No French Quran wording was created.
- The focused validator passed all six records, including original Arabic hashes, rights metadata, private unpublished state and the reason-specific hold. Five local drafts were added; one additional hadith is held. No database writes or publication occurred.
- Bukhari local drafts: 571 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 28. Total local hadith rows not drafted: 14,058, including held records.

### 2026-10-29: Bukhari 614–619 source review

- `FR-LIB-HAD-BUKHARI-112` saved private French drafts for Bukhari 614–619. The translations retain the narrator chains, the full post-adhan supplication and its promised intercession, the report’s distinction between the two calls at night, and the instruction to pray in dwellings on a muddy day.
- The batch passed the focused validator for all six records, including Arabic hashes, IDs, rights, private unpublished state and the one-item limit for long reports. No Needs Mo item was identified in this batch. No database writes or publication occurred.
- Bukhari local drafts: 577 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 28. Total local hadith rows not drafted: 14,052, including held records.

### 2026-10-29: Bukhari 620–626 source review

- `FR-LIB-HAD-BUKHARI-113` saved private French drafts for Bukhari 620, 621, 622, 624, 625 and 626. The wording preserves the early-night call and suhur instruction, the dawn explanation and hand gesture, both chains in the combined 622/623 record, the optional prayer between calls, and both timing variants in the report about two units before Maghrib.
- The batch passed the focused validator for all six records, including Arabic hashes, rights metadata, private unpublished state and the long-record rule. No Needs Mo item was identified in this batch. No database writes or publication occurred.
- Bukhari local drafts: 583 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 28. Total local hadith rows not drafted: 14,046, including held records.

### 2026-10-29: Bukhari 627–632 source review

- `FR-LIB-HAD-BUKHARI-114` saved private French drafts for Bukhari 627–632. The texts preserve the repeated call-and-prayer wording, travel instructions, the three requests to wait for the heat to lessen, the two companions’ instruction, the narrator’s uncertainty about remembered details, and the cold-weather instruction to pray in dwellings.
- The batch passed the focused validator for all six records, including Arabic hashes, rights metadata, private unpublished state and the long-record rule. No Needs Mo item was identified in this batch. No database writes or publication occurred.
- Bukhari local drafts: 589 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 28. Total local hadith rows not drafted: 14,040, including held records.

### 2026-10-29: Bukhari 633–638 source review

- `FR-LIB-HAD-BUKHARI-115` saved private French drafts for Bukhari 633–638. The reports retain the lance placed before the Prophet at al-Abtah, the observer following Bilal’s mouth during the call, the instruction to arrive calmly and complete missed prayer, and both waiting-for-the-imam wordings.
- The batch passed the focused validator for all six records, including Arabic hashes, rights metadata, private unpublished state and the long-record rule. No Needs Mo item was identified in this batch. No database writes or publication occurred.
- Bukhari local drafts: 595 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 28. Total local hadith rows not drafted: 14,034, including held records.

### 2026-10-29: Bukhari 639–644 source review

- `FR-LIB-HAD-BUKHARI-116` saved private French drafts for Bukhari 639–643, preserving the instruction to wait in place, the report about the delayed prayer on the day of the Trench, and the narrator’s wording in the brief reports about conversation after the iqama.
- Bukhari 644 remains blank and held under Needs Mo because the exact meaning of the closing food-related term `مِرْمَاتَيْنِ` is not confirmed from the local Arabic text. The complete batch passed the focused validator, including source hashes, rights metadata, private unpublished state and the reason-specific hold.
- Five local drafts were added; one additional hadith is held. No database writes or publication occurred. Bukhari local drafts: 600 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 29. Total local hadith rows not drafted: 14,029, including held records.

### 2026-10-29: Bukhari 645–650 source review

- `FR-LIB-HAD-BUKHARI-117` saved private French drafts for Bukhari 645–647 and 649–650, preserving the distinct twenty-seven- and twenty-five-degree reports and the full explanation of the reward for walking to congregational prayer.
- Bukhari 648 remains blank and held under Needs Mo because it quotes Quran 17:78 and the project has no approved, attributed French Quran translation. The batch passed the focused validator for all six records, including Arabic hashes, rights metadata, private unpublished state and the reason-specific hold.
- Five local drafts were added; one additional hadith is held. No database writes or publication occurred. Bukhari local drafts: 605 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 30. Total local hadith rows not drafted: 14,024, including held records.

### 2026-10-29: Bukhari 651–659 source review

- `FR-LIB-HAD-BUKHARI-118` saved private French drafts for Bukhari 651, 652–654, 657, 658 and 659. The combined report retains all its distinct passages about removing a harmful branch, the five kinds of martyrdom, and the rewards of the call, first row, early arrival, and evening and dawn prayers.
- The combined Bukhari 655/656 record remains blank and held under Needs Mo because it contains an explicit quotation of Quran 36:12. The project has no approved, attributed French Quran translation. No French Quran wording was created.
- The six-record batch passed the focused validator, including Arabic hashes, rights metadata, private unpublished state and the reason-specific hold. Five local drafts were added; one additional hadith is held. No database writes or publication occurred. Bukhari local drafts: 610 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 31. Total local hadith rows not drafted: 14,019, including held records.

### 2026-10-29: Bukhari 660–665 source review

- `FR-LIB-HAD-BUKHARI-119` saved private French drafts for Bukhari 660–665. The long report 664 retains the separate narration paths, Aisha’s account of the Prophet’s illness and the prayer led by Abu Bakr, the clarification about the second supporting person, and the later narrator variants.
- The batch passed the focused validator for all six records, including Arabic hashes, IDs, rights metadata, private unpublished state and complete report structure. No Needs Mo item was identified in this batch. No database writes or publication occurred.
- Bukhari local drafts: 616 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 31. Total local hadith rows not drafted: 14,013, including held records.

### 2026-10-29: Bukhari 666–671 source review

- `FR-LIB-HAD-BUKHARI-120` saved private French drafts for Bukhari 666–671. The translations preserve the specific bad-weather instructions, Itban’s request to pray in his house, both explanations given by Ibn Abbas about avoiding the journey through mud, the report of prostration in water and mud, and the two-unit prayer at the invitation of a large man.
- The six-record batch passed the focused validator for all Arabic hashes, rights metadata, private unpublished state and source structure. No Needs Mo item was identified in this batch. No database writes or publication occurred.
- Bukhari local drafts: 622 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 31. Total local hadith rows not drafted: 14,007, including held records.

### 2026-10-29: Bukhari 672–677 source review

- `FR-LIB-HAD-BUKHARI-121` saved private French drafts for Bukhari 672–677. These include the instruction to finish a served meal before prayer, the related narrator variants, the report of the Prophet setting down his knife when called to prayer, his service to his family, and Malik ibn al-Huwayrith demonstrating how the Prophet prayed.
- The six-record batch passed the focused validator for source hashes, rights metadata, private unpublished state and report structure. No Needs Mo item was identified in this batch. No database writes or publication occurred.
- Bukhari local drafts: 628 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 31. Total local hadith rows not drafted: 14,001, including held records.

### 2026-10-29: Bukhari 678–683 source review

- `FR-LIB-HAD-BUKHARI-122` saved private French drafts for Bukhari 678–683. The reports preserve the repeated requests for Abu Bakr to lead prayer, Aisha’s and Hafsa’s exchanges, the Monday account of the Prophet appearing from his room, and the additional narration paths and variants.
- The batch passed the focused validator for all Arabic hashes, IDs, rights metadata, private unpublished state and narration structure. No Needs Mo item was identified in this batch. No database writes or publication occurred.
- Bukhari local drafts: 634 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 31. Total local hadith rows not drafted: 13,995, including held records.

### 2026-10-29: Bukhari 684–686 source review

- `FR-LIB-HAD-BUKHARI-123` saved private French drafts for Bukhari 684–686. The longer report preserves the reconciliation visit, the interrupted congregational prayer, Abu Bakr’s response, and the instruction that men say “SubhanAllah” while clapping is for women. The following reports retain the approximate twenty-night stay and the visit to Itban’s home.
- The focused validator passed all three records, including Arabic hashes, rights metadata, private unpublished state and source structure. No Needs Mo item was identified. No database writes or publication occurred.
- Bukhari local drafts: 637 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 31. Total local hadith rows not drafted: 13,992, including held records.

### 2026-10-29: Bukhari 687 source review

- `FR-LIB-HAD-BUKHARI-124` saved Bukhari 687 as a one-record private draft because the Arabic report is long. It retains the repeated washing and loss of consciousness, the prayer waiting in the mosque, Abu Bakr leading during the Prophet’s illness, the Prophet later praying while seated, and Ibn Abbas’s identification of the second supporting man as Ali.
- The single-record batch passed the focused validator for the Arabic source hash, rights metadata, private unpublished state and long-report handling. No Needs Mo item was identified. No database writes or publication occurred.
- Bukhari local drafts: 638 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 31. Total local hadith rows not drafted: 13,991, including held records.

### 2026-10-29: Bukhari 688–692 source review

- `FR-LIB-HAD-BUKHARI-125` saved private French drafts for Bukhari 688–692, including the sitting-prayer instructions, the report’s explicit note about an earlier and later practice, the timing of prostration behind the imam, the warning against moving ahead of the imam, and Salim’s leadership among the first emigrants at Quba.
- The six-record batch passed the focused validator for source hashes, IDs, rights metadata, private unpublished state and narration variants. No Needs Mo item was identified. No database writes or publication occurred.
- Bukhari local drafts: 644 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 31. Total local hadith rows not drafted: 13,985, including held records.

### 2026-10-29: Bukhari 693–698 source review

- `FR-LIB-HAD-BUKHARI-126` saved private French drafts for Bukhari 693–698. They preserve the exact chain attribution for the two instructions about leadership, the separate note attributed to al-Zuhri, the night-prayer report’s totals and sound variants, and the thirteen-unit report with its follow-up transmission.
- The six-record batch passed the focused validator for Arabic hashes, rights metadata, private unpublished state and source structure. No Needs Mo item was identified. No database writes or publication occurred.
- Bukhari local drafts: 650 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 31. Total local hadith rows not drafted: 13,979, including held records.

### 2026-10-29: Bukhari 699–704 source review

- `FR-LIB-HAD-BUKHARI-127` saved private French drafts for Bukhari 699–704. These preserve Ibn Abbas’s movement to the Prophet’s right, Muadh leading his people after praying with the Prophet, the report that he recited al-Baqara without translating or reproducing its verses, and the repeated instructions for an imam to keep the prayer manageable for those following him.
- The six-record batch passed the focused validator for Arabic hashes, rights metadata, private unpublished state and report structure. No Needs Mo item was identified. No database writes or publication occurred.
- Bukhari local drafts: 656 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 31. Total local hadith rows not drafted: 13,973, including held records.

### 2026-10-29: Bukhari 705–710 source review

- `FR-LIB-HAD-BUKHARI-128` saved private French drafts for Bukhari 706–710. The translations preserve the reports about keeping prayer complete but manageable and shortening it when a child cries, including the narrator variants.
- Bukhari 705 remains blank and held under Needs Mo because the report includes Arabic Quran opening phrases for three surahs. The project has no approved, attributed French Quran translation, so no French Quran wording was created.
- The batch passed the focused validator for all six records, including Arabic hashes, rights metadata, private unpublished state and the reason-specific hold. Five local drafts were added; one additional hadith is held. No database writes or publication occurred. Bukhari local drafts: 661 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 32. Total local hadith rows not drafted: 13,968, including held records.

### 2026-10-29: Bukhari 711–716 source review

- `FR-LIB-HAD-BUKHARI-129` saved private French drafts for Bukhari 711–716. The reports retain the separate accounts of Abu Bakr leading prayer during the Prophet’s illness, the different instructions in each narration, the delayed completion of a two-unit prayer, and the audible takbir.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and narration structure. No Needs Mo item was identified. No database writes or publication occurred.
- Bukhari local drafts: 667 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 32. Total local hadith rows not drafted: 13,962, including held records.

### 2026-10-29: Bukhari 717–723 source review

- `FR-LIB-HAD-BUKHARI-130` saved private French drafts for Bukhari 717–723. The translations preserve the instructions to align and close the rows, the warning about division if they are not aligned, and the report’s examples about first-row and prayer rewards.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and source structure. No Needs Mo item was identified. No database writes or publication occurred.
- Bukhari local drafts: 673 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 32. Total local hadith rows not drafted: 13,956, including held records.

### 2026-10-29: Bukhari 724–729 source review

- `FR-LIB-HAD-BUKHARI-131` saved private French drafts for Bukhari 724–729. The reports preserve the reminder about straight rows, the narrator’s observed shoulder-and-foot positioning, Ibn Abbas being moved to the imam’s right, the mother’s place behind the two worshippers, and the reason the Prophet did not continue leading the night prayer publicly.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and report structure. No Needs Mo item was identified. No database writes or publication occurred.
- Bukhari local drafts: 679 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 32. Total local hadith rows not drafted: 13,950, including held records.

### 2026-10-29: Bukhari 730–735 source review

- `FR-LIB-HAD-BUKHARI-132` saved private French drafts for Bukhari 730–735. The translations preserve the uncertainty about the Ramadan prayer room’s material, the sitting prayer after an injury, and the distinct instructions to follow the imam’s movements.
- The six-record batch passed the focused validator for Arabic hashes, rights metadata, private unpublished state and narration variants. No Needs Mo item was identified. No database writes or publication occurred.
- Bukhari local drafts: 685 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 32. Total local hadith rows not drafted: 13,944, including held records.

### 2026-10-29: Bukhari 736–741 source review

- `FR-LIB-HAD-BUKHARI-133` saved private French drafts for Bukhari 736–741. The wording preserves the shoulder-height hand movements and the source’s correction about how an attribution was phrased in narration.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and narrator notes. No Needs Mo item was identified. No database writes or publication occurred.
- Bukhari local drafts: 691 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 32. Total local hadith rows not drafted: 13,938, including held records.
### 2026-10-29: Bukhari 742–747 source review

- `FR-LIB-HAD-BUKHARI-134` saves four private French drafts for Bukhari 742, 744, 746 and 747. Bukhari 743 remains blank under Needs Mo because it includes Quran 1:2 and no approved, attributed French Quran translation is available.
- The longer eclipse-prayer report, Bukhari 745, is saved separately as `FR-LIB-HAD-BUKHARI-134A` to satisfy the one-record rule for long source text. Its narration and the narrator's uncertainty about the final term are retained.
- Both artifacts passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and batch size. Five local drafts were added; one report is held. No database writes or publication occurred. Bukhari local drafts: 696 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 33. Total local hadith rows not drafted: 13,933, including held records.
### 2026-10-29: Bukhari 748–753 source review

- `FR-LIB-HAD-BUKHARI-135` saves six private French drafts for Bukhari 748–753. The translations retain the eclipse vision, the repeated warning against looking upward during prayer, the explanation of turning one's head, the distinction between a patterned garment and a plain one, and the later transmission note.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 702 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 33. Total local hadith rows not drafted: 13,927, including held records.
### 2026-10-29: Bukhari 754–759 source review

- `FR-LIB-HAD-BUKHARI-136` saves six private French drafts for Bukhari 754–759. They retain the account of the Prophet ﷺ signaling the congregation to finish prayer, the full sequence of the inquiry into Sa‘d’s leadership and the accusation against him, and the prayer instructions in the report about the man told to repeat his prayer.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 708 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 33. Total local hadith rows not drafted: 13,921, including held records.
### 2026-10-29: Bukhari 760–765 source review

- `FR-LIB-HAD-BUKHARI-137` saves five private French drafts for Bukhari 760–762 and 764–765. Bukhari 763 remains blank under Needs Mo because it quotes Quran 77:1 and no approved, attributed French Quran translation is available.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the reason-specific Quran hold. Five local drafts were added; one report is held. No database writes or publication occurred. Bukhari local drafts: 713 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 34. Total local hadith rows not drafted: 13,916, including held records.
### 2026-10-29: Bukhari 766–771 source review

- `FR-LIB-HAD-BUKHARI-138` saves private French drafts for Bukhari 767 and 770–771. Bukhari 766, 768 and 769 remain blank under Needs Mo because their reports contain quoted Quran wording; no approved, attributed French Quran translation is available. The surah title in 767 is translated as a title and is not expanded into Quran text.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the three reason-specific Quran holds. Three local drafts were added; three reports are held. No database writes or publication occurred. Bukhari local drafts: 716 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 37. Total local hadith rows not drafted: 13,913, including held records.
### 2026-10-29: Bukhari 772–776 source review

- `FR-LIB-HAD-BUKHARI-139` saves private French drafts for Bukhari 772, 775 and 776. Bukhari 773, 774 and 774b remain blank under Needs Mo because they contain quoted Quran wording; no approved, attributed French Quran translation is available.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the three reason-specific Quran holds. Three local drafts were added; three reports are held. No database writes or publication occurred. Bukhari local drafts: 719 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 40. Total local hadith rows not drafted: 13,910, including held records.
### 2026-10-29: Bukhari 777–782 source review

- `FR-LIB-HAD-BUKHARI-140` saves five private French drafts for Bukhari 777–781. Bukhari 782 remains blank under Needs Mo because it quotes Quran 1:7 and no approved, attributed French Quran translation is available.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the reason-specific Quran hold. Five local drafts were added; one report is held. No database writes or publication occurred. Bukhari local drafts: 724 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 41. Total local hadith rows not drafted: 13,905, including held records.
### 2026-10-29: Bukhari 783–788 source review

- `FR-LIB-HAD-BUKHARI-141` saves six private French drafts for Bukhari 783–788. They preserve the instruction to the late-arriving worshipper, the prayer descriptions attributed to Ali and Sa‘d, and the quoted reactions in the reports about the takbir.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 730 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 41. Total local hadith rows not drafted: 13,899, including held records.
### 2026-10-29: Bukhari 789–794 source review

- `FR-LIB-HAD-BUKHARI-142` saves six private French drafts for Bukhari 789–794. They retain the takbir and praise wording, Sa‘d’s instruction about hand placement, the warning about completing bowing and prostration, the repeated prayer instruction and Aïcha’s narrated supplication.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 736 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 41. Total local hadith rows not drafted: 13,893, including held records.
### 2026-10-29: Bukhari 795–800 source review

- `FR-LIB-HAD-BUKHARI-143` saves six private French drafts for Bukhari 795–800. They preserve the remembered supplications and takbir sequence, the qunut report, the extra praise spoken behind the Prophet ﷺ and the length of his standing after bowing.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 742 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 41. Total local hadith rows not drafted: 13,887, including held records.
### 2026-10-29: Bukhari 801–805 source review

- `FR-LIB-HAD-BUKHARI-144` saves five private French drafts for Bukhari 801–805. It preserves the similar durations of prayer positions, Malik ibn al-Huwayrith’s demonstration, Abu Hurayra’s takbir sequence, the named supplication and the narrator variants about the Prophet’s injury.
- The five-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 747 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 41. Total local hadith rows not drafted: 13,882, including held records.
### 2026-10-29: Bukhari 806 source review

- `FR-LIB-HAD-BUKHARI-145` saves a private French draft of Bukhari 806 as a single-record artifact because its Arabic source is over 2,000 characters. The full report’s stages, dialogue, actions and Abu Saïd/Abu Hurayra wording difference are retained.
- The artifact passed the focused validator for Arabic hash, ID, rights metadata, private unpublished state and the single-record long-text rule. No database write or publication occurred. Bukhari local drafts: 748 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 41. Total local hadith rows not drafted: 13,881, including held records.
### 2026-10-29: Bukhari 807–812 source review

- `FR-LIB-HAD-BUKHARI-146` saves six private French drafts for Bukhari 807–812. The translations retain the arm position in prayer, the warning to complete bowing and prostration, the seven points of prostration and the timing of the congregation’s movement behind the imam.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 754 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 41. Total local hadith rows not drafted: 13,875, including held records.
### 2026-10-29: Bukhari 813–818 source review

- `FR-LIB-HAD-BUKHARI-147` saves six private French drafts for Bukhari 813–818. The translations preserve the sequence of the Ramadan retreat and dream, the instruction to wait for men to sit, the prayer positions, and the final instruction about calling and leading the prayer.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 760 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 41. Total local hadith rows not drafted: 13,869, including held records.
### 2026-10-29: Bukhari 820–825 source review

- `FR-LIB-HAD-BUKHARI-148` saves six private French drafts for Bukhari 820–825. They preserve the durations of the prayer positions, Anas’s demonstration, the instruction about spreading the arms during prostration, and the sitting and rising movements at the end of a pair of units.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 766 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 41. Total local hadith rows not drafted: 13,863, including held records.
### 2026-10-29: Bukhari 826–831 source review

- `FR-LIB-HAD-BUKHARI-149` saves six private French drafts for Bukhari 826–831. They preserve the two alternative descriptions after Ali’s prayer, the sitting positions, Abu Humayd’s detailed prayer description and the correction to the greeting said while seated in prayer.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 772 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 41. Total local hadith rows not drafted: 13,857, including held records.
### 2026-10-29: Bukhari 832 and 834–838 source review

- `FR-LIB-HAD-BUKHARI-150` saves six private French drafts for Bukhari 832 and 834–838. The source export did not include a Bukhari 833 record. The translations retain the supplication against debt, the prayer greeting and invocation, the report about clay on the Prophet’s forehead, and the timing of women’s departure after prayer.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 778 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 41. Total local hadith rows not drafted: 13,851, including held records.
### 2026-10-29: Bukhari 839 and 841–845 source review

- `FR-LIB-HAD-BUKHARI-151` saves six private French drafts for Bukhari 839 and 841–845. The source export did not include a Bukhari 840 record. The translations preserve Itban’s request and the prayer in his home, the reports about post-prayer remembrance, and the invocations recited after prayer.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 784 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 41. Total local hadith rows not drafted: 13,845, including held records.
### 2026-10-29: Bukhari 846–849 and 851–852 source review

- `FR-LIB-HAD-BUKHARI-152` saves six private French drafts for Bukhari 846–849 and 851–852. The source export did not include a Bukhari 850 record. The translations preserve the report about rainfall and attribution, the warning about waiting for prayer, the explicit note that an attribution is not authentic, and the different transmission forms for the report about women leaving after prayer.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 790 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 41. Total local hadith rows not drafted: 13,839, including held records.
### 2026-10-29: Bukhari 853–858 source review

- `FR-LIB-HAD-BUKHARI-153` saves six private French drafts for Bukhari 853–858. They preserve the instruction about entering the mosque after eating garlic, the raw-versus-odor transmission note, the prayer over an isolated grave and the Friday washing report.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 796 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 41. Total local hadith rows not drafted: 13,833, including held records.
### 2026-10-29: Bukhari 859–864 source review

- `FR-LIB-HAD-BUKHARI-154` saves private French drafts for Bukhari 860–864. Bukhari 859 remains blank under Needs Mo because it quotes Quran 37:102 and no approved, attributed French Quran translation is available.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the reason-specific Quran hold. Five local drafts were added; one report is held. No database writes or publication occurred. Bukhari local drafts: 801 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 42. Total local hadith rows not drafted: 13,828, including held records.
### 2026-10-29: Bukhari 865–870 source review

- `FR-LIB-HAD-BUKHARI-155` saves six private French drafts for Bukhari 865–870. The reports preserve the request about women attending the mosque, the two transmission forms concerning women’s departure, and the instruction to shorten prayer when a child cries.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 807 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 42. Total local hadith rows not drafted: 13,822, including held records.
### 2026-10-29: Bukhari 871–876 source review

- `FR-LIB-HAD-BUKHARI-156` saves six private French drafts for Bukhari 871–876. The translations preserve the prayer arrangement in Umm Sulaym’s home, dawn-time darkness, the instruction about mosque attendance and the report about the day appointed for earlier communities.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 813 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 42. Total local hadith rows not drafted: 13,816, including held records.
### 2026-10-29: Bukhari 877–882 source review

- `FR-LIB-HAD-BUKHARI-157` saves six private French drafts for Bukhari 877–882. They preserve the different reports about Friday washing, including the narrator’s uncertainty about the status of tooth-cleaning and perfume, and the early-arrival comparison.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 819 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 42. Total local hadith rows not drafted: 13,810, including held records.
### 2026-10-29: Bukhari 883–888 source review

- `FR-LIB-HAD-BUKHARI-158` saves six private French drafts for Bukhari 883–888. They preserve the Friday preparations and the narrator’s distinction between what he could confirm as obligatory and what he could not confirm, as well as the report about the striped garment and Umar’s later gift.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 825 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 42. Total local hadith rows not drafted: 13,804, including held records.
### 2026-10-29: Bukhari 889–894 source review

- `FR-LIB-HAD-BUKHARI-159` saves five private French drafts for Bukhari 889–890 and 892–894. Bukhari 891 remains blank under Needs Mo because it quotes Quran 32:1 and 76:1; no approved, attributed French Quran translation is available.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the reason-specific Quran hold. Five local drafts were added; one report is held. No database writes or publication occurred. Bukhari local drafts: 830 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 43. Total local hadith rows not drafted: 13,799, including held records.
### 2026-10-29: Bukhari 895–896 and 898–901 source review

- `FR-LIB-HAD-BUKHARI-160` saves six private French drafts for Bukhari 895–896 and 898–901. The source export did not include a Bukhari 897 record. The translations preserve the repeated seven-day washing wording, the permission to attend mosque at night, and the rainy-day instruction to pray at home.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 836 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 43. Total local hadith rows not drafted: 13,793, including held records.
### 2026-10-29: Bukhari 902–907 source review

- `FR-LIB-HAD-BUKHARI-161` saves six private French drafts for Bukhari 902–907. The reports preserve the reasons given for Friday washing, the timing of the prayer in hot and cold weather, and the variant transmission that does not specify Friday.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 842 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 43. Total local hadith rows not drafted: 13,787, including held records.
### 2026-10-29: Bukhari 908–913 source review

- `FR-LIB-HAD-BUKHARI-162` saves six private French drafts for Bukhari 908–913. The translations retain the instruction to come calmly when prayer begins, the prohibition on taking someone else’s place, and the historical notes about the Friday call to prayer.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 848 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 43. Total local hadith rows not drafted: 13,781, including held records.
### 2026-10-29: Bukhari 914–919 source review

- `FR-LIB-HAD-BUKHARI-163` saves six private French drafts for Bukhari 914–919. They preserve the witness to the muezzin’s call, the chronology of Friday calls, the construction and use of the minbar, and the trunk’s sound when the minbar was installed.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 854 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 43. Total local hadith rows not drafted: 13,775, including held records.
### 2026-10-29: Bukhari 920–925 source review

- `FR-LIB-HAD-BUKHARI-164` saves six private French drafts for Bukhari 920–925. They preserve the statement about sermons, Asma’s detailed account of the long prayer and grave questioning, the allocation report, and the congregation’s repeated night prayers before the Prophet ﷺ stopped joining them publicly.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 860 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 43. Total local hadith rows not drafted: 13,769, including held records.
### 2026-10-29: Bukhari 926–931 source review

- `FR-LIB-HAD-BUKHARI-165` saves six private French drafts for Bukhari 926–931. The translations preserve the closing advice to accept good conduct and overlook errors, the structure of two Friday sermons, and the instruction to pray two units when arriving during the sermon.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 866 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 43. Total local hadith rows not drafted: 13,763, including held records.
### 2026-10-29: Bukhari 932–937 source review

- `FR-LIB-HAD-BUKHARI-166` saves five private French drafts for Bukhari 932–935 and 937. Bukhari 936 remains blank under Needs Mo because it quotes Quran 62:11 and no approved, attributed French Quran translation is available.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the reason-specific Quran hold. Five local drafts were added; one report is held. No database writes or publication occurred. Bukhari local drafts: 871 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 44. Total local hadith rows not drafted: 13,758, including held records.
### 2026-10-29: Bukhari 938–943 source review

- `FR-LIB-HAD-BUKHARI-167` saves six private French drafts for Bukhari 938–943. I checked the unusual location phrase in Bukhari 938 against the source page and translated it as the edges of streams in the woman’s farm. The remaining reports cover Friday meals and rest, the prayer in fear, and prayer on foot or while mounted.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 877 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 44. Total local hadith rows not drafted: 13,752, including held records.
### 2026-10-29: Bukhari 944–949 source review

- `FR-LIB-HAD-BUKHARI-168` saves six private French drafts for Bukhari 944–949. They preserve the two groups’ prayer and guard duties, the two versions of the Banu Qurayza instruction, and the reports about Khaybar, brocade and the Eid celebration.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 883 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 44. Total local hadith rows not drafted: 13,746, including held records.
### 2026-10-29: Bukhari 951–956 source review

- `FR-LIB-HAD-BUKHARI-169` saves six private French drafts for Bukhari 951–956. The translations preserve the Eid prayer and sacrifice order, the story about a special one-time exception for Abu Burda, and Abu Saïd’s account of the sermon being moved before prayer.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 889 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 44. Total local hadith rows not drafted: 13,740, including held records.
### 2026-10-29: Bukhari 957–965 source review

- `FR-LIB-HAD-BUKHARI-170` saves six private French drafts for Bukhari 957–965 (the source’s combined 958–961 item remains one record). They preserve the Eid prayer and sermon order, the absence of an adhan, and the women’s charity after the sermon.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the single-item long-text rule. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 895 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 44. Total local hadith rows not drafted: 13,734, including held records.
### 2026-10-29: Bukhari 966–971 source review

- `FR-LIB-HAD-BUKHARI-171` saves six private French drafts for Bukhari 966–971. They preserve Ibn Umar’s confrontation with al-Hajjaj, the Eid sacrifice timing, the virtue of the first ten days of Dhul-Hijja, and the differing forms of remembrance during the Hajj journey.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 901 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 44. Total local hadith rows not drafted: 13,728, including held records.
### 2026-10-29: Bukhari 972–977 source review

- `FR-LIB-HAD-BUKHARI-172` saves six private French drafts for Bukhari 972–977. They preserve the practice of praying toward a planted lance, reports about women attending Eid prayer, and the Prophet’s ﷺ address and appeal for charity.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 907 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 44. Total local hadith rows not drafted: 13,722, including held records.
### 2026-10-29: Bukhari 978–983 source review

- `FR-LIB-HAD-BUKHARI-173` saves five private French drafts for Bukhari 978 and 980–983. Bukhari 979 remains blank under Needs Mo because it quotes Quran 60:12 and no approved, attributed French Quran translation is available.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the reason-specific Quran hold. Five local drafts were added; one report is held. No database writes or publication occurred. Bukhari local drafts: 912 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 45. Total local hadith rows not drafted: 13,717, including held records.
### 2026-10-29: Bukhari 984–990 source review

- `FR-LIB-HAD-BUKHARI-174` saves six private French drafts for Bukhari 984–990. They preserve the one-time allowance in the sacrifice report, the alternate route after Eid, the celebration reports, and the night prayer description.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 918 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 45. Total local hadith rows not drafted: 13,711, including held records.
### 2026-10-29: Bukhari 991–996 source review

- `FR-LIB-HAD-BUKHARI-175` saves six private French drafts for Bukhari 991–996. They preserve the nighttime prayer forms, the narrator’s explanation of a rapid pre-dawn prayer, and the reported range for performing the witr prayer.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 924 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 45. Total local hadith rows not drafted: 13,705, including held records.
### 2026-10-29: Bukhari 997–1002 source review

- `FR-LIB-HAD-BUKHARI-176` saves six private French drafts for Bukhari 997–1002. They preserve waking one’s spouse for witr, completing the night prayer with an odd number, the prayer while traveling, and the reports about qunut.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 930 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 45. Total local hadith rows not drafted: 13,699, including held records.
### 2026-10-29: Bukhari 1003–1009 source review

- `FR-LIB-HAD-BUKHARI-177` saves five private French drafts for Bukhari 1003–1006 and the combined 1008–1009 report. Bukhari 1007 remains blank under Needs Mo because it quotes Quran 44:10–16 and no approved, attributed French Quran translation is available.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the reason-specific Quran hold. Five local drafts were added; one report is held. No database writes or publication occurred. Bukhari local drafts: 935 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 46. Total local hadith rows not drafted: 13,694, including held records.
### 2026-10-29: Bukhari 1010–1015 source review

- `FR-LIB-HAD-BUKHARI-178` saves six private French drafts for Bukhari 1010–1015. They preserve the accounts of asking for rain, returning the cloak, the two Friday rain episodes, and the prayer for rainfall around rather than over the people.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 941 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 46. Total local hadith rows not drafted: 13,688, including held records.
### 2026-10-29: Bukhari 1016–1021 source review

- `FR-LIB-HAD-BUKHARI-179` saves five private French drafts for Bukhari 1016–1019 and 1021. Bukhari 1020 remains blank under Needs Mo because it quotes Quran 44:10 and 44:16 and no approved, attributed French Quran translation is available.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the reason-specific Quran hold. Five local drafts were added; one report is held. No database writes or publication occurred. Bukhari local drafts: 946 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 47. Total local hadith rows not drafted: 13,683, including held records.
### 2026-10-29: Bukhari 1022–1027 source review

- `FR-LIB-HAD-BUKHARI-180` saves six private French drafts for Bukhari 1022–1027. They preserve the standing supplication for rain, facing the qibla, turning the cloak, and the variants about the prayer at the open-air prayer ground.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 952 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 47. Total local hadith rows not drafted: 13,677, including held records.
### 2026-10-29: Bukhari 1028–1033 source review

- `FR-LIB-HAD-BUKHARI-181` saves six private French drafts for Bukhari 1028–1033. They preserve the different accounts of the rain prayer, raising the hands, the rain invocation, and the storm that later eased around Medina.
- I checked Bukhari 1029 against its source page to clarify the final phrase about travelers and blocked roads; the source describes travelers being delayed by the rain. The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 958 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 47. Total local hadith rows not drafted: 13,671, including held records.
### 2026-10-29: Bukhari 1034–1039 source review

- `FR-LIB-HAD-BUKHARI-182` saves six private French drafts for Bukhari 1034–1039. They preserve the reports about strong winds, the accounts of the rain prayer, and the warning to attribute rainfall to Allah rather than to an astrological sign.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 964 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 47. Total local hadith rows not drafted: 13,665, including held records.
### 2026-10-29: Bukhari 1040–1045 source review

- `FR-LIB-HAD-BUKHARI-183` saves six private French drafts for Bukhari 1040–1045. They preserve the reports about the solar eclipse, the prescribed prayer and supplication, and the announcement that the congregation should gather.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 970 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 47. Total local hadith rows not drafted: 13,659, including held records.
### 2026-10-29: Bukhari 1046–1052 source review

- `FR-LIB-HAD-BUKHARI-184` saves six private French drafts for Bukhari 1046–1052. They preserve the longer eclipse-prayer accounts, including the Prophet’s ﷺ sermon and the reminder to seek refuge from punishment in the grave.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 976 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 47. Total local hadith rows not drafted: 13,653, including held records.
### 2026-10-29: Bukhari 1053–1059 source review

- `FR-LIB-HAD-BUKHARI-185` saves six private French drafts for Bukhari 1053–1059. They preserve Asma’s account of the eclipse prayer and grave questioning, the instruction about freeing slaves, and the additional eclipse narrations.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 982 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 47. Total local hadith rows not drafted: 13,647, including held records.
### 2026-10-29: Bukhari 1060–1066 source review

- `FR-LIB-HAD-BUKHARI-186` saves six private French drafts for Bukhari 1060–1066. They preserve the supplication during an eclipse, the shorter eclipse reports, and the long narration about recitation and the eclipse prayer’s sequence.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 988 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 47. Total local hadith rows not drafted: 13,641, including held records.
### 2026-10-29: Bukhari 1067–1072 source review

- `FR-LIB-HAD-BUKHARI-187` saves four private French drafts for Bukhari 1067, 1069–1071. Bukhari 1068 and 1072 remain blank under Needs Mo because they quote Quran 32:1–2 and 76:1, and Quran 53:1, respectively; no approved, attributed French Quran translation is available.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the reason-specific Quran holds. Four local drafts were added; two reports are held. No database writes or publication occurred. Bukhari local drafts: 992 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 49. Total local hadith rows not drafted: 13,637, including held records.
### 2026-10-29: Bukhari 1073–1078 source review

- `FR-LIB-HAD-BUKHARI-188` saves three private French drafts for Bukhari 1075–1077. Bukhari 1073 remains blank because it quotes Quran 53:1; 1074 and 1078 remain blank because they quote Quran 84:1. No approved, attributed French Quran translation is available.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the reason-specific Quran holds. Three local drafts were added; three reports are held. No database writes or publication occurred. Bukhari local drafts: 995 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 52. Total local hadith rows not drafted: 13,634, including held records.
### 2026-10-29: Bukhari 1079–1084 source review

- `FR-LIB-HAD-BUKHARI-189` saves six private French drafts for Bukhari 1079–1084. They preserve the reports about crowded prostration, shortening prayer during travel, and prayer at Mina.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 1,001 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 52. Total local hadith rows not drafted: 13,628, including held records.
### 2026-10-29: Bukhari 1085–1090 source review

- `FR-LIB-HAD-BUKHARI-190` saves six private French drafts for Bukhari 1085–1090. The read-only exporter also identified the following overlong source and deferred it so it can be handled as a single-record artifact in the next batch.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 1,007 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 52. Total local hadith rows not drafted: 13,622, including held records.
### 2026-10-29: Bukhari 1091–1097 source review

- `FR-LIB-HAD-BUKHARI-191` saves six private French drafts for Bukhari 1091–1097. The previously deferred overlong source (`63c944b0-5027-4247-a61e-dfb971c78fd8`) remains isolated for a single-record artifact.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 1,013 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 52. Total local hadith rows not drafted: 13,616, including held records.
### 2026-10-29: Bukhari 1098–1103 source review

- `FR-LIB-HAD-BUKHARI-192` saves five private French drafts for Bukhari 1098–1100 and 1102–1103. Bukhari 1101 remains blank under Needs Mo because it quotes Quran 33:21 and no approved, attributed French Quran translation is available. The exporter continues to flag a later overlong record for its own artifact.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the reason-specific Quran hold. Five local drafts were added; one report is held. No database writes or publication occurred. Bukhari local drafts: 1,018 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 53. Total local hadith rows not drafted: 13,611, including held records.
### 2026-10-29: Bukhari 1104–1109 source review

- `FR-LIB-HAD-BUKHARI-193` saves six private French drafts for Bukhari 1104–1109. They preserve the travel prayers on a mount and the reports about combining Maghrib and Isha while traveling. The exporter still flags a later overlong source for its own single-record artifact.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 1,024 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 53. Total local hadith rows not drafted: 13,605, including held records.
### 2026-10-29: Bukhari 1110–1115 source review

- `FR-LIB-HAD-BUKHARI-194` saves six private French drafts for Bukhari 1110–1115. They preserve the reports about combining prayers while traveling and the instructions for following an imam when praying seated.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 1,030 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 53. Total local hadith rows not drafted: 13,599, including held records.
### 2026-10-29: Bukhari 1116–1122 source review

- `FR-LIB-HAD-BUKHARI-195` saves six private French drafts for Bukhari 1116–1122. They preserve the instructions about praying seated or on one’s side, Aïcha’s accounts of the Prophet’s ﷺ nighttime prayer, the long nighttime supplication, and Ibn Umar’s dream.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 1,036 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 53. Total local hadith rows not drafted: 13,593, including held records.
### 2026-10-29: Bukhari 1123–1128 source review

- `FR-LIB-HAD-BUKHARI-196` saves four private French drafts for Bukhari 1123, 1124, 1126 and 1128. Bukhari 1125 remains blank because it quotes Quran 93:1–3, and 1127 remains blank because it quotes Quran 18:54. No approved, attributed French Quran translation is available.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the reason-specific Quran holds. Four local drafts were added; two reports are held. No database writes or publication occurred. Bukhari local drafts: 1,040 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 55. Total local hadith rows not drafted: 13,589, including held records.
### 2026-10-29: Bukhari 1129–1133 source review

- `FR-LIB-HAD-BUKHARI-197` saves six private French drafts for Bukhari 1129–1133, including variants 1132b. They preserve the Ramadan congregation report, Dawud’s prayer and fasting schedule, and the accounts about waking for night prayer.
- I checked the phrase in Bukhari 1132 about hearing “the caller” against its source context; it refers to a rooster’s crow. The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 1,046 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 55. Total local hadith rows not drafted: 13,583, including held records.
### 2026-10-29: Bukhari 1134–1139 source review

- `FR-LIB-HAD-BUKHARI-198` saves six private French drafts for Bukhari 1134–1139. They preserve the interval between the pre-dawn meal and prayer, the reports on long nighttime prayer, and the different narrated prayer counts.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 1,052 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 55. Total local hadith rows not drafted: 13,577, including held records.
### 2026-10-29: Bukhari 1140–1145 source review

- `FR-LIB-HAD-BUKHARI-199` saves six private French drafts for Bukhari 1140–1145. They preserve the narrated nighttime prayer count, the report about Satan’s knots, the dream account, and the closing-third supplication.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 1,058 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 55. Total local hadith rows not drafted: 13,571, including held records.
### 2026-10-29: Bukhari 1146–1151 source review

- `FR-LIB-HAD-BUKHARI-200` saves six private French drafts for Bukhari 1146–1151. They preserve the nighttime prayer routine, Aïcha’s account of the Ramadan prayer, Bilal’s practice after ablution, and the instruction against overburdening oneself in worship.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 1,064 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 55. Total local hadith rows not drafted: 13,565, including held records.
### 2026-10-29: Bukhari 1152–1159 source review

- `FR-LIB-HAD-BUKHARI-201` saves six private French drafts for Bukhari 1152–1159. They preserve the reminders about consistency in night prayer, balancing worship with personal and family needs, and the reports about waking to pray.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 1,070 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 55. Total local hadith rows not drafted: 13,559, including held records.
### 2026-10-29: Bukhari 1160–1165 source review

- `FR-LIB-HAD-BUKHARI-202` saves six private French drafts for Bukhari 1160–1165. They preserve the reports on lying down after the dawn prayer’s two units, maintaining them consistently, and keeping them brief.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 1,076 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 55. Total local hadith rows not drafted: 13,553, including held records.
### 2026-10-29: Bukhari 1166–1171 source review

- `FR-LIB-HAD-BUKHARI-203` saves six private French drafts for Bukhari 1166–1171. They preserve the complete consultation prayer, the mosque-entry instruction, the narrated prayer counts, the Friday sermon instruction, and the combined reports about prayer inside the Kaaba and the forenoon prayer.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 1,082 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 55. Total local hadith rows not drafted: 13,547, including held records.
### 2026-10-29: Bukhari 1172–1178 source review

- `FR-LIB-HAD-BUKHARI-204` saves six private French drafts for the combined Bukhari 1172–1173 record and Bukhari 1174–1178. They preserve the repeated narration variants, the reported prayer counts and times, and the individual attributions.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 1,088 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 55. Total local hadith rows not drafted: 13,541, including held records.
### 2026-10-29: Bukhari 1179–1184 source review

- `FR-LIB-HAD-BUKHARI-205` saves five private French drafts for Bukhari 1179–1184. The exporter returned five eligible records while continuing to defer one long source for its individual batch. These drafts preserve the reports about the morning prayer, the pre-noon and pre-dawn prayers, and prayer before sunset.
- The five-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 1,093 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 55. Total local hadith rows not drafted: 13,536, including held records.
### 2026-10-29: Bukhari 1185–1186 long report

- `FR-LIB-HAD-BUKHARI-206` saves one private French draft for the combined Bukhari 1185–1186 report. It preserves the full account of Itban ibn Malik’s request, the prayer at his home, the comments about Malik, and Mahmoud’s later confirmation from Itban.
- The single-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 1,094 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 55. Total local hadith rows not drafted: 13,535, including held records.
### 2026-10-29: Bukhari 1187–1193 source review

- `FR-LIB-HAD-BUKHARI-207` saves six private French drafts for Bukhari 1187–1193, including the brief Bukhari 1188 wording as it appears in the source. They preserve the reports about prayer at home, the two holy mosques, and visits to Quba.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 1,100 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 55. Total local hadith rows not drafted: 13,529, including held records.
### 2026-10-29: Bukhari 1194–1199 source review

- `FR-LIB-HAD-BUKHARI-208` saves six private French drafts for Bukhari 1194–1199. They preserve the Quba visits, the two reports about the garden between the Prophet’s home and minbar, all four items in the Abu Saïd report, the full night-prayer sequence, and the report about returning greetings during prayer.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 1,106 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 55. Total local hadith rows not drafted: 13,523, including held records.
### 2026-10-29: Bukhari 1199b–1204 source review

- `FR-LIB-HAD-BUKHARI-209` saves five private French drafts for Bukhari 1199b and 1201–1204. Bukhari 1200 remains blank and is recorded under Needs Mo because its source directly quotes Quran 2:238 and no approved, attributed French Quran translation is configured.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the reason-specific Quran hold. No database writes or publication occurred. Bukhari local drafts: 1,111 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 56. Total local hadith rows not drafted: 13,518, including held records.
### 2026-10-29: Bukhari 1205–1210 source review

- `FR-LIB-HAD-BUKHARI-210` saves five private French drafts for Bukhari 1205–1209. Bukhari 1210 remains blank and is recorded under Needs Mo because the report includes direct Quran quotations, including wording from Quran 38:35 and 52:13; no approved, attributed French Quran translation is configured.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the reason-specific Quran hold. No database writes or publication occurred. Bukhari local drafts: 1,116 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 57. Total local hadith rows not drafted: 13,513, including held records.
### 2026-10-29: Bukhari 1211–1216 source review

- `FR-LIB-HAD-BUKHARI-211` saves six private French drafts for Bukhari 1211–1216. They preserve the reports about prayer while managing a mount, the eclipse prayer, the prayer’s etiquette, and the narrated greetings and movement during prayer.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 1,122 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 57. Total local hadith rows not drafted: 13,507, including held records.
### 2026-10-29: Bukhari 1217–1222 source review

- `FR-LIB-HAD-BUKHARI-212` saves six private French drafts for Bukhari 1217–1222. They preserve Jabir’s concern about the Prophet’s silence, the complete prayer leadership account, the hand-on-hips reports, and the reports about remembered gold and prayer distraction.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 1,128 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 57. Total local hadith rows not drafted: 13,501, including held records.
### 2026-10-29: Bukhari 1223–1228 source review

- `FR-LIB-HAD-BUKHARI-213` saves six private French drafts for Bukhari 1223–1228. They preserve the unspecified surah reference, each prayer unit count, and the different points at which the reports describe the prostrations of forgetfulness.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 1,134 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 57. Total local hadith rows not drafted: 13,495, including held records.
### 2026-10-29: Bukhari 1228b–1233 source review

- `FR-LIB-HAD-BUKHARI-214` saves six private French drafts for Bukhari 1228b–1233. They preserve the differing report wording about the prostrations of forgetfulness and the complete account about the two units after the afternoon prayer.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 1,140 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 57. Total local hadith rows not drafted: 13,489, including held records.
### 2026-10-29: Bukhari 1234–1239 source review

- `FR-LIB-HAD-BUKHARI-215` saves six private French drafts for Bukhari 1234–1239. They preserve the prayer gesture account, the report of Aïcha’s response to a sign, and the seven commands and seven prohibitions.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 1,146 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 57. Total local hadith rows not drafted: 13,483, including held records.
### 2026-10-29: Bukhari 1240–1246 source review

- `FR-LIB-HAD-BUKHARI-216` saves five private French drafts for Bukhari 1240 and 1243–1246. The combined 1241–1242 report remains blank and is recorded under Needs Mo because it directly quotes Quran 3:144; no approved, attributed French Quran translation is configured.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the reason-specific Quran hold. No database writes or publication occurred. Bukhari local drafts: 1,151 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 58. Total local hadith rows not drafted: 13,478, including held records.
### 2026-10-29: Bukhari 1247–1253 source review

- `FR-LIB-HAD-BUKHARI-217` saves five private French drafts for Bukhari 1247–1250 and 1252–1253. Bukhari 1251 remains blank and is recorded under Needs Mo because the source editor’s note directly quotes Quran 19:71; no approved, attributed French Quran translation is configured.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the reason-specific Quran hold. No database writes or publication occurred. Bukhari local drafts: 1,156 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 59. Total local hadith rows not drafted: 13,473, including held records.
### 2026-10-29: Bukhari 1254–1260 source review

- `FR-LIB-HAD-BUKHARI-218` saves six private French drafts for Bukhari 1254–1260. They preserve the separate washing instructions, their reported variations in washing count and order, and the three hair braids.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 1,162 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 59. Total local hadith rows not drafted: 13,467, including held records.
### 2026-10-29: Bukhari 1261–1266 source review

- `FR-LIB-HAD-BUKHARI-219` saves five private French drafts for Bukhari 1262–1266. Bukhari 1261 remains blank and is recorded under Needs Mo because the local source has damaged wording in its closing explanation of how the garment was used.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the reason-specific damaged-source hold. No database writes or publication occurred. Bukhari local drafts: 1,167 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 60. Total local hadith rows not drafted: 13,462, including held records.
### 2026-10-29: Bukhari 1267–1272 source review

- `FR-LIB-HAD-BUKHARI-220` saves five private French drafts for Bukhari 1267–1268 and 1270–1272. Bukhari 1269 remains blank and is recorded under Needs Mo because it directly quotes Quran 9:80 and 9:84; no approved, attributed French Quran translation is configured.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the reason-specific Quran hold. No database writes or publication occurred. Bukhari local drafts: 1,172 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 61. Total local hadith rows not drafted: 13,457, including held records.
### 2026-10-29: Bukhari 1273–1278 source review

- `FR-LIB-HAD-BUKHARI-221` saves six private French drafts for Bukhari 1273–1278. They preserve the shroud reports about Mus'ab ibn Umayr, the woven burda later used as a shroud, and the report about women following funeral processions.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 1,178 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 61. Total local hadith rows not drafted: 13,451, including held records.
### 2026-10-29: Bukhari 1279–1285 source review

- `FR-LIB-HAD-BUKHARI-222` saves six private French drafts for Bukhari 1279–1285, including the combined 1281/1282 record. They preserve the mourning-period reports, the counsel on patience at the first shock, the Prophet’s tears for a dying child, and the burial account.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 1,184 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 61. Total local hadith rows not drafted: 13,445, including held records.
### 2026-10-29: Bukhari 1286–1288 source review

- `FR-LIB-HAD-BUKHARI-223` leaves the combined Bukhari 1286–1288 report blank and records it under Needs Mo because it directly quotes Quran 6:164 and no approved, attributed French Quran translation is configured.
- The one-record batch passed the focused validator for Arabic hash, ID, rights metadata, private unpublished hold and long-text handling. No database writes or publication occurred. Bukhari local drafts: 1,184 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 62. Total local hadith rows not drafted: 13,445, including held records.
### 2026-10-29: Bukhari 1289–1294 source review

- `FR-LIB-HAD-BUKHARI-224` saves six private French drafts for Bukhari 1289–1294. They preserve the reports concerning mourning, the variations in wording across narrations, the funeral of Jabir’s father, and the prohibition of pre-Islamic mourning practices.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 1,190 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 62. Total local hadith rows not drafted: 13,439, including held records.
### 2026-10-29: Bukhari 1295–1300 source review

- `FR-LIB-HAD-BUKHARI-225` saves six private French drafts for Bukhari 1295–1300. They preserve the detailed bequest discussion, the reports about mourning practices, and the Prophet’s grief after the readers of the Quran were killed.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 1,196 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 62. Total local hadith rows not drafted: 13,433, including held records.
### 2026-10-29: Bukhari 1301–1306 source review

- `FR-LIB-HAD-BUKHARI-226` saves six private French drafts for Bukhari 1301–1306. They preserve the account of Abu Talha’s family, reports about patience and grief, and the variant wording in Umm Atiyya’s report about the pledge.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 1,202 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 62. Total local hadith rows not drafted: 13,427, including held records.
### 2026-10-29: Bukhari 1307–1313 source review

- `FR-LIB-HAD-BUKHARI-227` saves six private French drafts for Bukhari 1307–1313, including the combined 1312/1313 record. They preserve the differing funeral-procession instructions and the report emphasizing that the deceased was a human soul.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 1,208 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 62. Total local hadith rows not drafted: 13,421, including held records.
### 2026-10-29: Bukhari 1314–1319 source review

- `FR-LIB-HAD-BUKHARI-228` saves six private French drafts for Bukhari 1314–1319. They preserve the reports about carrying funeral biers, the timing of setting them down, and the funeral prayers for the Negus.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 1,214 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 62. Total local hadith rows not drafted: 13,415, including held records.
### 2026-10-29: Bukhari 1320–1326 source review

- `FR-LIB-HAD-BUKHARI-229` saves six private French drafts for Bukhari 1320–1326, including the combined 1323/1324 report. They preserve the funeral prayer accounts, reward described in qirats, and the reports about children joining funeral prayers.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 1,220 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 62. Total local hadith rows not drafted: 13,409, including held records.
### 2026-10-29: Bukhari 1327–1333 source review

- `FR-LIB-HAD-BUKHARI-230` saves six private French drafts for Bukhari 1327–1333, including the combined 1327/1328 report. They preserve the Negus funeral reports, the two postpartum funeral reports, and the four takbirs.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 1,226 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 62. Total local hadith rows not drafted: 13,403, including held records.
### 2026-10-29: Bukhari 1334–1339 source review

- `FR-LIB-HAD-BUKHARI-231` saves six private French drafts for Bukhari 1334–1339. They preserve the four-takbir and al-Fatiha reports, the prayer at a grave, the report about the mosque’s cleaner, and the burial account concerning Moses.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 1,232 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 62. Total local hadith rows not drafted: 13,397, including held records.
### 2026-10-29: Bukhari 1340–1345 source review

- `FR-LIB-HAD-BUKHARI-232` saves five private French drafts for Bukhari 1340–1345. Bukhari 1342 remains blank and is recorded under Needs Mo because its explanatory source note quotes a Quranic word and no approved, attributed French Quran translation is configured.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the reason-specific Quran hold. No database writes or publication occurred. Bukhari local drafts: 1,237 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 63. Total local hadith rows not drafted: 13,392, including held records.
### 2026-10-29: Bukhari 1346–1352 source review

- `FR-LIB-HAD-BUKHARI-233` saves six private French drafts for Bukhari 1346–1352, including the combined 1347/1348 report. They preserve the burial instructions for Uhud’s martyrs, the exception for idhkhir in Mecca, and the accounts of shared graves.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 1,243 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 63. Total local hadith rows not drafted: 13,386, including held records.
### 2026-10-29: Bukhari 1353 source review

- `FR-LIB-HAD-BUKHARI-234` saves one private French draft for Bukhari 1353, preserving the report’s order for the Uhud martyrs’ burial and the instruction not to wash them.
- The one-record batch passed the focused validator for Arabic hash, ID, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 1,244 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 63. Total local hadith rows not drafted: 13,385, including held records.
### 2026-10-29: Bukhari 1354–1355 source review

- `FR-LIB-HAD-BUKHARI-235` saves one private French draft for the combined Bukhari 1354/1355 report. The long report was handled alone and preserves the dialogue with Ibn Sayyad, the Prophet’s concealed word, and the transmitted variants at the end.
- The one-record batch passed the focused validator for Arabic hash, ID, rights metadata, private unpublished state and long-text handling. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 1,245 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 63. Total local hadith rows not drafted: 13,384, including held records.
### 2026-10-29: Bukhari 1356–1361 source review

- `FR-LIB-HAD-BUKHARI-236` saves three private French drafts for Bukhari 1356, 1357 and 1361. Bukhari 1358, 1359 and 1360 remain blank and are recorded under Needs Mo because they directly quote Quran 30:30 or 9:113, and no approved, attributed French Quran translation is configured.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the reason-specific Quran holds. No database writes or publication occurred. Bukhari local drafts: 1,248 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 66. Total local hadith rows not drafted: 13,381, including held records.
### 2026-10-29: Bukhari 1362–1368 source review

- `FR-LIB-HAD-BUKHARI-237` saves four private French drafts for Bukhari 1363–1365 and 1367–1368. Bukhari 1362 and 1366 remain blank and are recorded under Needs Mo because they directly quote Quran 92:5 and 9:84; no approved, attributed French Quran translation is configured.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the reason-specific Quran holds. No database writes or publication occurred. Bukhari local drafts: 1,252 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 68. Total local hadith rows not drafted: 13,377, including held records.
### 2026-10-29: Bukhari 1369–1374 source review

- `FR-LIB-HAD-BUKHARI-238` saves four private French drafts for Bukhari 1370 and 1372–1374. Bukhari 1369 and 1371 remain blank and are recorded under Needs Mo because they directly quote Quran 14:27 and 27:80, and no approved, attributed French Quran translation is configured.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the reason-specific Quran holds. No database writes or publication occurred. Bukhari local drafts: 1,256 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 70. Total local hadith rows not drafted: 13,373, including held records.
### 2026-10-29: Bukhari 1375–1380 source review

- `FR-LIB-HAD-BUKHARI-239` saves six private French drafts for Bukhari 1375–1380. They preserve the reports about seeking protection from the grave’s punishment, the graveside report about urine and tale-bearing, and the deceased’s words as the bier is carried.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 1,262 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 70. Total local hadith rows not drafted: 13,367, including held records.
### 2026-10-29: Bukhari 1381–1385 source review

- `FR-LIB-HAD-BUKHARI-240` saves five private French drafts for Bukhari 1381–1385. They preserve the reports about Muslim children, Ibrahim’s nurse in Paradise, and the differing narrations concerning children of polytheists.
- The five-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 1,267 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 70. Total local hadith rows not drafted: 13,362, including held records.
### 2026-10-29: Bukhari 1386 source review

- `FR-LIB-HAD-BUKHARI-241` saves one private French draft for Bukhari 1386. The long report was handled alone and preserves the full dream sequence and its explanations.
- The one-record batch passed the focused validator for Arabic hash, ID, rights metadata, private unpublished state and long-text handling. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 1,268 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 70. Total local hadith rows not drafted: 13,361, including held records.
### 2026-10-29: Bukhari 1387–1390c source review

- `FR-LIB-HAD-BUKHARI-242` saves six private French drafts for Bukhari 1387–1390c. They preserve the reports about Abu Bakr’s shroud and death, sudden death and charity, the Prophet’s burial in Aisha’s home, and the later notes about the grave’s shape and the wall repairs.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No Needs Mo item was identified. No database writes or publication occurred. Bukhari local drafts: 1,274 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 70. Total local hadith rows not drafted: 13,355, including held records.
### 2026-10-29: Bukhari 1391–1396 source review

- `FR-LIB-HAD-BUKHARI-243` saves five private French drafts for Bukhari 1391–1393 and 1395–1396. Bukhari 1394 remains blank and is recorded under Needs Mo because it directly quotes Quran 111:1; no approved, attributed French Quran translation is configured.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the reason-specific Quran hold. No database writes or publication occurred. Bukhari local drafts: 1,279 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 71. Total local hadith rows not drafted: 13,350, including held records.
### 2026-10-29: Bukhari 1397–1403 source review

- `FR-LIB-HAD-BUKHARI-244` saves five private French drafts for Bukhari 1397–1402. Bukhari 1403 remains blank and is recorded under Needs Mo because it directly quotes Quran 3:180; no approved, attributed French Quran translation is configured.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the reason-specific Quran hold. No database writes or publication occurred. Bukhari local drafts: 1,284 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 72. Total local hadith rows not drafted: 13,345, including held records.

### 2026-10-29: Bukhari 1404–1410 source review

- `FR-LIB-HAD-BUKHARI-245` saves four private French drafts for Bukhari 1405, the combined 1407/1408 report, 1409 and 1410. Bukhari 1404 directly quotes Quran 9:34; Bukhari 1406 repeats wording from the same verse without a quotation marker. Both remain blank under Needs Mo until an approved, attributed French Quran translation is confirmed.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the reason-specific Quran holds. No database writes or publication occurred. Bukhari local drafts: 1,288 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 74. Total local hadith rows not drafted: 13,341, including held records.

### 2026-10-29: Bukhari 1411–1416 source review

- `FR-LIB-HAD-BUKHARI-246` saves five private French drafts for Bukhari 1411–1414 and 1416. Bukhari 1415 remains blank and is recorded under Needs Mo because it directly quotes Quran 9:79; no approved, attributed French Quran translation is configured.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the reason-specific Quran hold. No database writes or publication occurred. Bukhari local drafts: 1,293 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 75. Total local hadith rows not drafted: 13,336, including held records.

### 2026-10-29: Bukhari 1417–1422 source review

- `FR-LIB-HAD-BUKHARI-247` saves six private French drafts for Bukhari 1417–1422. They preserve the charity guidance, Aïcha’s report about the two daughters, the story of the mistaken recipients, and Ma‘n ibn Yazid’s account. No Needs Mo item was identified.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,299 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 75. Total local hadith rows not drafted: 13,330, including held records.

### 2026-10-29: Bukhari 1423–1429 source review

- `FR-LIB-HAD-BUKHARI-248` saves six private French drafts for Bukhari 1423–1427 and 1429. They preserve the seven groups sheltered by Allah, the guidance on household spending and dependants, and the two transmission routes in Bukhari 1429. No Needs Mo item was identified.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,305 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 75. Total local hadith rows not drafted: 13,324, including held records.

### 2026-10-29: Bukhari 1430–1435 source review

- `FR-LIB-HAD-BUKHARI-249` saves six private French drafts for Bukhari 1430–1435. They preserve the reports about distributing charity, women giving jewelry on the festival day, and Hudhayfa’s discussion with Umar about tribulation. No Needs Mo item was identified.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,311 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 75. Total local hadith rows not drafted: 13,318, including held records.

### 2026-10-29: Bukhari 1436–1441 source review

- `FR-LIB-HAD-BUKHARI-250` saves six private French drafts for Bukhari 1436–1441. They preserve the report on good deeds before Islam, the repeated narrations on household charity, and the wording variant about the entrusted storekeeper. No Needs Mo item was identified.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,317 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 75. Total local hadith rows not drafted: 13,312, including held records.

### 2026-10-29: Bukhari 1442–1447 source review

- `FR-LIB-HAD-BUKHARI-251` saves six private French drafts for Bukhari 1442–1447. They preserve the prayer for the giver and against the one who withholds, the parable of the two iron garments, and the two chains in the zakat-threshold report. No Needs Mo item was identified.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,323 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 75. Total local hadith rows not drafted: 13,306, including held records.

### 2026-10-29: Bukhari 1448–1453 source review

- `FR-LIB-HAD-BUKHARI-252` saves six private French drafts for Bukhari 1448–1453. They preserve the camel-age substitutions and compensation amounts in the zakat instructions, the Eid sermon to women, the rule against manipulating livestock groups, and both transmission routes in Bukhari 1453. No Needs Mo item was identified.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,329 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 75. Total local hadith rows not drafted: 13,300, including held records.

### 2026-10-29: Bukhari 1454 long-source review

- `FR-LIB-HAD-BUKHARI-253` saves one private French draft for Bukhari 1454. This long report was handled alone and preserves the full camel, sheep and silver zakat schedule, every threshold and the voluntary exceptions. No Needs Mo item was identified.
- The single-record batch passed the focused validator for the Arabic hash, ID, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,330 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 75. Total local hadith rows not drafted: 13,299, including held records.

### 2026-10-29: Bukhari 1455–1461 source review

- `FR-LIB-HAD-BUKHARI-254` saves five private French drafts for Bukhari 1455, 1456 and 1458–1460. Bukhari 1461 remains blank and is recorded under Needs Mo because it quotes Quran 3:92 twice; no approved, attributed French Quran translation is configured.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the reason-specific Quran hold. No database writes or publication occurred. Bukhari local drafts: 1,334 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 76. Total local hadith rows not drafted: 13,295, including held records.

### 2026-10-29: Bukhari 1462–1467 source review

- `FR-LIB-HAD-BUKHARI-255` saves six private French drafts for Bukhari 1462–1467. They preserve the dialogue with Zaynab, the exemption for a Muslim’s horse and servant, the warning about wealth, and the two-reward explanation for supporting family. No Needs Mo item was identified.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,340 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 76. Total local hadith rows not drafted: 13,289, including held records.

### 2026-10-29: Bukhari 1468–1473 source review

- `FR-LIB-HAD-BUKHARI-256` saves six private French drafts for Bukhari 1468–1473. They preserve the reports on zakat refusal, self-reliance, and al-Hakim ibn Hizam’s repeated refusals of public allocations. No Needs Mo item was identified.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,346 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 76. Total local hadith rows not drafted: 13,283, including held records.

### 2026-10-29: Bukhari 1474–1480 source review

- `FR-LIB-HAD-BUKHARI-257` saves five private French drafts for Bukhari 1474, 1476–1477 and 1479–1480. Bukhari 1478 remains blank and is recorded under Needs Mo because the source editor’s note quotes Quranic wording from 26:94 and 67:22; no approved, attributed French Quran translation is configured.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the reason-specific Quran hold. No database writes or publication occurred. Bukhari local drafts: 1,351 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 77. Total local hadith rows not drafted: 13,278, including held records.

### 2026-10-29: Bukhari 1481 long-source review

- `FR-LIB-HAD-BUKHARI-258` saves one private French draft for Bukhari 1481. The long report was handled alone and preserves the full harvest-estimation account, the storm warning, the travel details, and the variants concerning Uhud, Medina, and the Ansar districts. No Needs Mo item was identified.
- The single-record batch passed the focused validator for the Arabic hash, ID, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,352 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 77. Total local hadith rows not drafted: 13,277, including held records.

### 2026-10-29: Bukhari 1483–1488 source review

- `FR-LIB-HAD-BUKHARI-259` saves six private French drafts for Bukhari 1483–1488. They preserve the irrigation-based rates and Bukhari’s note on clarified transmissions, the prohibition on sale of unripe fruit, and the report that the Prophet’s family did not eat charity. No Needs Mo item was identified.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,358 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 77. Total local hadith rows not drafted: 13,271, including held records.

### 2026-10-29: Bukhari 1489–1494 source review

- `FR-LIB-HAD-BUKHARI-260` saves six private French drafts for Bukhari 1489–1494. They preserve the rulings on retrieving donated property, the distinction between charity and a gift, and the report about taking lawful benefit from a dead animal’s hide. No Needs Mo item was identified.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,364 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 77. Total local hadith rows not drafted: 13,265, including held records.

### 2026-10-29: Bukhari 1495–1500 source review

- `FR-LIB-HAD-BUKHARI-261` saves six private French drafts for Bukhari 1495–1500. They preserve the repeated distinction between charity and a gift, Mu‘adh’s instructions, the abbreviated account of the loan repaid through the wooden log, and the collector’s accounting. No Needs Mo item was identified.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,370 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 77. Total local hadith rows not drafted: 13,259, including held records.

### 2026-10-29: Bukhari 1501–1506 source review

- `FR-LIB-HAD-BUKHARI-262` saves six private French drafts for Bukhari 1501–1506. They preserve the full account concerning the Urayna group, the marking of zakat camels, and the stated amounts and forms of zakat al-fitr. No Needs Mo item was identified.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,376 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 77. Total local hadith rows not drafted: 13,253, including held records.

### 2026-10-29: Bukhari 1507–1512 source review

- `FR-LIB-HAD-BUKHARI-263` saves six private French drafts for Bukhari 1507–1512. They preserve the reported sa‘ measures, the wheat equivalence attributed to Mu‘awiya, and the timing and recipients of zakat al-fitr. No Needs Mo item was identified.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,382 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 77. Total local hadith rows not drafted: 13,247, including held records.

### 2026-10-29: Bukhari 1513–1518 source review

- `FR-LIB-HAD-BUKHARI-264` saves six private French drafts for Bukhari 1513–1518. They preserve the Khath‘am woman’s question about Hajj on behalf of her elderly father, the timing of the talbiya, and Aïcha’s ‘umra from al-Tan‘im. No Needs Mo item was identified.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,388 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 77. Total local hadith rows not drafted: 13,241, including held records.

### 2026-10-29: Bukhari 1519–1524 source review

- `FR-LIB-HAD-BUKHARI-265` saves five private French drafts for Bukhari 1519–1522 and 1524. Bukhari 1523 remains blank and is recorded under Needs Mo because it directly quotes Quran 2:197; no approved, attributed French Quran translation is configured.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the reason-specific Quran hold. No database writes or publication occurred. Bukhari local drafts: 1,393 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 78. Total local hadith rows not drafted: 13,236, including held records.

### 2026-10-29: Bukhari 1525–1530 source review

- `FR-LIB-HAD-BUKHARI-266` saves six private French drafts for Bukhari 1525–1530. They preserve the different reported miqat routes and the uncertainty in Ibn Umar’s report about Yalamlam. No Needs Mo item was identified.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,405 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 78. Total local hadith rows not drafted: 13,224, including held records.

### 2026-10-29: Bukhari 1531–1536 source review

- `FR-LIB-HAD-BUKHARI-267` saves six private French drafts for Bukhari 1531–1536. They preserve the appointment of Dhat Irq, the Prophet’s stops and prayer routes, and Ya‘la’s account of the revelation at al-Ji‘rana. No Needs Mo item was identified.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,411 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 78. Total local hadith rows not drafted: 13,218, including held records.

### 2026-10-29: Bukhari 1537–1543 source review

- `FR-LIB-HAD-BUKHARI-268` saves six private French drafts for Bukhari 1537 and 1539–1543. They preserve the reports about perfume during ihram, clothing restrictions, and the talbiya during the journey from Arafat. No Needs Mo item was identified.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,417 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 78. Total local hadith rows not drafted: 13,212, including held records.

### 2026-10-29: Bukhari 1545–1550 source review

- `FR-LIB-HAD-BUKHARI-269` saves six private French drafts for Bukhari 1545–1550. They preserve the detailed account of the Prophet’s journey and rites, the prayer reports, and the transmitted wordings of the talbiya. No Needs Mo item was identified.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,423 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 78. Total local hadith rows not drafted: 13,206, including held records.

### 2026-10-29: Bukhari 1551–1556 source review

- `FR-LIB-HAD-BUKHARI-270` saves six private French drafts for Bukhari 1551–1556. They preserve the travel and prayer details, the clothing and route variants, and Aïcha’s account of the farewell pilgrimage and her ‘umra. No Needs Mo item was identified.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,429 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 78. Total local hadith rows not drafted: 13,200, including held records.

### 2026-10-29: Bukhari 1557–1562 source review

- `FR-LIB-HAD-BUKHARI-271` saves five private French drafts for Bukhari 1557, 1558, and 1560–1562. Bukhari 1559 remains blank and is recorded under Needs Mo because it directly quotes Quran 2:196; no approved, attributed French Quran translation is configured.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the reason-specific Quran hold. No database writes or publication occurred. Bukhari local drafts: 1,434 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 79. Total local hadith rows not drafted: 13,195, including held records.

### 2026-10-29: Bukhari 1563–1568 source review

- `FR-LIB-HAD-BUKHARI-272` saves six private French drafts for Bukhari 1563–1568. They preserve Ali’s response concerning the Hajj and ‘umra rites, Ibn Abbas’s account of pre-Islamic practice, Hafsa’s question, and the reports on tamattu‘. No new Needs Mo item was identified.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,440 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 79. Total local hadith rows not drafted: 13,189, including held records.

### 2026-10-29: Bukhari 1569–1574 source review

- `FR-LIB-HAD-BUKHARI-273` saves five private French drafts for Bukhari 1569–1571 and 1573–1574. Bukhari 1572 remains blank and is recorded under Needs Mo because it directly quotes Quran 2:196 and 2:197; no approved, attributed French Quran translation is configured.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the reason-specific Quran hold. No database writes or publication occurred. Bukhari local drafts: 1,445 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 80. Total local hadith rows not drafted: 13,184, including held records.

### 2026-10-29: Bukhari 1575–1580 source review

- `FR-LIB-HAD-BUKHARI-274` saves six private French drafts for Bukhari 1575–1580. They preserve the reports on entering and leaving Mecca through different passes, including the transmitted variants Kada and Kuda. No Needs Mo item was identified.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,451 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 80. Total local hadith rows not drafted: 13,178, including held records.

### 2026-10-29: Bukhari 1581–1586 source review

- `FR-LIB-HAD-BUKHARI-275` saves six private French drafts for Bukhari 1581–1586. They preserve the reports about the Kaaba’s foundations, the Hijr, and the differing entrances to Mecca. No Needs Mo item was identified.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,457 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 80. Total local hadith rows not drafted: 13,172, including held records.

### 2026-10-29: Bukhari 1587–1592 source review

- `FR-LIB-HAD-BUKHARI-276` saves five private French drafts for Bukhari 1587 and 1589–1592. Bukhari 1588 remains blank and is recorded under Needs Mo because it directly quotes Quran 8:72; no approved, attributed French Quran translation is configured.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the reason-specific Quran hold. No database writes or publication occurred. Bukhari local drafts: 1,462 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 81. Total local hadith rows not drafted: 13,166, including held records.

### 2026-10-29: Bukhari 1593–1598 source review

- `FR-LIB-HAD-BUKHARI-277` saves six private French drafts for Bukhari 1593–1598. They preserve the variant wording about the future pilgrimage to the Kaaba, Umar’s statement about its treasury, and reports about the Black Stone and prayer inside the Kaaba. No Needs Mo item was identified.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,468 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 81. Total local hadith rows not drafted: 13,160, including held records.

### 2026-10-29: Bukhari 1599–1604 source review

- `FR-LIB-HAD-BUKHARI-278` saves six private French drafts for Bukhari 1599–1604. They preserve the reports on prayer inside the Kaaba, the reason for the tawaf pace, and the narrated pace variants across its circuits. No Needs Mo item was identified.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,474 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 81. Total local hadith rows not drafted: 13,154, including held records.

### 2026-10-29: Bukhari 1605–1610 source review

- `FR-LIB-HAD-BUKHARI-279` saves six private French drafts for Bukhari 1605–1610. They preserve Umar’s explanation for continuing the tawaf practice, the reports about touching the Kaaba’s corners, and the reported differences in practice. No Needs Mo item was identified.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,480 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 81. Total local hadith rows not drafted: 13,148, including held records.

### 2026-10-29: Bukhari 1611–1617 source review

- `FR-LIB-HAD-BUKHARI-280` saves six private French drafts for the available source records 1611–1614 and 1616–1617. No source record for 1615 was present in the exporter batch. They preserve the reports about touching the corners, the tawaf pace, and the Sa‘y. No Needs Mo item was identified.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,486 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 81. Total local hadith rows not drafted: 13,142, including held records.

### 2026-10-29: Bukhari 1618–1623 source review

- `FR-LIB-HAD-BUKHARI-281` saves four private French drafts for Bukhari 1618 and 1620–1622. Bukhari 1619 and 1623 remain blank and are recorded under Needs Mo because they directly quote Quran 52:1–2 and 33:21; no approved, attributed French Quran translation is configured.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the reason-specific Quran holds. No database writes or publication occurred. Bukhari local drafts: 1,490 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 83. Total local hadith rows not drafted: 13,138, including held records.

### 2026-10-29: Bukhari 1625–1630 source review

- `FR-LIB-HAD-BUKHARI-282` saves five private French drafts for Bukhari 1625–1626 and 1628–1630. Bukhari 1627 remains blank and is recorded under Needs Mo because it directly quotes Quran 33:21; no approved, attributed French Quran translation is configured. No source record for 1624 was present in this exporter batch.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the reason-specific Quran hold. No database writes or publication occurred. Bukhari local drafts: 1,495 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 84. Total local hadith rows not drafted: 13,133, including held records.

### 2026-10-29: Bukhari 1632–1637 source review

- `FR-LIB-HAD-BUKHARI-283` saves five private French drafts for Bukhari 1632 and 1634–1637. Bukhari 1633 remains blank and is recorded under Needs Mo because it directly quotes Quran 52:1–2; no approved, attributed French Quran translation is configured. No source record for 1631 was present in this exporter batch.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the reason-specific Quran hold. No database writes or publication occurred. Bukhari local drafts: 1,500 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 85. Total local hadith rows not drafted: 13,128, including held records.

### 2026-10-29: Bukhari 1638–1641 source review

- `FR-LIB-HAD-BUKHARI-284` saves two private French drafts for Bukhari 1638 and 1641. Bukhari 1639 and 1640 remain blank and are recorded under Needs Mo because they directly quote Quran 33:21; no approved, attributed French Quran translation is configured. The exporter provided four eligible source records in this batch.
- The four-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the reason-specific Quran holds. No database writes or publication occurred. Bukhari local drafts: 1,502 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 87. Total local hadith rows not drafted: 13,126, including held records.

### 2026-10-29: Bukhari 1643 source review

- `FR-LIB-HAD-BUKHARI-285` records Bukhari 1643 as blank under Needs Mo because the long report repeatedly quotes Quran 2:158. No approved, attributed French Quran translation is configured.
- The single-record batch passed the focused validator for its Arabic hash, ID, rights metadata, private unpublished state and reason-specific Quran hold. No database writes or publication occurred. Bukhari local drafts: 1,502 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 88. Total local hadith rows not drafted: 13,126, including held records.

### 2026-10-29: Bukhari 1644–1650 source review

- `FR-LIB-HAD-BUKHARI-286` saves three private French drafts for Bukhari 1644, 1649 and 1650. Bukhari 1645, 1647 and 1648 remain blank and are recorded under Needs Mo because they directly quote Quran 33:21 and 2:158; no approved, attributed French Quran translation is configured. No source record for 1646 was present in this batch.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the reason-specific Quran holds. No database writes or publication occurred. Bukhari local drafts: 1,505 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 90. Total local hadith rows not drafted: 13,123, including held records.

### 2026-10-29: Bukhari 1651–1656 source review

- `FR-LIB-HAD-BUKHARI-287` saves six private French drafts for Bukhari 1651–1656. They preserve the farewell-pilgrimage account, Umm Atiyya’s report with its wording variants, and the prayer reports from Mina. No Needs Mo item was identified.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,511 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 90. Total local hadith rows not drafted: 13,117, including held records.

### 2026-10-29: Bukhari 1657–1662 source review

- `FR-LIB-HAD-BUKHARI-288` saves six private French drafts for Bukhari 1657–1662. They preserve the prayer and Arafat reports, including differing reports about the Prophet’s fasting and the timing of the prayers. No Needs Mo item was identified.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,517 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 90. Total local hadith rows not drafted: 13,111, including held records.

### 2026-10-29: Bukhari 1663–1668 source review

- `FR-LIB-HAD-BUKHARI-289` saves five private French drafts for Bukhari 1663–1664 and 1666–1668. Bukhari 1665 remains blank and is recorded under Needs Mo because it directly quotes Quran 2:199; no approved, attributed French Quran translation is configured.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the reason-specific Quran hold. No database writes or publication occurred. Bukhari local drafts: 1,522 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 91. Total local hadith rows not drafted: 13,106, including held records.

### 2026-10-29: Bukhari 1669–1675 source review

- `FR-LIB-HAD-BUKHARI-290` saves six private French drafts for the available source records 1669 and 1671–1675. No source record for 1670 was present in this exporter batch. They preserve the reports on leaving Arafat and the prayer sequence at Muzdalifa, including transmitted uncertainties. No Needs Mo item was identified.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,528 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 91. Total local hadith rows not drafted: 13,100, including held records.

### 2026-10-29: Bukhari 1676–1681 source review

- `FR-LIB-HAD-BUKHARI-291` saves six private French drafts for Bukhari 1676–1681. They preserve the reports on early departure from Muzdalifa for weaker pilgrims and the permission given to Sawda, as well as their reported wording differences. No Needs Mo item was identified.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,534 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 91. Total local hadith rows not drafted: 13,094, including held records.

### 2026-10-29: Bukhari 1682–1688 source review

- `FR-LIB-HAD-BUKHARI-292` saves six private French drafts for the available source records 1682–1686 and 1688. No source record for 1687 was present in this exporter batch. They preserve the reports on prayer timing in Muzdalifa and the talbiya through the Jamra, including variants. No Needs Mo item was identified.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,540 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 91. Total local hadith rows not drafted: 13,088, including held records.

### 2026-10-29: Bukhari 1689–1694 source review

- `FR-LIB-HAD-BUKHARI-293` saves five private French drafts for Bukhari 1689–1692 and 1694. Bukhari 1693 remains blank and is recorded under Needs Mo because it directly quotes Quran 33:21; no approved, attributed French Quran translation is configured.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the reason-specific Quran hold. No database writes or publication occurred. Bukhari local drafts: 1,545 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 92. Total local hadith rows not drafted: 13,083, including held records.

### 2026-10-29: Bukhari 1696–1701 source review

- `FR-LIB-HAD-BUKHARI-294` saves six private French drafts for Bukhari 1696–1701. They preserve the reports on garlanding and marking the sacrificial animals and the differing accounts of what became prohibited. No Needs Mo item was identified.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,551 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 92. Total local hadith rows not drafted: 13,077, including held records.

### 2026-10-29: Bukhari 1702–1707 source review

- `FR-LIB-HAD-BUKHARI-295` saves six private French drafts for Bukhari 1702–1707. They preserve the reports on preparing the sacrificial animals and the instructions concerning their use and distribution. No Needs Mo item was identified.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,557 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 92. Total local hadith rows not drafted: 13,071, including held records.

### 2026-10-29: Bukhari 1708–1713 source review

- `FR-LIB-HAD-BUKHARI-296` saves five private French drafts for Bukhari 1709–1713. Bukhari 1708 remains blank and is recorded under Needs Mo because it directly quotes Quran 33:21; no approved, attributed French Quran translation is configured.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the reason-specific Quran hold. No database writes or publication occurred. Bukhari local drafts: 1,562 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 93. Total local hadith rows not drafted: 13,066, including held records.

### 2026-10-29: Bukhari 1714–1719 source review

- `FR-LIB-HAD-BUKHARI-297` saves six private French drafts for Bukhari 1714–1719. They preserve the reports on the route and prayers of the pilgrimage and on distributing the sacrificial animals and their parts. No Needs Mo item was identified.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,568 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 93. Total local hadith rows not drafted: 13,060, including held records.

### 2026-10-29: Bukhari 1720–1725 source review

- `FR-LIB-HAD-BUKHARI-298` saves six private French drafts for Bukhari 1720–1725. They preserve the reports on ritual order and the allowance for variations in the sequence of Hajj rites, including their transmission variants. No Needs Mo item was identified.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,574 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 93. Total local hadith rows not drafted: 13,054, including held records.

### 2026-10-29: Bukhari 1726–1731 source review

- `FR-LIB-HAD-BUKHARI-299` saves six private French drafts for Bukhari 1726–1731. They preserve the reports and wording variants concerning shaving or shortening the hair after Hajj. No Needs Mo item was identified.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,580 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 93. Total local hadith rows not drafted: 13,048, including held records.

### 2026-10-29: Bukhari 1732–1737 source review

- `FR-LIB-HAD-BUKHARI-300` saves six private French drafts for Bukhari 1732–1737. They preserve the reports about the tawaf of departure and the Prophet’s replies when asked about changes in the order of Hajj rites. No Needs Mo item was identified.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,586 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 93. Total local hadith rows not drafted: 13,042, including held records.

### 2026-10-29: Bukhari 1738–1743 source review

- `FR-LIB-HAD-BUKHARI-301` saves six private French drafts for Bukhari 1738–1743. Brief source fragments in 1738 and 1743 remain brief in French; no missing context was added. The other records preserve the farewell-sermon wording and transmission details. No Needs Mo item was identified.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,592 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 93. Total local hadith rows not drafted: 13,036, including held records.

### 2026-10-29: Bukhari 1744–1749 source review

- `FR-LIB-HAD-BUKHARI-302` saves six private French drafts for Bukhari 1744–1749. The brief permission wording in 1744 remains a fragment, and the references to al-Baqara in later reports are preserved without inserting Quran text. No Needs Mo item was identified.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,598 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 93. Total local hadith rows not drafted: 13,030, including held records.

### 2026-10-29: Bukhari 1750–1755 source review

- `FR-LIB-HAD-BUKHARI-303` saves six private French drafts for Bukhari 1750–1755. They preserve the stoning sequence and supplications, including the reports’ distinctions about where to stand and where not to stop. No Quran verse text was included in these records. No Needs Mo item was identified.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,604 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 93. Total local hadith rows not drafted: 13,024, including held records.

### 2026-10-29: Bukhari 1756–1763 source review

- `FR-LIB-HAD-BUKHARI-304` saves six private French drafts for the available source records 1756–1758, 1760, and 1762–1763. No source record for 1759 or 1761 was present in this exporter batch. The reports retain differences in the narration about Safiyya and the concession for women who had completed the tawaf. No Needs Mo item was identified.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,610 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 93. Total local hadith rows not drafted: 13,018, including held records.

### 2026-10-29: Bukhari 1764–1769 source review

- `FR-LIB-HAD-BUKHARI-305` saves six private French drafts for Bukhari 1764–1769. They preserve the reports on the stop at al-Muhassab, with the transmitted uncertainty about which prayers Ibn Umar performed there. No Needs Mo item was identified.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,616 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 93. Total local hadith rows not drafted: 13,012, including held records.

### 2026-10-29: Bukhari 1770–1777 source review

- `FR-LIB-HAD-BUKHARI-306` saves five private French drafts for the available source records 1771, 1773–1775 and 1777. Bukhari 1770 remains blank and is recorded under Needs Mo because it directly quotes Quran 2:198; no approved, attributed French Quran translation is configured. No source record for 1772 or 1776 was present in this exporter batch.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the reason-specific Quran hold. No database writes or publication occurred. Bukhari local drafts: 1,621 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 94. Total local hadith rows not drafted: 13,007, including held records.

### 2026-10-29: Bukhari 1778–1783 source review

- `FR-LIB-HAD-BUKHARI-307` saves six private French drafts for Bukhari 1778–1783. They preserve the differing reports about the Prophet’s ‘umra count and Aïcha’s account of changing her pilgrimage rite. No Needs Mo item was identified.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,627 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 94. Total local hadith rows not drafted: 13,001, including held records.

### 2026-10-29: Bukhari 1784–1789 source review

- `FR-LIB-HAD-BUKHARI-308` saves six private French drafts for Bukhari 1784–1789. They preserve the reports on Aïcha’s ‘umra and the variation in the rites, including the garment and scent details in the al-Ji‘rana account. No Quran quotation required a hold. No Needs Mo item was identified.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,633 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 94. Total local hadith rows not drafted: 12,995, including held records.

### 2026-10-29: Bukhari 1790–1797 source review

- `FR-LIB-HAD-BUKHARI-309` saves four private French drafts for Bukhari 1791, 1795–1797. Bukhari 1790 and 1793 remain blank and are recorded under Needs Mo because they directly quote Quran 2:158 and 33:21; no approved, attributed French Quran translation is configured. No source record for 1792 or 1794 was present in this exporter batch.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the reason-specific Quran holds. No database writes or publication occurred. Bukhari local drafts: 1,637 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 96. Total local hadith rows not drafted: 12,991, including held records.

### 2026-10-29: Bukhari 1798–1803 source review

- `FR-LIB-HAD-BUKHARI-310` saves five private French drafts for Bukhari 1798–1802. Bukhari 1803 remains blank and is recorded under Needs Mo because it directly quotes Quran 2:189; no approved, attributed French Quran translation is configured.
- The six-record batch passed the focused validator for Arabic hashes, IDs, rights metadata, private unpublished state and the reason-specific Quran hold. No database writes or publication occurred. Bukhari local drafts: 1,642 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 97. Total local hadith rows not drafted: 12,986, including held records.
### 2026-10-29: Bukhari 1804–1809 source review

- `FR-LIB-HAD-BUKHARI-311` saves six private French drafts for Bukhari 1804–1809. The short Bukhari 1808 fragment remains brief and unfinished in French; no context was added. No Quran quotation hold was required.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,648 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 97. Total local hadith rows not drafted: 12,980, including held records.
### 2026-10-29: Bukhari 1810–1815 source review

- `FR-LIB-HAD-BUKHARI-312` saves five private French drafts for Bukhari 1810–1814. Bukhari 1815 remains blank and is recorded under Needs Mo because it directly quotes Quran 2:196; no approved, attributed French Quran translation is configured. The reports preserve the distinct instructions, steps and numbers.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata, private unpublished state and the reason-specific Quran hold. No database writes or publication occurred. Bukhari local drafts: 1,653 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 98. Total local hadith rows not drafted: 12,975, including held records.
### 2026-10-29: Bukhari 1816–1821 source review

- `FR-LIB-HAD-BUKHARI-313` saves six private French drafts for Bukhari 1816–1821. They preserve the compensation options and quantities, the similar short report in 1818, both wordings of the Hajj narration, and the full travel and hunting account in 1821. No direct Quran quotation required a hold.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,659 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 98. Total local hadith rows not drafted: 12,969, including held records.
### 2026-10-29: Narrator-chain completeness correction

- A reread of Bukhari batches 311–313 found that several French drafts did not retain the full narrator chains. The chains have now been added to every translated record in those three batches; records already held blank remain unchanged.
- The focused validator passed again for batches 311, 312 and 313. Translation counts, Needs Mo holds and publication/database status are unchanged.
### 2026-10-29: Bukhari 1822–1827 source review

- `FR-LIB-HAD-BUKHARI-314` saves six private French drafts for Bukhari 1822–1827. The reports retain both transmission paths and the full hunting account. The incomplete closing fragments in 1826 and 1827 remain incomplete in French; no list or missing hadith wording was supplied from nearby reports. The short wording about al-Qâha in 1823 leaves its distance unit unspecified, as the source does.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,665 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 98. Total local hadith rows not drafted: 12,964, including previously held records.
### 2026-10-29: Bukhari 1828–1833 source review

- `FR-LIB-HAD-BUKHARI-315` saves four private French drafts for Bukhari 1828, 1829, 1831 and 1833. Bukhari 1830 remains blank because it directly quotes Quran 77:1; no approved, attributed French Quran translation is configured. Bukhari 1832 remains blank because its final Arabic phrase خَرْبَةٌ بَلِيَّةٌ is unclear. Both are recorded under Needs Mo.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata, private unpublished state and reason-specific holds. No database writes or publication occurred. Bukhari local drafts: 1,669 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 100. Total local hadith rows not drafted: 12,960, including held records.
### 2026-10-29: Bukhari 1834–1839 source review

- `FR-LIB-HAD-BUKHARI-316` saves six private French drafts for Bukhari 1834–1839. The drafts retain the complete narrator chains, the alternate transmission details and clothing variants in 1838, and the specific conditions and exceptions in each report.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,675 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 100. Total local hadith rows not drafted: 12,954, including held records.
### 2026-10-29: Bukhari 1840–1845 source review

- `FR-LIB-HAD-BUKHARI-317` saves six private French drafts for Bukhari 1840–1845. They retain the disagreement about washing the head, the separate reports on clothing in ihram, the conditions on footgear, the treaty wording, and the location-specific miqat instructions.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,681 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 100. Total local hadith rows not drafted: 12,948, including held records.
### 2026-10-29: Bukhari 1846–1851 source review

- `FR-LIB-HAD-BUKHARI-318` saves five private French drafts for Bukhari 1846, 1847 and 1849–1851. Bukhari 1848 remains blank under Needs Mo because this detached, very short excerpt does not identify clearly what the Prophet invalidated after a tooth was pulled.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata, private unpublished state and the reason-specific hold. No database writes or publication occurred. Bukhari local drafts: 1,686 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 101. Total local hadith rows not drafted: 12,943, including held records.
### 2026-10-29: Bukhari 1852–1857 source review

- `FR-LIB-HAD-BUKHARI-319` saves five private French drafts for Bukhari 1852 and 1854–1857. Bukhari 1853 remains blank under Needs Mo because the exported Arabic record stops after “a woman” before the report begins. No neighboring wording was used to fill the gap.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata, private unpublished state and the reason-specific hold. No database writes or publication occurred. Bukhari local drafts: 1,691 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 102. Total local hadith rows not drafted: 12,938, including held records.
### 2026-10-29: Bukhari 1858–1863 source review

- `FR-LIB-HAD-BUKHARI-320` saves six private French drafts for Bukhari 1858–1863. They preserve the narrator chains, the alternate wording about Ibn ‘Abbâs’s dispatch in 1862, and the two alternate transmission paths in 1863. Its final chain has no accompanying hadith text in the source, so none was supplied.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,697 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 102. Total local hadith rows not drafted: 12,932, including held records.
### 2026-10-29: Bukhari 1864–1869 source review

- `FR-LIB-HAD-BUKHARI-321` saves six private French drafts for Bukhari 1864–1869. It preserves the narrator’s uncertainty in 1864, the wording about a vow to walk and permission to ride in 1865–1866, and the full reports about the sanctuaries and the mosque’s construction.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,703 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 102. Total local hadith rows not drafted: 12,926, including held records.
### 2026-10-29: Bukhari 1870–1875 source review

- `FR-LIB-HAD-BUKHARI-322` saves four private French drafts for Bukhari 1871–1874. Bukhari 1870 remains blank because its boundary is unspecified and its closing affiliation clause is unclear. Bukhari 1875 remains blank because its verb يبُسّون is unclear in the source excerpt. Both are recorded under Needs Mo; no wording was borrowed from elsewhere.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata, private unpublished state and reason-specific holds. No database writes or publication occurred. Bukhari local drafts: 1,707 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 104. Total local hadith rows not drafted: 12,922, including held records.
### 2026-10-29: Bukhari 1876–1881 source review

- `FR-LIB-HAD-BUKHARI-323` saves six private French drafts for Bukhari 1876–1881. It preserves the chain variation in 1878 and the repeated details about Medina’s protected boundaries, gates and access points.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,713 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 104. Total local hadith rows not drafted: 12,916, including held records.
### 2026-10-29: Bukhari 1882–1887 source review

- `FR-LIB-HAD-BUKHARI-324` saves five private French drafts for Bukhari 1882, 1883 and 1885–1887. Bukhari 1884 remains blank under Needs Mo because it directly quotes Quran 4:88; no approved, attributed French Quran translation is configured.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata, private unpublished state and the reason-specific hold. No database writes or publication occurred. Bukhari local drafts: 1,718 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 105. Total local hadith rows not drafted: 12,911, including held records.
### 2026-10-29: Bukhari 1888–1893 source review

- `FR-LIB-HAD-BUKHARI-325` saves six private French drafts for Bukhari 1888–1893. It retains the full poetic report in 1889, the alternate transmission chains in 1890, and the stated conditions and optional wording in the remaining reports.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,724 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 105. Total local hadith rows not drafted: 12,905, including held records.
### 2026-10-29: Bukhari 1894–1899 source review

- `FR-LIB-HAD-BUKHARI-326` saves six private French drafts for Bukhari 1894–1899. It preserves the full dialogue and gate descriptions in 1895 and 1897, along with the exact counts and closing wordings in the other reports.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,730 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 105. Total local hadith rows not drafted: 12,899, including held records.
### 2026-10-29: Bukhari 1900–1905 source review

- `FR-LIB-HAD-BUKHARI-327` saves six private French drafts for Bukhari 1900–1905. It preserves the alternate chain concerning the Ramadan crescent in 1900, the complete report about the Night of the Destining in 1902, and the narrated variants in 1904–1905.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,736 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 105. Total local hadith rows not drafted: 12,893, including held records.
### 2026-10-29: Bukhari 1906–1911 source review

- `FR-LIB-HAD-BUKHARI-328` saves six private French drafts for Bukhari 1906–1911. It retains the different wording on sighting the crescent, the thumb gesture and the report’s morning-or-evening uncertainty in 1910, along with the twenty-nine-night details.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,742 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 105. Total local hadith rows not drafted: 12,887, including held records.
### 2026-10-29: Bukhari 1912–1917 source review

- `FR-LIB-HAD-BUKHARI-329` saves three private French drafts for Bukhari 1912–1914. Bukhari 1915–1917 remain blank under Needs Mo because they directly quote Quran 2:187; no approved, attributed French Quran translation is configured.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata, private unpublished state and the reason-specific Quran holds. No database writes or publication occurred. Bukhari local drafts: 1,745 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 108. Total local hadith rows not drafted: 12,884, including held records.
### 2026-10-29: Bukhari 1918 and 1920–1924 source review

- `FR-LIB-HAD-BUKHARI-330` saves six private French drafts for the available source records 1918 and 1920–1924. The batch preserves the two transmission paths in 1918 and the stated timing, number and alternative wording in the remaining reports. No source record for 1919 was present in this exporter batch.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,751 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 108. Total local hadith rows not drafted: 12,878, including held records.
### 2026-10-29: Bukhari 1925 and 1927–1931 source review

- `FR-LIB-HAD-BUKHARI-331` saves five private French drafts for Bukhari 1925 and 1928–1931. Bukhari 1927 remains blank under Needs Mo because it directly quotes Quran 24:31; no approved, attributed French Quran translation is configured. The differing reports and chain details in 1925 remain intact.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata, private unpublished state and the reason-specific Quran hold. No database writes or publication occurred. Bukhari local drafts: 1,750 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 109. Total local hadith rows not drafted: 12,879, including held records.
### 2026-10-29: Bukhari 1933–1938 source review

- `FR-LIB-HAD-BUKHARI-332` saves six private French drafts for Bukhari 1933–1938. The batch retains the full ablution sequence, the complete expiation questions and responses in both variants, and the reported fasting and cupping details.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,756 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 109. Total local hadith rows not drafted: 12,873, including held records.
### 2026-10-29: Bukhari 1939–1944 source review

- `FR-LIB-HAD-BUKHARI-333` saves six private French drafts for Bukhari 1939–1944. It retains the exact reports about cupping and fasting, the repeated request to prepare the drink in 1941, and the incomplete statement in 1942 without supplying a missing response.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,762 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 109. Total local hadith rows not drafted: 12,867, including held records.
### 2026-10-29: Bukhari 1945–1950 source review

- `FR-LIB-HAD-BUKHARI-334` saves five private French drafts for Bukhari 1945–1948 and 1950. Bukhari 1949 remains blank under Needs Mo because it directly quotes Quran 2:184; no approved, attributed French Quran translation is configured.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata, private unpublished state and the reason-specific Quran hold. No database writes or publication occurred. Bukhari local drafts: 1,767 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 110. Total local hadith rows not drafted: 12,862, including held records.
### 2026-10-29: Bukhari 1951–1956 source review

- `FR-LIB-HAD-BUKHARI-335` saves six private French drafts for Bukhari 1951–1956. It retains the different reported versions and narrator chains in 1952–1953 and the repeated requests and directions in the sunset reports.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,773 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 110. Total local hadith rows not drafted: 12,856, including held records.
### 2026-10-29: Bukhari 1957–1962 source review

- `FR-LIB-HAD-BUKHARI-336` saves six private French drafts for Bukhari 1957–1962. It preserves the uncertainty about whether the fast was made up in 1959 and the alternate wording about continuous fasting in 1961.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,779 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 110. Total local hadith rows not drafted: 12,850, including held records.
### 2026-10-29: Bukhari 1963–1968 source review

- `FR-LIB-HAD-BUKHARI-337` saves six private French drafts for Bukhari 1963–1968. It retains the different accounts about continuous fasting, the compiler’s wording note in 1964, and the full account of Salman and Abu al-Darda’ in 1968.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,785 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 110. Total local hadith rows not drafted: 12,844, including held records.
### 2026-10-29: Bukhari 1969–1974 source review

- `FR-LIB-HAD-BUKHARI-338` saves six private French drafts for Bukhari 1969–1974. It preserves the observations about fasting frequency, the alternative report chain in 1972, and the fasting pattern and limits in 1974.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,791 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 110. Total local hadith rows not drafted: 12,838, including held records.

### 2026-10-29: Bukhari 1975–1980 source review

- `FR-LIB-HAD-BUKHARI-339` saves six private French drafts for Bukhari 1975–1980. The drafts preserve the transmission chains and the distinct fasting-count and recitation variants.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,797 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 110. Total local hadith rows not drafted: 12,832, including held records.

### 2026-10-29: Bukhari 1981–1986 source review

- `FR-LIB-HAD-BUKHARI-340` saves six private French drafts for Bukhari 1981–1986. The drafts retain the alternate chains and editorial notes in the final reports, as well as the wording variants on fasting the end of the month.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,803 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 110. Total local hadith rows not drafted: 12,826, including held records.

### 2026-10-29: Bukhari 1987–1993 source review

- `FR-LIB-HAD-BUKHARI-341` saves six private French drafts for Bukhari 1987–1993; no source 1992 was present in the export. Alternate chains and the report variants are retained.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,809 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 110. Total local hadith rows not drafted: 12,820, including held records.

### 2026-10-29: Bukhari 1994–2000 source review

- `FR-LIB-HAD-BUKHARI-342` saves six private French drafts for Bukhari 1994–2000; no source 1998 was present in the export. The reports retain their alternate chains and the conditions on fasting during the pilgrimage.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,815 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 110. Total local hadith rows not drafted: 12,814, including held records.

### 2026-10-29: Bukhari 2001–2006 source review

- `FR-LIB-HAD-BUKHARI-343` saves six private French drafts for Bukhari 2001–2006, covering reports about the fast of ‘Âshûrâ’. Transmission chains are retained.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,821 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 110. Total local hadith rows not drafted: 12,808, including held records.

### 2026-10-29: Bukhari 2007–2012 source review

- `FR-LIB-HAD-BUKHARI-344` saves six private French drafts for Bukhari 2007–2012, including the reports on ‘Âshûrâ’ and congregational night prayers in Ramadan.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,827 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 110. Total local hadith rows not drafted: 12,802, including held records.

### 2026-10-29: Bukhari 2013–2018 source review

- `FR-LIB-HAD-BUKHARI-345` saves six private French drafts for Bukhari 2013–2018, including reports on Ramadan night prayers, the Night of the Destin, and spiritual retreat.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,833 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 110. Total local hadith rows not drafted: 12,796, including held records.

### 2026-10-29: Bukhari 2019–2024 source review

- `FR-LIB-HAD-BUKHARI-346` saves six private French drafts for Bukhari 2019–2024. The short fragment in 2019 remains a short fragment, and the distinct Night of the Destin date reports are retained.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,839 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 110. Total local hadith rows not drafted: 12,790, including held records.

### 2026-10-29: Bukhari 2025–2030 source review

- `FR-LIB-HAD-BUKHARI-347` saves six private French drafts for Bukhari 2025–2030 on spiritual retreat, including reports about contact between spouses during menstruation.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,845 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 110. Total local hadith rows not drafted: 12,784, including held records.

### 2026-10-29: Bukhari 2032–2037 source review

- `FR-LIB-HAD-BUKHARI-348` saves six private French drafts for Bukhari 2032–2037, covering vows, spiritual retreat, and prolonged bleeding. Transmission chains and narrative details are retained.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,851 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 110. Total local hadith rows not drafted: 12,778, including held records.

### 2026-10-29: Bukhari 2038–2043 source review

- `FR-LIB-HAD-BUKHARI-349` saves six private French drafts for Bukhari 2038–2043. The overlapping reports preserve their separate narrator wording, including uncertainty in the chains and details.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,857 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 110. Total local hadith rows not drafted: 12,772, including held records.

### 2026-10-29: Bukhari 2044–2049 source review

- `FR-LIB-HAD-BUKHARI-350` saves six private French drafts for Bukhari 2044–2049, including the accounts of Abû Hurayra and ‘Abd ar-Rahmân ibn ‘Awf.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,863 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 110. Total local hadith rows not drafted: 12,766, including held records.

### 2026-10-29: Bukhari 2050–2055 source review

- `FR-LIB-HAD-BUKHARI-351` saves five private French drafts for Bukhari 2051–2055. Bukhari 2050 directly quotes Quran 2:198, so its entire French report remains blank and Needs Mo pending an approved, attributed French Quran translation.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,868 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 111. Total local hadith rows not drafted: 12,761, including held records.

### Manifest correction: Bukhari batches 339–350

- Added the six source IDs from each of Bukhari batches 339–350 to their manifest records; their local translations and validation state were already saved.

### 2026-10-29: Bukhari 2056–2062 source review

- `FR-LIB-HAD-BUKHARI-352` saves five private French drafts for Bukhari 2056, 2057, 2059, 2060 and 2062. Bukhari 2058 directly quotes Quran 62:11; its entire French report remains blank and Needs Mo pending an approved, attributed French Quran translation.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,873 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 112. Total local hadith rows not drafted: 12,756, including held records.

### 2026-10-29: Bukhari 2063–2068 source review

- `FR-LIB-HAD-BUKHARI-353` saves five private French drafts for Bukhari 2063, 2065–2068. Bukhari 2064 directly quotes Quran 62:11; its entire French report remains blank and Needs Mo pending an approved, attributed French Quran translation.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,878 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 113. Total local hadith rows not drafted: 12,751, including held records.

### 2026-10-29: Bukhari 2069–2074 source review

- `FR-LIB-HAD-BUKHARI-354` saves six private French drafts for Bukhari 2069–2074, including reports on household provisions and earning a living through one’s own work.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,884 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 113. Total local hadith rows not drafted: 12,745, including held records.

### 2026-10-29: Bukhari 2075–2080 source review

- `FR-LIB-HAD-BUKHARI-355` saves six private French drafts for Bukhari 2075–2080, preserving the alternate wording about leniency toward debtors and the transaction conditions.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,890 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 113. Total local hadith rows not drafted: 12,739, including held records.

### 2026-10-29: Bukhari 2081–2086 source review

- `FR-LIB-HAD-BUKHARI-356` saves six private French drafts for Bukhari 2081–2086, covering sales, lawful earnings and financial dealings.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,896 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 113. Total local hadith rows not drafted: 12,727, including held records.

### 2026-10-29: Bukhari 2087–2092 source review

- `FR-LIB-HAD-BUKHARI-357` saves four private French drafts for Bukhari 2087, 2089, 2090 and 2092. Bukhari 2088 directly quotes Quran 3:77 and 2091 directly quotes Quran 19:77–80; both full French reports remain blank and Needs Mo pending an approved, attributed French Quran translation.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,900 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 115. Total local hadith rows not drafted: 12,725, including held records.

### 2026-10-29: Bukhari 2093–2098 source review

- `FR-LIB-HAD-BUKHARI-358` saves five private French drafts for Bukhari 2093–2097. Bukhari 2098 directly quotes Quran 2:198; its entire French report remains blank and Needs Mo pending an approved, attributed French Quran translation.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,905 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 116. Total local hadith rows not drafted: 12,724, including held records.

### 2026-10-29: Bukhari 2099–2104 source review

- `FR-LIB-HAD-BUKHARI-359` saves six private French drafts for Bukhari 2099–2104, including reports on trade, companionship and cupping.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,911 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 116. Total local hadith rows not drafted: 12,718, including held records.

### 2026-10-29: Bukhari 2105–2110 source review

- `FR-LIB-HAD-BUKHARI-360` saves six private French drafts for Bukhari 2105–2110, including the variant conditions for canceling a sale.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,917 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 116. Total local hadith rows not drafted: 12,712, including held records.

### 2026-10-29: Bukhari 2111–2116 source review

- `FR-LIB-HAD-BUKHARI-361` saves six private French drafts for Bukhari 2111–2116, retaining the alternative sale terms and the account of Ibn ‘Umar’s exchange with ‘Uthmân. The exporter also identified a longer source for a following single-item export.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,923 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 116. Total local hadith rows not drafted: 12,706, including held records.

### 2026-10-29: Bukhari 2117–2122 source review

- `FR-LIB-HAD-BUKHARI-362` saves six private French drafts for Bukhari 2117–2122, including the sale condition and the account involving the Prophet’s grandson.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,929 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 116. Total local hadith rows not drafted: 12,700, including held records.

### 2026-10-29: Bukhari 2123–2129 source review

- `FR-LIB-HAD-BUKHARI-363` saves five private French drafts for Bukhari 2123 and 2126–2129. Bukhari 2125 directly quotes Quran 33:45–46; its entire French report remains blank and Needs Mo pending an approved, attributed French Quran translation.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,934 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 117. Total local hadith rows not drafted: 12,695, including held records.

### 2026-10-29: Bukhari 2130–2135 source review

- `FR-LIB-HAD-BUKHARI-364` saves six private French drafts for Bukhari 2130–2135, retaining the transmission and wording variants in the reports about commodity sales and measures.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,940 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 117. Total local hadith rows not drafted: 12,689, including held records.

### 2026-10-29: Bukhari 2136–2141 source review

- `FR-LIB-HAD-BUKHARI-365` saves six private French drafts for Bukhari 2136–2141, including the migration account and the sale of a conditional emancipation.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,946 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 117. Total local hadith rows not drafted: 12,683, including held records.

### 2026-10-29: Bukhari 2142–2147 source review

- `FR-LIB-HAD-BUKHARI-366` saves six private French drafts for Bukhari 2142–2147, preserving descriptions of the prohibited sale forms.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,952 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 117. Total local hadith rows not drafted: 12,677, including held records.

### 2026-10-29: Bukhari 2148–2153 source review

- `FR-LIB-HAD-BUKHARI-367` saves six private French drafts for Bukhari 2148–2153, retaining the source variants on the milking and sale reports.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,958 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 117. Total local hadith rows not drafted: 12,671, including held records.

### 2026-10-29: Bukhari 2155–2160 source review

- `FR-LIB-HAD-BUKHARI-368` saves six private French drafts for Bukhari 2155–2160, retaining the source wording on the sale of Barîra and the rules about brokers.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,964 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 117. Total local hadith rows not drafted: 12,665, including held records.

### 2026-10-29: Bukhari 2161–2166 source review

- `FR-LIB-HAD-BUKHARI-369` saves six private French drafts for Bukhari 2161–2166, retaining the source clarification about a city-dweller acting as a broker for a nomad.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,970 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 117. Total local hadith rows not drafted: 12,659, including held records.

### 2026-10-29: Bukhari 2167–2172 source review

- `FR-LIB-HAD-BUKHARI-370` saves six private French drafts for Bukhari 2167–2172, including the contract and exchange reports and their explanatory details.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,976 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 117. Total local hadith rows not drafted: 12,653, including held records.

### 2026-10-29: Bukhari 2174–2180 source review

- `FR-LIB-HAD-BUKHARI-371` saves six private French drafts for Bukhari 2174–2178 and 2180. Reported exchange wording and narrator variants are retained.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,982 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 117. Total local hadith rows not drafted: 12,647, including held records.

### 2026-10-29: Bukhari 2182–2188 source review

- `FR-LIB-HAD-BUKHARI-372` saves six private French drafts for Bukhari 2182–2188, retaining the stated ‘arâyâ exception and the definitions supplied for the named sale forms.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,988 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 117. Total local hadith rows not drafted: 12,641, including held records.

### 2026-10-29: Bukhari 2189–2194 source review

- `FR-LIB-HAD-BUKHARI-373` saves six private French drafts for Bukhari 2189–2194, preserving the full commentary and variants about fruit sales and the ‘arâyâ exception.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 1,994 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 117. Total local hadith rows not drafted: 12,635, including held records.

### 2026-10-29: Bukhari 2195–2200 source review

- `FR-LIB-HAD-BUKHARI-374` saves six private French drafts for Bukhari 2195–2200, including the source commentary on fruit maturity and the loan-and-pledge report.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,000 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 117. Total local hadith rows not drafted: 12,629, including held records.

### 2026-10-29: Bukhari 2201–2207 source review

- `FR-LIB-HAD-BUKHARI-375` saves six private French drafts for Bukhari 2201 and 2203–2207. It preserves the report’s examples of muzâbana and the pollination condition for date palms.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,006 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 117. Total local hadith rows not drafted: 12,623, including held records.

### 2026-10-29: Bukhari 2208–2213 source review

- `FR-LIB-HAD-BUKHARI-376` saves five private French drafts for Bukhari 2208–2211 and 2213. Bukhari 2212 directly quotes Quran 4:6; its entire French report remains blank and Needs Mo pending an approved, attributed French Quran translation.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,011 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 118. Total local hadith rows not drafted: 12,618, including held records.

### 2026-10-29: Bukhari 2214–2214b source review

- `FR-LIB-HAD-BUKHARI-377` saves two private French drafts for Bukhari 2214 and 2214b, preserving the alternate wordings and transmission chains on the right of preemption.
- The two-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,013 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 118. Total local hadith rows not drafted: 12,616, including held records.

### 2026-10-29: Bukhari 2215 long-source review

- `FR-LIB-HAD-BUKHARI-378` saves the full private French draft for Bukhari 2215, a source too long for a multi-item export. It preserves all three men’s accounts and their separate supplications.
- The single-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,014 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 118. Total local hadith rows not drafted: 12,615, including held records.

### 2026-10-29: Bukhari 2216–2221 source review

- `FR-LIB-HAD-BUKHARI-379` saves six private French drafts for Bukhari 2216–2221, including the reports about Sâra, the child’s parentage, and prior good deeds.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,020 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 118. Total local hadith rows not drafted: 12,607, including held records.

### 2026-10-29: Bukhari 2222–2227 source review

- `FR-LIB-HAD-BUKHARI-380` saves six private French drafts for Bukhari 2222–2227, retaining the lexical commentary and the full exchange in the image-making report.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,026 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 118. Total local hadith rows not drafted: 12,601, including held records.

### 2026-10-29: Bukhari 2228–2234 source review

- `FR-LIB-HAD-BUKHARI-381` saves six private French drafts for Bukhari 2228–2232 and 2234. The combined source record is referenced as Bukhari 2232–2233; its full report is translated once.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,032 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 118. Total local hadith rows not drafted: 12,597, including held records.

### 2026-10-29: Bukhari 2235–2239b source review

- `FR-LIB-HAD-BUKHARI-382` saves six private French drafts for Bukhari 2235–2239b, preserving the reported chain variant in 2236 and the short parallel wording in 2239b.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,038 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 118. Total local hadith rows not drafted: 12,591, including held records.

### 2026-10-29: Bukhari 2240–2245 source review

- `FR-LIB-HAD-BUKHARI-383` saves six private French drafts for Bukhari 2240–2245, retaining the measure, weight and deadline terms and the variant lists of commodities in reports 2242–2245.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,044 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 118. Total local hadith rows not drafted: 12,585, including held records.

### 2026-10-29: Bukhari 2246–2253 source review

- `FR-LIB-HAD-BUKHARI-384` saves six private French drafts for Bukhari 2246–2253, retaining the alternate narrator reports on date sales and the pledge reports in 2251–2252.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,050 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 118. Total local hadith rows not drafted: 12,579, including held records.

### 2026-10-29: Bukhari 2254–2260 source review

- `FR-LIB-HAD-BUKHARI-385` saves six private French drafts for Bukhari 2254–2260, preserving the deadline, neighbor preemption, and trustworthy-steward wording.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,056 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 118. Total local hadith rows not drafted: 12,573, including held records.

### 2026-10-29: Bukhari 2261–2267 source review

- `FR-LIB-HAD-BUKHARI-386` saves six private French drafts for Bukhari 2261–2267, preserving the employment, migration-guide and worker-injury narratives, plus the wall-repair wording variants.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,062 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 118. Total local hadith rows not drafted: 12,567, including held records.

### 2026-10-29: Bukhari 2268–2271 source review

- `FR-LIB-HAD-BUKHARI-387` saves four private French drafts for Bukhari 2268–2271, preserving the workday parable, the entrusted wage, and its concluding comparison.
- The four-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,066 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 118. Total local hadith rows not drafted: 12,563, including held records.

### 2026-10-29: Bukhari 2272 long-source review

- `FR-LIB-HAD-BUKHARI-388` saves the full private French draft for Bukhari 2272, a source too long for a multi-item export. The three men’s accounts and all three prayers are retained.
- The single-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,067 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 118. Total local hadith rows not drafted: 12,562, including held records.

### 2026-10-29: Bukhari 2273–2278 source review

- `FR-LIB-HAD-BUKHARI-389` saves four private French drafts for Bukhari 2273, 2274, 2277 and 2278. Bukhari 2275 directly quotes Quran 19:77–80 and 2276 directly quotes Quran 1:2; both full French reports remain blank and Needs Mo until an approved, attributed French Quran translation is confirmed.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,071 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 120. Total local hadith rows not drafted: 12,558, including held records.

### 2026-10-29: Bukhari 2279–2284 source review

- `FR-LIB-HAD-BUKHARI-390` saves six private French drafts for Bukhari 2279–2284, retaining the reports on cupping fees, slave earnings and the stud fee.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,077 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 120. Total local hadith rows not drafted: 12,552, including held records.

### 2026-10-29: Bukhari 2285–2290 source review

- `FR-LIB-HAD-BUKHARI-391` saves five private French drafts for the combined 2285–2286 report and Bukhari 2287–2290, retaining the debt-transfer, funeral-prayer and guarantor variants.
- The five-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,082 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 120. Total local hadith rows not drafted: 12,547, including held records.

### 2026-10-29: Bukhari 2291 long-source review

- `FR-LIB-HAD-BUKHARI-392` saves the full private French draft for Bukhari 2291, a source too long for a multi-item export. It preserves the loan, the borrower’s deposit in the wooden log, and the lender’s response.
- The single-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,083 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 120. Total local hadith rows not drafted: 12,546, including held records.

### 2026-10-29: Bukhari 2292–2296 source review

- `FR-LIB-HAD-BUKHARI-393` saves four private French drafts for Bukhari 2293–2296. Bukhari 2292 directly quotes Quran 4:33; its full French report remains blank and Needs Mo until an approved, attributed French Quran translation is confirmed.
- The five-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,087 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 121. Total local hadith rows not drafted: 12,542, including held records.

### 2026-10-29: Bukhari 2297 long-source review

- `FR-LIB-HAD-BUKHARI-394` saves the full private French draft for Bukhari 2297, a source too long for a multi-item export. It preserves the complete account of Abû Bakr’s first attempted migration and Ibn al-Dughunna’s protection.
- The single-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,088 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 121. Total local hadith rows not drafted: 12,541, including held records.

### 2026-10-29: Bukhari 2298–2304 source review

- `FR-LIB-HAD-BUKHARI-395` saves six private French drafts for Bukhari 2298–2304, including the combined 2302–2303 report and the shepherd’s ruling in 2304.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,094 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 121. Total local hadith rows not drafted: 12,535, including held records.

### 2026-10-29: Bukhari 2305–2310 source review

- `FR-LIB-HAD-BUKHARI-396` saves five private French drafts for Bukhari 2305, 2306, combined 2307–2308, 2309 and 2310, retaining the complete journey account and its added qîrât.
- The five-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,099 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 121. Total local hadith rows not drafted: 12,530, including held records.

### 2026-10-29: Bukhari 2311 source review

- `FR-LIB-HAD-BUKHARI-397` records Bukhari 2311 as Needs Mo. The report directly quotes Quran 2:255 (Ayat al-Kursi); its full French text remains blank pending an approved, attributed French Quran translation.
- The single-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,099 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 122. Total local hadith rows not drafted: 12,530, including held records.

### 2026-10-29: Bukhari 2312–2318 source review

- `FR-LIB-HAD-BUKHARI-398` saves five private French drafts for Bukhari 2312–2317. Bukhari 2318 directly quotes Quran 3:92; its full French report remains blank and Needs Mo until an approved, attributed French Quran translation is confirmed.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,104 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 123. Total local hadith rows not drafted: 12,525, including held records.

### 2026-10-29: Bukhari 2319–2324 source review

- `FR-LIB-HAD-BUKHARI-399` saves six private French drafts for Bukhari 2319–2324, retaining the wording variants about entrusted funds and the stated dog-use exceptions.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,110 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 123. Total local hadith rows not drafted: 12,519, including held records.

### 2026-10-29: Bukhari 2325–2330 source review

- `FR-LIB-HAD-BUKHARI-400` saves six private French drafts for Bukhari 2325–2330, preserving the land-share terms and the alternatives involving the fixed yield.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,116 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 123. Total local hadith rows not drafted: 12,513, including held records.

### 2026-10-29: Bukhari 2331–2332 source review

- `FR-LIB-HAD-BUKHARI-401` saves two private French drafts for Bukhari 2331–2332, preserving the Khaybar harvest share and the reason for prohibiting divided land plots.
- The two-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,118 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 123. Total local hadith rows not drafted: 12,511, including held records.

### 2026-10-29: Bukhari 2333 long-source review

- `FR-LIB-HAD-BUKHARI-402` saves the full private French draft for Bukhari 2333, a source too long for a multi-item export. It preserves all three men’s accounts and their prayers.
- The single-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,119 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 123. Total local hadith rows not drafted: 12,510, including held records.

### 2026-10-29: Bukhari 2334–2339 source review

- `FR-LIB-HAD-BUKHARI-403` saves six private French drafts for Bukhari 2334–2339, retaining the land and crop terms and the location variants in 2336–2338.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,125 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 123. Total local hadith rows not drafted: 12,504, including held records.

### 2026-10-29: Bukhari 2340–2348 source review

- `FR-LIB-HAD-BUKHARI-404` saves six private French drafts for Bukhari 2340–2348, preserving the differing reports about land rentals and the story of the man in Paradise who wished to farm.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,131 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 123. Total local hadith rows not drafted: 12,498, including held records.

### 2026-10-29: Bukhari 2349–2354 source review

- `FR-LIB-HAD-BUKHARI-405` saves five private French drafts for Bukhari 2349 and 2351–2354. Bukhari 2350 directly quotes Quran 2:159; its full French report remains blank and Needs Mo until an approved, attributed French Quran translation is confirmed.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,136 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 124. Total local hadith rows not drafted: 12,493, including held records.

### 2026-10-29: Bukhari 2355–2362 source review

- `FR-LIB-HAD-BUKHARI-406` saves one private French draft for Bukhari 2355. Bukhari 2356–2359 and 2361–2362 directly quote Quran 3:77 or 4:65; their full French reports remain blank and Needs Mo until an approved, attributed French Quran translation is confirmed.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,137 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 128. Total local hadith rows not drafted: 12,492, including held records.

### 2026-10-29: Bukhari 2363–2368 source review

- `FR-LIB-HAD-BUKHARI-407` saves six private French drafts for Bukhari 2363–2368, including the animal-care, eclipse-prayer, and Zamzam accounts.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,143 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 128. Total local hadith rows not drafted: 12,486, including held records.

### 2026-10-29: Bukhari 2369–2374 source review

- `FR-LIB-HAD-BUKHARI-408` saves five private French drafts for Bukhari 2369–2370 and 2372–2374. Bukhari 2371 directly quotes Quran 99:6–7; its full French report remains blank and Needs Mo until an approved, attributed French Quran translation is confirmed.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,148 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 129. Total local hadith rows not drafted: 12,481, including held records.

### 2026-10-29: Bukhari 2375–2380 source review

- `FR-LIB-HAD-BUKHARI-409` saves six private French drafts for Bukhari 2375–2380, covering the account of ‘Alî’s camels, the Bahrain allocations, camel milking at the watering place, palm fruit and property sold with an enslaved person, and ‘arâyâ sales.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,154 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 129. Total local hadith rows not drafted: 12,475, including held records.

### 2026-10-29: Bukhari 2381–2387 source review

- `FR-LIB-HAD-BUKHARI-410` saves six private French drafts for Bukhari 2381–2383 and 2385–2387. They cover land and harvest sales, the ‘arâyâ exception, Jâbir’s camel sale, a deferred food purchase secured by armor, and the intent behind borrowing people’s property.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,160 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 129. Total local hadith rows not drafted: 12,469, including held records.

### 2026-10-29: Bukhari 2388–2393 source review

- `FR-LIB-HAD-BUKHARI-411` saves six private French drafts for Bukhari 2388–2393, covering wealth and charity, repayment of debts, fair treatment of people in financial difficulty, and repaying borrowed livestock.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,166 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 129. Total local hadith rows not drafted: 12,463, including held records.

### 2026-10-29: Bukhari 2394–2399 source review

- `FR-LIB-HAD-BUKHARI-412` saves five private French drafts for Bukhari 2394–2398. Bukhari 2399 directly quotes Quran 33:6; its full French report remains blank and Needs Mo until an approved, attributed French Quran translation is confirmed.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,171 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 130. Total local hadith rows not drafted: 12,458, including held records.

### 2026-10-29: Bukhari 2400–2405 source review

- `FR-LIB-HAD-BUKHARI-413` saves six private French drafts for Bukhari 2400–2405, covering debt repayment, insolvency, a deferred emancipation, and Jâbir’s account of settling his father’s debt and later selling a camel to the Prophet.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,177 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 130. Total local hadith rows not drafted: 12,452, including held records.

### 2026-10-29: Bukhari 2407–2412 source review

- `FR-LIB-HAD-BUKHARI-414` saves six private French drafts for Bukhari 2407–2412, covering the no-deception condition in sales, prohibited conduct, responsibility, recitation differences, and accounts about the prophets Moses and Muhammad.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,183 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 130. Total local hadith rows not drafted: 12,446, including held records.

### 2026-10-29: Bukhari 2413–2419 source review

- `FR-LIB-HAD-BUKHARI-415` saves five private French drafts for Bukhari 2413–2415 and 2418–2419. Bukhari 2416 directly quotes Quran 3:77; its full French report remains blank and Needs Mo until an approved, attributed French Quran translation is confirmed.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,188 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 131. Total local hadith rows not drafted: 12,441, including held records.

### 2026-10-29: Bukhari 2420–2425 source review

- `FR-LIB-HAD-BUKHARI-416` saves five private French drafts for Bukhari 2420–2424. Bukhari 2425 directly quotes Quran 19:77–80; its full French report remains blank and Needs Mo until an approved, attributed French Quran translation is confirmed.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,193 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 132. Total local hadith rows not drafted: 12,436, including held records.

### 2026-10-29: Bukhari 2426–2431 source review

- `FR-LIB-HAD-BUKHARI-417` saves six private French drafts for Bukhari 2426–2431, covering found property, lost livestock, a loan sent by sea, and a date found on the road.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,199 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 132. Total local hadith rows not drafted: 12,430, including held records.

### 2026-10-29: Bukhari 2432–2437 source review

- `FR-LIB-HAD-BUKHARI-418` saves six private French drafts for Bukhari 2432–2437, covering found dates, the sacred precinct of Mecca, permission to milk others’ livestock, and announcements for lost property.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,205 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 132. Total local hadith rows not drafted: 12,424, including held records.

### 2026-10-29: Bukhari 2437b–2442 source review

- `FR-LIB-HAD-BUKHARI-419` saves five private French drafts for Bukhari 2437b–2440 and 2442. Bukhari 2441 directly quotes Quran 11:18; its full French report remains blank and Needs Mo until an approved, attributed French Quran translation is confirmed.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,210 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 133. Total local hadith rows not drafted: 12,419, including held records.

### 2026-10-29: Bukhari 2443–2448 source review

- `FR-LIB-HAD-BUKHARI-420` saves six private French drafts for Bukhari 2443–2448, covering how to support others, community duties, mutual support, injustice, and the prayer of an oppressed person.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,216 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 133. Total local hadith rows not drafted: 12,413, including held records.

### 2026-10-29: Bukhari 2449–2454 source review

- `FR-LIB-HAD-BUKHARI-421` saves five private French drafts for Bukhari 2449 and 2451–2454. Bukhari 2450 directly quotes Quran 4:128; its full French report remains blank and Needs Mo until an approved, attributed French Quran translation is confirmed.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,221 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 134. Total local hadith rows not drafted: 12,408, including held records.

### 2026-10-29: Bukhari 2455–2460 source review

- `FR-LIB-HAD-BUKHARI-422` saves six private French drafts for Bukhari 2455–2460, covering sharing dates, inviting a guest, contentious disputes, fair judgments, traits of hypocrisy, and providing for one’s family from household funds.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,227 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 134. Total local hadith rows not drafted: 12,402, including held records.

### 2026-10-29: Bukhari 2461–2466 source review

- `FR-LIB-HAD-BUKHARI-423` saves five private French drafts for Bukhari 2461–2463 and 2465–2466. Bukhari 2464 directly quotes Quran 5:93; its full French report remains blank and Needs Mo until an approved, attributed French Quran translation is confirmed.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,232 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 135. Total local hadith rows not drafted: 12,397, including held records.

### 2026-10-29: Bukhari 2467 source review

- `FR-LIB-HAD-BUKHARI-424` saves one private French draft for Bukhari 2467, comparing the spread of future trials among homes to the way raindrops fall.
- The single-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,233 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 135. Total local hadith rows not drafted: 12,396, including held records.

### 2026-10-29: Bukhari 2468 long-source review

- `FR-LIB-HAD-BUKHARI-425` records Bukhari 2468 as a single-source hold. The 6,452-character report directly quotes Quran 66:4 and 33:28–29, so its entire French text remains blank pending an approved, attributed French Quran translation.
- The one-record source batch passed the focused validator for Arabic hashes, IDs, rights metadata and private unpublished state. No French draft, database write or publication was created. Bukhari local drafts remain 2,233 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 136. Total local hadith rows not drafted: 12,396, including held records.

### 2026-10-29: Bukhari 2469–2474 source review

- `FR-LIB-HAD-BUKHARI-426` saves six private French drafts for Bukhari 2469–2474, covering the Prophet’s month-long vow, Jâbir’s camel, road cleanliness and widths, and the prohibition on looting and mutilation.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,239 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 136. Total local hadith rows not drafted: 12,390, including held records.

### 2026-10-29: Bukhari 2475–2480 source review

- `FR-LIB-HAD-BUKHARI-427` saves five private French drafts for Bukhari 2475–2477 and 2479–2480. Bukhari 2478 directly quotes Quran 17:81; its full French report remains blank and Needs Mo until an approved, attributed French Quran translation is confirmed.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,244 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 137. Total local hadith rows not drafted: 12,385, including held records.

### 2026-10-29: Bukhari 2481–2486 source review

- `FR-LIB-HAD-BUKHARI-428` saves six private French drafts for Bukhari 2481–2486, covering a broken serving dish, Jurayj, food on an expedition, shared provisions, and the Ash‘arites’ mutual support.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,250 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 137. Total local hadith rows not drafted: 12,379, including held records.

### 2026-10-29: Bukhari 2487–2492 source review

- `FR-LIB-HAD-BUKHARI-429` saves six private French drafts for Bukhari 2487–2492, covering joint ownership and charity, emergency slaughter, etiquette for sharing dates, and partial emancipation.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,256 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 137. Total local hadith rows not drafted: 12,373, including held records.

### 2026-10-29: Bukhari 2493–2499 source review

- `FR-LIB-HAD-BUKHARI-430` saves five private French drafts for Bukhari 2493 and 2495–2497 and 2499. Bukhari 2494 directly quotes Quran 4:3 and 4:127; its full French report remains blank and Needs Mo until an approved, attributed French Quran translation is confirmed.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,261 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 138. Total local hadith rows not drafted: 12,368, including held records.

### 2026-10-29: Bukhari 2500–2507 source review

- `FR-LIB-HAD-BUKHARI-431` saves six private French drafts for Bukhari 2500–2501 and 2503–2505 and 2507, covering sacrifice, blessed trade, shared emancipation, pilgrimage, and emergency slaughter.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,267 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 138. Total local hadith rows not drafted: 12,362, including held records.

### 2026-10-29: Bukhari 2508–2513 source review

- `FR-LIB-HAD-BUKHARI-432` saves six private French drafts for Bukhari 2508–2513, covering the Prophet’s pledge of armor, a report about Ka‘b ibn al-Ashraf, and the costs associated with pledged livestock.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,273 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 138. Total local hadith rows not drafted: 12,356, including held records.

### 2026-10-29: Bukhari 2514–2520 source review

- `FR-LIB-HAD-BUKHARI-433` saves five private French drafts for Bukhari 2514 and 2517–2520. Bukhari 2515 directly quotes Quran 3:77; its full French report remains blank and Needs Mo until an approved, attributed French Quran translation is confirmed.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,278 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 139. Total local hadith rows not drafted: 12,351, including held records.

### 2026-10-29: Bukhari 2521–2526 source review

- `FR-LIB-HAD-BUKHARI-434` saves six private French drafts for Bukhari 2521–2526, including several reports on the partial emancipation of people held in shared ownership. The final source is a brief, incomplete excerpt and is translated as such.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,284 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 139. Total local hadith rows not drafted: 12,345, including held records.

### 2026-10-29: Bukhari 2527–2532 source review

- `FR-LIB-HAD-BUKHARI-435` saves six private French drafts for Bukhari 2527–2532, covering shared emancipation, inner thoughts and intentions, and Abû Hurayra’s account of arriving in Medina with his servant.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,290 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 139. Total local hadith rows not drafted: 12,339, including held records.

### 2026-10-29: Bukhari 2533–2538 source review

- `FR-LIB-HAD-BUKHARI-436` saves six private French drafts for Bukhari 2533–2538, covering disputed parentage, emancipation, clientage, ransom, and good works done before entering Islam.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,296 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 139. Total local hadith rows not drafted: 12,333, including held records.

### 2026-10-29: Bukhari 2539–2545 source review

- `FR-LIB-HAD-BUKHARI-437` saves six private French drafts for Bukhari 2539 and 2541–2545, covering the Hawazin delegation, Banu al-Mustaliq, charity, emancipation, and fair treatment of servants.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,302 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 139. Total local hadith rows not drafted: 12,327, including held records.

### 2026-10-29: Bukhari 2546–2551 source review

- `FR-LIB-HAD-BUKHARI-438` saves six private French drafts for Bukhari 2546–2551, preserving the repeated reports about servants’ conduct, worship, and double reward.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,308 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 139. Total local hadith rows not drafted: 12,321, including held records.

### 2026-10-29: Bukhari 2552–2558 source review

- `FR-LIB-HAD-BUKHARI-439` saves six private French drafts for Bukhari 2552–2555 and 2557–2558, covering respectful forms of address, emancipation, responsibility, and sharing food with a household servant.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,314 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 139. Total local hadith rows not drafted: 12,315, including held records.

### 2026-10-29: Bukhari 2559–2564 source review

- `FR-LIB-HAD-BUKHARI-440` saves six private French drafts for Bukhari 2559–2564, covering the prohibition on striking the face and several reports about Barira’s emancipation contract and the associated clientage right.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,320 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 139. Total local hadith rows not drafted: 12,309, including held records.

### 2026-10-29: Bukhari 2565–2570 source review

- `FR-LIB-HAD-BUKHARI-441` saves six private French drafts for Bukhari 2565–2570, covering Barira’s emancipation, gifts between neighbors, the Prophet’s household, a carpenter’s pulpit, and Abû Qatâda’s hunting account during pilgrimage travel.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,326 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 139. Total local hadith rows not drafted: 12,303, including held records.

### 2026-10-29: Bukhari 2571–2576 source review

- `FR-LIB-HAD-BUKHARI-442` saves six private French drafts for Bukhari 2571–2576, covering serving a drink from the right, hunting a rabbit and gifts offered during pilgrimage, household gifts, and charity versus gifts.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,332 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 139. Total local hadith rows not drafted: 12,297, including held records.

### 2026-10-29: Bukhari 2577–2580 source review

- `FR-LIB-HAD-BUKHARI-443` saves four private French drafts for Bukhari 2577–2580, covering charity received by Barira, her emancipation, and the timing of gifts to the Prophet.
- The four-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,336 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 139. Total local hadith rows not drafted: 12,293, including held records.

### 2026-10-29: Bukhari 2581 long-source review

- `FR-LIB-HAD-BUKHARI-444` saves one full private French draft for Bukhari 2581, covering reports on the timing of gifts and the exchange among the Prophet’s wives. The source is over 2,000 characters and remains a single-record batch.
- The single-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata, private unpublished state and long-source handling. No database writes or publication occurred. Bukhari local drafts: 2,337 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 139. Total local hadith rows not drafted: 12,292, including held records.

### 2026-10-29: Bukhari 2582–2588 source review

- `FR-LIB-HAD-BUKHARI-445` saves six private French drafts for Bukhari 2582–2583 and 2585–2588, covering perfume, the Hawazin delegation, gifts, fairness among children, and the Prophet’s illness.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,343 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 139. Total local hadith rows not drafted: 12,286, including held records.

### 2026-10-29: Bukhari 2589–2594 source review

- `FR-LIB-HAD-BUKHARI-446` saves six private French drafts for Bukhari 2589–2594, covering the retraction of gifts, charitable spending, emancipation, and the sharing of time among the Prophet’s wives.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,349 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 139. Total local hadith rows not drafted: 12,280, including held records.

### 2026-10-29: Bukhari 2595–2600 source review

- `FR-LIB-HAD-BUKHARI-447` saves six private French drafts for Bukhari 2595–2600, covering neighborly gifts, gifts during pilgrimage, public trust, promised payments, clothing gifts, and expiation for intercourse during Ramadan.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,355 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 139. Total local hadith rows not drafted: 12,274, including held records.

### 2026-10-29: Bukhari 2601–2606 source review

- `FR-LIB-HAD-BUKHARI-448` saves six private French drafts for Bukhari 2601–2606, covering repayment of a deceased person’s debt, sharing a drink, repayment with an increase, and fair debt settlement.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,361 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 139. Total local hadith rows not drafted: 12,268, including held records.

### 2026-10-29: Bukhari 2607 and 2609–2613 source review

- `FR-LIB-HAD-BUKHARI-449` saves six private French drafts for Bukhari 2607 and 2609–2613, covering the return of Hawazin captives, fair repayment, a gifted camel, a clothing gift, and a household curtain. The source export contained no Bukhari 2608 record.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,367 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 139. Total local hadith rows not drafted: 12,262, including held records.

### 2026-10-29: Bukhari 2614–2615 and 2617–2620 source review

- `FR-LIB-HAD-BUKHARI-450` saves six private French drafts for Bukhari 2614–2615 and 2617–2620, covering gifted clothing, a poisoned sheep, shared food, clothing gifts, and kindness to a non-Muslim parent. The source export contained no Bukhari 2616 record.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,373 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 139. Total local hadith rows not drafted: 12,256, including held records.

### 2026-10-29: Bukhari 2621–2626 source review

- `FR-LIB-HAD-BUKHARI-451` saves six private French drafts for Bukhari 2621–2626, covering the retraction of gifts and charitable donations, a property claim, and lifetime usufruct gifts.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,379 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 139. Total local hadith rows not drafted: 12,250, including held records.

### 2026-10-29: Bukhari 2627–2632 source review

- `FR-LIB-HAD-BUKHARI-452` saves six private French drafts for Bukhari 2627–2632, covering borrowed property, lending clothing, gifts of livestock and fruit, good deeds, and land use.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,385 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 139. Total local hadith rows not drafted: 12,244, including held records.

### 2026-10-29: Bukhari 2633–2638 source review

- `FR-LIB-HAD-BUKHARI-453` saves six private French drafts for Bukhari 2633–2638, covering charitable care, land use, Hajar, donated property, the accusation against Aisha, and Ibn Sayyad.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,391 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 139. Total local hadith rows not drafted: 12,238, including held records.

### 2026-10-29: Bukhari 2639–2644 source review

- `FR-LIB-HAD-BUKHARI-454` saves six private French drafts for Bukhari 2639–2644, covering divorce, a report of milk kinship, judgment by outward conduct, and testimony at funerals.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,397 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 139. Total local hadith rows not drafted: 12,232, including held records.

### 2026-10-29: Bukhari 2645–2650 source review

- `FR-LIB-HAD-BUKHARI-455` saves six private French drafts for Bukhari 2645–2650, covering milk kinship, a theft report, legal testimony, and equal treatment of children in gifts.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,403 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 139. Total local hadith rows not drafted: 12,226, including held records.

### 2026-10-29: Bukhari 2651–2656 source review

- `FR-LIB-HAD-BUKHARI-456` saves six private French drafts for Bukhari 2651–2656, covering testimony, major sins, Quran recitation, and the pre-dawn call to prayer.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,409 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 139. Total local hadith rows not drafted: 12,220, including held records.

### 2026-10-29: Bukhari 2657–2660 source review

- `FR-LIB-HAD-BUKHARI-457` saves four private French drafts for Bukhari 2657–2660, covering a reserved garment and two reports on milk kinship.
- The four-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,413 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 139. Total local hadith rows not drafted: 12,216, including held records.

### 2026-10-29: Bukhari 2661 source review

- `FR-LIB-HAD-BUKHARI-458` holds Bukhari 2661 blank because the long report directly quotes Quran 12:18, 24:11 and 24:22. It remains a private Needs Mo item until an approved, attributed French Quran translation is confirmed.
- The single-record batch passed the focused validator for its Arabic hash, ID, reference, rights metadata, private unpublished hold and long-source handling. No database writes or publication occurred. Bukhari local drafts: 2,413 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 140. Total local hadith rows not drafted: 12,217, including held records.

### 2026-10-29: Bukhari 2662–2666 and 2668 source review

- `FR-LIB-HAD-BUKHARI-459` saves five private French drafts for Bukhari 2662–2665 and 2668. Bukhari 2666 remains blank on hold because it directly quotes Quran 3:77; it needs an approved, attributed French Quran translation. The source export contained no Bukhari 2667 record.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata, private unpublished state and the Quran-quote hold. No database writes or publication occurred. Bukhari local drafts: 2,418 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 141. Total local hadith rows not drafted: 12,213, including held records.

### 2026-10-29: Bukhari 2669 and 2671–2675 source review

- `FR-LIB-HAD-BUKHARI-460` saves four private French drafts for Bukhari 2671–2674. Bukhari 2669 and 2675 remain blank on hold because each directly quotes Quran 3:77; both need an approved, attributed French Quran translation. The source export contained no Bukhari 2670 record.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata, private unpublished state and the Quran-quote holds. No database writes or publication occurred. Bukhari local drafts: 2,422 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 143. Total local hadith rows not drafted: 12,211, including held records.

### 2026-10-29: Bukhari 2676 and 2678–2682 source review

- `FR-LIB-HAD-BUKHARI-461` saves five private French drafts for Bukhari 2678–2682. Bukhari 2676 remains blank on hold because it directly quotes Quran 3:77; it needs an approved, attributed French Quran translation. The source export contained no Bukhari 2677 record.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata, private unpublished state and the Quran-quote hold. No database writes or publication occurred. Bukhari local drafts: 2,427 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 144. Total local hadith rows not drafted: 12,207, including held records.

### 2026-10-29: Bukhari 2683–2688 source review

- `FR-LIB-HAD-BUKHARI-462` saves six private French drafts for Bukhari 2683–2688, covering a promised payment, the term completed by Moses, questions to the People of the Book, collective responsibility, testimony about the deceased, and the sharing of time among the Prophet’s wives.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,428 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 143. Total local hadith rows not drafted: 12,205, including held records.

### 2026-10-29: Bukhari 2689–2694 source review

- `FR-LIB-HAD-BUKHARI-463` saves four private French drafts for Bukhari 2689–2690 and 2692–2693. Bukhari 2691 and 2694 remain blank on hold because they directly quote Quran 49:9 and 4:128; both need an approved, attributed French Quran translation.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata, private unpublished state and the Quran-quote holds. No database writes or publication occurred. Bukhari local drafts: 2,432 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 145. Total local hadith rows not drafted: 12,203, including held records.

### 2026-10-29: Bukhari 2695 and 2697–2701 source review

- `FR-LIB-HAD-BUKHARI-464` saves six private French drafts for Bukhari 2695 and 2697–2701, covering a legal judgment, rejected religious innovations, the Hudaybiyya agreement and the custody of Hamza’s daughter. The source export contained no Bukhari 2696 record.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,438 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 145. Total local hadith rows not drafted: 12,197, including held records.

### 2026-10-29: Bukhari 2702–2707 source review

- `FR-LIB-HAD-BUKHARI-465` saves six private French drafts for Bukhari 2702–2707, covering a dispute at Khaybar, legal redress, Hasan and Mu‘awiya’s peace agreement, debt settlement and charity.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,444 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 145. Total local hadith rows not drafted: 12,191, including held records.

### 2026-10-29: Bukhari 2708–2711 and 2713–2714 source review

- `FR-LIB-HAD-BUKHARI-466` saves three private French drafts for Bukhari 2709–2710 and 2714. Bukhari 2708, 2711 and 2713 remain blank on hold because they directly quote Quran 4:65 and 60:10–12; each needs an approved, attributed French Quran translation. The source export contained no Bukhari 2712 record.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata, private unpublished state and the Quran-quote holds. No database writes or publication occurred. Bukhari local drafts: 2,447 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 148. Total local hadith rows not drafted: 12,197, including held records.

### 2026-10-29: Bukhari 2715–2717 source review

- `FR-LIB-HAD-BUKHARI-467` saves three private French drafts for Bukhari 2715–2717, covering the pledge to worship and counsel sincerely, the sale of pollinated date palms, and Barira’s emancipation contract.
- The three-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,450 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 148. Total local hadith rows not drafted: 12,194, including held records.

### 2026-10-29: Bukhari 2718 long-source review

- `FR-LIB-HAD-BUKHARI-468` saves one full private French draft for Bukhari 2718, including the report’s alternate narrations of the sale price and the condition to ride the camel.
- The single-record long-source batch passed the focused validator for Arabic hash, ID, reference, rights metadata, private unpublished state and long-text handling. No database writes or publication occurred. Bukhari local drafts: 2,451 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 148. Total local hadith rows not drafted: 12,193, including held records.

### 2026-10-29: Bukhari 2719–2724 source review

- `FR-LIB-HAD-BUKHARI-469` saves six private French drafts for Bukhari 2719–2724, covering shared cultivation, the Khaybar land agreement, marriage conditions, land rental, market conduct and a legal judgment.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,457 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 148. Total local hadith rows not drafted: 12,187, including held records.

### 2026-10-29: Bukhari 2726–2730 source review

- `FR-LIB-HAD-BUKHARI-470` saves four private French drafts for Bukhari 2726–2727 and 2729–2730. Bukhari 2728 remains blank on hold because it directly quotes Quran 18:72–74; it needs an approved, attributed French Quran translation.
- The five-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata, private unpublished state and the Quran-quote hold. No database writes or publication occurred. Bukhari local drafts: 2,461 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 149. Total local hadith rows not drafted: 12,184, including held records.

### 2026-10-29: Bukhari 2731 long-source review

- `FR-LIB-HAD-BUKHARI-471` holds Bukhari 2731 blank because the long report directly quotes Quran 60:10, 48:24 and 48:1. It remains a private Needs Mo item until an approved, attributed French Quran translation is confirmed.
- The single-record batch passed the focused validator for its Arabic hash, ID, reference, rights metadata, private unpublished hold and long-source handling. No database writes or publication occurred. Bukhari local drafts: 2,461 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 150. Total local hadith rows not drafted: 12,185, including held records.

### 2026-10-29: Bukhari 2733–2738 source review

- `FR-LIB-HAD-BUKHARI-472` saves five private French drafts for Bukhari 2734–2738. Bukhari 2733 remains blank on hold because it directly quotes Quran 60:11; it needs an approved, attributed French Quran translation.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata, private unpublished state and the Quran-quote hold. No database writes or publication occurred. Bukhari local drafts: 2,466 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 151. Total local hadith rows not drafted: 12,181, including held records.

### 2026-10-29: Bukhari 2739–2744 source review

- `FR-LIB-HAD-BUKHARI-473` saves six private French drafts for Bukhari 2739–2744, covering the Prophet’s estate, wills, charity, and limits on bequests.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,472 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 151. Total local hadith rows not drafted: 12,175, including held records.

### 2026-10-29: Bukhari 2745–2750 source review

- `FR-LIB-HAD-BUKHARI-474` saves five private French drafts for Bukhari 2745–2746 and 2748–2750. Bukhari 2747 remains blank on hold because it directly quotes Quran 4:11; it needs an approved, attributed French Quran translation.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata, private unpublished state and the Quran-quote hold. No database writes or publication occurred. Bukhari local drafts: 2,477 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 152. Total local hadith rows not drafted: 12,171, including held records.

### 2026-10-29: Bukhari 2751–2756 source review

- `FR-LIB-HAD-BUKHARI-475` saves four private French drafts for Bukhari 2751 and 2754–2756. Bukhari 2752 and 2753 remain blank on hold because they directly quote Quran 26:214; both need an approved, attributed French Quran translation.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata, private unpublished state and the Quran-quote holds. No database writes or publication occurred. Bukhari local drafts: 2,481 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 154. Total local hadith rows not drafted: 12,169, including held records.

### 2026-10-29: Bukhari 2757–2762 source review

- `FR-LIB-HAD-BUKHARI-476` saves five private French drafts for Bukhari 2757 and 2759–2762. Bukhari 2758 remains blank on hold because it directly quotes Quran 3:92; it needs an approved, attributed French Quran translation.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata, private unpublished state and the Quran-quote hold. No database writes or publication occurred. Bukhari local drafts: 2,486 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 155. Total local hadith rows not drafted: 12,166, including held records.

### 2026-10-29: Bukhari 2763–2768 source review

- `FR-LIB-HAD-BUKHARI-477` saves three private French drafts for Bukhari 2764, 2766 and 2768. Bukhari 2763, 2765 and 2767 remain blank on hold because they directly quote Quran 4:3, 4:127, 4:6 and 2:220; they need approved, attributed French Quran translations.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata, private unpublished state and the Quran-quote holds. No database writes or publication occurred. Bukhari local drafts: 2,489 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 158. Total local hadith rows not drafted: 12,166, including held records.

### 2026-10-29: Bukhari 2769–2774 source review

- `FR-LIB-HAD-BUKHARI-478` saves five private French drafts for Bukhari 2770–2774. Bukhari 2769 remains blank on hold because it directly quotes Quran 3:92; it needs an approved, attributed French Quran translation.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata, private unpublished state and the Quran-quote hold. No database writes or publication occurred. Bukhari local drafts: 2,494 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 159. Total local hadith rows not drafted: 12,162, including held records.

### 2026-10-29: Bukhari 2775–2780 source review

- `FR-LIB-HAD-BUKHARI-479` saves five private French drafts for Bukhari 2775–2779. Bukhari 2780 remains blank on hold because it directly quotes Quran 5:106; it needs an approved, attributed French Quran translation.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata, private unpublished state and the Quran-quote hold. No database writes or publication occurred. Bukhari local drafts: 2,499 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 160. Total local hadith rows not drafted: 12,158, including held records.

### 2026-10-29: Bukhari 2781–2786 source review

- `FR-LIB-HAD-BUKHARI-480` saves six private French drafts for Bukhari 2781–2786, covering debt repayment, prayer and kindness to parents, pilgrimage, and good works.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,505 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 160. Total local hadith rows not drafted: 12,152, including held records.

### 2026-10-29: Bukhari 2787–2793 source review

- `FR-LIB-HAD-BUKHARI-481` saves six private French drafts for Bukhari 2787–2788 and 2790–2793, covering worship, sea expeditions, martyrs and the reward of service in Allah’s cause. The source export contained no Bukhari 2789 record.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,511 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 160. Total local hadith rows not drafted: 12,146, including held records.

### 2026-10-29: Bukhari 2794–2799 source review

- `FR-LIB-HAD-BUKHARI-482` saves six private French drafts for Bukhari 2794–2799, covering service in Allah’s cause, martyrdom, naval expeditions and their leaders.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,517 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 160. Total local hadith rows not drafted: 12,140, including held records.

### 2026-10-29: Bukhari 2801–2805 and 2807 source review

- `FR-LIB-HAD-BUKHARI-483` saves three private French drafts for Bukhari 2802–2804. Bukhari 2801 remains blank because it preserves a Quranic recitation said to have been abrogated; 2805 and 2807 remain blank because they directly quote Quran 33:23. All three need approved, attributed French Quran wording. The source export contained no Bukhari 2806 record.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata, private unpublished state and the Quran-quote holds. No database writes or publication occurred. Bukhari local drafts: 2,514 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 163. Total local hadith rows not drafted: 12,143, including held records.

### 2026-10-29: Bukhari 2808–2813 source review

- `FR-LIB-HAD-BUKHARI-484` saves six private French drafts for Bukhari 2808–2813, covering a convert’s martyrdom, the Firdaws, intentions in combat, and events at the Battle of the Trench.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,520 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 163. Total local hadith rows not drafted: 12,137, including held records.

### 2026-10-29: Bukhari 2814–2819 source review

- `FR-LIB-HAD-BUKHARI-485` saves five private French drafts for Bukhari 2815–2819. Bukhari 2814 remains blank because it preserves a Quranic recitation said to have been abrogated; it needs approved, attributed French Quran wording.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata, private unpublished state and the Quranic-recitation hold. No database writes or publication occurred. Bukhari local drafts: 2,525 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 164. Total local hadith rows not drafted: 12,133, including held records.

### 2026-10-29: Bukhari 2820–2825 source review

- `FR-LIB-HAD-BUKHARI-486` saves six private French drafts for Bukhari 2820–2825, covering generosity, prayers for protection, the Battle of Uhud and migration after the conquest of Mecca.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,531 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 164. Total local hadith rows not drafted: 12,131, including held records.

### 2026-10-29: Bukhari 2826–2831 source review

- `FR-LIB-HAD-BUKHARI-487` saves five private French drafts for Bukhari 2826–2830. Bukhari 2831 quotes Quran 4:95, so the full report remains blank pending an approved, attributed French Quran translation.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata, private unpublished state and the Quran quotation hold. No database writes or publication occurred. Bukhari local drafts: 2,547 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 165. Total local hadith rows not drafted: 12,108, including held records.

### 2026-10-29: Bukhari 2832–2837 source review

- `FR-LIB-HAD-BUKHARI-488` saves five private French drafts for Bukhari 2833–2837. Bukhari 2832 quotes Quran 4:95, so the full report remains blank pending an approved, attributed French Quran translation.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata, private unpublished state and the Quran quotation hold. No database writes or publication occurred. Bukhari local drafts: 2,552 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 166. Total local hadith rows not drafted: 12,103, including held records.

### 2026-10-29: Bukhari 2838–2843 source review

- `FR-LIB-HAD-BUKHARI-489` saves six private French drafts covering the return from Tabûk, those prevented from joining an expedition, fasting in Allah’s path, spending, wealth and equipping a traveler. One longer source was deferred for separate review.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,558 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 166. Total local hadith rows not drafted: 12,097, including held records.

### 2026-10-29: Bukhari 2844–2849 source review

- `FR-LIB-HAD-BUKHARI-490` saves six private French drafts, including the report of Thâbit ibn Qays at Yamâma, al-Zubayr’s role at the Trench, prayer leadership and horses.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,564 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 166. Total local hadith rows not drafted: 12,091, including held records.

### 2026-10-29: Bukhari 2850–2855 source review

- `FR-LIB-HAD-BUKHARI-491` saves six private French drafts about horses, setting aside a horse for service, hunting while in pilgrimage consecration, and the Prophet’s mount.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,570 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 166. Total local hadith rows not drafted: 12,085, including held records.

### 2026-10-29: Bukhari 2856–2861 source review

- `FR-LIB-HAD-BUKHARI-492` saves five private French drafts on worship and accountability, the horse Mandûb, reports about bad omens, and Jâbir’s camel. Bukhari 2860 quotes Quran 99:7–8, so its full French translation remains blank pending an approved, attributed Quran translation.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata, private unpublished state and the Quran quotation hold. No database writes or publication occurred. Bukhari local drafts: 2,575 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 167. Total local hadith rows not drafted: 12,080, including held records.

### 2026-10-29: Bukhari 2862–2867 source review

- `FR-LIB-HAD-BUKHARI-493` saves five private French drafts covering two reports about the horse Mandûb, the battle of Hunayn, entering consecration and a mount at Medina. Bukhari 2863 includes Quran 16:8, so its full report remains blank pending an approved, attributed French Quran translation.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata, private unpublished state and the Quran quotation hold. No database writes or publication occurred. Bukhari local drafts: 2,580 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 168. Total local hadith rows not drafted: 12,075, including held records.

### 2026-10-29: Bukhari 2868–2873 source review

- `FR-LIB-HAD-BUKHARI-494` saves six private French drafts about horse races, al-‘Adbâ’, and the property the Prophet left for charity.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,586 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 168. Total local hadith rows not drafted: 12,069, including held records.

### 2026-10-29: Bukhari 2874–2880 source review

- `FR-LIB-HAD-BUKHARI-495` saves six private French drafts covering Hunayn, pilgrimage, a sea expedition, the Prophet’s travel practice with his wives and water provision at Uhud. One long source remains deferred for separate review.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,592 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 168. Total local hadith rows not drafted: 12,063, including held records.

### 2026-10-29: Bukhari 2881–2886 source review

- `FR-LIB-HAD-BUKHARI-496` saves six private French drafts about Umm Sulayt’s service at Uhud, women’s support of the injured, Abû ‘Âmir’s injury, Sa‘d’s night watch and attachment to wealth.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,598 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 168. Total local hadith rows not drafted: 12,057, including held records.

### 2026-10-29: Bukhari 2887–2892 source review

- `FR-LIB-HAD-BUKHARI-497` saves six private French drafts about humble service, Uhud, Medina’s protected area, fasting during travel, everyday charity and guard duty.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,604 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 168. Total local hadith rows not drafted: 12,051, including held records.

### 2026-10-29: Bukhari 2893–2899 source review

- `FR-LIB-HAD-BUKHARI-498` saves six private French drafts about the journey to Khaybar, Umm Harâm, the value of the vulnerable, later generations, a battle report and archery.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,610 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 168. Total local hadith rows not drafted: 12,045, including held records.

### 2026-10-29: Bukhari 2900–2905 source review

- `FR-LIB-HAD-BUKHARI-499` saves six private French drafts about archery at Badr, the Abyssinians, Uhud, the Banû al-Nadîr property and Sa‘d’s archery.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,616 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 168. Total local hadith rows not drafted: 12,039, including held records.

### 2026-10-29: Bukhari 2906–2912 source review

- `FR-LIB-HAD-BUKHARI-500` saves six private French drafts about the Eid visit, protecting Medina, the attack on the Prophet during a rest, injuries at Uhud and property given to charity.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,622 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 168. Total local hadith rows not drafted: 12,033, including held records.

### 2026-10-29: Bukhari 2913–2918 source review

- `FR-LIB-HAD-BUKHARI-501` saves five private French drafts about the sword incident, the hunting report, a pledged coat of armor, generosity and ablution. Bukhari 2915 quotes Quran 54:45–46, so its full report remains blank pending an approved, attributed French Quran translation.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata, private unpublished state and the Quran quotation hold. No database writes or publication occurred. Bukhari local drafts: 2,627 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 169. Total local hadith rows not drafted: 12,028, including held records.

### 2026-10-29: Bukhari 2919–2924 source review

- `FR-LIB-HAD-BUKHARI-502` saves six private French drafts about silk dispensation, prayer after eating, and early sea expeditions.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,633 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 169. Total local hadith rows not drafted: 12,022, including held records.

### 2026-10-29: Bukhari 2925–2930 source review

- `FR-LIB-HAD-BUKHARI-503` saves six private French drafts covering end-times reports and al-Barâ’s account of Hunayn. The reports remain attributed to their narrators and translated closely to the Arabic wording.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,639 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 169. Total local hadith rows not drafted: 12,016, including held records.

### 2026-10-29: Bukhari 2931–2936 source review

- `FR-LIB-HAD-BUKHARI-504` saves six private French drafts about prayer during the Coalisés, supplications, the incident at the Ka‘ba, a response to a hostile greeting and the letter to César.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,645 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 169. Total local hadith rows not drafted: 12,010, including held records.

### 2026-10-29: Bukhari 2937–2939 source review

- `FR-LIB-HAD-BUKHARI-505` saves three private French drafts: a prayer for the Daws, the Prophet’s seal, and his letter to Kisrâ. The exporter found only three eligible records in this batch.
- All three records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,648 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 169. Total local hadith rows not drafted: 12,007, including held records.

### 2026-10-29: Bukhari 2940 long-source review

- `FR-LIB-HAD-BUKHARI-506` records the 6,735-character report of the letter to Heraclius as a single-item review. The report directly quotes Quran 3:64, so its entire French translation remains blank pending an approved, attributed French Quran translation.
- The record passed the focused validator for its Arabic hash, ID, reference, rights metadata, private unpublished state, Quran hold and single-item long-source rule. No database writes or publication occurred. Bukhari local drafts: 2,648 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 170. Total local hadith rows not drafted: 12,007, including held records.

### 2026-10-29: Bukhari 2942–2947 source review

- `FR-LIB-HAD-BUKHARI-507` saves four private French drafts about Khaybar, the call to prayer before an attack, a legal maxim, and concealing an expedition’s destination. Bukhari 2944 remains blank because the exported Arabic is only a fragment. Bukhari 2945 remains blank because it quotes Quran 37:177.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata, private unpublished state and both holds. No database writes or publication occurred. Bukhari local drafts: 2,652 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 171. Total local hadith rows not drafted: 12,003, including held records.

### 2026-10-29: Bukhari 2948–2953 source review

- `FR-LIB-HAD-BUKHARI-508` saves six private French drafts about preparing for Tabûk, the usual travel day, prayers on the road, the Hajj journey and fasting in Ramadan while travelling.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,658 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 171. Total local hadith rows not drafted: 11,997, including held records.

### 2026-10-29: Bukhari 2954–2960 source review

- `FR-LIB-HAD-BUKHARI-509` saves six private French drafts about a corrected order, obedience, leadership, the pledge under the tree and the events of al-Harra.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,664 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 171. Total local hadith rows not drafted: 11,991, including held records.

### 2026-10-29: Bukhari 2961–2968 source review

- `FR-LIB-HAD-BUKHARI-510` saves six private French drafts about the pledge at the Trench, migration and service, advice to a commander’s men, Jâbir’s camel, and the horse Mandûb. The long Jâbir report was translated in full.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,670 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 171. Total local hadith rows not drafted: 11,985, including held records.

### 2026-10-29: Bukhari 2969–2974 source review

- `FR-LIB-HAD-BUKHARI-511` saves six private French drafts on the horse Mandûb, the rule against taking back an alms, joining an expedition, a dispute over an injured tooth, and Qays ibn Sa‘d.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,676 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 171. Total local hadith rows not drafted: 11,979, including held records.

### 2026-10-29: Bukhari 2975–2980 source review

- `FR-LIB-HAD-BUKHARI-512` saves six private French drafts about ‘Alî’s banner at Khaybar, the Prophet’s concise speech, a letter to Héraclius, Asmâ’s travel provisions and sacrificial meat.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,682 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 171. Total local hadith rows not drafted: 11,973, including held records.

### 2026-10-29: Bukhari 2981–2986 source review

- `FR-LIB-HAD-BUKHARI-513` saves six private French drafts about travel food, shared provisions, a sea creature cast ashore, and ‘Â’isha’s additional ‘umra.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,688 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 171. Total local hadith rows not drafted: 11,967, including held records.

### 2026-10-29: Bukhari 2987–2992 source review

- `FR-LIB-HAD-BUKHARI-514` saves five private French drafts about travel, the Conquest of Mecca, everyday charity, carrying the Quran and prayer during a journey. Bukhari 2991 quotes Quran 37:177, so its full translation remains blank pending an approved, attributed French Quran translation.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata, private unpublished state and the Quran quotation hold. No database writes or publication occurred. Bukhari local drafts: 2,693 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 172. Total local hadith rows not drafted: 11,962, including held records.

### 2026-10-29: Bukhari 2993–2998 source review

- `FR-LIB-HAD-BUKHARI-515` saves six private French drafts about travel invocations, the Prophet’s return supplication, preserving a person’s usual good deeds during illness or travel, al-Zubayr and solo night travel.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,699 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 172. Total local hadith rows not drafted: 11,956, including held records.

### 2026-10-29: Bukhari 2999–3004 source review

- `FR-LIB-HAD-BUKHARI-516` saves six private French drafts about the pace of travel, combining prayers, the travel hardship, a donated horse, and serving one’s parents.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,705 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 172. Total local hadith rows not drafted: 11,950, including held records.

### 2026-10-29: Bukhari 3005–3010 source review

- `FR-LIB-HAD-BUKHARI-517` saves six private French drafts about travel amulets, pilgrimage travel, Hâtib’s letter, a returned favor to Ibn Ubayy, the banner at Khaybar and captives entering Paradise.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,711 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 172. Total local hadith rows not drafted: 11,944, including held records.

### 2026-10-29: Bukhari 3011–3016 source review

- `FR-LIB-HAD-BUKHARI-518` saves six private French drafts about education and manumission, night raids, protected grazing, and the prohibition on killing women and children.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,717 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 172. Total local hadith rows not drafted: 11,938, including held records.

### 2026-10-29: Bukhari 3017–3022 source review

- `FR-LIB-HAD-BUKHARI-519` saves six private French drafts on not using fire as punishment, the Ukl incident, Dhû al-Khalasa, the Banû al-Nadîr palms and the account of Abû Râfi‘. The long Abû Râfi‘ report was translated in full.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,723 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 172. Total local hadith rows not drafted: 11,932, including held records.

### 2026-10-29: Bukhari 3023–3030 source review

- `FR-LIB-HAD-BUKHARI-520` saves six private French drafts about Abû Râfi‘, avoiding a desired battle, the fall of Persian and Byzantine empires, and strategy in warfare. The long counsel report was translated in full.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,729 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 172. Total local hadith rows not drafted: 11,926, including held records.

### 2026-10-29: Bukhari 3031–3037 source review

- `FR-LIB-HAD-BUKHARI-521` saves six private French drafts about Ka‘b ibn al-Ashraf, Ibn Sayyâd, the trench, Jarîr and the treatment of the Prophet’s wound.
- The six-record batch passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,735 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 172. Total local hadith rows not drafted: 11,920, including held records.

### 2026-10-29: Bukhari 3038 source review

- `FR-LIB-HAD-BUKHARI-522` saves one private French draft on the Prophet’s guidance to Mu‘âdh and Abû Mûsâ before their mission to Yemen. The exporter found one eligible record.
- The record passed the focused validator for its Arabic hash, ID, reference, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,736 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 172. Total local hadith rows not drafted: 11,919, including held records.

### 2026-10-29: Bukhari 3039 long-source review

- `FR-LIB-HAD-BUKHARI-523` saves the complete 2,426-character Bukhari 3039 report about Uhud, the archers’ post, and the calls exchanged after the battle. The exporter found one eligible record, and it passed the single-item long-source validator.
- No database writes or publication occurred. Bukhari local drafts: 2,737 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 172. Total local hadith rows not drafted: 11,918, including held records.

### 2026-10-29: Bukhari 3040–3044 source review

- `FR-LIB-HAD-BUKHARI-524` saves five private French drafts about the horse at Medina, the stolen milk camels, Hunayn, the judgment on Banû Qurayza and Ibn Khatal. The full report about recovering the camels was translated in full.
- All five records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,742 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 172. Total local hadith rows not drafted: 11,915, including held records.

### 2026-10-29: Bukhari 3045 long-source review

- `FR-LIB-HAD-BUKHARI-525` saves the complete 3,630-character Bukhari 3045 report about the reconnaissance group, Khubayb’s captivity and execution, and ‘Âsim’s protected body. The exporter found one eligible record, and it passed the single-item long-source validator.
- No database writes or publication occurred. Bukhari local drafts: 2,743 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 172. Total local hadith rows not drafted: 11,914, including held records.

### 2026-10-29: Bukhari 3046–3051

- `FR-LIB-HAD-BUKHARI-526` saves six private French drafts about freeing captives, ‘Alî’s written rulings, ‘Abbâs’s ransom, and an incident during a journey. The hadith mentioning recitation of Sûrat al-Tûr contains no Quranic wording to translate.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,749 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 172. Total local hadith rows not drafted: 11,908, including held records.

### 2026-10-29: Bukhari 3052–3058

- `FR-LIB-HAD-BUKHARI-527` saves six private French drafts, including the combined 3056–3057 report, about protection of non-Muslim allies, the Prophet’s final recommendations, Ibn Sayyâd, and the lodging place during pilgrimage.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,755 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 172. Total local hadith rows not drafted: 11,902, including held records.

### 2026-10-29: Bukhari 3059–3064

- `FR-LIB-HAD-BUKHARI-528` saves five private French drafts on the protected pasture, the Muslim census, pilgrimage, and battles. Bukhari 3064 remains entirely blank because it quotes a Quranic passage said to have been recited and later abrogated; no approved attributed French Quran translation is available.
- All six records passed the focused validator, including the Quran-quote hold. No database writes or publication occurred. Bukhari local drafts: 2,760 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 173. Total local hadith rows not drafted: 11,897, including held records.

### 2026-10-29: Bukhari 3065–3070

- `FR-LIB-HAD-BUKHARI-529` saves six private French drafts about post-battle stays, ‘umra, the return of property, and Jâbir’s meal for the people at the Trench.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,766 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 173. Total local hadith rows not drafted: 11,891, including held records.

### 2026-10-29: Bukhari 3071–3076

- `FR-LIB-HAD-BUKHARI-530` saves six private French drafts about Umm Khâlid’s garment, the charity date, misappropriation of spoils, slaughtering animals, and Dhû al-Khalasa.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,772 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 173. Total local hadith rows not drafted: 11,885, including held records.

### 2026-10-29: Bukhari 3077–3083

- `FR-LIB-HAD-BUKHARI-531` saves five private French drafts about the end of migration after the conquest of Mecca and welcoming returning travelers. Bukhari 3081 remains entirely blank because it quotes Quran 41:40; an approved attributed French Quran translation is not available.
- All six records passed the focused validator, including the Quran-quote hold. No database writes or publication occurred. Bukhari local drafts: 2,777 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 174. Total local hadith rows not drafted: 11,880, including held records.

### 2026-10-29: Bukhari 3084–3089

- `FR-LIB-HAD-BUKHARI-532` saves six private French drafts about return supplications, two travelers’ fall on the road, prayer on return, and a meal after arrival.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,783 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 174. Total local hadith rows not drafted: 11,874, including held records.

### 2026-10-29: Bukhari 3090

- `FR-LIB-HAD-BUKHARI-533` saves the private French draft of Bukhari 3090, with the report and its note identifying Sarrâr as a place near Medina.
- The record passed the focused single-item validator for Arabic hashes, ID, reference, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,784 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 174. Total local hadith rows not drafted: 11,873, including held records.

### 2026-10-29: Bukhari 3091 long-source review

- `FR-LIB-HAD-BUKHARI-534` saves the complete 2,338-character report about ‘Alî’s two camels, their slaughter by Hamza, and the Prophet’s response. The exporter found one eligible record, and it passed the single-item long-source validator.
- No database writes or publication occurred. Bukhari local drafts: 2,785 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 174. Total local hadith rows not drafted: 11,871, including held records.

### 2026-10-29: Bukhari 3092–3093

- `FR-LIB-HAD-BUKHARI-535` saves the complete combined 1,662-character report about Fâtima’s request concerning the Prophet’s estate and the subsequent administration of those properties. The exporter found one eligible record, and it passed the single-item long-source validator.
- No database writes or publication occurred. Bukhari local drafts: 2,786 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 174. Total local hadith rows not drafted: 11,869, including held records.

### 2026-10-29: Bukhari 3094 Quran-quote hold

- `FR-LIB-HAD-BUKHARI-536` records the 4,780-character Bukhari 3094 report with its full French translation blank because it quotes Quran 59:6. The exporter found one eligible record, and it passed the single-item long-source validator in held state.
- No database writes or publication occurred. Bukhari local drafts: 2,786 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 175. Total local hadith rows not drafted: 11,869, including held records.

### 2026-10-29: Bukhari 3095–3100

- `FR-LIB-HAD-BUKHARI-537` saves six private French drafts about the ‘Abd al-Qays delegation, the Prophet’s estate, and his final illness.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,792 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 175. Total local hadith rows not drafted: 11,863, including held records.

### 2026-10-29: Bukhari 3101–3106

- `FR-LIB-HAD-BUKHARI-538` saves six private French drafts about Safiyya’s visit during retreat, the Prophet’s homes, and his seal.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,798 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 175. Total local hadith rows not drafted: 11,857, including held records.

### 2026-10-29: Bukhari 3107–3112

- `FR-LIB-HAD-BUKHARI-539` saves six private French drafts about the Prophet’s sandals, garments, drinking cup and sword, and the administration of his charitable property.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,804 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 175. Total local hadith rows not drafted: 11,851, including held records.

### 2026-10-29: Bukhari 3113–3118

- `FR-LIB-HAD-BUKHARI-540` saves six private French drafts about Fâtima and ‘Alî’s household, children’s names, the Prophet’s role in distributing funds, and misuse of public property.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,810 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 175. Total local hadith rows not drafted: 11,845, including held records.

### 2026-10-29: Bukhari 3119–3124

- `FR-LIB-HAD-BUKHARI-541` saves six private French drafts about horses, the fall of the Persian and Roman empires, and a prophet’s expedition and distribution of spoils.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,816 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 175. Total local hadith rows not drafted: 11,839, including held records.

### 2026-10-29: Bukhari 3125–3128

- `FR-LIB-HAD-BUKHARI-542` saves four private French drafts about the distribution of conquered land, intention in battle, garments set aside for a companion, and the return of donated palm trees.
- All four records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,820 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 175. Total local hadith rows not drafted: 11,835, including held records.

### 2026-10-29: Bukhari 3129 long-source review

- `FR-LIB-HAD-BUKHARI-543` saves the complete 4,405-character report about al-Zubayr’s debts, estate, and the repayment process. The exporter found one eligible record, and it passed the single-item long-source validator.
- No database writes or publication occurred. Bukhari local drafts: 2,821 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 175. Total local hadith rows not drafted: 11,834, including held records.

### 2026-10-29: Bukhari 3130–3136

- `FR-LIB-HAD-BUKHARI-544` saves six private French drafts, including the combined 3131–3132 account of the Hawâzin delegation and the release of its captives.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,827 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 175. Total local hadith rows not drafted: 11,828, including held records.

### 2026-10-29: Bukhari 3137–3142

- `FR-LIB-HAD-BUKHARI-545` saves six private French drafts about Jâbir’s promised gift, the distribution at al-Ji‘râna, prisoners from Badr, and the spoils at Hunayn.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,833 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 175. Total local hadith rows not drafted: 11,822, including held records.

### 2026-10-29: Bukhari 3143–3148

- `FR-LIB-HAD-BUKHARI-546` saves six private French drafts about accepting wealth without greed, freeing captives, and the distribution after Hunayn.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,839 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 175. Total local hadith rows not drafted: 11,816, including held records.

### 2026-10-29: Bukhari 3149–3154

- `FR-LIB-HAD-BUKHARI-547` saves six private French drafts about gifts, allocations at Hunayn, a land grant, and food found during expeditions.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,845 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 175. Total local hadith rows not drafted: 11,810, including held records.

### 2026-10-29: Bukhari 3155–3158

- `FR-LIB-HAD-BUKHARI-548` saves three private French drafts about food during the siege of Khaybar, the jizya on Magians, and the wealth brought from Bahrain.
- All three records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,848 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 175. Total local hadith rows not drafted: 11,807, including held records.

### 2026-10-29: Bukhari 3159–3160 long-source review

- `FR-LIB-HAD-BUKHARI-549` saves the complete 2,354-character combined report about al-Hurmuzân’s campaign advice and al-Mughîra’s address before battle. The exporter found one eligible record, and it passed the single-item long-source validator.
- No database writes or publication occurred. Bukhari local drafts: 2,849 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 175. Total local hadith rows not drafted: 11,806, including held records.

### 2026-10-29: Bukhari 3161–3167

- `FR-LIB-HAD-BUKHARI-550` saves six private French drafts, including the combined 3164–3165 report about the Bahrain revenues and al-‘Abbâs’s ransom.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,855 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 175. Total local hadith rows not drafted: 11,789, including held records.

### 2026-10-29: Bukhari 3168–3173

- `FR-LIB-HAD-BUKHARI-551` saves six private French drafts about the Thursday document, the poisoned sheep at Khaybar, prayer after the killing of treaty allies, and a killing inquiry at Khaybar.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,861 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 175. Total local hadith rows not drafted: 11,794, including held records.

### 2026-10-29: Bukhari 3174–3179

- `FR-LIB-HAD-BUKHARI-552` saves five private French drafts about the Prophet’s final illness, a poisoned sheep at Khaybar, a treaty violation, the pilgrimage announcement, and the Medina charter. Bukhari 3174 remains blank because the exported Arabic stops at the opening clause about Heraclius summoning Abû Sufyân and contains no further report wording.
- All six records passed the focused validator, including the incomplete-source hold. No database writes or publication occurred. Bukhari local drafts: 2,866 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 176. Total local hadith rows not drafted: 11,789, including held records.

### 2026-10-29: Bukhari 3180–3185

- `FR-LIB-HAD-BUKHARI-553` saves six private French drafts about treaty protection, the truce at al-Hudaybiya, the permission granted to Asmâ’s mother, and the attack on the Prophet at prayer.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,872 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 176. Total local hadith rows not drafted: 11,783, including held records.

### 2026-10-29: Bukhari 3186–3192

- `FR-LIB-HAD-BUKHARI-554` saves six private French drafts about treachery, the sanctity of Mecca, and reports on creation.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,878 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 176. Total local hadith rows not drafted: 11,777, including held records.

### 2026-10-29: Bukhari 3193–3198

- `FR-LIB-HAD-BUKHARI-555` saves six private French drafts about resurrection, divine mercy, and disputes over land.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,884 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 176. Total local hadith rows not drafted: 11,771, including held records.

### 2026-10-29: Bukhari 3199–3204

- `FR-LIB-HAD-BUKHARI-556` saves five private French drafts about the sun and moon. Bukhari 3199 remains entirely blank because it directly quotes Quran 36:38; an approved attributed French Quran translation is unavailable.
- All six records passed the focused validator, including the Quran-quote hold. No database writes or publication occurred. Bukhari local drafts: 2,889 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 177. Total local hadith rows not drafted: 11,766, including held records.

### 2026-10-29: Bukhari 3205–3206

- `FR-LIB-HAD-BUKHARI-557` saves the private French draft of Bukhari 3205. Bukhari 3206 remains entirely blank because it directly quotes Quran 46:24; an approved attributed French Quran translation is unavailable.
- Both records passed the focused validator, including the Quran-quote hold. No database writes or publication occurred. Bukhari local drafts: 2,890 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 178. Total local hadith rows not drafted: 11,765, including held records.

### 2026-10-29: Bukhari 3207 long-source review

- `FR-LIB-HAD-BUKHARI-558` saves the complete 4,422-character report of the Night Journey, the encounters in the heavens, and the reduction of the daily prayers. The exporter found one eligible record, and it passed the single-item long-source validator.
- No database writes or publication occurred. Bukhari local drafts: 2,891 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 178. Total local hadith rows not drafted: 11,764, including held records.

### 2026-10-29: Bukhari 3208–3213

- `FR-LIB-HAD-BUKHARI-559` saves six private French drafts about the creation of the human being, angels, and Hassân’s poetry.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,897 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 178. Total local hadith rows not drafted: 11,758, including held records.

### 2026-10-29: Bukhari 3214–3219

- `FR-LIB-HAD-BUKHARI-560` saves five private French drafts about the angels and revelation. Bukhari 3218 remains entirely blank because it directly quotes Quran 19:64; an approved attributed French Quran translation is unavailable.
- All six records passed the focused validator, including the Quran-quote hold. No database writes or publication occurred. Bukhari local drafts: 2,902 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 179. Total local hadith rows not drafted: 11,753, including held records.

### 2026-10-29: Bukhari 3220–3225

- `FR-LIB-HAD-BUKHARI-561` saves six private French drafts about Ramadan generosity, prayer times, faith, angels, and images in the home.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,908 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 179. Total local hadith rows not drafted: 11,747, including held records.

### 2026-10-29: Bukhari 3226–3231

- `FR-LIB-HAD-BUKHARI-562` saves five private French drafts about angels, prayer, and the Prophet’s visit to at-Ta’if. Bukhari 3230 remains entirely blank because it directly quotes Quran 43:77; an approved attributed French Quran translation is unavailable.
- All six records passed the focused validator, including the Quran-quote hold. No database writes or publication occurred. Bukhari local drafts: 2,913 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 180. Total local hadith rows not drafted: 11,742, including held records.

### 2026-10-29: Bukhari 3232–3237

- `FR-LIB-HAD-BUKHARI-563` saves three private French drafts about seeing Jibrîl and the angels. Bukhari 3232, 3233 and 3235 remain entirely blank because each directly quotes Quranic wording; an approved attributed French Quran translation is unavailable.
- All six records passed the focused validator, including the three Quran-quote holds. No database writes or publication occurred. Bukhari local drafts: 2,916 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 183. Total local hadith rows not drafted: 11,739, including held records.

### 2026-10-29: Bukhari 3238–3243

- `FR-LIB-HAD-BUKHARI-564` saves five private French drafts about the Night Journey and descriptions of the afterlife. Bukhari 3238 remains entirely blank because it directly quotes Quran 74:1–5; an approved attributed French Quran translation is unavailable.
- All six records passed the focused validator, including the Quran-quote hold. No database writes or publication occurred. Bukhari local drafts: 2,921 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 184. Total local hadith rows not drafted: 11,734, including held records.

### 2026-10-29: Bukhari 3244–3249

- `FR-LIB-HAD-BUKHARI-565` saves five private French drafts describing Paradise. Bukhari 3244 remains entirely blank because it directly quotes Quran 32:17; an approved attributed French Quran translation is unavailable.
- All six records passed the focused validator, including the Quran-quote hold. No database writes or publication occurred. Bukhari local drafts: 2,926 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 185. Total local hadith rows not drafted: 11,729, including held records.

### 2026-10-29: Bukhari 3250–3256

- `FR-LIB-HAD-BUKHARI-566` saves five private French drafts about Paradise. The combined Bukhari 3252–3253 report remains entirely blank because it directly quotes Quran 56:30; an approved attributed French Quran translation is unavailable.
- All six records passed the focused validator, including the Quran-quote hold. No database writes or publication occurred. Bukhari local drafts: 2,931 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 186. Total local hadith rows not drafted: 11,724, including held records.

### 2026-10-29: Bukhari 3257–3262

- `FR-LIB-HAD-BUKHARI-567` saves six private French drafts about the gates of Paradise, prayer in hot weather, and fever.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,937 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 186. Total local hadith rows not drafted: 11,718, including held records.

### 2026-10-29: Bukhari 3263–3268

- `FR-LIB-HAD-BUKHARI-568` saves five private French drafts about fever, the Fire, and the account of the Prophet’s illness. Bukhari 3266 remains entirely blank because it directly quotes Quran 43:77; an approved attributed French Quran translation is unavailable.
- All six records passed the focused validator, including the Quran-quote hold. No database writes or publication occurred. Bukhari local drafts: 2,942 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 187. Total local hadith rows not drafted: 11,713, including held records.

### 2026-10-29: Bukhari 3269–3275

- `FR-LIB-HAD-BUKHARI-569` saves six private French drafts about sleep, prayer, and protection from Satan. The report mentioning the Verse of the Throne does not reproduce Quran wording.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,948 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 187. Total local hadith rows not drafted: 11,707, including held records.

### 2026-10-29: Bukhari 3276–3281

- `FR-LIB-HAD-BUKHARI-570` saves five private French drafts about Satan and household practices. Bukhari 3278 remains entirely blank because it directly quotes Quran 18:62–63; an approved attributed French Quran translation is unavailable.
- All six records passed the focused validator, including the Quran-quote hold. No database writes or publication occurred. Bukhari local drafts: 2,953 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 188. Total local hadith rows not drafted: 11,702, including held records.

### 2026-10-29: Bukhari 3282–3287

- `FR-LIB-HAD-BUKHARI-571` saves six private French drafts about seeking refuge from Satan and related prayer guidance.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,959 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 188. Total local hadith rows not drafted: 11,696, including held records.

### 2026-10-29: Bukhari 3288–3293

- `FR-LIB-HAD-BUKHARI-572` saves six private French drafts about devils, dreams, and remembrance of Allah.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,965 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 188. Total local hadith rows not drafted: 11,690, including held records.

### 2026-10-29: Bukhari 3294–3300

- `FR-LIB-HAD-BUKHARI-573` saves five private French drafts about anger, the call to prayer, and animals. Bukhari 3299 remains entirely blank because the export contains only an incomplete chain fragment, without the report text.
- All six records passed the focused validator, including the incomplete-source hold. No database writes or publication occurred. Bukhari local drafts: 2,970 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 189. Total local hadith rows not drafted: 11,685, including held records.

### 2026-10-29: Bukhari 3301–3306

- `FR-LIB-HAD-BUKHARI-574` saves five private French drafts about faith, animals, and household practices. Bukhari 3305 remains entirely blank because its exported Arabic ends mid-sentence and omits the rest of the report.
- All six records passed the focused validator, including the incomplete-source hold. No database writes or publication occurred. Bukhari local drafts: 2,975 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 190. Total local hadith rows not drafted: 11,680, including held records.

### 2026-10-29: Bukhari 3307–3314

- `FR-LIB-HAD-BUKHARI-575` saves six private French drafts about geckos, snakes, and other animals.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,981 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 190. Total local hadith rows not drafted: 11,674, including held records.

### 2026-10-29: Bukhari 3315–3320

- `FR-LIB-HAD-BUKHARI-576` saves five private French drafts about animals. Bukhari 3317 remains entirely blank because it directly quotes Quran 77:1; an approved attributed French Quran translation is unavailable.
- All six records passed the focused validator, including the Quran-quote hold. No database writes or publication occurred. Bukhari local drafts: 2,986 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 191. Total local hadith rows not drafted: 11,669, including held records.

### 2026-10-29: Bukhari 3321–3326

- `FR-LIB-HAD-BUKHARI-577` saves six private French drafts about animals, angels, and Adam’s creation.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,992 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 191. Total local hadith rows not drafted: 11,663, including held records.

### 2026-10-29: Bukhari 3327–3332

- `FR-LIB-HAD-BUKHARI-578` saves six private French drafts about human creation, family, and faith.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 2,998 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 191. Total local hadith rows not drafted: 11,657, including held records.

### 2026-10-29: Bukhari 3333–3338

- `FR-LIB-HAD-BUKHARI-579` saves six private French drafts about human development, souls, and the Dajjâl.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,004 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 191. Total local hadith rows not drafted: 11,651, including held records.

### 2026-10-29: Bukhari 3339–3341

- `FR-LIB-HAD-BUKHARI-580` contains no French drafts. Bukhari 3339 and 3341 remain blank because they directly quote Quran 2:143 and 54:15. Bukhari 3340 remains blank because the Arabic source explicitly says the narrator did not retain the rest of the report.
- All three records passed the focused validator with their holds. No database writes or publication occurred. Bukhari local drafts: 3,004 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 194. Total local hadith rows not drafted: 11,651, including held records.

### 2026-10-29: Bukhari 3342 long-source review

- `FR-LIB-HAD-BUKHARI-581` contains the long report about the Night Journey and the reduction of the prayers. It remains entirely blank because it includes Quran 50:29 wording; an approved attributed French Quran translation is unavailable.
- The record passed the focused single-item long-source validator with its Quran-quote hold. No database writes or publication occurred. Bukhari local drafts: 3,004 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 195. Total local hadith rows not drafted: 11,651, including held records.

### 2026-10-29: Bukhari 3343–3348

- `FR-LIB-HAD-BUKHARI-582` saves four private French drafts about the winds, distribution of charity, and Ya’jûj and Ma’jûj. Bukhari 3345 and 3348 remain entirely blank because they directly quote Quran 54:15 and 22:2; an approved attributed French Quran translation is unavailable.
- All six records passed the focused validator, including the two Quran-quote holds. No database writes or publication occurred. Bukhari local drafts: 3,008 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 197. Total local hadith rows not drafted: 11,647, including held records.

### 2026-10-29: Bukhari 3349–3354

- `FR-LIB-HAD-BUKHARI-583` saves four private French drafts about Abraham and Ya’jûj and Ma’jûj. Bukhari 3349 and 3350 remain entirely blank because they directly quote Quranic wording; an approved attributed French Quran translation is unavailable.
- All six records passed the focused validator, including the Quran-quote holds. No database writes or publication occurred. Bukhari local drafts: 3,012 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 199. Total local hadith rows not drafted: 11,643, including held records.

### 2026-10-29: Bukhari 3355–3360

- `FR-LIB-HAD-BUKHARI-584` saves four private French drafts about Abraham and the gecko. Bukhari 3358 and 3360 remain entirely blank because they directly quote Quranic wording; an approved attributed French Quran translation is unavailable.
- All six records passed the focused validator, including the Quran-quote holds. No database writes or publication occurred. Bukhari local drafts: 3,016 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 201. Total local hadith rows not drafted: 11,639, including held records.

### 2026-10-29: Bukhari 3361–3363

- `FR-LIB-HAD-BUKHARI-585` saves two private French drafts about intercession and the story of Hajar and Zamzam.
- Both records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,018 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 201. Total local hadith rows not drafted: 11,637, including held records.

### 2026-10-29: Bukhari 3364 long-source review

- `FR-LIB-HAD-BUKHARI-586` contains the long report about Hajar, Zamzam, and the Kaaba. It remains entirely blank because it directly quotes Quran 2:126; an approved attributed French Quran translation is unavailable.
- The record passed the focused single-item long-source validator with its Quran-quote hold. No database writes or publication occurred. Bukhari local drafts: 3,018 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 202. Total local hadith rows not drafted: 11,637, including held records.

### 2026-10-29: Bukhari 3365 long-source review

- `FR-LIB-HAD-BUKHARI-587` contains the long report about Hajar, Zamzam, and the building of the Kaaba. It remains entirely blank because it directly quotes Quran 2:126; an approved attributed French Quran translation is unavailable.
- The record passed the focused single-item long-source validator with its Quran-quote hold. No database writes or publication occurred. Bukhari local drafts: 3,018 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 203. Total local hadith rows not drafted: 11,637, including held records.

### 2026-10-29: Bukhari 3366–3371

- `FR-LIB-HAD-BUKHARI-588` saves six private French drafts about the sacred mosques, the Kaaba, and prayers for the Prophet.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,024 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 203. Total local hadith rows not drafted: 11,631, including held records.

### 2026-10-29: Bukhari 3372–3377

- `FR-LIB-HAD-BUKHARI-589` saves three private French drafts about Ismâ‘îl and the Arab lineages. Bukhari 3372, 3375 and 3376 remain entirely blank because they directly quote or reproduce Quranic wording; an approved attributed French Quran translation is unavailable.
- All six records passed the focused validator, including the three Quran-quote holds. No database writes or publication occurred. Bukhari local drafts: 3,027 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 206. Total local hadith rows not drafted: 11,628, including held records.

### 2026-10-29: Bukhari 3378–3383

- `FR-LIB-HAD-BUKHARI-590` saves six private French drafts about al-Hijr, the territory of Thamûd, and the lineages of Abraham and Joseph.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,033 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 206. Total local hadith rows not drafted: 11,622, including held records.

### 2026-10-29: Bukhari 3384–3389

- `FR-LIB-HAD-BUKHARI-591` saves three private French drafts about prayer leadership and supplication. Bukhari 3387, 3388 and 3389 remain entirely blank because they directly quote Quranic wording; an approved attributed French Quran translation is unavailable.
- All six records passed the focused validator, including the three Quran-quote holds. No database writes or publication occurred. Bukhari local drafts: 3,036 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 209. Total local hadith rows not drafted: 11,619, including held records.

### 2026-10-29: Bukhari 3390–3396

- `FR-LIB-HAD-BUKHARI-592` saves six private French drafts about Job, Waraqa ibn Nawfal, and the Night Journey.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,042 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 209. Total local hadith rows not drafted: 11,613, including held records.

### 2026-10-29: Bukhari 3397–3400

- `FR-LIB-HAD-BUKHARI-593` saves three private French drafts about ‘Âshûrâ’ and the prophets. Bukhari 3400 remains entirely blank because it reproduces Quran 18:63–64 wording from the Moses and al-Khidr story; an approved attributed French Quran translation is unavailable.
- All four records passed the focused validator, including the Quran-quote hold. No database writes or publication occurred. Bukhari local drafts: 3,045 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 210. Total local hadith rows not drafted: 11,610, including held records.

### 2026-10-29: Bukhari 3401 long-source review

- `FR-LIB-HAD-BUKHARI-594` contains the long account of Moses and al-Khidr. It remains entirely blank because it directly quotes Quran 18:79–82; an approved attributed French Quran translation is unavailable.
- The record passed the focused single-item long-source validator with its Quran-quote hold. No database writes or publication occurred. Bukhari local drafts: 3,045 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 211. Total local hadith rows not drafted: 11,610, including held records.

### 2026-10-29: Bukhari 3402–3407

- `FR-LIB-HAD-BUKHARI-595` saves four private French drafts about al-Khidr, Mûsâ, and shepherding. Bukhari 3403 and 3404 remain entirely blank because they directly quote Quran 2:58 and 33:69; an approved attributed French Quran translation is unavailable.
- All six records passed the focused validator, including the two Quran-quote holds. No database writes or publication occurred. Bukhari local drafts: 3,049 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 213. Total local hadith rows not drafted: 11,606, including held records.

### 2026-10-29: Bukhari 3408–3413

- `FR-LIB-HAD-BUKHARI-596` saves six private French drafts about Mûsâ, Âsiya, and Yûnus.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,055 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 213. Total local hadith rows not drafted: 11,600, including held records.

### 2026-10-29: Bukhari 3414–3420

- `FR-LIB-HAD-BUKHARI-597` saves six private French drafts about Yûnus, David, and balanced fasting and prayer.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,061 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 213. Total local hadith rows not drafted: 11,594, including held records.

### 2026-10-29: Bukhari 3421–3427

- `FR-LIB-HAD-BUKHARI-598` saves four private French drafts about prostration, prayer, and Solomon. Bukhari 3421 and 3423 remain entirely blank because they directly quote Quran 6:84/6:90 and 38:35; an approved attributed French Quran translation is unavailable.
- All six records passed the focused validator, including the two Quran-quote holds. No database writes or publication occurred. Bukhari local drafts: 3,065 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 215. Total local hadith rows not drafted: 11,592, including held records.

### 2026-10-29: Bukhari 3428–3433

- `FR-LIB-HAD-BUKHARI-599` saves three private French drafts about the Night Journey and Maryam, Khadîja, and Âsiya. Bukhari 3428, 3429, and 3431 remain entirely blank because they directly quote Quran 6:82/31:13 and 3:36; an approved attributed French Quran translation is unavailable.
- All six records passed the focused validator, including the three Quran-quote holds. No database writes or publication occurred. Bukhari local drafts: 3,068 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 218. Total local hadith rows not drafted: 11,589, including held records.

### 2026-10-29: Bukhari 3434–3440

- `FR-LIB-HAD-BUKHARI-600` saves five private French drafts about Maryam, the Night Journey, and the Dajjâl. Bukhari 3435 remains entirely blank because it directly quotes Quran 4:171; an approved attributed French Quran translation is unavailable.
- All six records passed the focused validator, including the Quran-quote hold. No database writes or publication occurred. Bukhari local drafts: 3,073 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 219. Total local hadith rows not drafted: 11,584, including held records.

### 2026-10-29: Bukhari 3441–3446

- `FR-LIB-HAD-BUKHARI-601` saves six private French drafts about Jesus, the Dajjâl, and the prophets.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,079 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 219. Total local hadith rows not drafted: 11,578, including held records.

### 2026-10-29: Bukhari 3447–3455

- `FR-LIB-HAD-BUKHARI-602` saves four private French drafts about Jesus’ descent, the Dajjâl, and earlier communities. Bukhari 3447 and 3448 remain entirely blank because they directly quote Quran 21:104/5:117–118 and 4:159; an approved attributed French Quran translation is unavailable.
- All six records passed the focused validator, including the two Quran-quote holds. No database writes or publication occurred. Bukhari local drafts: 3,083 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 221. Total local hadith rows not drafted: 11,574, including held records.

### 2026-10-29: Bukhari 3456–3461

- `FR-LIB-HAD-BUKHARI-603` saves six private French drafts about earlier communities, prayer, and transmitting knowledge.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,089 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 221. Total local hadith rows not drafted: 11,568, including held records.

### 2026-10-29: Bukhari 3462–3463

- `FR-LIB-HAD-BUKHARI-604` saves two private French drafts about hair dye and a man who took his own life.
- Both records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,091 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 221. Total local hadith rows not drafted: 11,566, including held records.

### 2026-10-29: Bukhari 3464 long report

- `FR-LIB-HAD-BUKHARI-605` saves one private French draft with the full account of the three men tested through their health and wealth.
- The long-source record passed the focused single-item validator for Arabic hashes, ID, reference, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,092 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 221. Total local hadith rows not drafted: 11,565, including held records.

### 2026-10-29: Bukhari 3465 long report

- `FR-LIB-HAD-BUKHARI-606` saves one private French draft with the full account of the three men trapped by a rock and their sincere deeds.
- The long-source record passed the focused single-item validator for Arabic hashes, ID, reference, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,093 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 221. Total local hadith rows not drafted: 11,564, including held records.

### 2026-10-29: Bukhari 3466–3471

- `FR-LIB-HAD-BUKHARI-607` saves six private French drafts about signs among earlier communities and repentance.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,099 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 221. Total local hadith rows not drafted: 11,558, including held records.

### 2026-10-29: Bukhari 3472–3477

- `FR-LIB-HAD-BUKHARI-608` saves six private French drafts about honesty, plague, fairness, and earlier prophets.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,105 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 221. Total local hadith rows not drafted: 11,552, including held records.

### 2026-10-29: Bukhari 3478–3483

- `FR-LIB-HAD-BUKHARI-609` saves six private French drafts about repentance, generosity, and kindness to animals.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,111 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 221. Total local hadith rows not drafted: 11,546, including held records.

### 2026-10-29: Bukhari 3484–3490

- `FR-LIB-HAD-BUKHARI-610` saves five private French drafts about the end of prophethood, humility, and religious practice. Bukhari 3489 remains entirely blank because it directly quotes Quran 49:13; an approved attributed French Quran translation is unavailable.
- All six records passed the focused validator, including the Quran-quote hold. No database writes or publication occurred. Bukhari local drafts: 3,116 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 222. Total local hadith rows not drafted: 11,541, including held records.

### 2026-10-29: Bukhari 3491–3498

- `FR-LIB-HAD-BUKHARI-611` saves four private French drafts about the Prophet’s lineage and character. Bukhari 3497 remains blank because it directly quotes Quran 42:23. Bukhari 3498 remains blank because the exact meaning of الفدادين is not confirmed.
- All six records passed the focused validator, including both holds. No database writes or publication occurred. Bukhari local drafts: 3,120 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 224. Total local hadith rows not drafted: 11,537, including held records.

### 2026-10-29: Bukhari 3499–3504

- `FR-LIB-HAD-BUKHARI-612` saves five private French drafts about Quraysh and the Prophet’s lineage. Bukhari 3499 remains blank because the exact meaning of الفدادين is not confirmed; it shares the unresolved term held in 3498.
- All six records passed the focused validator, including the source-wording hold. No database writes or publication occurred. Bukhari local drafts: 3,125 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 225. Total local hadith rows not drafted: 11,532, including held records.

### 2026-10-29: Bukhari 3505–3510

- `FR-LIB-HAD-BUKHARI-613` saves six private French drafts about ‘Â’isha, the Qur’an’s codification, and the ‘Abd al-Qays delegation.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,131 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 225. Total local hadith rows not drafted: 11,526, including held records.

### 2026-10-29: Bukhari 3511–3516

- `FR-LIB-HAD-BUKHARI-614` saves six private French drafts about the eastern trials and several Arab tribes.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,137 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 225. Total local hadith rows not drafted: 11,520, including held records.

### 2026-10-29: Bukhari 3517–3521

- `FR-LIB-HAD-BUKHARI-615` saves five private French drafts about Qahtân, tribal partisanship, and pre-Islamic practices.
- All five records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,142 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 225. Total local hadith rows not drafted: 11,515, including held records.

### 2026-10-29: Bukhari 3522 long report

- `FR-LIB-HAD-BUKHARI-616` saves one private French draft with the full account of Abû Dharr’s conversion.
- The long-source record passed the focused single-item validator for Arabic hashes, ID, reference, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,143 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 225. Total local hadith rows not drafted: 11,514, including held records.

### 2026-10-29: Bukhari 3523–3528

- `FR-LIB-HAD-BUKHARI-617` saves three private French drafts about tribal affiliation and responsibility. Bukhari 3524, 3525, and 3526 remain entirely blank because they directly quote Quran 6:140 and 26:214; an approved attributed French Quran translation is unavailable.
- All six records passed the focused validator, including the three Quran-quote holds. No database writes or publication occurred. Bukhari local drafts: 3,146 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 228. Total local hadith rows not drafted: 11,511, including held records.

### 2026-10-29: Bukhari 3529–3535

- `FR-LIB-HAD-BUKHARI-618` saves six private French drafts about Eid, Quraysh, and the seal of the prophets.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,152 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 228. Total local hadith rows not drafted: 11,505, including held records.

### 2026-10-29: Bukhari 3536–3541

- `FR-LIB-HAD-BUKHARI-619` saves five private French drafts about the Prophet’s age, names, and seal of prophethood. Bukhari 3541 remains blank because its local Arabic phrase إن ابن أختي وقع is unclear and appears damaged.
- All six records passed the focused validator, including the source-wording hold. No database writes or publication occurred. Bukhari local drafts: 3,157 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 229. Total local hadith rows not drafted: 11,500, including held records.

### 2026-10-29: Bukhari 3542–3547

- `FR-LIB-HAD-BUKHARI-620` saves six private French drafts describing the Prophet and al-Hasan.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,163 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 229. Total local hadith rows not drafted: 11,494, including held records.

### 2026-10-29: Bukhari 3548–3553

- `FR-LIB-HAD-BUKHARI-621` saves six private French drafts describing the Prophet’s appearance and prayer.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,169 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 229. Total local hadith rows not drafted: 11,488, including held records.

### 2026-10-29: Bukhari 3554–3559

- `FR-LIB-HAD-BUKHARI-622` saves six private French drafts about generosity, appearance, and character.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,175 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 229. Total local hadith rows not drafted: 11,482, including held records.

### 2026-10-29: Bukhari 3560–3564

- `FR-LIB-HAD-BUKHARI-623` saves six private French drafts about the Prophet’s conduct and prayer.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,181 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 229. Total local hadith rows not drafted: 11,476, including held records.

### 2026-10-29: Bukhari 3565–3570

- `FR-LIB-HAD-BUKHARI-624` saves five private French drafts about supplication, ablution, and prayer.
- All five records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,186 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 229. Total local hadith rows not drafted: 11,471, including held records.

### 2026-10-29: Bukhari 3571 long report

- `FR-LIB-HAD-BUKHARI-625` saves one private French draft with the full journey account involving the waterless caravan, the woman, and the available water.
- The long-source record passed the focused single-item validator for Arabic hash, ID, reference, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,187 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 229. Total local hadith rows not drafted: 11,470, including held records.

### 2026-10-29: Bukhari 3572–3577

- `FR-LIB-HAD-BUKHARI-626` saves six private French drafts about water and ablution at al-Hudaybiya.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,193 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 229. Total local hadith rows not drafted: 11,464, including held records.

### 2026-10-29: Bukhari 3578 long report

- `FR-LIB-HAD-BUKHARI-627` saves one private French draft with the full account of the meal shared by the Prophet, Abû Talha, Umm Sulaym, and their guests.
- The long-source record passed the focused single-item validator for Arabic hash, ID, reference, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,194 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 229. Total local hadith rows not drafted: 11,463, including held records.

### 2026-10-29: Bukhari 3579–3580

- `FR-LIB-HAD-BUKHARI-628` saves two private French drafts about the signs of prophethood and Jâbir’s debt.
- Both records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,196 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 229. Total local hadith rows not drafted: 11,461, including held records.

### 2026-10-29: Bukhari 3581 long report

- `FR-LIB-HAD-BUKHARI-629` keeps the full account of Abû Bakr’s guests blank because its closing narrator variant فعرفنا من العرافة is unclear in the local Arabic.
- The long-source record passed the focused single-item validator with its source-wording hold. No database writes or publication occurred. Bukhari local drafts: 3,196 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 230. Total local hadith rows not drafted: 11,461, including held records.

### 2026-10-29: Bukhari 3582–3589

- `FR-LIB-HAD-BUKHARI-630` saves six private French drafts about the rain prayer, the palm-trunk reports, and the conversation between ‘Umar and Hudhayfa.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,202 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 230. Total local hadith rows not drafted: 11,455, including held records.

### 2026-10-29: Bukhari 3590–3595

- `FR-LIB-HAD-BUKHARI-631` saves five private French drafts about the late signs and future generations. Bukhari 3591 remains blank because its final Arabic term has two unclear readings.
- All six records passed the focused validator, including the source-wording hold. No database writes or publication occurred. Bukhari local drafts: 3,207 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 231. Total local hadith rows not drafted: 11,450, including held records.

### 2026-10-29: Bukhari 3595b–3600

- `FR-LIB-HAD-BUKHARI-632` saves four private French drafts about the martyrs of Uhud and the trials. Bukhari 3595b remains blank because its source ends before the report. Bukhari 3600 remains blank because the term رُعَامَهَا is not confirmed.
- All six records passed the focused validator, including both holds. No database writes or publication occurred. Bukhari local drafts: 3,211 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 233. Total local hadith rows not drafted: 11,446, including held records.

### 2026-10-29: Bukhari 3601–3607

- `FR-LIB-HAD-BUKHARI-633` saves six private French drafts about the coming trials and signs of prophethood.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,217 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 233. Total local hadith rows not drafted: 11,440, including held records.

### 2026-10-29: Bukhari 3608–3613

- `FR-LIB-HAD-BUKHARI-634` saves six private French drafts about signs of the Hour, religious trials and patience under persecution.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,223 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 233. Total local hadith rows not drafted: 11,434, including held records.

### 2026-10-29: Bukhari 3614

- `FR-LIB-HAD-BUKHARI-635` saves one private French draft about serenity accompanying Quran recitation.
- The record passed the focused validator for Arabic hash, ID, reference, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,224 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 233. Total local hadith rows not drafted: 11,433, including held records.

### 2026-10-29: Bukhari 3615 long report

- `FR-LIB-HAD-BUKHARI-636` keeps the long Hijra account blank because it contains the Quran 9:40 wording “Do not grieve; God is with us.” No approved, attributed French Quran translation is confirmed.
- The record passed the focused validator with its Quran-quote hold. No database writes or publication occurred. Bukhari local drafts: 3,224 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 234. Total local hadith rows not drafted: 11,433, including held records.

### 2026-10-29: Bukhari 3616–3622

- `FR-LIB-HAD-BUKHARI-637` saves six private French drafts about illness, early signs, and prophetic dreams.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,230 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 234. Total local hadith rows not drafted: 11,427, including held records.

### 2026-10-29: Bukhari 3623–3630

- `FR-LIB-HAD-BUKHARI-638` saves five private French drafts about Fâtima, the Ansâr, al-Hasan and the deaths of Ja‘far and Zayd. Bukhari 3627 remains blank because it quotes Quran 110:1, and no approved, attributed French Quran translation is confirmed.
- All six records passed the focused validator, including the Quran-quote hold. No database writes or publication occurred. Bukhari local drafts: 3,235 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 235. Total local hadith rows not drafted: 11,422, including held records.

### 2026-10-29: Bukhari 3631–3636

- `FR-LIB-HAD-BUKHARI-639` saves six private French drafts about household furnishings, Sa‘d ibn Mu‘âdh, prophetic dreams, a Torah passage and the splitting of the moon.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,241 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 235. Total local hadith rows not drafted: 11,416, including held records.

### 2026-10-29: Bukhari 3637–3643

- `FR-LIB-HAD-BUKHARI-640` saves six private French drafts about the splitting of the moon, nighttime signs, steadfastness, and trade.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,247 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 235. Total local hadith rows not drafted: 11,410, including held records.

### 2026-10-29: Bukhari 3644–3649

- `FR-LIB-HAD-BUKHARI-641` saves four private French drafts about horses and the companions. Bukhari 3646 remains blank because it quotes Quran 99:7–8; Bukhari 3647 remains blank because it quotes Quran 37:177. No approved, attributed French Quran translation is confirmed.
- All six records passed the focused validator, including both Quran-quote holds. No database writes or publication occurred. Bukhari local drafts: 3,251 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 237. Total local hadith rows not drafted: 11,406, including held records.

### 2026-10-29: Bukhari 3650–3651

- `FR-LIB-HAD-BUKHARI-642` saves two private French drafts about the early generations and later witnesses.
- Both records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,253 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 237. Total local hadith rows not drafted: 11,404, including held records.

### 2026-10-29: Bukhari 3652 long report

- `FR-LIB-HAD-BUKHARI-643` keeps the Hijra account blank because it contains the Quran 9:40 wording “Do not grieve; God is with us.” No approved, attributed French Quran translation is confirmed.
- The record passed the focused validator with its Quran-quote hold. No database writes or publication occurred. Bukhari local drafts: 3,253 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 238. Total local hadith rows not drafted: 11,404, including held records.

### 2026-10-29: Bukhari 3653–3658

- `FR-LIB-HAD-BUKHARI-644` saves six private French drafts about the Hijra, Abû Bakr and the Prophet’s companions.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,259 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 238. Total local hadith rows not drafted: 11,398, including held records.

### 2026-10-29: Bukhari 3659–3664

- `FR-LIB-HAD-BUKHARI-645` saves six private French drafts about Abû Bakr and the companions.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,265 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 238. Total local hadith rows not drafted: 11,392, including held records.

### 2026-10-29: Bukhari 3665–3666

- `FR-LIB-HAD-BUKHARI-646` saves two private French drafts about Abû Bakr and charitable giving.
- Both records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,267 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 238. Total local hadith rows not drafted: 11,390, including held records.

### 2026-10-29: Bukhari 3667–3668 long report

- `FR-LIB-HAD-BUKHARI-647` keeps the report about the Prophet’s death and the succession discussion blank because it quotes Quran 39:30 and 3:144. No approved, attributed French Quran translation is confirmed.
- The record passed the focused validator with its Quran-quote hold. No database writes or publication occurred. Bukhari local drafts: 3,267 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 239. Total local hadith rows not drafted: 11,390, including held records.

### 2026-10-29: Bukhari 3669–3673

- `FR-LIB-HAD-BUKHARI-648` saves three private French drafts about Ibn al-Hanafiyya, the lost necklace and the companions. Bukhari 3669–3670 remain blank because the account quotes Quran 3:144. No approved, attributed French Quran translation is confirmed.
- All four records passed the focused validator, including the Quran-quote hold. No database writes or publication occurred. Bukhari local drafts: 3,270 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 240. Total local hadith rows not drafted: 11,387, including held records.

### 2026-10-29: Bukhari 3674

- `FR-LIB-HAD-BUKHARI-649` saves one private French draft about Abû Mûsâ, the well of Arîs, and the three visitors.
- The record passed the focused single-item validator for Arabic hash, ID, reference, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,271 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 240. Total local hadith rows not drafted: 11,386, including held records.

### 2026-10-29: Bukhari 3675–3680

- `FR-LIB-HAD-BUKHARI-650` saves five private French drafts about the companions. Bukhari 3678 remains blank because it quotes Quran 40:28; the local record does not tag that quotation, but the wording matches the verse. No approved, attributed French Quran translation is confirmed.
- All six records passed the focused validator, including the Quran-quote hold. No database writes or publication occurred. Bukhari local drafts: 3,276 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 241. Total local hadith rows not drafted: 11,381, including held records.

### 2026-10-29: Bukhari 3681–3686

- `FR-LIB-HAD-BUKHARI-651` saves six private French drafts about ‘Umar, the companions and the Prophet’s dreams.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,282 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 241. Total local hadith rows not drafted: 11,375, including held records.

### 2026-10-29: Bukhari 3687–3692

- `FR-LIB-HAD-BUKHARI-652` saves five private French drafts about ‘Umar. Bukhari 3689 remains blank because the local source appends an incomplete phrase with unclear meaning and attribution.
- All six records passed the focused validator, including the source-wording hold. No database writes or publication occurred. Bukhari local drafts: 3,287 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 242. Total local hadith rows not drafted: 11,370, including held records.

### 2026-10-29: Bukhari 3693–3698

- `FR-LIB-HAD-BUKHARI-653` saves six private French drafts about Abû Bakr, ‘Umar and ‘Uthmân.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,293 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 242. Total local hadith rows not drafted: 11,364, including held records.

### 2026-10-29: Bukhari 3699

- `FR-LIB-HAD-BUKHARI-654` saves one private French draft about the Prophet and three companions on Mount Uhud. The narrator’s uncertainty about the Prophet striking the mountain is preserved.
- The record passed the focused single-item validator for Arabic hash, ID, reference, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,294 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 242. Total local hadith rows not drafted: 11,363, including held records.

### 2026-10-29: Bukhari 3700 long report

- `FR-LIB-HAD-BUKHARI-655` keeps the long account of ‘Umar’s final days and the succession discussion blank because it contains Quran 59:9 wording. The local record does not tag that phrase, but the wording matches the verse. No approved, attributed French Quran translation is confirmed.
- The record passed the focused validator with its Quran-quote hold. No database writes or publication occurred. Bukhari local drafts: 3,294 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 243. Total local hadith rows not drafted: 11,363, including held records.

### 2026-10-29: Bukhari 3701–3706

- `FR-LIB-HAD-BUKHARI-656` saves six private French drafts about ‘Alî, Khaybar and the companions.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,300 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 243. Total local hadith rows not drafted: 11,357, including held records.

### 2026-10-29: Bukhari 3707–3713

- `FR-LIB-HAD-BUKHARI-657` saves six private French drafts about ‘Alî, Ja‘far, al-‘Abbâs and the Prophet’s family.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,306 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 243. Total local hadith rows not drafted: 11,351, including held records.

### 2026-10-29: Bukhari 3714–3720

- `FR-LIB-HAD-BUKHARI-658` saves six private French drafts about Fâtima, al-Zubayr and the Prophet’s family. The wording of Bukhari 3717 was checked against the published Arabic report to clarify a compressed local passage.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,312 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 243. Total local hadith rows not drafted: 11,345, including held records.

### 2026-10-29: Bukhari 3721–3727

- `FR-LIB-HAD-BUKHARI-659` saves six private French drafts about al-Zubayr, Talha and Sa‘d.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,318 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 243. Total local hadith rows not drafted: 11,339, including held records.

### 2026-10-29: Bukhari 3728–3733

- `FR-LIB-HAD-BUKHARI-660` saves six private French drafts about Sa‘d, Fâtima and Usâma.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,324 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 243. Total local hadith rows not drafted: 11,333, including held records.

### 2026-10-29: Bukhari 3734–3741

- `FR-LIB-HAD-BUKHARI-661` saves six private French drafts about Usâma, Ibn ‘Umar and their families. The local source for Bukhari 3737 was checked against the published Arabic report to clarify its final note.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,330 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 243. Total local hadith rows not drafted: 11,327, including held records.

### 2026-10-29: Bukhari 3742–3747

- `FR-LIB-HAD-BUKHARI-662` saves four private French drafts about Abû al-Dardâ’, Abû ‘Ubayda and al-Hasan. Bukhari 3742 and 3743 remain blank because they quote Quran 92:1–3. No approved, attributed French Quran translation is confirmed.
- All six records passed the focused validator, including both Quran-quote holds. No database writes or publication occurred. Bukhari local drafts: 3,334 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 245. Total local hadith rows not drafted: 11,323, including held records.

### 2026-10-29: Bukhari 3748–3753

- `FR-LIB-HAD-BUKHARI-663` saves six private French drafts about al-Hasan and al-Husayn and their virtues.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,340 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 245. Total local hadith rows not drafted: 11,317, including held records.

### 2026-10-29: Bukhari 3754–3758

- `FR-LIB-HAD-BUKHARI-664` saves six private French drafts about Bilâl, Ibn ‘Abbâs, Khâlid ibn al-Walîd and the recitation of the Quran.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,346 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 245. Total local hadith rows not drafted: 11,311, including held records.

### 2026-10-29: Bukhari 3759–3765

- `FR-LIB-HAD-BUKHARI-665` saves five private French drafts about the character and companions of the Prophet. Bukhari 3761 remains blank because it quotes Quran 92:1–3 and no approved, attributed French Quran translation is confirmed.
- All six records passed the focused validator, including the Quran-quote hold. No database writes or publication occurred. Bukhari local drafts: 3,351 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 246. Total local hadith rows not drafted: 11,306, including held records.

### 2026-10-29: Bukhari 3766–3771

- `FR-LIB-HAD-BUKHARI-666` saves six private French drafts about Mu‘âwiya, Fâtima and ‘Â’isha.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,357 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 246. Total local hadith rows not drafted: 11,300, including held records.

### 2026-10-29: Bukhari 3772–3777

- `FR-LIB-HAD-BUKHARI-667` saves six private French drafts about ‘Â’isha and the Ansâr.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,363 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 246. Total local hadith rows not drafted: 11,294, including held records.

### 2026-10-29: Bukhari 3778–3783

- `FR-LIB-HAD-BUKHARI-668` saves six private French drafts about the Ansâr and the bonds between the Ansâr and the emigrants.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,369 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 246. Total local hadith rows not drafted: 11,288, including held records.

### 2026-10-29: Bukhari 3784–3789

- `FR-LIB-HAD-BUKHARI-669` saves six private French drafts about the Ansâr, their followers and their clans.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,375 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 246. Total local hadith rows not drafted: 11,282, including held records.

### 2026-10-29: Bukhari 3790–3795

- `FR-LIB-HAD-BUKHARI-670` saves six private French drafts about the Ansâr and their dealings with the emigrants.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,381 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 246. Total local hadith rows not drafted: 11,276, including held records.

### 2026-10-29: Bukhari 3796–3801

- `FR-LIB-HAD-BUKHARI-671` saves five private French drafts about the Ansâr. Bukhari 3798 remains blank because it quotes Quran 59:9 and no approved, attributed French Quran translation is confirmed.
- All six records passed the focused validator, including the Quran-quote hold. No database writes or publication occurred. Bukhari local drafts: 3,386 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 247. Total local hadith rows not drafted: 11,271, including held records.

### 2026-10-29: Bukhari 3802–3807

- `FR-LIB-HAD-BUKHARI-672` saves six private French drafts about Sa‘d ibn Mu‘âdh, the Ansâr and Mu‘âdh ibn Jabal.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,392 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 247. Total local hadith rows not drafted: 11,265, including held records.

### 2026-10-29: Bukhari 3808–3813

- `FR-LIB-HAD-BUKHARI-673` saves four private French drafts about Ubayy ibn Ka‘b, Zayd ibn Thâbit, Abû Talha and ‘Abd Allâh ibn Salâm. Bukhari 3809 and 3812 remain blank because they quote Quran 98:1 and 46:10; no approved, attributed French Quran translation is confirmed.
- All six records passed the focused validator, including both Quran-quote holds. No database writes or publication occurred. Bukhari local drafts: 3,396 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 249. Total local hadith rows not drafted: 11,261, including held records.

### 2026-10-29: Bukhari 3814–3819

- `FR-LIB-HAD-BUKHARI-674` saves six private French drafts about ‘Abd Allâh ibn Salâm and Khadîja.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,402 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 249. Total local hadith rows not drafted: 11,255, including held records.

### 2026-10-29: Bukhari 3820–3825

- `FR-LIB-HAD-BUKHARI-675` saves six private French drafts about Khadîja, Jarîr ibn ‘Abd Allâh, Hudhayfa and Hind bint ‘Utba.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,408 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 249. Total local hadith rows not drafted: 11,249, including held records.

### 2026-10-29: Bukhari 3826–3831

- `FR-LIB-HAD-BUKHARI-676` saves six private French drafts about Zayd ibn ‘Amr, the building of the Ka‘ba and the fast of ‘Âshûrâ’.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,414 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 249. Total local hadith rows not drafted: 11,243, including held records.

### 2026-10-29: Bukhari 3832–3837

- `FR-LIB-HAD-BUKHARI-677` saves five private French drafts about pre-Islamic customs and pilgrimage. Bukhari 3837 remains blank because the local Arabic source ends with an unclear funeral saying; its exact meaning needs confirmation.
- All six records passed the focused validator, including the unclear-source hold. No database writes or publication occurred. Bukhari local drafts: 3,419 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 250. Total local hadith rows not drafted: 11,238, including held records.

### 2026-10-29: Bukhari 3838–3843

- `FR-LIB-HAD-BUKHARI-678` saves four private French drafts about pilgrimage customs, poetry, earnings and sales. Bukhari 3839 and 3840 remain blank because they quote Quran 78:34; no approved, attributed French Quran translation is confirmed.
- All six records passed the focused validator, including both Quran-quote holds. No database writes or publication occurred. Bukhari local drafts: 3,423 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 252. Total local hadith rows not drafted: 11,234, including held records.

### 2026-10-29: Bukhari 3844

- `FR-LIB-HAD-BUKHARI-679` saves one private French draft about the Ansâr.
- The record passed the focused validator for its Arabic hash, ID, reference, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,424 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 252. Total local hadith rows not drafted: 11,233, including held records.

### 2026-10-29: Bukhari 3845

- `FR-LIB-HAD-BUKHARI-680` saves one private French draft of the extended pre-Islamic murder and qasâma report. It is kept as a single-item batch because of its length.
- The record passed the focused validator, including its Arabic hash, ID, reference, rights metadata and private unpublished long-text state. No database writes or publication occurred. Bukhari local drafts: 3,425 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 252. Total local hadith rows not drafted: 11,232, including held records.

### 2026-10-29: Bukhari 3846–3851

- `FR-LIB-HAD-BUKHARI-681` saves six private French drafts about Bu‘âth, pilgrimage customs, pre-Islamic practices and the beginning of the Prophet’s mission.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,431 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 252. Total local hadith rows not drafted: 11,226, including held records.

### 2026-10-29: Bukhari 3852–3857

- `FR-LIB-HAD-BUKHARI-682` saves four private French drafts about persecution in Mecca and the early Muslims. Bukhari 3855 and 3856 remain blank because they quote Quran 6:151, 4:93, 25:70 and 40:28; no approved, attributed French Quran translation is confirmed.
- All six records passed the focused validator, including both Quran-quote holds. No database writes or publication occurred. Bukhari local drafts: 3,435 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 254. Total local hadith rows not drafted: 11,222, including held records.

### 2026-10-29: Bukhari 3858–3860

- `FR-LIB-HAD-BUKHARI-683` saves three private French drafts about Sa‘d ibn Abî Waqqâs, the jinn and ritual cleansing.
- All three records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,438 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 254. Total local hadith rows not drafted: 11,219, including held records.

### 2026-10-29: Bukhari 3861

- `FR-LIB-HAD-BUKHARI-684` saves one private French draft of the extended report about Abû Dharr’s journey to meet the Prophet. It is kept as a single-item batch because of its length.
- The record passed the focused validator, including its Arabic hash, ID, reference, rights metadata and private unpublished long-text state. No database writes or publication occurred. Bukhari local drafts: 3,439 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 254. Total local hadith rows not drafted: 11,218, including held records.

### 2026-10-29: Bukhari 3862–3867

- `FR-LIB-HAD-BUKHARI-685` saves five private French drafts about the early Muslims and ‘Umar. Bukhari 3866 remains blank because its local Arabic text contains an obscure rhyming passage whose exact meaning is unclear.
- All six records passed the focused validator, including the unclear-wording hold. No database writes or publication occurred. Bukhari local drafts: 3,444 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 255. Total local hadith rows not drafted: 11,213, including held records.

### 2026-10-29: Bukhari 3868–3871

- `FR-LIB-HAD-BUKHARI-686` saves four private French drafts about the splitting of the moon.
- All four records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,448 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 255. Total local hadith rows not drafted: 11,209, including held records.

### 2026-10-29: Bukhari 3872

- `FR-LIB-HAD-BUKHARI-687` holds one long private record blank because its appended commentary includes Quranic wording and no approved, attributed French Quran translation is confirmed. It remains a single-item batch because of its length.
- The record passed the focused validator, including its Arabic hash, ID, reference, rights metadata and private unpublished long-text hold. No database writes or publication occurred. Bukhari local drafts: 3,448 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 256. Total local hadith rows not drafted: 11,209, including held records.

### 2026-10-29: Bukhari 3873–3878

- `FR-LIB-HAD-BUKHARI-688` saves six private French drafts about the Abyssinian migration and the death of the Negus.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,454 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 256. Total local hadith rows not drafted: 11,203, including held records.

### 2026-10-29: Bukhari 3879–3884

- `FR-LIB-HAD-BUKHARI-689` saves five private French drafts about the Negus and the story of Abû Tâlib. Bukhari 3884 remains blank because it quotes Quran 9:113 and 28:56; no approved, attributed French Quran translation is confirmed.
- All six records passed the focused validator, including the Quran-quote hold. No database writes or publication occurred. Bukhari local drafts: 3,459 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 257. Total local hadith rows not drafted: 11,198, including held records.

### 2026-10-29: Bukhari 3885–3886

- `FR-LIB-HAD-BUKHARI-690` saves two private French drafts about Abû Tâlib and the Prophet’s night journey.
- Both records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,461 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 257. Total local hadith rows not drafted: 11,196, including held records.

### 2026-10-29: Bukhari 3887

- `FR-LIB-HAD-BUKHARI-691` saves one private French draft of the extended night-journey and daily-prayers report. It is kept as a single-item batch because of its length.
- The record passed the focused validator, including its Arabic hash, ID, reference, rights metadata and private unpublished long-text state. No database writes or publication occurred. Bukhari local drafts: 3,462 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 257. Total local hadith rows not drafted: 11,195, including held records.

### 2026-10-29: Bukhari 3888–3893

- `FR-LIB-HAD-BUKHARI-692` saves four private French drafts about the Night Journey and the pledge at al-‘Aqaba. Bukhari 3888 and 3893 remain blank because they quote Quran 17:60 and 6:151; no approved, attributed French Quran translation is confirmed.
- All six records passed the focused validator, including both Quran-quote holds. No database writes or publication occurred. Bukhari local drafts: 3,466 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 259. Total local hadith rows not drafted: 11,191, including held records.

### 2026-10-29: Bukhari 3894–3899

- `FR-LIB-HAD-BUKHARI-693` saves six private French drafts about ‘Â’isha, the early Muslims who emigrated, and the migration to Medina.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,472 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 259. Total local hadith rows not drafted: 11,185, including held records.

### 2026-10-29: Bukhari 3900–3904

- `FR-LIB-HAD-BUKHARI-694` saves five private French drafts about the end of migration, the early Muslim community and Abû Bakr.
- All five records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,477 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 259. Total local hadith rows not drafted: 11,180, including held records.

### 2026-10-29: Bukhari 3905

- `FR-LIB-HAD-BUKHARI-695` saves one private French draft of the extended account of Abû Bakr’s protection and the emigration to Medina. It is kept as a single-item batch because of its length.
- The record passed the focused validator, including its Arabic hash, ID, reference, rights metadata and private unpublished long-text state. No database writes or publication occurred. Bukhari local drafts: 3,478 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 259. Total local hadith rows not drafted: 11,179, including held records.

### 2026-10-29: Bukhari 3906

- `FR-LIB-HAD-BUKHARI-696` holds the long report blank because it directly quotes Quran 9:108 and no approved, attributed French Quran translation is confirmed. It remains a single-item batch because of its length.
- The record passed the focused validator, including its Arabic hash, ID, reference, rights metadata and private unpublished long-text hold. No database writes or publication occurred. Bukhari local drafts: 3,478 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 260. Total local hadith rows not drafted: 11,179, including held records.

### 2026-10-29: Bukhari 3907–3910

- `FR-LIB-HAD-BUKHARI-697` saves four private French drafts about Asmâ’, Surâqa and the emigration to Medina.
- All four records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,482 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 260. Total local hadith rows not drafted: 11,175, including held records.

### 2026-10-29: Bukhari 3911

- `FR-LIB-HAD-BUKHARI-698` saves one private French draft of the long report about the arrival in Medina and ʿAbd Allâh ibn Salâm.
- The record passed the focused validator for its Arabic hash, ID, reference, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,483 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 260. Total local hadith rows not drafted: 11,174, including held records.

### 2026-10-29: Bukhari 3912–3917

- `FR-LIB-HAD-BUKHARI-699` saves six private French drafts about the early emigrants and the migration to Medina.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,489 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 260. Total local hadith rows not drafted: 11,168, including held records.

### 2026-10-29: Bukhari 3918–3923

- `FR-LIB-HAD-BUKHARI-700` saves five private French drafts. The poem in hadith 3921 remains blank because its precise meaning is unclear and needs clarification.
- All six records passed the focused validator, including the hold’s reason-specific status and blank text. No database writes or publication occurred. Bukhari local drafts: 3,494 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 261. Total local hadith rows not drafted: 11,163, including held records.

### 2026-10-29: Bukhari 3924–3929

- `FR-LIB-HAD-BUKHARI-701` saves five private French drafts. Hadith 3925 remains blank because it directly quotes Quran 87:1 and no approved, attributed French Quran translation is confirmed.
- All six records passed the focused validator, including the Quran-quote hold. No database writes or publication occurred. Bukhari local drafts: 3,499 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 262. Total local hadith rows not drafted: 11,158, including held records.

### 2026-10-29: Bukhari 3930–3935

- `FR-LIB-HAD-BUKHARI-702` saves six private French drafts about the early Muslim community in Medina.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,505 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 262. Total local hadith rows not drafted: 11,152, including held records.

### 2026-10-29: Bukhari 3936–3942

- `FR-LIB-HAD-BUKHARI-703` saves six private French drafts about Saʿd ibn Abî Waqqâs, the Medina community, and related reports.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,511 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 262. Total local hadith rows not drafted: 11,146, including held records.

### 2026-10-29: Bukhari 3943–3948

- `FR-LIB-HAD-BUKHARI-704` saves five private French drafts. Hadith 3945 remains blank because it directly quotes Quran 15:91 and no approved, attributed French Quran translation is confirmed.
- All six records passed the focused validator, including the Quran-quote hold. No database writes or publication occurred. Bukhari local drafts: 3,516 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 263. Total local hadith rows not drafted: 11,141, including held records.

### 2026-10-29: Bukhari 3949

- `FR-LIB-HAD-BUKHARI-705` saves one private French draft about the number and order of the Prophet’s military expeditions.
- The record passed the focused validator for Arabic hash, ID, reference, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,517 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 263. Total local hadith rows not drafted: 11,140, including held records.

### 2026-10-29: Bukhari 3950

- `FR-LIB-HAD-BUKHARI-706` saves one private French draft of the long report about Saʿd ibn Muʿâdh and Umayya ibn Khalaf.
- The record passed the focused validator for Arabic hash, ID, reference, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,518 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 263. Total local hadith rows not drafted: 11,139, including held records.

### 2026-10-29: Bukhari 3951–3956

- `FR-LIB-HAD-BUKHARI-707` saves three private French drafts. Hadiths 3952, 3953 and 3954 remain blank because they directly quote Quran 5:24, 54:45 and 4:95; no approved, attributed French Quran translation is confirmed.
- All six records passed the focused validator, including the three Quran-quote holds. No database writes or publication occurred. Bukhari local drafts: 3,521 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 266. Total local hadith rows not drafted: 11,136, including held records.

### 2026-10-29: Bukhari 3957–3962

- `FR-LIB-HAD-BUKHARI-708` saves six private French drafts about Badr and the death of Abû Jahl.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,524 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 266. Total local hadith rows not drafted: 11,133, including held records.

### 2026-10-29: Bukhari 3963–3967

- `FR-LIB-HAD-BUKHARI-709` saves three private French drafts. Hadiths 3965–3967 remain blank because they directly quote Quran 22:19; no approved, attributed French Quran translation is confirmed.
- All six records passed the focused validator, including the three Quran-quote holds. No database writes or publication occurred. Bukhari local drafts: 3,524 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 269. Total local hadith rows not drafted: 11,133, including held records.

### 2026-10-29: Bukhari 3968–3973

- `FR-LIB-HAD-BUKHARI-710` saves four private French drafts. Hadiths 3969 and 3972 remain blank because they directly quote Quran 22:19 and 53:1; no approved, attributed French Quran translation is confirmed.
- All six records passed the focused validator, including the two Quran-quote holds. No database writes or publication occurred. Bukhari local drafts: 3,531 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 271. Total local hadith rows not drafted: 11,126, including held records.

### 2026-10-29: Bukhari 3974–3980

- `FR-LIB-HAD-BUKHARI-711` saves two private French drafts. Hadiths 3976–3978 and 3980 remain blank because they directly quote Quran 7:44, 14:28, 27:80 and 35:22; no approved, attributed French Quran translation is confirmed.
- All six records passed the focused validator, including the four Quran-quote holds. No database writes or publication occurred. Bukhari local drafts: 3,533 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 275. Total local hadith rows not drafted: 11,124, including held records.

### 2026-10-29: Bukhari 3982–3987

- `FR-LIB-HAD-BUKHARI-712` saves four private French drafts. Hadith 3983 remains blank because it contains wording matching Quran 41:40 as divine speech. Hadith 3987 remains blank because its source ends with an unclear fragment.
- All six records passed the focused validator, including the two reason-specific holds. No database writes or publication occurred. Bukhari local drafts: 3,537 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 277. Total local hadith rows not drafted: 11,120, including held records.

### 2026-10-29: Bukhari 3988

- `FR-LIB-HAD-BUKHARI-713` saves one private French draft about the two young Ansâr who attacked Abû Jahl at Badr.
- The record passed the focused validator for Arabic hash, ID, reference, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,538 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 277. Total local hadith rows not drafted: 11,119, including held records.

### 2026-10-29: Bukhari 3989

- `FR-LIB-HAD-BUKHARI-714` saves one private French draft of the long report about the capture and execution of Khubayb and Zayd ibn al-Dathina.
- The record passed the focused validator for Arabic hash, ID, reference, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,539 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 277. Total local hadith rows not drafted: 11,118, including held records.

### 2026-10-29: Bukhari 3990–3995

- `FR-LIB-HAD-BUKHARI-715` saves six private French drafts, including the report of Subayʿa’s question after her husband died while she was pregnant.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,545 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 277. Total local hadith rows not drafted: 11,112, including held records.

### 2026-10-29: Bukhari 3996–4001

- `FR-LIB-HAD-BUKHARI-716` saves five private French drafts. Hadith 4000 remains blank because it directly quotes Quran 33:5 and no approved, attributed French Quran translation is confirmed.
- All six records passed the focused validator, including the Quran-quote hold. No database writes or publication occurred. Bukhari local drafts: 3,550 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 278. Total local hadith rows not drafted: 11,107, including held records.

### 2026-10-29: Bukhari 4002

- `FR-LIB-HAD-BUKHARI-717` saves one private French draft about images and dogs in the home.
- The record passed the focused validator for Arabic hash, ID, reference, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,551 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 278. Total local hadith rows not drafted: 11,106, including held records.

### 2026-10-29: Bukhari 4003

- `FR-LIB-HAD-BUKHARI-718` saves one private French draft of the long report about ʿAlî’s camels and his marriage preparations with Fâtima.
- The record passed the focused validator for Arabic hash, ID, reference, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,552 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 278. Total local hadith rows not drafted: 11,105, including held records.

### 2026-10-29: Bukhari 4004–4009

- `FR-LIB-HAD-BUKHARI-719` saves five private French drafts. Hadith 4009 remains blank because its local source ends before the report continues.
- All six records passed the focused validator, including the incomplete-source hold. No database writes or publication occurred. Bukhari local drafts: 3,557 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 279. Total local hadith rows not drafted: 11,100, including held records.

### 2026-10-29: Bukhari 4010–4016

- `FR-LIB-HAD-BUKHARI-720` saves six private French drafts about early Muslim life and practice.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,563 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 279. Total local hadith rows not drafted: 11,094, including held records.

### 2026-10-29: Bukhari 4018–4023

- `FR-LIB-HAD-BUKHARI-721` saves six private French drafts about Badr, the early community and related reports.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,569 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 279. Total local hadith rows not drafted: 11,088, including held records.

### 2026-10-29: Bukhari 4024–4029

- `FR-LIB-HAD-BUKHARI-722` saves five private French drafts. Hadith 4026 remains blank because it directly quotes Quran 7:44 and no approved, attributed French Quran translation is confirmed.
- All six records passed the focused validator, including the Quran-quote hold. No database writes or publication occurred. Bukhari local drafts: 3,574 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 280. Total local hadith rows not drafted: 11,083, including held records.

### 2026-10-29: Bukhari 4030–4032

- `FR-LIB-HAD-BUKHARI-723` saves one private French draft. Hadith 4031 remains blank because it directly quotes Quran 59:5. Hadith 4032 remains blank because its poems are unclear.
- All three records passed the focused validator, including both reason-specific holds. No database writes or publication occurred. Bukhari local drafts: 3,575 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 282. Total local hadith rows not drafted: 11,082, including held records.

### 2026-10-29: Bukhari 4033

- `FR-LIB-HAD-BUKHARI-724` holds the full report blank because it directly quotes Quran 59:6 and no approved, attributed French Quran translation is confirmed.
- The record passed the focused validator with its Arabic original and hash, ID, reference, rights metadata and private unpublished hold. No database writes or publication occurred. Bukhari local drafts: 3,575 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 283. Total local hadith rows not drafted: 11,082, including held records.

### 2026-10-29: Bukhari 4035

- `FR-LIB-HAD-BUKHARI-725` saves one private French draft about the claims to the properties at Fadak and Khaybar.
- The record passed the focused validator for Arabic hash, ID, reference, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,576 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 283. Total local hadith rows not drafted: 11,081, including held records.

### 2026-10-29: Bukhari 4037

- `FR-LIB-HAD-BUKHARI-726` saves one private French draft, preserving the transmission variants about the loan amount, the companions and the encounter.
- The record passed the focused validator for Arabic hash, ID, reference, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,577 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 283. Total local hadith rows not drafted: 11,080, including held records.

### 2026-10-29: Bukhari 4038

- `FR-LIB-HAD-BUKHARI-727` saves one private French draft of the short report about the mission to Abû Râfiʿ.
- The record passed the focused validator for Arabic hash, ID, reference, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,578 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 283. Total local hadith rows not drafted: 11,079, including held records.

### 2026-10-29: Bukhari 4039

- `FR-LIB-HAD-BUKHARI-728` saves one private French draft recounting ʿAbd Allâh ibn ʿAtîk’s account of the expedition to Abû Râfiʿ and the healing of his injured leg.
- The record passed the focused validator for Arabic hash, ID, reference, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,579 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 283. Total local hadith rows not drafted: 11,078, including held records.

### 2026-10-29: Bukhari 4040

- `FR-LIB-HAD-BUKHARI-729` saves one private French draft of another transmission of ʿAbd Allâh ibn ʿAtîk’s account, retaining the details specific to this narration.
- The record passed the focused validator for Arabic hash, ID, reference, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,580 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 283. Total local hadith rows not drafted: 11,077, including held records.

### 2026-10-29: Bukhari 4041–4047

- `FR-LIB-HAD-BUKHARI-730` saves six private French drafts covering reports from Uhud, including the transmission variants in the account of the archers and the burial of Musʿab ibn ʿUmayr.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,586 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 283. Total local hadith rows not drafted: 11,071 including held records.

### 2026-10-29: Bukhari 4048–4053

- `FR-LIB-HAD-BUKHARI-731` saves three private French drafts. Hadiths 4049, 4050 and 4051 remain blank because they directly quote Quran 33:23, 4:88 and 3:122; each hold is recorded for Mo.
- All six records passed the focused validator, including the three private holds. No database writes or publication occurred. Bukhari local drafts: 3,589 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 286. Total local hadith rows not drafted: 11,068 including held records.

### 2026-10-29: Bukhari 4054–4059

- `FR-LIB-HAD-BUKHARI-732` saves six private French drafts of reports about Saʿd ibn Abî Waqqâs at Uhud.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,595 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 286. Total local hadith rows not drafted: 11,062 including held records.

### 2026-10-29: Bukhari 4060–4066

- `FR-LIB-HAD-BUKHARI-733` saves six private French drafts, including reports about Talha and Abû Talha at Uhud and Ibn ʿUmar’s answers concerning ʿUthmân.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,601 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 286. Total local hadith rows not drafted: 11,056 including held records.

### 2026-10-29: Bukhari 4067–4071

- `FR-LIB-HAD-BUKHARI-734` saves three private French drafts. Hadiths 4069 and 4070 remain blank because they directly quote Quran 3:128; both holds are recorded for Mo.
- All five records passed the focused validator, including both private holds. No database writes or publication occurred. Bukhari local drafts: 3,604 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 288. Total local hadith rows not drafted: 11,053 including held records.

### 2026-10-29: Bukhari 4072

- `FR-LIB-HAD-BUKHARI-735` saves one private French draft of Wahshî’s account concerning Hamza and Musaylima.
- The record passed the focused validator for Arabic hash, ID, reference, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,605 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 288. Total local hadith rows not drafted: 11,052 including held records.

### 2026-10-29: Bukhari 4073–4078

- `FR-LIB-HAD-BUKHARI-736` saves five private French drafts. Hadith 4077 remains blank because it directly quotes Quran 3:172; the hold is recorded for Mo.
- All six records passed the focused validator, including the private hold. No database writes or publication occurred. Bukhari local drafts: 3,610 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 289. Total local hadith rows not drafted: 11,047 including held records.

### 2026-10-29: Bukhari 4079–4085

- `FR-LIB-HAD-BUKHARI-737` saves six private French drafts about the Uhud dead, the Prophet’s injury, and Mount Uhud.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,616 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 289. Total local hadith rows not drafted: 11,041 including held records.

### 2026-10-29: Bukhari 4086

- `FR-LIB-HAD-BUKHARI-738` saves one private French draft of the report about ʿÂsim ibn Thâbit, Khubayb and Zayd. The poem is translated conservatively in the account.
- The record passed the focused validator for Arabic hash, ID, reference, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,617 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 289. Total local hadith rows not drafted: 11,040 including held records.

### 2026-10-29: Bukhari 4087–4092

- `FR-LIB-HAD-BUKHARI-739` saves four private French drafts. Hadiths 4090 and 4091 remain blank because they include wording described as Quran recitation, later abrogated; both holds are recorded for Mo.
- All six records passed the focused validator, including both private holds. No database writes or publication occurred. Bukhari local drafts: 3,621 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 291. Total local hadith rows not drafted: 11,036, including held records.

### 2026-10-29: Bukhari 4093

- `FR-LIB-HAD-BUKHARI-740` saves one private French draft recounting the migration to the cave of Thawr and the news of the deaths at Biʾr Maʿûna.
- The record passed the focused validator for Arabic hash, ID, reference, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,622 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 291. Total local hadith rows not drafted: 11,035, including held records.

### 2026-10-29: Bukhari 4094–4099

- `FR-LIB-HAD-BUKHARI-741` saves five private French drafts. Hadith 4095 remains blank because it includes wording described as Quran recitation, later abrogated; the hold is recorded for Mo.
- All six records passed the focused validator, including the private hold. No database writes or publication occurred. Bukhari local drafts: 3,627 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 292. Total local hadith rows not drafted: 11,030, including held records.

### 2026-10-29: Bukhari 4100–4105

- `FR-LIB-HAD-BUKHARI-742` saves five private French drafts about the digging of the Fossé. Hadith 4103 remains blank because it directly quotes Quran 33:10; the hold is recorded for Mo.
- All six records passed the focused validator, including the private hold. No database writes or publication occurred. Bukhari local drafts: 3,632 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 293. Total local hadith rows not drafted: 11,025, including held records.

### 2026-10-29: Bukhari 4106–4111

- `FR-LIB-HAD-BUKHARI-743` saves six private French drafts about the digging of the Fossé and its aftermath.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,638 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 293. Total local hadith rows not drafted: 11,019, including held records.

### 2026-10-29: Bukhari 4112–4117

- `FR-LIB-HAD-BUKHARI-744` saves six private French drafts, including reports about the prayer after the Fossé and the expedition to Banû Qurayza.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,644 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 293. Total local hadith rows not drafted: 11,013, including held records.

### 2026-10-29: Bukhari 4118–4123

- `FR-LIB-HAD-BUKHARI-745` saves six private French drafts about the march to Banû Qurayza and the judgment given there.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,650 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 293. Total local hadith rows not drafted: 11,007, including held records.

### 2026-10-29: Bukhari 4124–4129

- `FR-LIB-HAD-BUKHARI-746` saves six private French drafts covering reports about Banû Qurayza and the prayer of fear during Dhât al-Riqâʿ.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,656 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 293. Total local hadith rows not drafted: 11,001, including held records.

### 2026-10-29: Bukhari 4130–4135

- `FR-LIB-HAD-BUKHARI-747` saves six private French drafts, keeping distinct accounts of the prayer of fear and the Najd expedition.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,662 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 293. Total local hadith rows not drafted: 10,995, including held records.

### 2026-10-29: Bukhari 4136–4140

- `FR-LIB-HAD-BUKHARI-748` saves five private French drafts, including reports on the prayer of fear, the Banû al-Mustaliq expedition and voluntary prayer while riding.
- All five records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,667 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 293. Total local hadith rows not drafted: 10,990, including held records.

### 2026-10-29: Bukhari 4141

- `FR-LIB-HAD-BUKHARI-749` holds the complete report blank because it directly quotes Quran 12:18 and Quran 24:11–22. The Quran hold is recorded for Mo.
- The record passed the focused validator with its Arabic original and hash, ID, reference, rights metadata and private unpublished hold. No database writes or publication occurred. Bukhari local drafts: 3,667 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 294. Total local hadith rows not drafted: 10,990, including held records.

### 2026-10-29: Bukhari 4142–4147

- `FR-LIB-HAD-BUKHARI-750` saves two private French drafts. Hadith 4142 remains blank because its wording about ʿAlî is uncertain; hadiths 4143, 4144 and 4146 remain blank because they directly quote Quran 12:18, 24:15 and 24:11. All four holds are recorded for Mo.
- All six records passed the focused validator, including the four private holds. No database writes or publication occurred. Bukhari local drafts: 3,669 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 298. Total local hadith rows not drafted: 10,988, including held records.

### 2026-10-29: Bukhari 4148–4153

- `FR-LIB-HAD-BUKHARI-751` saves six private French drafts about the ʿumra, al-Hudaybiya and the water from its well.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,675 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 298. Total local hadith rows not drafted: 10,982, including held records.

### 2026-10-29: Bukhari 4154–4161

- `FR-LIB-HAD-BUKHARI-752` saves six private French drafts covering al-Hudaybiya, the pledge under the tree and ʿUmar’s aid to a widow.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,681 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 298. Total local hadith rows not drafted: 10,976, including held records.

### 2026-10-29: Bukhari 4162–4167

- `FR-LIB-HAD-BUKHARI-753` saves six private French drafts, preserving the separate reports about identifying the pledge tree and the later return to it.
- All six records passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,687 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 298. Total local hadith rows not drafted: 10,970, including held records.

### 2026-10-29: Bukhari 4168–4173

- `FR-LIB-HAD-BUKHARI-754` saves five private French drafts. Hadith 4172 remains blank because it directly quotes Quran 48:1 and 48:5; the hold is recorded for Mo.
- All six records passed the focused validator, including the private hold. No database writes or publication occurred. Bukhari local drafts: 3,692 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 299. Total local hadith rows not drafted: 10,965, including held records.

### 2026-10-29: Bukhari 4174–4181

- `FR-LIB-HAD-BUKHARI-755` saves five private French drafts. Hadith 4177 remains blank because it directly quotes Quran 48:1; the hold is recorded for Mo.
- All six records passed the focused validator, including the private hold. No database writes or publication occurred. Bukhari local drafts: 3,697 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 300. Total local hadith rows not drafted: 10,960, including held records.

### 2026-10-29: Bukhari 4182–4187

- `FR-LIB-HAD-BUKHARI-756` saves four private French drafts. Hadiths 4182 and 4184 remain blank because they directly quote Quran 60:12 and 33:21; both holds are recorded for Mo.
- All six records passed the focused validator, including the private holds. No database writes or publication occurred. Bukhari local drafts: 3,701 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 302. Total local hadith rows not drafted: 10,956, including held records.

### 2026-10-29: Bukhari 4188–4193

- `FR-LIB-HAD-BUKHARI-757` saves five private French drafts. Hadith 4191 remains blank because it directly quotes Quran 2:196; the hold is recorded for Mo.
- All six records passed the focused validator, including the private hold. No database writes or publication occurred. Bukhari local drafts: 3,706 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 303. Total local hadith rows not drafted: 10,951, including held records.

### 2026-10-29: Bukhari 4194–4195

- `FR-LIB-HAD-BUKHARI-758` saves one private French draft. Hadith 4194 remains blank because its battle chant has unclear wording; the hold is recorded for Mo.
- Both records passed the focused validator, including the private hold. No database writes or publication occurred. Bukhari local drafts: 3,707 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 304. Total local hadith rows not drafted: 10,950, including held records.

### 2026-10-29: Bukhari 4196

- `FR-LIB-HAD-BUKHARI-759` saves one private French draft of the long report about the journey to Khaybar and ʿÂmir ibn al-Akwaʿ. No Quran quotation or unclear source wording required a hold.
- The record passed the focused validator for Arabic hashes, IDs, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,708 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 304. Total local hadith rows not drafted: 10,949, including held records.

### 2026-10-29: Bukhari 4197–4202

- `FR-LIB-HAD-BUKHARI-760` saves three private French drafts. Hadiths 4197, 4198 and 4200 remain blank because they directly quote Quran 37:177; the holds are recorded for Mo.
- All six records passed the focused validator, including the private holds. No database writes or publication occurred. Bukhari local drafts: 3,711 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 307. Total local hadith rows not drafted: 10,946, including held records.

### 2026-10-29: Bukhari 4203–4208

- `FR-LIB-HAD-BUKHARI-761` saves six private French drafts covering reports from Khaybar, ʿAbdallâh ibn Qays and the wounded combatant.
- All six records passed the focused validator. No database writes or publication occurred. Bukhari local drafts: 3,717 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 307. Total local hadith rows not drafted: 10,940, including held records.

### 2026-10-29: Bukhari 4209–4214

- `FR-LIB-HAD-BUKHARI-762` saves six private French drafts covering the banner at Khaybar, Safiyya, and a report about a bag of fat during the siege.
- All six records passed the focused validator. No database writes or publication occurred. Bukhari local drafts: 3,723 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 307. Total local hadith rows not drafted: 10,934, including held records.

### 2026-10-29: Bukhari 4215–4220

- `FR-LIB-HAD-BUKHARI-763` saves six private French drafts on the reports about food at Khaybar, preserving the source’s differing attributions and explanations.
- All six records passed the focused validator. No database writes or publication occurred. Bukhari local drafts: 3,729 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 307. Total local hadith rows not drafted: 10,928, including held records.

### 2026-10-29: Bukhari 4221–4228

- `FR-LIB-HAD-BUKHARI-764` saves six private French drafts about the Khaybar expedition, its provisions, and the distribution of shares.
- All six records passed the focused validator. No database writes or publication occurred. Bukhari local drafts: 3,735 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 307. Total local hadith rows not drafted: 10,922, including held records.

### 2026-10-29: Bukhari 4229–4234

- `FR-LIB-HAD-BUKHARI-765` saves six private French drafts about the Khaybar booty and the migration by sea from Abyssinia.
- All six records passed the focused validator. No database writes or publication occurred. Bukhari local drafts: 3,741 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 307. Total local hadith rows not drafted: 10,916, including held records.

### 2026-10-29: Bukhari 4235–4239

- `FR-LIB-HAD-BUKHARI-766` saves two private French drafts. Hadiths 4237–4239 remain blank because they contain unclear poetic taunts; 4237 also omits what was requested of the Prophet. The holds are recorded for Mo.
- All five records passed the focused validator, including the private holds. No database writes or publication occurred. Bukhari local drafts: 3,743 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 310. Total local hadith rows not drafted: 10,914, including held records.

### 2026-10-29: Bukhari 4240

- `FR-LIB-HAD-BUKHARI-767` saves one private French draft of the report about Fâtima, Abû Bakr and the property left by the Messenger of God.
- The record passed the focused validator for Arabic hashes, ID, references, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,744 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 310. Total local hadith rows not drafted: 10,913, including held records.

### 2026-10-29: Bukhari 4242–4249

- `FR-LIB-HAD-BUKHARI-768` saves six private French drafts about the opening of Khaybar, dates, cultivation and a poisoned sheep.
- All six records passed the focused validator. No database writes or publication occurred. Bukhari local drafts: 3,750 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 310. Total local hadith rows not drafted: 10,907, including held records.

### 2026-10-29: Bukhari 4250

- `FR-LIB-HAD-BUKHARI-769` saves one private French draft about the Prophet’s appointment of Usâma and the criticism of his command.
- The record passed the focused validator for Arabic hash, ID, reference, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,751 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 310. Total local hadith rows not drafted: 10,906, including held records.

### 2026-10-29: Bukhari 4251

- `FR-LIB-HAD-BUKHARI-770` saves one private French draft of the al-Hudaybiya agreement and the report about the daughter of Hamza.
- The record passed the focused validator for Arabic hash, ID, reference, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,752 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 310. Total local hadith rows not drafted: 10,905, including held records.

### 2026-10-29: Bukhari 4252–4258

- `FR-LIB-HAD-BUKHARI-771` saves six private French drafts about the al-Hudaybiya agreement, the Prophet’s ʿumras and Maymûna.
- All six records passed the focused validator. No database writes or publication occurred. Bukhari local drafts: 3,758 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 310. Total local hadith rows not drafted: 10,899, including held records.

### 2026-10-29: Bukhari 4259–4264

- `FR-LIB-HAD-BUKHARI-772` saves six private French drafts about the ʿumra of rattrapage and the expedition of Muʾta.
- All six records passed the focused validator. No database writes or publication occurred. Bukhari local drafts: 3,764 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 310. Total local hadith rows not drafted: 10,893, including held records.

### 2026-10-29: Bukhari 4265–4270

- `FR-LIB-HAD-BUKHARI-773` saves five private French drafts. Hadith 4267 remains blank because its report abbreviates an unclear lament; the hold is recorded for Mo.
- All six records passed the focused validator, including the private hold. No database writes or publication occurred. Bukhari local drafts: 3,769 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 311. Total local hadith rows not drafted: 10,888, including held records.

### 2026-10-29: Bukhari 4271–4273

- `FR-LIB-HAD-BUKHARI-774` saves three private French drafts with Salama ibn al-Akwaʿ’s accounts of expeditions with the Prophet.
- All three records passed the focused validator. No database writes or publication occurred. Bukhari local drafts: 3,772 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 311. Total local hadith rows not drafted: 10,885, including held records.

### 2026-10-29: Bukhari 4274

- `FR-LIB-HAD-BUKHARI-775` preserves the report blank because it directly quotes Quran 60:1 and includes divine speech matching Quran 41:40. The hold is recorded for Mo.
- The record passed the focused validator with its private hold. No database writes or publication occurred. Bukhari local drafts: 3,772 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 312. Total local hadith rows not drafted: 10,885, including held records.

### 2026-10-29: Bukhari 4275–4279

- `FR-LIB-HAD-BUKHARI-776` saves five private French drafts about the conquest of Mecca during Ramadan and fasting while travelling.
- All five records passed the focused validator. No database writes or publication occurred. Bukhari local drafts: 3,777 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 312. Total local hadith rows not drafted: 10,880, including held records.

### 2026-10-29: Bukhari 4280

- `FR-LIB-HAD-BUKHARI-777` saves one private French draft of the march into Mecca during the conquest.
- The record passed the focused validator for Arabic hash, ID, reference, rights metadata and private unpublished state. No database writes or publication occurred. Bukhari local drafts: 3,778 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 312. Total local hadith rows not drafted: 10,879, including held records.

### 2026-10-29: Bukhari 4281–4287

- `FR-LIB-HAD-BUKHARI-778` saves five private French drafts. Hadith 4287 remains blank because it directly quotes Quran 17:81; the hold is recorded for Mo.
- All six records passed the focused validator, including the private hold. No database writes or publication occurred. Bukhari local drafts: 3,783 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 313. Total local hadith rows not drafted: 10,874, including held records.

### 2026-10-29: Bukhari 4288–4293

- `FR-LIB-HAD-BUKHARI-779` saves six private French drafts about entering the Kaʿba and the conquest of Mecca.
- All six records passed the focused validator. No database writes or publication occurred. Bukhari local drafts: 3,789 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 313. Total local hadith rows not drafted: 10,868, including held records.

### 2026-10-29: Bukhari 4294–4299

- `FR-LIB-HAD-BUKHARI-780` saves five private French drafts. Hadith 4294 remains blank because it directly quotes Quran 110:1–3; the hold is recorded for Mo.
- All six records passed the focused validator, including the private hold. No database writes or publication occurred. Bukhari local drafts: 3,794 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 314. Total local hadith rows not drafted: 10,863, including held records.

### 2026-10-29: Bukhari 4300–4305

- `FR-LIB-HAD-BUKHARI-781` saves six private French drafts about the conquest, an early prayer leader, a disputed parentage case, and the return of a stolen item case.
- All six records passed the focused validator. No database writes or publication occurred. Bukhari local drafts: 3,800 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 314. Total local hadith rows not drafted: 10,857, including held records.

### 2026-10-29: Bukhari 4307–4313

- `FR-LIB-HAD-BUKHARI-782` saves six private French drafts about emigration after the conquest and the sanctity of Mecca.
- All six records passed the focused validator. No database writes or publication occurred. Bukhari local drafts: 3,806 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 314. Total local hadith rows not drafted: 10,851, including held records.

### 2026-10-29: Bukhari 4314–4320

- `FR-LIB-HAD-BUKHARI-783` saves five private French drafts. Hadith 4314 remains blank because its wording conflicts on whether the hand injury occurred before or during Hunayn; the hold is recorded for Mo.
- All six records passed the focused validator, including the private hold. No database writes or publication occurred. Bukhari local drafts: 3,811 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 315. Total local hadith rows not drafted: 10,846, including held records.

### 2026-10-29: Bukhari 4321–4326

- `FR-LIB-HAD-BUKHARI-784` saves four private French drafts. Hadith 4322 and 4324 remain blank because their source phrases are unclear; both holds are recorded for Mo.
- All six records passed the focused validator, including the private holds. No database writes or publication occurred. Bukhari local drafts: 3,815 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 317. Total local hadith rows not drafted: 10,842, including held records.

### 2026-10-29: Bukhari 4328–4333

- `FR-LIB-HAD-BUKHARI-785` saves six private French drafts about the events at al-Jiʿrâna, the ʿumra question, and the Anṣâr.
- All six records passed the focused validator. No database writes or publication occurred. Bukhari local drafts: 3,821 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 317. Total local hadith rows not drafted: 10,836, including held records.

### 2026-10-29: Bukhari 4334–4339

- `FR-LIB-HAD-BUKHARI-786` saves six private French drafts about the distribution after Hunayn and the Banû Jadhîma expedition.
- All six records passed the focused validator. No database writes or publication occurred. Bukhari local drafts: 3,827 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 317. Total local hadith rows not drafted: 10,830, including held records.

### 2026-10-29: Bukhari 4340–4347

- `FR-LIB-HAD-BUKHARI-787` saves six private French drafts about obedience, Muʿâdh and Abû Mûsâ in Yemen, and pilgrimage.
- All six records passed the focused validator. No database writes or publication occurred. Bukhari local drafts: 3,833 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 317. Total local hadith rows not drafted: 10,824, including held records.

### 2026-10-29: Bukhari 4348–4353

- `FR-LIB-HAD-BUKHARI-788` saves four private French drafts. Hadith 4348 remains blank because it directly quotes Quran 4:125; hadith 4353 remains blank because one source phrase appears anomalous against the parallel report. Both holds are recorded for Mo.
- All six records passed the focused validator, including the private holds. No database writes or publication occurred. Bukhari local drafts: 3,837 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 319. Total local hadith rows not drafted: 10,820, including held records.

### 2026-10-29: Bukhari 4355–4360

- `FR-LIB-HAD-BUKHARI-789` saves six private French drafts about the Dhû al-Khalaṣa expedition, the companions’ preferences, leadership, and the coastal expedition.
- All six records passed the focused validator. No database writes or publication occurred. Bukhari local drafts: 3,843 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 319. Total local hadith rows not drafted: 10,814, including held records.

### 2026-10-29: Bukhari 4361–4366

- `FR-LIB-HAD-BUKHARI-790` saves five private French drafts. Hadith 4364 remains blank because it directly quotes Quran 4:176; the hold is recorded for Mo.
- All six records passed the focused validator, including the private hold. No database writes or publication occurred. Bukhari local drafts: 3,848 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 320. Total local hadith rows not drafted: 10,809, including held records.

### 2026-10-29: Bukhari 4367–4372

- `FR-LIB-HAD-BUKHARI-791` saves five private French drafts. Hadith 4367 remains blank because it directly quotes Quran 49:1; the hold is recorded for Mo.
- All six records passed the focused validator, including the private hold. No database writes or publication occurred. Bukhari local drafts: 3,853 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 321. Total local hadith rows not drafted: 10,804, including held records.

### 2026-10-29: Bukhari 4373–4381

- `FR-LIB-HAD-BUKHARI-792` saves six private French drafts about Musaylima, the ʿAbd al-Qays delegation, and Abû ʿUbayda’s trustworthiness.
- All six records passed the focused validator. No database writes or publication occurred. Bukhari local drafts: 3,859 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 321. Total local hadith rows not drafted: 10,798, including held records.

### 2026-10-29: Bukhari 4382–4387

- `FR-LIB-HAD-BUKHARI-793` saves six private French drafts about Abû ʿUbayda, Jâbir’s promised payment, and reports from Yemen.
- All six records passed the focused validator. No database writes or publication occurred. Bukhari local drafts: 3,865 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 321. Total local hadith rows not drafted: 10,792, including held records.

### 2026-10-29: Bukhari 4388–4393

- `FR-LIB-HAD-BUKHARI-794` saves five private French drafts. Hadith 4393 remains blank because the source ends in the middle of a poetic line; the hold is recorded for Mo.
- All six records passed the focused validator, including the private hold. No database writes or publication occurred. Bukhari local drafts: 3,870 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 322. Total local hadith rows not drafted: 10,787, including held records.

### 2026-10-29: Bukhari 4394–4399

- `FR-LIB-HAD-BUKHARI-795` saves five private French drafts. Hadith 4396 remains blank because it directly quotes Quran 22:33; the hold is recorded for Mo.
- All six records passed the focused validator, including the private hold. No database writes or publication occurred. Bukhari local drafts: 3,875 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 323. Total local hadith rows not drafted: 10,782, including held records.

### 2026-10-29: Bukhari 4400–4406

- `FR-LIB-HAD-BUKHARI-796` saves five private French drafts. Hadith 4402 remains blank because its wording about the Dajjal is corrupted in the source record; the hold is recorded for Mo.
- All six records passed the focused validator, including the private hold. No database writes or publication occurred. Bukhari local drafts: 3,880 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 324. Total local hadith rows not drafted: 10,777, including held records.

### 2026-10-29: Bukhari 4407–4412

- `FR-LIB-HAD-BUKHARI-797` saves five private French drafts. Hadith 4407 remains blank because it directly quotes Quran 5:3; the hold is recorded for Mo.
- All six records passed the focused validator, including the private hold. No database writes or publication occurred. Bukhari local drafts: 3,885 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 325. Total local hadith rows not drafted: 10,772, including held records.

### 2026-10-29: Bukhari 4413–4417

- `FR-LIB-HAD-BUKHARI-798` saves five private French drafts about the farewell pilgrimage, the Tabûk expedition, and a legal dispute over an injury.
- All five records passed the focused validator. No database writes or publication occurred. Bukhari local drafts: 3,890 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 325. Total local hadith rows not drafted: 10,767, including held records.

### 2026-10-29: Bukhari 4418

- `FR-LIB-HAD-BUKHARI-799` preserves the unusually long report as a blank private hold because it directly quotes Quran 9:117–119 and 9:95–96. The hold is recorded for Mo.
- The record passed the focused validator. No database writes or publication occurred. Bukhari local drafts: 3,890 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 326. Total local hadith rows not drafted: 10,767, including held records.

### 2026-10-29: Bukhari 4419–4424

- `FR-LIB-HAD-BUKHARI-800` saves six private French drafts about al-Ḥijr, the return from Tabûk, and Kisrâ’s letter.
- All six records passed the focused validator. No database writes or publication occurred. Bukhari local drafts: 3,896 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 326. Total local hadith rows not drafted: 10,761, including held records.

### 2026-10-29: Bukhari 4425–4430

- `FR-LIB-HAD-BUKHARI-801` saves four private French drafts. Hadith 4429 and 4430 remain blank because they directly quote Quran 77:1 and 110:1; both holds are recorded for Mo.
- All six records passed the focused validator, including the private holds. No database writes or publication occurred. Bukhari local drafts: 3,900 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 328. Total local hadith rows not drafted: 10,757, including held records.

### 2026-10-29: Bukhari 4431–4437

- `FR-LIB-HAD-BUKHARI-802` saves five private French drafts. Hadith 4435 remains blank because it directly quotes part of Quran 4:69; the hold is recorded for Mo.
- All six records passed the focused validator, including the private hold. No database writes or publication occurred. Bukhari local drafts: 3,905 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 329. Total local hadith rows not drafted: 10,752, including held records.

### 2026-10-29: Bukhari 4438–4443

- `FR-LIB-HAD-BUKHARI-803` saves six private French drafts about the Prophet’s final illness and the warning against turning graves into places of prayer.
- All six records passed the focused validator. No database writes or publication occurred. Bukhari local drafts: 3,911 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 329. Total local hadith rows not drafted: 10,746, including held records.

### 2026-10-29: Bukhari 4445–4450

- `FR-LIB-HAD-BUKHARI-804` saves five private French drafts. Hadith 4447 remains blank because an idiom in the report has an unclear exact meaning; the hold is recorded for Mo.
- All six records passed the focused validator, including the private hold. No database writes or publication occurred. Bukhari local drafts: 3,916 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 330. Total local hadith rows not drafted: 10,741, including held records.

### 2026-10-29: Bukhari 4451–4460

- `FR-LIB-HAD-BUKHARI-805` saves five private French drafts. Hadith 4452 remains blank because it directly quotes Quran 3:144; the hold is recorded for Mo.
- All six records passed the focused validator, including the private hold. No database writes or publication occurred. Bukhari local drafts: 3,921 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 331. Total local hadith rows not drafted: 10,736, including held records.

### 2026-10-29: Bukhari 4461–4467

- `FR-LIB-HAD-BUKHARI-806` saves six private French drafts about the Prophet’s legacy, final illness, and death.
- All six records passed the focused validator. No database writes or publication occurred. Bukhari local drafts: 3,927 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 331. Total local hadith rows not drafted: 10,730, including held records.

### 2026-10-29: Bukhari 4468–4473

- `FR-LIB-HAD-BUKHARI-807` saves six private French drafts about Usâma’s appointment, the Night of Decree, and campaign counts.
- All six records passed the focused validator. No database writes or publication occurred. Bukhari local drafts: 3,933 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 331. Total local hadith rows not drafted: 10,724, including held records.

### 2026-10-29: Bukhari 4474–4475

- `FR-LIB-HAD-BUKHARI-808` preserves two blank private holds because both reports directly quote Quran. The references and holds are recorded for Mo.
- Both records passed the focused validator. No database writes or publication occurred. Bukhari local drafts: 3,933 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 333. Total local hadith rows not drafted: 10,724, including held records.

### 2026-10-29: Bukhari 4476

- `FR-LIB-HAD-BUKHARI-809` preserves the unusually long report as a blank private hold because it directly includes Quranic wording. The hold is recorded for Mo.
- The record passed the focused validator. No database writes or publication occurred. Bukhari local drafts: 3,933 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 334. Total local hadith rows not drafted: 10,724, including held records.

### 2026-10-29: Bukhari 4477–4482

- `FR-LIB-HAD-BUKHARI-810` saves three private French drafts. Hadith 4479, 4480, and 4481 remain blank because they directly quote Quran 2:58, 2:97, and 2:106; all holds are recorded for Mo.
- All six records passed the focused validator, including the private holds. No database writes or publication occurred. Bukhari local drafts: 3,936 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 337. Total local hadith rows not drafted: 10,721, including held records.

### 2026-10-29: Bukhari 4483–4488

- `FR-LIB-HAD-BUKHARI-811` saves two private French drafts. Hadith 4483, 4485, 4486, and 4487 remain blank because they directly quote Quran; all four holds are recorded for Mo.
- All six records passed the focused validator, including the private holds. No database writes or publication occurred. Bukhari local drafts: 3,938 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 341. Total local hadith rows not drafted: 10,719, including held records.

### 2026-10-29: Bukhari 4489–4494

- `FR-LIB-HAD-BUKHARI-812` saves six private French drafts about the change in prayer direction.
- All six records passed the focused validator. No database writes or publication occurred. Bukhari local drafts: 3,944 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 341. Total local hadith rows not drafted: 10,713, including held records.

### 2026-10-29: Bukhari 4495–4500

- `FR-LIB-HAD-BUKHARI-813` saves three private French drafts. Hadith 4495, 4496, and 4498 remain blank because they directly quote Quran 2:158 or 2:178; all holds are recorded for Mo.
- All six records passed the focused validator, including the private holds. No database writes or publication occurred. Bukhari local drafts: 3,947 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 344. Total local hadith rows not drafted: 10,710, including held records.

### 2026-10-29: Bukhari 4501–4506

- `FR-LIB-HAD-BUKHARI-814` saves four private French drafts. Hadith 4505 and 4506 remain blank because they directly quote Quran 2:184; both holds are recorded for Mo.
- All six records passed the focused validator, including the private holds. No database writes or publication occurred. Bukhari local drafts: 3,951 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 346. Total local hadith rows not drafted: 10,706, including held records.

### 2026-10-29: Bukhari 4507–4512

- `FR-LIB-HAD-BUKHARI-815` preserves six blank private holds because each report quotes or repeats Quranic wording from Quran 2:184, 2:187, or 2:189. All six holds are recorded for Mo.
- All six records passed the focused validator. No database writes or publication occurred. Bukhari local drafts: 3,951 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 352. Total local hadith rows not drafted: 10,706, including held records.

### 2026-10-29: Bukhari 4513

- `FR-LIB-HAD-BUKHARI-816` preserves the unusually long report as a blank private hold because it directly quotes Quran 2:193 and 49:9. The hold is recorded for Mo.
- The record passed the focused validator. No database writes or publication occurred. Bukhari local drafts: 3,951 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 353. Total local hadith rows not drafted: 10,706, including held records.

### 2026-10-29: Bukhari 4516–4521

- `FR-LIB-HAD-BUKHARI-817` saves two private French drafts. Hadith 4516, 4519, 4520, and 4521 remain blank because they directly quote Quran 2:195, 2:198, or 2:199; all four holds are recorded for Mo.
- All six records passed the focused validator, including the private holds. No database writes or publication occurred. Bukhari local drafts: 3,953 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 357. Total local hadith rows not drafted: 10,704, including held records.

### 2026-10-29: Bukhari 4522–4529

- `FR-LIB-HAD-BUKHARI-818` saves one private French draft. Hadith 4522, 4524, 4526, 4528, and 4529 remain blank because they directly quote Quranic wording; the 4528 source markup also has a Quran-reference mismatch. All five holds are recorded for Mo.
- All six records passed the focused validator, including the private holds. No database writes or publication occurred. Bukhari local drafts: 3,954 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 362. Total local hadith rows not drafted: 10,703, including held records.
### 2026-10-29: Bukhari 4530–4535

- `FR-LIB-HAD-BUKHARI-819` saves three private French drafts. Hadith 4530, 4531, and 4534 remain blank because they directly quote Quranic wording; all three holds are recorded for Mo.
- All six records passed the focused validator, including the private holds. No database writes or publication occurred. Bukhari local drafts: 3,957 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 365. Total local hadith rows not drafted: 10,700, including held records.
### 2026-10-29: Bukhari 4536–4541

- `FR-LIB-HAD-BUKHARI-820` saves two private French drafts. Hadith 4536–4539 remain blank because they directly quote Quranic wording; all four holds are recorded for Mo.
- All six records passed the focused validator, including the private holds. No database writes or publication occurred. Bukhari local drafts: 3,959 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 369. Total local hadith rows not drafted: 10,698, including held records.
### 2026-10-29: Bukhari 4542–4547

- `FR-LIB-HAD-BUKHARI-821` saves three private French drafts. Hadith 4545–4547 remain blank because they directly quote Quranic wording; all three holds are recorded for Mo.
- All six records passed the focused validator, including the private holds. No database writes or publication occurred. Bukhari local drafts: 3,962 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 372. Total local hadith rows not drafted: 10,695, including held records.
### 2026-10-29: Bukhari 4548–4552

- `FR-LIB-HAD-BUKHARI-822` preserves four blank private holds because each report directly quotes Quranic wording; all four are recorded for Mo.
- All four exported records passed the focused validator. No database writes or publication occurred. Bukhari local drafts: 3,962 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 376. Total local hadith rows not drafted: 10,695, including held records.
### 2026-10-29: Bukhari 4553

- `FR-LIB-HAD-BUKHARI-823` preserves the unusually long report as a blank private hold because it contains direct Quranic quotations, including Quran 3:64. The hold is recorded for Mo.
- The record passed the focused validator. No database writes or publication occurred. Bukhari local drafts: 3,962 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 377. Total local hadith rows not drafted: 10,695, including held records.
### 2026-10-29: Bukhari 4554–4559

- `FR-LIB-HAD-BUKHARI-824` saves one private French draft. Hadith 4554 and 4556–4559 remain blank because they directly quote Quranic wording; all five holds are recorded for Mo.
- All six records passed the focused validator, including the private holds. No database writes or publication occurred. Bukhari local drafts: 3,963 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 382. Total local hadith rows not drafted: 10,694, including held records.
### 2026-10-29: Bukhari 4560–4565

- `FR-LIB-HAD-BUKHARI-825` saves three private French drafts. Hadith 4560, 4563, and 4565 remain blank because they directly quote Quranic wording; all three holds are recorded for Mo.
- All six records passed the focused validator, including the private holds. No database writes or publication occurred. Bukhari local drafts: 3,966 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 385. Total local hadith rows not drafted: 10,691, including held records.
### 2026-10-29: Bukhari 4566

- `FR-LIB-HAD-BUKHARI-826` preserves the unusually long report as a blank private hold because it directly quotes Quran 3:186 and 2:109. The hold is recorded for Mo.
- The record passed the focused validator. No database writes or publication occurred. Bukhari local drafts: 3,966 of 7,263. Muslim local drafts: 0 of 7,366. Hadith Needs Mo: 386. Total local hadith rows not drafted: 10,691, including held records.