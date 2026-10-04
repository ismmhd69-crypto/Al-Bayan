"""Synthesised sound effects for the motion videos (no music, no licences needed).

THE SOUND SET IS FIXED (BAYAN_PLAN.md section 15): every video reuses the files in
public/sfx/ as they are, so the page always sounds the same. Do not rerun or edit
this script for a new video. Only add a NEW sound (new name) if one is truly missing.

Usage (from brand/):  python sfx/make_sfx.py
Writes 48 kHz mono WAVs to public/sfx/. Peaks are normalised to -3 dBFS;
loudness against the voice is set per use in the video (volume prop).
"""
import os
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "sfx")
rng = np.random.default_rng(7)


def t(sec):
    return np.arange(int(SR * sec)) / SR


def noise(sec):
    return rng.uniform(-1, 1, int(SR * sec))


def env(n, attack, release, curve=3.0):
    """Attack/release envelope over n samples (fractions of length)."""
    x = np.linspace(0, 1, n)
    a = np.clip(x / max(attack, 1e-6), 0, 1)
    r = np.clip((1 - x) / max(release, 1e-6), 0, 1) ** curve
    return a * r


def sweep_band(x, f_start, f_peak, f_end, q=1.4, steps=64):
    """Band-pass noise whose centre frequency glides start -> peak -> end."""
    n = len(x)
    out = np.zeros(n)
    edges = np.linspace(0, n, steps + 1).astype(int)
    for i in range(steps):
        p = i / steps
        f = f_start + (f_peak - f_start) * (p / 0.5) if p < 0.5 else f_peak + (f_end - f_peak) * ((p - 0.5) / 0.5)
        lo, hi = f / (1 + 1 / q), f * (1 + 1 / q)
        sos = signal.butter(2, [max(lo, 30), min(hi, SR / 2 - 100)], btype="band", fs=SR, output="sos")
        seg = signal.sosfilt(sos, x[max(0, edges[i] - 2000): edges[i + 1]])
        out[edges[i]: edges[i + 1]] = seg[-(edges[i + 1] - edges[i]):]
    return out


def lowpass(x, f, order=4):
    return signal.sosfilt(signal.butter(order, f, btype="low", fs=SR, output="sos"), x)


def highpass(x, f, order=4):
    return signal.sosfilt(signal.butter(order, f, btype="high", fs=SR, output="sos"), x)


def bandpass(x, lo, hi, order=3):
    return signal.sosfilt(signal.butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)


def glide_sine(sec, f0, f1, shape=6.0):
    tt = t(sec)
    f = f1 + (f0 - f1) * np.exp(-shape * tt / sec)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def bell(sec, f, partials=((1, 1.0), (2.76, 0.45), (5.4, 0.25), (8.93, 0.12)), decay=5.0):
    tt = t(sec)
    y = np.zeros_like(tt)
    for k, amp in partials:
        y += amp * np.sin(2 * np.pi * f * k * tt) * np.exp(-decay * k ** 0.6 * tt)
    return y * env(len(tt), 0.004, 1.0, 1)


def pad(x, sec=0.05):
    return np.concatenate([x, np.zeros(int(SR * sec))])


def save(name, x, peak_db=-3.0):
    x = x - np.mean(x)
    x = x / (np.max(np.abs(x)) + 1e-9) * 10 ** (peak_db / 20)
    os.makedirs(OUT, exist_ok=True)
    wavfile.write(os.path.join(OUT, f"{name}.wav"), SR, (pad(x) * 32767).astype(np.int16))
    print(name, f"{len(x) / SR:.2f}s")


# Whooshes: swept band-passed noise with a swell.
w = sweep_band(noise(0.65), 250, 2400, 500, q=1.2)
save("whoosh", w * env(len(w), 0.55, 0.45, 2))

w = sweep_band(noise(0.28), 600, 4200, 1200, q=1.0)
save("whip", w * env(len(w), 0.35, 0.65, 2))

