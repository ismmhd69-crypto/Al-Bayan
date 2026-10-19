import React from "react";
import { AbsoluteFill } from "remotion";
import { dark as theme } from "./theme";
import { easeInOut, keys, lerp, prog, springy } from "./motion/anim";
import { MAN_WHITE, Man, POSES, breathe, mixPose, walk } from "./motion/Man";
import { CrossBadge, Heart, NameCard, Rays, Star } from "./motion/Props";
import { Animal, Mest, Well } from "./motion/Props2";
import { ArabicLine, At, Camera, Captions, ReelRunner, UI, fonts, reelMetadata, wordTime, type AddCue, type HadithLayout, type ReelBase, type SceneKey, type SceneProps } from "./motion/ReelKit";

// Video 10 (Turkish): "SUSUZ KÖPEK". Hadith: Sahih al-Bukhari 2363 (HadeethEnc Turkish 10100).
// Explanation: Ibn Baz, binbaz.org.sa/fatwas/17674. Turkish scholar lines are Claude's
// translation (needs a Turkish reviewer).

const { amiri, serif, sans } = fonts;

export type DogMotionProps = ReelBase & {
  arabicLines: [string, string];
  quote1: string;
  quote2: string;
};
export const calculateDogMetadata = reelMetadata<DogMotionProps>();

const GROUND = 1390;

