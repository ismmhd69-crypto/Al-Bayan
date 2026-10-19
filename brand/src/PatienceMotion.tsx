import React from "react";
import { AbsoluteFill } from "remotion";
import { dark as theme } from "./theme";
import { keys, lerp, prog, shake, springy } from "./motion/anim";
import { MAN_WHITE, Man, POSES, breathe, mixPose } from "./motion/Man";
import { Check, CrossBadge, NameCard, Rays, Star } from "./motion/Props";
import { ArabicLine, At, Camera, Captions, ReelRunner, UI, fonts, reelMetadata, wordTime, type AddCue, type HadithLayout, type ReelBase, type SceneKey, type SceneProps } from "./motion/ReelKit";

// Video 14 (Turkish): "İLK SARSINTI". Hadith: Sahih al-Bukhari 1283 (HadeethEnc Turkish 3295).
// Explanation: Ibn Baz, binbaz.org.sa/fatwas/16935. Turkish scholar lines are Claude's
// translation (needs a Turkish reviewer). The Prophet ﷺ and the woman are never drawn;
// the scenes show only a man meeting a sudden calamity.

const { amiri, serif, sans } = fonts;

export type PatienceMotionProps = ReelBase & {
  arabicLines: [string, string];
  quote1: string;
  quote2: string;
};
export const calculatePatienceMetadata = reelMetadata<PatienceMotionProps>();

const GROUND = 1390;

