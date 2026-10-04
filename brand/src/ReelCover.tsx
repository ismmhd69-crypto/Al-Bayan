import React from "react";
import { AbsoluteFill } from "remotion";
import { loadFont as loadAmiri } from "@remotion/google-fonts/Amiri";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadNewsreader } from "@remotion/google-fonts/Newsreader";
import { BayanMark } from "./BayanMark";
import { Latin } from "./Wordmark";
import { StarPattern } from "./StarPattern";
import { dark as theme } from "./theme";
import { Man, POSES } from "./motion/Man";
import { AngerMeter, Rays, Steam } from "./motion/Props";

const { fontFamily: amiri } = loadAmiri("normal", { weights: ["700"], subsets: ["arabic"] });
const { fontFamily: sans } = loadInter("normal", { weights: ["800"], subsets: ["latin"] });
const { fontFamily: serif } = loadNewsreader("normal", { weights: ["500"], subsets: ["latin"] });

// Cover (thumbnail) for every Al-Bayan reel. 1080x1920.
// Instagram's profile grid crops covers to 3:4 (the middle 1080x1440, y 240..1680),
// so the title, art and source all sit inside that band. Brand tag sits just
// inside it at the top; nothing important outside it.

export type ReelCoverProps = {
  title: string; // big English word, e.g. "INTENTIONS"
  arabicTitle: string; // short Arabic line, e.g. the hadith opening
  source: string; // e.g. "Sahih al-Bukhari 1"
  art: "intention" | "anger"; // which illustration to draw (add more per video)
  titleSize?: number; // shrink long titles so they fit one line (default 168)
};

const Art: React.FC<{ kind: ReelCoverProps["art"] }> = ({ kind }) => {
  if (kind === "intention") {
    // Man raising his hands for prayer, heart glowing gold, rays behind.
    return (
      <div style={{ position: "relative", width: 1080, height: 820, display: "flex", justifyContent: "center", alignItems: "flex-end" }}>
        <div style={{ position: "absolute", left: "50%", top: 395, transform: "translate(-50%, -50%)" }}>
          <Rays size={760} spin={8} opacity={0.6} />
        </div>
        <div style={{ position: "absolute", left: "50%", top: 395, width: 520, height: 520, transform: "translate(-50%, -50%)", borderRadius: 999, background: "radial-gradient(circle, rgba(255,226,150,0.55) 0%, rgba(212,168,82,0.18) 45%, transparent 70%)" }} />
        {/* Positioned so it paints above the rays and glow. */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <Man pose={POSES.takbir} size={760} heart={{ color: theme.gold, glow: 1.1, scale: 1.55 }} />
        </div>
      </div>
    );
  }
  if (kind === "anger") {
    // Calm man glowing gold; red steam of anger blows away behind him; meter low.
    const puffs = [
      { x: 250, y: 150, s: 170, p: 0.45, o: 0.9 },
      { x: 170, y: 300, s: 130, p: 0.6, o: 0.7 },
      { x: 830, y: 140, s: 160, p: 0.5, o: 0.85 },
      { x: 920, y: 290, s: 120, p: 0.65, o: 0.65 },
      { x: 110, y: 120, s: 90, p: 0.75, o: 0.5 },
      { x: 980, y: 110, s: 90, p: 0.75, o: 0.5 },
    ];
    return (
      <div style={{ position: "relative", width: 1080, height: 820, display: "flex", justifyContent: "center", alignItems: "flex-end" }}>
        {puffs.map((q, i) => (
          <div key={i} style={{ position: "absolute", left: q.x, top: q.y, transform: "translate(-50%, -50%)", opacity: q.o, filter: "drop-shadow(0 0 18px rgba(224,50,43,0.6))" }}>
            <Steam size={q.s} p={q.p} color="#e0322b" />
          </div>
        ))}
        <div style={{ position: "absolute", left: "50%", top: 395, transform: "translate(-50%, -50%)" }}>
          <Rays size={760} spin={8} opacity={0.6} />
        </div>
        <div style={{ position: "absolute", left: "50%", top: 395, width: 520, height: 520, transform: "translate(-50%, -50%)", borderRadius: 999, background: "radial-gradient(circle, rgba(255,226,150,0.5) 0%, rgba(212,168,82,0.16) 45%, transparent 70%)" }} />
        <div style={{ position: "absolute", left: 120, bottom: 40 }}>
          <AngerMeter height={300} level={0.12} />
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <Man pose={POSES.calm} size={760} heart={{ color: theme.gold, glow: 1, scale: 1.4 }} />
        </div>
      </div>
    );
  }
  return null;
};

export const ReelCover: React.FC<ReelCoverProps> = ({ title, arabicTitle, source, art, titleSize = 168 }) => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 55%, #2f4ba0 0%, #1b2d66 50%, #0e1940 100%)" }}>
    <StarPattern color={theme.line} gold={theme.gold} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(6,12,36,0.65) 100%)" }} />

    {/* Brand tag */}
    <div style={{ position: "absolute", top: 290, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 16 }}>
      <BayanMark theme={theme} size={54} />
      <Latin theme={theme} size={30} />
    </div>

    {/* Title */}
    <div style={{ position: "absolute", top: 380, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ fontFamily: sans, fontWeight: 800, fontSize: titleSize, lineHeight: 1, whiteSpace: "nowrap", color: "#fff", letterSpacing: "-0.02em", textShadow: "0 14px 50px rgba(0,0,0,0.55)" }}>{title}</div>
      <div lang="ar" dir="rtl" style={{ fontFamily: amiri, fontWeight: 700, fontSize: 76, lineHeight: 1.5, color: theme.gold, marginTop: 18, textShadow: "0 6px 30px rgba(0,0,0,0.5)" }}>
        {arabicTitle}
      </div>
    </div>

    {/* Illustration */}
    <div style={{ position: "absolute", top: 760, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <Art kind={art} />
    </div>

    {/* Ground glow and source */}
    <div style={{ position: "absolute", top: 1540, left: 240, right: 240, height: 40, borderRadius: 999, background: "radial-gradient(ellipse, rgba(0,0,0,0.45), transparent 70%)" }} />
    <div style={{ position: "absolute", top: 1600, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <div style={{ fontFamily: serif, fontWeight: 500, fontSize: 34, color: theme.gold, border: `2px solid ${theme.gold}`, borderRadius: 999, padding: "8px 30px", background: "rgba(15,26,69,0.75)" }}>{source}</div>
    </div>
  </AbsoluteFill>
);
