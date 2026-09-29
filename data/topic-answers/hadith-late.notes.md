# When were hadith written?

I read the three questions from `public.topic_texts`. To address whether hadith were only written down two hundred years after the Prophet, I investigated primary reports and verified scholar explanations on binbaz.org.sa and related collections.

### Hadith Evaluation and Removal

In previous iterations, three hadith were considered:
1. **HE6637 (Sahih al-Bukhari 2434 / Sahih Muslim 1355):** The report of Abu Hurayrah where Abu Shah requested the Prophet's sermon to be written down and the Prophet instructed to write for Abu Shah.
2. **HE10849 (Sahih Muslim 3004):** The report of Abu Sa'id al-Khudri forbidding writing anything other than the Quran.
3. **Sahih al-Bukhari 113:** The report of Abu Hurayrah stating that Abdullah ibn Amr wrote while Abu Hurayrah did not.

Per evaluation and project standards:
- `lib/prepared.ts` is Claude's file and was not modified.
- `HE6637` and `HE10849` were rejected by `hadithAllowed()` because HadeethEnc provides no confirmed hadith number for them in its catalog.
- Bukhari 113 has no permitted API source yet (it is not cataloged in HadeethEnc, and no Sunnah.com API key is configured).
- Consequently, all three hadith were removed from sources, strictly adhering to the rule never to author hadith text or translations manually.

### Approved Scholar Resolution

The topic answer is carried entirely by the verified scholar quote from Shaikh Abd al-Aziz ibn Baz (`Sa8c92f14-0b73-4f9e-9d21-4828dbcf2419`), from his commentary on Sahih al-Bukhari, Kitab al-Ilm, Bab Kitabat al-Ilm (audio 2419 on binbaz.org.sa):

"وهذا يدل على جواز الكتابة، ولهذا رخص لهم النبي ﷺ قال: اكتبوا لأبي شاه، كان نهى عن الكتابة عنه عليه الصلاة والسلام؛ لئلا يختلط كلامه بالقرآن، ثم رخص في ذلك لما استقر الأمر وعرف الناس القرآن وتبصّروا، أذِن في كتابة الحديث عنه عليه الصلاة والسلام."

In this verified quote, Shaikh Ibn Baz:
1. Affirms the permissibility of writing hadith and cites the prophetic command: "Write for Abu Shah."
2. Explains the initial prohibition: it occurred early on lest prophetic speech be confused with the Quran.
3. Explains the subsequent concession and permission: once the Quran was firmly known and preserved, the Prophet permitted writing hadith from him.

Every sentence across Arabic, English, and German derives strictly from this verified quote and cites `Sa8c92f14-0b73-4f9e-9d21-4828dbcf2419`. The unsourced note clarifies that while this establishes early writing and authorization, it does not detail later compendia compilations.
