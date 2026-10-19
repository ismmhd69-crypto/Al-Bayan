import React from "react";
import { AbsoluteFill } from "remotion";
import { dark as theme } from "./theme";
import { easeInOut, keys, lerp, prog, springy } from "./motion/anim";
import { MAN_GREY, MAN_WHITE, Man, POSES, breathe, mixPose, walk } from "./motion/Man";
import { CoinG, NameCard, Rays, Star, Suitcase } from "./motion/Props";
import { Road, ThornBranch } from "./motion/Props2";
import { ArabicLine, At, Camera, Captions, ReelRunner, UI, fonts, reelMetadata, wordTime, type AddCue, type HadithLayout, type ReelBase, type SceneKey, type SceneProps } from "./motion/ReelKit";

// Video 11 (Turkish): "YOLDAKİ DİKEN". Hadith: Sahih al-Bukhari 2472 (HadeethEnc Turkish 6469).
// Explanations: Ibn Baz, binbaz.org.sa/fatwas/14862; Ibn Uthaymeen, binothaimeen.net (library
// source 025bb1ef). Turkish scholar lines are Claude's translation (needs a Turkish reviewer).

const { amiri, serif, sans } = fonts;

export type ThornMotionProps = ReelBase & {
  arabicLines: [string, string];
  quote1: string;
  quote2: [string, string];
};
export const calculateThornMetadata = reelMetadata<ThornMotionProps>();

const GROUND = 1390;

const Title: React.FC<{ p: number; size: number; color?: string; children: React.ReactNode }> = ({ p, size, color = "#fff", children }) => (
  <div style={{ fontFamily: sans, fontWeight: 800, fontSize: size, color, opacity: p, transform: `scale(${lerp(2, 1, p)})`, textShadow: "0 10px 40px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>{children}</div>
);

const Pill: React.FC<{ children: React.ReactNode; gold?: boolean; size?: number }> = ({ children, gold = false, size = 40 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 30px", borderRadius: 999, background: gold ? theme.gold : "rgba(15,26,69,0.88)", border: `3px solid ${theme.gold}`, fontFamily: sans, fontWeight: 800, fontSize: size, color: gold ? "#1b2d66" : theme.gold, whiteSpace: "nowrap", boxShadow: gold ? "0 0 40px rgba(212,168,82,0.6)" : "0 10px 30px rgba(0,0,0,0.4)" }}>
    {children}
  </div>
);

const Rock: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size * 0.7} viewBox="-50 -35 100 70">
    <path d="M -44 30 Q -50 -6 -20 -26 Q 10 -36 34 -16 Q 52 6 44 30 Z" fill="#7d7f8c" />
    <path d="M -20 -20 Q 0 -28 20 -18" stroke="#9a9caa" strokeWidth={5} fill="none" />
  </svg>
);

const Glass: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size * 0.6} viewBox="-50 -30 100 60">
    <path d="M -40 20 L -20 -18 L -6 16 Z" fill="#9fd6e6" opacity={0.85} />
    <path d="M 0 22 L 14 -22 L 30 18 Z" fill="#b6e2ee" opacity={0.85} />
    <path d="M 30 24 L 44 4 L 46 26 Z" fill="#9fd6e6" opacity={0.85} />
  </svg>
);

// Scene 1: a thorny branch on the road; a man walks up, lifts it and throws it aside.
const Hook: React.FC<SceneProps> = ({ t, dur, W }) => {
  const s = keys(t, [
    [0, 1.2],
    [dur, 1.05],
  ]);
  const tLift = W("kaldırmak");
  const w = prog(t, 0.1, tLift - 0.1, easeInOut);
  const walking = t > 0.1 && t < tLift - 0.1;
  const lift = prog(t, tLift, tLift + 0.35, easeInOut);
  const toss = prog(t, W("seni"), W("seni") + 0.7, easeInOut);
  const glow = prog(t, W("bağışlatabilir"), W("bağışlatabilir") + 0.6);
  const l1 = prog(t, W("yoldan"), W("yoldan") + 0.2);
  const l2 = prog(t, W("seni"), W("seni") + 0.2);
  const pose = walking ? walk(POSES.stand, t, 2.4, 1) : breathe(mixPose({ ...POSES.give, lean: 8 }, POSES.lift, toss > 0 ? Math.sin(toss * Math.PI) : 0), t);
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1150} s={s}>
        <At x={540} y={GROUND + 20}>
          <Road w={1400} />
        </At>
        {glow > 0 ? (
          <At x={420} y={1080} style={{ opacity: glow }}>
            <Rays size={600} spin={t * 16} opacity={0.5} />
          </At>
        ) : null}
        <At x={lerp(-150, 400, w)} y={GROUND} anchor="bottom">
          <Man pose={pose} style={MAN_WHITE} size={520} heart={glow > 0 ? { color: theme.gold, glow, scale: 1.1 } : null} />
        </At>
        <At x={lerp(lerp(640, 600, lift), 1250, toss)} y={lerp(lerp(GROUND + 10, 1120, lift), 900, toss) + Math.sin(toss * Math.PI) * -200} style={{ transform: `translate(-50%, -50%) rotate(${toss * 420}deg)` }}>
          <ThornBranch size={300} />
        </At>
      </Camera>
      <div style={{ position: "absolute", top: 320, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        <Title p={l1} size={86}>
          YOLDAN BİR DAL
        </Title>
        <Title p={l1} size={86}>
          KALDIRMAK
        </Title>
        <Title p={l2} size={72} color={theme.gold}>
          SENİ BAĞIŞLATABİLİR Mİ?
        </Title>
      </div>
    </AbsoluteFill>
  );
};

