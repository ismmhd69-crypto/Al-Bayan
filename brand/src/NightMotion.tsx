import React from "react";
import { AbsoluteFill, random } from "remotion";
import { dark as theme } from "./theme";
import { easeInOut, keys, lerp, prog, springy } from "./motion/anim";
import { MAN_WHITE, Man, POSES, breathe, mixPose, type Pose } from "./motion/Man";
import { Bed, LyingMan, NameCard, Star } from "./motion/Props";
import { LightOrb } from "./motion/Props2";
import { ArabicLine, At, Camera, Captions, ReelRunner, UI, fonts, reelMetadata, wordTime, type AddCue, type HadithLayout, type ReelBase, type SceneKey, type SceneProps } from "./motion/ReelKit";

// Video 13 (Turkish): "GECENİN SON ÜÇTE BİRİ". Hadith: Sahih al-Bukhari 1145 (HadeethEnc Turkish 10412).
// Explanation: Ibn Baz, binbaz.org.sa/fatwas/17595. Turkish scholar lines are Claude's
// translation (needs a Turkish reviewer). The descent itself is never drawn: only the night,
// the time of night and a man who wakes to pray.

const { amiri, serif, sans } = fonts;

export type NightMotionProps = ReelBase & {
  arabicLines: [string, string];
  quote1: [string, string];
  quote2: [string, string];
};
export const calculateNightMetadata = reelMetadata<NightMotionProps>();

const GROUND = 1390;
/** Hands raised in front of the chest for dua. */
const DUA: Pose = { ...POSES.stand, left: { out: 34, bend: 118 }, right: { out: 34, bend: 118 }, headTilt: 4 };

const Title: React.FC<{ p: number; size: number; color?: string; children: React.ReactNode }> = ({ p, size, color = "#fff", children }) => (
  <div style={{ fontFamily: sans, fontWeight: 800, fontSize: size, color, opacity: p, transform: `scale(${lerp(2, 1, p)})`, textShadow: "0 10px 40px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>{children}</div>
);

const Pill: React.FC<{ children: React.ReactNode; gold?: boolean; size?: number }> = ({ children, gold = false, size = 40 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 30px", borderRadius: 999, background: gold ? theme.gold : "rgba(15,26,69,0.88)", border: `3px solid ${theme.gold}`, fontFamily: sans, fontWeight: 800, fontSize: size, color: gold ? "#1b2d66" : theme.gold, whiteSpace: "nowrap", boxShadow: gold ? "0 0 40px rgba(212,168,82,0.6)" : "0 10px 30px rgba(0,0,0,0.4)" }}>
    {children}
  </div>
);

const Moon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="-50 -50 100 100">
    <circle r={46} fill="#f4e3b5" opacity={0.15} />
    <path d="M 6 -40 A 40 40 0 1 0 6 40 A 60 60 0 0 1 6 -40 Z" fill="#f4e3b5" />
  </svg>
);

const Stars: React.FC<{ t: number; n?: number; top?: number; h?: number }> = ({ t, n = 26, top = 500, h = 600 }) => (
  <>
    {Array.from({ length: n }, (_, i) => (
      <At key={i} x={random(`x${i}`) * 1080} y={top + random(`y${i}`) * h} style={{ opacity: 0.4 + 0.6 * Math.abs(Math.sin(t * 1.5 + i)) }}>
        <div style={{ width: 6 + (i % 3) * 3, height: 6 + (i % 3) * 3, borderRadius: 99, background: "#f4efe3" }} />
      </At>
    ))}
  </>
);

/** The night from sunset to dawn split into three; `lit` lights the last third. */
const NightBar: React.FC<{ w: number; p: number; lit: number; moon?: number }> = ({ w, p, lit, moon }) => (
  <div style={{ width: w, opacity: p }}>
    <div style={{ display: "flex", gap: 8 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ flex: 1, height: 56, borderRadius: 16, background: i === 2 ? `rgba(212,168,82,${0.25 + lit * 0.75})` : "rgba(15,26,69,0.9)", border: `3px solid ${i === 2 ? theme.gold : "#5f79c4"}`, boxShadow: i === 2 ? `0 0 ${40 * lit}px rgba(212,168,82,0.8)` : undefined, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans, fontWeight: 800, fontSize: 26, color: i === 2 && lit > 0.5 ? "#1b2d66" : "#c9ced9" }}>
          {i + 1}/3
        </div>
      ))}
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontFamily: sans, fontWeight: 800, fontSize: 24, color: theme.gold }}>
      <span>AKŞAM</span>
      <span>FECİR</span>
    </div>
    {moon !== undefined ? (
      <div style={{ position: "relative", height: 0 }}>
        <div style={{ position: "absolute", left: moon * w - 30, top: -150 }}>
          <Moon size={60} />
        </div>
      </div>
    ) : null}
  </div>
);

