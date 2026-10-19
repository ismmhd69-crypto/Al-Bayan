import React from "react";
import { AbsoluteFill } from "remotion";
import { dark as theme } from "./theme";
import { easeInOut, keys, lerp, prog, shake, springy } from "./motion/anim";
import { MAN_GREY, MAN_WHITE, Man, POSES, breathe, mixPose, walk } from "./motion/Man";
import { Check, CrowdFigure, NameCard, Quran, Rays, Star } from "./motion/Props";
import { LightOrb } from "./motion/Props2";
import { ArabicLine, At, Camera, Captions, ReelRunner, UI, fonts, reelMetadata, wordTime, type AddCue, type HadithLayout, type ReelBase, type SceneKey, type SceneProps } from "./motion/ReelKit";

// Video 05 (Turkish): "EN HAYIRLINIZ". Hadith: Sahih al-Bukhari 5027 (HadeethEnc Turkish 5913).
// Explanations: Ibn Baz, binbaz.org.sa/fatwas/1696 and /3536. Turkish scholar lines are
// Claude's translation (needs a Turkish reviewer).

const { amiri, serif, sans } = fonts;

export type BestQuranMotionProps = ReelBase & {
  arabicLines: [string, string];
  quote1: string;
  quote2: [string, string];
};
export const calculateBestQuranMetadata = reelMetadata<BestQuranMotionProps>();

