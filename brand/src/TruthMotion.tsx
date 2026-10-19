import React from "react";
import { AbsoluteFill } from "remotion";
import { dark as theme } from "./theme";
import { easeInOut, keys, lerp, prog, springy } from "./motion/anim";
import { MAN_WHITE, Man, POSES, breathe, mixPose, walk } from "./motion/Man";
import { Check, CrossBadge, NameCard, Rays, SpeechBubbleDark, SpeechBubbleGold } from "./motion/Props";
import { ArabicLine, At, Camera, Captions, ReelRunner, UI, fonts, reelMetadata, wordTime, type AddCue, type HadithLayout, type ReelBase, type SceneKey, type SceneProps } from "./motion/ReelKit";

// Video 15 (Turkish): "DOĞRULUK". Hadith: Sahih al-Bukhari 6094 (HadeethEnc Turkish 5504, the
// opening and closing commands "Doğruluk üzere olun / Yalandan da sakının" are Muslim's wording
// and are left out). Explanation: Ibn Baz, binbaz.org.sa/fatwas/20267. Turkish scholar lines are
// Claude's translation (needs a Turkish reviewer).

const { amiri, serif, sans } = fonts;

export type TruthMotionProps = ReelBase & {
  arabicLines: [string, string];
  quote1: [string, string];
  quote2: string;
};
export const calculateTruthMetadata = reelMetadata<TruthMotionProps>();

const GROUND = 1390;

const Title: React.FC<{ p: number; size: number; color?: string; children: React.ReactNode }> = ({ p, size, color = "#fff", children }) => (
  <div style={{ fontFamily: sans, fontWeight: 800, fontSize: size, color, opacity: p, transform: `scale(${lerp(2, 1, p)})`, textShadow: "0 10px 40px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>{children}</div>
);

/** Steps from (x, y) going up (dir -1) or down (dir 1), to the right. */
const Steps: React.FC<{ x: number; y: number; n: number; dir: 1 | -1; gold: boolean; p?: number }> = ({ x, y, n, dir, gold, p = 1 }) => (
  <>
    {Array.from({ length: n }, (_, i) => {
      const a = Math.min(1, Math.max(0, p * n - i));
      if (a <= 0) return null;
      return (
        <div key={i} style={{ position: "absolute", left: x + i * 96, top: y + dir * i * 46, width: 104, height: 26, borderRadius: 8, opacity: a, background: gold ? `linear-gradient(180deg, #f2d39a, ${theme.gold})` : "linear-gradient(180deg, #4a3e4e, #2a2430)", boxShadow: gold ? "0 0 20px rgba(212,168,82,0.6)" : "0 8px 20px rgba(0,0,0,0.5)" }} />
      );
    })}
  </>
);

const Gate: React.FC<{ glow: number }> = ({ glow }) => (
  <div style={{ position: "relative", width: 150, height: 200 }}>
    <div style={{ position: "absolute", inset: -70, borderRadius: 999, background: `radial-gradient(circle, rgba(255,226,150,${0.6 * glow}), transparent 70%)` }} />
    <div style={{ position: "absolute", inset: 0, borderRadius: "75px 75px 8px 8px", border: `8px solid ${theme.gold}`, background: `rgba(255,240,200,${0.3 + 0.6 * glow})` }} />
  </div>
);

const Pit: React.FC = () => (
  <div style={{ width: 220, height: 90, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(224,50,43,0.85), rgba(80,10,10,0.9) 60%, transparent 75%)" }} />
);

const Bubble: React.FC<{ kind: "truth" | "lie"; p: number; mark?: number }> = ({ kind, p, mark = 0 }) => (
  <div style={{ position: "relative", transform: `scale(${p})` }}>
    {kind === "truth" ? (
      <SpeechBubbleGold width={300} glow={0.8} tail="bottom">
        <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 40, color: "#1b2d66" }}>DOĞRU SÖZ</div>
      </SpeechBubbleGold>
    ) : (
      <SpeechBubbleDark width={240} tail="bottom">
        <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 40, color: "#ff8a7f" }}>YALAN</div>
      </SpeechBubbleDark>
    )}
    {mark > 0 ? (
      <div style={{ position: "absolute", right: -26, top: -26 }}>{kind === "truth" ? <Check size={64} p={mark} /> : <CrossBadge size={64} p={mark} />}</div>
    ) : null}
  </div>
);

