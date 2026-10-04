import { Easing, interpolate } from "remotion";

// Small animation helpers shared by the motion videos. Times are in seconds.

export const ease = Easing.bezier(0.16, 1, 0.3, 1); // fast out, soft landing
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0..1 progress between two times. */
export const prog = (t: number, a: number, b: number, e = ease) => interpolate(t, [a, b], [0, 1], { ...clamp, easing: e });

/** Keyframes: [[time, value], ...] with easing between each pair. */
export const keys = (t: number, k: [number, number][], e = easeInOut): number => {
  if (t <= k[0][0]) return k[0][1];
  for (let i = 0; i < k.length - 1; i++) {
    const [t0, v0] = k[i];
    const [t1, v1] = k[i + 1];
    if (t <= t1) return v0 + (v1 - v0) * e((t - t0) / Math.max(t1 - t0, 1e-6));
  }
  return k[k.length - 1][1];
};

/** Damped spring settling from 0 to 1, starting at `start`. Overshoots a little. */
export const springy = (t: number, start: number, freq = 4.5, damp = 7) => {
  const x = t - start;
  if (x <= 0) return 0;
  return 1 - Math.exp(-damp * x) * Math.cos(freq * 2 * Math.PI * x * 0.5);
};

/** Squash-and-stretch on arrival: returns [scaleX, scaleY]. */
export const squash = (t: number, land: number): [number, number] => {
  const x = t - land;
  if (x < 0 || x > 0.5) return [1, 1];
  const w = Math.exp(-9 * x) * Math.sin(x * 30);
  return [1 + w * 0.12, 1 - w * 0.12];
};

export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** Camera shake (decaying) after `at`. */
export const shake = (t: number, at: number, amount = 14) => {
  const x = t - at;
  if (x < 0 || x > 0.45) return [0, 0];
  const d = Math.exp(-10 * x) * amount;
  return [Math.sin(x * 90) * d, Math.cos(x * 70) * d * 0.7];
};
