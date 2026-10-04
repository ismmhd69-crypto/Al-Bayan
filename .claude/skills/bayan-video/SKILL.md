---
name: bayan-video
description: Make an Al-Bayan social media video (Reels/TikTok/Shorts) in Mo's approved motion-design format - faceless code-drawn characters, moving camera, word-synced voiceover and captions, synthesized sound effects, authentic hadith plus approved-scholar quotes, askbayan.org ending. Use when Mo asks for a new hadith/Islamic video, a reel, a TikTok, or "another video like the intention one".
---

# Al-Bayan motion video

The full recipe, with file paths, layout numbers, commands and lessons, is in **`brand/VIDEO_FORMAT.md`**. Read it completely before starting. Shared parts live in `brand/src/motion/ReelKit.tsx`. The cleanest example video is `brand/src/AngerMotion.tsx`, with content in `brand/src/hadith/anger-motion.ts`; video 01 is `IntentionMotion`.

## Hard rules
- **Authenticity:** Quran and hadith must be sahih or hasan, confirmed in `data/sunnah/`. Explanations are quoted only from approved scholars (Ibn Baz, Ibn Uthaymeen, al-Albani, al-Barrak, Othman al-Khamis), taken from the Supabase `sources` table, read-only, project `jnietkyxgnocyizvjiel` only. No rulings or opinions of our own, in the voice or on screen.
- **Original Arabic** appears next to every translation. Every source link goes in the caption file.
- **Characters are faceless.** Never depict the Prophet ﷺ, companions or scholars.
- **No music.** Sound effects only.
- **The fixed ending** is the logo, the askbayan.org button, "SHARE IT" (centred, arrow to the right) and Sahih Muslim 1893 as text. Keep it on every video.
- **Consistency:** use the same voice ("Charon", fixed model per language in `generate.mjs`; if the quota runs out, wait, never switch) and the same sound-effect files in `brand/public/sfx/` (never regenerate them). Keep the same look and ending. Each video gets its own folder and its own cover.
- Ask Mo before any commit, push, database change or posting. Each push triggers a paid Netlify build.
- Replies to Mo are short, plain English, with no em dashes.

## Steps
1. **Content:** pick a hadith and two short scholar quotes with links (SQL in VIDEO_FORMAT.md, step 1). If unsure, ask Mo for the topic.
2. **Script:** write `brand/voiceover/<id>.json` with the scenes hook, hadith, explain1, explain2 and close. Spoken text only.
3. **Voice:** `node voiceover/generate.mjs <id> en` (and `de`). The model is chosen automatically per language. The free quota is about 10 clips a day per model.
4. **Timings:** `node voiceover/word-timings.mjs <id> en`. Compare the transcript with the script.
5. **Build:** copy `AngerMotion.tsx` and its content file. Write only the hook, the two explanation scenes, `ownCues` and the `HadithLayout`; `ReelRunner` from the kit supplies everything else. Copy the shared closing voice clip instead of generating it. Add sound cues keyed to words. Register the composition in `Root.tsx` under "Social".
6. **Check:** run `npx tsc --noEmit`, then render about 15 stills on one contact sheet plus transition frames, using `--port=3124`. Check faces, overlaps, lone Arabic words, centring, natural arm motion and safe areas. Fix the problems and check again.
7. **Cover:** design a cover for this video in `brand/src/ReelCover.tsx` (new `art` kind, big English title, Arabic title, source pill), register it as `Cover-<nn>-<Name>`, and keep everything inside the 3:4 grid crop (y 240 to 1680).
8. **Render** into the video's own folder `brand/out/videos/<nn>-<name>/`: `<name>.mp4`, `<name>-cover.png` and `<name>-captions.txt`. Never mix files from different videos. Check loudness is about -16 LUFS.
9. **Report** to Mo: what the video shows, the file links, anything he must check (translations, odd voice words), and that nothing is posted.

After Mo gives feedback, apply it, then add the lesson to section 10 of `brand/VIDEO_FORMAT.md` so the format keeps improving.