const Title: React.FC<{ p: number; size: number; color?: string; children: React.ReactNode }> = ({ p, size, color = "#fff", children }) => (
  <div style={{ fontFamily: sans, fontWeight: 800, fontSize: size, color, opacity: p, transform: `scale(${lerp(2, 1, p)})`, textShadow: "0 10px 40px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>{children}</div>
);

const Pill: React.FC<{ children: React.ReactNode; gold?: boolean; size?: number }> = ({ children, gold = false, size = 40 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 30px", borderRadius: 999, background: gold ? theme.gold : "rgba(15,26,69,0.88)", border: `3px solid ${theme.gold}`, fontFamily: sans, fontWeight: 800, fontSize: size, color: gold ? "#1b2d66" : theme.gold, whiteSpace: "nowrap", boxShadow: gold ? "0 0 40px rgba(212,168,82,0.6)" : "0 10px 30px rgba(0,0,0,0.4)" }}>
    {children}
  </div>
);

const Sand: React.FC = () => <div style={{ width: 1400, height: 90, borderRadius: "50% 50% 0 0", background: "linear-gradient(180deg, #c99a5a, #a8742f)" }} />;

const Sun: React.FC<{ t: number }> = ({ t }) => (
  <div style={{ position: "relative", width: 200, height: 200 }}>
    <div style={{ position: "absolute", inset: -60, borderRadius: 999, background: "radial-gradient(circle, rgba(255,200,90,0.5), transparent 70%)", transform: `scale(${1 + Math.sin(t * 3) * 0.05})` }} />
    <div style={{ position: "absolute", inset: 0, borderRadius: 999, background: "#f2b84b" }} />
  </div>
);

const Drop: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="-20 -24 40 44">
    <path d="M 0 -22 Q 18 2 14 10 Q 8 20 0 20 Q -8 20 -14 10 Q -18 2 0 -22 Z" fill="#7fc4f0" />
  </svg>
);

/** Round icon badge for the story row above the scroll. */
const Badge: React.FC<{ children: React.ReactNode; gold?: boolean }> = ({ children, gold }) => (
  <div style={{ width: 130, height: 130, borderRadius: 999, background: gold ? theme.gold : "rgba(15,26,69,0.9)", border: `4px solid ${theme.gold}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.4)" }}>
    {children}
  </div>
);

// Scene 1: desert heat; a thirsty dog panting; a man walks in.
const Hook: React.FC<SceneProps> = ({ t, dur, W }) => {
  const s = keys(t, [
    [0, 1.2],
    [dur, 1.05],
  ]);
  const l1 = prog(t, W("bir"), W("bir") + 0.2);
  const l2 = prog(t, W("günahlarını"), W("günahlarını") + 0.2);
  const l3 = prog(t, W("affettirebilir"), W("affettirebilir") + 0.2);
  const w = prog(t, 0.2, 2.4, easeInOut);
  const walking = t > 0.2 && t < 2.4;
  const pant = 0.5 + 0.5 * Math.sin(t * 14);
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1150} s={s}>
        <At x={940} y={1010} style={{ transform: "translate(-50%, -50%) scale(0.75)" }}>
          <Sun t={t} />
        </At>
        <At x={540} y={GROUND + 40}>
          <Sand />
        </At>
        <At x={lerp(-150, 300, w)} y={GROUND} anchor="bottom">
          <Man pose={walking ? walk(POSES.stand, t, 2.4, 1) : breathe({ ...POSES.stand, headTilt: 5 }, t)} style={MAN_WHITE} size={520} />
        </At>
        <At x={760} y={GROUND} anchor="bottom" style={{ transform: "translate(-50%, -100%) scaleX(-1)" }}>
          <Animal size={190} kind="dog" pant={pant} />
        </At>
        {[0, 1, 2].map((i) => {
          const p = (t * 0.8 + i / 3) % 1;
          return (
            <At key={i} x={700 + i * 50} y={1150 - p * 120} style={{ opacity: Math.sin(p * Math.PI) * 0.6 }}>
              <svg width={30} height={60} viewBox="-15 -30 30 60">
                <path d="M 0 30 Q 12 15 0 0 Q -12 -15 0 -30" stroke="#f2d39a" strokeWidth={4} fill="none" />
              </svg>
            </At>
          );
        })}
      </Camera>
      <div style={{ position: "absolute", top: 330, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <Title p={l1} size={80}>
          BİR KÖPEĞE SU VERMEK
        </Title>
        <Title p={l2} size={90} color={theme.gold}>
          GÜNAHLARINI
        </Title>
        <Title p={l3} size={84} color={theme.gold}>
          AFFETTİREBİLİR Mİ?
        </Title>
      </div>
    </AbsoluteFill>
  );
};

// Scroll overlay: the story as icons (thirst, well, dog, the sock of water, forgiveness), then the lesson.
const HadithOverlay: React.FC<SceneProps> = ({ t, dur, W }) => {
  const icons = [
    { at: W("susadı"), node: <Drop size={70} /> },
    { at: W("kuyuya"), node: <Well size={100} /> },
    { at: W("köpek"), node: <Animal size={64} kind="dog" pant={1} /> },
    { at: W("suladı"), node: <Mest size={90} water={1} /> },
    { at: W("affetti"), node: <Star size={80} color="#1b2d66" />, gold: true },
  ];
  const tLesson = W("ashab");
  const rowOut = prog(t, tLesson - 0.2, tLesson + 0.2);
  const lesson = springy(t, W("ciğer"), 2.4, 7);
  const out = prog(t, dur - 0.5, dur - 0.2);
  return (
    <AbsoluteFill style={{ opacity: 1 - out }}>
      <div style={{ opacity: 1 - rowOut }}>
        {icons.map((c, i) => {
          const p = springy(t, c.at, 2.6, 7);
          if (p <= 0) return null;
          return (
            <At key={i} x={150 + i * 195} y={290} style={{ transform: `translate(-50%, -50%) scale(${p})` }}>
              <Badge gold={c.gold}>{c.node}</Badge>
            </At>
          );
        })}
      </div>
      {lesson > 0 ? (
        <At x={540} y={290} style={{ transform: `translate(-50%, -50%) scale(${lesson})` }}>
          <Pill gold size={44}>
            <Heart size={44} color="#1b2d66" glow={0} />
            HER CANLIYA İYİLİKTE ECİR VAR
          </Pill>
        </At>
      ) : null}
    </AbsoluteFill>
  );
};

/** Water bowl (centre origin). */
const Bowl: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size * 0.5} viewBox="-50 -20 100 50">
    <ellipse cx={0} cy={-6} rx={44} ry={9} fill="#7fc4f0" />
    <path d="M -46 -6 Q -40 26 0 26 Q 40 26 46 -6 Z" fill="#5f79c4" />
  </svg>
);

// Scene 3: Ibn Baz. A man sets water before the dog; other animals come; hearts of mercy.
const Explain1: React.FC<SceneProps & { quote: string }> = ({ t, dur, W, words, quote }) => {
  const card = prog(t, 0.05, 0.55);
  const tBiz = W("biz");
  const tAnimals = W("hayvanlara");
  const tMercy = W("şefkatle");
  const give = prog(t, 1.0, 1.6);
  const bowl = prog(t, 1.6, 2.0);
  const others = springy(t, tAnimals, 2.4, 7);
  const mercy = prog(t, tMercy, tMercy + 0.6);
  const pill = springy(t, W("emrolunduk") - 0.2, 2.6, 7);
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1060} s={keys(t, [[0, 1.08], [tBiz, 1.0], [dur, 1.04]])}>
        {mercy > 0 ? (
          <At x={540} y={1100} style={{ opacity: mercy * 0.8 }}>
            <Rays size={760} spin={t * 14} opacity={0.5} />
          </At>
        ) : null}
        <At x={300} y={GROUND} anchor="bottom">
          <Man pose={breathe(mixPose(POSES.stand, { ...POSES.give, lean: 6 }, give), t)} style={MAN_WHITE} size={520} heart={mercy > 0 ? { color: theme.gold, glow: mercy, scale: 1 } : null} />
        </At>
        {bowl > 0 ? (
          <At x={510} y={GROUND - 20} style={{ opacity: bowl }}>
            <Bowl size={110} />
          </At>
        ) : null}
        <At x={680} y={GROUND} anchor="bottom" style={{ transform: "translate(-50%, -100%) scaleX(-1)" }}>
          <Animal size={170} kind="dog" pant={bowl > 0 ? 0.3 : 0.5 + 0.5 * Math.sin(t * 14)} />
        </At>
        {others > 0 ? (
          <>
            <At x={920} y={GROUND} anchor="bottom" style={{ transform: `translate(-50%, -100%) scale(${-others}, ${others})`, transformOrigin: "50% 100%" }}>
              <Animal size={130} kind="sheep" />
            </At>
          </>
        ) : null}
        {mercy > 0
          ? [0, 1, 2, 3].map((i) => {
              const p = (t * 0.5 + i / 4) % 1;
              return (
                <At key={i} x={[480, 640, 900, 360][i]} y={1180 - p * 260} style={{ opacity: mercy * Math.sin(p * Math.PI) }}>
                  <Heart size={70} color={theme.gold} glow={0.6} />
                </At>
              );
            })
          : null}
      </Camera>
      {pill > 0 ? (
        <At x={540} y={520} style={{ transform: `translate(-50%, -50%) scale(${pill})` }}>
          <Pill gold size={52}>
            <Heart size={50} color="#1b2d66" glow={0} />
            ŞEFKAT EMRİ
          </Pill>
        </At>
      ) : null}
      <div style={{ position: "absolute", top: 270, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `translate(${(1 - card) * -900}px, ${(1 - card) * -300}px) rotate(${(1 - card) * -12}deg)`, opacity: 1 - prog(t, tBiz - 0.4, tBiz - 0.1) }}>
        <NameCard kicker={UI.tr.explanation} name={UI.tr.ibnBaz} font={serif} arabicFont={amiri} />
      </div>
      <ArabicLine t={t} text={quote} from={tBiz} to={dur} y={1440} size={54} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

// Scene 4: three things forbidden toward animals, each crossed out; the dog rests safe.
const Explain2: React.FC<SceneProps & { quote: string }> = ({ t, dur, W, words, quote }) => {
  const items = [
    { at: W("eziyet"), label: "EZİYET" },
    { at: W("zulmetmemek"), label: "ZULÜM" },
    { at: W("dövmemekle"), label: "DÖVMEK", note: "İHTİYAÇ OLMADIKÇA" },
  ];
  const safe = prog(t, W("emrolunduk") - 0.2, W("emrolunduk") + 0.6);
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1060} s={keys(t, [[0, 1.05], [W("onlara"), 1.0], [dur, 1.05]])}>
        <At x={540} y={1150} style={{ opacity: 0.4 + safe * 0.5 }}>
          <Rays size={640} spin={t * 12} opacity={0.5} />
        </At>
        <At x={540} y={GROUND} anchor="bottom">
          <Animal size={200} kind="dog" pant={0.2} />
        </At>
        {safe > 0 ? (
          <At x={540} y={1060} style={{ transform: `translate(-50%, -50%) scale(${springy(t, W("emrolunduk") - 0.2, 2.4, 7)})` }}>
            <Heart size={110} color={theme.gold} glow={1} />
          </At>
        ) : null}
      </Camera>
      {items.map((it, i) => {
        const p = springy(t, it.at, 2.6, 7);
        if (p <= 0) return null;
        const x = prog(t, it.at + 0.35, it.at + 0.7);
        return (
          <At key={i} x={540} y={430 + i * 150} style={{ transform: `translate(-50%, -50%) scale(${p})` }}>
            <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "12px 34px", borderRadius: 999, background: "rgba(15,26,69,0.9)", border: "3px solid #e0322b", fontFamily: sans, fontWeight: 800, fontSize: 48, color: "#fff" }}>
                <CrossBadge size={56} p={x} />
                {it.label}
              </div>
              {it.note ? <div style={{ marginTop: 6, fontFamily: sans, fontWeight: 800, fontSize: 26, color: theme.gold, letterSpacing: "0.06em" }}>{it.note}</div> : null}
            </div>
          </At>
        );
      })}
      <ArabicLine t={t} text={quote} from={W("onlara")} to={dur} y={1440} size={50} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

const ownCues = (p: DogMotionProps) => (add: AddCue) => {
  const W = (scene: SceneKey) => wordTime(p.words[scene]);
  const h = W("hook");
  for (let tt = 0.25; tt < 2.4; tt += 0.42) add("hook", tt, "step", 0.22);
  add("hook", h("bir"), "hit", 0.35);
  add("hook", h("günahlarını"), "pop", 0.3);
  add("hook", h("affettirebilir"), "heartbeat", 0.4);
  const d = W("hadith");
  for (const w of ["susadı", "kuyuya", "köpek", "suladı"]) add("hadith", d(w), "pop_high", 0.22);
  add("hadith", d("affetti"), "sparkle", 0.35);
  add("hadith", d("ciğer"), "chime", 0.35);
  const e = W("explain1");
  add("explain1", 0.05, "swipe", 0.35);
  add("explain1", 1.6, "bubble", 0.3);
  add("explain1", e("hayvanlara"), "pop", 0.3);
  add("explain1", e("şefkatle"), "sparkle", 0.35);
  add("explain1", e("emrolunduk") - 0.2, "ding", 0.3);
  const f = W("explain2");
  for (const w of ["eziyet", "zulmetmemek", "dövmemekle"]) {
    add("explain2", f(w), "pop", 0.3);
    add("explain2", f(w) + 0.4, "strike", 0.3);
  }
  add("explain2", f("emrolunduk"), "chime", 0.35);
};

export const DogMotion: React.FC<DogMotionProps> = (p) => {
  const hadith: HadithLayout = {
    narrator: "Rivayet eden: Ebû Hureyre",
    stamp: "Sahih Buhârî 2363",
    arabic: p.arabicLines,
    line1: ["bir", 0],
    line2: ["ashab", 0],
    stampWord: "buhari",
    arabicSize: 54,
    englishSize: 30,
    contentTop: 228,
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
