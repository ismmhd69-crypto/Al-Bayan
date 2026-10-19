import React from "react";
import { AbsoluteFill } from "remotion";
import { dark as theme } from "./theme";
import { easeInOut, keys, lerp, prog, shake, springy } from "./motion/anim";
import { MAN_GREY, MAN_STRONG, MAN_WHITE, Man, POSES, breathe, mixPose, walk } from "./motion/Man";
import { Heart, NameCard, Rays, SpeechBubbleDark, SpeechBubbleGold, Star } from "./motion/Props";
import { LightOrb } from "./motion/Props2";
import { ArabicLine, At, Camera, Captions, ReelRunner, UI, fonts, reelMetadata, wordTime, type AddCue, type HadithLayout, type ReelBase, type SceneKey, type SceneProps } from "./motion/ReelKit";

// Video 18 (Turkish): "GIYBET". Hadith: Sahih Muslim 2589 (HadeethEnc Turkish 5326).
// Explanation: Ibn Uthaymeen, binothaimeen.net (library source 8072391b, tape 233 "كفارة الغيبة").
// Turkish scholar lines are Claude's translation (needs a Turkish reviewer).

const { amiri, serif, sans } = fonts;

export type GheebaMotionProps = ReelBase & {
  arabicLines: [string, string];
  quote1: string;
  quote2: [string, string];
};
export const calculateGheebaMetadata = reelMetadata<GheebaMotionProps>();

const GROUND = 1390;
const DUA = { ...POSES.stand, left: { out: 34, bend: 118 }, right: { out: 34, bend: 118 }, headTilt: 4 };

