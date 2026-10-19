import React from "react";
import { AbsoluteFill } from "remotion";
import { dark as theme } from "./theme";
import { easeInOut, keys, lerp, prog, springy } from "./motion/anim";
import { MAN_WHITE, Man, POSES, breathe, mixPose, walk } from "./motion/Man";
import { NameCard, Rays, Star } from "./motion/Props";
import { Camel } from "./motion/Props2";
import { ArabicLine, At, Camera, Captions, ReelRunner, UI, fonts, reelMetadata, wordTime, type AddCue, type HadithLayout, type ReelBase, type SceneKey, type SceneProps } from "./motion/ReelKit";

// Video 17 (Turkish): "TÖVBE". Hadith: Sahih al-Bukhari 6309 (HadeethEnc Turkish 4313, first narration).
// Explanations: Ibn Baz, binbaz.org.sa/fatwas/14345 and /21544. Turkish scholar lines are
// Claude's translation (needs a Turkish reviewer).

const { amiri, serif, sans } = fonts;

export type TawbaMotionProps = ReelBase & {
  arabicLines: [string, string];
  quote1: string;
  quote2: string;
};
export const calculateTawbaMetadata = reelMetadata<TawbaMotionProps>();

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

const Cloud: React.FC<{ w: number; color?: string }> = ({ w, color = "#4a5168" }) => (
  <svg width={w} height={w * 0.5} viewBox="0 0 260 130">
    <ellipse cx={80} cy={80} rx={70} ry={45} fill={color} />
    <ellipse cx={160} cy={66} rx={80} ry={56} fill={color} />
    <ellipse cx={205} cy={92} rx={50} ry={36} fill={color} />
  </svg>
);

// Scene 1: a man walks with his head down under a dark cloud; he turns to dua and the cloud lifts.
const Hook: React.FC<SceneProps> = ({ t, dur, W }) => {
  const s = keys(t, [
    [0, 1.12],
    [dur, 1.0],
  ]);
  const l1 = prog(t, W("allah"), W("allah") + 0.2);
  const l2 = prog(t, W("ne"), W("ne") + 0.2);
  const l3 = prog(t, W("biliyor"), W("biliyor") + 0.2);
  const w = prog(t, 0.1, 1.6, easeInOut);
  const walking = t > 0.1 && t < 1.6;
  const turn = prog(t, W("sevinir") - 0.3, W("sevinir") + 0.3);
  const lift = prog(t, W("sevinir"), W("sevinir") + 1.0, easeInOut);
  const x = lerp(-120, 540, w);
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1120} s={s}>
        {lift > 0 ? (
          <At x={540} y={1080} style={{ opacity: lift }}>
            <Rays size={640} spin={t * 16} opacity={0.5} />
          </At>
        ) : null}
        <At x={x} y={lerp(760, 520, lift)} style={{ opacity: 1 - lift }}>
          <Cloud w={360} />
        </At>
        <At x={x} y={GROUND} anchor="bottom">
          <Man pose={walking ? walk({ ...POSES.stand, headTilt: 10 }, t, 2.2, 1) : breathe(mixPose({ ...POSES.stand, headTilt: 10 }, DUA, turn), t)} style={MAN_WHITE} size={520} heart={lift > 0 ? { color: theme.gold, glow: lift, scale: 1.1 } : null} />
        </At>
      </Camera>
      <div style={{ position: "absolute", top: 330, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <Title p={l1} size={90}>
          ALLAH, TÖVBENE
        </Title>
        <Title p={l2} size={90} color={theme.gold}>
          NE KADAR SEVİNİR
        </Title>
        <Title p={l3} size={80}>
          BİLİYOR MUSUN?
        </Title>
      </div>
    </AbsoluteFill>
  );
};

