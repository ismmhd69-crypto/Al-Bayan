import React from "react";
import { AbsoluteFill, random } from "remotion";
import { dark as theme } from "./theme";
import { easeInOut, keys, lerp, prog, springy } from "./motion/anim";
import { CrowdFigure, NameCard, Rays } from "./motion/Props";
import { BODY_POINTS, Brick, LightOrb } from "./motion/Props2";
import { ArabicLine, At, Camera, Captions, ReelRunner, UI, fonts, reelMetadata, wordTime, type AddCue, type HadithLayout, type ReelBase, type SceneKey, type SceneProps } from "./motion/ReelKit";

// Video 06 (Turkish): "TEK VÜCUT". Hadith: Sahih al-Bukhari 6011 (HadeethEnc Turkish 4969).
// Explanations: Ibn Baz, binbaz.org.sa/fatwas/2968 and /5228. Turkish scholar lines are
// Claude's translation (needs a Turkish reviewer).

const { amiri, serif, sans } = fonts;

export type OneBodyMotionProps = ReelBase & {
  arabicLines: [string, string];
  quote1: string;
  quote2: [string, string];
};
export const calculateOneBodyMetadata = reelMetadata<OneBodyMotionProps>();

const COLOURS = ["#9aa6c4", "#c9733a", "#2f8f6b", "#5f79c4", "#e9ecf3", "#b88660"];

