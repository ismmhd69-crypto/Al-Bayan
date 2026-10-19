"""Render review stills across every scene of a reel and join them into one sheet.

Usage (from brand/): python scripts/contact-sheet.py <CompositionId> <durations.json> <out.png> [per_scene] [--frames=a,b,c]
Picks evenly spaced moments inside each scene (skipping the whip transitions), or the given frames.
Bundles once (out/_bundle) and renders every still with one browser (scripts/stills.mjs).
"""
import json
import os
import subprocess
import sys

from PIL import Image

args = [a for a in sys.argv[1:] if not a.startswith("--")]
opts = dict(a[2:].split("=", 1) for a in sys.argv[1:] if a.startswith("--"))
comp, dur_file, out = args[0], args[1], args[2]
per = int(args[3]) if len(args) > 3 else 3
d = json.load(open(dur_file, encoding="utf8"))
LEAD = 0.35
tails = {"hook": 0.45, "hadith": 0.95, "explain1": 0.8, "explain2": 0.95, "close": 4.2}
t0 = 0.0
times = []
for k in ["hook", "hadith", "explain1", "explain2", "close"]:
    length = LEAD + d[k] + tails[k]
    for i in range(per):
        times.append(t0 + 0.45 + (length - 0.8) * (i + 1) / (per + 1) * 1.15 if i == per - 1 else t0 + 0.45 + (length - 0.8) * (i + 1) / (per + 1))
    t0 += length
frames = [int(f) for f in opts["frames"].split(",")] if "frames" in opts else [int(t * 30) for t in times]
if "frames" in opts:
    per = min(len(frames), 4)
tmp = os.path.join(os.path.dirname(out) or ".", "_sheet")
bundle = os.path.join("out", "_bundle")
sh = os.name == "nt"
subprocess.run(["npx", "remotion", "bundle", f"--out-dir={bundle}", "--log=error"], check=True, shell=sh)
subprocess.run(["node", "scripts/stills.mjs", bundle, comp, tmp, *map(str, frames)], check=True, shell=sh, stdout=subprocess.DEVNULL)
ims = [Image.open(os.path.join(tmp, f"{comp}-{f}.png")) for f in frames]
w, h = ims[0].size
cols = per
rows = (len(ims) + cols - 1) // cols
sheet = Image.new("RGB", (w * cols, h * rows))
for i, im in enumerate(ims):
    sheet.paste(im, ((i % cols) * w, (i // cols) * h))
sheet.resize((w * cols * 2 // 5, h * rows * 2 // 5)).save(out)
print(out, frames)