const Title: React.FC<{ p: number; size: number; color?: string; children: React.ReactNode }> = ({ p, size, color = "#fff", children }) => (
  <div style={{ fontFamily: sans, fontWeight: 800, fontSize: size, color, opacity: p, transform: `scale(${lerp(2, 1, p)})`, textShadow: "0 10px 40px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>{children}</div>
);

// Scene 1: a spotlight sweeps along a row of people and stops on the one holding the Quran.
const Hook: React.FC<SceneProps> = ({ t, dur, W }) => {
  const s = keys(t, [
    [0, 1.4],
    [1.0, 1.0],
    [dur, 1.05],
  ]);
  const l1 = prog(t, W("insanların"), W("insanların") + 0.2);
  const l2 = prog(t, W("hayırlısı"), W("hayırlısı") + 0.2);
  const beamX = keys(t, [
    [0.2, 140],
    [W("hayırlısı"), 940],
    [W("kim"), 540],
  ]);
  const found = prog(t, W("kim"), W("kim") + 0.4);
  const [sx, sy] = shake(t, W("kim") + 0.05, 10);
  const crowd = [120, 270, 810, 960];
  const colours = ["#9aa6c4", "#c9733a", "#2f8f6b", "#5f79c4"];
  return (
    <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px)` }}>
      <Camera fx={540} fy={1150} s={s}>
        {/* Spotlight beam */}
        <div style={{ position: "absolute", left: beamX - 260, top: 560, width: 520, height: 1000, background: "linear-gradient(180deg, rgba(255,240,200,0.0) 0%, rgba(255,240,200,0.28) 60%, rgba(255,240,200,0.4) 100%)", clipPath: "polygon(42% 0, 58% 0, 100% 100%, 0 100%)" }} />
        {crowd.map((x, i) => (
          <At key={i} x={x} y={1560} anchor="bottom" style={{ opacity: 0.75 }}>
            <CrowdFigure size={260} color={colours[i]} arm={0.15 + 0.1 * Math.sin(t * 3 + i)} />
          </At>
        ))}
        {found > 0 ? (
          <At x={540} y={1080} style={{ opacity: found }}>
            <Rays size={700} spin={t * 20} opacity={0.6} />
          </At>
        ) : null}
        <At x={540} y={1560} anchor="bottom">
          <Man pose={breathe(POSES.give, t)} style={MAN_WHITE} size={560} heart={found > 0 ? { color: theme.gold, glow: found, scale: 1.1 } : null} />
        </At>
        <At x={700} y={1180} style={{ transform: `translate(-50%, -50%) rotate(-8deg) scale(${0.9 + found * 0.2})` }}>
          <Quran width={180} glow={0.4 + found} />
        </At>
      </Camera>
      <div style={{ position: "absolute", top: 380, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Title p={l1} size={96}>
          İNSANLARIN
        </Title>
        <Title p={l2} size={104} color={theme.gold}>
          EN HAYIRLISI KİM?
        </Title>
      </div>
    </AbsoluteFill>
  );
};

// Scene 3: learn, teach, act. Three cards, each acted out.
const Explain1: React.FC<SceneProps & { quote: string }> = ({ t, dur, W, words, quote }) => {
  const card = prog(t, 0.05, 0.55);
  const steps = [
    { at: W("öğrenen"), label: "ÖĞRENEN", x: 190 },
    { at: W("öğreten"), label: "ÖĞRETEN", x: 540 },
    { at: W("amel"), label: "AMEL EDEN", x: 890 },
  ];
  const ehl = prog(t, W("ehlidir"), W("ehlidir") + 0.5);
  const pose = t < W("amel") ? breathe(POSES.give, t) : breathe(mixPose(POSES.give, POSES.takbir, prog(t, W("amel"), W("amel") + 0.4)), t);
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1000} s={keys(t, [[0, 1.06], [W("öğrenen"), 1.0], [dur, 1.04]])}>
        {ehl > 0 ? (
          <At x={540} y={1150} style={{ opacity: ehl }}>
            <Rays size={640} spin={t * 18} opacity={0.6} />
          </At>
        ) : null}
        <At x={540} y={1400} anchor="bottom">
          <Man pose={pose} style={MAN_WHITE} size={520} heart={ehl > 0 ? { color: theme.gold, glow: ehl, scale: 1.2 } : null} />
        </At>
        {steps.map((c, i) => {
          const pop = springy(t, c.at - 0.1, 2.6, 7);
          if (pop <= 0) return null;
          const chk = prog(t, c.at + 0.5, c.at + 0.85);
          return (
            <At key={i} x={c.x} y={720 + Math.sin(t * 2 + i) * 6} style={{ transform: `translate(-50%, -50%) scale(${pop})` }}>
              <div style={{ position: "relative", width: 300, height: 320, borderRadius: 30, background: "rgba(15,26,69,0.85)", border: `3px solid ${theme.gold}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "20px 10px 22px", boxShadow: "0 24px 60px rgba(0,0,0,0.4)" }}>
                <div style={{ height: 200, width: 280, position: "relative", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                  {i === 0 ? (
                    <>
                      <Man pose={breathe(POSES.give, t)} size={190} />
                      <div style={{ position: "absolute", left: 160, top: 70 }}>
                        <Quran width={90} glow={0.8} />
                      </div>
                    </>
                  ) : i === 1 ? (
                    <>
                      <Man pose={breathe(POSES.point, t)} size={190} />
                      <div style={{ display: "flex", gap: 2, alignItems: "flex-end" }}>
                        <Man pose={breathe(POSES.stand, t + 1)} style={MAN_GREY} size={120} />
                        <Man pose={breathe(POSES.stand, t + 2)} style={MAN_GREY} size={120} />
                      </div>
                    </>
                  ) : (
                    <Man pose={breathe(POSES.takbir, t)} size={190} heart={{ color: theme.gold, glow: 1, scale: 1 }} />
                  )}
                </div>
                <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 32, color: "#fff" }}>{c.label}</div>
                <div style={{ position: "absolute", top: -24, right: -20, transform: `scale(${chk > 0 ? 1 : 0})` }}>
                  <Check size={60} p={chk} />
                </div>
              </div>
            </At>
          );
        })}
        {ehl > 0 ? (
          <At x={540} y={940} style={{ transform: `translate(-50%, -50%) scale(${springy(t, W("ehlidir"), 2.4, 7)})` }}>
            <div style={{ padding: "10px 30px", borderRadius: 999, background: theme.gold, color: "#1b2d66", fontFamily: sans, fontWeight: 800, fontSize: 40 }}>KUR'AN EHLİ</div>
          </At>
        ) : null}
      </Camera>
      <div style={{ position: "absolute", top: 270, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `translate(${(1 - card) * -900}px, ${(1 - card) * -300}px) rotate(${(1 - card) * -12}deg)`, opacity: 1 - prog(t, W("öğrenen") - 0.4, W("öğrenen") - 0.1) }}>
        <NameCard kicker={UI.tr.explanation} name={UI.tr.ibnBaz} font={serif} arabicFont={amiri} />
      </div>
      <ArabicLine t={t} text={quote} from={W("insanların")} to={dur} y={1430} size={46} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

