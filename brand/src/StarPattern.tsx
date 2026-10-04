import React from "react";
import { interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";

// Faint tiled khatam (eight-pointed star) lattice that draws itself in,
// plus slow gold dust. Decorative background for the hadith reels.
const NOTCH = Math.cos(Math.PI / 4) / Math.cos(Math.PI / 8);

const star = (cx: number, cy: number, r: number) =>
  Array.from({ length: 16 }, (_, i) => {
    const rad = ((-90 + i * 22.5) * Math.PI) / 180;
    const rr = i % 2 === 0 ? r : r * NOTCH;
    return `${i === 0 ? "M" : "L"} ${(cx + Math.cos(rad) * rr).toFixed(1)} ${(cy + Math.sin(rad) * rr).toFixed(1)}`;
  }).join(" ") + " Z";

export const StarPattern: React.FC<{ color: string; gold: string }> = ({ color, gold }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const cell = 216;
  const cols = Math.ceil(width / cell) + 2;
  const rows = Math.ceil(height / cell) + 2;
  const drift = (frame / fps) * 6; // px per second, very slow

  const stars: React.ReactNode[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cx = x * cell + (y % 2 ? cell / 2 : 0);
      const cy = y * cell;
      // Draw outward from the centre of the frame.
      const dist = Math.hypot(cx - width / 2, cy - height / 2) / Math.hypot(width / 2, height / 2);
      const d = interpolate(frame, [dist * 40, dist * 40 + 45], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      stars.push(
        <path
          key={`${x}-${y}`}
          d={star(cx, cy, cell * 0.42)}
          fill="none"
          stroke={color}
          strokeWidth={1.4}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={d}
        />,
      );
    }
  }

  const dust = Array.from({ length: 34 }, (_, i) => {
    const x = random(`x${i}`) * width;
    const speed = 10 + random(`s${i}`) * 26;
    const y = (random(`y${i}`) * height - (frame / fps) * speed + height * 4) % height;
    const r = 1.5 + random(`r${i}`) * 3;
    const tw = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(frame / 18 + i));
    return <circle key={i} cx={x} cy={y} r={r} fill={gold} opacity={tw} />;
  });

  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
      <g transform={`translate(0 ${-drift})`} opacity={0.14}>
        {stars}
      </g>
      {dust}
    </svg>
  );
};