// Scroll overlay: TÖVBE, then the lost camel found in the desert, then ÇOK DAHA FAZLA.
const HadithOverlay: React.FC<SceneProps> = ({ t, dur, W }) => {
  const a = springy(t, W("tövbe"), 2.6, 7);
  const camel = springy(t, W("devesini"), 2.6, 7);
  const more = springy(t, W("çok"), 2.6, 7);
  const out = prog(t, dur - 0.5, dur - 0.2);
  return (
    <AbsoluteFill style={{ opacity: 1 - out }}>
      {a > 0 ? (
        <At x={190} y={300} style={{ transform: `translate(-50%, -50%) scale(${a})` }}>
          <Pill size={38}>TÖVBE</Pill>
        </At>
      ) : null}
      {camel > 0 ? (
        <At x={520} y={290} style={{ transform: `translate(-50%, -50%) scale(${camel})` }}>
          <div style={{ width: 150, height: 130, borderRadius: 26, background: "rgba(15,26,69,0.9)", border: `3px solid ${theme.gold}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Camel size={95} />
          </div>
        </At>
      ) : null}
      {more > 0 ? (
        <At x={850} y={300} style={{ transform: `translate(-50%, -50%) scale(${more})` }}>
          <Pill gold size={36}>
            <Star size={30} color="#1b2d66" />
            ÇOK DAHA FAZLA
          </Pill>
        </At>
      ) : null}
    </AbsoluteFill>
  );
};

// Scene 3: Ibn Baz. Three conditions: regret, leaving the sin, firm resolve.
const Explain1: React.FC<SceneProps & { quote: string }> = ({ t, dur, W, words, quote }) => {
  const card = prog(t, 0.05, 0.55);
  const tStart = W("samimi");
  const tRegret = W("pişmanlık");
  const tLeave = W("terk");
  const tResolve = W("kesin");
  const steps = [
    { n: "1", label: "PİŞMANLIK", at: tRegret },
    { n: "2", label: "GÜNAHI TERK", at: tLeave },
    { n: "3", label: "KESİN KARAR", at: tResolve },
  ];
  const regret = prog(t, tRegret - 0.2, tRegret + 0.4) * (1 - prog(t, tLeave - 0.2, tLeave + 0.2));
  const throwP = prog(t, tLeave, tLeave + 0.9, easeInOut);
  const go = prog(t, tResolve, dur, easeInOut);
  const glow = prog(t, tResolve, tResolve + 0.6);
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1080} s={keys(t, [[0, 1.08], [tStart, 1.0], [dur, 1.04]])}>
        {glow > 0 ? (
          <At x={lerp(400, 620, go)} y={1080} style={{ opacity: glow * 0.8 }}>
            <Rays size={620} spin={t * 14} opacity={0.5} />
          </At>
        ) : null}
        <At x={lerp(400, 620, go)} y={GROUND} anchor="bottom">
          <Man
            pose={go > 0 && go < 1 ? walk(POSES.stand, t, 2.4, 1) : breathe(mixPose(mixPose(POSES.stand, { ...POSES.quiet, headTilt: 12 }, regret), POSES.point, Math.sin(throwP * Math.PI) * 0.8), t)}
            style={MAN_WHITE}
            size={520}
            heart={{ color: glow > 0.5 ? theme.gold : "#7d89a8", glow: 0.5 + glow, scale: 1.1 }}
          />
        </At>
        {throwP < 1 ? (
          <At x={lerp(560, 1250, throwP)} y={lerp(1180, 900, throwP) - Math.sin(throwP * Math.PI) * 200} style={{ transform: `translate(-50%, -50%) rotate(${throwP * 360}deg)`, opacity: t > tStart ? 1 : 0 }}>
            <svg width={120} height={90} viewBox="-50 -35 100 70">
              <path d="M -44 30 Q -50 -6 -20 -26 Q 10 -36 34 -16 Q 52 6 44 30 Z" fill="#2a2420" stroke="#4a3e34" strokeWidth={4} />
            </svg>
          </At>
        ) : null}
      </Camera>
      <div style={{ position: "absolute", top: 470, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 20 }}>
        {steps.map((st, i) => {
          const p = springy(t, st.at, 2.6, 7);
          return (
            <div key={i} style={{ transform: `scale(${p})`, width: 300, height: 150, borderRadius: 26, background: i === 2 && glow > 0.5 ? theme.gold : "rgba(15,26,69,0.9)", border: `3px solid ${theme.gold}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 44, color: i === 2 && glow > 0.5 ? "#1b2d66" : theme.gold }}>{st.n}</div>
              <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 30, color: i === 2 && glow > 0.5 ? "#1b2d66" : "#fff", whiteSpace: "nowrap" }}>{st.label}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: 270, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `translate(${(1 - card) * -900}px, ${(1 - card) * -300}px) rotate(${(1 - card) * -12}deg)`, opacity: 1 - prog(t, tStart - 0.4, tStart - 0.1) }}>
        <NameCard kicker={UI.tr.explanation} name={UI.tr.ibnBaz} font={serif} arabicFont={amiri} />
      </div>
      <ArabicLine t={t} text={quote} from={tStart} to={dur} y={1440} size={42} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

