# Brief for Gemini: Al-Bayan video 03 "Speak Good"

Written 2026-10-04 by Claude for a Gemini coding agent working in `C:\Users\wiseflow\Bayan`.
Owner: Mo (not a programmer). He wants to see what you can build with our video format. Do the whole job end to end without asking questions, then write your report.

## 1. Read first (in this order)
1. `CLAUDE.md` (project rules, non-negotiable).
2. `brand/VIDEO_FORMAT.md` (the whole video format: look, content rules, consistency rules, structure, ending, cover, sound, characters, steps, lessons). **Follow it exactly.**
3. `BAYAN_PLAN.md` section 15 (social video rules).
4. Reference code. Read these files fully before writing anything:
   - `brand/src/AngerMotion.tsx` and `brand/src/hadith/anger-motion.ts`: video 02, the cleanest example. Copy its structure.
   - `brand/src/motion/ReelKit.tsx`: shared kit. Use it; do not change its look.
   - `brand/src/motion/Man.tsx`: faceless rigged character with poses.
   - `brand/src/motion/Props.tsx`: props.
   - `brand/src/motion/anim.ts`: animation helpers.
   - `brand/src/ReelCover.tsx`: covers.
   - `brand/src/Root.tsx`: composition registry.

## 2. The content (already verified by Claude; use it word for word)
- **Topic:** guarding the tongue. **Title:** SPEAK GOOD.
- **Main hadith:** Sahih al-Bukhari **6018**, graded sahih (`data/sunnah/bukhari-78-1.json`), narrated by Abu Huraira. We show only the sentence about speech:
  - Arabic, split into two lines for the scroll: `مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ` / `فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ`
  - English (our data's translation): "Anybody who believes in Allah and the Last Day should talk what is good or keep quiet."
- **Explanation 1:** Shaykh Ibn Baz, https://binbaz.org.sa/fatwas/23226 (library source `0b211c6e-9fce-41c5-9cb0-b629afe03f80`).
  - Arabic to show: `المؤمن ينتقي، لا يحدث إلا بشيء ينتقيه، ينفع`
  - English: "The believer is selective; he does not narrate except something he selects, something beneficial."
- **Explanation 2:** Shaykh Ibn Baz, https://binbaz.org.sa/fatwas/3349 (library source `a9cc2a59-d548-4495-bd5f-8783991d1a23`).
  - Arabic to show, part 1: `الكلام الذي ينفع الناس، ويوضح الحق، وليس فيه كذب... هذا من فضائل اللسان، ومما يؤجر عليه الإنسان`
  - Arabic to show, part 2: `وإنما يكون من آفات اللسان إذا أكثر الكلام بدون فائدة، وأضاع الوقت على الناس`
  - English: "Speech that benefits people, clarifies the truth, and contains no falsehood... is among the virtues of the tongue and something for which a person is rewarded. It is only an affliction of the tongue when one speaks excessively without benefit and wastes people's time."
- Do not add any other hadith, verse, ruling or opinion. Do not change any wording above.

## 3. Voice script: create `brand/voiceover/speak-good.json`
Same shape as `brand/voiceover/anger.json`, voice "Charon", English only, spoken text only (no instructions):
- `hook`: "Your words can lift you up, or bring you down."
- `hadith`: "The Prophet, peace be upon him, said: Anybody who believes in Allah and the Last Day should talk what is good, or keep quiet. Reported by al-Bukhari."
- `explain1`: "Shaykh Ibn Baz, may Allah have mercy on him, explained: The believer is selective; he does not narrate except something he selects, something beneficial."
- `explain2`: "And he said: Speech that benefits people, clarifies the truth, and contains no falsehood, is among the virtues of the tongue, and a person is rewarded for it. It is only an affliction of the tongue when one speaks excessively without benefit, and wastes people's time."
- `close`: "Share it, and may Allah accept your deeds."

**Do not generate the close clip.** Copy `brand/public/vo/bukhari-1-en-close.wav` to `brand/public/vo/speak-good-en-close.wav` first; the generator skips existing files.

**API rule: never use any key from `.env` (website keys only).** Do not generate the voice with an API. Mo will provide the voice. Build everything else first:
- Make the scenes work with the script's text and estimated timings. Write the voice script file, but do not call `generate.mjs` with any key.
- When Mo's recordings are in `brand/public/vo/speak-good-en-<scene>.wav`, run (no API involved):
```
node voiceover/generate.mjs speak-good en
node voiceover/word-timings.mjs speak-good en
```
Compare the printed transcript with the script. The model is fixed per language inside `generate.mjs`: **never change the voice or model.** If the quota runs out, stop and report it.

## 4. Build
- `brand/src/hadith/speak-good-motion.ts`: content props, like `anger-motion.ts`.
- `brand/src/SpeakGoodMotion.tsx`: like `AngerMotion.tsx`. Write only `Hook`, `Explain1`, `Explain2`, `ownCues` and the `HadithLayout`; everything else comes from `ReelRunner`.
  - Find the words where line 1 and line 2 start in the timings file, e.g. `["anybody", 0]` and `["should", 0]`.
  - Use `stampWord: "reported"` and `stamp: "Sahih al-Bukhari 6018"`.
- Register `SpeakGoodMotion` in `brand/src/Root.tsx` under the "Social" folder, using `calculateMetadata={reelMetadata<YourProps>()}` (see how AngerMotion is registered).
- **Visual ideas.** Make them yours, and keep everything moving all the time:
  - **Hook:** words fly out of a man's mouth as speech bubbles. Gold, kind ones lift him up (gold glow, he rises); dark, harsh ones pull him down.
  - **Explain 1:** a man "filters" his words: bubbles pass through a sieve or gate, and only the gold, beneficial ones go out.
  - **Explain 2:** split screen. On one side, helpful speech (teaching, a book, people nodding, a reward star). On the other, endless chatter (a flood of grey bubbles, a clock ticking, people yawning).
- You may add new props to `brand/src/motion/Props.tsx` and new poses to `POSES` in `Man.tsx`. **Do not change existing props, poses or anything in `ReelKit.tsx`**, so videos 01 and 02 stay identical.
- Characters must be **faceless**. Never draw the Prophet ﷺ, companions or any scholar.
- **Sound:** only the existing files in `brand/public/sfx/`. Never run `make_sfx.py`.
- **Cover:** add `art: "speak"` to `brand/src/ReelCover.tsx`, plus a `Cover-03-SpeakGood` still in `Root.tsx` with:
  - title "SPEAK GOOD";
  - Arabic title `فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ`;
  - source pill "Sahih al-Bukhari 6018".

  Keep everything inside the 3:4 crop (y 240 to 1680).

## 5. Check your work (required)
From `brand/`:
1. `npx tsc --noEmit` must be clean.
2. Render about 15 stills across all scenes at `--scale=0.5` into `out/frames/speak/`, and **look at them**. Fix:
   - overlaps (Arabic over captions, props over people, text over art);
   - lone Arabic words on a line;
   - cut-off text;
   - faces;
   - unnatural arms;
   - anything outside the safe areas.

   Read section 10 of `VIDEO_FORMAT.md`. Mo has flagged these exact problems before.
3. Make sure videos 01 and 02 still render. Render one still each: `IntentionMotion` and `AngerMotion`.
4. Render into `brand/out/videos/03-speak-good/`:
   - `speak-good.mp4` (`npx remotion render SpeakGoodMotion ... --crf=18 --concurrency=6`);
   - `speak-good-cover.png`;
   - `speak-good-captions.txt` in the same style as `brand/out/videos/02-true-strength/true-strength-captions.txt`. Links: https://sunnah.com/bukhari:6018, both binbaz links, askbayan.org and the Sahih Muslim 1893 closing.
5. Check loudness (about -16 LUFS): `ffmpeg -i out/videos/03-speak-good/speak-good.mp4 -af ebur128=framelog=quiet -vn -f null -`
6. Ports are fixed in `remotion.config.ts` (renders use 3124). Do not pass `--port`. Do not stop any running server.

## 6. Hard limits
- Work only inside `brand/` (plus your report in `docs/`). Do not touch the website code (`app/`, `lib/`, `components/`), the database, `.env` or any secret. **Never use any API key from `.env`**: they are for the website only.
- No git commits, no pushes, no posting anywhere.
- Do not delete or overwrite anything in `brand/out/videos/01-intentions/` or `02-true-strength/`.

## 7. Report
Write `docs/gemini-video-03-report.md` in plain English, short, no em dashes. Include:
- what you built and each scene's idea;
- the files you added or changed;
- the transcript check result;
- the loudness result;
- the problems you found in your stills and how you fixed them;
- anything Mo should check.
