import React from "react";
import { AbsoluteFill } from "remotion";
import { dark as theme } from "./theme";
import { easeInOut, keys, lerp, prog, shake, springy } from "./motion/anim";
import { MAN_GREY, MAN_WHITE, Man, POSES, breathe, mixPose } from "./motion/Man";
import {
  Check,
  CrossBadge,
  DeedsBook,
  FilterSieve,
  NameCard,
  Rays,
  SpeechBubbleDark,
  SpeechBubbleGold,
  Star,
  TickingClock,
} from "./motion/Props";
import {
  ArabicLine,
  At,
  Camera,
  Captions,
  ReelRunner,
  fonts,
  reelMetadata,
  wordTime,
  UI,
  type AddCue,
  type HadithLayout,
  type Lang,
  type ReelBase,
  type SceneKey,
  type SceneProps,
} from "./motion/ReelKit";

// Video 03: "Speak Good" (Sahih al-Bukhari 6018, explained by Ibn Baz).
// Sources: binbaz.org.sa/fatwas/23226 (library 0b211c6e-9fce-41c5-9cb0-b629afe03f80)
// and binbaz.org.sa/fatwas/3349 (library a9cc2a59-d548-4495-bd5f-8783991d1a23).
// Shared parts come from ReelKit.

const { amiri, serif, sans } = fonts;

/** Words this video shows on screen, per language. */
export type SpeakText = {
  hookWords: string;
  hookUp: string;
  hookDown: string;
  rumour: string;
  idleChatter: string;
  beneficial: string;
  virtueTitle: string;
  benefitsPeople: string;
  clarifiesTruth: string;
  reward: string;
  afflictionTitle: string;
  endlessChatter: string;
  withoutBenefit: string;
  wastesTime: string;
  narrator: string;
  stamp: string;
  line1: [string, number];
  line2: [string, number];
  stampWord: string;
};

export type SpeakGoodMotionProps = ReelBase & {
  tx: SpeakText;
  arabicLines: [string, string];
  quote1: string; // Ibn Baz: "المؤمن ينتقي..."
  quote2: [string, string]; // Ibn Baz: [part1, part2]
};

export const calculateSpeakGoodMetadata = reelMetadata<SpeakGoodMotionProps>();

// ---------------------------------------------------------------------------
// Scene 1: hook. "Your words can lift you up, or bring you down."

