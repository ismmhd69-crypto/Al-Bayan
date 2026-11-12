import React from "react";
import { AbsoluteFill } from "remotion";
import { dark as theme } from "./theme";
import { easeInOut, keys, lerp, prog, springy } from "./motion/anim";
import { MAN_WHITE, MAN_GREY, Man, POSES, breathe } from "./motion/Man";
import { NameCard, Rays, Star } from "./motion/Props";
import {
  ArabicLine,
  At,
  Camera,
  Captions,
  ReelRunner,
  UI,
  fonts,
  reelMetadata,
  wordTime,
  type AddCue,
  type HadithLayout,
  type ReelBase,
  type SceneProps,
} from "./motion/ReelKit";

const { amiri, serif, sans } = fonts;

export type SecretDuaMotionProps = ReelBase & {
  arabicLines: [string, string];
  quote1: string;
  quote2: [string, string];
  tx: {
    hook1: string;
    hook2: string;
    narrator: string;
    stamp: string;
    line1: [string, number];
    line2: [string, number];
    stampWord: string;
  };
};

export const calculateSecretDuaMetadata = reelMetadata<SecretDuaMotionProps>();

const GROUND = 1390;

const Title: React.FC<{ p: number; size: number; color?: string; children: React.ReactNode }> = ({
  p,
  size,
  color = "#fff",
  children,
}) => (
  <div
    style={{
      fontFamily: sans,
      fontWeight: 800,
      fontSize: size,
      color,
      opacity: p,
      transform: `scale(${lerp(2, 1, p)})`,
      textShadow: "0 10px 40px rgba(0,0,0,0.5)",
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </div>
);

// Scene 1: Hook - Man raising hands in prayer, concentric rays and star above him.
const Hook: React.FC<SceneProps & { tx: SecretDuaMotionProps["tx"] }> = ({ t, dur, W, tx }) => {
  const s = keys(t, [
    [0, 1.15],
    [dur, 1.0],
  ]);
  const l1 = prog(t, W("angel"), W("angel") + 0.2);
  const l2 = prog(t, W("today"), W("today") + 0.2);
  const raysPop = springy(t, W("dua"), 2.4, 7);

  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1100} s={s}>
        {raysPop > 0 ? (
          <At x={540} y={740} style={{ transform: `translate(-50%, -50%) scale(${raysPop})` }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
                <Rays size={460} spin={t * 16} opacity={0.55} />
              </div>
              <div style={{ position: "relative", zIndex: 1 }}>
                <Star size={110} color={theme.gold} />
              </div>
            </div>
          </At>
        ) : null}
        <At x={540} y={GROUND} anchor="bottom">
          <Man pose={POSES.takbir} style={MAN_WHITE} size={480} />
        </At>
      </Camera>
      <div
        style={{
          position: "absolute",
          top: 340,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}
      >
        <Title p={l1} size={88}>
          {tx.hook1}
        </Title>
        <Title p={l2} size={76} color={theme.gold}>
          {tx.hook2}
        </Title>
      </div>
    </AbsoluteFill>
  );
};

// Scene 3: Explain1 - Ibn Uthaymeen: Praying in secret is pure sincerity.
const Explain1: React.FC<SceneProps & { quote: string; lang: string }> = ({ t, dur, W, words, quote, lang }) => {
  const tSecret = W("secret");
  const tSincerity = W("sincerity");
  const tRewards = W("rewards");

  const card = springy(t, 0.1, 2.4, 7);
  const glow = prog(t, tSincerity, tRewards, easeInOut);
  const pose = breathe(POSES.takbir, t);

  const s = keys(t, [
    [0, 1.08],
    [tSincerity, 1.0],
    [dur, 1.05],
  ]);

  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1100} s={s}>
        {glow > 0.1 ? (
          <At x={540} y={740} style={{ opacity: glow }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
                <Rays size={520} spin={t * 18} opacity={0.5} />
              </div>
              <div style={{ position: "relative", zIndex: 1 }}>
                <Star size={120} color={theme.gold} />
              </div>
            </div>
          </At>
        ) : null}
        <At x={540} y={GROUND} anchor="bottom">
          <Man
            pose={pose}
            style={MAN_WHITE}
            size={480}
            heart={glow > 0.2 ? { color: theme.gold, glow: glow * 1.6, scale: 1.25 } : null}
          />
        </At>
      </Camera>

      <div
        style={{
          position: "absolute",
          top: 270,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          transform: `translate(${(1 - card) * -900}px, ${(1 - card) * -300}px) rotate(${(1 - card) * -12}deg)`,
          opacity: 1 - prog(t, dur - 0.4, dur),
        }}
      >
        <NameCard
          kicker={UI[lang as "en"].explanation}
          name="Shaykh Ibn Uthaymeen"
          font={serif}
          arabicFont={amiri}
        />
      </div>

      <ArabicLine t={t} text={quote} from={tSecret} to={dur - 0.3} y={1415} size={42} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

// Scene 4: Explain2 - Ibn Baz: Angel replies "Amin, and for you the same".
const Explain2: React.FC<SceneProps & { quote: [string, string]; lang: string }> = ({ t, dur, W, words, quote, lang }) => {
  const tHardship = W("hardship");
  const tAngel = W("angel");

  const card = springy(t, 0.1, 2.4, 7);
  // Pop the pill as soon as the angel is spoken about
  const pillPop = springy(t, tAngel - 0.2, 2.5, 7);
  const travel = prog(t, tHardship, tAngel, easeInOut);

  const s = keys(t, [
    [0, 1.08],
    [tAngel, 1.0],
    [dur, 1.04],
  ]);

  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1150} s={s}>
        <At x={320} y={GROUND} anchor="bottom">
          <Man pose={breathe(POSES.takbir, t)} style={MAN_WHITE} size={460} heart={{ color: theme.gold, glow: 1.1, scale: 1.2 }} />
        </At>
        <At x={760} y={GROUND} anchor="bottom" style={{ transform: "translate(-50%, -100%) scaleX(-1)" }}>
          <Man pose={breathe(POSES.stand, t + 0.4)} style={MAN_GREY} size={460} heart={travel > 0.8 ? { color: theme.gold, glow: 1.0, scale: 1.1 } : null} />
        </At>
        {travel > 0 && pillPop <= 0.8 ? (
          <At x={lerp(360, 720, travel)} y={960 + Math.sin(travel * Math.PI) * -50}>
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
                <Rays size={180} spin={t * 20} opacity={0.6} />
              </div>
              <div style={{ position: "relative", zIndex: 1 }}>
                <Star size={64} color={theme.gold} />
              </div>
            </div>
          </At>
        ) : null}
        {pillPop > 0 ? (
          <At x={540} y={780} style={{ transform: `translate(-50%, -50%) scale(${pillPop})` }}>
            <div
              style={{
                padding: "20px 42px",
                borderRadius: 999,
                background: "rgba(15,26,69,0.92)",
                border: `4px solid ${theme.gold}`,
                boxShadow: "0 0 50px rgba(212,168,82,0.6)",
                textAlign: "center",
              }}
            >
              <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 36, color: theme.gold, letterSpacing: "0.06em" }}>
                “AMĪN, AND FOR YOU THE SAME”
              </div>
            </div>
          </At>
        ) : null}
      </Camera>

      <div
        style={{
          position: "absolute",
          top: 270,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          transform: `translate(${(1 - card) * -900}px, ${(1 - card) * -300}px) rotate(${(1 - card) * -12}deg)`,
          opacity: 1 - prog(t, dur - 0.4, dur),
        }}
      >
        <NameCard kicker={UI[lang as "en"].explanation} name={UI[lang as "en"].ibnBaz} font={serif} arabicFont={amiri} />
      </div>

      <ArabicLine t={t} text={quote[0]} from={tHardship} to={tAngel + 0.8} y={1380} size={38} />
      <ArabicLine t={t} text={quote[1]} from={tAngel + 0.8} to={dur - 0.3} y={1430} size={38} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

const ownCues = (p: SecretDuaMotionProps) => (add: AddCue) => {
  const W = (s: "hook" | "hadith" | "explain1" | "explain2" | "close") => (w: string, n = 0) =>
    wordTime(p.words[s])(w, n);

  const h = W("hook");
  add("hook", h("angel"), "whoosh", 0.3);
  add("hook", h("dua"), "sparkle", 0.4);
  add("hook", h("today"), "chime", 0.35);

  const e = W("explain1");
  add("explain1", 0.05, "swipe", 0.35);
  add("explain1", e("secret"), "pop", 0.35);
  add("explain1", e("sincerity"), "sparkle", 0.45);
  add("explain1", e("rewards"), "chime", 0.35);

  const f = W("explain2");
  add("explain2", 0.05, "swipe", 0.35);
  add("explain2", f("hardship"), "whoosh", 0.3);
  add("explain2", f("angel"), "pop", 0.35);
  add("explain2", f("angel") + 0.4, "stamp", 0.45);
};

export const SecretDuaMotion: React.FC<SecretDuaMotionProps> = (p) => {
  const hadith: HadithLayout = {
    narrator: p.tx.narrator,
    stamp: p.tx.stamp,
    arabic: p.arabicLines,
    line1: p.tx.line1,
    line2: p.tx.line2,
    stampWord: p.tx.stampWord,
    arabicSize: 68,
    englishSize: 42,
    contentTop: 235,
    stampBottom: 25,
  };
  return (
    <ReelRunner
      p={p}
      hadith={hadith}
      scenes={{
        hook: (sp) => <Hook {...sp} tx={p.tx} />,
        explain1: (sp) => <Explain1 {...sp} quote={p.quote1} lang={p.lang} />,
        explain2: (sp) => <Explain2 {...sp} quote={p.quote2} lang={p.lang} />,
      }}
      cues={ownCues(p)}
    />
  );
};