// Scroll overlay: DİKENLİ DAL → KALDIRDI → BAĞIŞLANDI.
const HadithOverlay: React.FC<SceneProps> = ({ t, dur, W }) => {
  const steps = [
    { label: "DİKENLİ DAL", at: W("dikenli"), x: 200 },
    { label: "KALDIRDI", at: W("kaldırdı"), x: 520 },
    { label: "BAĞIŞLANDI", at: W("bağışladı"), x: 850, gold: true },
  ];
  const out = prog(t, dur - 0.5, dur - 0.2);
  return (
    <AbsoluteFill style={{ opacity: 1 - out }}>
      {steps.map((s, i) => {
        const p = springy(t, s.at, 2.6, 7);
        if (p <= 0) return null;
        return (
          <At key={i} x={s.x} y={300} style={{ transform: `translate(-50%, -50%) scale(${p})` }}>
            <Pill gold={s.gold} size={s.gold ? 38 : 32}>
              {s.gold ? <Star size={32} color="#1b2d66" /> : null}
              {s.label}
            </Pill>
          </At>
        );
      })}
    </AbsoluteFill>
  );
};

/** Stylised "tree of iman": a trunk with branches; `lit` lights the lowest branch. */
const ImanTree: React.FC<{ grow: number; lit: number }> = ({ grow, lit }) => {
  const branches = [
    { y: -520, len: 120 },
    { y: -450, len: 170 },
    { y: -380, len: 200 },
    { y: -310, len: 220 },
    { y: -240, len: 230 },
    { y: -170, len: 240 },
  ];
  return (
    <svg width={700} height={640} viewBox="-350 -600 700 640" style={{ overflow: "visible" }}>
      <rect x={-16} y={-560 * grow} width={32} height={560 * grow} rx={14} fill="#8a5a2b" />
      {branches.map((b, i) =>
        [-1, 1].map((side) => {
          const p = Math.min(1, Math.max(0, grow * 7 - (branches.length - i)));
          const isLit = i === branches.length - 1 && side === 1;
          const col = isLit ? (lit > 0.5 ? theme.gold : "#8a5a2b") : "#8a5a2b";
          return (
            <g key={`${i}${side}`}>
              <line x1={0} y1={b.y} x2={side * b.len * p} y2={b.y - 50 * p} stroke={col} strokeWidth={isLit ? 14 : 12} strokeLinecap="round" />
              <circle cx={side * b.len * p} cy={b.y - 50 * p} r={34 * p} fill={isLit && lit > 0.5 ? theme.gold : "#3ba57c"} />
              {isLit && lit > 0 ? <circle cx={side * b.len} cy={b.y - 50} r={70} fill={theme.gold} opacity={0.3 * lit} /> : null}
            </g>
          );
        }),
      )}
      <circle cx={0} cy={-570 * grow} r={46 * grow} fill="#3ba57c" />
    </svg>
  );
};