// Scene 1: a quiet night, a house with one window; the call: does he hear it?
const Hook: React.FC<SceneProps> = ({ t, dur, W }) => {
  const s = keys(t, [
    [0, 1.15],
    [dur, 1.0],
  ]);
  const l1 = prog(t, W("her"), W("her") + 0.2);
  const l2 = prog(t, W("rabbin"), W("rabbin") + 0.2);
  const l3 = prog(t, W("duyuyor"), W("duyuyor") + 0.2);
  const light = prog(t, W("duyuyor"), W("duyuyor") + 0.6);
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1100} s={s}>
        <Stars t={t} top={680} h={500} />
        <At x={910} y={960}>
          <Moon size={150} />
        </At>
        <At x={540} y={GROUND} anchor="bottom">
          <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <svg width={520} height={160} viewBox="0 0 520 160">
              <path d="M 0 160 L 260 0 L 520 160 Z" fill="#26346b" />
            </svg>
            <div style={{ width: 460, height: 300, background: "#1f2b5c", position: "relative", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
              <div style={{ position: "absolute", left: 60, top: 70, width: 130, height: 120, borderRadius: 10, background: `rgba(242,200,110,${0.25 + light * 0.75})`, boxShadow: `0 0 ${60 * light}px rgba(242,200,110,0.8)` }} />
              <div style={{ position: "absolute", right: 60, top: 70, width: 130, height: 120, borderRadius: 10, background: "rgba(15,26,69,0.9)" }} />
              <div style={{ position: "absolute", left: 200, bottom: 0, width: 70, height: 140, borderRadius: "10px 10px 0 0", background: "#3b2f2a" }} />
            </div>
          </div>
        </At>
      </Camera>
      <div style={{ position: "absolute", top: 330, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <Title p={l1} size={86}>
          HER GECE
        </Title>
        <Title p={l2} size={76}>
          RABBİN SENİ ÇAĞIRIYOR
        </Title>
        <Title p={l3} size={92} color={theme.gold}>
          DUYUYOR MUSUN?
        </Title>
      </div>
    </AbsoluteFill>
  );
};

// Scroll overlay: the night in thirds (last one lit), then DUA / İSTEK / MAĞFİRET.
const HadithOverlay: React.FC<SceneProps> = ({ t, dur, W }) => {
  const tThird = W("üçte");
  const bar = prog(t, W("gecenin") - 0.1, W("gecenin") + 0.3);
  const lit = prog(t, tThird, tThird + 0.5);
  const tCalls = W("bana");
  const barOut = prog(t, tCalls - 0.3, tCalls);
  const items = [
    { label: "DUA", at: W("dua"), x: 230 },
    { label: "İSTEK", at: W("ister"), x: 520 },
    { label: "MAĞFİRET", at: W("mağfiret"), x: 830 },
  ];
  const out = prog(t, dur - 0.5, dur - 0.2);
  return (
    <AbsoluteFill style={{ opacity: 1 - out }}>
      {bar > 0 && barOut < 1 ? (
        <At x={540} y={300} style={{ opacity: 1 - barOut }}>
          <NightBar w={860} p={bar} lit={lit} />
        </At>
      ) : null}
      {items.map((it, i) => {
        const p = springy(t, it.at, 2.6, 7);
        if (p <= 0) return null;
        return (
          <At key={i} x={it.x} y={300} style={{ transform: `translate(-50%, -50%) scale(${p})` }}>
            <Pill gold size={38}>
              <Star size={30} color="#1b2d66" />
              {it.label}
            </Pill>
          </At>
        );
      })}
    </AbsoluteFill>
  );
};

// Scene 3: Ibn Baz. The night bar; the last third lights up; a sleeper wakes and stands to pray.
const Explain1: React.FC<SceneProps & { quote: [string, string] }> = ({ t, dur, W, words, quote }) => {
  const card = prog(t, 0.05, 0.55);
  const tStart = W("gecenin");
  const tThird = W("son");
  const tGreat = W("büyük");
  const tWake = W("ilahi");
  const bar = prog(t, tStart - 0.2, tStart + 0.3);
  const moon = prog(t, tStart, tThird + 0.6, easeInOut) * 0.83;
  const lit = prog(t, tThird, tThird + 0.5);
  const great = springy(t, tGreat, 2.6, 7);
  const wake = prog(t, tWake - 1.4, tWake - 0.6, easeInOut);
  const pray = prog(t, tWake, tWake + 0.6);
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1080} s={keys(t, [[0, 1.08], [tStart, 1.0], [dur, 1.04]])}>
        <Stars t={t} top={760} h={300} n={18} />
        {wake < 1 ? (
          <At x={540} y={GROUND} anchor="bottom" style={{ opacity: 1 - wake }}>
            <Bed width={520}>
              <LyingMan width={520} breath={Math.sin(t * 2.2)} />
            </Bed>
          </At>
        ) : null}
        {wake > 0 ? (
          <At x={540} y={GROUND} anchor="bottom" style={{ opacity: wake }}>
            <Man pose={breathe(mixPose(POSES.stand, POSES.takbir, pray), t)} style={MAN_WHITE} size={520} heart={pray > 0 ? { color: theme.gold, glow: pray, scale: 1.1 } : null} />
          </At>
        ) : null}
      </Camera>
      {bar > 0 ? (
        <At x={540} y={560}>
          <NightBar w={880} p={bar} lit={lit} moon={moon} />
        </At>
      ) : null}
      {great > 0 ? (
        <At x={540} y={680} style={{ transform: `translate(-50%, -50%) scale(${great})` }}>
          <Pill gold size={46}>
            <Star size={38} color="#1b2d66" />
            BÜYÜK BİR VAKİT
          </Pill>
        </At>
      ) : null}
      <div style={{ position: "absolute", top: 270, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `translate(${(1 - card) * -900}px, ${(1 - card) * -300}px) rotate(${(1 - card) * -12}deg)`, opacity: 1 - prog(t, tStart - 0.4, tStart - 0.1) }}>
        <NameCard kicker={UI.tr.explanation} name={UI.tr.ibnBaz} font={serif} arabicFont={amiri} />
      </div>
      <ArabicLine t={t} text={quote[0]} from={tStart} to={W("bu") - 0.1} y={1440} size={54} />
      <ArabicLine t={t} text={quote[1]} from={W("bu")} to={dur} y={1440} size={48} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

// Scene 4: he raises his hands in dua; lights rise; ASK / BESEECH; the best time.
const Explain2: React.FC<SceneProps & { quote: [string, string] }> = ({ t, dur, W, words, quote }) => {
  const tStart = W("rabbin");
  const tAsk = W("istemeye");
  const tPlead = W("yalvarmaya");
  const tBest = W("en");
  const dua = prog(t, 0.3, 0.9);
  const ask = springy(t, tAsk, 2.6, 7);
  const plead = springy(t, tPlead, 2.6, 7);
  const best = springy(t, tBest, 2.6, 7);
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1080} s={keys(t, [[0, 1.05], [tStart, 1.0], [dur, 1.05]])}>
        <Stars t={t} top={600} h={500} n={22} />
        <At x={540} y={GROUND} anchor="bottom">
          <Man pose={breathe(mixPose(POSES.stand, DUA, dua), t)} style={MAN_WHITE} size={540} heart={{ color: theme.gold, glow: 0.6 + best * 0.6, scale: 1.1 }} />
        </At>
        {dua > 0.5
          ? [0, 1, 2, 3, 4].map((i) => {
              const p = (t * 0.4 + i / 5) % 1;
              return (
                <At key={i} x={540 + Math.sin(i * 2.3 + t) * 70} y={1020 - p * 420} style={{ opacity: Math.sin(p * Math.PI) }}>
                  <LightOrb size={60} />
                </At>
              );
            })
          : null}
      </Camera>
      {ask > 0 ? (
        <At x={250} y={760} style={{ transform: `translate(-50%, -50%) scale(${ask})` }}>
          <Pill size={44}>İSTE</Pill>
        </At>
      ) : null}
      {plead > 0 ? (
        <At x={830} y={760} style={{ transform: `translate(-50%, -50%) scale(${plead})` }}>
          <Pill size={44}>YALVAR</Pill>
        </At>
      ) : null}
      {best > 0 ? (
        <At x={540} y={520} style={{ transform: `translate(-50%, -50%) scale(${best})` }}>
          <Pill gold size={50}>
            <Star size={40} color="#1b2d66" />
            EN FAZİLETLİ VAKİT
          </Pill>
        </At>
      ) : null}
      <ArabicLine t={t} text={quote[0]} from={tStart} to={tBest - 0.1} y={1440} size={46} />
      <ArabicLine t={t} text={quote[1]} from={tBest} to={dur} y={1440} size={56} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

const ownCues = (p: NightMotionProps) => (add: AddCue) => {
  const W = (scene: SceneKey) => wordTime(p.words[scene]);
  const h = W("hook");
  add("hook", 0.2, "chime", 0.2);
  add("hook", h("rabbin"), "pop", 0.3);
  add("hook", h("duyuyor"), "sparkle", 0.35);
  const d = W("hadith");
  add("hadith", d("üçte"), "chime", 0.3);
  add("hadith", d("dua"), "ding", 0.3);
  add("hadith", d("ister"), "ding", 0.3);
  add("hadith", d("mağfiret"), "sparkle", 0.35);
  const e = W("explain1");
  add("explain1", 0.05, "swipe", 0.35);
  add("explain1", e("son"), "chime", 0.35);
  add("explain1", e("büyük"), "pop", 0.35);
  add("explain1", e("ilahi") - 1.4, "rise", 0.3);
  const f = W("explain2");
  add("explain2", 0.3, "rise", 0.3);
  add("explain2", f("istemeye"), "pop", 0.3);
  add("explain2", f("yalvarmaya"), "pop", 0.3);
  add("explain2", f("en"), "sparkle", 0.4);
};

export const NightMotion: React.FC<NightMotionProps> = (p) => {
  const hadith: HadithLayout = {
    narrator: "Rivayet eden: Ebû Hureyre",
    stamp: "Sahih Buhârî 1145",
    arabic: p.arabicLines,
    line1: ["her", 0],
    line2: ["bana", 0],
    stampWord: "buhari",
    arabicSize: 56,
    englishSize: 36,
    contentTop: 236,
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
