import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const brandRoot = join(here, "..");
const whisperDir = join(brandRoot, ".whisper");
const cli = join(whisperDir, "Release", "whisper-cli.exe");
const modelPath = join(whisperDir, "ggml-small.en.bin");
const voDir = join(brandRoot, "public", "vo");
mkdirSync(voDir, { recursive: true });

const files = [
  { id: "cheerful-face", file: "C:\\Users\\wiseflow\\Downloads\\Generated Audio November 12, 2026 - 5_22PM.wav" },
  { id: "secret-dua", file: "C:\\Users\\wiseflow\\Downloads\\Generated Audio November 12, 2026 - 5_22PM (1).wav" },
  { id: "small-deeds", file: "C:\\Users\\wiseflow\\Downloads\\Generated Audio November 12, 2026 - 5_22PM (2).wav" },
];

const SCENES = ["hook", "hadith", "explain1", "explain2", "close"];

for (const { id, file } of files) {
  console.log(`\n========================================`);
  console.log(`Processing ${id} from ${file}...`);

  const tmp16 = join(whisperDir, `full-${id}.wav`);
  const tmpOut = join(whisperDir, `full-${id}`);

  // Convert full audio to 16 kHz mono for whisper
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", file, "-ar", "16000", "-ac", "1", tmp16]);
  
  // Run whisper-cli
  execFileSync(cli, ["-m", modelPath, "-f", tmp16, "-l", "en", "-ojf", "-of", tmpOut, "-dtw", "small.en", "-np"], {
    stdio: ["ignore", "ignore", "ignore"],
  });

  const res = JSON.parse(readFileSync(`${tmpOut}.json`, "utf8"));
  const script = JSON.parse(readFileSync(join(brandRoot, "voiceover", `${id}.json`), "utf8"));

  // Collect tokens with timestamps
  const words = [];
  for (const seg of res.transcription) {
    for (const tok of seg.tokens) {
      if (tok.text.startsWith("[_") || !tok.text.trim()) continue;
      const start = (tok.t_dtw >= 0 ? tok.t_dtw * 10 : tok.offsets.from) / 1000;
      const end = tok.offsets.to / 1000;
      if (tok.text.startsWith(" ") || words.length === 0) words.push({ word: tok.text.trim(), start, end });
      else {
        words[words.length - 1].word += tok.text;
        words[words.length - 1].end = end;
      }
    }
  }

  console.log(`Total transcribed words: ${words.length}`);
  // Match the first word of each scene to find scene boundary start times
  const boundaries = [];
  let curWordIdx = 0;

  for (let sIdx = 0; sIdx < SCENES.length; sIdx++) {
    const sceneKey = SCENES[sIdx];
    const sceneText = script.scenes[sceneKey].en;
    const sceneFirstWords = sceneText.split(/\s+/).slice(0, 3).map(w => w.toLowerCase().replace(/[^\w]/g, ""));
    
    // Find where these words appear in transcribed words starting from curWordIdx
    let foundIdx = -1;
    for (let i = curWordIdx; i < words.length; i++) {
      const w0 = words[i].word.toLowerCase().replace(/[^\w]/g, "");
      if (w0 === sceneFirstWords[0]) {
        foundIdx = i;
        break;
      }
    }
    if (foundIdx === -1) {
      console.warn(`Could not find start of scene ${sceneKey}, fallback to word ${curWordIdx}`);
      foundIdx = curWordIdx;
    }
    const startTime = foundIdx === 0 ? 0 : Math.max(0, words[foundIdx].start - 0.2);
    boundaries.push({ scene: sceneKey, startWordIdx: foundIdx, startSec: startTime });
    curWordIdx = foundIdx + 1;
  }

  // Determine end times
  for (let i = 0; i < boundaries.length; i++) {
    if (i < boundaries.length - 1) {
      boundaries[i].endSec = boundaries[i + 1].startSec;
    } else {
      boundaries[i].endSec = words[words.length - 1].end + 0.5;
    }
  }

  console.log("Boundaries:", boundaries.map(b => `${b.scene}: ${b.startSec.toFixed(2)}s -> ${b.endSec.toFixed(2)}s`));

  // Slice each scene into wav and apply loudnorm & trimming
  const durations = {};
  for (const b of boundaries) {
    const wavOut = join(voDir, `${id}-en-${b.scene}.wav`);
    const duration = b.endSec - b.startSec;
    execFileSync("ffmpeg", [
      "-loglevel", "error", "-y",
      "-ss", b.startSec.toFixed(3),
      "-t", duration.toFixed(3),
      "-i", file,
      "-af", "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,loudnorm=I=-16:TP=-1.5:LRA=11",
      "-ar", "48000",
      wavOut,
    ]);

    const actualSec = Number(
      execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", wavOut]).toString().trim()
    );
    durations[b.scene] = Math.round(actualSec * 100) / 100;
    console.log(`Saved ${wavOut} (${durations[b.scene]}s)`);
  }

  // Update durations.json (removing estimated: true)
  const durJsonPath = join(brandRoot, "voiceover", `${id}-en.durations.json`);
  writeFileSync(durJsonPath, JSON.stringify(durations, null, 2) + "\n");
  console.log(`Updated ${durJsonPath}`);

  // Now run word-timings.mjs
  console.log(`Running word-timings.mjs for ${id} en...`);
  execFileSync("node", [join(brandRoot, "voiceover", "word-timings.mjs"), id, "en"], { stdio: "inherit" });
}

console.log("\nAll 3 audios split, leveled, and aligned successfully!");

