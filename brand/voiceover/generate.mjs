// Makes one voiceover clip per scene with Gemini speech, then writes the
// clip lengths so the video can time each scene to its voice.
// Usage (from brand/): node voiceover/generate.mjs bukhari-1 en
// Needs GEMINI_API_KEY (read from ../.env). Clips go to public/vo/<id>-<lang>-<scene>.wav
import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const [id, lang] = process.argv.slice(2);
if (!id || !lang) throw new Error("usage: node voiceover/generate.mjs <id> <en|de>");

const envFile = join(here, "..", "..", ".env");
const key =
  process.env.GEMINI_API_KEY ??
  readFileSync(envFile, "utf8").match(/^GEMINI_API_KEY=(.*)$/m)?.[1]?.trim().replace(/^["']|["']$/g, "");
if (!key) throw new Error("GEMINI_API_KEY missing");

// Free-tier speech quotas are small (about 10 a day per model), so the model can be chosen per run.
// Fixed per language so every video sounds the same (BAYAN_PLAN.md section 15).
// Do not change these or the voice "Charon"; if the daily quota runs out, wait a day.
const MODEL_BY_LANG = { en: "gemini-3.1-flash-tts-preview", de: "gemini-2.5-flash-preview-tts" };
const model = process.env.TTS_MODEL ?? MODEL_BY_LANG[lang] ?? MODEL_BY_LANG.en;
const script = JSON.parse(readFileSync(join(here, `${id}.json`), "utf8"));
const outDir = join(here, "..", "public", "vo");
mkdirSync(outDir, { recursive: true });

const durations = {};
for (const [scene, texts] of Object.entries(script.scenes)) {
  const wav = join(outDir, `${id}-${lang}-${scene}.wav`);
  if (!existsSync(wav) || process.env.FORCE) {
    let res;
    for (let attempt = 0; ; attempt++) {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        // Text only: any instruction in the prompt gets read aloud.
        contents: [{ parts: [{ text: texts[lang] }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: script.voice } } },
        },
      }),
      });
      if (res.status !== 429 || attempt >= 2) break;
      console.log(scene, "rate limited, waiting 65 s");
      await new Promise((r) => setTimeout(r, 65000));
    }
    if (!res.ok) throw new Error(`${scene}: ${res.status} ${(await res.text()).slice(0, 300)}`);
    const json = await res.json();
    const part = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
    if (!part) throw new Error(`${scene}: no audio returned`);
    const mime = part.inlineData.mimeType;
    const isWav = /wav/i.test(mime);
    const raw = join(outDir, `${id}-${lang}-${scene}.raw${isWav ? ".wav" : ".pcm"}`);
    writeFileSync(raw, Buffer.from(part.inlineData.data, "base64"));
    const rate = String(Number(mime.match(/rate=(\d+)/)?.[1] ?? 24000));
    // Older models send raw 16-bit PCM, newer ones a WAV file. Trim silence at both ends and
    // bring every clip to the same loudness (-16 LUFS, usual for social video).
    const input = isWav ? ["-i", raw] : ["-f", "s16le", "-ar", rate, "-ac", "1", "-i", raw];
    execFileSync("ffmpeg", [
      "-loglevel", "error", "-y", ...input,
      "-af", "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "48000",
      wav,
    ]);
    unlinkSync(raw);
    await new Promise((r) => setTimeout(r, 8000)); // stay under the per-minute limit
  }
  const sec = Number(
    execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", wav]).toString().trim(),
  );
  durations[scene] = Math.round(sec * 100) / 100;
  console.log(scene, durations[scene], "s");
}

writeFileSync(join(here, `${id}-${lang}.durations.json`), JSON.stringify(durations, null, 2) + "\n");
