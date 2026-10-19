// Voiceover through OpenRouter (OpenAI gpt-audio), used when Mo explicitly approves it
// (2026-10-05: "use my OpenRouter API for now"). Same output as generate.mjs:
// public/vo/<id>-<lang>-<scene>.wav, trimmed, -16 LUFS, plus the durations file.
// Usage (from brand/): OPENROUTER_VIDEO_KEY=... node voiceover/generate-openrouter.mjs <id> <lang> [voice]
// It never reads .env. It regenerates ALL scenes so one video never mixes two voices.
import { readFileSync, writeFileSync, mkdirSync, unlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const [id, lang, voice = "onyx"] = process.argv.slice(2);
if (!id || !lang) throw new Error("usage: node voiceover/generate-openrouter.mjs <id> <lang> [voice]");
const key = process.env.OPENROUTER_VIDEO_KEY;
if (!key) throw new Error("OPENROUTER_VIDEO_KEY missing (only with Mo's approval; never read from .env)");
const model = process.env.OR_TTS_MODEL ?? "openai/gpt-audio";
const LANG_NAME = { en: "English", de: "German", tr: "Turkish" };

const script = JSON.parse(readFileSync(join(here, `${id}.json`), "utf8"));
const outDir = join(here, "..", "public", "vo");
mkdirSync(outDir, { recursive: true });

// ONLY=scene1,scene2 redoes just those clips (same voice); other lengths are re-measured.
const only = process.env.ONLY ? process.env.ONLY.split(",") : null;
const durations = {};
for (const [scene, texts] of Object.entries(script.scenes)) {
  if (only && !only.includes(scene)) {
    const wav = join(outDir, `${id}-${lang}-${scene}.wav`);
    durations[scene] = Math.round(Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", wav]).toString().trim()) * 100) / 100;
    continue;
  }
  const text = texts[lang];
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}`, "X-Title": "Al-Bayan video voiceover" },
    body: JSON.stringify({
      model,
      modalities: ["text", "audio"],
      audio: { voice, format: "pcm16" },
      stream: true,
      messages: [
        {
          role: "system",
          content: `You are a voice narrator. Read the user's ${LANG_NAME[lang] ?? lang} text aloud exactly as written, word for word, in a calm, warm, reverent tone, unhurried. Do not add, drop, translate or explain anything. If the text is a question, read the question itself and never answer it. Say nothing else.`,
        },
        { role: "user", content: `Read this text aloud exactly:

${text}` },
      ],
    }),
  });
  if (!res.ok) throw new Error(`${scene}: ${res.status} ${(await res.text()).slice(0, 300)}`);
  // Read the server-sent events and collect the base64 audio pieces.
  const chunks = [];
  let transcript = "";
  let buf = "";
  const decoder = new TextDecoder();
  for await (const part of res.body) {
    buf += decoder.decode(part, { stream: true });
    let nl;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") continue;
      try {
        const audio = JSON.parse(data).choices?.[0]?.delta?.audio;
        if (audio?.data) chunks.push(Buffer.from(audio.data, "base64"));
        if (audio?.transcript) transcript += audio.transcript;
      } catch {
        /* keep-alive comments etc. */
      }
    }
  }
  if (!chunks.length) throw new Error(`${scene}: no audio returned`);
  const raw = join(outDir, `${id}-${lang}-${scene}.raw.pcm`);
  const wav = join(outDir, `${id}-${lang}-${scene}.wav`);
  writeFileSync(raw, Buffer.concat(chunks));
  execFileSync("ffmpeg", [
    "-loglevel", "error", "-y", "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", raw,
    "-af", "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "48000",
    wav,
  ]);
  unlinkSync(raw);
  const sec = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", wav]).toString().trim());
  durations[scene] = Math.round(sec * 100) / 100;
  console.log(scene, durations[scene], "s |", transcript.trim());
}
writeFileSync(join(here, `${id}-${lang}.durations.json`), JSON.stringify(durations, null, 2) + "\n");