w = sweep_band(noise(1.3), 150, 1800, 3800, q=1.6)
save("rise", w * env(len(w), 0.9, 0.12, 1.5))

w = sweep_band(noise(0.35), 2500, 5000, 1800, q=1.3)
save("swipe", w * env(len(w), 0.2, 0.8, 2))

# Pops: quick pitch-dropping sine plus a tiny click.
for name, f0, f1, sec in (("pop", 1100, 280, 0.13), ("pop_high", 1700, 600, 0.1), ("bubble", 500, 1300, 0.16)):
    y = glide_sine(sec, f0, f1, 7 if f1 < f0 else 3) * env(int(SR * sec), 0.02, 0.98, 4)
    click = highpass(noise(0.004), 3000) * 0.4
    y[: len(click)] += click
    save(name, y)

# Soft hit / impact: low sine drop + noise transient.
y = glide_sine(0.5, 140, 45, 9) * env(int(SR * 0.5), 0.005, 1.0, 3)
y += lowpass(noise(0.5), 900) * env(int(SR * 0.5), 0.002, 0.15, 3) * 0.6
save("hit", y)

# Stamp: thud + paper slap.
y = glide_sine(0.35, 220, 70, 10) * env(int(SR * 0.35), 0.003, 1.0, 4)
y += bandpass(noise(0.35), 400, 3000) * env(int(SR * 0.35), 0.002, 0.12, 2) * 0.9
save("stamp", y)

# Paper unroll: crinkly gated noise.
n = noise(0.9)
gate = (rng.uniform(0, 1, int(0.9 * 140)) > 0.45).astype(float)
gate = np.repeat(gate, int(np.ceil(len(n) / len(gate))))[: len(n)]
gate = lowpass(gate, 120, 2)
y = highpass(n, 1500) * gate * env(len(n), 0.08, 0.4, 1.5)
save("paper", y)

# Pen scratch: narrow noise with jittery strokes.
n = noise(1.0)
strokes = 0.5 + 0.5 * np.sin(2 * np.pi * 7 * t(1.0) + rng.uniform(0, 1) * 6) ** 2
y = bandpass(n, 2500, 6500) * lowpass(strokes, 30, 2) * env(len(n), 0.05, 0.15, 1)
save("scratch", y)

# Marker strike: rising scratchy swipe.
y = sweep_band(noise(0.32), 1500, 3500, 5000, q=2.0) * env(int(SR * 0.32), 0.1, 0.3, 1.5)
save("strike", y)

# Heartbeat: lub-dub.
beat = lambda f, sec: glide_sine(sec, f * 1.6, f, 8) * env(int(SR * sec), 0.02, 1.0, 3)
y = np.zeros(int(SR * 0.9))
lub, dub = beat(60, 0.22), beat(75, 0.18) * 0.7
y[: len(lub)] += lub
y[int(SR * 0.28): int(SR * 0.28) + len(dub)] += dub
save("heartbeat", lowpass(y, 300))

# Footstep: short low click.
y = lowpass(noise(0.12), 700) * env(int(SR * 0.12), 0.01, 0.9, 6)
y += glide_sine(0.12, 120, 60, 10) * env(int(SR * 0.12), 0.005, 1.0, 5) * 0.6
save("step", y)

# Sparkle ding and closing chime.
save("ding", bell(0.9, 1760, decay=4.5))
y = np.zeros(int(SR * 0.7))
for i, f in enumerate((2637, 3136, 3951)):
    b = bell(0.45, f, decay=9) * 0.6
    s = int(SR * 0.06 * i)
    y[s: s + len(b)] += b
save("sparkle", y)
y = np.zeros(int(SR * 1.8))
for s, f in ((0, 1046.5), (0.16, 1568), (0.32, 2093)):
    b = bell(1.4, f, decay=2.6)
    i = int(SR * s)
    y[i: i + len(b)] += b
save("chime", y)

# Tick for type-on text.
save("tick", highpass(noise(0.02), 2500) * env(int(SR * 0.02), 0.05, 0.95, 4))
