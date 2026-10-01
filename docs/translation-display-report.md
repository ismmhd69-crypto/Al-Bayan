# AI translation display

## Built

- Added a server-only, read-only batch lookup for AI rows in `source_translations`.
- Published translations show normally. Unpublished AI translations show only when `SHOW_AI_TRANSLATIONS=true`.
- Added the translation to Ask answers, saved-chat answers, prepared answers and topic answers.
- English and German show the AI label, the translation, the Arabic original, the scholar reference and the official link.
- Arabic answers stay Arabic-only. Lookup failures fall back silently.
- Translations are attached after answer checks and are never used for search, retrieval, evidence checks or AI writing.

## Tests and local check

- Focused translation tests: 4 passed.
- Full Vitest suite: 364 passed in 34 files.
- TypeScript check: passed.
- Production build: passed.
- With `SHOW_AI_TRANSLATIONS=true`, the English prayer question returned one scholar quote with its translation, Arabic original and link. The German prayer and English zakah questions returned answers without a scholar quote, so there was no translation to show for those two results.
- With `SHOW_AI_TRANSLATIONS=false`, the same English prayer question returned the Arabic quote and link, with no translation.

## Netlify test

In Netlify, add this environment variable for Production:

`SHOW_AI_TRANSLATIONS=true`

Redeploy. Then ask a question in English or German that returns a scholar fatwa. Mo should see the AI translation label, the translation, the Arabic original, the scholar reference and the official link. If no scholar quote is returned for a question, there is no translation card to display.

