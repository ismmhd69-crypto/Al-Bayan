# Al-Bayan video format

This is the standard format for every Al-Bayan social video (Instagram Reels, TikTok, YouTube Shorts). The reference video is **IntentionMotion** ("Actions are by intentions", Sahih al-Bukhari 1, explained by Ibn Baz), in `src/IntentionMotion.tsx`. Every new video copies it.

Approved by Mo on 2026-10-04. Website: **askbayan.org**.

A Claude Code skill runs this whole process: `/bayan-video` (file `.claude/skills/bayan-video/SKILL.md` in the repo root).

---

## 1. The look

| Item | Rule |
|---|---|
| Size | Vertical 1080x1920, 30 fps, about 50 to 60 seconds. |
| Motion | Never static. The camera always moves (push in, pull out, pan, dive into a detail). Elements arrive with a bounce or squash. Scenes change with whip pans and motion blur. Nothing holds still longer than about 0.5 s. |
| Characters | Flat vector, **faceless** (no eyes or mouth), drawn in code with movable arms, legs and head. White thobe, kufi cap, dark beard shape. Never show the Prophet ﷺ, companions or any scholar. Scholars appear only as a name card. |
| Colours | Lapis background `#1b2d66` with moving blue and gold light blobs and the faint star lattice. Gold `#d4a852`, cream `#f4efe3`. |
| Fonts | Inter 800 for captions and big words. Newsreader for English text. Amiri for Arabic. Reem Kufi for the بيان wordmark. |
| Voice | Gemini voice "Charon", calm. All timing follows the spoken words. |
| Sound | Sound effects only, **no music**. |
| Captions | Chunks of up to 4 words in uppercase Inter 800 in a dark pill. The spoken word turns gold. The scholar's **original Arabic** sits above the captions. |
| Top bar | Star mark + "BAYAN · askbayan.org" at y 150, and a gold progress line at y 210. Visible the whole video. |
| Safe areas | Keep text out of the top and bottom 250 px, except the top bar. |

## 1b. Consistency rules (same on every video)

Also written in `BAYAN_PLAN.md` section 15.

- **Same voice:** Gemini **"Charon"**. English always uses `gemini-3.1-flash-tts-preview` and German always uses `gemini-2.5-flash-preview-tts`; `generate.mjs` picks these by itself. If the daily free quota runs out, wait for the next day. Never switch the voice or the model.
- **Same sound effects:** only the fixed files in `public/sfx/`. Never rerun `make_sfx.py` or replace a file. Each sound keeps its meaning (section 5). Only add a sound under a new name if one is truly missing.
- **Same look and ending:** the background, captions, top tag, camera style, character style and closing scene stay the same. Only the hook and the explanation scenes change per video.
- **One folder per video** with its own designed cover (sections 4b and 8).

## 2. Content rules (non-negotiable)

From the Al-Bayan methodology (`BAYAN_PLAN.md`):

1. **Quran and hadith only if graded sahih or hasan.** Confirm the number and grade in our data (`data/sunnah/`, Bukhari and Muslim). If the wording someone asks for comes from a book we don't have, use a version from our data with the same teaching and say so (see the closing hadith in section 4).
2. **Explanations are quoted only from approved scholars:** Ibn Baz, Ibn Uthaymeen, al-Albani, al-Barrak and Othman al-Khamis. Take them from the scholar library in Supabase (`sources` + `source_translations`, project `jnietkyxgnocyizvjiel`), read-only. Every quote keeps its link.
3. **The voice adds nothing of our own** except a short hook and a short closing line. No rulings or opinions from us. The visuals only illustrate what the hadith or scholar said.
4. **Show the original Arabic** next to every translation: the hadith, each quote and the closing hadith.
5. **Quote translations in the library are AI drafts.** Mo reviews them before posting.
6. **The post caption lists every source link** and askbayan.org.
7. **Nothing is posted, committed or pushed without Mo.**