// Scene 3: Ibn Baz. Harm is cleared from the road; then the tree of iman, and that act is one of its branches.
const Explain1: React.FC<SceneProps & { quote: string }> = ({ t, dur, W, words, quote }) => {
  const card = prog(t, 0.05, 0.55);
  const tStart = W("yoldan");
  const tRemove = W("kaldırmak");
  const tIman = W("imanın");
  const tBranch = W("şubelerindendir");
  const partA = 1 - prog(t, tIman - 0.4, tIman, easeInOut);
  const tree = prog(t, tIman - 0.2, tBranch + 0.2, easeInOut);
  const lit = prog(t, tBranch, tBranch + 0.5);
  const items = [
    { x: 420, node: <ThornBranch size={220} /> },
    { x: 620, node: <Rock size={110} /> },
    { x: 820, node: <Glass size={120} /> },
  ];
  const harm = springy(t, W("eziyet"), 2.6, 7);
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1080} s={keys(t, [[0, 1.08], [tStart, 1.0], [dur, 1.04]])}>
        <AbsoluteFill style={{ opacity: partA }}>
          <At x={540} y={GROUND + 20}>
            <Road w={1400} />
          </At>
          <At x={200} y={GROUND} anchor="bottom">
            <Man pose={breathe(mixPose(POSES.stand, POSES.point, prog(t, tRemove - 0.3, tRemove)), t)} style={MAN_WHITE} size={520} />
          </At>
          {items.map((it, i) => {
            const off = prog(t, tRemove + i * 0.25, tRemove + i * 0.25 + 0.6, easeInOut);
            return (
              <At key={i} x={lerp(it.x, it.x + 700, off)} y={GROUND + 6 - Math.sin(off * Math.PI) * 220} style={{ transform: `translate(-50%, -50%) rotate(${off * 300}deg) scale(${harm})`, opacity: 1 - off * 0.6 }}>
                {it.node}
              </At>
            );
          })}
        </AbsoluteFill>
        {tree > 0 ? (
          <At x={540} y={GROUND} anchor="bottom" style={{ opacity: Math.min(1, tree * 2) }}>
            <div style={{ position: "relative" }}>
              <ImanTree grow={tree} lit={lit} />
            </div>
          </At>
        ) : null}
        {lit > 0 ? (
          <At x={760} y={1230} style={{ transform: `translate(-50%, -50%) scale(${springy(t, tBranch, 2.6, 7)})` }}>
            <div style={{ padding: "8px 20px", borderRadius: 16, background: theme.gold, color: "#1b2d66", fontFamily: sans, fontWeight: 800, fontSize: 26, whiteSpace: "nowrap" }}>YOLDAN EZİYETİ KALDIRMAK</div>
          </At>
        ) : null}
      </Camera>
      {tree > 0.3 ? (
        <At x={540} y={500} style={{ transform: `translate(-50%, -50%) scale(${springy(t, tIman, 2.6, 7)})` }}>
          <Pill gold size={52}>
            <Star size={40} color="#1b2d66" />
            İMANIN ŞUBESİ
          </Pill>
        </At>
      ) : null}
      <div style={{ position: "absolute", top: 270, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `translate(${(1 - card) * -900}px, ${(1 - card) * -300}px) rotate(${(1 - card) * -12}deg)`, opacity: 1 - prog(t, tStart - 0.4, tStart - 0.1) }}>
        <NameCard kicker={UI.tr.explanation} name={UI.tr.ibnBaz} font={serif} arabicFont={amiri} />
      </div>
      <ArabicLine t={t} text={quote} from={tStart} to={dur} y={1440} size={50} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

const CoinPill: React.FC<{ p: number }> = ({ p }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, transform: `scale(${p})` }}>
    <svg width={64} height={64} viewBox="-30 -30 60 60">
      <CoinG r={26} />
    </svg>
    <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 46, color: theme.gold, textShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>SADAKA</div>
  </div>
);

