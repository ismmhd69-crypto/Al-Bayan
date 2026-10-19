import React from "react";
import { AbsoluteFill } from "remotion";
import { dark as theme } from "./theme";
import { easeInOut, keys, lerp, prog, springy } from "./motion/anim";
import { MAN_WHITE, Man, POSES, breathe, mixPose, walk } from "./motion/Man";
import { Check, CrossBadge, NameCard, Rays, Star } from "./motion/Props";
import { MotherFigure } from "./motion/Props2";
import { ArabicLine, At, Camera, Captions, ReelRunner, UI, fonts, reelMetadata, wordTime, type AddCue, type HadithLayout, type ReelBase, type SceneKey, type SceneProps } from "./motion/ReelKit";

// Video 12 (Turkish): "BEŞ VAKİT". Hadith: Sahih al-Bukhari 528 (HadeethEnc Turkish 4968).
// Explanations: Ibn Baz, binbaz.org.sa/fatwas/14806 and /20000. Turkish scholar lines are
// Claude's translation (needs a Turkish reviewer).

const { amiri, serif, sans } = fonts;

export type FivePrayersMotionProps = ReelBase & {
  arabicLines: [string, string];
  quote1: string;
  quote2: string;
};
export const calculateFivePrayersMetadata = reelMetadata<FivePrayersMotionProps>();

const GROUND = 1390;
const PRAYERS = ["SABAH", "ÖĞLE", "İKİNDİ", "AKŞAM", "YATSI"];

