import React from "react";
import { AbsoluteFill } from "remotion";
import { dark as theme } from "./theme";
import { ease, easeInOut, keys, lerp, prog, shake, springy, squash } from "./motion/anim";
import { MAN_GREY, MAN_WHITE, Man, POSES, breathe, mixPose, walk } from "./motion/Man";
import {
  Bed,
  Bubble,
  Building,
  CoinG,
  DeedsBook,
  LyingMan,
  Masjid,
  NameCard,
  RoadSign,
  Rays,
  Star,
  Suitcase,
  Thermometer,
  WorshipIcon,
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
  type AddCue,
  type HadithLayout,
  type ReelBase,
  type SceneKey,
  type Word,
} from "./motion/ReelKit";

// Video 01: "Intentions" (Sahih al-Bukhari 1, explained by Ibn Baz).
// Shared look, scroll scene, ending, voice and sound handling live in ReelKit.

const { amiri, serif, serifItalic, sans } = fonts;

export type IntentionMotionProps = ReelBase & {
  arabicLines: [string, string];
  quote1: [string, string];
  quote2: [string, string];
};

export const calculateIntentionMetadata = reelMetadata<IntentionMotionProps>();

// ---------------------------------------------------------------------------
// Scene 1: hook. Two men give the same charity; their hearts differ.

