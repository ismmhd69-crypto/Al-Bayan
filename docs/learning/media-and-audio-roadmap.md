# Bayan Learning Course: Media & Audio Enhancement Roadmap

This document outlines all recommended audio recitations, interactive visual guides, and diagrams across the 32 lessons of the **New to Islam** learning curriculum.

---

## 1. Completed Visual Media

| Lesson | Title | Implementation | Assets |
|---|---|---|---|
| **Lesson 14** | *How do I prepare and make wudu?* | 6 authentic photographic step cards with dual-image layout for mouth/nose and head/ears, posture tags, step badges, and recitation guides. | `/assets/prayer/wudu_wash_hands.png`<br>`/assets/prayer/wudu_rinse_mouth.png`<br>`/assets/prayer/wudu_into_nose.png`<br>`/assets/prayer/wudu_wash_face.png`<br>`/assets/prayer/wudu_wash_arms.png`<br>`/assets/prayer/wudu_wash_hair.png`<br>`/assets/prayer/wudu_clean_ears.png`<br>`/assets/prayer/wudu_wash_feet.png` |
| **Lesson 15** | *How do I pray, from beginning to end?* | 10 numbered prayer step cards with posture photos, Tashahhud posture banner, and concluding Taslim card. | `/assets/prayer/salat_positions_chart.jpg`<br>`/assets/prayer/step1_takbir.jpg`<br>`/assets/prayer/step2_qiyam.jpg`<br>`/assets/prayer/step3_ruku.jpg`<br>`/assets/prayer/step4_itidal.jpg`<br>`/assets/prayer/step5_sujud.jpg`<br>`/assets/prayer/step6_jalsah.jpg`<br>`/assets/prayer/step7_tashahhud.jpg`<br>`/assets/prayer/step8_taslim.jpg` |

---

## 2. Priority Audio Enhancements

Adding small, dignified "Play" audio buttons allows converts and beginners to hear correct Arabic pronunciation and learn with confidence.

### Priority 1: Prayer Recitation Audio (Lesson 15)
*Target: Each posture card and recitation box in `how-to-pray`.*
- [x] **Step 2 — Takbir:** `Allahu Akbar`
- [x] **Step 3 — Al-Fatihah:** Full verse-by-verse recitation with pauses.
- [x] **Step 4 — Ruku:** `Subhana Rabbiyal-'Azim` (spoken 3 times).
- [x] **Step 5 — Rising from Ruku:** `Sami'a Allahu liman hamidah` (while rising) and `Rabbana wa lakal-hamd` (when upright).
- [x] **Step 6 & 8 — Sujud:** `Subhana Rabbiyal-A'la` (spoken 3 times).
- [x] **Step 7 — Sitting between prostrations:** `Rabbighfir li, Rabbighfir li`.
- [x] **Step 10 — The Sitting Testimony (Tashahhud):** Full slow recitation of `At-tahiyyatu lillahi...` followed by the Salawat on the Prophet.
- [x] **Conclusion — Taslim:** `As-salamu 'alaykum wa rahmatullah` (turning right, then left).

### Priority 2: Declaration of Faith (Lesson 8 — `becoming-muslim`)
*Target: Under "The declaration in Arabic".*
- [x] **Shahadah:** Authentic audio player with speed toggle (1x / 0.8x) and recitation meaning cards (`/public/audio/shahadah.mp3`).

### Priority 3: Remembrance for Beginners (Lesson 16 — `learning-arabic`)
*Target: For someone unable to recite Al-Fatihah yet.*
- [x] **Surah Al-Fatihah Training (`FatihahTrainer.tsx`):** 7-verse sentence-by-sentence audio player with speed controls and full Surah recitation (`/public/audio/fatihah/*.mp3`, `/public/audio/fatihah_full.mp3`).

### Priority 4: Wudu Supplications (Lesson 14 — `wudu`)
- [x] Photographic step-by-step guidance with posture tags, step badges, and recitation guides.

### Priority 5: The Call to Prayer (Lesson 13 — `daily-prayer-times`)
- [x] **Adhan Audio:** Melodious Adhan audio player (`/public/audio/adhan.mp3`).
- [x] **Daylight Sky Arc:** Interactive celestial timeline of the 5 prayer windows.

