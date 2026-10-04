// Word-level timings for each voice clip, using whisper.cpp locally (free, offline).
// Usage (from brand/): node voiceover/word-timings.mjs bukhari-1 en
// Writes voiceover/<id>-<lang>.words.json: { scene: [{ word, start, end }] } in seconds.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { downloadWhisperModel, installWhisperCpp } from "@remotion/install-whisper-cpp";

const here = dirname(fileURLToPath(import.meta.url));
const [id, lang] = process.argv.slice(2);
if (!id || !lang) throw new Error("usage: node voiceover/word-timings.mjs <id> <lang>");
const whisperDir = join(here, "..", ".whisper");
const model = lang === "en" ? "small.en" : "small";

// The Windows release unpacks to Release/, which the helper does not expect, so
// only install when no executable exists, then call whisper-cli directly.
const exe = [join(whisperDir, "Release", "whisper-cli.exe"), join(whisperDir, "build", "bin", "whisper-cli")].find(existsSync);
if (!exe) await installWhisperCpp({ to: whisperDir, version: "1.7.6" });
await downloadWhisperModel({ folder: whisperDir, model });
const cli = exe ?? [join(whisperDir, "Release", "whisper-cli.exe"), join(whisperDir, "build", "bin", "whisper-cli")].find(existsSync);

const durations = JSON.parse(readFileSync(join(here, `${id}-${lang}.durations.json`), "utf8"));
const out = {};
for (const scene of Object.keys(durations)) {
  const wav = join(here, "..", "public", "vo", `${id}-${lang}-${scene}.wav`);
  const w16 = join(whisperDir, `tmp-${scene}.wav`);
  const base = join(whisperDir, `tmp-${scene}`);
  // whisper.cpp wants 16 kHz mono.
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", wav, "-ar", "16000", "-ac", "1", w16]);
  execFileSync(cli, ["-m", join(whisperDir, `ggml-${model}.bin`), "-f", w16, "-l", lang, "-ojf", "-of", base, "-dtw", model, "-np"], {
    stdio: ["ignore", "ignore", "ignore"],
  });
  const res = JSON.parse(readFileSync(`${base}.json`, "utf8"));
  // Merge tokens into words (a token starting with a space begins a new word).
  const words = [];
  for (const seg of res.transcription) {
    for (const tok of seg.tokens) {
      if (tok.text.startsWith("[_") || !tok.text.trim()) continue;
      // Prefer the DTW timestamp (more precise) for the start when present.
      const start = (tok.t_dtw >= 0 ? tok.t_dtw * 10 : tok.offsets.from) / 1000;
      const end = tok.offsets.to / 1000;
      if (tok.text.startsWith(" ") || words.length === 0) words.push({ word: tok.text.trim(), start, end });
      else {
        words[words.length - 1].word += tok.text;
        words[words.length - 1].end = end;
      }
    }
  }
  out[scene] = words.map((w) => ({ ...w, start: Math.round(w.start * 100) / 100, end: Math.round(w.end * 100) / 100 }));
  console.log(scene, words.map((w) => `${w.word}@${w.start.toFixed(2)}`).join(" "));
}
writeFileSync(join(here, `${id}-${lang}.words.json`), JSON.stringify(out, null, 1) + "\n");