const Title: React.FC<{ p: number; size: number; color?: string; children: React.ReactNode }> = ({ p, size, color = "#fff", children }) => (
  <div style={{ fontFamily: sans, fontWeight: 800, fontSize: size, color, opacity: p, transform: `scale(${lerp(2, 1, p)})`, textShadow: "0 10px 40px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>{children}</div>
);

/** Red pulse rings around a point (someone in pain). */
const Pulse: React.FC<{ t: number; color?: string; size?: number }> = ({ t, color = "#e0322b", size = 140 }) => (
  <>
    {[0, 1, 2].map((k) => {
      const p = (t * 0.9 + k / 3) % 1;
      return <div key={k} style={{ position: "absolute", left: -size * p, top: -size * p, width: size * 2 * p, height: size * 2 * p, borderRadius: 999, border: `4px solid ${color}`, opacity: 1 - p }} />;
    })}
  </>
);

// Scene 1: zoomed on one person in pain, pull back to reveal the whole crowd.
const Hook: React.FC<SceneProps> = ({ t, dur, W }) => {
  const s = keys(t, [
    [0, 3.0],
    [W("acı"), 2.6],
    [W("sen") - 0.2, 1.0],
    [dur, 1.03],
  ], easeInOut);
  const l1 = prog(t, W("bir"), W("bir") + 0.2);
  const l2 = prog(t, W("sen"), W("sen") + 0.2);
  const grid: { x: number; y: number; i: number }[] = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) grid.push({ x: 120 + c * 168 + (r % 2) * 84, y: 980 + r * 150, i: r * 6 + c });
  const centre = grid.find((g) => g.i === 14) ?? grid[0];
  const look = prog(t, W("hissediyorsun") - 0.2, W("hissediyorsun") + 0.4);
  return (
    <AbsoluteFill>
      <Camera fx={centre.x} fy={centre.y - 60} s={s}>
        {grid.map((g) =>
          g.i === 14 ? (
            <At key={g.i} x={g.x} y={g.y} anchor="bottom">
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 50, top: 60 }}>
                  <Pulse t={t} />
                </div>
                <CrowdFigure size={170} color="#e0322b" arm={0} />
              </div>
            </At>
          ) : (
            <At key={g.i} x={g.x + (centre.x - g.x) * look * 0.08} y={g.y} anchor="bottom" style={{ opacity: 0.85 }}>
              <CrowdFigure size={150} color={COLOURS[g.i % COLOURS.length]} arm={0.1} />
            </At>
          ),
        )}
      </Camera>
      {/* Dark panel keeps the title readable over the zoomed crowd */}
      <div style={{ position: "absolute", top: 340, left: 40, right: 40, height: 230, borderRadius: 36, background: "rgba(10,18,48,0.78)", opacity: Math.max(l1, l2), boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }} />
      <div style={{ position: "absolute", top: 380, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <Title p={l1} size={70}>
          BİR MÜSLÜMAN ACI ÇEKİNCE
        </Title>
        <Title p={l2} size={76} color={theme.gold}>
          SEN NE HİSSEDİYORSUN?
        </Title>
      </div>
    </AbsoluteFill>
  );
};

// Scene 3: people fly in and form one body; one part hurts, the others turn to it.
const BODY = { cx: 540, top: 470, h: 900, w: 640 };
const Explain1: React.FC<SceneProps & { quote: string }> = ({ t, dur, W, words, quote }) => {
  const card = prog(t, 0.05, 0.55);
  const tFormed = W("müslümanlara");
  const tCare = W("birbirleriyle");
  const tDone = W("ilgilenmeleridir");
  const hurt = 12; // index of the hurting member (left arm)
  const pts = BODY_POINTS.map(([nx, ny]) => ({ x: BODY.cx + nx * BODY.w * 0.7, y: BODY.top + ny * BODY.h }));
  const heal = prog(t, tDone, tDone + 0.8);
  const outline = prog(t, tFormed, tFormed + 0.5);
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={960} s={keys(t, [[0, 1.1], [tFormed, 1.0], [dur, 1.04]])}>
        {outline > 0 ? (
          <At x={BODY.cx} y={BODY.top + BODY.h * 0.5} style={{ opacity: outline * 0.6 }}>
            <Rays size={900} spin={t * 10} opacity={0.35 + heal * 0.3} />
          </At>
        ) : null}
        {/* Care lines from neighbours to the hurting member */}
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          {pts.map((p, i) => {
            if (i === hurt) return null;
            const d = Math.hypot(p.x - pts[hurt].x, p.y - pts[hurt].y);
            if (d > 420) return null;
            const lp = prog(t, tCare + (d / 420) * 0.6, tCare + (d / 420) * 0.6 + 0.4);
            return <line key={i} x1={p.x} y1={p.y - 25} x2={pts[hurt].x} y2={pts[hurt].y - 25} stroke={theme.gold} strokeWidth={3} opacity={0.7 * lp * (1 - heal * 0.5)} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - lp} />;
          })}
        </svg>
        {pts.map((p, i) => {
          const start = 0.3 + (i / pts.length) * 3.2;
          const fly = prog(t, start, start + 0.7, easeInOut);
          if (fly <= 0) return null;
          const sx = random(`sx${i}`) * 1080;
          const sy = random(`sy${i}`) > 0.5 ? -200 : 2100;
          const isHurt = i === hurt && t > tFormed;
          const turn = prog(t, tCare, tCare + 0.6);
          const toward = Math.sign(pts[hurt].x - p.x) * turn * 6;
          return (
            <At key={i} x={lerp(sx, p.x, fly) + (i === hurt ? 0 : toward)} y={lerp(sy, p.y, fly)} anchor="bottom">
              <div style={{ position: "relative" }}>
                {isHurt ? (
                  <div style={{ position: "absolute", left: 22, top: 30 }}>
                    <Pulse t={t} size={90} color={heal > 0.5 ? theme.gold : "#e0322b"} />
                  </div>
                ) : null}
                <CrowdFigure size={70} color={isHurt ? (heal > 0.5 ? theme.gold : "#e0322b") : COLOURS[i % COLOURS.length]} arm={i === hurt ? 0 : turn * 0.6} />
              </div>
            </At>
          );
        })}
      </Camera>
      <div style={{ position: "absolute", top: 270, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `translate(${(1 - card) * -900}px, ${(1 - card) * -300}px) rotate(${(1 - card) * -12}deg)`, opacity: 1 - prog(t, tFormed - 0.4, tFormed - 0.1) }}>
        <NameCard kicker={UI.tr.explanation} name={UI.tr.ibnBaz} font={serif} arabicFont={amiri} />
      </div>
      <ArabicLine t={t} text={quote} from={tFormed} to={dur} y={1440} size={50} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

// Scene 4: people raise their hands in dua for the one in need; then they become bricks of one building.
const Explain2: React.FC<SceneProps & { quote: [string, string] }> = ({ t, dur, W, words, quote }) => {
  const tNeed = W("ihtiyaç");
  const tDua = W("dua");
  const tRelief = W("gidersin");
  const tBecause = W("çünkü");
  const tBuilding = W("binadır");
  const partA = 1 - prog(t, tBecause - 0.3, tBecause + 0.1, easeInOut);
  const raise = prog(t, tDua, tDua + 0.5);
  const relief = prog(t, tRelief, tRelief + 0.8);
  const ring = [
    { x: 200, y: 1300 },
    { x: 360, y: 1240 },
    { x: 720, y: 1240 },
    { x: 880, y: 1300 },
    { x: 280, y: 1420 },
    { x: 800, y: 1420 },
  ];
  // Bricks: 5 rows; the wall builds from the bottom up between "çünkü" and "binadır".
  const rows = 5;
  const cols = 6;
  const bricks: { x: number; y: number; at: number }[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols - (r % 2 ? 1 : 0); c++)
      bricks.push({ x: 195 + c * 138 + (r % 2 ? 69 : 0), y: 1340 - r * 74, at: lerp(tBecause, tBuilding, (r * cols + c) / (rows * cols)) });
  const done = prog(t, tBuilding, tBuilding + 0.6);
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1050} s={keys(t, [[0, 1.05], [tNeed, 1.0], [dur, 1.05]])}>
        {/* Part A: dua for the one in need */}
        <AbsoluteFill style={{ opacity: partA }}>
          {/* Grey cloud over the one in need, clearing with the dua */}
          <At x={540} y={980} style={{ opacity: 1 - relief, transform: `translate(-50%, -50%) translateY(${-relief * 80}px)` }}>
            <svg width={260} height={140} viewBox="0 0 260 140">
              <ellipse cx={80} cy={80} rx={70} ry={50} fill="#5b6478" />
              <ellipse cx={160} cy={70} rx={80} ry={60} fill="#6b7489" />
              <ellipse cx={200} cy={95} rx={55} ry={40} fill="#5b6478" />
            </svg>
          </At>
          {relief > 0 ? (
            <At x={540} y={1140} style={{ opacity: relief }}>
              <Rays size={520} spin={t * 18} opacity={0.6} />
            </At>
          ) : null}
          <At x={540} y={1330} anchor="bottom">
            <CrowdFigure size={220} color={relief > 0.5 ? theme.gold : "#7d89a8"} arm={relief} />
          </At>
          {ring.map((r, i) => {
            const pop = springy(t, tNeed + i * 0.12, 2.6, 7);
            return (
              <At key={i} x={r.x} y={r.y} anchor="bottom" style={{ transform: `translate(-50%, -100%) scale(${pop})`, transformOrigin: "50% 100%" }}>
                <CrowdFigure size={180} color={COLOURS[i % COLOURS.length]} arm={raise} />
              </At>
            );
          })}
          {/* Light rising from raised hands toward the one in need */}
          {raise > 0.5
            ? ring.map((r, i) => {
                const p = ((t - tDua) * 0.6 + i / 6) % 1;
                if (t > tRelief + 1) return null;
                return (
                  <At key={`o${i}`} x={lerp(r.x, 540, p)} y={lerp(r.y - 200, 1050, p)}>
                    <LightOrb size={60} intensity={0.9 * (1 - p)} />
                  </At>
                );
              })
            : null}
        </AbsoluteFill>
        {/* Part B: one building */}
        {t > tBecause - 0.3
          ? bricks.map((b, i) => {
              const p = prog(t, b.at, b.at + 0.35, easeInOut);
              if (p <= 0) return null;
              return (
                <At key={i} x={b.x} y={lerp(b.y - 500, b.y, p)} style={{ opacity: p }}>
                  <Brick w={130} h={66} color={done > 0 ? `rgb(${lerp(201, 212, done)},${lerp(142, 168, done)},${lerp(74, 82, done)})` : "#c98e4a"} />
                </At>
              );
            })
          : null}
        {done > 0 ? (
          <At x={540} y={940} style={{ transform: `translate(-50%, -50%) scale(${springy(t, tBuilding, 2.4, 7)})` }}>
            <div style={{ padding: "12px 34px", borderRadius: 999, background: theme.gold, color: "#1b2d66", fontFamily: sans, fontWeight: 800, fontSize: 44 }}>TEK BİR BİNA</div>
          </At>
        ) : null}
      </Camera>
      <ArabicLine t={t} text={quote[0]} from={tNeed} to={tBecause - 0.1} y={1450} size={44} />
      <ArabicLine t={t} text={quote[1]} from={tBecause} to={dur} y={1450} size={52} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

const ownCues = (p: OneBodyMotionProps) => (add: AddCue) => {
  const W = (scene: SceneKey) => wordTime(p.words[scene]);
  const h = W("hook");
  add("hook", 0.1, "heartbeat", 0.5);
  add("hook", h("bir"), "hit", 0.35);
  add("hook", h("sen") - 0.2, "whoosh", 0.4);
  add("hook", h("hissediyorsun"), "pop", 0.3);
  const e = W("explain1");
  add("explain1", 0.05, "swipe", 0.35);
  for (let tt = 0.4; tt < 3.6; tt += 0.5) add("explain1", tt, "pop_high", 0.18);
  add("explain1", e("müslümanlara"), "chime", 0.3);
  add("explain1", e("birbirleriyle"), "heartbeat", 0.45);
  add("explain1", e("ilgilenmeleridir"), "sparkle", 0.35);
  const f = W("explain2");
  add("explain2", f("ihtiyaç"), "pop", 0.3);
  add("explain2", f("dua"), "rise", 0.35);
  add("explain2", f("gidersin"), "sparkle", 0.35);
  add("explain2", f("çünkü") - 0.2, "whip", 0.35);
  for (let i = 0; i < 6; i++) add("explain2", lerp(f("çünkü"), f("binadır"), i / 6), "step", 0.22);
  add("explain2", f("binadır"), "stamp", 0.45);
};

export const OneBodyMotion: React.FC<OneBodyMotionProps> = (p) => {
  const hadith: HadithLayout = {
    narrator: "Rivayet eden: Nu'mân b. Beşîr",
    stamp: "Sahih Buhârî 6011",
    arabic: p.arabicLines,
    line1: ["müminler", 0],
    line2: ["vücudun", 0],
    stampWord: "buhari",
    arabicSize: 60,
    englishSize: 40,
    contentTop: 240,
    stampBottom: 22,
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
