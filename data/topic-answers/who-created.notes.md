# Who-created research notes

## Question retrieved

The three Supabase questions ask: If everything has a creator, who created Allah?

## Quran research

I searched and fetched all Quran evidence through `lib/sources/quran.ts`. I fetched 52:35-36 as context, 35:14-16 as context around 35:15, and 112:1-4 as the complete short surah. The answer uses 52:35, 35:15, and 112:2-3.

The Quran fields in `who-created.json` are copied from the API without rewriting. The answer paraphrases the sources and does not retype their verse text.

## Hadith research

The direct Sahihayn result was HE65013, Sahih al-Bukhari 3276 and Sahih Muslim 134, graded sahih and attributed as muttafaq alayh by HadeethEnc. It directly describes the question “Who created your Lord?” and the Prophet's instruction to seek refuge with Allah and stop. The complete hadith record was fetched through `lib/sources/hadith.ts`.

## Scholar research

The relevant published library item was Ibn Baz fatwa 18107, `Sede61bd2-bb4a-4e83-ab1b-2599bf83b9f6`. I fetched and read the complete official page, including the question about doubts and the rest of the answer. The stored quote is unchanged and is below 600 characters. Ibn Baz fatwa 5882 was also reviewed as a related creation-purpose source, but it was not needed here.

## Limits

No differing approved-scholar view was found in the relevant sources. The unsourced `not_established` note is intentionally a Bayan limitation note, not a source claim.

No database writes or commits were made.
