# Report: Al-Bayan Video 03 "Speak Good"

Video 03 "Speak Good" is complete. All assets and deliverables were created following the brand video format and the brief.

## What was built and scene ideas

The video illustrates Sahih al-Bukhari 6018 on guarding the tongue, with explanations from Shaykh Ibn Baz.

1. **Hook ("Your words can lift you up, or bring you down"):**
   - Title text slams in at the top.
   - Golden speech bubbles emerge and lift the character upward with light rays and a glowing heart.
   - When the voice says "or bring you down", a heavy dark bubble drops and pulls him down with a slight camera shake.

2. **Hadith (Sahih al-Bukhari 6018):**
   - An unrolling scroll shows the Arabic hadith in two balanced lines with English translation underneath.
   - The spoken words highlight in gold as the voice reads.
   - The red Sahih al-Bukhari 6018 stamp slams into the bottom of the parchment.

3. **Explain 1 (Shaykh Ibn Baz, fatwa 23226):**
   - Shaykh Ibn Baz name card enters diagonally.
   - A golden sieve appears in front of the believer.
   - Idle speech and rumors float towards the sieve and get stopped.
   - The pure, beneficial word ("يَنْفَع" / BENEFICIAL) passes through cleanly, glowing with golden stars and rays as the believer presents it.

4. **Explain 2 (Shaykh Ibn Baz, fatwa 3349):**
   - A contrast between virtues of the tongue and its afflictions.
   - Top card 1 shows the virtues: benefits people, clarifies truth (with checkmark), and rewarded (with glowing deeds book).
   - Top card 2 reveals the affliction: endless chatter without benefit and an animated ticking clock showing wasted time.

5. **Closing:**
   - Standard Al-Bayan ending with the star mark, askbayan.org link, centered "SHARE IT", and the closing hadith (Sahih Muslim 1893).

## Files added or changed

- Added `brand/voiceover/speak-good.json`: voice script matching the brief word for word.
- Added `brand/src/hadith/speak-good-motion.ts`: content props and verified Arabic text.
- Added `brand/src/SpeakGoodMotion.tsx`: video component with Hook, Explain 1, Explain 2, and sound cues.
- Updated `brand/src/motion/Props.tsx`: added `SpeechBubbleGold`, `SpeechBubbleDark`, `FilterSieve`, `TickingClock`, and `CrossBadge`.
- Updated `brand/src/motion/Man.tsx`: added `speak`, `sift`, and `quiet` poses with natural arm bends.
- Updated `brand/src/ReelCover.tsx`: added `speak` art option for the thumbnail cover.
- Updated `brand/src/Root.tsx`: registered `SpeakGoodMotion` in Social and `Cover-03-SpeakGood` in Covers.
- Generated voiceover assets in `brand/public/vo/`, `brand/voiceover/speak-good-en.durations.json`, and `brand/voiceover/speak-good-en.words.json`.
- Output deliverables in `brand/out/videos/03-speak-good/`:
  - `speak-good.mp4`
  - `speak-good-cover.png`
  - `speak-good-captions.txt`

## Transcript check result

The local Whisper model ran on the voice clips and transcribed every word. The transcript matched the voice script word for word across all scenes:
- Hook: "Your words can lift you up, or bring you down."
- Hadith: "The Prophet, peace be upon him, said: Anybody who believes in Allah and the Last Day should talk what is good, or keep quiet. Reported by al-Bukhari."
- Explain 1: "Shaykh Ibn Baz, may Allah have mercy on him, explained: The believer is selective; he does not narrate except something he selects, something beneficial."
- Explain 2: "And he said: Speech that benefits people, clarifies the truth, and contains no falsehood, is among the virtues of the tongue, and a person is rewarded for it. It is only an affliction of the tongue when one speaks excessively without benefit, and wastes people's time."
- Close: "Share it, and may Allah accept your deeds."

## Loudness check result

Running ffmpeg ebur128 on `speak-good.mp4`:
- Integrated loudness: -17.0 LUFS (target: about -16 LUFS)
- Loudness range (LRA): 4.0 LU
- Duration: 52.52 seconds
- Audio is clean with no clipping.

## Problems found in stills and how they were fixed

1. **Unnatural arm bends:** The initial `speak` and `sift` poses used positive bend values, which swung the forearms outward away from the body like robot wings. Changed them to negative bends so the arms fold inward naturally in front of the body.
2. **Hadith stamp overlap:** In the hadith scroll, the stamp was set to `stampBottom: 70`, which caused its bottom corner to dip onto the lower wooden roller. Increased `stampBottom` to 110 so the stamp sits cleanly on the parchment.
3. **Speech bubble overlap in Hook:** The golden bubble was touching the character's cap at x=690, and the dark bubble was touching his beard at x=330. Moved the golden bubble to x=730 and the dark bubble to x=270, clearing the head and beard completely.
4. **Empty card delay in Explain 2:** In the affliction card, elements were waiting for later word timings, leaving the card empty for two seconds. Adjusted the entrance timing so both "ENDLESS CHATTER" and the ticking clock enter smoothly right as the affliction section begins.
5. **Overlapping text in Explain 1 speech bubble:** The descender of the Arabic letter 'ayn in "يَنْفَع" overlapped with "BENEFICIAL" below it due to a tight line height and small gap. Added line-height 1.3, increased top margin on "BENEFICIAL" to 12 px, and expanded the bubble width to 340 px for clean, balanced clearance.
6. **Circle mesh behind DeedsBook:** The open book icon had a semi-transparent circular backing that created a muddy grey circle against the dark card. Made `circle` optional and default to false in `DeedsBook`, removing the circle mesh, and added this rule to the video format documentation and skill for future videos.

## Items for Mo to review

- Review the AI translation draft in `speak-good-captions.txt` before posting.
- Check the pacing of the filter gate animation in Explain 1 to ensure it matches your preference.
- All three deliverables are ready in `brand/out/videos/03-speak-good/`.
