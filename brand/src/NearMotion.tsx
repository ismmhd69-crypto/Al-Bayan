import React from "react";
import { AbsoluteFill } from "remotion";
import { dark as theme } from "./theme";
import { easeInOut, keys, lerp, prog, springy } from "./motion/anim";
import { MAN_WHITE, Man, POSES, breathe, mixPose, walk } from "./motion/Man";
import { NameCard, Rays, Star, Suitcase } from "./motion/Props";
import { Hourglass, Sandal } from "./motion/Props2";
import { ArabicLine, At, Camera, Captions, ReelRunner, UI, fonts, reelMetadata, wordTime, type AddCue, type HadithLayout, type ReelBase, type SceneKey, type SceneProps } from "./motion/ReelKit";

// Video 20 (Turkish): "CENNET YAKIN". Hadith: Sahih al-Bukhari 6488 (HadeethEnc Turkish 3581).
// Explanation: Ibn Baz, binbaz.org.sa/fatwas/10156. Turkish scholar lines are Claude's
// translation (needs a Turkish reviewer).

const { amiri, serif, sans } = fonts;

export type NearMotionProps = ReelBase & {
  arabicLines: [string, string];
  quote1: [string, string];
  quote2: [string, string];
};
export const calculateNearMetadata = reelMetadata<NearMotionProps>();

const GROUND = 1390;