const Hook: React.FC<SceneProps & { tx: SpeakText }> = ({ t, dur, W, tx }) => {
  const tWords = W("words");
  const tLift = W("lift");
  const tUp = W("up");
  const tBring = W("bring");
  const tDown = W("down");

  const [sx, sy] = shake(t, tDown, 16);
  const s = keys(t, [
    [0, 1.05],
    [tLift, 1.0],
    [tUp, 1.08],
    [tBring, 1.02],
    [dur, 1.05],
  ]);

  const pWords = prog(t, tWords - 0.1, tWords + 0.2);
  const pLift = prog(t, tLift - 0.1, tLift + 0.25);
  const pUp = springy(t, tUp, 2.4, 6);
  const pBring = prog(t, tBring - 0.05, tBring + 0.2);
  const pDark = springy(t, tBring, 2.5, 6);

  // Character rises when lifted, sinks when brought down
  const rise = prog(t, tLift, tUp + 0.5, easeInOut) * (1 - prog(t, tBring - 0.1, tBring + 0.3, easeInOut));
  const drop = prog(t, tBring, tDown + 0.4, easeInOut);
  const charY = 1530 - rise * 110 + drop * 70;

  const pose = breathe(
    mixPose(
      mixPose(POSES.speak, POSES.calm, rise),
      POSES.quiet,
      drop
    ),
    t
  );

  return (
    <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px)` }}>
      <Camera fx={540} fy={960} s={s}>
        {/* Glow & rays when lifting */}
        {rise > 0.1 ? (
          <At x={540} y={charY - 320} style={{ opacity: rise }}>
            <Rays size={740} spin={t * 22} opacity={0.55} />
          </At>
        ) : null}

        {/* The speaker */}
        <At x={540} y={charY} anchor="bottom">
          <Man
            pose={pose}
            style={MAN_WHITE}
            size={560}
            heart={rise > 0.2 ? { color: theme.gold, glow: rise * 1.2, scale: 1 + rise * 0.3 } : null}
          />
        </At>

        {/* Upward golden speech bubble */}
        {pLift > 0 && pBring < 0.9 ? (
          <At
            x={730}
            y={charY - 490 - rise * 50}
            style={{
              transform: `translate(-50%, -50%) scale(${pUp * (1 - pBring)}) rotate(${6 - rise * 3}deg)`,
              opacity: pLift * (1 - pBring),
            }}
          >
            <SpeechBubbleGold width={260} glow={1.1} tail="bottom">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Star size={30} />
                <div lang="ar" dir="rtl" style={{ fontFamily: amiri, fontWeight: 700, fontSize: 40, color: "#8a5a12", lineHeight: 1 }}>
                  خَيْر
                </div>
                <Star size={30} />
              </div>
            </SpeechBubbleGold>
          </At>
        ) : null}

        {/* Downward heavy dark bubble */}
        {pBring > 0 ? (
          <At
            x={270}
            y={charY - 440 + drop * 40}
            style={{
              transform: `translate(-50%, -50%) scale(${pDark}) rotate(-6deg)`,
              opacity: pBring,
            }}
          >
            <SpeechBubbleDark width={260} tail="none">
              <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 34, color: "#e0322b", letterSpacing: "0.06em" }}>
                # @ ! %
              </div>
            </SpeechBubbleDark>
          </At>
        ) : null}
      </Camera>

      {/* Big title at top (safe area below top bar at y 210) */}
      <div style={{ position: "absolute", top: 380, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          style={{
            fontFamily: sans,
            fontWeight: 800,
            fontSize: 92,
            color: "#fff",
            opacity: pWords,
            transform: `scale(${lerp(1.8, 1, pWords)})`,
            textShadow: "0 10px 40px rgba(0,0,0,0.5)",
          }}
        >
          {tx.hookWords}
        </div>

        {/* Sub-phrase transitions from "LIFT YOU UP" to "OR BRING YOU DOWN" */}
        {pBring < 0.6 ? (
          <div
            style={{
              fontFamily: sans,
              fontWeight: 800,
              fontSize: 104,
              color: theme.gold,
              opacity: pLift * (1 - pBring),
              transform: `scale(${lerp(2, 1, pLift)})`,
              textShadow: "0 10px 40px rgba(0,0,0,0.5)",
              whiteSpace: "nowrap",
            }}
          >
            {tx.hookUp}
          </div>
        ) : (
          <div
            style={{
              fontFamily: sans,
              fontWeight: 800,
              fontSize: 88,
              color: "#ff6b6b",
              opacity: pBring,
              transform: `scale(${lerp(1.9, 1, pBring)})`,
              textShadow: "0 10px 40px rgba(0,0,0,0.5)",
              whiteSpace: "nowrap",
            }}
          >
            {tx.hookDown}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 3: Explain 1. "The believer is selective; he does not narrate except something he selects, something beneficial."

const Explain1: React.FC<SceneProps & { quote: string; tx: SpeakText; lang: Lang }> = ({ t, dur, W, words, quote, tx, lang }) => {
  const tBeliever = W("believer");
  const tSelective = W("selective");
  const tNarrate = W("narrate");
  const tSelects = W("selects");
  const tBeneficial = W("beneficial");

  const card = prog(t, 0.05, 0.55);
  const cardOut = prog(t, tBeliever - 0.4, tBeliever);

  const sift = prog(t, tSelective - 0.1, tSelective + 0.6);
  const pSieve = springy(t, tBeliever - 0.2, 2.5, 6);
  const goldPass = prog(t, tSelects - 0.1, tSelects + 0.6, easeInOut);
  const [sx, sy] = shake(t, tBeneficial, 14);

  const s = keys(t, [
    [0, 1.05],
    [tSelective, 1.0],
    [tSelects, 1.15],
    [dur, 1.04],
  ]);
  const fx = keys(t, [
    [0, 540],
    [tSelective, 540],
    [tSelects, 570],
    [dur, 540],
  ]);
  const fy = keys(t, [
    [0, 1020],
    [tSelects, 980],
    [dur, 1020],
  ]);

  const charPose = breathe(mixPose(POSES.stand, POSES.sift, sift), t);

  // Incoming unfiltered speech bubbles floating towards the sieve
  const bubbles = [
    { tIn: tBeliever + 0.3, label: tx.rumour, stop: tNarrate + 0.2, x: 490, y: 720 },
    { tIn: tSelective + 0.2, label: tx.idleChatter, stop: tSelects - 0.4, x: 570, y: 660 },
  ];

  return (
    <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px)` }}>
      <Camera fx={fx} fy={fy} s={s}>
        {/* Rays when beneficial word is selected */}
        {goldPass > 0.2 ? (
          <At x={640} y={1040} style={{ opacity: goldPass }}>
            <Rays size={680} spin={t * 20} opacity={0.6} />
          </At>
        ) : null}

        {/* Believer filtering his words */}
        <At x={300} y={1400} anchor="bottom">
          <Man
            pose={charPose}
            style={MAN_WHITE}
            size={540}
            heart={goldPass > 0.1 ? { color: theme.gold, glow: goldPass * 1.2, scale: 1.3 } : null}
          />
        </At>

        {/* Filter sieve gate */}
        {pSieve > 0 ? (
          <At
            x={640}
            y={880}
            style={{
              transform: `translate(-50%, -50%) scale(${pSieve})`,
              opacity: pSieve,
            }}
          >
            <FilterSieve width={320} active={goldPass > 0.1} glow={goldPass} />
          </At>
        ) : null}

        {/* Unfiltered bubbles that get stopped */}
        {bubbles.map((b, i) => {
          const appear = springy(t, b.tIn, 2.5, 6);
          const stopProgress = prog(t, b.stop, b.stop + 0.3);
          if (appear <= 0 || stopProgress >= 1) return null;
          return (
            <At
              key={i}
              x={b.x}
              y={b.y + appear * 30}
              style={{
                transform: `translate(-50%, -50%) scale(${appear * (1 - stopProgress * 0.8)})`,
                opacity: appear * (1 - stopProgress),
              }}
            >
              <div
                style={{
                  padding: "10px 20px",
                  borderRadius: 20,
                  background: "rgba(50,60,85,0.9)",
                  border: "2px solid #7d89a8",
                  color: "#d0d7e6",
                  fontFamily: sans,
                  fontWeight: 800,
                  fontSize: 22,
                  textTransform: "uppercase",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                }}
              >
                {b.label}
              </div>
            </At>
          );
        })}

        {/* Selected pure golden speech emerging from filter */}
        {goldPass > 0 ? (
          <At
            x={640}
            y={1060 + (1 - goldPass) * -40}
            style={{
              transform: `translate(-50%, -50%) scale(${springy(t, tSelects, 2.5, 6)})`,
              opacity: goldPass,
            }}
          >
            <SpeechBubbleGold width={340} glow={1.3} tail="bottom">
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "6px 0 2px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Star size={24} />
                  <div
                    lang="ar"
                    dir="rtl"
                    style={{ fontFamily: amiri, fontWeight: 700, fontSize: 48, color: "#8a5a12", lineHeight: 1.3 }}
                  >
                    يَنْفَع
                  </div>
                  <Star size={24} />
                </div>
                <div
                  style={{
                    fontFamily: sans,
                    fontWeight: 800,
                    fontSize: 22,
                    color: "#1b2d66",
                    letterSpacing: "0.1em",
                    marginTop: 12,
                  }}
                >
                  {tx.beneficial}
                </div>
              </div>
            </SpeechBubbleGold>
          </At>
        ) : null}
      </Camera>

      {/* Scholar name card */}
      <div
        style={{
          position: "absolute",
          top: 270,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          transform: `translate(${(1 - card) * -900}px, ${(1 - card) * -300}px) rotate(${(1 - card) * -12}deg)`,
          opacity: 1 - cardOut,
        }}
      >
        <NameCard kicker={UI[lang].explanation} name={UI[lang].ibnBaz} font={serif} arabicFont={amiri} />
      </div>

      <ArabicLine t={t} text={quote} from={tBeliever} to={dur} y={1415} size={44} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 4: Explain 2. Split view / contrast:
