# Task: translate the titles of fatwas and hadith chapters

Written 2026-10-29 for a later GPT session. Do not start until Mo sends this to you.

## Goal

Every source in Bayan's library has a title, but only in Arabic. When an English, German or French
reader sees a source card, the title still shows in Arabic (for example "شروط التوبة من الغيبة" above an
Ibn Baz fatwa). Translate every title, in batches, so each card can show its title in the reader's language.

The four website languages are Arabic, English, German and French. **Arabic is the original and stays
as it is.** Translate into the other three:

| Target | Code |
|---|---|
| English | `en` |
| German | `de` |
| French | `fr` |

## Before you start

- Project folder: `C:\Users\wiseflow\Bayan`. Read `CLAUDE.md` first and follow it.
- Supabase project `jnietkyxgnocyizvjiel` only. Never any other project.
- Do **not** use any API key from `.env` to translate. You write the translations yourself, in batches,
  the way the earlier jobs did (see `docs/hadith-translation-log-claude.md`,
  `docs/german-translation-log.md`, `docs/french-progress-log.md` and
  `docs/hadith-translation-repair-2026-10-29.md`).
- Other sessions work in this repository. Only touch your own files. Never revert or reformat someone else's work.
- Ask Mo before any database change, commit or push. Never push.

## What to translate

Titles live in `public.sources.title` (Arabic text). Read-only counts on 2026-10-29:

| Kind | Sources | Distinct titles | Average length | Longest |
|---|---:|---:|---:|---:|
| `fatwa` (scholar fatwas, e.g. Ibn Baz) | 7,388 | 7,336 | 37 characters | 247 |
| `hadith` (chapter headings of Sahih al-Bukhari and Sahih Muslim, "باب ...") | 14,629 | 5,144 | 67 characters | 300 |

Many hadith share one chapter heading. **Translate each distinct title once** (by exact Arabic text and
kind), then apply it to every source with that title. That is about 12,480 titles per language,
about 37,440 translations in total.

Re-check these counts before starting. They may have grown.

## Translation rules

- Translate the meaning of the title faithfully and completely. Do not add, explain or summarise.
- Keep titles short and title-like, as on the original. No full stops at the end unless the Arabic is a full question or sentence.
- A title that is a question stays a question ("هل يجوز ...؟" becomes "Is it permissible to ...?").
- Hadith chapter headings: translate "باب" as "Chapter:" / "Kapitel:" / "Chapitre :" followed by the heading.
  A bare "باب" with nothing after it becomes just "Chapter" / "Kapitel" / "Chapitre".
- Quran verses quoted inside a title: translate the meaning and add the reference, e.g. "(Quran 2:197)" /
  "(Koran 2:197)" / "(Coran 2:197)".
- Keep names in their usual spelling: Ibn Baz, Ibn Uthaymeen, Aisha, Abu Hurayrah. In German and French
  use the same English-style spellings for names.
- Islamic terms, matching the rest of the site:
  - English: Salah or prayer as fits, Zakah, Hajj, Umrah, Sunnah, Jihad, Ramadan, Quran.
  - German: Hajj, Umrah, Jihad, Jinn, Dajjal, Jahiliyya, Koran, Sunna, Zakat (never "Hadsch" or "Dschihad").
  - French: follow the terms already used in `docs/french-progress-log.md` and `dictionaries/fr.ts`.
- Honorifics only where the Arabic has them: "(peace be upon him)", "(Friede sei auf ihm)",
  "(paix sur lui)"; "(may Allah be pleased with him)", "(möge Allah mit ihm zufrieden sein)",
  "(qu'Allah l'agrée)".
- Never invent a ruling or soften one. "حكم ..." becomes "Ruling on ..." / "Urteil über ..." / "Statut de ...",
  not an answer.
- If a title is unclear, damaged or not Arabic, do not guess: list it in the log as "needs review" and skip it.

## Batches

1. Export the distinct titles with: kind, the exact Arabic title, a SHA-256 hash of that Arabic text, and
   how many sources use it. Save to `data/title-translations/titles-<kind>.json`. Sort fatwas by scholar,
   then title; hadith by collection, then book order.
2. Work in batches of 100 titles. Each batch file holds all three languages for those 100 titles:
   `data/title-translations/batches/<kind>-<number>.json` with entries
   `{ "hash": "...", "ar": "...", "en": "...", "de": "...", "fr": "..." }`.
3. Validate every batch automatically before saving it:
   - same number of entries as the input, every hash matches its Arabic text
   - no empty translations, no Arabic letters left in `en`/`de`/`fr` (except inside quoted names, if any)
   - each translation's length is reasonable for its Arabic (flag anything under a quarter or over three times the Arabic length)
   - hadith headings that start with "باب" start with "Chapter" / "Kapitel" / "Chapitre"
   - no text that is not in the title (no notes, no "translated by", no explanations)
4. After every 10 batches, spot-check 10 random entries against the Arabic yourself and record the result in the log.

## Where the translations go

There is no place for title translations in the database yet. Prepare it, then **ask Mo before applying**:

- Write a migration `supabase/migrations/<timestamp>_source_title_translations.sql` that creates
  `public.source_title_translations`:
  - `id uuid primary key default gen_random_uuid()`
  - `source_id uuid not null references public.sources(id) on delete cascade`
  - `lang text not null check (lang in ('en', 'de', 'fr'))`
  - `title text not null`
  - `title_original_sha256 text not null` (hash of the Arabic title it translates, so a changed Arabic title makes the translation stale)
  - `origin text not null default 'ai' check (origin in ('ai', 'human'))`
  - `translator text`, `reviewer text`, `reviewed_at timestamptz`
  - `version integer not null default 1`, `published boolean not null default false`
  - `unique (source_id, lang, version)`
  - Row level security on, with the same read rules as `public.source_translations`.
- Insert with `origin = 'ai'`, `translator = 'gpt-titles-2026'`, `published = false`. Mo decides when to publish.
- Insert only rows that do not exist yet. Never update or delete existing rows.
- Apply in chunks with a dry run first, then show Mo 10 random before/after pairs per language and wait for his OK.

The website does not read this table yet. Connecting it to the source cards is a separate task for later.
Do not change website code as part of this job.

## Log

Keep `docs/title-translation-log.md` with a batch table:

| Batch | Kind | Titles | en | de | fr | Validation | Needs review | Status |

At the end, verify with SQL and record:
- how many sources have a translated title in each language, per kind
- that every stored title hash matches the current Arabic title
- that no other table changed

## Report to Mo

Plain, short English, no jargon, no em dashes: how many titles were translated per language, how many
are left or need review, and anything you were unsure about. Commit your scripts, data and log only after
Mo says so. Never push.
