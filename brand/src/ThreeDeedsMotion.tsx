import React from "react";
import { AbsoluteFill } from "remotion";
import { dark as theme } from "./theme";
import { easeInOut, keys, lerp, prog, springy } from "./motion/anim";
import { MAN_GREY, MAN_WHITE, Man, POSES, breathe, mixPose } from "./motion/Man";
import { CrowdFigure, Masjid, NameCard, Rays, Star } from "./motion/Props";
import { LightOrb } from "./motion/Props2";
import { ArabicLine, At, Camera, Captions, ReelRunner, UI, fonts, reelMetadata, wordTime, type AddCue, type HadithLayout, type ReelBase, type SceneKey, type SceneProps } from "./motion/ReelKit";

// Video 19 (Turkish): "ÜÇ AMEL". Hadith: Sahih Muslim 1631 (HadeethEnc Turkish 65566).
// Explanations: Ibn Baz, binbaz.org.sa/fatwas/15526; Ibn Uthaymeen, binothaimeen.net (library
// source dda9adaa). Turkish scholar lines are Claude's translation (needs a Turkish reviewer).

const { amiri, serif, sans } = fonts;

export type ThreeDeedsMotionProps = ReelBase & {
  arabicLines: [string, string];
  quote1: [string, string];
  quote2: string;
};
export const calculateThreeDeedsMetadata = reelMetadata<ThreeDeedsMotionProps>();

const GROUND = 1390;
const DUA = { ...POSES.stand, left: { out: 34, bend: 118 }, right: { out: 34, bend: 118 }, headTilt: 4 };

