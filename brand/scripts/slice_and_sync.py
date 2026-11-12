import os
import json
import wave
import subprocess

FILES = {
    "cheerful-face": {
        "src": r"C:\Users\wiseflow\Downloads\Generated Audio November 12, 2026 - 5_22PM.wav",
        "cuts": {
            "hook": (0.00, 5.02),
            "hadith": (5.02, 15.36),
            "explain1": (15.36, 31.44),
            "explain2": (31.44, 43.98),
            "close": (43.98, 46.96)
        }
    },
    "secret-dua": {
        "src": r"C:\Users\wiseflow\Downloads\Generated Audio November 12, 2026 - 5_22PM (1).wav",
        "cuts": {
            "hook": (0.00, 5.16),
            "hadith": (5.16, 24.72),
            "explain1": (24.72, 40.40),
            "explain2": (40.40, 52.76),
            "close": (52.76, 55.88)
        }
    },
    "small-deeds": {
        "src": r"C:\Users\wiseflow\Downloads\Generated Audio November 12, 2026 - 5_22PM (2).wav",
        "cuts": {
            "hook": (0.00, 7.00),
            "hadith": (7.00, 20.00),
            "explain1": (20.00, 33.00),
            "explain2": (33.00, 46.00),
            "close": (46.00, 48.96)
        }
    }
}

VO_DIR = r"brand\public\vo"
os.makedirs(VO_DIR, exist_ok=True)

for vid, info in FILES.items():
    print(f"\n==========================================")
    print(f"Slicing and leveling {vid}...")
    src = info["src"]
    durations = {}

    for scene, (start, end) in info["cuts"].items():
        dst = os.path.join(VO_DIR, f"{vid}-en-{scene}.wav")
        duration = end - start
        
        # Frame accurate slice
        cmd = [
            "ffmpeg", "-loglevel", "error", "-y",
            "-i", src,
            "-ss", str(start),
            "-t", str(duration),
            "-af", "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,loudnorm=I=-16:TP=-1.5:LRA=11",
            "-ar", "48000",
            dst
        ]
        subprocess.run(cmd, check=True)
        
        with wave.open(dst, "rb") as w:
            sec = w.getnframes() / float(w.getframerate())
        durations[scene] = round(sec, 2)
        print(f"  {scene}: {durations[scene]}s -> {dst}")

    # Write durations.json
    dur_file = os.path.join(r"brand\voiceover", f"{vid}-en.durations.json")
    with open(dur_file, "w", encoding="utf-8") as f:
        json.dump(durations, f, indent=2)
    print(f"Wrote {dur_file}")

    # Run word-timings.mjs
    print(f"Running word-timings for {vid}...")
    subprocess.run(["node", r"voiceover/word-timings.mjs", vid, "en"], cwd="brand", check=True)

print("\nAll audio slices and word timings completed successfully!")