const Title: React.FC<{ p: number; size: number; color?: string; children: React.ReactNode }> = ({ p, size, color = "#fff", children }) => (
  <div style={{ fontFamily: sans, fontWeight: 800, fontSize: size, color, opacity: p, transform: `scale(${lerp(2, 1, p)})`, textShadow: "0 10px 40px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>{children}</div>
);

const Pill: React.FC<{ children: React.ReactNode; gold?: boolean; size?: number }> = ({ children, gold = false, size = 40 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 30px", borderRadius: 999, background: gold ? theme.gold : "rgba(15,26,69,0.88)", border: `3px solid ${theme.gold}`, fontFamily: sans, fontWeight: 800, fontSize: size, color: gold ? "#1b2d66" : theme.gold, whiteSpace: "nowrap", boxShadow: gold ? "0 0 40px rgba(212,168,82,0.6)" : "0 10px 30px rgba(0,0,0,0.4)" }}>
    {children}
  </div>
);

const GateIcon: React.FC<{ size: number; fire?: boolean }> = ({ size, fire = false }) => (
  <div style={{ width: size, height: size * 1.3, borderRadius: `${size / 2}px ${size / 2}px 8px 8px`, border: `6px solid ${fire ? "#e0322b" : theme.gold}`, background: fire ? "radial-gradient(circle at 50% 70%, rgba(224,50,43,0.9), rgba(80,10,10,0.9))" : "rgba(255,240,200,0.85)", boxShadow: fire ? "0 0 30px rgba(224,50,43,0.6)" : "0 0 40px rgba(255,226,150,0.8)" }} />
);

// Scene 1: close on a sandal strap, then pull back: the man stands on a path.
const Hook: React.FC<SceneProps> = ({ t, dur, W }) => {
  const s = keys(t, [
    [0, 2.2],
    [W("ne"), 1.5],
    [dur, 1.1],
  ], easeInOut);
  const gates = prog(t, W("ne") - 0.4, W("ne") + 0.3);
  const l1 = prog(t, W("cennet"), W("cennet") + 0.2);
  const l2 = prog(t, W("ne"), W("ne") + 0.2);
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1240} s={s}>
        <At x={540} y={1330} style={{ width: 1200, height: 30 }}>
          <div style={{ width: 1200, height: 30, borderRadius: 15, background: "rgba(244,239,227,0.12)" }} />
        </At>
        <At x={840} y={1310} anchor="bottom" style={{ opacity: gates }}>
          <GateIcon size={120} />
        </At>
        <At x={240} y={1310} anchor="bottom" style={{ opacity: gates }}>
          <GateIcon size={120} fire />
        </At>
        <At x={540} y={1270}>
          <Sandal size={300} glow={0.6 + 0.4 * Math.sin(t * 4)} />
        </At>
      </Camera>
      <div style={{ position: "absolute", top: 360, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <Title p={l1} size={104}>
          CENNET SANA
        </Title>
        <Title p={l2} size={96} color={theme.gold}>
          NE KADAR YAKIN?
        </Title>
      </div>
    </AbsoluteFill>
  );
};

// Scroll overlay: CENNET (gold gate) · the sandal strap · CEHENNEM (red gate).
const HadithOverlay: React.FC<SceneProps> = ({ t, dur, W }) => {
  const g = springy(t, W("cennet"), 2.6, 7);
  const sandal = springy(t, W("bağından"), 2.6, 7);
  const f = springy(t, W("cehennem"), 2.6, 7);
  const out = prog(t, dur - 0.5, dur - 0.2);
  const items = [
    { p: g, x: 200, node: <GateIcon size={60} />, label: "CENNET" },
    { p: sandal, x: 540, node: <Sandal size={140} glow={1} />, label: "AYAKKABI BAĞI" },
    { p: f, x: 880, node: <GateIcon size={60} fire />, label: "CEHENNEM" },
  ];
  return (
    <AbsoluteFill style={{ opacity: 1 - out }}>
      {items.map((it, i) =>
        it.p > 0 ? (
          <At key={i} x={it.x} y={260} style={{ transform: `translate(-50%, -50%) scale(${it.p})` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 18px", borderRadius: 24, background: "rgba(15,26,69,0.9)", border: `3px solid ${i === 2 ? "#e0322b" : theme.gold}` }}>
              {it.node}
              <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 26, color: i === 2 ? "#ff8a7f" : theme.gold, whiteSpace: "nowrap" }}>{it.label}</div>
            </div>
          </At>
        ) : null,
      )}
    </AbsoluteFill>
  );
};

// Scene 3: Ibn Baz. An hourglass runs; the man remembers death and prepares, walking toward the gate.
const Explain1: React.FC<SceneProps & { quote: [string, string] }> = ({ t, dur, W, words, quote }) => {
  const card = prog(t, 0.05, 0.55);
  const tStart = W("ölümü");
  const tPrep = W("ahirete");
  const sand = prog(t, 0, dur);
  const remember = springy(t, tStart, 2.6, 7) * (1 - prog(t, tPrep - 0.3, tPrep));
  const prep = springy(t, tPrep, 2.6, 7);
  const go = prog(t, tPrep, dur, easeInOut);
  const walking = go > 0 && go < 1;
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1080} s={keys(t, [[0, 1.08], [tStart, 1.0], [dur, 1.04]])}>
        <At x={900} y={1180} style={{ opacity: 0.4 + go * 0.6 }}>
          <Rays size={520} spin={t * 14} opacity={0.5} />
        </At>
        <At x={900} y={GROUND} anchor="bottom">
          <GateIcon size={200} />
        </At>
        <At x={200} y={1000}>
          <Hourglass size={300} p={sand} t={t} />
        </At>
        <At x={lerp(420, 640, go)} y={GROUND} anchor="bottom">
          <Man pose={walking ? walk(POSES.carry, t, 2.2, 1) : breathe(mixPose(POSES.stand, POSES.think, remember), t)} style={MAN_WHITE} size={500} rightItem={prep > 0.3 ? <g transform="translate(-30 -6)"><Suitcase size={78} /></g> : undefined} heart={{ color: theme.gold, glow: 0.4 + go, scale: 1.1 }} />
        </At>
      </Camera>
      {remember > 0.01 ? (
        <At x={540} y={500} style={{ transform: `translate(-50%, -50%) scale(${remember})` }}>
          <Pill size={48}>ÖLÜMÜ HATIRLA</Pill>
        </At>
      ) : null}
      {prep > 0 ? (
        <At x={540} y={500} style={{ transform: `translate(-50%, -50%) scale(${prep})` }}>
          <Pill gold size={48}>
            <Star size={40} color="#1b2d66" />
            AHİRETE HAZIRLIK
          </Pill>
        </At>
      ) : null}
      <div style={{ position: "absolute", top: 270, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `translate(${(1 - card) * -900}px, ${(1 - card) * -300}px) rotate(${(1 - card) * -12}deg)`, opacity: 1 - prog(t, tStart - 0.4, tStart - 0.1) }}>
        <NameCard kicker={UI.tr.explanation} name={UI.tr.ibnBaz} font={serif} arabicFont={amiri} />
      </div>
      <ArabicLine t={t} text={quote[0]} from={tStart} to={tPrep - 0.1} y={1440} size={54} />
      <ArabicLine t={t} text={quote[1]} from={tPrep} to={dur} y={1440} size={52} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

// Scene 4: he keeps death in mind; each good deed is a gold step toward the gate.
const Explain2: React.FC<SceneProps & { quote: [string, string] }> = ({ t, dur, W, words, quote }) => {
  const tStart = W("müslümanın");
  const tSunnah = W("müstehaptır");
  const tPrep = W("hazırlık");
  const deeds = ["NAMAZ", "SADAKA", "ZİKİR", "TÖVBE"];
  const pill = springy(t, tSunnah, 2.6, 7);
  const near = prog(t, tPrep, dur, easeInOut);
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1080} s={keys(t, [[0, 1.05], [tStart, 1.0], [dur, 1.06]])}>
        <At x={900} y={1180} style={{ opacity: 0.5 + near * 0.5 }}>
          <Rays size={560} spin={t * 14} opacity={0.5} />
        </At>
        <At x={900} y={GROUND} anchor="bottom">
          <GateIcon size={200} />
        </At>
        {deeds.map((d, i) => {
          const at = lerp(W("hatırlaması"), tPrep, i / 4);
          const p = springy(t, at, 2.6, 7);
          if (p <= 0) return null;
          return (
            <At key={i} x={230 + i * 140} y={GROUND - 20 - i * 30} style={{ transform: `translate(-50%, -50%) scale(${p})` }}>
              <div style={{ padding: "6px 14px", borderRadius: 12, background: theme.gold, color: "#1b2d66", fontFamily: sans, fontWeight: 800, fontSize: 24, boxShadow: "0 0 20px rgba(212,168,82,0.6)" }}>{d}</div>
            </At>
          );
        })}
        <At x={lerp(230, 720, near)} y={GROUND - 40 - near * 90} anchor="bottom">
          <Man pose={near > 0 && near < 1 ? walk(POSES.stand, t, 2.2, 1) : breathe(POSES.stand, t)} style={MAN_WHITE} size={480} heart={{ color: theme.gold, glow: 0.5 + near, scale: 1.1 }} />
        </At>
        <At x={160} y={760}>
          <Hourglass size={200} p={0.4 + prog(t, 0, dur) * 0.5} t={t} />
        </At>
      </Camera>
      {pill > 0 ? (
        <At x={600} y={520} style={{ transform: `translate(-50%, -50%) scale(${pill})` }}>
          <Pill gold size={46}>
            ÖLÜMÜ ÇOKÇA HATIRLA
          </Pill>
        </At>
      ) : null}
      <ArabicLine t={t} text={quote[0]} from={tStart} to={W("ta") - 0.1} y={1440} size={50} />
      <ArabicLine t={t} text={quote[1]} from={W("ta")} to={dur} y={1440} size={56} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

const ownCues = (p: NearMotionProps) => (add: AddCue) => {
  const W = (scene: SceneKey) => wordTime(p.words[scene]);
  const h = W("hook");
  add("hook", 0.2, "sparkle", 0.3);
  add("hook", h("ne") - 0.3, "whoosh", 0.35);
  const d = W("hadith");
  add("hadith", d("cennet"), "chime", 0.35);
  add("hadith", d("bağından"), "pop", 0.3);
  add("hadith", d("cehennem"), "hit", 0.35);
  const e = W("explain1");
  add("explain1", 0.05, "swipe", 0.35);
  add("explain1", e("ölümü"), "tick", 0.3);
  add("explain1", e("ahirete"), "ding", 0.35);
  for (let tt = e("ahirete") + 0.2; tt < e("ahirete") + 3; tt += 0.42) add("explain1", tt, "step", 0.2);
  const f = W("explain2");
  for (let i = 0; i < 4; i++) add("explain2", lerp(f("hatırlaması"), f("hazırlık"), i / 4), "pop_high", 0.22);
  add("explain2", f("müstehaptır"), "pop", 0.3);
  add("explain2", f("hazırlık"), "sparkle", 0.4);
};

export const NearMotion: React.FC<NearMotionProps> = (p) => {
  const hadith: HadithLayout = {
    narrator: "Rivayet eden: Abdullah b. Mes'ûd",
    stamp: "Sahih Buhârî 6488",
    arabic: p.arabicLines,
    line1: ["cennet", 0],
    line2: ["cehennem", 0],
    stampWord: "buhari",
    arabicSize: 76,
    englishSize: 46,
    contentTop: 280,
    stampBottom: 18,
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