const Title: React.FC<{ p: number; size: number; color?: string; children: React.ReactNode }> = ({ p, size, color = "#fff", children }) => (
  <div style={{ fontFamily: sans, fontWeight: 800, fontSize: size, color, opacity: p, transform: `scale(${lerp(2, 1, p)})`, textShadow: "0 10px 40px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>{children}</div>
);

const Pill: React.FC<{ children: React.ReactNode; gold?: boolean; size?: number }> = ({ children, gold = false, size = 40 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 30px", borderRadius: 999, background: gold ? theme.gold : "rgba(15,26,69,0.88)", border: `3px solid ${theme.gold}`, fontFamily: sans, fontWeight: 800, fontSize: size, color: gold ? "#1b2d66" : theme.gold, whiteSpace: "nowrap", boxShadow: gold ? "0 0 40px rgba(212,168,82,0.6)" : "0 10px 30px rgba(0,0,0,0.4)" }}>
    {children}
  </div>
);

/** Dark stains over a Man of the given size (sins); `p` 0..1 visibility, `big` keeps the large ones. */
const Stains: React.FC<{ size: number; p: number; bigOnly?: boolean }> = ({ size, p, bigOnly = false }) => {
  const spots = [
    { x: -40, y: -300, r: 22 },
    { x: 30, y: -250, r: 16 },
    { x: -20, y: -180, r: 26 },
    { x: 40, y: -130, r: 18 },
    { x: -50, y: -90, r: 14 },
    { x: 10, y: -60, r: 20 },
    { x: 55, y: -220, r: 12 },
  ];
  return (
    <svg width={size * 0.8} height={size} viewBox="-208 -510 416 520" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {spots.map((s, i) => (bigOnly && s.r < 20 ? null : <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#3a3326" opacity={p * 0.75} />))}
    </svg>
  );
};

const Water: React.FC<{ w: number; t: number }> = ({ w, t }) => (
  <svg width={w} height={90} viewBox={`0 0 ${w} 90`}>
    <rect width={w} height={90} rx={20} fill="#2f6fae" />
    {Array.from({ length: 8 }, (_, i) => {
      const x = ((i * 160 + t * 120) % (w + 160)) - 80;
      return <path key={i} d={`M ${x} 40 q 20 -14 40 0 q 20 14 40 0`} stroke="#7fc4f0" strokeWidth={6} fill="none" strokeLinecap="round" />;
    })}
  </svg>
);

// Scene 1: a man covered in stains; five drops; is there a way to be clean every day?
const Hook: React.FC<SceneProps> = ({ t, dur, W }) => {
  const s = keys(t, [
    [0, 1.15],
    [dur, 1.0],
  ]);
  const l1 = prog(t, W("günahlarını"), W("günahlarını") + 0.2);
  const l2 = prog(t, W("temizlemenin"), W("temizlemenin") + 0.2);
  const stains = prog(t, 0.2, 0.9);
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1030} s={s}>
        <At x={540} y={GROUND} anchor="bottom">
          <div style={{ position: "relative" }}>
            <Man pose={breathe({ ...POSES.stand, headTilt: 7 }, t)} style={MAN_WHITE} size={560} />
            <Stains size={560} p={stains} />
          </div>
        </At>
        {[0, 1, 2, 3, 4].map((i) => {
          const p = springy(t, W("her") + i * 0.12, 2.6, 7);
          if (p <= 0) return null;
          const a = Math.PI * (1 - i / 4);
          return (
            <At key={i} x={540 + Math.cos(a) * 360} y={1170 - Math.sin(a) * 410} style={{ transform: `translate(-50%, -50%) scale(${p})` }}>
              <svg width={70} height={80} viewBox="-20 -24 40 44">
                <path d="M 0 -22 Q 18 2 14 10 Q 8 20 0 20 Q -8 20 -14 10 Q -18 2 0 -22 Z" fill="#7fc4f0" />
              </svg>
            </At>
          );
        })}
      </Camera>
      <div style={{ position: "absolute", top: 340, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <Title p={l1} size={86}>
          GÜNAHLARINI HER GÜN
        </Title>
        <Title p={l2} size={78} color={theme.gold}>
          TEMİZLEMENİN
        </Title>
        <Title p={l2} size={78} color={theme.gold}>
          BİR YOLU VAR MI?
        </Title>
      </div>
    </AbsoluteFill>
  );
};

// Scroll overlay: five numbered circles (five washes); they turn gold for the five prayers.
const HadithOverlay: React.FC<SceneProps> = ({ t, dur, W }) => {
  const tFive = W("beş", 0);
  const tPrayer = W("namaz", 0);
  const gold = prog(t, tPrayer, tPrayer + 0.4);
  const out = prog(t, dur - 0.5, dur - 0.2);
  return (
    <AbsoluteFill style={{ opacity: 1 - out }}>
      {[0, 1, 2, 3, 4].map((i) => {
        const p = springy(t, tFive + i * 0.14, 2.6, 7);
        if (p <= 0) return null;
        const g = prog(t, tPrayer + i * 0.12, tPrayer + i * 0.12 + 0.3);
        return (
          <At key={i} x={180 + i * 180} y={290} style={{ transform: `translate(-50%, -50%) scale(${p})` }}>
            <div style={{ width: 120, height: 120, borderRadius: 999, background: g > 0.5 ? theme.gold : "#2f6fae", border: `4px solid ${g > 0.5 ? "#fff3cf" : "#7fc4f0"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: sans, fontWeight: 800, color: g > 0.5 ? "#1b2d66" : "#fff", boxShadow: `0 0 ${30 * g}px rgba(212,168,82,0.8)` }}>
              <div style={{ fontSize: 44, lineHeight: 1 }}>{i + 1}</div>
              {gold > 0.5 ? <div style={{ fontSize: 17, marginTop: 4 }}>{PRAYERS[i]}</div> : null}
            </div>
          </At>
        );
      })}
    </AbsoluteFill>
  );
};

// Scene 3: Ibn Baz. A man and a woman; the sun crosses the sky and each prayer time is kept on time.
const Explain1: React.FC<SceneProps & { quote: string }> = ({ t, dur, W, words, quote }) => {
  const card = prog(t, 0.05, 0.55);
  const tStart = W("her");
  const tFive = W("beş");
  const tOnTime = W("vaktinde");
  const tKeep = W("korumaktır");
  const man = springy(t, 0.4, 2.4, 7);
  const woman = springy(t, 0.6, 2.4, 7);
  const sun = prog(t, tFive, tKeep, easeInOut);
  const keep = prog(t, tKeep, tKeep + 0.6);
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1060} s={keys(t, [[0, 1.08], [tStart, 1.0], [dur, 1.04]])}>
        {keep > 0 ? (
          <At x={540} y={1150} style={{ opacity: keep * 0.8 }}>
            <Rays size={760} spin={t * 14} opacity={0.5} />
          </At>
        ) : null}
        {/* Sky arc with five prayer markers */}
        <svg width={1080} height={700} style={{ position: "absolute", left: 0, top: 560 }}>
          <path d="M 120 420 Q 540 -60 960 420" stroke="rgba(244,239,227,0.25)" strokeWidth={4} strokeDasharray="10 14" fill="none" />
        </svg>
        {PRAYERS.map((name, i) => {
          const at = lerp(tFive, tKeep, i / 4);
          const p = springy(t, at, 2.6, 7);
          if (p <= 0) return null;
          const u = i / 4;
          const x = (1 - u) * (1 - u) * 120 + 2 * (1 - u) * u * 540 + u * u * 960;
          const y = 560 + (1 - u) * (1 - u) * 420 + 2 * (1 - u) * u * -60 + u * u * 420;
          const done = prog(t, tOnTime + i * 0.12, tOnTime + i * 0.12 + 0.3);
          return (
            <At key={i} x={x} y={y + 30} style={{ transform: `translate(-50%, -50%) scale(${p})` }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ position: "relative" }}>
                  <div style={{ padding: "8px 16px", borderRadius: 14, background: "rgba(15,26,69,0.9)", border: `2px solid ${theme.gold}`, fontFamily: sans, fontWeight: 800, fontSize: 32, color: "#fff" }}>{name}</div>
                  {done > 0 ? (
                    <div style={{ position: "absolute", right: -22, top: -24 }}>
                      <Check size={44} p={done} />
                    </div>
                  ) : null}
                </div>
              </div>
            </At>
          );
        })}
        {sun > 0 ? (
          (() => {
            const u = sun;
            const x = (1 - u) * (1 - u) * 120 + 2 * (1 - u) * u * 540 + u * u * 960;
            const y = 560 + (1 - u) * (1 - u) * 420 + 2 * (1 - u) * u * -60 + u * u * 420;
            return (
              <At x={x} y={y - 110}>
                <div style={{ width: 80, height: 80, borderRadius: 99, background: "#f2b84b", boxShadow: "0 0 50px rgba(242,184,75,0.8)" }} />
              </At>
            );
          })()
        ) : null}
        <At x={380} y={GROUND} anchor="bottom" style={{ transform: `translate(-50%, -100%) scale(${man})`, transformOrigin: "50% 100%" }}>
          <Man pose={breathe(POSES.stand, t)} style={MAN_WHITE} size={460} heart={keep > 0 ? { color: theme.gold, glow: keep, scale: 1 } : null} />
        </At>
        <At x={700} y={GROUND} anchor="bottom" style={{ transform: `translate(-50%, -100%) scale(${woman})`, transformOrigin: "50% 100%" }}>
          <MotherFigure size={440} glow={keep} bob={Math.sin(t * 2.2) * 2} dress="#2f8f6b" />
        </At>
      </Camera>
      <div style={{ position: "absolute", top: 270, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `translate(${(1 - card) * -900}px, ${(1 - card) * -300}px) rotate(${(1 - card) * -12}deg)`, opacity: 1 - prog(t, tStart - 0.4, tStart - 0.1) }}>
        <NameCard kicker={UI.tr.explanation} name={UI.tr.ibnBaz} font={serif} arabicFont={amiri} />
      </div>
      <ArabicLine t={t} text={quote} from={tStart} to={dur} y={1440} size={44} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

// Scene 4: he steps away from the big boulder of major sins; water washes the small stains off.
const Explain2: React.FC<SceneProps & { quote: string }> = ({ t, dur, W, words, quote }) => {
  const tBig = W("büyük");
  const tAvoid = W("kaçınıldığında");
  const tSmall = W("küçük");
  const tForgive = W("affeder");
  const rock = springy(t, tBig - 0.1, 2.4, 7);
  const cross = prog(t, tAvoid, tAvoid + 0.4);
  const step = prog(t, tAvoid - 0.1, tAvoid + 0.7, easeInOut);
  const wash = prog(t, tSmall, tForgive + 0.4, easeInOut);
  const clean = prog(t, tForgive, tForgive + 0.5);
  const moving = t > tAvoid - 0.1 && t < tAvoid + 0.7;
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1060} s={keys(t, [[0, 1.05], [tBig, 1.0], [dur, 1.05]])}>
        {clean > 0 ? (
          <At x={lerp(560, 360, step)} y={1080} style={{ opacity: clean }}>
            <Rays size={600} spin={t * 16} opacity={0.55} />
          </At>
        ) : null}
        <At x={540} y={GROUND + 40}>
          <Water w={1200} t={t} />
        </At>
        <At x={800} y={GROUND} anchor="bottom" style={{ transform: `translate(-50%, -100%) scale(${rock})`, transformOrigin: "50% 100%" }}>
          <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 30, color: "#ff8a7f", marginBottom: 8 }}>BÜYÜK GÜNAHLAR</div>
            <svg width={300} height={240} viewBox="-150 -240 300 240">
              <path d="M -140 0 Q -150 -150 -60 -220 Q 30 -250 110 -180 Q 160 -100 140 0 Z" fill="#2a2420" stroke="#4a3e34" strokeWidth={6} />
            </svg>
            {cross > 0 ? (
              <div style={{ position: "absolute", top: 90 }}>
                <CrossBadge size={120} p={cross} />
              </div>
            ) : null}
          </div>
        </At>
        <At x={lerp(560, 330, step)} y={GROUND} anchor="bottom" style={{ transform: "translate(-50%, -100%) scaleX(-1)" }}>
          <div style={{ position: "relative" }}>
            <Man pose={moving ? walk(POSES.stand, t, 2.6, 1) : breathe(mixPose(POSES.stand, POSES.takbir, clean * 0.6), t)} style={MAN_WHITE} size={500} heart={clean > 0 ? { color: theme.gold, glow: clean, scale: 1 } : null} />
            <Stains size={500} p={1 - wash} />
          </div>
        </At>
        {wash > 0 && wash < 1
          ? Array.from({ length: 8 }, (_, i) => {
              const p = (t * 1.4 + i / 8) % 1;
              return (
                <At key={i} x={lerp(560, 330, step) - 120 + (i % 4) * 80} y={880 + p * 480} style={{ opacity: 1 - p }}>
                  <svg width={30} height={40} viewBox="-20 -24 40 44">
                    <path d="M 0 -22 Q 18 2 14 10 Q 8 20 0 20 Q -8 20 -14 10 Q -18 2 0 -22 Z" fill="#7fc4f0" />
                  </svg>
                </At>
              );
            })
          : null}
      </Camera>
      {clean > 0 ? (
        <At x={540} y={500} style={{ transform: `translate(-50%, -50%) scale(${springy(t, tForgive, 2.6, 7)})` }}>
          <Pill gold size={46}>
            <Star size={38} color="#1b2d66" />
            KÜÇÜK GÜNAHLAR AFFEDİLİR
          </Pill>
        </At>
      ) : null}
      <ArabicLine t={t} text={quote} from={tBig} to={dur} y={1440} size={52} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

const ownCues = (p: FivePrayersMotionProps) => (add: AddCue) => {
  const W = (scene: SceneKey) => wordTime(p.words[scene]);
  const h = W("hook");
  add("hook", 0.2, "scratch", 0.3);
  add("hook", h("günahlarını"), "hit", 0.35);
  for (let i = 0; i < 5; i++) add("hook", h("her") + i * 0.12, "bubble", 0.18);
  add("hook", h("yolu"), "ding", 0.3);
  const d = W("hadith");
  for (let i = 0; i < 5; i++) add("hadith", d("beş", 0) + i * 0.14, "pop_high", 0.2);
  add("hadith", d("kalmaz"), "sparkle", 0.3);
  add("hadith", d("namaz", 0), "chime", 0.35);
  const e = W("explain1");
  add("explain1", 0.05, "swipe", 0.35);
  add("explain1", e("erkek"), "pop", 0.3);
  add("explain1", e("kadına"), "pop", 0.3);
  for (let i = 0; i < 5; i++) add("explain1", lerp(e("beş"), e("korumaktır"), i / 4), "tick", 0.25);
  add("explain1", e("korumaktır"), "sparkle", 0.4);
  const f = W("explain2");
  add("explain2", f("büyük"), "hit", 0.4);
  add("explain2", f("kaçınıldığında"), "strike", 0.35);
  add("explain2", f("küçük"), "swipe", 0.3);
  add("explain2", f("affeder"), "chime", 0.4);
};

export const FivePrayersMotion: React.FC<FivePrayersMotionProps> = (p) => {
  const hadith: HadithLayout = {
    narrator: "Rivayet eden: Ebû Hureyre",
    stamp: "Sahih Buhârî 528",
    arabic: p.arabicLines,
    line1: ["birinizin", 0],
    line2: ["bunun", 0],
    stampWord: "buhari",
    arabicSize: 54,
    englishSize: 34,
    contentTop: 232,
    stampBottom: 16,
  };
  return (
    <ReelRunner
      p={p}
      hadith={hadith}
      scenes={{
        hook: Hook,
        hadithOverlay: HadithOverlay,
        explain1: (sp) => <Explain1 {...sp} quote={p.quote1} />,
        explain2: (sp) => <Explain2 {...sp} quote={p.quote2} />,
      }}
      cues={ownCues(p)}
    />
  );
};
