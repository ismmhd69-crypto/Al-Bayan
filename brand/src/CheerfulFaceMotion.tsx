import React from "react";
import { AbsoluteFill } from "remotion";
import { dark as theme } from "./theme";
import { easeInOut, keys, lerp, prog, springy } from "./motion/anim";
import { MAN_WHITE, MAN_GREY, Man, POSES, breathe } from "./motion/Man";
import { Heart, NameCard, Rays } from "./motion/Props";
import { Balance } from "./motion/Props2";
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

export type CheerfulFaceMotionProps = ReelBase & {
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

export const calculateCheerfulFaceMetadata = reelMetadata<CheerfulFaceMotionProps>();

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

// Scene 1: Hook - Two men face each other, a warm heart glows between them.
const Hook: React.FC<SceneProps & { tx: CheerfulFaceMotionProps["tx"] }> = ({ t, dur, W, tx }) => {
  const s = keys(t, [
    [0, 1.15],
    [dur, 1.0],
  ]);
  const l1 = prog(t, W("simple"), W("simple") + 0.2);
  const l2 = prog(t, W("weighed"), W("weighed") + 0.2);
  const heartPop = springy(t, W("smile"), 2.4, 7);

  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1100} s={s}>
        <At x={350} y={GROUND} anchor="bottom">
          <Man pose={breathe(POSES.stand, t)} style={MAN_WHITE} size={480} />
        </At>
        <At x={730} y={GROUND} anchor="bottom" style={{ transform: "translate(-50%, -100%) scaleX(-1)" }}>
          <Man pose={breathe(POSES.stand, t + 0.5)} style={MAN_GREY} size={480} />
        </At>
        {heartPop > 0 ? (
          <At x={540} y={980} style={{ transform: `translate(-50%, -50%) scale(${heartPop})` }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Rays size={360} spin={t * 18} opacity={0.6} />
              <div style={{ position: "absolute" }}>
                <Heart size={140} color={theme.gold} glow={1.2} />
              </div>
            </div>
          </At>
        ) : null}
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

// Scene 3: Explain1 - Ibn Uthaymeen: Meeting with warmth brings affection and peace.
const Explain1: React.FC<SceneProps & { quote: string; lang: string }> = ({ t, dur, W, words, quote, lang }) => {
  const tWarmth = W("warmth");
  const tHearts = W("hearts");
  const tCharity = W("charity");

  const card = springy(t, 0.1, 2.4, 7);
  const peace = prog(t, tWarmth, tCharity, easeInOut);
  const heartSpring = springy(t, tWarmth, 2.5, 7);

  const s = keys(t, [
    [0, 1.08],
    [tHearts, 1.0],
    [dur, 1.05],
  ]);

  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1100} s={s}>
        {/* The two brothers stand naturally facing each other */}
        <At x={350} y={GROUND} anchor="bottom">
          <Man
            pose={breathe(POSES.stand, t)}
            style={MAN_WHITE}
            size={480}
            heart={peace > 0.2 ? { color: theme.gold, glow: peace * 1.4, scale: 1.15 } : null}
          />
        </At>
        <At x={730} y={GROUND} anchor="bottom" style={{ transform: "translate(-50%, -100%) scaleX(-1)" }}>
          <Man
            pose={breathe(POSES.stand, t + 0.4)}
            style={MAN_GREY}
            size={480}
            heart={peace > 0.4 ? { color: theme.gold, glow: peace * 1.4, scale: 1.15 } : null}
          />
        </At>

        {/* Concentric golden rays and heart centered directly between them at x=540, y=980 */}
        {heartSpring > 0 ? (
          <At x={540} y={980} style={{ transform: `translate(-50%, -50%) scale(${heartSpring})` }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Rays size={400} spin={t * 14} opacity={0.55 * peace} />
              <div style={{ position: "absolute" }}>
                <Heart size={140} color={theme.gold} glow={1.3} />
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
        <NameCard
          kicker={UI[lang as "en"].explanation}
          name="Shaykh Ibn Uthaymeen"
          font={serif}
          arabicFont={amiri}
        />
      </div>

      <ArabicLine t={t} text={quote} from={tWarmth} to={dur - 0.3} y={1415} size={42} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

// Scene 4: Explain2 - Ibn Baz: Balance scale weighing righteous deeds.
const Explain2: React.FC<SceneProps & { quote: [string, string]; lang: string }> = ({ t, dur, W, words, quote, lang }) => {
  const tDown = W("down");
  const tGentle = W("gentle");
  const tSins = W("sins");

  const card = springy(t, 0.1, 2.4, 7);
  const scaleIn = springy(t, 0.2, 2.5, 7);
  const dropHeart = prog(t, tGentle, tGentle + 0.4, easeInOut);
  const tilt = lerp(0, 18, prog(t, tGentle + 0.2, tSins, easeInOut));

  const s = keys(t, [
    [0, 1.08],
    [tGentle, 1.0],
    [dur, 1.04],
  ]);

  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1150} s={s}>
        {scaleIn > 0 ? (
          <At x={540} y={1180} style={{ transform: `translate(-50%, -50%) scale(${scaleIn})` }}>
            <Balance
              width={760}
              tilt={tilt}
              right={
                dropHeart > 0.8 ? (
                  <div style={{ position: "relative", transform: "scale(0.85)", transformOrigin: "50% 100%" }}>
                    <Heart size={90} color={theme.gold} glow={1.5} />
                  </div>
                ) : null
              }
            />
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

      <ArabicLine t={t} text={quote[0]} from={tDown} to={tGentle + 1.2} y={1380} size={38} />
      <ArabicLine t={t} text={quote[1]} from={tGentle + 1.2} to={dur - 0.3} y={1430} size={38} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

const ownCues = (p: CheerfulFaceMotionProps) => (add: AddCue) => {
  const W = (s: "hook" | "hadith" | "explain1" | "explain2" | "close") => (w: string, n = 0) =>
    wordTime(p.words[s])(w, n);

  const h = W("hook");
  add("hook", h("simple"), "whoosh", 0.3);
  add("hook", h("smile"), "sparkle", 0.4);
  add("hook", h("weighed"), "hit", 0.35);

  const e = W("explain1");
  add("explain1", 0.05, "swipe", 0.35);
  add("explain1", e("warmth"), "pop", 0.35);
  add("explain1", e("hearts"), "sparkle", 0.4);
  add("explain1", e("charity"), "chime", 0.35);

  const f = W("explain2");
  add("explain2", 0.05, "swipe", 0.35);
  add("explain2", f("down"), "whoosh", 0.3);
  add("explain2", f("gentle"), "pop", 0.35);
  add("explain2", f("sins"), "ding", 0.35);
};

export const CheerfulFaceMotion: React.FC<CheerfulFaceMotionProps> = (p) => {
  const hadith: HadithLayout = {
    narrator: p.tx.narrator,
    stamp: p.tx.stamp,
    arabic: p.arabicLines,
    line1: p.tx.line1,
    line2: p.tx.line2,
    stampWord: p.tx.stampWord,
    arabicSize: 74,
    englishSize: 46,
    contentTop: 245,
    stampBottom: 35,
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