## 3. Scene structure

The length of each scene comes from its voice clip: `LEAD` (0.35 s before the voice) + voice length + a tail.

| # | Scene | Tail | What happens |
|---|---|---|---|
| 1 | `hook` | 0.45 s | The camera rushes in. One strong line slams in ("ONE SENTENCE"), the rest types on word by word, and a visual example sets up the topic (two men give charity; one heart gold, one grey). |
| 2 | `hadith` | 0.95 s | Whip pan up to a scroll that unrolls. "The Prophet ﷺ said:" and the narrator. Each Arabic line wipes in right-to-left with its English line underneath, lighting up word by word with the voice. A red source stamp slams in with a camera shake. |
| 3 | `explain1` | 0.8 s | Scholar name card flies in diagonally. The character acts out the first point. The camera dives in on the key idea (zoom into the glowing heart), then pulls out. |
| 4 | `explain2` | 0.95 s | Second point as a visual story (street walk with scrolling scenery, a sign that stops him, stars into a "Reward" book). Any hadith the scholar cites gets a source pill. Then a split view of two panels (ill / travelling). |
| 5 | `close` | 4.2 s | Golden flash into the Bayan logo, then the fixed ending (section 4). |

## 4. The fixed ending (same on every video)

| Element | Position (y centre) | Details |
|---|---|---|
| Star logo | 625 | `BayanMark` size 340, draws itself in. Rays behind it, size **460** (bigger rays overlap the name). |
| بيان / BAYAN | 985 (block) | Wordmark, then the **askbayan.org** button: dark pill, gold border, Inter 800 44 px, ".org" in gold. |
| SHARE IT | 1250 | Inter 800 66 px, gold. **The words are centred on the screen**, and the share arrow hangs off to the right (absolute position), so it doesn't pull the words left. |
| Closing hadith | 1490 (block) | "The Prophet ﷺ said:" · Arabic «مَنْ دَلَّ عَلَى خَيْرٍ فَلَهُ مِثْلُ أَجْرِ فَاعِلِهِ» · "One who guides to something good has a reward similar to that of its doer." · pill "Sahih Muslim 1893". |

- The closing hadith is **text only**. The voice keeps its own closing line ("Share it, and may Allah accept your deeds.").
- Mo asked for «الدال على الخير كفاعله». That exact wording is in Tirmidhi, which isn't in our data, so we use Sahih Muslim 1893 (`data/sunnah/muslim-33-2.json`, sahih, link https://sunnah.com/muslim:1893a).
- The close tail is 4.2 s so there is time to read it.

## 4b. The cover (every video has one)

Each reel gets a designed cover: the thumbnail people see on the profile grid. The component is `src/ReelCover.tsx`, registered per video in `src/Root.tsx` under the "Covers" folder as `Cover-<nn>-<Name>`.

| Element | Position | Details |
|---|---|---|
| Brand tag | y 290 | Star + BAYAN. |
| Title | y 380 | One big English word or two, uppercase, Inter 800 168 px, white, for example **INTENTIONS**. |
| Arabic title | under the title | Amiri 76 px, gold, usually the opening words of the hadith. |
| Illustration | from y 760 | The key image of the video (for Intentions: the man raising his hands, heart glowing, rays behind). The character goes in a `position: relative; zIndex: 1` wrapper so the rays don't paint over him. |
| Source pill | y 1600 | For example "Sahih al-Bukhari 1". |

- **Grid crop:** Instagram's profile grid shows covers cut to 3:4, which is the middle band from y 240 to 1680. Everything important sits inside that band. Check by cropping the render to that band.
- **New art:** add a new `art` kind in `ReelCover.tsx` for each video (characters and props from `src/motion/`).
- **Render:** `npx remotion still Cover-<nn>-<Name> out/videos/<nn>-<name>/<name>-cover.png`

## 5. Sound design

