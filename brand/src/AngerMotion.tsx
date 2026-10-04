import React from "react";
import { AbsoluteFill } from "remotion";
import { dark as theme } from "./theme";
import { easeInOut, keys, lerp, prog, shake, springy, squash } from "./motion/anim";
import { MAN_GREY, MAN_STRONG, MAN_WHITE, Man, POSES, breathe, mixPose } from "./motion/Man";
import { AngerMeter, Barbell, Check, CrowdFigure, Door, NameCard, Quran, Rays, ScribbleBubble, Steam, Tap, WaitHand } from "./motion/Props";
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
  type SceneProps,
} from "./motion/ReelKit";

// Video 02: "True Strength" (Sahih al-Bukhari 6114, explained by Ibn Baz).
// Sources: binbaz.org.sa/fatwas/18877 (seek refuge, citing Bukhari 6115) and
// binbaz.org.sa/fatwas/15012 (how to overcome anger). Shared parts come from ReelKit.

const { amiri, serif, sans } = fonts;

export type AngerMotionProps = ReelBase & {
  arabicLines: [string, string];
  quote1: string; // Ibn Baz's Arabic, first explanation (before the dhikr)
  dhikr: string; // «أعوذ بالله من الشيطان الرجيم»
  quote2: [string, string];
};

export const calculateAngerMetadata = reelMetadata<AngerMotionProps>();


// ---------------------------------------------------------------------------
// Scene 1: hook. A strongman lifts a barbell; the crowd cheers. "Who is truly strong?"