const Title: React.FC<{ p: number; size: number; color?: string; children: React.ReactNode }> = ({ p, size, color = "#fff", children }) => (
  <div style={{ fontFamily: sans, fontWeight: 800, fontSize: size, color, opacity: p, transform: `scale(${lerp(2, 1, p)})`, textShadow: "0 10px 40px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>{children}</div>
);

const Pill: React.FC<{ children: React.ReactNode; gold?: boolean; size?: number }> = ({ children, gold = false, size = 40 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 30px", borderRadius: 999, background: gold ? theme.gold : "rgba(15,26,69,0.88)", border: `3px solid ${theme.gold}`, fontFamily: sans, fontWeight: 800, fontSize: size, color: gold ? "#1b2d66" : theme.gold, whiteSpace: "nowrap", boxShadow: gold ? "0 0 40px rgba(212,168,82,0.6)" : "0 10px 30px rgba(0,0,0,0.4)" }}>
    {children}
  </div>
);

/** Oil lamp; `flame` 0..1. */
const Lamp: React.FC<{ size: number; flame: number; t: number }> = ({ size, flame, t }) => (
  <svg width={size} height={size} viewBox="-60 -110 120 120" style={{ overflow: "visible" }}>
    {flame > 0 ? <circle cx={0} cy={-60} r={60} fill={theme.gold} opacity={0.25 * flame} /> : null}
    {flame > 0.02 ? <ellipse cx={0} cy={-52 - 26 * flame} rx={13 * flame} ry={(24 + Math.sin(t * 14) * 3) * flame} fill="#f2b84b" /> : null}
    <path d="M -50 -30 Q 0 0 50 -30 L 40 -10 Q 0 6 -40 -10 Z" fill="#a8742f" />
    <path d="M 40 -30 Q 62 -40 60 -54" stroke="#a8742f" strokeWidth={6} fill="none" />
    <rect x={-4} y={-52} width={8} height={22} fill="#3b2f2a" />
  </svg>
);

const BookIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size * 0.75} viewBox="-50 -36 100 76">
    <path d="M 0 -24 Q -24 -34 -46 -26 L -46 30 Q -24 22 0 32 Q 24 22 46 30 L 46 -26 Q 24 -34 0 -24 Z" fill="#5f79c4" />
    <path d="M 0 -20 Q -22 -28 -40 -22 L -40 24 Q -22 18 0 26 Z" fill="#fbf3df" />
    <path d="M 0 -20 Q 22 -28 40 -22 L 40 24 Q 22 18 0 26 Z" fill="#f2e4c2" />
    <line x1={0} y1={-22} x2={0} y2={30} stroke="#1b2d66" strokeWidth={3} />
  </svg>
);

/** The three lasting deeds as icon badges. */
const DEEDS = [
  { key: "sadaka", label: "SADAKA-İ CÂRİYE", icon: (s: number) => <Masjid width={s} /> },
  { key: "ilim", label: "FAYDALI İLİM", icon: (s: number) => <BookIcon size={s} /> },
  { key: "evlat", label: "SALİH EVLAT", icon: (s: number) => <CrowdFigure size={s} color="#2f8f6b" arm={1} /> },
];

// Scene 1: a lamp goes out; three small lights keep shining.
const Hook: React.FC<SceneProps> = ({ t, dur, W }) => {
  const s = keys(t, [
    [0, 1.15],
    [dur, 1.0],
  ]);
  const l1 = prog(t, W("öldükten"), W("öldükten") + 0.2);
  const l2 = prog(t, W("sevap"), W("sevap") + 0.2);
  const flame = 1 - prog(t, 0.6, 1.3);
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1150} s={s}>
        <At x={540} y={GROUND} anchor="bottom">
          <Lamp size={300} flame={flame} t={t} />
        </At>
        {[0, 1, 2].map((i) => {
          const p = springy(t, W("sevap") + i * 0.15, 2.6, 7);
          if (p <= 0) return null;
          return (
            <At key={i} x={300 + i * 240} y={960 - (i === 1 ? 80 : 0) + Math.sin(t * 2 + i) * 10} style={{ transform: `translate(-50%, -50%) scale(${p})` }}>
              <LightOrb size={150} />
            </At>
          );
        })}
      </Camera>
      <div style={{ position: "absolute", top: 340, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <Title p={l1} size={84}>
          ÖLDÜKTEN SONRA DA
        </Title>
        <Title p={l2} size={66} color={theme.gold}>
          SEVAP KAZANABİLİR MİSİN?
        </Title>
      </div>
    </AbsoluteFill>
  );
};

// Scroll overlay: the three deeds pop in as badges.
const HadithOverlay: React.FC<SceneProps> = ({ t, dur, W }) => {
  const ats = [W("sadaka-i"), W("ilim"), W("evlat")];
  const out = prog(t, dur - 0.5, dur - 0.2);
  return (
    <AbsoluteFill style={{ opacity: 1 - out }}>
      {DEEDS.map((d, i) => {
        const p = springy(t, ats[i], 2.6, 7);
        if (p <= 0) return null;
        return (
          <At key={i} x={190 + i * 350} y={290} style={{ transform: `translate(-50%, -50%) scale(${p})` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 18px 8px 10px", borderRadius: 999, background: "rgba(15,26,69,0.9)", border: `3px solid ${theme.gold}` }}>
              <div style={{ width: 70, height: 70, borderRadius: 99, background: "#fbf3df", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>{d.icon(i === 2 ? 64 : 56)}</div>
              <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 24, color: theme.gold, whiteSpace: "nowrap" }}>{d.label}</div>
            </div>
          </At>
        );
      })}
    </AbsoluteFill>
  );
};

// Scene 3: Ibn Baz. A man endows a mosque; people pray in it; after he is gone the reward keeps flowing.
const Explain1: React.FC<SceneProps & { quote: [string, string] }> = ({ t, dur, W, words, quote }) => {
  const card = prog(t, 0.05, 0.55);
  const tStart = W("sadaka-i");
  const tWaqf = W("vakfettiği");
  const tMosque = W("mescid");
  const tPeople = W("insanlar");
  const tAfter = W("ölümünden");
  const mosque = springy(t, tMosque - 0.3, 2.2, 7);
  const give = prog(t, tWaqf - 0.2, tWaqf + 0.3);
  const people = prog(t, tPeople - 0.2, tPeople + 1.2, easeInOut);
  const gone = prog(t, tAfter - 0.2, tAfter + 0.8);
  const flow = prog(t, tPeople, tPeople + 0.5);
  const waqf = springy(t, tWaqf, 2.6, 7);
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1080} s={keys(t, [[0, 1.08], [tStart, 1.0], [dur, 1.04]])}>
        {mosque > 0 ? (
          <At x={640} y={GROUND} anchor="bottom" style={{ transform: `translate(-50%, -100%) scale(${mosque})`, transformOrigin: "50% 100%" }}>
            <Masjid width={520} />
          </At>
        ) : null}
        <At x={200} y={GROUND} anchor="bottom" style={{ opacity: 1 - gone }}>
          <Man pose={breathe(mixPose(POSES.stand, POSES.give, give), t)} style={MAN_WHITE} size={480} />
        </At>
        {gone > 0 ? (
          <At x={200} y={GROUND} anchor="bottom" style={{ opacity: gone }}>
            <Star size={90} />
          </At>
        ) : null}
        {[0, 1, 2, 3].map((i) => (
          <At key={i} x={lerp(1200 + i * 80, 560 + i * 70, people)} y={GROUND + 6} anchor="bottom">
            <CrowdFigure size={130} color={["#9aa6c4", "#c9733a", "#5f79c4", "#b88660"][i]} arm={0.2} />
          </At>
        ))}
        {flow > 0
          ? [0, 1, 2, 3, 4].map((i) => {
              const p = (t * 0.45 + i / 5) % 1;
              return (
                <At key={`o${i}`} x={lerp(640, 200, p)} y={lerp(900, 1180, p) - Math.sin(p * Math.PI) * 260} style={{ opacity: flow * Math.sin(p * Math.PI) }}>
                  <LightOrb size={64} />
                </At>
              );
            })
          : null}
        {gone > 0 ? (
          <At x={200} y={1080} style={{ opacity: gone * 0.7 }}>
            <Rays size={420} spin={t * 16} opacity={0.5} />
          </At>
        ) : null}
      </Camera>
      {waqf > 0 ? (
        <At x={540} y={500} style={{ transform: `translate(-50%, -50%) scale(${waqf * (1 - gone)})` }}>
          <Pill size={44}>VAKIF: MESCİD</Pill>
        </At>
      ) : null}
      {gone > 0 ? (
        <At x={540} y={500} style={{ transform: `translate(-50%, -50%) scale(${springy(t, tAfter, 2.6, 7)})` }}>
          <Pill gold size={44}>
            <Star size={36} color="#1b2d66" />
            SEVAP AKMAYA DEVAM EDER
          </Pill>
        </At>
      ) : null}
      <div style={{ position: "absolute", top: 270, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `translate(${(1 - card) * -900}px, ${(1 - card) * -300}px) rotate(${(1 - card) * -12}deg)`, opacity: 1 - prog(t, tStart - 0.4, tStart - 0.1) }}>
        <NameCard kicker={UI.tr.explanation} name={UI.tr.ibnBaz} font={serif} arabicFont={amiri} />
      </div>
      <ArabicLine t={t} text={quote[0]} from={tStart} to={tPeople - 0.1} y={1440} size={46} />
      <ArabicLine t={t} text={quote[1]} from={tPeople} to={dur} y={1440} size={46} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

// Scene 4: Ibn Uthaymeen. A son raises his hands in dua; light rises: dua is the best gift.
const Explain2: React.FC<SceneProps & { quote: string }> = ({ t, dur, W, words, quote }) => {
  const card = prog(t, 0.05, 0.55);
  const tStart = W("diriler");
  const tBest = W("en");
  const dua = prog(t, 0.5, 1.1);
  const best = springy(t, tBest, 2.6, 7);
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1080} s={keys(t, [[0, 1.06], [tStart, 1.0], [dur, 1.05]])}>
        <At x={540} y={1080} style={{ opacity: 0.4 + best * 0.5 }}>
          <Rays size={700} spin={t * 12} opacity={0.5} />
        </At>
        <At x={540} y={GROUND} anchor="bottom">
          <Man pose={breathe(mixPose(POSES.stand, DUA, dua), t)} style={MAN_GREY} size={520} heart={{ color: theme.gold, glow: 0.5 + best, scale: 1.1 }} />
        </At>
        {dua > 0.5
          ? [0, 1, 2, 3, 4].map((i) => {
              const p = (t * 0.4 + i / 5) % 1;
              return (
                <At key={i} x={540 + Math.sin(i * 2.1 + t) * 80} y={1000 - p * 420} style={{ opacity: Math.sin(p * Math.PI) }}>
                  <LightOrb size={64} />
                </At>
              );
            })
          : null}
      </Camera>
      {best > 0 ? (
        <At x={540} y={540} style={{ transform: `translate(-50%, -50%) scale(${best})` }}>
          <Pill gold size={50}>
            <Star size={40} color="#1b2d66" />
            EN FAZİLETLİ ŞEY: DUA
          </Pill>
        </At>
      ) : null}
      <div style={{ position: "absolute", top: 270, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `translate(${(1 - card) * -900}px, ${(1 - card) * -300}px) rotate(${(1 - card) * -12}deg)`, opacity: 1 - prog(t, tStart - 0.4, tStart - 0.1) }}>
        <NameCard kicker={UI.tr.explanation} name="Şeyh İbn Useymin" font={serif} arabicFont={amiri} />
      </div>
      <ArabicLine t={t} text={quote} from={tStart} to={dur} y={1440} size={56} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

const ownCues = (p: ThreeDeedsMotionProps) => (add: AddCue) => {
  const W = (scene: SceneKey) => wordTime(p.words[scene]);
  const h = W("hook");
  add("hook", 0.7, "swipe", 0.3);
  for (let i = 0; i < 3; i++) add("hook", h("sevap") + i * 0.15, "pop_high", 0.25);
  const d = W("hadith");
  add("hadith", d("üç"), "hit", 0.3);
  add("hadith", d("sadaka-i"), "ding", 0.3);
  add("hadith", d("ilim"), "ding", 0.3);
  add("hadith", d("evlat"), "chime", 0.35);
  const e = W("explain1");
  add("explain1", 0.05, "swipe", 0.35);
  add("explain1", e("vakfettiği"), "pop", 0.3);
  add("explain1", e("mescid") - 0.3, "rise", 0.35);
  for (let tt = e("insanlar"); tt < e("insanlar") + 1.2; tt += 0.3) add("explain1", tt, "step", 0.2);
  add("explain1", e("ölümünden"), "sparkle", 0.4);
  const f = W("explain2");
  add("explain2", 0.05, "swipe", 0.35);
  add("explain2", 0.5, "rise", 0.3);
  add("explain2", f("en"), "chime", 0.4);
};

export const ThreeDeedsMotion: React.FC<ThreeDeedsMotionProps> = (p) => {
  const hadith: HadithLayout = {
    narrator: "Rivayet eden: Ebû Hureyre",
    stamp: "Sahih Müslim 1631",
    arabic: p.arabicLines,
    line1: ["bir", 0],
    line2: ["sadaka-i", 0],
    stampWord: "müslim",
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