// Scene 4: knowledge passes on as light, teacher -> student -> student; then the straight path.
const Explain2: React.FC<SceneProps & { quote: [string, string] }> = ({ t, dur, W, words, quote }) => {
  const tTeach = W("öğretmek");
  const tCloser = W("yaklaştıran");
  const tBest = W("faziletlilerindendir");
  const tPurpose = W("bundan");
  const tAmel = W("amel");
  const tStraight = W("dosdoğru");
  const people = [
    { x: 200, style: MAN_WHITE, size: 520, lit: 0 },
    { x: 540, style: MAN_GREY, size: 440, lit: tTeach + 1.0 },
    { x: 860, style: MAN_GREY, size: 400, lit: tCloser + 1.0 },
  ];
  const orb = (from: number, to: number, start: number) => {
    const p = prog(t, start, start + 1.0, easeInOut);
    if (p <= 0 || p >= 1) return null;
    return (
      <At x={lerp(from, to, p)} y={980 - Math.sin(p * Math.PI) * 220}>
        <LightOrb size={150} />
      </At>
    );
  };
  const best = springy(t, tBest, 2.4, 7) * (1 - prog(t, tPurpose - 0.3, tPurpose));
  const act = prog(t, tAmel, tAmel + 0.4);
  const path = prog(t, tStraight - 0.2, tStraight + 0.6);
  const walkOn = t > tStraight + 0.2;
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1020} s={keys(t, [[0, 1.05], [tTeach, 1.0], [tStraight, 1.0], [dur, 1.08]])}>
        {/* The straight path */}
        <svg width={1080} height={120} viewBox="0 0 1080 120" style={{ position: "absolute", left: 0, top: 1360 }}>
          <line x1={40} y1={60} x2={1040} y2={60} stroke={theme.gold} strokeWidth={14} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - path} />
        </svg>
        {people.map((m, i) => {
          const lit = i === 0 ? 1 : prog(t, m.lit, m.lit + 0.4);
          const pose = act > 0 ? breathe(mixPose(POSES.stand, POSES.takbir, act), t + i) : i === 0 ? breathe(POSES.give, t) : breathe(POSES.stand, t + i);
          const dx = walkOn ? (t - tStraight - 0.2) * 60 : 0;
          return (
            <At key={i} x={m.x + dx} y={1400} anchor="bottom">
              <Man pose={walkOn ? walk(POSES.stand, t + i * 0.3, 2.4, 1) : pose} style={m.style} size={m.size} heart={lit > 0 ? { color: theme.gold, glow: lit, scale: 1 } : null} />
            </At>
          );
        })}
        <At x={330} y={1100} style={{ transform: "translate(-50%, -50%) rotate(-6deg)" }}>
          <Quran width={150} glow={0.6 + 0.4 * Math.sin(t * 3)} />
        </At>
        {orb(330, 540, tTeach)}
        {orb(560, 860, tCloser)}
        {best > 0.01 ? (
          <At x={540} y={700} style={{ transform: `translate(-50%, -50%) scale(${best})` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 34px", borderRadius: 999, background: "rgba(15,26,69,0.88)", border: `3px solid ${theme.gold}`, fontFamily: sans, fontWeight: 800, fontSize: 40, color: theme.gold, whiteSpace: "nowrap" }}>
              <Star size={40} /> EN FAZİLETLİ AMEL <Star size={40} />
            </div>
          </At>
        ) : null}
        {path > 0.9 ? (
          <At x={540} y={1300}>
            <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 36, color: theme.gold, letterSpacing: "0.08em", opacity: prog(t, tStraight + 0.4, tStraight + 0.8) }}>DOSDOĞRU</div>
          </At>
        ) : null}
      </Camera>
      <ArabicLine t={t} text={quote[0]} from={W("allahın")} to={tPurpose - 0.1} y={1450} size={46} />
      <ArabicLine t={t} text={quote[1]} from={tPurpose} to={dur} y={1450} size={44} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

const ownCues = (p: BestQuranMotionProps) => (add: AddCue) => {
  const W = (scene: SceneKey) => wordTime(p.words[scene]);
  const h = W("hook");
  add("hook", 0.2, "whoosh", 0.3);
  add("hook", h("insanların"), "hit", 0.4);
  add("hook", h("hayırlısı"), "swipe", 0.35);
  add("hook", h("kim"), "ding", 0.4);
  const e = W("explain1");
  add("explain1", 0.05, "swipe", 0.35);
  for (const w of ["öğrenen", "öğreten", "amel"]) {
    add("explain1", e(w) - 0.1, "pop", 0.35);
    add("explain1", e(w) + 0.5, "ding", 0.25);
  }
  add("explain1", e("ehlidir"), "chime", 0.35);
  const f = W("explain2");
  add("explain2", f("öğretmek"), "rise", 0.3);
  add("explain2", f("yaklaştıran"), "rise", 0.3);
  add("explain2", f("öğretmek") + 1.0, "sparkle", 0.3);
  add("explain2", f("yaklaştıran") + 1.0, "sparkle", 0.3);
  add("explain2", f("faziletlilerindendir"), "pop", 0.35);
  add("explain2", f("amel"), "whoosh", 0.25);
  add("explain2", f("dosdoğru") - 0.2, "scratch", 0.25);
  add("explain2", f("dosdoğru") + 0.6, "ding", 0.3);
};

export const BestQuranMotion: React.FC<BestQuranMotionProps> = (p) => {
  const hadith: HadithLayout = {
    narrator: "Rivayet eden: Osman b. Affân",
    stamp: "Sahih Buhârî 5027",
    arabic: p.arabicLines,
    line1: ["sizin", 0],
    line2: ["kur'an-ı", 0],
    stampWord: "buhari",
    arabicSize: 100,
    englishSize: 54,
  };
  return (
    <ReelRunner
      p={p}
      hadith={hadith}
      scenes={{
        hook: Hook,
        explain1: (sp) => <Explain1 {...sp} quote={p.quote1} />,
        explain2: (sp) => <Explain2 {...sp} quote={p.quote2} />,
      }}
      cues={ownCues(p)}
    />
  );
};