const Title: React.FC<{ p: number; size: number; color?: string; children: React.ReactNode }> = ({ p, size, color = "#fff", children }) => (
  <div style={{ fontFamily: sans, fontWeight: 800, fontSize: size, color, opacity: p, transform: `scale(${lerp(2, 1, p)})`, textShadow: "0 10px 40px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>{children}</div>
);

const Pill: React.FC<{ children: React.ReactNode; gold?: boolean; red?: boolean; size?: number }> = ({ children, gold = false, red = false, size = 40 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 28px", borderRadius: 999, background: gold ? theme.gold : red ? "#b3261e" : "rgba(15,26,69,0.88)", border: `3px solid ${red ? "#ff8a7f" : theme.gold}`, fontFamily: sans, fontWeight: 800, fontSize: size, color: gold ? "#1b2d66" : red ? "#fff" : theme.gold, whiteSpace: "nowrap", boxShadow: gold ? "0 0 40px rgba(212,168,82,0.6)" : "0 10px 30px rgba(0,0,0,0.4)" }}>
    {children}
  </div>
);

/** Dark gossip bubble with scribbles. */
const Gossip: React.FC<{ w?: number }> = ({ w = 260 }) => (
  <SpeechBubbleDark width={w} tail="bottom">
    <svg width={w * 0.7} height={50} viewBox="0 0 180 50">
      <path d="M 6 25 l 16 -14 l 14 26 l 16 -26 l 14 26 l 16 -26 l 14 26 l 16 -26 l 14 26 l 16 -26 l 14 26 l 18 -14" stroke="#ff8a7f" strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </SpeechBubbleDark>
);

// Scene 1: a man walks away; two others talk about him behind his back.
const Hook: React.FC<SceneProps> = ({ t, dur, W }) => {
  const s = keys(t, [
    [0, 1.12],
    [dur, 1.0],
  ]);
  const l1 = prog(t, W("söylediğin"), W("söylediğin") + 0.2);
  const l2 = prog(t, W("yine"), W("yine") + 0.2);
  const away = prog(t, 0, dur, easeInOut);
  const bubble = springy(t, 0.6, 2.6, 7);
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1120} s={s}>
        <At x={lerp(820, 1000, away)} y={GROUND - 120} anchor="bottom" style={{ opacity: 0.75 }}>
          <Man pose={walk(POSES.stand, t, 2.2, 1)} style={MAN_STRONG} size={340} />
        </At>
        <At x={230} y={GROUND} anchor="bottom">
          <Man pose={breathe(POSES.speak, t)} style={MAN_WHITE} size={500} />
        </At>
        <At x={500} y={GROUND} anchor="bottom" style={{ transform: "translate(-50%, -100%) scaleX(-1)" }}>
          <Man pose={breathe({ ...POSES.stand, headTilt: -6 }, t + 1)} style={MAN_GREY} size={480} />
        </At>
        {bubble > 0 ? (
          <At x={330} y={800} style={{ transform: `translate(-50%, -50%) scale(${bubble})` }}>
            <Gossip />
          </At>
        ) : null}
      </Camera>
      <div style={{ position: "absolute", top: 340, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <Title p={l1} size={72}>
          SÖYLEDİĞİN DOĞRUYSA,
        </Title>
        <Title p={l2} size={80} color={theme.gold}>
          YİNE DE GIYBET MİDİR?
        </Title>
      </div>
    </AbsoluteFill>
  );
};

// Scroll overlay: definition, then VARSA → GIYBET and YOKSA → İFTİRA.
const HadithOverlay: React.FC<SceneProps> = ({ t, dur, W }) => {
  const def = springy(t, W("kardeşini"), 2.6, 7) * (1 - prog(t, W("ya") - 0.3, W("ya")));
  const a = springy(t, W("varsa"), 2.6, 7);
  const b = springy(t, W("yoksa"), 2.6, 7);
  const out = prog(t, dur - 0.5, dur - 0.2);
  return (
    <AbsoluteFill style={{ opacity: 1 - out }}>
      {def > 0.01 ? (
        <At x={540} y={300} style={{ transform: `translate(-50%, -50%) scale(${def})` }}>
          <Pill size={34}>GIYBET = HOŞLANMADIĞI ŞEYLE ANMAK</Pill>
        </At>
      ) : null}
      {a > 0 ? (
        <At x={280} y={300} style={{ transform: `translate(-50%, -50%) scale(${a})` }}>
          <Pill size={34}>VARSA → GIYBET</Pill>
        </At>
      ) : null}
      {b > 0 ? (
        <At x={800} y={300} style={{ transform: `translate(-50%, -50%) scale(${b})` }}>
          <Pill red size={34}>
            YOKSA → İFTİRA
          </Pill>
        </At>
      ) : null}
    </AbsoluteFill>
  );
};

// Scene 3: Ibn Uthaymeen. The gossip bubble gets stamped: a major sin.
const Explain1: React.FC<SceneProps & { quote: string }> = ({ t, dur, W, words, quote }) => {
  const card = prog(t, 0.05, 0.55);
  const tStart = W("gıybet");
  const tMajor = W("büyük");
  const bubble = springy(t, 0.4, 2.6, 7);
  const st = prog(t, tMajor, tMajor + 0.18, easeInOut);
  const [sx, sy] = shake(t, tMajor + 0.18, 14);
  return (
    <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px)` }}>
      <Camera fx={540} fy={1080} s={keys(t, [[0, 1.08], [tStart, 1.0], [dur, 1.05]])}>
        <At x={360} y={GROUND} anchor="bottom">
          <Man pose={breathe(mixPose(POSES.speak, { ...POSES.stand, headTilt: 10 }, st), t)} style={MAN_WHITE} size={520} />
        </At>
        <At x={720} y={GROUND} anchor="bottom" style={{ transform: "translate(-50%, -100%) scaleX(-1)" }}>
          <Man pose={breathe(POSES.stand, t + 1)} style={MAN_GREY} size={490} />
        </At>
        {bubble > 0 ? (
          <At x={520} y={760} style={{ transform: `translate(-50%, -50%) scale(${bubble * 1.3})` }}>
            <div style={{ position: "relative" }}>
              <Gossip w={300} />
              {t >= tMajor ? (
                <div style={{ position: "absolute", left: -40, top: 0, transform: `rotate(-10deg) scale(${lerp(2.6, 1, st)})`, opacity: st, zIndex: 5 }}>
                  <div style={{ padding: "8px 22px", borderRadius: 14, border: "6px solid #b3261e", background: "rgba(255,255,255,0.94)", color: "#b3261e", fontFamily: sans, fontWeight: 800, fontSize: 40, whiteSpace: "nowrap", letterSpacing: "0.04em" }}>BÜYÜK GÜNAH</div>
                </div>
              ) : null}
            </div>
          </At>
        ) : null}
      </Camera>
      <div style={{ position: "absolute", top: 270, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `translate(${(1 - card) * -900}px, ${(1 - card) * -300}px) rotate(${(1 - card) * -12}deg)`, opacity: 1 - prog(t, tStart - 0.4, tStart - 0.1) }}>
        <NameCard kicker={UI.tr.explanation} name="Şeyh İbn Useymin" font={serif} arabicFont={amiri} />
      </div>
      <ArabicLine t={t} text={quote} from={tStart} to={dur} y={1440} size={58} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

// Scene 4: the remedy when he does not know: istighfar for him, and speaking well of him.
const Explain2: React.FC<SceneProps & { quote: [string, string] }> = ({ t, dur, W, words, quote }) => {
  const tStart = W("gıybet");
  const tUnaware = W("bilmiyorsa");
  const tIstighfar = W("istiğfar");
  const tGood = W("hayırla");
  const unaware = springy(t, tUnaware, 2.6, 7) * (1 - prog(t, tIstighfar - 0.2, tIstighfar + 0.2));
  const dua = prog(t, tIstighfar - 0.2, tIstighfar + 0.3) * (1 - prog(t, W("meclislerde") - 0.4, W("meclislerde")));
  const good = springy(t, tGood - 0.2, 2.6, 7);
  const steps = [
    { n: "1", label: "İSTİĞFAR", at: tIstighfar, x: 290 },
    { n: "2", label: "HAYIRLA ANMAK", at: tGood, x: 780 },
  ];
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1080} s={keys(t, [[0, 1.05], [tStart, 1.0], [dur, 1.05]])}>
        {good > 0 ? (
          <At x={300} y={1080} style={{ opacity: good * 0.7 }}>
            <Rays size={560} spin={t * 14} opacity={0.5} />
          </At>
        ) : null}
        <At x={300} y={GROUND} anchor="bottom">
          <Man pose={breathe(mixPose(mixPose(POSES.stand, DUA, dua), POSES.speak, good * (1 - dua)), t)} style={MAN_WHITE} size={520} heart={{ color: theme.gold, glow: 0.3 + good, scale: 1.1 }} />
        </At>
        <At x={850} y={GROUND - 60} anchor="bottom" style={{ opacity: 0.8 }}>
          <Man pose={breathe(POSES.stand, t + 2)} style={MAN_STRONG} size={380} heart={dua > 0.3 ? { color: theme.gold, glow: dua, scale: 1 } : null} />
        </At>
        {unaware > 0.01 ? (
          <At x={850} y={880} style={{ transform: `translate(-50%, -50%) scale(${unaware})` }}>
            <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 110, color: "#9aa6c4" }}>?</div>
          </At>
        ) : null}
        {dua > 0.3
          ? [0, 1, 2, 3].map((i) => {
              const p = (t * 0.6 + i / 4) % 1;
              return (
                <At key={i} x={lerp(320, 850, p)} y={lerp(920, 1000, p) - Math.sin(p * Math.PI) * 200} style={{ opacity: dua * Math.sin(p * Math.PI) }}>
                  <LightOrb size={60} />
                </At>
              );
            })
          : null}
        {good > 0 ? (
          <At x={420} y={800} style={{ transform: `translate(-50%, -50%) scale(${good})` }}>
            <SpeechBubbleGold width={250} glow={1} tail="bottom">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Heart size={50} color={theme.gold} glow={0} />
                <Star size={40} />
                <Heart size={50} color={theme.gold} glow={0} />
              </div>
            </SpeechBubbleGold>
          </At>
        ) : null}
      </Camera>
      {steps.map((s, i) => {
        const p = springy(t, s.at, 2.6, 7);
        if (p <= 0) return null;
        return (
          <At key={i} x={s.x} y={520} style={{ transform: `translate(-50%, -50%) scale(${p})` }}>
            <Pill gold={i === 1} size={40}>
              <span style={{ opacity: 0.8 }}>{s.n}</span>
              {s.label}
            </Pill>
          </At>
        );
      })}
      <ArabicLine t={t} text={quote[0]} from={tStart} to={tIstighfar - 0.1} y={1440} size={56} />
      <ArabicLine t={t} text={quote[1]} from={tIstighfar} to={dur} y={1440} size={44} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

const ownCues = (p: GheebaMotionProps) => (add: AddCue) => {
  const W = (scene: SceneKey) => wordTime(p.words[scene]);
  const h = W("hook");
  add("hook", 0.6, "bubble", 0.3);
  add("hook", h("yine"), "hit", 0.35);
  const d = W("hadith");
  add("hadith", d("kardeşini"), "pop", 0.3);
  add("hadith", d("varsa"), "pop", 0.3);
  add("hadith", d("yoksa"), "hit", 0.35);
  const e = W("explain1");
  add("explain1", 0.05, "swipe", 0.35);
  add("explain1", 0.4, "bubble", 0.3);
  add("explain1", e("büyük") + 0.15, "stamp", 0.55);
  const f = W("explain2");
  add("explain2", f("bilmiyorsa"), "pop", 0.3);
  add("explain2", f("istiğfar"), "rise", 0.3);
  add("explain2", f("hayırla"), "sparkle", 0.4);
};

export const GheebaMotion: React.FC<GheebaMotionProps> = (p) => {
  const hadith: HadithLayout = {
    narrator: "Rivayet eden: Ebû Hureyre",
    stamp: "Sahih Müslim 2589",
    arabic: p.arabicLines,
    line1: ["gıybet", 0],
    line2: ["ya", 0],
    stampWord: "müslim",
    arabicSize: 56,
    englishSize: 33,
    contentTop: 234,
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
