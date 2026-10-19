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
const script = JSON.parse(readFileSync(join(here, `${id}.json`), "utf8"));
const SCENES = ["hook", "hadith", "explain1", "explain2", "close"];

// Same folding as ReelKit's norm(): letters only, accents and Turkish dotless i folded.
const fold = (w) => w.replace(/İ/g, "i").replace(/ı/g, "i").toLowerCase().normalize("NFD").replace(/[^\p{L}]/gu, "");
const similar = (a, b) => {
  if (a === b) return 1;
  if (!a || !b) return 0;
  // Levenshtein ratio
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return 1 - d[m][n] / Math.max(m, n);
};

/**
 * Keep the SCRIPT's spelling (captions never show misheard words) and take the
 * timing from the transcript: align the two word lists, copy times across, and
 * interpolate times for script words the transcript missed.
 */
const alignToScript = (text, heard) => {
  const tokens = text.split(/\s+/).filter(Boolean);
  const A = tokens.map(fold), B = heard.map((w) => fold(w.word));
  const n = A.length, m = B.length;
  const S = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) {
    const sim = similar(A[i - 1], B[j - 1]);
    S[i][j] = Math.max(S[i - 1][j], S[i][j - 1], S[i - 1][j - 1] + (sim >= 0.6 ? sim : -1));
  }
  const match = Array(n).fill(-1);
  for (let i = n, j = m; i > 0 && j > 0; ) {
    const sim = similar(A[i - 1], B[j - 1]);
    if (sim >= 0.6 && S[i][j] === S[i - 1][j - 1] + sim) { match[i - 1] = j - 1; i--; j--; }
    else if (S[i][j] === S[i - 1][j]) i--;
    else j--;
  }
  const outW = tokens.map((word, i) => (match[i] >= 0 ? { word, start: heard[match[i]].start, end: heard[match[i]].end } : { word, start: NaN, end: NaN }));
  // Fill gaps evenly between the nearest matched neighbours.
  for (let i = 0; i < n; i++) {
    if (!Number.isNaN(outW[i].start)) continue;
    let k = i;
    while (k < n && Number.isNaN(outW[k].start)) k++;
    const from = i > 0 ? outW[i - 1].end : 0;
    const to = k < n ? outW[k].start : (heard.length ? heard[heard.length - 1].end : from + 0.5);
    const step = (to - from) / (k - i + 1);
    for (let q = i; q < k; q++) outW[q] = { word: tokens[q], start: from + step * (q - i + 0.5), end: from + step * (q - i + 1) };
  }
  const matched = match.filter((x) => x >= 0).length;
  return { words: outW, matched, total: n };
};

const out = {};
for (const scene of SCENES) {
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
  // Show what was heard (to check the voice), then store the script's words with those times.
  console.log(scene, "heard:", words.map((w) => `${w.word}@${w.start.toFixed(2)}`).join(" "));
  const text = script.scenes[scene]?.[lang];
  const aligned = text ? alignToScript(text, words) : { words, matched: words.length, total: words.length };
  if (text) console.log(scene, `matched ${aligned.matched}/${aligned.total} script words`);
  out[scene] = aligned.words.map((w) => ({ ...w, start: Math.round(w.start * 100) / 100, end: Math.round(w.end * 100) / 100 }));
}
writeFileSync(join(here, `${id}-${lang}.words.json`), JSON.stringify(out, null, 1) + "\n");