const Hook: React.FC<SceneProps> = ({ t, dur, W }) => {
  const s = keys(t, [
    [0, 1.6],
    [1.0, 1.0],
    [dur, 1.05],
  ]);
  const enter = springy(t, 0.1, 2.4, 6);
  const lift = Math.sin(t * 7) * 10; // barbell pumps up and down
  const [sx, sy] = shake(t, W("strong"), 16);
  const [qx, qy] = squash(t, 0.45);
  const who = prog(t, W("who"), W("who") + 0.2);
  const truly = prog(t, W("truly"), W("truly") + 0.2);
  const q = springy(t, W("strong"), 2.6, 6);
  const crowd = [140, 300, 780, 940, 220, 860];
  const colours = ["#9aa6c4", "#c9733a", "#2f8f6b", "#9aa6c4", "#5f79c4", "#c9733a"];
  return (
    <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px)` }}>
      <Camera fx={540} fy={960} s={s}>
        <div style={{ position: "absolute", left: 540 - 380, top: 970, opacity: 0.45 }}>
          <Rays size={760} spin={t * 25} opacity={0.6} />
        </div>
        <At x={540} y={1590} anchor="bottom" style={{ transform: `translate(-50%, -100%) scale(${enter * qx}, ${enter * qy})`, transformOrigin: "50% 100%" }}>
          <Man pose={{ ...POSES.lift, bob: Math.max(0, lift) }} style={MAN_STRONG} bulk={1.35} size={600} />
        </At>
        <At x={540} y={942 - Math.max(0, lift) * 1.15} style={{ transform: `translate(-50%, -50%) scale(${enter})` }}>
          <Barbell width={560} />
        </At>
        {crowd.map((x, i) => {
          const pop = springy(t, 0.2 + i * 0.08, 2.6, 7);
          const row = i >= 4 ? 1760 : 1680;
          return (
            <At key={i} x={x} y={row} anchor="bottom" style={{ transform: `translate(-50%, -100%) scale(${pop})`, transformOrigin: "50% 100%" }}>
              <CrowdFigure size={i >= 4 ? 200 : 170} color={colours[i]} arm={0.5 + 0.5 * Math.sin(t * 9 + i)} />
            </At>
          );
        })}
      </Camera>
      <div style={{ position: "absolute", top: 380, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 96, color: "#fff", opacity: who, transform: `scale(${lerp(2, 1, who)})`, textShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>WHO IS</div>
        <div style={{ position: "relative", fontFamily: sans, fontWeight: 800, fontSize: 112, color: theme.gold, opacity: truly, transform: `scale(${lerp(2.2, 1, truly)})`, textShadow: "0 10px 40px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>
          TRULY STRONG
          <span style={{ position: "absolute", left: "100%", marginLeft: 8, display: "inline-block", transform: `scale(${q}) rotate(${(1 - q) * 30}deg)`, color: "#fff" }}>?</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 3: two men argue; one boils over; "I seek refuge in Allah..." calms him.

const ANGRY = { x: 340, feet: 1390, size: 560 };
const OTHER = { x: 870, feet: 1390, size: 540 };
const kA = ANGRY.size / 520;
const HEAD_A = { x: ANGRY.x, y: ANGRY.feet - 432 * kA };

const Explain1: React.FC<SceneProps & { quote: string; dhikr: string }> = ({ t, dur, W, words, quote, dhikr }) => {
  const tWhen = W("when");
  const tAngry = W("angry");
  const tWord = W("i", 0);
  const tSeek = W("i", 1);
  const tRefuge = W("refuge");

  const card = prog(t, 0.05, 0.55);
  const rage = prog(t, tWhen, tAngry + 0.3, easeInOut) * (1 - prog(t, tRefuge, tRefuge + 1.6, easeInOut));
  const calm = prog(t, tRefuge, tRefuge + 1.4, easeInOut);
  const shakeX = Math.sin(t * 60) * 7 * rage;
  const s = keys(t, [
    [0, 1.05],
    [tWhen, 1.0],
    [tAngry, 1.28],
    [tSeek - 0.2, 1.28],
    [tSeek + 0.4, 1.05],
    [dur, 1.0],
  ]);
  const fx = keys(t, [
    [0, 540],
    [tWhen, 540],
    [tAngry, ANGRY.x + 120],
    [tSeek - 0.2, ANGRY.x + 120],
    [tSeek + 0.4, 540],
  ]);
  const fy = keys(t, [
    [0, 1050],
    [tAngry, 1000],
    [tSeek - 0.2, 1000],
    [tSeek + 0.4, 1050],
  ]);

  const angryPose = mixPose(mixPose(POSES.stand, POSES.accuse, prog(t, 0.6, 1.1)), POSES.fists, prog(t, tWhen, tWhen + 0.4));
  const pose = breathe(mixPose(angryPose, POSES.calm, calm), t);
  const otherPose = breathe(mixPose(mixPose(POSES.stand, POSES.fists, prog(t, 1.2, 1.6)), POSES.stand, calm), t + 1);

  // Argument: scribble bubbles alternate until the anger peaks.
  const bubbles = [] as React.ReactNode[];
  for (let i = 0, bt = 0.9; bt < tWord - 0.4; i++, bt += 0.85) {
    const life = prog(t, bt, bt + 0.25) * (1 - prog(t, bt + 0.7, bt + 0.85));
    if (life <= 0) continue;
    const left = i % 2 === 0;
    bubbles.push(
      <At key={i} x={left ? ANGRY.x + 150 : OTHER.x - 150} y={HEAD_A.y - 150 + (i % 3) * 10} style={{ transform: `translate(-50%, -50%) scale(${life}) rotate(${left ? -6 : 6}deg)` }}>
        <ScribbleBubble width={250} tail={left ? "left" : "right"} />
      </At>,
    );
  }

  // Steam from the angry head while the rage is high.
  const steam = [] as React.ReactNode[];
  if (rage > 0.2) {
    for (let i = 0; i < 6; i++) {
      const p = (t * 0.9 + i / 6) % 1;
      const side = i % 2 ? 1 : -1;
      steam.push(
        <At key={i} x={HEAD_A.x + side * (40 + p * 70)} y={HEAD_A.y - 40 - p * 200} style={{ opacity: rage }}>
          <Steam size={110} p={p} />
        </At>,
      );
    }
  }

  const orb = springy(t, tWord, 2.4, 6) * (1 - prog(t, tSeek - 0.15, tSeek + 0.1));
  const dz = springy(t, tSeek, 2.4, 6);
  const pill = prog(t, tRefuge + 0.3, tRefuge + 0.8);
  const glow = calm;

  return (
    <AbsoluteFill>
      <Camera fx={fx} fy={fy} s={s}>
        {glow > 0 ? (
          <At x={ANGRY.x} y={ANGRY.feet - 300} style={{ opacity: glow }}>
            <Rays size={620} spin={t * 20} opacity={0.5} />
          </At>
        ) : null}
        <At x={OTHER.x} y={OTHER.feet} anchor="bottom" style={{ transform: `translate(-50%, -100%) scaleX(-1)` }}>
          <Man pose={otherPose} style={MAN_GREY} size={OTHER.size} headTint={0.45 * rage} />
        </At>
        <At x={ANGRY.x + shakeX} y={ANGRY.feet} anchor="bottom">
          <Man pose={pose} style={MAN_WHITE} size={ANGRY.size} headTint={rage} heart={glow > 0.05 ? { color: theme.gold, glow, scale: 1 + glow * 0.4 } : null} />
        </At>
        {steam}
        {bubbles}
        <At x={88} y={920} style={{ transform: `translate(-50%, -50%) scale(${prog(t, tWhen - 0.2, tWhen + 0.2)}) rotate(${shakeX * 0.4}deg)` }}>
          <AngerMeter height={260} level={0.12 + 0.86 * rage} />
        </At>
      </Camera>

      {/* "I know a word..." a glowing orb waits; then the words themselves appear. */}
      {orb > 0 ? (
        <At x={540} y={600} style={{ transform: `translate(-50%, -50%) scale(${orb * (1 + Math.sin(t * 6) * 0.05)})` }}>
          <div style={{ width: 150, height: 150, borderRadius: 999, background: "radial-gradient(circle, #fff6d8 0%, #d4a852 45%, rgba(212,168,82,0) 72%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans, fontWeight: 800, fontSize: 70, color: "#1b2d66" }}>
            ?
          </div>
        </At>
      ) : null}
      {dz > 0 ? (
        <At x={540} y={600} style={{ transform: `translate(-50%, -50%) scale(${dz})` }}>
          <div style={{ position: "relative", padding: "22px 40px 30px", borderRadius: 34, background: "linear-gradient(180deg, #fff9e8, #f2e0b4)", border: `4px solid ${theme.gold}`, boxShadow: "0 0 60px rgba(212,168,82,0.6), 0 20px 50px rgba(0,0,0,0.35)", textAlign: "center", width: 860 }}>
            <div lang="ar" dir="rtl" style={{ fontFamily: amiri, fontWeight: 700, fontSize: 62, lineHeight: 1.75, color: "#8a5a12" }}>
              {dhikr}
            </div>
            <div style={{ fontFamily: serif, fontSize: 36, lineHeight: 1.3, color: "#1b2d66", marginTop: 16 }}>“I seek refuge in Allah from the accursed Shaytan.”</div>
          </div>
        </At>
      ) : null}

      <div style={{ position: "absolute", top: 270, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `translate(${(1 - card) * -900}px, ${(1 - card) * -300}px) rotate(${(1 - card) * -12}deg)`, opacity: 1 - prog(t, tWord - 0.3, tWord) }}>
        <NameCard kicker="Explanation" name="Shaykh Ibn Baz" font={serif} arabicFont={amiri} />
      </div>
      {pill > 0 ? (
        <div style={{ position: "absolute", top: 1440, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <div style={{ transform: `perspective(600px) rotateX(${(1 - pill) * 90}deg)`, opacity: pill, fontFamily: serif, fontSize: 32, color: theme.gold, border: `2px solid ${theme.gold}`, borderRadius: 999, padding: "6px 26px", background: "rgba(15,26,69,0.8)" }}>
            Hadith: Sahih al-Bukhari 6115
          </div>
        </div>
      ) : null}
      <ArabicLine t={t} text={quote} from={tWhen} to={tSeek - 0.05} y={1415} size={44} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 4: "Do not be hasty" + three remedies, each on a card; he calms down step by step.

const Explain2: React.FC<SceneProps & { quote: [string, string] }> = ({ t, dur, W, words, quote }) => {
  const tHasty = W("hasty");
  const tBeware = W("beware");
  const tLeave = W("leaving");
  const tWudu = W("occupying");
  const tQuran = W("reading");

  const wait = prog(t, tHasty - 0.05, tHasty + 0.15, easeInOut);
  const waitOut = prog(t, tBeware - 0.2, tBeware + 0.2);
  const [sx, sy] = shake(t, tHasty + 0.15, 18);
  const steps = [tLeave, tWudu, tQuran].map((x) => prog(t, x + 0.2, x + 0.9, easeInOut));
  const calm = (steps[0] + steps[1] + steps[2]) / 3;
  const rage = 0.85 * (1 - calm);
  const pose = breathe(mixPose(POSES.fists, POSES.calm, calm), t);
  const shakeX = Math.sin(t * 60) * 6 * rage * (1 - wait * (1 - waitOut) * 0.7);
  const s = keys(t, [
    [0, 1.08],
    [tHasty, 1.0],
    [dur, 1.04],
  ]);

  const cards = [
    { at: tLeave, x: 190, label: "LEAVE THE\nGATHERING" },
    { at: tWudu, x: 540, label: "MAKE\nWUDU" },
    { at: tQuran, x: 890, label: "READ THE\nQURAN" },
  ];

  return (
    <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px)` }}>
      <Camera fx={540} fy={1000} s={s}>
        {calm > 0.6 ? (
          <At x={540} y={1100} style={{ opacity: (calm - 0.6) / 0.4 }}>
            <Rays size={640} spin={t * 20} opacity={0.5} />
          </At>
        ) : null}
        <At x={540 + shakeX} y={1400} anchor="bottom">
          <Man pose={pose} style={MAN_WHITE} size={520} headTint={rage} heart={calm > 0.9 ? { color: theme.gold, glow: (calm - 0.9) * 10, scale: 1.2 } : null} />
        </At>
        <At x={170} y={1180}>
          <AngerMeter height={280} level={0.1 + 0.85 * rage} />
        </At>
        {cards.map((c, i) => {
          const pop = springy(t, c.at - 0.1, 2.6, 7);
          if (pop <= 0) return null;
          const chk = prog(t, c.at + 0.55, c.at + 0.9);
          const float = Math.sin(t * 2 + i) * 6;
          return (
            <At key={i} x={c.x} y={700 + float} style={{ transform: `translate(-50%, -50%) scale(${pop}) rotate(${(1 - Math.min(pop, 1)) * 20}deg)` }}>
              <div style={{ position: "relative", width: 300, height: 340, borderRadius: 30, background: "rgba(15,26,69,0.85)", border: `3px solid ${theme.gold}`, boxShadow: "0 24px 60px rgba(0,0,0,0.4)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "26px 10px 22px" }}>
                <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {i === 0 ? <Door size={120} open={prog(t, c.at + 0.1, c.at + 0.6)} /> : i === 1 ? <Tap size={130} t={t} /> : <Quran width={230} glow={0.6 + 0.4 * Math.sin(t * 4)} />}
                </div>
                <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 28, lineHeight: 1.15, color: "#fff", textAlign: "center", whiteSpace: "pre-line" }}>{c.label}</div>
                <div style={{ position: "absolute", top: -26, right: -20, transform: `scale(${chk > 0 ? 1 : 0})` }}>
                  <Check size={64} p={chk} />
                </div>
              </div>
            </At>
          );
        })}
      </Camera>
      {wait > 0 && waitOut < 1 ? (
        <At x={540} y={620} style={{ transform: `translate(-50%, -50%) scale(${lerp(2.6, 1, wait) * (1 - waitOut)}) rotate(${(1 - wait) * -15}deg)`, opacity: wait * (1 - waitOut) }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <WaitHand size={240} />
            <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 80, color: "#fff", letterSpacing: "0.04em", textShadow: "0 8px 30px rgba(0,0,0,0.5)" }}>DON'T RUSH</div>
          </div>
        </At>
      ) : null}
      <ArabicLine t={t} text={quote[0]} from={W("do")} to={tLeave - 0.1} y={1440} size={48} />
      <ArabicLine t={t} text={quote[1]} from={tLeave} to={dur} y={1440} size={44} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Sound cues for this video's own scenes (only the fixed sound set).