Made by `sfx/make_sfx.py` (numpy/scipy, synthesised, licence-free) into `public/sfx/`:

| Sound | Use |
|---|---|
| `whoosh`, `whip`, `rise`, `swipe` | Scene changes, camera dives, cards flying in, the closing flash. |
| `pop`, `pop_high`, `bubble` | Characters landing, icons and bubbles appearing. |
| `hit`, `stamp` | Big word slams, signs dropping, source stamps. |
| `paper`, `scratch`, `strike`, `tick` | Scroll unrolling, writing, crossing out, type-on words. |
| `heartbeat`, `step`, `ding`, `sparkle`, `chime` | Heart, footsteps, rewards, stars, the ending. |

Cues are keyed to spoken words in `buildCues` (for example `add("explain1", e("tongue"), "strike", 0.45)`). Volumes are 0.22 to 0.55. The final mix must measure about **-16 LUFS** with no clipping.

## 6. Characters and props

- **Character:** `src/motion/Man.tsx`. `Man` takes a `pose`, `style` (`MAN_WHITE`, `MAN_GREY`), `size`, an optional glowing `heart`, and an item in the right hand.
- **Poses:** `stand`, `give`, `takbir`, `point`, `think`, `carry`. Blend them with `mixPose(a, b, p)`. Add `breathe(pose, t)` when standing so nobody is frozen. Use `walk(pose, t, speed, amount)` for walking.
- **Arm rig rule:** `out` swings the arm away from the body. A positive `bend` folds the forearm *outward*.
  - **Takbir** uses `out 78, bend 162`.
  - **Walking** keeps the arms at the sides with only a small outward swing, and uses a **negative bend** so the forearm swings in front of the body. Arms that swing out sideways or cross the body look wrong (Mo flagged this).
- **Pose test sheet:** the `PuppetSheet` composition (Dev folder). Render it after changing poses.
- **Props:** `src/motion/Props.tsx` contains coin, heart, star, rays, masjid, buildings, scroll, speech and thought bubbles, stamp, deeds book, bed, lying man, suitcase, thermometer, road sign, worship icons (prayer mat, Kaaba, crescent, coin) and the scholar name card. Add new props here as flat SVG in brand colours.

## 7. Files (`brand/`)

| What | File |
|---|---|
| **Shared kit** (background, camera, whip, captions, Arabic lines, hadith scroll, ending, voice + shared sound cues, scene runner) | `src/motion/ReelKit.tsx` |
| Video 01 scenes (hook, two explanations, own sound cues) | `src/IntentionMotion.tsx` + `src/hadith/bukhari-1-motion.ts` |
| Video 02 scenes | `src/AngerMotion.tsx` + `src/hadith/anger-motion.ts` |
| Character rig | `src/motion/Man.tsx` |
| Props | `src/motion/Props.tsx` |
| Animation helpers (`prog`, `keys`, `springy`, `squash`, `shake`, `lerp`) | `src/motion/anim.ts` |
| Voice script | `voiceover/<id>.json` |
| Voice generator | `voiceover/generate.mjs` |
| Word timings | `voiceover/word-timings.mjs` makes `voiceover/<id>-<lang>.words.json` |
| Voice lengths | `voiceover/<id>-<lang>.durations.json` |
| Sound effects | `sfx/make_sfx.py` makes `public/sfx/*.wav` |
| Voice clips | `public/vo/<id>-<lang>-<scene>.wav` |
| Compositions | `src/Root.tsx` (folder "Social"; profile picture in "Stills") |
| Cover design | `src/ReelCover.tsx` (compositions in "Covers") |
| Renders | `out/videos/<nn>-<name>/` one folder per video (not in git) |
| Whisper binaries and model | `.whisper/` (not in git, downloaded on the first run) |

## 8. Making the next video, step by step