// Beneficial speech (virtue of tongue, rewarded) vs excessive chatter (affliction, wastes time).

const Explain2: React.FC<SceneProps & { quote: [string, string]; tx: SpeakText }> = ({ t, dur, W, words, quote, tx }) => {
  const tBenefits = W("benefits");
  const tTruth = W("truth");
  const tVirtues = W("virtues");
  const tRewarded = W("rewarded");

  const tAffliction = W("affliction");
  const tWastes = W("wastes");

  const pVirtue = prog(t, tBenefits - 0.1, tBenefits + 0.4);
  const pTruth = prog(t, tTruth - 0.1, tTruth + 0.4);
  const pRewarded = prog(t, tRewarded - 0.2, tRewarded + 0.6);

  const pAffliction = prog(t, tAffliction - 0.2, tAffliction + 0.3);
  const pExcess = springy(t, tAffliction, 2.5, 6);
  const pClock = springy(t, tAffliction + 0.2, 2.4, 6);

  const [sx, sy] = shake(t, tAffliction, 16);

  const s = keys(t, [
    [0, 1.05],
    [tVirtues, 1.0],
    [tAffliction, 1.08],
    [dur, 1.04],
  ]);

  const fx = keys(t, [
    [0, 540],
    [tVirtues, 540],
    [tAffliction, 540],
  ]);

  // Character pose blends with the two halves
  const pose = breathe(
    mixPose(
      mixPose(POSES.stand, POSES.calm, pVirtue),
      POSES.quiet,
      pAffliction
    ),
    t
  );

  return (
    <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px)` }}>
      <Camera fx={fx} fy={1000} s={s}>
        {/* Glow when rewarded */}
        {pRewarded > 0.4 && pAffliction < 0.8 ? (
          <At x={540} y={1140} style={{ opacity: pRewarded * (1 - pAffliction) }}>
            <Rays size={660} spin={t * 18} opacity={0.5} />
          </At>
        ) : null}

        {/* Believer in center */}
        <At x={540} y={1410} anchor="bottom">
          <Man
            pose={pose}
            style={pAffliction > 0.5 ? MAN_GREY : MAN_WHITE}
            size={520}
            heart={
              pRewarded > 0.1 && pAffliction < 0.6
                ? { color: theme.gold, glow: pRewarded * 1.2, scale: 1.25 }
                : null
            }
          />
        </At>

        {/* Top Card 1: Virtues of the Tongue (Helpful speech & reward) */}
        {pVirtue > 0 && pAffliction < 0.95 ? (
          <At
            x={540}
            y={660}
            style={{
              transform: `translate(-50%, -50%) scale(${pVirtue * (1 - pAffliction * 0.9)})`,
              opacity: pVirtue * (1 - pAffliction),
            }}
          >
            <div
              style={{
                width: 780,
                borderRadius: 32,
                background: "rgba(15,26,69,0.88)",
                border: `3px solid ${theme.gold}`,
                boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
                padding: "26px 36px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div
                style={{
                  fontFamily: sans,
                  fontWeight: 800,
                  fontSize: 28,
                  letterSpacing: "0.14em",
                  color: theme.gold,
                  textTransform: "uppercase",
                }}
              >
                {tx.virtueTitle}
              </div>

              <div style={{ display: "flex", justifyContent: "space-around", width: "100%", alignItems: "center" }}>
                {/* 1. Benefits people */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, width: 190 }}>
                  <Star size={42} />
                  <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 20, color: "#fff", textAlign: "center" }}>
                    {tx.benefitsPeople}
                  </div>
                </div>

                {/* 2. Clarifies truth */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    width: 190,
                    opacity: 0.5 + pTruth * 0.5,
                  }}
                >
                  <Check size={52} p={pTruth} />
                  <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 20, color: "#fff", textAlign: "center" }}>
                    {tx.clarifiesTruth}
                  </div>
                </div>

                {/* 3. Rewarded */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    width: 220,
                    opacity: 0.5 + pRewarded * 0.5,
                  }}
                >
                  <DeedsBook width={140} fill={pRewarded} label={tx.reward} font={sans} />
                </div>
              </div>
            </div>
          </At>
        ) : null}

        {/* Top Card 2: Affliction of the Tongue (Excessive chatter & wasted time) */}
        {pAffliction > 0 ? (
          <At
            x={540}
            y={660}
            style={{
              transform: `translate(-50%, -50%) scale(${pAffliction})`,
              opacity: pAffliction,
            }}
          >
            <div
              style={{
                width: 780,
                borderRadius: 32,
                background: "rgba(25,20,35,0.92)",
                border: "3px solid #d3302a",
                boxShadow: "0 20px 60px rgba(0,0,0,0.55), 0 0 40px rgba(211,48,42,0.3)",
                padding: "26px 36px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div
                style={{
                  fontFamily: sans,
                  fontWeight: 800,
                  fontSize: 28,
                  letterSpacing: "0.14em",
                  color: "#ff6b6b",
                  textTransform: "uppercase",
                }}
              >
                {tx.afflictionTitle}
              </div>

              <div style={{ display: "flex", justifyContent: "space-around", width: "100%", alignItems: "center" }}>
                {/* Excessive chatter bubbles */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 10,
                    width: 260,
                    opacity: pExcess,
                    transform: `scale(${pExcess})`,
                  }}
                >
                  <SpeechBubbleDark width={220} tail="none">
                    <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 18, color: "#d0d7e6" }}>
                      {tx.endlessChatter}
                    </div>
                  </SpeechBubbleDark>
                  <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 18, color: "#9aa6c4", textAlign: "center" }}>
                    {tx.withoutBenefit}
                  </div>
                </div>

                {/* Clock: wastes people's time */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 10,
                    width: 240,
                    opacity: pClock,
                    transform: `scale(${pClock})`,
                  }}
                >
                  <div style={{ position: "relative" }}>
                    <TickingClock size={110} t={t} />
                    <div style={{ position: "absolute", top: -10, right: -10 }}>
                      <CrossBadge size={40} p={prog(t, tWastes, tWastes + 0.4)} />
                    </div>
                  </div>
                  <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 20, color: "#ff8585", textAlign: "center" }}>
                    {tx.wastesTime}
                  </div>
                </div>
              </div>
            </div>
          </At>
        ) : null}
      </Camera>

      {/* Arabic lines */}
      <ArabicLine t={t} text={quote[0]} from={W("speech")} to={tAffliction - 0.2} y={1430} size={36} />
      <ArabicLine t={t} text={quote[1]} from={tAffliction} to={dur} y={1430} size={38} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Sound cues for Video 03 "Speak Good"

const ownCues = (p: SpeakGoodMotionProps) => (add: AddCue) => {
  const W = (scene: SceneKey) => wordTime(p.words[scene], p.alias?.[scene]);

  // Hook cues
  const h = W("hook");
  add("hook", 0.28, "pop", 0.3);
  add("hook", h("words"), "hit", 0.4);
  add("hook", h("lift"), "rise", 0.45);
  add("hook", h("up"), "sparkle", 0.35);
  add("hook", h("bring"), "whoosh", 0.35);
  add("hook", h("down"), "stamp", 0.45);

  // Explain 1 cues
  const e = W("explain1");
  add("explain1", 0.05, "swipe", 0.35);
  add("explain1", e("selective"), "ding", 0.35);
  add("explain1", e("does"), "bubble", 0.28);
  add("explain1", e("narrate"), "bubble", 0.28);
  add("explain1", e("selects"), "strike", 0.35);
  add("explain1", e("beneficial"), "sparkle", 0.45);
  add("explain1", e("beneficial") + 0.3, "chime", 0.35);

  // Explain 2 cues
  const f = W("explain2");
  add("explain2", f("benefits"), "pop_high", 0.35);
  add("explain2", f("truth"), "ding", 0.35);
  add("explain2", f("rewarded"), "sparkle", 0.45);
  add("explain2", f("rewarded") + 0.2, "ding", 0.35);
  add("explain2", f("affliction"), "hit", 0.45);
  add("explain2", f("excessively"), "bubble", 0.3);
  add("explain2", f("excessively") + 0.3, "bubble", 0.3);
  add("explain2", f("wastes"), "tick", 0.4);
};

export const SpeakGoodMotion: React.FC<SpeakGoodMotionProps> = (p) => {
  const hadith: HadithLayout = {
    narrator: p.tx.narrator,
    stamp: p.tx.stamp,
    arabic: p.arabicLines,
    line1: p.tx.line1,
    line2: p.tx.line2,
    stampWord: p.tx.stampWord,
    arabicSize: 82,
    englishSize: 50,
    contentTop: 250,
    stampBottom: 110,
  };

  return (
    <ReelRunner
      p={p}
      hadith={hadith}
      scenes={{
        hook: (sp) => <Hook {...sp} tx={p.tx} />,
        explain1: (sp) => <Explain1 {...sp} quote={p.quote1} tx={p.tx} lang={p.lang} />,
        explain2: (sp) => <Explain2 {...sp} quote={p.quote2} tx={p.tx} />,
      }}
      cues={ownCues(p)}
    />
  );
};
