import React from "react";
import { AbsoluteFill } from "remotion";
import { dark as theme } from "./theme";
import { easeInOut, keys, lerp, prog, springy } from "./motion/anim";
import { MAN_WHITE, Man, POSES, breathe, walk } from "./motion/Man";
import { DeedsBook, NameCard, Rays, Star } from "./motion/Props";
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

export type SmallDeedsMotionProps = ReelBase & {
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

export const calculateSmallDeedsMetadata = reelMetadata<SmallDeedsMotionProps>();

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

// Scene 1: Hook - Concentric star and rays above the standing man.
const Hook: React.FC<SceneProps & { tx: SmallDeedsMotionProps["tx"] }> = ({ t, dur, W, tx }) => {
  const s = keys(t, [
    [0, 1.15],
    [dur, 1.0],
  ]);
  const l1 = prog(t, W("huge"), W("huge") + 0.2);
  const l2 = prog(t, W("habit"), W("habit") + 0.2);
  const starPop = springy(t, W("small"), 2.4, 7);

  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1100} s={s}>
        {starPop > 0 ? (
          <At x={540} y={860} style={{ transform: `translate(-50%, -50%) scale(${starPop})` }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
                <Rays size={400} spin={t * 16} opacity={0.6} />
              </div>
              <div style={{ position: "relative", zIndex: 1 }}>
                <Star size={130} color={theme.gold} />
              </div>
            </div>
          </At>
        ) : null}
        <At x={540} y={GROUND} anchor="bottom">
          <Man pose={breathe(POSES.stand, t)} style={MAN_WHITE} size={480} />
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

// Scene 3: Explain1 - Ibn Baz: Continuous righteous actions keep the heart alive.
const Explain1: React.FC<SceneProps & { quote: string; lang: string }> = ({ t, dur, W, words, quote, lang }) => {
  const tContinuous = W("continuous");
  const tAlive = W("alive");
  const tExhaustion = W("exhaustion");

  const card = springy(t, 0.1, 2.4, 7);
  const heartGlow = prog(t, tAlive, tExhaustion, easeInOut);
  // Natural walk pace (amount = 1.0)
  const pose = breathe(walk(POSES.stand, t, 2.0, 1.0), t);

  const s = keys(t, [
    [0, 1.08],
    [tAlive, 1.0],
    [dur, 1.05],
  ]);

  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1100} s={s}>
        <At x={540} y={GROUND} anchor="bottom">
          <Man
            pose={pose}
            style={MAN_WHITE}
            size={480}
            heart={{ color: theme.gold, glow: 1.2 + heartGlow * 1.5, scale: 1.1 + heartGlow * 0.3 }}
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
        <NameCard kicker={UI[lang as "en"].explanation} name={UI[lang as "en"].ibnBaz} font={serif} arabicFont={amiri} />
      </div>

      <ArabicLine t={t} text={quote} from={tContinuous} to={dur - 0.3} y={1415} size={42} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

// Scene 4: Explain2 - Ibn Uthaymeen: Deeds book fills up with stars over a lifetime.
const Explain2: React.FC<SceneProps & { quote: [string, string]; lang: string }> = ({ t, dur, W, words, quote, lang }) => {
  const tSmall = W("small");
  const tPraying = W("praying");
  const tImmensely = W("immensely");

  const card = springy(t, 0.1, 2.4, 7);
  const bookPop = springy(t, tSmall, 2.5, 7);
  const starsFill = prog(t, tPraying, tImmensely, easeInOut);

  const s = keys(t, [
    [0, 1.08],
    [tPraying, 1.0],
    [dur, 1.04],
  ]);

  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1150} s={s}>
        {bookPop > 0 ? (
          <At x={540} y={1040} style={{ transform: `translate(-50%, -50%) scale(${bookPop})` }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
                <Rays size={560} spin={t * 18} opacity={starsFill * 0.55} />
              </div>
              <div style={{ position: "relative", zIndex: 1 }}>
                <DeedsBook width={360} fill={starsFill} label="DEEDS" font={serif} circle />
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

      <ArabicLine t={t} text={quote[0]} from={tSmall} to={tPraying + 1.2} y={1380} size={38} />
      <ArabicLine t={t} text={quote[1]} from={tPraying + 1.2} to={dur - 0.3} y={1430} size={38} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

const ownCues = (p: SmallDeedsMotionProps) => (add: AddCue) => {
  const W = (s: "hook" | "hadith" | "explain1" | "explain2" | "close") => (w: string, n = 0) =>
    wordTime(p.words[s])(w, n);

  const h = W("hook");
  add("hook", h("huge"), "whoosh", 0.3);
  add("hook", h("small"), "pop", 0.35);
  add("hook", h("habit"), "sparkle", 0.4);

  const e = W("explain1");
  add("explain1", 0.05, "swipe", 0.35);
  add("explain1", e("continuous"), "pop", 0.35);
  add("explain1", e("alive"), "heartbeat", 0.5);
  add("explain1", e("exhaustion"), "whoosh", 0.3);

  const f = W("explain2");
  add("explain2", 0.05, "swipe", 0.35);
  add("explain2", f("small"), "pop", 0.35);
  add("explain2", f("praying"), "ding", 0.3);
  add("explain2", f("immensely"), "chime", 0.4);
};

export const SmallDeedsMotion: React.FC<SmallDeedsMotionProps> = (p) => {
  const hadith: HadithLayout = {
    narrator: p.tx.narrator,
    stamp: p.tx.stamp,
    arabic: p.arabicLines,
    line1: p.tx.line1,
    line2: p.tx.line2,
    stampWord: p.tx.stampWord,
    arabicSize: 76,
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