// Scene 1: a man at a fork: golden steps up to light, dark steps down to fire.
const Hook: React.FC<SceneProps> = ({ t, dur, W }) => {
  const s = keys(t, [
    [0, 1.05],
    [dur, 0.95],
  ]);
  const l1 = prog(t, W("küçük"), W("küçük") + 0.2);
  const l2 = prog(t, W("seni"), W("seni") + 0.2);
  const up = prog(t, 0.2, 1.4);
  const down = prog(t, W("yalan"), W("yalan") + 1.0);
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1200} s={s}>
        <Steps x={340} y={1250} n={6} dir={-1} gold p={up} />
        <At x={930} y={880} style={{ opacity: up }}>
          <Gate glow={up} />
        </At>
        <Steps x={340} y={1330} n={6} dir={1} gold={false} p={down} />
        <At x={930} y={1660} style={{ opacity: down }}>
          <Pit />
        </At>
        <At x={230} y={GROUND} anchor="bottom">
          <Man pose={breathe({ ...POSES.think, headTilt: 6 }, t)} style={MAN_WHITE} size={470} />
        </At>
      </Camera>
      <div style={{ position: "absolute", top: 340, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <Title p={l1} size={96}>
          KÜÇÜK BİR YALAN
        </Title>
        <Title p={l2} size={82} color={theme.gold}>
          SENİ NEREYE GÖTÜRÜR?
        </Title>
      </div>
    </AbsoluteFill>
  );
};