### Step 1: Content
1. Pick a topic and a sahih or hasan hadith (or verse). Confirm the number and grade in `data/sunnah/`.
2. Find two short, clear scholar quotes about it (read-only):
   ```sql
   select s.id, sc.name_en, s.title, s.url, s.text_original,
     (select string_agg(t.lang, ',') from source_translations t where t.source_id = s.id) as langs
   from sources s join scholars sc on sc.id = s.scholar_id
   where s.kind <> 'hadith' and s.text_original like '%<arabic keyword>%'
   order by length(s.text_original) limit 30;
   ```
   Then read the English and German text from `source_translations`.
3. If a scholar cites another hadith, confirm its number and grade in our data too.

### Step 2: Voice script
Copy `voiceover/bukhari-1.json` to `voiceover/<id>.json`. Keep the five scene keys: `hook`, `hadith`, `explain1`, `explain2`, `close`.
- Write **only the words to speak**. Any instruction such as "say calmly" gets read aloud.
- Use "peace be upon him" for ﷺ and "may Allah have mercy on him" for scholars.
- The hadith and quotes must match the on-screen translation word for word.

### Step 3: Voice
```bash
cd brand
node voiceover/generate.mjs <id> en
node voiceover/generate.mjs <id> de
```
- Uses `GEMINI_API_KEY` from `../.env`. Clips are trimmed and set to -16 LUFS, and the lengths file is written.
- The **free quota is about 10 clips a day per model**. Each language has its own fixed model (set in `generate.mjs`). To redo one clip, delete its wav and rerun. If the quota runs out, wait a day; don't switch the model.

### Step 4: Word timings (also checks the words)
```bash
node voiceover/word-timings.mjs <id> en
```
- Whisper runs locally (`small.en`). It prints every word with its time.
- **Compare the printed words with the script.** If a word is wrong, for example "Allah", redo that clip.
- In code, `W("word")` gives the scene time of a word and `W("word", 1)` the second time it is said.

### Step 5: Build
1. Copy `src/hadith/bukhari-1-motion.ts` to `src/hadith/<id>-motion.ts` with the new Arabic lines and quotes.
2. Copy `src/AngerMotion.tsx` (the cleanest example) to `src/<Name>Motion.tsx`. It only defines three scenes (`Hook`, `Explain1`, `Explain2`), its own sound cues (`ownCues`) and a `HadithLayout`; everything else comes from `ReelRunner` in `src/motion/ReelKit.tsx`. **Never copy the shared parts into a video file**; change them in the kit so all videos stay the same.
   - `HadithLayout`: `narrator`, `stamp`, the Arabic lines, the spoken words where line 1 and line 2 start (`["the", 1]` = second "the"), `stampWord`, and for long hadith `arabicSize`, `englishSize`, `contentTop`, `stampBottom`.
3. Add sound cues in `ownCues` (transitions, scroll and ending cues are added by the kit).
4. Register in `src/Root.tsx` under "Social" with `calculateMetadata={reelMetadata<Props>()}` so the length follows the voice.
5. The closing voice line is the same on every video: copy `public/vo/bukhari-1-en-close.wav` to `public/vo/<id>-en-close.wav` instead of generating it.

### Step 6: Check
```bash
npx tsc --noEmit
npx remotion still <Id> out/frames/<name>.png --frame=<n> --port=3124 --scale=0.5
```
- Ports are fixed in `remotion.config.ts`: studio **3123** (`setStudioPort`), renders **3124** (`setRendererPort`). The website's dev server uses 3000. Without this, the studio's Render button opened the website on port 3000 and failed with "Error while getting compositions". Don't use the outdated `setPort`, because it puts both on the same port.
- Render about 15 frames across all scenes and put them on one contact sheet. Check:
  - faces are blank;
  - no text is cut off or overlapping (Arabic over captions, logo rays over the name);
  - no Arabic line ends with a single word (use `textWrap: "balance"`);
  - centred things look centred;
  - arms and walking look natural;
  - safe areas are respected.
