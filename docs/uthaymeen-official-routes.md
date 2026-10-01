# Ibn Uthaymeen: official routes (checked 2026-10-01)

## Search endpoint: still empty
`POST https://shekhcp.binothaimeen.net/api/search-data` with `{pageSize, searchTerm, type: "audios", page, mode: "exact" | "similar"}` returned zero results for the ordinary terms الصلاة, الزكاة and حكم, in both modes. It answers normally (HTTP 200, empty list), so it is an upstream problem, not a block.

## What works: section listings on the official API
Found by reading the site's own JavaScript (`https://binothaimeen.net/js/index.js`). Base: `https://shekhapi.binothaimeen.net/course/sections/audio_library`.

| Call | Gives |
|---|---|
| `/10` | top-level sections |
| `/children/<section id>?pageSize=500` | sub-sections with lesson counts |
| `/many_lessons/<section id>/50?page=N` | up to 50 whole lessons per request, each with the full Arabic text in `objective.content.ar` and the title in `title.ar` |
| `/lessons/audios/show/<lesson id>/0/1?getManySectionsWithAllParent=audio_library&getAllPaths=1` | one lesson by id (what the old collector used) |

The root section "اللقاءات والفتاوى" (id `59d21fb4-6758-4c4a-9240-440aca48eb59`) holds 13,591 lessons in 700 sub-sections: فتاوى نور على الدرب, لقاءات الباب المفتوح, اللقاء الشهري, اللقاء الشهري (الأشرطة), اللّقاءات الرمضانية, لقاءات الحج, الفتاوى الثلاثية, لقاءات الرياض 1420هـ. Other top-level sections (الشروحات العلمية, دروس الحرمين, المرأة, المحاضرات, الخطب) are not used.

The page link for each fatwa is built exactly as the earlier collector did: `https://binothaimeen.net/ar/voice_library/lessonDetails/<section title>/<lesson title>/<lesson id>`.

## How it is used
`scripts/collect-uthaymeen-batch.ts` walks the 700 sections in order, applies the same mechanical gates as the old collector (200 to 600 characters, no room talk, no question text, shared title word, near-duplicate and same-topic checks, tafsir lessons skipped) and writes batches of 50 candidates to `docs/uthaymeen-batches/`. Progress is in `state.json`, so it resumes. One request per 1.5 seconds. Each listing request replaces about 50 single-lesson requests.