// Scene 4: a page of dark marks; a gold sweep wipes every one of them away.
const Explain2: React.FC<SceneProps & { quote: string }> = ({ t, dur, W, words, quote }) => {
  const tStart = W("kişi");
  const tAll = W("bütün");
  const tErase = W("siler");
  const page = springy(t, 0.2, 2.4, 7);
  const sweep = prog(t, tAll - 0.2, tErase + 0.4, easeInOut);
  const done = prog(t, tErase + 0.2, tErase + 0.7);
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1000} s={keys(t, [[0, 1.05], [tStart, 1.0], [dur, 1.05]])}>
        {done > 0 ? (
          <At x={540} y={960} style={{ opacity: done }}>
            <Rays size={900} spin={t * 14} opacity={0.5} />
          </At>
        ) : null}
        <At x={540} y={960} style={{ transform: `translate(-50%, -50%) scale(${page})` }}>
          <div style={{ position: "relative", width: 620, height: 720, borderRadius: 24, background: "#fbf3df", boxShadow: "0 30px 80px rgba(0,0,0,0.5)", overflow: "hidden", padding: "70px 60px", display: "flex", flexDirection: "column", gap: 36 }}>
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} style={{ height: 22, width: `${60 + ((i * 37) % 40)}%`, borderRadius: 11, background: "#3a3326", opacity: i / 9 < sweep ? 0 : 0.8 }} />
            ))}
            <div style={{ position: "absolute", left: 0, right: 0, top: `${sweep * 100 - 10}%`, height: 90, background: `linear-gradient(180deg, transparent, rgba(212,168,82,0.85), transparent)`, opacity: sweep > 0 && sweep < 1 ? 1 : 0 }} />
            {done > 0 ? (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: done }}>
                <Star size={220} />
              </div>
            ) : null}
          </div>
        </At>
      </Camera>
      {done > 0 ? (
        <At x={540} y={420} style={{ transform: `translate(-50%, -50%) scale(${springy(t, tErase + 0.2, 2.6, 7)})` }}>
          <Pill gold size={46}>
            BÜTÜN GÜNAHLAR SİLİNİR
          </Pill>
        </At>
      ) : null}
      <ArabicLine t={t} text={quote} from={tStart} to={dur} y={1440} size={50} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

const ownCues = (p: TawbaMotionProps) => (add: AddCue) => {
  const W = (scene: SceneKey) => wordTime(p.words[scene]);
  const h = W("hook");
  for (let tt = 0.15; tt < 1.6; tt += 0.42) add("hook", tt, "step", 0.2);
  add("hook", h("sevinir"), "sparkle", 0.4);
  add("hook", h("biliyor"), "pop", 0.3);
  const d = W("hadith");
  add("hadith", d("tövbe"), "pop_high", 0.25);
  add("hadith", d("devesini"), "pop", 0.3);
  add("hadith", d("çok"), "chime", 0.35);
  const e = W("explain1");
  add("explain1", 0.05, "swipe", 0.35);
  add("explain1", e("pişmanlık"), "pop", 0.3);
  add("explain1", e("terk"), "whoosh", 0.35);
  add("explain1", e("kesin"), "ding", 0.35);
  const f = W("explain2");
  add("explain2", 0.2, "paper", 0.35);
  add("explain2", f("bütün"), "swipe", 0.35);
  add("explain2", f("siler") + 0.2, "chime", 0.4);
};

export const TawbaMotion: React.FC<TawbaMotionProps> = (p) => {
  const hadith: HadithLayout = {
    narrator: "Rivayet eden: Enes b. Mâlik",
    stamp: "Sahih Buhârî 6309",
    arabic: p.arabicLines,
    line1: ["kulunun", 0],
    line2: ["sizden", 0],
    stampWord: "buhari",
    arabicSize: 68,
    englishSize: 44,
    contentTop: 256,
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