const Title: React.FC<{ p: number; size: number; color?: string; children: React.ReactNode }> = ({ p, size, color = "#fff", children }) => (
  <div style={{ fontFamily: sans, fontWeight: 800, fontSize: size, color, opacity: p, transform: `scale(${lerp(2, 1, p)})`, textShadow: "0 10px 40px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>{children}</div>
);

const Pill: React.FC<{ children: React.ReactNode; gold?: boolean; size?: number }> = ({ children, gold = false, size = 40 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 30px", borderRadius: 999, background: gold ? theme.gold : "rgba(15,26,69,0.88)", border: `3px solid ${theme.gold}`, fontFamily: sans, fontWeight: 800, fontSize: size, color: gold ? "#1b2d66" : theme.gold, whiteSpace: "nowrap", boxShadow: gold ? "0 0 40px rgba(212,168,82,0.6)" : "0 10px 30px rgba(0,0,0,0.4)" }}>
    {children}
  </div>
);

/** Expanding rings of a shock, starting at time `at`. */
const Shock: React.FC<{ t: number; at: number; size?: number; color?: string }> = ({ t, at, size = 700, color = "#e0322b" }) => (
  <>
    {[0, 1, 2].map((k) => {
      const p = (t - at - k * 0.25) / 1.2;
      if (p < 0 || p > 1) return null;
      return <div key={k} style={{ position: "absolute", left: -size * p / 2, top: -size * p / 2, width: size * p, height: size * p, borderRadius: 999, border: `${8 * (1 - p) + 2}px solid ${color}`, opacity: 1 - p }} />;
    })}
  </>
);

const Bolt: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="-30 -40 60 80">
    <path d="M 6 -38 L -16 4 L 0 4 L -8 38 L 18 -8 L 2 -8 Z" fill="#e0322b" stroke="#fff" strokeWidth={3} />
  </svg>
);

// Scene 1: a bolt of calamity strikes; the man staggers. When is patience real?
const Hook: React.FC<SceneProps> = ({ t, dur, W }) => {
  const s = keys(t, [
    [0, 1.2],
    [dur, 1.05],
  ]);
  const hit = 0.35;
  const bolt = prog(t, hit - 0.15, hit) * (1 - prog(t, hit + 0.5, hit + 0.9));
  const stagger = Math.sin(prog(t, hit, hit + 0.9) * Math.PI);
  const [sx, sy] = shake(t, hit, 16);
  const l1 = prog(t, W("gerçek"), W("gerçek") + 0.2);
  const l2 = prog(t, W("ne"), W("ne") + 0.2);
  return (
    <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px)` }}>
      <Camera fx={540} fy={1120} s={s}>
        <At x={540} y={1100}>
          <div style={{ position: "relative" }}>
            <Shock t={t} at={hit} />
          </div>
        </At>
        {bolt > 0 ? (
          <At x={820} y={980} style={{ opacity: bolt }}>
            <Bolt size={170} />
          </At>
        ) : null}
        <At x={540} y={GROUND} anchor="bottom">
          <Man pose={breathe(mixPose(POSES.stand, { ...POSES.fists, lean: -8, headTilt: -8 }, stagger), t)} style={MAN_WHITE} size={540} />
        </At>
      </Camera>
      <div style={{ position: "absolute", top: 360, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <Title p={l1} size={104}>
          GERÇEK SABIR
        </Title>
        <Title p={l2} size={76} color={theme.gold}>
          NE ZAMAN GÖSTERİLİR?
        </Title>
      </div>
    </AbsoluteFill>
  );
};

// Scroll overlay: SABRET at the advice, then İLK SARSINTI ANINDA at the answer.
const HadithOverlay: React.FC<SceneProps> = ({ t, dur, W }) => {
  const a = springy(t, W("sabırlı"), 2.6, 7) * (1 - prog(t, W("gerçek") - 0.4, W("gerçek") - 0.1));
  const b = springy(t, W("ilk"), 2.6, 7);
  const out = prog(t, dur - 0.5, dur - 0.2);
  return (
    <AbsoluteFill style={{ opacity: 1 - out }}>
      {a > 0.01 ? (
        <At x={540} y={300} style={{ transform: `translate(-50%, -50%) scale(${a})` }}>
          <Pill size={44}>ALLAH'TAN KORK VE SABRET</Pill>
        </At>
      ) : null}
      {b > 0 ? (
        <At x={540} y={300} style={{ transform: `translate(-50%, -50%) scale(${b})` }}>
          <Pill gold size={46}>
            <Star size={38} color="#1b2d66" />
            İLK SARSINTI ANINDA
          </Pill>
        </At>
      ) : null}
    </AbsoluteFill>
  );
};

// Scene 3: Ibn Baz. A timeline of the calamity; the reward sits at the very first moment.
const Explain1: React.FC<SceneProps & { quote: string }> = ({ t, dur, W, words, quote }) => {
  const card = prog(t, 0.05, 0.55);
  const tStart = W("sevap");
  const tFirst = W("ilk");
  const hit = tStart - 0.6;
  const line = prog(t, tStart - 0.3, tStart + 0.5);
  const first = prog(t, tFirst, tFirst + 0.5);
  const calm = prog(t, hit + 0.8, hit + 1.6);
  const reward = springy(t, W("ecir"), 2.6, 7);
  const marks = ["İLK AN", "SONRA", "DAHA SONRA"];
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1080} s={keys(t, [[0, 1.08], [tStart, 1.0], [dur, 1.04]])}>
        {first > 0 ? (
          <At x={540} y={1100} style={{ opacity: first * 0.8 }}>
            <Rays size={700} spin={t * 14} opacity={0.5} />
          </At>
        ) : null}
        <At x={540} y={1100}>
          <div style={{ position: "relative" }}>
            <Shock t={t} at={hit} />
          </div>
        </At>
        <At x={540} y={GROUND} anchor="bottom">
          <Man pose={breathe(mixPose({ ...POSES.fists, lean: -6 }, POSES.calm, calm), t)} style={MAN_WHITE} size={520} heart={calm > 0 ? { color: theme.gold, glow: 0.4 + first, scale: 1.1 } : null} />
        </At>
      </Camera>
      {line > 0 ? (
        <At x={540} y={640} style={{ opacity: line }}>
          <div style={{ position: "relative", width: 900, display: "flex", justifyContent: "space-between" }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: 44, height: 8, borderRadius: 4, background: "linear-gradient(90deg, #e0322b, rgba(154,166,196,0.4))" }} />
            {marks.map((m, i) => {
              const isFirst = i === 0;
              return (
                <div key={i} style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", width: 260 }}>
                  <div style={{ width: 96, height: 96, borderRadius: 999, background: isFirst && first > 0.5 ? theme.gold : "rgba(15,26,69,0.9)", border: `4px solid ${isFirst ? theme.gold : "#5f79c4"}`, boxShadow: isFirst ? `0 0 ${50 * first}px rgba(212,168,82,0.9)` : undefined, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {isFirst ? <Star size={56} color={first > 0.5 ? "#1b2d66" : theme.gold} /> : <div style={{ width: 20, height: 20, borderRadius: 99, background: "#5f79c4" }} />}
                  </div>
                  <div style={{ marginTop: 10, fontFamily: sans, fontWeight: 800, fontSize: 32, color: isFirst ? theme.gold : "#9aa6c4", whiteSpace: "nowrap" }}>{m}</div>
                </div>
              );
            })}
          </div>
        </At>
      ) : null}
      {reward > 0 ? (
        <At x={290} y={460} style={{ transform: `translate(-50%, -50%) scale(${reward})` }}>
          <Pill gold size={38}>
            SEVAP VE ECİR
          </Pill>
        </At>
      ) : null}
      <div style={{ position: "absolute", top: 270, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `translate(${(1 - card) * -900}px, ${(1 - card) * -300}px) rotate(${(1 - card) * -12}deg)`, opacity: 1 - prog(t, tStart - 0.4, tStart - 0.1) }}>
        <NameCard kicker={UI.tr.explanation} name={UI.tr.ibnBaz} font={serif} arabicFont={amiri} />
      </div>
      <ArabicLine t={t} text={quote} from={tStart} to={dur} y={1440} size={46} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

// Scene 4: what patience looks like: two good things kept, two bad things crossed out.
const Explain2: React.FC<SceneProps & { quote: string }> = ({ t, dur, W, words, quote }) => {
  const items = [
    { at: W("sabreder"), label: "SABREDER", good: true, x: 280, y: 520 },
    { at: W("sevabını"), label: "ECRİNİ UMAR", good: true, x: 800, y: 520 },
    { at: W("feryat"), label: "FERYAT", good: false, x: 280, y: 680 },
    { at: W("kötü"), label: "KÖTÜ SÖZ", good: false, x: 800, y: 680 },
  ];
  const glow = prog(t, W("kişi"), W("kişi") + 0.8);
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1080} s={keys(t, [[0, 1.05], [W("kişi"), 1.0], [dur, 1.05]])}>
        <At x={540} y={1100} style={{ opacity: glow * 0.8 }}>
          <Rays size={700} spin={t * 14} opacity={0.5} />
        </At>
        <At x={540} y={GROUND} anchor="bottom">
          <Man pose={breathe(POSES.calm, t)} style={MAN_WHITE} size={540} heart={{ color: theme.gold, glow: 0.4 + glow, scale: 1.2 }} />
        </At>
      </Camera>
      {items.map((it, i) => {
        const p = springy(t, it.at, 2.6, 7);
        if (p <= 0) return null;
        const mark = prog(t, it.at + 0.3, it.at + 0.7);
        return (
          <At key={i} x={it.x} y={it.y} style={{ transform: `translate(-50%, -50%) scale(${p})` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 26px", borderRadius: 999, background: "rgba(15,26,69,0.9)", border: `3px solid ${it.good ? theme.gold : "#e0322b"}`, fontFamily: sans, fontWeight: 800, fontSize: 40, color: it.good ? theme.gold : "#fff", whiteSpace: "nowrap" }}>
              {it.good ? <Check size={52} p={mark} /> : <CrossBadge size={52} p={mark} />}
              {it.label}
            </div>
          </At>
        );
      })}
      <ArabicLine t={t} text={quote} from={W("kişi")} to={dur} y={1440} size={52} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

const ownCues = (p: PatienceMotionProps) => (add: AddCue) => {
  const W = (scene: SceneKey) => wordTime(p.words[scene]);
  const h = W("hook");
  add("hook", 0.3, "strike", 0.45);
  add("hook", 0.4, "heartbeat", 0.4);
  add("hook", h("ne"), "pop", 0.3);
  const d = W("hadith");
  add("hadith", d("sabırlı"), "pop", 0.3);
  add("hadith", d("ilk"), "chime", 0.4);
  const e = W("explain1");
  add("explain1", 0.05, "swipe", 0.35);
  add("explain1", e("sevap") - 0.65, "strike", 0.35);
  add("explain1", e("ecir"), "pop", 0.3);
  add("explain1", e("ilk"), "sparkle", 0.4);
  const f = W("explain2");
  add("explain2", f("sabreder"), "ding", 0.3);
  add("explain2", f("sevabını"), "ding", 0.3);
  add("explain2", f("feryat") + 0.3, "strike", 0.3);
  add("explain2", f("kötü") + 0.3, "strike", 0.3);
};

export const PatienceMotion: React.FC<PatienceMotionProps> = (p) => {
  const hadith: HadithLayout = {
    narrator: "Rivayet eden: Enes b. Mâlik",
    stamp: "Sahih Buhârî 1283",
    arabic: p.arabicLines,
    line1: ["rasûlullah", 0],
    line2: ["rasûlullah", 1],
    stampWord: "buhari",
    arabicSize: 56,
    englishSize: 31,
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
