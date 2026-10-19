import React from "react";
import { AbsoluteFill } from "remotion";
import { dark as theme } from "./theme";
import { easeInOut, keys, lerp, prog, springy } from "./motion/anim";
import { MAN_WHITE, Man, POSES, breathe, mixPose } from "./motion/Man";
import { CoinG, CrowdFigure, NameCard, Rays, Star } from "./motion/Props";
import { Animal, LightOrb, Tree, Wheat } from "./motion/Props2";
import { Building } from "./motion/Props";
import { ArabicLine, At, Camera, Captions, ReelRunner, UI, fonts, reelMetadata, wordTime, type AddCue, type HadithLayout, type ReelBase, type SceneKey, type SceneProps } from "./motion/ReelKit";

// Video 09 (Turkish): "AĞAÇ DİK". Hadith: Sahih al-Bukhari 2320 (HadeethEnc Turkish 3911,
// third narration). Explanation: Ibn Baz, binbaz.org.sa/fatwas/8126. Turkish scholar lines
// are Claude's translation (needs a Turkish reviewer).

const { amiri, serif, sans } = fonts;

export type TreeMotionProps = ReelBase & {
  arabicLines: [string, string];
  quote1: string;
  quote2: [string, string];
};
export const calculateTreeMetadata = reelMetadata<TreeMotionProps>();

const GROUND = 1390;

