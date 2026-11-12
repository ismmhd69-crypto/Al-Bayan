# Al-Bayan Daily Video Workflow & Rules

This protocol governs the production of the 3 daily Al-Bayan videos.

## Core Content Principles
1. **Topics:** Authentic, gentle, heartwarming, and reward-bringing hadiths of the Prophet ﷺ (deeds, character, brotherhood, consistency, prayer, remembrance, mercy, forgiveness).
2. **Hadith Authenticity:** Strictly Sahih or Hasan from Bukhari, Muslim, or authentic sunnah collections verified in `data/sunnah/`.
3. **Scholarly Commentary:** Strictly from approved scholars: Shaykh Ibn Baz, Shaykh Ibn Uthaymeen, Shaykh al-Albani, Shaykh al-Barrak, Shaykh Othman al-Khamis.
4. **Al-Bayan Aesthetic:**
   - 1080x1920 vertical video (9:16), 30 fps.
   - Background `#1b2d66` with gold accents `#d4a852` and star lattice.
   - Faceless vector characters in thobe and kufi cap.
   - Voice: Gemini **Charon** (calm pace, natural pause).
   - Sound: SFX only, no music. Final audio normalized to -16 LUFS.
   - Fixed closing scene with askbayan.org and Sahih Muslim 1893.

---

## Daily 6-Step Production Protocol

### Step 1: Script & Topic Creation
- Pick 3 distinct, uplifting hadith topics.
- Write each video following the 5-scene structure:
  1. `hook` (punchy question/statement)
  2. `hadith` (Prophet's words with Arabic line wipes)
  3. `explain1` (first scholar insight)
  4. `explain2` (second scholar insight or practical takeaway)
  5. `close` ("Share it, and may Allah accept your deeds.")
- Provide full continuous scripts for AI Studio voice generation with Charon.

### Step 2: Visual Implementation & The Frame Inspection Rule (MANDATORY)
- Implement each video component (`<Name>Motion.tsx`) and hadith data (`<name>-motion.ts`).
- Register each reel in `Root.tsx` under `Social` and `Covers`.
- **The Frame Inspection Rule:**
  - MUST generate contact sheets across all scenes (`python scripts/contact-sheet.py ...`).
  - MUST visually inspect the rendered frames using agent image reading (`read_file`).
  - Verify that:
    - Background rays and foreground elements (hearts, stars, books) are **100% concentric** and share the exact center coordinates.
    - Characters face each other naturally with `breathe(POSES.stand)` and proper horizontal mirroring (`scaleX(-1)`).
    - Arms never swing out into space; `walk()` amount must remain at 1.0.
    - All text, badges, and pills remain strictly within safe margins (away from the top 250px and bottom 250px UI bounds).

### Step 3: Audio Slicing & Whisper Alignment
- When full voiceover audio files are provided from AI Studio, run the automatic slicer (`brand/scripts/slice_and_sync.py`).
- Slices the full audio into scene wavs in `brand/public/vo/<id>-en-<scene>.wav`.
- Normalizes volume to -16 LUFS with `loudnorm` and trims silences.
- Measures real scene durations in `<id>-en.durations.json`.
- Runs `whisper-cli` locally via `voiceover/word-timings.mjs` to map exact millisecond word timestamps to captions and animations.

### Step 4: Final Visual Inspection with Real Timings
- Re-render contact sheets with the final real audio timings.
- Verify that every scene transition, word highlight, and prop action matches the spoken words.

### Step 5: High-Resolution Rendering
- Render full vertical MP4s:
  `npx remotion render <CompId> out/videos/<id>/<id>.mp4`
- Render covers:
  `npx remotion still Cover-<id> out/videos/<id>/cover.png`

### Step 6: Delivery to Google Drive
- Create `G:\My Drive\Al-bayan\Day <N>\` folder.
- Move/copy all rendered MP4s and cover images into the folder.
- Confirm delivery to the user with direct links.