const Hook: React.FC<{ t: number; dur: number; W: ReturnType<typeof wordTime> }> = ({ t, dur, W }) => {
  const s = keys(t, [
    [0, 1.5],
    [1.3, 1.0],
    [dur, 1.04],
  ], ease);
  const r = keys(t, [
    [0, -4],
    [1.3, 0],
  ], ease);
  const lx = lerp(-320, 215, prog(t, 0.12, 0.62));
  const rx = lerp(1400, 865, prog(t, 0.3, 0.8));
  const box = springy(t, 0.4, 2.6, 7);
  // Coins leave both hands and drop into the box together.
  const drop = prog(t, 1.25, 1.75, easeInOut);
  const [lsx, lsy] = squash(t, 0.62);
  const [rsx, rsy] = squash(t, 0.8);
  const give = prog(t, 0.85, 1.3);
  const heartIn = springy(t, W("every"), 2.4, 7);
  const pulse = 1 + Math.sin(t * 9) * 0.06;
  const [sx, sy] = shake(t, W("one"), 12);

  const slam = prog(t, W("one"), W("one") + 0.25, ease);
  const rest = ["that", "changes", "every", "deed"].map((w) => prog(t, W(w), W(w) + 0.25));

  return (
    <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px)` }}>
      <Camera fx={540} fy={1100} s={s} r={r}>
        <At x={lx} y={1500} anchor="bottom" style={{ transform: `translate(-50%, -100%) scale(${lsx}, ${lsy})`, transformOrigin: "50% 100%" }}>
          <Man pose={breathe(mixPose(POSES.stand, POSES.give, give), t)} style={MAN_WHITE} size={540} rightItem={drop < 0.05 ? <CoinG r={20} /> : undefined} heart={heartIn > 0 ? { color: theme.gold, glow: pulse, scale: heartIn * 1.7 } : null} />
        </At>
        <At x={rx} y={1500} anchor="bottom" style={{ transform: `translate(-50%, -100%) scale(${-rsx}, ${rsy})`, transformOrigin: "50% 100%" }}>
          <Man pose={breathe(mixPose(POSES.stand, POSES.give, give), t + 1)} style={MAN_GREY} size={540} rightItem={drop < 0.05 ? <CoinG r={20} /> : undefined} heart={heartIn > 0 ? { color: "#8d93a3", glow: 0.35, scale: heartIn * 1.3 } : null} />
        </At>
        {/* Charity box between them */}
        {box > 0 ? (
          <At x={540} y={1500} anchor="bottom" style={{ transform: `translate(-50%, -100%) scale(${box})`, transformOrigin: "50% 100%" }}>
            <svg width={190} height={170} viewBox="-95 -170 190 170">
              <rect x={-80} y={-130} width={160} height={130} rx={14} fill="#2f8f6b" stroke={theme.gold} strokeWidth={5} />
              <rect x={-40} y={-140} width={80} height={14} rx={7} fill="#151c33" />
              <path d="M -30 -70 L 0 -95 L 30 -70" stroke={theme.gold} strokeWidth={6} fill="none" />
            </svg>
          </At>
        ) : null}
        {drop > 0.05 && drop < 1
          ? [lx + 175, rx - 175].map((x0, i) => (
              <At key={i} x={lerp(x0, 540, drop)} y={lerp(1180, 1365, drop) - Math.sin(drop * Math.PI) * 120}>
                <svg width={44} height={44} viewBox="-22 -22 44 44">
                  <CoinG r={20} />
                </svg>
              </At>
            ))
          : null}
      </Camera>
      <div style={{ position: "absolute", top: 400, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 116, color: "#fff", letterSpacing: "-0.01em", opacity: slam, transform: `scale(${lerp(2.4, 1, slam)})`, textShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
          ONE SENTENCE
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 18, marginTop: 16, fontFamily: serifItalic, fontSize: 70 }}>
          {["that", "changes", "every", "deed."].map((w, i) => (
            <span key={w} style={{ opacity: rest[i], transform: `translateY(${(1 - rest[i]) * 30}px)`, color: i >= 2 ? theme.gold : theme.text, display: "inline-block" }}>
              {w}
            </span>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 3: intention is in the heart, not on the tongue.

const MAN3 = { x: 540, feet: 1390, size: 640 };
const k3 = MAN3.size / 520;
const HEART3 = { x: MAN3.x - 22 * k3, y: MAN3.feet - 300 * k3 };
const HEAD3 = { x: MAN3.x, y: MAN3.feet - 432 * k3 };

const Explain1: React.FC<{ t: number; dur: number; W: ReturnType<typeof wordTime>; words: Word[]; quote: [string, string] }> = ({ t, dur, W, words, quote }) => {
  const iA = W("intention");
  const iB = W("intention", 1);
  const tHeart = W("heart");
  const tNot = W("not");
  const tTongue = W("tongue");

  // Camera: wide, then dive into the heart, then up to the head, then back out.
  const fx = keys(t, [
    [0, 540],
    [iB, 540],
    [iB + 0.6, HEART3.x],
    [tNot - 0.35, HEART3.x],
    [tNot + 0.15, HEAD3.x + 60],
    [dur - 0.4, HEAD3.x + 60],
    [dur, 540],
  ]);
  const fy = keys(t, [
    [0, 1050],
    [iB, 1050],
    [iB + 0.6, HEART3.y],
    [tNot - 0.35, HEART3.y],
    [tNot + 0.15, HEAD3.y - 90],
    [dur - 0.4, HEAD3.y - 90],
    [dur, 1000],
  ]);
  const s = keys(t, [
    [0, 1.12],
    [iA, 1.0],
    [iB, 1.0],
    [iB + 0.6, 2.5],
    [tNot - 0.35, 2.7],
    [tNot + 0.15, 1.55],
    [dur - 0.4, 1.6],
    [dur, 1.0],
  ]);
  const camBlur = Math.max(prog(t, iB, iB + 0.25) - prog(t, iB + 0.25, iB + 0.6), 0) * 10 + Math.max(prog(t, tNot - 0.35, tNot - 0.1) - prog(t, tNot - 0.1, tNot + 0.15), 0) * 10;

  // Character: walks in, then raises his hands for prayer.
  const walkIn = prog(t, 0.45, 2.2, easeInOut);
  const x = lerp(1350, MAN3.x, walkIn);
  const walking = t > 0.45 && t < 2.25 ? 1 : 0;
  const base = mixPose(POSES.stand, POSES.takbir, prog(t, iA - 0.1, iA + 0.3));
  const pose = walking ? walk(POSES.stand, t, 2.4, 1) : breathe(base, t);
  const [sqx, sqy] = squash(t, iA + 0.3);

  const heartOn = prog(t, iB + 0.3, iB + 0.8);
  const beat = 1 + Math.max(0, Math.sin((t - tHeart) * 7)) * 0.15 * heartOn;
  const icons: { kind: "mat" | "kaaba" | "moon" | "coin"; x: number; y: number; at: number }[] = [
    { kind: "mat", x: 230, y: 760, at: W("all") },
    { kind: "kaaba", x: 850, y: 760, at: W("acts") },
    { kind: "moon", x: 190, y: 1130, at: W("of") },
    { kind: "coin", x: 890, y: 1130, at: W("worship") },
  ];
  const iconsOut = prog(t, iB - 0.2, iB + 0.2);

  const bubbleIn = springy(t, tNot - 0.25, 3, 8);
  const strike = prog(t, tTongue, tTongue + 0.3);
  const bubbleFall = prog(t, tTongue + 0.45, tTongue + 0.9, easeInOut);
  const card = prog(t, 0.05, 0.55);

  return (
    <AbsoluteFill>
      <Camera fx={fx} fy={fy} s={s} blur={camBlur}>
        {heartOn > 0 ? (
          <At x={HEART3.x} y={HEART3.y} style={{ opacity: heartOn }}>
            <Rays size={520} spin={t * 20} opacity={0.55 * heartOn} />
          </At>
        ) : null}
        {icons.map((ic, i) => {
          const sp = springy(t, ic.at - 0.05, 2.6, 7);
          if (sp <= 0) return null;
          const fl = Math.sin(t * 2 + i) * 10;
          return (
            <At key={ic.kind} x={lerp(ic.x, MAN3.x, iconsOut)} y={lerp(ic.y + fl, HEART3.y, iconsOut)} style={{ transform: `translate(-50%, -50%) scale(${sp * (1 - iconsOut)})` }}>
              <WorshipIcon kind={ic.kind} size={150} />
            </At>
          );
        })}
        <At x={x} y={MAN3.feet} anchor="bottom" style={{ transform: `translate(-50%, -100%) scale(${sqx}, ${sqy})`, transformOrigin: "50% 100%" }}>
          <Man pose={pose} size={MAN3.size} heart={heartOn > 0 ? { color: theme.gold, glow: heartOn, scale: beat * (0.6 + 0.6 * heartOn) } : null} />
        </At>
        {bubbleIn > 0 ? (
          <At
            x={HEAD3.x + 130}
            y={HEAD3.y - 170 + bubbleFall * 900}
            style={{ transform: `translate(-50%, -50%) scale(${bubbleIn}) rotate(${bubbleFall * 25 + Math.sin(t * 40) * 3 * strike * (1 - bubbleFall)}deg)`, opacity: 1 - bubbleFall }}
          >
            <div style={{ position: "relative" }}>
              <Bubble width={400} text="“I intend to pray…”" font={serifItalic} size={40} />
              <svg width={440} height={140} viewBox="0 0 440 140" style={{ position: "absolute", left: -20, top: -10 }}>
                <path d="M 20 110 L 420 30" stroke="#d3302a" strokeWidth={14} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - strike} />
              </svg>
            </div>
          </At>
        ) : null}
      </Camera>
      <div style={{ position: "absolute", top: 270, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `translate(${(1 - card) * -900}px, ${(1 - card) * -300}px) rotate(${(1 - card) * -12}deg)` }}>
        <NameCard kicker="Explanation" name="Shaykh Ibn Baz" font={serif} arabicFont={amiri} />
      </div>
      <ArabicLine t={t} text={quote[0]} from={iA} to={iB - 0.05} y={1440} />
      <ArabicLine t={t} text={quote[1]} from={iB} to={dur} y={1440} />
      <Captions t={t} words={words} y={1580} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 4: intended, held back by an excuse, still rewarded.

const Explain2: React.FC<{ t: number; dur: number; W: ReturnType<typeof wordTime>; words: Word[]; quote: [string, string] }> = ({ t, dur, W, words, quote }) => {
  const tIntends = W("intends");
  const tHeld = W("held");
  const tReceives = W("receives");
  const tReward = W("reward");
  const tAuth = W("authentic");
  const tWhen = W("when");
  const tTravels = W("travels");
  const tAllah = W("allah");
  const tHome = W("home");

  // Part A: street. The man walks (scenery scrolls) until the sign stops him.
  const stopP = prog(t, tHeld - 0.1, tHeld + 0.4, easeInOut);
  const dist = t < tHeld ? t * 260 : tHeld * 260 + (1 - Math.exp(-(t - tHeld) * 6)) * 60; // scroll in px
  const walkAmt = 1 - stopP;
  const partA = 1 - prog(t, tWhen - 0.35, tWhen + 0.05, easeInOut);
  const partB = prog(t, tWhen - 0.3, tWhen + 0.25, easeInOut);
  const sign = prog(t, tHeld - 0.05, tHeld + 0.25, easeInOut);
  const [shx, shy] = shake(t, tHeld + 0.25, 18);
  const thought = springy(t, tIntends, 2.6, 7);
  const thoughtOut = prog(t, tHeld + 0.1, tHeld + 0.4);

  // Deeds book and stars.
  const book = springy(t, tReceives - 0.1, 2.4, 7);
  const fill = keys(t, [
    [tReward, 0],
    [tReward + 1.4, 0.45],
    [tAllah, 0.5],
    [tHome, 1],
  ], easeInOut);
  const cite = prog(t, tAuth, tAuth + 0.45);
  const glow = prog(t, tHome - 0.1, tHome + 0.4);

  const pose = walkAmt > 0.01 ? walk(POSES.stand, t, 2.4, walkAmt) : breathe(POSES.stand, t);
  const manX = 380;
  const BOOK = { x: 540, y: 600 };

  // Stars from a source towards the book.
  const starStream = (from: { x: number; y: number }, start: number, end: number, n: number, seed: number) =>
    Array.from({ length: n }, (_, i) => {
      const t0 = start + ((end - start) * i) / n;
      const p = prog(t, t0, t0 + 0.7, easeInOut);
      if (p <= 0 || p >= 1) return null;
      const arc = Math.sin(p * Math.PI) * (120 + ((i * 37 + seed) % 80));
      return (
        <At key={`${seed}-${i}`} x={lerp(from.x, BOOK.x, p) + (seed % 2 ? arc : -arc) * 0.5} y={lerp(from.y, BOOK.y, p) - arc} style={{ transform: `translate(-50%, -50%) rotate(${p * 360}deg) scale(${0.6 + Math.sin(p * Math.PI) * 0.6})` }}>
          <Star size={46} />
        </At>
      );
    });

  return (
    <AbsoluteFill style={{ transform: `translate(${shx}px, ${shy}px)` }}>
      {/* Part A: street */}
      <AbsoluteFill style={{ opacity: partA, transform: `translateX(${-(1 - partA) * 900}px)`, filter: partA < 0.98 ? `blur(${(1 - partA) * 20}px)` : undefined }}>
        <div style={{ position: "absolute", top: 1420, left: 0, right: 0, height: 500, background: "linear-gradient(180deg, #16245a, #0e1940)" }} />
        <div style={{ position: "absolute", top: 1412, left: 0, right: 0, height: 10, background: theme.gold, opacity: 0.5 }} />
        {/* Far layer */}
        {Array.from({ length: 8 }, (_, i) => {
          const x = ((i * 310 - dist * 0.25) % 2480 + 2480) % 2480 - 300;
          return (
            <div key={i} style={{ position: "absolute", left: x, top: 1420 - (260 + (i % 3) * 90), opacity: 0.55 }}>
              <Building w={200} h={260 + (i % 3) * 90} color="#22367a" />
            </div>
          );
        })}
        {/* Masjid, arrives from the right and stops near the sign */}
        <div style={{ position: "absolute", left: 1500 - dist * 0.55, top: 1420 - 380 }}>
          <Masjid width={420} />
        </div>
        {/* Near layer: lamp posts */}
        {Array.from({ length: 6 }, (_, i) => {
          const x = ((i * 480 - dist) % 2880 + 2880) % 2880 - 200;
          return (
            <div key={i} style={{ position: "absolute", left: x, top: 1100, width: 12, height: 320, background: "#2c4596", borderRadius: 6 }}>
              <div style={{ position: "absolute", top: -16, left: -16, width: 44, height: 22, borderRadius: 12, background: theme.gold, boxShadow: "0 0 30px rgba(212,168,82,0.8)" }} />
            </div>
          );
        })}
        <At x={manX} y={1424} anchor="bottom">
          <Man pose={pose} size={560} />
        </At>
        {thought > 0 ? (
          <At x={manX + 150} y={760} style={{ transform: `translate(-50%, -50%) scale(${thought * (1 - thoughtOut)})` }}>
            <div style={{ position: "relative", width: 320, height: 210, borderRadius: 999, background: "#fff", border: "5px solid #151c33", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Masjid width={130} color="#2c4596" />
              <Star size={56} />
              <div style={{ position: "absolute", width: 36, height: 36, borderRadius: 99, background: "#fff", border: "5px solid #151c33", bottom: -46, left: 60 }} />
              <div style={{ position: "absolute", width: 20, height: 20, borderRadius: 99, background: "#fff", border: "4px solid #151c33", bottom: -78, left: 40 }} />
            </div>
          </At>
        ) : null}
        {sign > 0 ? (
          <At x={720} y={lerp(-200, 1424, sign)} anchor="bottom" style={{ transform: `translate(-50%, -100%) rotate(${Math.sin((t - tHeld) * 18) * 6 * Math.exp(-(Math.max(t - tHeld - 0.25, 0)) * 4)}deg)`, transformOrigin: "50% 100%" }}>
            <RoadSign size={210} />
          </At>
        ) : null}
        {starStream({ x: manX - 20, y: 1100 }, tReward - 0.1, tWhen - 0.6, 6, 3)}
      </AbsoluteFill>

      {/* Part B: ill in bed, and travelling, side by side */}
      {partB > 0 ? (
        <AbsoluteFill>
          {[
            { x: 290, at: tWhen - 0.25, label: "ILL" },
            { x: 790, at: tTravels - 0.35, label: "TRAVELLING" },
          ].map((panel, i) => {
            const p = prog(t, panel.at, panel.at + 0.45);
            const bob = Math.sin(t * 2 + i) * 6;
            return (
              <At key={panel.label} x={panel.x} y={lerp(2400, 1110, p) + bob}>
                <div
                  style={{
                    position: "relative",
                    width: 470,
                    height: 470,
                    borderRadius: 36,
                    overflow: "hidden",
                    background: i === 0 ? "linear-gradient(180deg, #2a4290, #1b2d66)" : "linear-gradient(180deg, #e9a65a, #b35d3a)",
                    border: `3px solid ${theme.gold}`,
                    boxShadow: "0 30px 70px rgba(0,0,0,0.45)",
                  }}
                >
                  {i === 0 ? (
                    <>
                      <div style={{ position: "absolute", left: 30, top: 200 }}>
                        <Bed width={410}>
                          <LyingMan width={410} breath={Math.sin(t * 2.2)} />
                        </Bed>
                      </div>
                      <div style={{ position: "absolute", left: 340, top: 60, transform: `rotate(${Math.sin(t * 3) * 8}deg)` }}>
                        <Thermometer size={110} />
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ position: "absolute", left: 0, right: 0, top: 360, height: 110, background: "#5b3a2a" }} />
                      {Array.from({ length: 4 }, (_, k) => (
                        <div key={k} style={{ position: "absolute", top: 410, left: ((k * 160 - t * 260) % 640 + 640) % 640 - 80, width: 80, height: 10, background: "#f2d39a", borderRadius: 5 }} />
                      ))}
                      <div style={{ position: "absolute", left: 120, top: 40 }}>
                        <Man pose={walk(POSES.carry, t, 2.6, 0.9)} size={330} />
                      </div>
                      <div style={{ position: "absolute", left: 255, top: 248 }}>
                        <Suitcase size={110} />
                      </div>
                    </>
                  )}
                  <div style={{ position: "absolute", left: 20, top: 18, fontFamily: sans, fontWeight: 800, fontSize: 30, color: "#fff", letterSpacing: "0.08em" }}>{panel.label}</div>
                </div>
              </At>
            );
          })}
          {starStream({ x: 290, y: 1050 }, tAllah - 0.2, dur - 0.6, 7, 5)}
          {starStream({ x: 790, y: 1050 }, tAllah, dur - 0.5, 7, 8)}
        </AbsoluteFill>
      ) : null}

      {/* Deeds book (stays across both parts) */}
      {book > 0 ? (
        <At x={BOOK.x} y={BOOK.y} style={{ transform: `translate(-50%, -50%) scale(${book})` }}>
          <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
            {glow > 0 ? (
              <div style={{ position: "absolute", top: -170, left: "50%", transform: "translateX(-50%)" }}>
                <Rays size={620} spin={t * 30} opacity={glow * 0.8} />
              </div>
            ) : null}
            <div style={{ position: "relative" }}>
              <DeedsBook width={400} fill={fill} label="Reward" font={serif} />
            </div>
            {cite > 0 ? (
              <div style={{ marginTop: 14, transform: `perspective(600px) rotateX(${(1 - cite) * 90}deg)`, opacity: cite, fontFamily: serif, fontSize: 30, color: theme.gold, border: `2px solid ${theme.gold}`, borderRadius: 999, padding: "6px 24px", background: "rgba(15,26,69,0.75)" }}>
                Sahih al-Bukhari 2996
              </div>
            ) : null}
          </div>
        </At>
      ) : null}

      <div style={{ position: "absolute", top: 270, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: 1 - book }}>
        <NameCard kicker="Explanation" name="Shaykh Ibn Baz" font={serif} arabicFont={amiri} />
      </div>
      <ArabicLine t={t} text={quote[0]} from={W("if")} to={tWhen - 0.3} y={1400} size={50} />
      <ArabicLine t={t} text={quote[1]} from={tWhen} to={dur} y={1400} size={50} />
      <Captions t={t} words={words} y={1590} />
    </AbsoluteFill>
  );
};


// ---------------------------------------------------------------------------
// Sound cues for this video's own scenes (shared cues come from ReelKit).

const ownCues = (p: IntentionMotionProps) => (add: AddCue) => {
  const W = (scene: SceneKey) => wordTime(p.words[scene]);
  const h = W("hook");
  add("hook", 0.55, "pop", 0.35);
  add("hook", 0.73, "pop_high", 0.3);
  add("hook", h("one"), "hit", 0.5);
  for (const w of ["that", "changes"]) add("hook", h(w), "tick", 0.3);
  add("hook", h("every"), "ding", 0.25);

  const e = W("explain1");
  add("explain1", 0.05, "swipe", 0.35);
  for (let tt = 0.6; tt < 2.2; tt += 0.42) add("explain1", tt, "step", 0.3);
  add("explain1", e("intention"), "bubble", 0.3);
  for (const w of ["all", "acts", "of", "worship"]) add("explain1", e(w), "pop", 0.28);
  add("explain1", e("intention", 1), "whoosh", 0.35);
  add("explain1", e("heart") - 0.1, "heartbeat", 0.6);
  add("explain1", e("not") - 0.25, "pop_high", 0.35);
  add("explain1", e("tongue"), "strike", 0.45);

  const f = W("explain2");
  for (let tt = 0.4; tt < f("held"); tt += 0.42) add("explain2", tt, "step", 0.22);
  add("explain2", f("intends"), "bubble", 0.3);
  add("explain2", f("held") + 0.22, "hit", 0.55);
  add("explain2", f("receives") - 0.1, "pop", 0.35);
  add("explain2", f("reward"), "sparkle", 0.3);
  add("explain2", f("authentic"), "swipe", 0.3);
  add("explain2", f("when") - 0.3, "whip", 0.4);
  add("explain2", f("travels") - 0.35, "whoosh", 0.3);
  add("explain2", f("writes"), "scratch", 0.22);
  add("explain2", f("allah"), "sparkle", 0.28);
  add("explain2", f("healthy"), "sparkle", 0.28);
  add("explain2", f("home"), "ding", 0.35);

};

export const IntentionMotion: React.FC<IntentionMotionProps> = (p) => {
  const hadith: HadithLayout = {
    narrator: "Narrated by Umar ibn al-Khattab",
    stamp: "Sahih al-Bukhari 1",
    arabic: p.arabicLines,
    line1: ["actions", 0],
    line2: ["and", 0],
    stampWord: "reported",
  };
  return (
    <ReelRunner
      p={p}
      hadith={hadith}
      scenes={{
        hook: ({ t, dur, W }) => <Hook t={t} dur={dur} W={W} />,
        explain1: ({ t, dur, W, words }) => <Explain1 t={t} dur={dur} W={W} words={words} quote={p.quote1} />,
        explain2: ({ t, dur, W, words }) => <Explain2 t={t} dur={dur} W={W} words={words} quote={p.quote2} />,
      }}
      cues={ownCues(p)}
    />
  );
};
