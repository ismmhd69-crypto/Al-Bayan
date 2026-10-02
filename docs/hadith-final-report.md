# Hadith final report

HARD STOP: the required 60-record HadeethEnc comparison found 42 text mismatches. All 60 had the correct collection and number, but only 18 matched the stored Arabic body after the required diacritic normalization. The limit is two mismatches, so this dataset cannot be called trustworthy for the requested matn-only import.

The candidate review also found no qualifying replacement dataset. Jaguar16 has a matn field and permissive wording but only 3,087 Muslim records. The other reviewed candidates are incomplete, lack a separate verified matn, or have unclear data rights.

The database already contains the earlier Sunnah.com API import, but this goal is not complete. No further database writes were made after the failed 60-record check.

Totals stored:

- Sahih al-Bukhari: 7,263
- Sahih Muslim: 7,366
- Total: 14,629
- Approved Arabic search documents: 14,629

Rights record: `fd8cd4f5-5011-40a1-ae14-cb6e8fa165b7`, status granted.

The API has no separate matn field, so the existing rows contain the full Arabic body, including narrator chains. That does not meet the attached requirement to store the matn only. No translation text was stored.

The publication gate still has zero failures, and twenty Arabic search calls completed without errors. Those checks do not overcome the failed text comparison.

Known API gaps, not guessed or filled: Bukhari 6940, 7268, 7269, 7270, 7271, 7272, 7278, 7279, 7284, 7285, 7317, 7318.

Ten stored links:

1. https://sunnah.com/bukhari:5725
2. https://sunnah.com/bukhari:5726
3. https://sunnah.com/bukhari:5727
4. https://sunnah.com/bukhari:5728
5. https://sunnah.com/bukhari:5862
6. https://sunnah.com/bukhari:5881
7. https://sunnah.com/bukhari:5897
8. https://sunnah.com/bukhari:5887
9. https://sunnah.com/bukhari:5863
10. https://sunnah.com/bukhari:5864

No fatwa rows were changed by this importer. No source translations, Ask code, or live HadeethEnc path was changed.

Needs Mo:

1. Choose a source with a clearly permitted Arabic matn-only edition and documented provenance, or obtain a verified source mapping for the mismatches.
2. Decide whether the existing API rows should be removed or retained as a separate full-body cache. This job does not delete them.