// Scene 4: Ibn Uthaymeen. Two panels: clearing the road = charity; helping a man = charity.
const Explain2: React.FC<SceneProps & { quote: [string, string] }> = ({ t, dur, W, words, quote }) => {
  const card = prog(t, 0.05, 0.55);
  const tStart = W("peygamber");
  const tRoad = W("yoldan");
  const tS1 = W("sadaka", 0);
  const tHelp = W("birine");
  const tS2 = W("sadaka", 1);
  const left = springy(t, 0.5, 2.4, 7);
  const right = springy(t, tHelp - 0.2, 2.4, 7);
  const lift = prog(t, tRoad + 0.6, tRoad + 1.2, easeInOut);
  const walkR = prog(t, tHelp, dur, easeInOut);
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1080} s={keys(t, [[0, 1.05], [tStart, 1.0], [dur, 1.04]])}>
        <At x={540} y={GROUND + 20}>
          <Road w={1400} />
        </At>
        <At x={540} y={1100} style={{ opacity: 0.5 }}>
          <div style={{ width: 4, height: 560, background: "linear-gradient(transparent, rgba(212,168,82,0.6), transparent)" }} />
        </At>
        {left > 0 ? (
          <>
            <At x={190} y={GROUND} anchor="bottom" style={{ transform: `translate(-50%, -100%) scale(${left})`, transformOrigin: "50% 100%" }}>
              <Man pose={breathe(mixPose({ ...POSES.give, lean: 8 }, POSES.lift, lift), t)} style={MAN_WHITE} size={460} />
            </At>
            <At x={lerp(370, 320, lift)} y={lerp(GROUND + 6, 860, lift)} style={{ transform: `translate(-50%, -50%) scale(${left * 0.8})` }}>
              <ThornBranch size={220} />
            </At>
          </>
        ) : null}
        {right > 0 ? (
          <>
            <At x={lerp(700, 760, walkR)} y={GROUND} anchor="bottom" style={{ transform: `translate(-50%, -100%) scale(${-right}, ${right})`, transformOrigin: "50% 100%" }}>
              <Man pose={breathe({ ...POSES.stand, lean: -8, headTilt: 8 }, t + 1)} style={MAN_GREY} size={430} />
            </At>
            <At x={lerp(900, 960, walkR)} y={GROUND} anchor="bottom" style={{ transform: `translate(-50%, -100%) scale(${-right}, ${right})`, transformOrigin: "50% 100%" }}>
              <Man pose={walk(POSES.carry, t, 2.2, walkR < 1 ? 0.6 : 0)} style={MAN_WHITE} size={460} rightItem={<g transform="translate(-30 -6)"><Suitcase size={80} /></g>} />
            </At>
          </>
        ) : null}
      </Camera>
      <At x={270} y={560} style={{ transform: "translate(-50%, -50%)" }}>
        <CoinPill p={springy(t, tS1, 2.6, 7)} />
      </At>
      <At x={810} y={560} style={{ transform: "translate(-50%, -50%)" }}>
        <CoinPill p={springy(t, tS2, 2.6, 7)} />
      </At>
      <div style={{ position: "absolute", top: 270, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `translate(${(1 - card) * -900}px, ${(1 - card) * -300}px) rotate(${(1 - card) * -12}deg)`, opacity: 1 - prog(t, tStart - 0.4, tStart - 0.1) }}>
        <NameCard kicker={UI.tr.explanation} name="Şeyh İbn Useymin" font={serif} arabicFont={amiri} />
      </div>
      <ArabicLine t={t} text={quote[0]} from={tStart} to={tHelp - 0.1} y={1440} size={44} />
      <ArabicLine t={t} text={quote[1]} from={tHelp} to={dur} y={1440} size={52} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

const ownCues = (p: ThornMotionProps) => (add: AddCue) => {
  const W = (scene: SceneKey) => wordTime(p.words[scene]);
  const h = W("hook");
  for (let tt = 0.15; tt < h("kaldırmak") - 0.1; tt += 0.42) add("hook", tt, "step", 0.22);
  add("hook", h("kaldırmak"), "scratch", 0.3);
  add("hook", h("seni"), "whoosh", 0.35);
  add("hook", h("bağışlatabilir"), "sparkle", 0.35);
  const d = W("hadith");
  add("hadith", d("dikenli"), "pop_high", 0.25);
  add("hadith", d("kaldırdı"), "pop_high", 0.25);
  add("hadith", d("bağışladı"), "chime", 0.35);
  const e = W("explain1");
  add("explain1", 0.05, "swipe", 0.35);
  for (let i = 0; i < 3; i++) add("explain1", e("kaldırmak") + i * 0.25, "whoosh", 0.25);
  add("explain1", e("imanın"), "rise", 0.3);
  add("explain1", e("şubelerindendir"), "sparkle", 0.4);
  const f = W("explain2");
  add("explain2", 0.05, "swipe", 0.35);
  add("explain2", f("sadaka", 0), "ding", 0.35);
  add("explain2", f("birine"), "pop", 0.3);
  add("explain2", f("sadaka", 1), "ding", 0.35);
};

export const ThornMotion: React.FC<ThornMotionProps> = (p) => {
  const hadith: HadithLayout = {
    narrator: "Rivayet eden: Ebû Hureyre",
    stamp: "Sahih Buhârî 2472",
    arabic: p.arabicLines,
    line1: ["bir", 0],
    line2: ["bu", 0],
    stampWord: "buhari",
    arabicSize: 70,
    englishSize: 44,
    contentTop: 260,
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
