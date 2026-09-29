import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Stacked } from "./Layouts";
import type { Theme } from "./theme";

const ease = Easing.bezier(0.16, 1, 0.3, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const LogoReveal: React.FC<{ theme: Theme; markSize: number }> = ({ theme, markSize }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = (sec: number) => sec * fps;

  const draw = interpolate(frame, [s(0.1), s(1.5)], [0, 1], { ...clamp, easing: ease });
  const fill = interpolate(frame, [s(1.2), s(1.9)], [0, 1], { ...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1) });
  const centre = spring({ frame: frame - s(1.7), fps, config: { damping: 12, stiffness: 120 } });
  const rays = interpolate(frame, [s(2.0), s(2.6)], [0, 1], { ...clamp, easing: ease });

  const text = (start: number) => {
    const t = interpolate(frame, [s(start), s(start + 0.8)], [0, 1], { ...clamp, easing: ease });
    return { opacity: t, rise: (1 - t) * markSize * 0.06 };
  };

  return (
    <Stacked
      theme={theme}
      markSize={markSize}
      progress={{ draw, fill, centre, rays }}
      arabic={text(2.3)}
      latin={text(2.7)}
    />
  );
};