/** One chain row: three labels with arrows. */
const Chain: React.FC<{ labels: string[]; ats: number[]; t: number; gold: boolean }> = ({ labels, ats, t, gold }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    {labels.map((l, i) => {
      const p = springy(t, ats[i], 2.6, 7);
      return (
        <React.Fragment key={i}>
          {i > 0 ? (
            <svg width={44} height={30} viewBox="0 0 44 30" style={{ opacity: p }}>
              <path d="M 2 15 L 34 15 M 24 4 L 38 15 L 24 26" stroke={gold ? theme.gold : "#e0322b"} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : null}
          <div style={{ transform: `scale(${p})`, padding: "10px 24px", borderRadius: 999, background: i === 2 ? (gold ? theme.gold : "#b3261e") : "rgba(15,26,69,0.9)", border: `3px solid ${gold ? theme.gold : "#e0322b"}`, fontFamily: sans, fontWeight: 800, fontSize: 34, color: i === 2 ? (gold ? "#1b2d66" : "#fff") : gold ? theme.gold : "#ff8a7f", whiteSpace: "nowrap" }}>{l}</div>
        </React.Fragment>
      );
    })}
  </div>
);

// Scroll overlay: DOĞRULUK → İYİLİK → CENNET, then YALAN → KÖTÜLÜK → CEHENNEM.
const HadithOverlay: React.FC<SceneProps> = ({ t, dur, W }) => {
  const tLie = W("yalan");
  const swap = prog(t, tLie - 0.3, tLie);
  const out = prog(t, dur - 0.5, dur - 0.2);
  return (
    <AbsoluteFill style={{ opacity: 1 - out }}>
      {swap < 1 ? (
        <At x={540} y={300} style={{ opacity: 1 - swap }}>
          <Chain t={t} gold labels={["DOĞRULUK", "İYİLİK", "CENNET"]} ats={[W("doğruluk"), W("iyilik"), W("cennete")]} />
        </At>
      ) : null}
      {swap > 0 ? (
        <At x={540} y={300} style={{ opacity: swap }}>
          <Chain t={t} gold={false} labels={["YALAN", "KÖTÜLÜK", "CEHENNEM"]} ats={[tLie, W("kötülük"), W("cehenneme")]} />
        </At>
      ) : null}
    </AbsoluteFill>
  );
};

// Scene 3: Ibn Baz. The truthful believer speaks truth; when iman weakens, a lie can slip out.
const Explain1: React.FC<SceneProps & { quote: [string, string] }> = ({ t, dur, W, words, quote }) => {
  const card = prog(t, 0.05, 0.55);
  const tStart = W("sadık");
  const tBut = W("ama");
  const tWeak = W("eksikliği");
  const tLie = W("yalan", 1);
  const truth = springy(t, tStart, 2.6, 7) * (1 - prog(t, tLie - 0.3, tLie));
  const lie = springy(t, tLie, 2.6, 7);
  const meter = springy(t, tBut, 2.4, 7);
  const level = lerp(1, 0.25, prog(t, tWeak, tWeak + 1.6, easeInOut));
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1080} s={keys(t, [[0, 1.08], [tStart, 1.0], [dur, 1.04]])}>
        <At x={540} y={GROUND} anchor="bottom">
          <Man pose={breathe(mixPose(POSES.speak, { ...POSES.stand, headTilt: 8 }, prog(t, tLie, tLie + 0.4)), t)} style={MAN_WHITE} size={540} heart={{ color: level > 0.5 ? theme.gold : "#7d89a8", glow: level, scale: 1.1 }} />
        </At>
        {truth > 0.01 ? (
          <At x={640} y={760}>
            <Bubble kind="truth" p={truth} mark={prog(t, tStart + 0.6, tStart + 1.0)} />
          </At>
        ) : null}
        {lie > 0 ? (
          <At x={640} y={760}>
            <Bubble kind="lie" p={lie} />
          </At>
        ) : null}
      </Camera>
      {meter > 0 ? (
        <At x={540} y={500} style={{ transform: `translate(-50%, -50%) scale(${meter})` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 40, color: "#fff" }}>İMAN</div>
            <div style={{ width: 520, height: 46, borderRadius: 999, background: "rgba(15,26,69,0.9)", border: `3px solid ${theme.gold}`, overflow: "hidden" }}>
              <div style={{ width: `${level * 100}%`, height: "100%", borderRadius: 999, background: level > 0.5 ? `linear-gradient(90deg, #a77b2b, ${theme.gold})` : "linear-gradient(90deg, #8a2a24, #e0322b)" }} />
            </div>
          </div>
        </At>
      ) : null}
      <div style={{ position: "absolute", top: 270, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `translate(${(1 - card) * -900}px, ${(1 - card) * -300}px) rotate(${(1 - card) * -12}deg)`, opacity: 1 - prog(t, tStart - 0.4, tStart - 0.1) }}>
        <NameCard kicker={UI.tr.explanation} name={UI.tr.ibnBaz} font={serif} arabicFont={amiri} />
      </div>
      <ArabicLine t={t} text={quote[0]} from={tStart} to={tBut - 0.1} y={1440} size={56} />
      <ArabicLine t={t} text={quote[1]} from={tBut} to={dur} y={1440} size={52} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

// Scene 4: the lie is crossed out; he climbs the golden steps toward the light.
const Explain2: React.FC<SceneProps & { quote: string }> = ({ t, dur, W, words, quote }) => {
  const tStart = W("her");
  const tAvoid = W("sakınmaktır");
  const tTruth = W("doğruluğu");
  const lie = springy(t, 0.3, 2.6, 7) * (1 - prog(t, tAvoid + 0.6, tAvoid + 1.0));
  const cross = prog(t, tAvoid, tAvoid + 0.4);
  const climb = prog(t, tTruth - 0.2, dur, easeInOut);
  const steps = prog(t, tTruth - 0.6, tTruth);
  const manX = lerp(200, 620, climb);
  const manY = GROUND - Math.max(0, (manX - 300) / 96) * 46;
  const climbing = t > tTruth - 0.2 && climb < 1;
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1060} s={keys(t, [[0, 1.05], [tStart, 1.0], [dur, 1.05]])}>
        <At x={900} y={830} style={{ opacity: steps }}>
          <Gate glow={0.5 + climb * 0.5} />
        </At>
        {climb > 0.6 ? (
          <At x={900} y={830} style={{ opacity: prog(climb, 0.6, 1) }}>
            <Rays size={600} spin={t * 14} opacity={0.5} />
          </At>
        ) : null}
        <Steps x={300} y={GROUND - 56} n={6} dir={-1} gold p={steps} />
        <At x={manX} y={manY} anchor="bottom">
          <Man pose={climbing ? walk(POSES.stand, t, 2.4, 1) : breathe(POSES.stand, t)} style={MAN_WHITE} size={500} heart={{ color: theme.gold, glow: 0.5 + climb * 0.6, scale: 1.1 }} />
        </At>
        {lie > 0.01 ? (
          <At x={420} y={820}>
            <Bubble kind="lie" p={lie} mark={cross} />
          </At>
        ) : null}
        {t > tTruth ? (
          <At x={manX + 120} y={manY - 600}>
            <Bubble kind="truth" p={springy(t, tTruth, 2.6, 7)} mark={prog(t, tTruth + 0.4, tTruth + 0.8)} />
          </At>
        ) : null}
      </Camera>
      <ArabicLine t={t} text={quote} from={tStart} to={dur} y={1440} size={50} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

const ownCues = (p: TruthMotionProps) => (add: AddCue) => {
  const W = (scene: SceneKey) => wordTime(p.words[scene]);
  const h = W("hook");
  add("hook", 0.2, "rise", 0.3);
  add("hook", h("yalan"), "hit", 0.35);
  add("hook", h("seni"), "pop", 0.3);
  const d = W("hadith");
  for (const w of ["doğruluk", "iyilik"]) add("hadith", d(w), "pop_high", 0.22);
  add("hadith", d("cennete"), "chime", 0.35);
  for (const w of ["yalan", "kötülük"]) add("hadith", d(w), "pop", 0.25);
  add("hadith", d("cehenneme"), "hit", 0.35);
  const e = W("explain1");
  add("explain1", 0.05, "swipe", 0.35);
  add("explain1", e("sadık"), "bubble", 0.3);
  add("explain1", e("ama"), "pop", 0.3);
  add("explain1", e("eksikliği"), "swipe", 0.3);
  add("explain1", e("yalan", 1), "hit", 0.35);
  const f = W("explain2");
  add("explain2", 0.3, "bubble", 0.25);
  add("explain2", f("sakınmaktır"), "strike", 0.35);
  add("explain2", f("doğruluğu"), "sparkle", 0.4);
};

export const TruthMotion: React.FC<TruthMotionProps> = (p) => {
  const hadith: HadithLayout = {
    narrator: "Rivayet eden: Abdullah b. Mes'ûd",
    stamp: "Sahih Buhârî 6094",
    arabic: p.arabicLines,
    line1: ["hiç", 0],
    line2: ["yalan", 0],
    stampWord: "buhari",
    arabicSize: 52,
    englishSize: 33,
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
