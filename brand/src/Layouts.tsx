import React from "react";
import { AbsoluteFill } from "remotion";
import { BayanMark, FULL, type MarkProgress } from "./BayanMark";
import { Arabic, Latin } from "./Wordmark";
import type { Theme } from "./theme";

const Background: React.FC<{ theme: Theme; children: React.ReactNode }> = ({ theme, children }) => {
  const bg =
    theme.bg === "transparent"
      ? "transparent"
      : theme.bg === "#1b2d66"
        ? "radial-gradient(circle at 50% 42%, #2c4596 0%, #1b2d66 55%, #122052 100%)"
        : "radial-gradient(circle at 50% 42%, #ffffff 0%, #f6f7f9 60%, #eef1f5 100%)";
  return <AbsoluteFill style={{ background: bg, alignItems: "center", justifyContent: "center" }}>{children}</AbsoluteFill>;
};

type TextReveal = { opacity: number; rise: number };
const SHOWN: TextReveal = { opacity: 1, rise: 0 };

// Mark above, Arabic name, Latin name underneath.
export const Stacked: React.FC<{
  theme: Theme;
  markSize: number;
  progress?: MarkProgress;
  arabic?: TextReveal;
  latin?: TextReveal;
}> = ({ theme, markSize, progress = FULL, arabic = SHOWN, latin = SHOWN }) => (
  <Background theme={theme}>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <BayanMark theme={theme} size={markSize} progress={progress} />
      <Arabic
        theme={theme}
        size={markSize * 0.46}
        style={{ marginTop: markSize * 0.04, opacity: arabic.opacity, transform: `translateY(${arabic.rise}px)` }}
      />
      <Latin
        theme={theme}
        size={markSize * 0.11}
        style={{ marginTop: markSize * 0.1, opacity: latin.opacity, transform: `translateY(${latin.rise}px)` }}
      />
    </div>
  </Background>
);

// Mark on the left, names stacked on the right.
export const Horizontal: React.FC<{ theme: Theme; markSize: number }> = ({ theme, markSize }) => (
  <Background theme={theme}>
    <div style={{ display: "flex", alignItems: "center", gap: markSize * 0.22 }}>
      <BayanMark theme={theme} size={markSize} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Arabic theme={theme} size={markSize * 0.62} />
        <Latin theme={theme} size={markSize * 0.15} style={{ marginTop: markSize * 0.12 }} />
      </div>
    </div>
  </Background>
);

export const MarkOnly: React.FC<{ theme: Theme; markSize: number }> = ({ theme, markSize }) => (
  <Background theme={theme}>
    <BayanMark theme={theme} size={markSize} />
  </Background>
);