### Priority 6: Key Prophetic Supplications
- [x] **Lesson 18 (`making-dua`):** Foundational Quranic supplication recitation (`/public/audio/rabbana_atina.mp3`) + 4 Prophetic Etiquettes of Dua visual.
- [x] **Lesson 25 (`ramadan`):** 24-hour Fasting Day Cycle timeline + authentic Iftar du'a guide.
- [x] **Lesson 27 (`hajj`):** Sacred Stations of Hajj journey flow + Talbiyah chant audio player (`/public/audio/talbiyah.mp3`).

---

## 3. Priority Visuals, Diagrams & Infographics

Replacing or augmenting text tables and abstract concepts with visual diagrams:

### 1. Daylight & Prayer Times Sky Arc (Lesson 13 — `daily-prayer-times`)
- **Type:** Responsive SVG/CSS daylight arc diagram.
- **Content:**
  - Sky gradient showing night, dawn, sunrise, noon, afternoon, sunset, and twilight.
  - Prayer windows pinned to celestial markers:
    - **Fajr:** Between true dawn and sunrise.
    - **Dhuhr:** Sun just passing its zenith (midday).
    - **Asr:** Shadow boundary (object height + noon shadow).
    - **Maghrib:** Sunset to disappearance of red twilight.
    - **Isha:** Twilight fade until middle of the night.
  - Visual distinction between ordinary window and necessity period.

### 2. Architecture of the 5 Pillars (Lesson 11 — `five-pillars`)
- **Type:** Clean architectural diagram.
- **Content:**
  - Foundation: **Shahadah** (Faith in One God & His Messenger).
  - Four pillars supported by it: **Salah** (Daily connection), **Zakah** (Purification of wealth), **Sawm** (Self-restraint in Ramadan), **Hajj** (Lifelong pilgrimage).

### 3. Six Foundations of Faith Grid (Lesson 7 — `muslim-beliefs`)
- **Type:** Illustrated card grid.
- **Content:**
  - 1. Allah (Tawhid)
  - 2. Angels (Mala'ikah)
  - 3. Revealed Books (Kutub)
  - 4. Messengers & Prophets (Rusul)
  - 5. The Last Day (Yawm al-Qiyamah)
  - 6. Divine Decree (Qadar)

### 4. Fasting Day Timeline (Lesson 25 — `ramadan`)
- **Type:** Horizontal chronological timeline.
- **Content:**
  - **Suhur:** Pre-dawn meal before Fajr.
  - **Fast Begins:** At true dawn (Fajr).
  - **Daytime Hours:** Restraint from food, drink, and marital relations; mindfulness and prayer.
  - **Iftar:** Fast broken immediately at sunset (Maghrib).
  - **Night:** Dinner, Taraweeh prayer, and reflection.

### 5. Stations of Hajj Journey Map (Lesson 27 — `hajj`)
- **Type:** Geographic journey flow.
- **Content:**
  - 1. **Ihram** at the Miqat boundary.
  - 2. **Makkah & Kaaba:** Tawaf and Sa'i.
  - 3. **Mina:** Day of Tarwiyah.
  - 4. **Plain of Arafat:** The core pillar of Hajj.
  - 5. **Muzdalifah:** Overnight stay.
  - 6. **Jamarat & Eid al-Adha:** Rami, sacrifice, shaving/trimming, Tawaf al-Ifadah.

### 6. Etiquette of Supplication (Lesson 18 — `making-dua`)
- **Type:** Visual etiquette card.
- **Content:**
  - Facing the Qiblah.
  - Raising hands with palms facing upward.
  - Starting with praise of Allah and blessings on the Prophet.
  - Asking with humble certainty and focus.

---

## 4. Technical Implementation Architecture

1. **Audio Storage:**
   - Place audio files under `public/audio/{prayer,quran,dhikr}/` as clean `.mp3` / `.webm` audio files.
2. **Audio Player Component:**
   - Create a lightweight `<AudioPlayButton src="..." label="..." />` component.
   - Support Play/Pause, speed toggle (1x / 0.75x for beginners), and repeat loop.
   - Non-intrusive UI matching Bayan's gold/emerald aesthetic.
3. **Preservation Rule:**
   - All original manuscript text, references, and scholarly citations remain untouched.
   - Audio and visuals serve as pedagogical aids directly attached to the existing text.