const ownCues = (p: AngerMotionProps) => (add: AddCue) => {
  const W = (scene: SceneKey) => wordTime(p.words[scene]);
  const h = W("hook");
  add("hook", 0.3, "pop", 0.3);
  add("hook", 0.5, "pop_high", 0.25);
  add("hook", h("who"), "hit", 0.45);
  add("hook", h("truly"), "hit", 0.4);
  add("hook", h("strong"), "pop", 0.4);

  const e = W("explain1");
  add("explain1", 0.05, "swipe", 0.35);
  for (let bt = 0.9; bt < e("i", 0) - 0.4; bt += 0.85) add("explain1", bt, "bubble", 0.28);
  add("explain1", e("intensely"), "whoosh", 0.3);
  add("explain1", e("angry"), "heartbeat", 0.55);
  add("explain1", e("i", 0), "pop_high", 0.3);
  add("explain1", e("i", 1), "sparkle", 0.35);
  add("explain1", e("refuge") + 0.2, "ding", 0.35);
  add("explain1", e("refuge") + 0.35, "swipe", 0.25);

  const f = W("explain2");
  add("explain2", f("hasty") + 0.1, "stamp", 0.55);
  for (const w of ["leaving", "occupying", "reading"]) {
    add("explain2", f(w) - 0.1, "pop", 0.35);
    add("explain2", f(w) + 0.6, "ding", 0.25);
  }
  add("explain2", f("reading") + 1.0, "sparkle", 0.3);
};

export const AngerMotion: React.FC<AngerMotionProps> = (p) => {
  const hadith: HadithLayout = {
    narrator: "Narrated by Abu Huraira",
    stamp: "Sahih al-Bukhari 6114",
    arabic: p.arabicLines,
    line1: ["the", 1],
    line2: ["but", 0],
    stampWord: "reported",
    arabicSize: 76,
    englishSize: 44,
    contentTop: 235,
    stampBottom: 22,
  };
  return (
    <ReelRunner
      p={p}
      hadith={hadith}
      scenes={{
        hook: Hook,
        explain1: (sp) => <Explain1 {...sp} quote={p.quote1} dhikr={p.dhikr} />,
        explain2: (sp) => <Explain2 {...sp} quote={p.quote2} />,
      }}
      cues={ownCues(p)}
    />
  );
};