const Title: React.FC<{ p: number; size: number; color?: string; children: React.ReactNode }> = ({ p, size, color = "#fff", children }) => (
  <div style={{ fontFamily: sans, fontWeight: 800, fontSize: size, color, opacity: p, transform: `scale(${lerp(2, 1, p)})`, textShadow: "0 10px 40px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>{children}</div>
);

const Pill: React.FC<{ children: React.ReactNode; gold?: boolean; size?: number }> = ({ children, gold = false, size = 40 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 30px", borderRadius: 999, background: gold ? theme.gold : "rgba(15,26,69,0.88)", border: `3px solid ${theme.gold}`, fontFamily: sans, fontWeight: 800, fontSize: size, color: gold ? "#1b2d66" : theme.gold, whiteSpace: "nowrap", boxShadow: gold ? "0 0 40px rgba(212,168,82,0.6)" : "0 10px 30px rgba(0,0,0,0.4)" }}>
    {children}
  </div>
);

const Soil: React.FC<{ w: number }> = ({ w }) => (
  <div style={{ width: w, height: 40, borderRadius: "50% 50% 12px 12px", background: "linear-gradient(180deg, #7a5230, #5a3a1e)" }} />
);

const Bird: React.FC<{ size: number; flap: number }> = ({ size, flap }) => (
  <svg width={size} height={size * 0.6} viewBox="-50 -30 100 60" style={{ overflow: "visible" }}>
    <ellipse cx={0} cy={0} rx={22} ry={13} fill="#5f79c4" />
    <circle cx={20} cy={-8} r={9} fill="#5f79c4" />
    <path d="M 28 -8 L 38 -5 L 28 -2 Z" fill={theme.gold} />
    <path d={`M -4 -4 Q -20 ${-30 * flap} -36 ${-10 * flap}`} stroke="#9aa6c4" strokeWidth={8} fill="none" strokeLinecap="round" />
  </svg>
);

// Scene 1: a seed drops into the soil and a sapling shoots up.
const Hook: React.FC<SceneProps> = ({ t, dur, W }) => {
  const s = keys(t, [
    [0, 1.25],
    [dur, 1.05],
  ]);
  const seed = prog(t, 0.15, 0.6, easeInOut);
  const grow = prog(t, 0.65, dur + 0.3, easeInOut);
  const l1 = prog(t, W("bir"), W("bir") + 0.2);
  const l2 = prog(t, W("sadaka"), W("sadaka") + 0.2);
  const coin = springy(t, W("sadaka"), 2.6, 7);
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1150} s={s}>
        <At x={260} y={GROUND} anchor="bottom">
          <Man pose={breathe(mixPose(POSES.stand, POSES.give, 0.6), t)} style={MAN_WHITE} size={500} />
        </At>
        <At x={600} y={GROUND + 10}>
          <Soil w={260} />
        </At>
        {seed < 1 ? (
          <At x={600} y={lerp(900, GROUND - 6, seed)}>
            <div style={{ width: 22, height: 30, borderRadius: "50%", background: "#8a5a2b" }} />
          </At>
        ) : null}
        {grow > 0 ? (
          <At x={600} y={GROUND} anchor="bottom">
            <Tree size={lerp(260, 560, grow)} grow={grow} />
          </At>
        ) : null}
        {coin > 0 ? (
          <At x={850} y={1010} style={{ transform: `translate(-50%, -50%) scale(${coin})` }}>
            <svg width={120} height={120} viewBox="-30 -30 60 60">
              <CoinG r={26} />
            </svg>
          </At>
        ) : null}
      </Camera>
      <div style={{ position: "absolute", top: 380, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <Title p={l1} size={96}>
          BİR AĞAÇ DİKMEK
        </Title>
        <Title p={l2} size={80} color={theme.gold}>
          SADAKA OLABİLİR Mİ?
        </Title>
      </div>
    </AbsoluteFill>
  );
};

// Scroll overlay: who eats from it, then SADAKA.
const HadithOverlay: React.FC<SceneProps> = ({ t, dur, W }) => {
  const items = [
    { label: "İNSAN", at: W("insan"), x: 190 },
    { label: "HAYVAN", at: W("hayvan"), x: 450 },
    { label: "SADAKA", at: W("sadaka"), x: 800, gold: true },
  ];
  const out = prog(t, dur - 0.5, dur - 0.2);
  return (
    <AbsoluteFill style={{ opacity: 1 - out }}>
      {items.map((s, i) => {
        const p = springy(t, s.at, 2.6, 7);
        if (p <= 0) return null;
        return (
          <At key={i} x={s.x} y={300} style={{ transform: `translate(-50%, -50%) scale(${p})` }}>
            <Pill gold={s.gold} size={s.gold ? 42 : 36}>
              {s.gold ? <Star size={34} color="#1b2d66" /> : null}
              {s.label}
            </Pill>
          </At>
        );
      })}
    </AbsoluteFill>
  );
};

// Scene 3: Ibn Baz. A field of crops, a palm and other trees grow; reward rises from them.
const Explain1: React.FC<SceneProps & { quote: string }> = ({ t, dur, W, words, quote }) => {
  const card = prog(t, 0.05, 0.55);
  const tStart = W("müslümanın");
  const tCrops = W("ekinler");
  const tPalm = W("hurma");
  const tTrees = W("ağaçlar");
  const tReward = W("sevap");
  const crops = prog(t, tCrops - 0.3, tCrops + 1.0, easeInOut);
  const palm = prog(t, tPalm - 0.2, tPalm + 1.2, easeInOut);
  const trees = prog(t, tTrees - 0.2, tTrees + 1.2, easeInOut);
  const reward = prog(t, tReward - 0.1, tReward + 0.5);
  const pill = springy(t, tReward, 2.6, 7);
  const planter = 1 - prog(t, tCrops - 0.6, tCrops - 0.1);
  const growers = [
    { x: 260, kind: "palm" as const, p: palm, size: 520 },
    { x: 560, kind: "tree" as const, p: trees, size: 500 },
    { x: 830, kind: "tree" as const, p: prog(t, tTrees + 0.2, tTrees + 1.4, easeInOut), size: 440 },
  ];
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1080} s={keys(t, [[0, 1.08], [tStart, 1.0], [dur, 1.04]])}>
        {reward > 0 ? (
          <At x={540} y={1050} style={{ opacity: reward * 0.8 }}>
            <Rays size={860} spin={t * 12} opacity={0.45} />
          </At>
        ) : null}
        <At x={540} y={GROUND + 14}>
          <Soil w={940} />
        </At>
        {planter > 0.01 ? (
          <At x={540} y={GROUND} anchor="bottom" style={{ opacity: planter, transform: `translate(-50%, -100%) scale(${springy(t, 0.3, 2.4, 7)})`, transformOrigin: "50% 100%" }}>
            <div style={{ position: "relative" }}>
              <Man pose={breathe(POSES.give, t)} style={MAN_WHITE} size={540} />
              <div style={{ position: "absolute", left: 300, top: 70 }}>
                <Tree size={200} grow={0.75} />
              </div>
            </div>
          </At>
        ) : null}
        {growers.map((g, i) =>
          g.p > 0 ? (
            <At key={i} x={g.x} y={GROUND} anchor="bottom">
              <Tree size={g.size} grow={g.p} palm={g.kind === "palm"} fruit={reward} glow={reward} />
            </At>
          ) : null,
        )}
        {crops > 0
          ? Array.from({ length: 11 }, (_, i) => (
              <At key={`w${i}`} x={110 + i * 86} y={GROUND + 4} anchor="bottom">
                <Wheat size={190} grow={prog(crops, i / 22, i / 22 + 0.5)} sway={Math.sin(t * 2 + i) * 4} />
              </At>
            ))
          : null}
        {reward > 0
          ? [0, 1, 2, 3, 4, 5].map((i) => {
              const p = (t * 0.45 + i / 6) % 1;
              return (
                <At key={`o${i}`} x={180 + i * 140} y={1100 - p * 380} style={{ opacity: reward * Math.sin(p * Math.PI) }}>
                  <LightOrb size={70} />
                </At>
              );
            })
          : null}
      </Camera>
      {pill > 0 ? (
        <At x={540} y={500} style={{ transform: `translate(-50%, -50%) scale(${pill})` }}>
          <Pill gold size={54}>
            <Star size={42} color="#1b2d66" />
            SEVAP VAR
          </Pill>
        </At>
      ) : null}
      <div style={{ position: "absolute", top: 270, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `translate(${(1 - card) * -900}px, ${(1 - card) * -300}px) rotate(${(1 - card) * -12}deg)`, opacity: 1 - prog(t, tStart - 0.4, tStart - 0.1) }}>
        <NameCard kicker={UI.tr.explanation} name={UI.tr.ibnBaz} font={serif} arabicFont={amiri} />
      </div>
      <ArabicLine t={t} text={quote} from={tStart} to={dur} y={1440} size={42} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

/** A fruit flying from the tree to a target. */
const Fruit: React.FC<{ t: number; from: [number, number]; to: [number, number]; at: number }> = ({ t, from, to, at }) => {
  const p = prog(t, at, at + 0.8, easeInOut);
  if (p <= 0 || p >= 1) return null;
  return (
    <At x={lerp(from[0], to[0], p)} y={lerp(from[1], to[1], p) - Math.sin(p * Math.PI) * 160}>
      <div style={{ width: 30, height: 30, borderRadius: 99, background: "#e0322b", border: "3px solid #a51f19" }} />
    </At>
  );
};

// Scene 4: fruit goes to people as charity, to his own family; birds and a sheep eat too; all of it is good.
const Explain2: React.FC<SceneProps & { quote: [string, string] }> = ({ t, dur, W, words, quote }) => {
  const tFrom = W("ondan");
  const tPeople = W("insanlara");
  const tFamily = W("ev");
  const tAll = W("bunların");
  const tGood = W("hayırdandır");
  const people = springy(t, tPeople - 0.2, 2.4, 7);
  const house = springy(t, tFamily - 0.2, 2.4, 7);
  const all = prog(t, tAll, tAll + 0.6);
  const pill = springy(t, tGood, 2.6, 7);
  const tree: [number, number] = [540, 900];
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1060} s={keys(t, [[0, 1.05], [tFrom, 1.0], [dur, 1.05]])}>
        {all > 0 ? (
          <At x={540} y={1000} style={{ opacity: all }}>
            <Rays size={900} spin={t * 14} opacity={0.5} />
          </At>
        ) : null}
        <At x={540} y={GROUND + 14}>
          <Soil w={300} />
        </At>
        <At x={540} y={GROUND} anchor="bottom">
          <Tree size={620} grow={1} fruit={1} glow={all} />
        </At>
        {/* Family house on the left */}
        <At x={150} y={GROUND} anchor="bottom" style={{ transform: `translate(-50%, -100%) scale(${house})`, transformOrigin: "50% 100%" }}>
          <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <svg width={200} height={70} viewBox="0 0 200 70">
              <path d="M 0 70 L 100 0 L 200 70 Z" fill="#c9733a" />
            </svg>
            <Building w={170} h={160} color="#2c4596" />
          </div>
        </At>
        {house > 0.5
          ? [0, 1].map((i) => (
              <At key={`f${i}`} x={290 + i * 50} y={GROUND} anchor="bottom">
                <CrowdFigure size={i ? 110 : 150} color={i ? "#c9733a" : "#2f8f6b"} arm={all} />
              </At>
            ))
          : null}
        {/* People receiving charity on the right */}
        {[0, 1, 2].map((i) => (
          <At key={`p${i}`} x={780 + i * 95} y={GROUND} anchor="bottom" style={{ transform: `translate(-50%, -100%) scale(${people})`, transformOrigin: "50% 100%" }}>
            <CrowdFigure size={160} color={["#9aa6c4", "#5f79c4", "#b88660"][i]} arm={all} />
          </At>
        ))}
        {all > 0 ? (
          <>
            <At x={lerp(1150, 700, all)} y={760} style={{ transform: "translate(-50%, -50%) scaleX(-1)" }}>
              <Bird size={110} flap={Math.sin(t * 12) * 0.5 + 0.5} />
            </At>
            <At x={lerp(-150, 400, all)} y={1395} anchor="bottom">
              <Animal size={110} kind="sheep" walk={all < 1 ? t : 0} />
            </At>
          </>
        ) : null}
        {[0, 1, 2].map((i) => (
          <Fruit key={`a${i}`} t={t} from={tree} to={[780 + i * 95, 1230]} at={tPeople + i * 0.25} />
        ))}
        {[0, 1].map((i) => (
          <Fruit key={`b${i}`} t={t} from={tree} to={[290 + i * 50, 1260]} at={tFamily + i * 0.25} />
        ))}
      </Camera>
      {pill > 0 ? (
        <At x={540} y={500} style={{ transform: `translate(-50%, -50%) scale(${pill})` }}>
          <Pill gold size={54}>
            <Star size={42} color="#1b2d66" />
            HEPSİ HAYIR
          </Pill>
        </At>
      ) : null}
      <ArabicLine t={t} text={quote[0]} from={tFrom} to={tAll - 0.1} y={1440} size={42} />
      <ArabicLine t={t} text={quote[1]} from={tAll} to={dur} y={1440} size={46} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

const ownCues = (p: TreeMotionProps) => (add: AddCue) => {
  const W = (scene: SceneKey) => wordTime(p.words[scene]);
  const h = W("hook");
  add("hook", 0.55, "pop", 0.3);
  add("hook", 0.7, "rise", 0.35);
  add("hook", h("sadaka"), "ding", 0.35);
  const d = W("hadith");
  add("hadith", d("insan"), "pop_high", 0.25);
  add("hadith", d("hayvan"), "pop_high", 0.25);
  add("hadith", d("sadaka"), "chime", 0.35);
  const e = W("explain1");
  add("explain1", 0.05, "swipe", 0.35);
  add("explain1", e("ekinler"), "rise", 0.3);
  add("explain1", e("hurma"), "pop", 0.3);
  add("explain1", e("ağaçlar"), "pop", 0.3);
  add("explain1", e("sevap"), "sparkle", 0.4);
  const f = W("explain2");
  for (let i = 0; i < 3; i++) add("explain2", f("insanlara") + i * 0.25 + 0.8, "pop_high", 0.22);
  add("explain2", f("ev"), "pop", 0.3);
  add("explain2", f("bunların"), "whoosh", 0.3);
  add("explain2", f("hayırdandır"), "chime", 0.4);
};

export const TreeMotion: React.FC<TreeMotionProps> = (p) => {
  const hadith: HadithLayout = {
    narrator: "Rivayet eden: Enes b. Mâlik",
    stamp: "Sahih Buhârî 2320",
    arabic: p.arabicLines,
    line1: ["bir", 0],
    line2: ["ondan", 0],
    stampWord: "buhari",
    arabicSize: 64,
    englishSize: 42,
    contentTop: 250,
    stampBottom: 22,
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