- Grab frames in the middle of transitions from the rendered mp4 too.

### Step 7: Render
```bash
npx remotion render <Id> out/videos/<nn>-<name>/<name>.mp4 --crf=18 --concurrency=6
npx remotion still Cover-<nn>-<Name> out/videos/<nn>-<name>/<name>-cover.png
ffmpeg -i out/videos/<nn>-<name>/<name>.mp4 -af ebur128=framelog=quiet -vn -f null -
```
The loudness check should show about -16 LUFS. Preview in the studio with `npx remotion studio --port=3123` at http://localhost:3123.

### Step 8: Deliver to Mo
**Every video gets its own folder** `out/videos/<nn>-<name>/` (numbered in order: `01-intentions`, `02-...`). Never put files from different videos together. The folder holds three files:
- `<name>.mp4`, the video;
- `<name>-cover.png`, the designed cover (section 4b);
- `<name>-captions.txt`, containing:
  - the hook line;
  - the hadith with the narrator and source;
  - the scholar quotes;
  - every source link (sunnah.com, binbaz.org.sa and so on);
  - "Ask your question with authentic sources: https://askbayan.org";
  - the closing hadith with its link;
  - hashtags including #askbayan.

Then Mo watches it, reviews the translations and decides when to post.

## 9. Brand assets

- **Social profile picture:** the `SocialProfile` still (2048x2048, star only on lapis, fits a round crop). Files: `out/SocialProfile.png` and `out/SocialProfile-1080.png`.
- **Don't use `AppleIcon.png`** (180x180) for social media. It is the website's iPhone home-screen icon and looks blurry when enlarged.
- Other stills: `Avatar` (logo + name), `Horizontal`, `Stacked`, `OgImage` and `Mark`.

## 10. Lessons learned

- **Voice:** style instructions get spoken, so send the text only. Newer Gemini voice models return WAV and older ones raw audio, and the script handles both. The rate limit is about 3 a minute, so the script waits between clips.
- **Whisper on Windows:** the helper library expects a different folder, so the script calls `.whisper/Release/whisper-cli.exe` directly.
- **Higgsfield:** free plan, 3.5 credits (about 14 GPT images). Its audio tool makes speech only. That is why characters and sound effects are made in code. With paid credits we could generate richer artwork and animate it the same way.
- **Shell edits:** don't write `\n` inside Python replacement strings in heredocs, because it turns into a real line break inside the code. Use the Edit tool or `|` markers instead.
- **Video 02 lessons:** two characters facing each other must not both point (their hands meet and it reads as a handshake). Keep about 540 px between them and give only one an arm out. Keep the camera focus at y 960 in the hook when the title sits at the top, or the art slides under the title. Long hadith on the scroll need `arabicSize` 76, `englishSize` 44, `contentTop` 235 and `stampBottom` 22. Captions light only one word at a time (overlapping word timings once glued "THEPRESCRIBEDWUDU" together).
- **Character options added:** `headTint` (red anger flush), `bulk` (strongman), poses `flex`, `lift`, `fists`, `accuse`, `calm`, style `MAN_STRONG`. Props: `Steam` (with colour), `ScribbleBubble`, `AngerMeter`, `Barbell`, `CrowdFigure`, `Door`, `Tap`, `Quran`, `WaitHand`, `Check`.
- **Mo's fixes so far:**
  - natural walking arms;
  - shorter logo rays and the logo moved up;
  - askbayan.org on the video;
  - "SHARE IT" centred;
  - the closing hadith as on-screen text.

## 11. Ideas for later

- Arabic version with a human voice, ideally Mo's own.
- More faceless characters: a woman in niqab, a child and a crowd.
- A generic template component, so a new video only needs a content file and three scene designs.
- A German render of the motion video (the German voice clips already exist).
- A paid voice (ElevenLabs) for a more natural sound.
