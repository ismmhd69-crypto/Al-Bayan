import React from "react";
import type { Theme } from "./theme";

// Eight-pointed star (khatam) as a solid band, a thin inner star, a gold
// rosette at the centre, and eight gold rays in the notches: clarity shining out.
export type MarkProgress = {
  draw: number; // 0..1 star outline drawn
  fill: number; // 0..1 band filled in
  centre: number; // 0..1 gold centre scale
  rays: number; // 0..1 rays extended
};

export const FULL: MarkProgress = { draw: 1, fill: 1, centre: 1, rays: 1 };

// Concave corner radius of an eight-pointed star made of two squares.
const NOTCH = Math.cos(Math.PI / 4) / Math.cos(Math.PI / 8);

const starPoints = (r: number, rotateDeg = 0) =>
  Array.from({ length: 16 }, (_, i) => {
    const deg = rotateDeg - 90 + i * 22.5;
    const rad = (deg * Math.PI) / 180;
    const radius = i % 2 === 0 ? r : r * NOTCH;
    return [Math.cos(rad) * radius, Math.sin(rad) * radius] as const;
  });

const starPath = (r: number) =>
  starPoints(r)
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ") + " Z";

const OUTER = 84;
const BAND = 13;
const INNER_LINE = 49;

export const BayanMark: React.FC<{ theme: Theme; size: number; progress?: MarkProgress }> = ({
  theme,
  size,
  progress = FULL,
}) => {
  const { draw, fill, centre, rays } = progress;
  const dash = (p: number) => ({ strokeDasharray: 1, strokeDashoffset: 1 - p });
  const rayStart = OUTER * NOTCH + 6;
  const rayEnd = rayStart + 15 * rays;
  // Settles from a slight turn while the outline draws.
  const spin = -22.5 * (1 - draw);

  return (
    <svg width={size} height={size} viewBox="-100 -100 200 200">
      <g transform={`rotate(${spin})`} strokeLinejoin="round" strokeLinecap="round">
        {/* Solid band: outer star minus inner star (even-odd keeps the centre see-through). */}
        <path
          d={`${starPath(OUTER)} ${starPath(OUTER - BAND)}`}
          fillRule="evenodd"
          fill={theme.line}
          fillOpacity={fill}
          stroke="none"
        />
        <path d={starPath(OUTER)} pathLength={1} fill="none" stroke={theme.line} strokeWidth={2.4} style={dash(draw)} />
        <path
          d={starPath(OUTER - BAND)}
          pathLength={1}
          fill="none"
          stroke={theme.line}
          strokeWidth={2.4}
          style={dash(draw)}
        />
        {/* Thin inner star, turned half a step, for the interlaced look. */}
        <path
          d={starPath(INNER_LINE)}
          transform="rotate(22.5)"
          pathLength={1}
          fill="none"
          stroke={theme.gold}
          strokeWidth={1.6}
          style={dash(draw)}
        />
      </g>

      {rays > 0 &&
        Array.from({ length: 8 }, (_, k) => 22.5 + k * 45 - 90).map((deg) => {
          const rad = (deg * Math.PI) / 180;
          return (
            <line
              key={deg}
              x1={Math.cos(rad) * rayStart}
              y1={Math.sin(rad) * rayStart}
              x2={Math.cos(rad) * rayEnd}
              y2={Math.sin(rad) * rayEnd}
              stroke={theme.gold}
              strokeWidth={3.4}
              strokeLinecap="round"
              opacity={Math.min(1, rays * 1.5)}
            />
          );
        })}

      {/* Gold rosette at the centre, echoing the large star. */}
      <g transform={`scale(${centre})`}>
        <path d={starPath(22)} fill={theme.gold} />
        <circle r={7.5} fill={theme.bg === "transparent" ? "#ffffff" : theme.bg} />
        <circle r={3.2} fill={theme.gold} />
      </g>
    </svg>
  );
};
