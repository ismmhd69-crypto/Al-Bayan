import React from "react";
import { AbsoluteFill } from "remotion";
import { dark as theme } from "./theme";
import { easeInOut, keys, lerp, prog, springy } from "./motion/anim";
import { MAN_WHITE, Man, POSES, breathe } from "./motion/Man";
import { Check, Heart, NameCard, Rays, Star } from "./motion/Props";
import { Balance } from "./motion/Props2";
import { ArabicLine, At, Camera, Captions, ReelRunner, UI, fonts, reelMetadata, wordTime, type AddCue, type HadithLayout, type ReelBase, type SceneKey, type SceneProps } from "./motion/ReelKit";

// Video 16 (Turkish): "İKİ KELİME". Hadith: Sahih al-Bukhari 6406 (HadeethEnc Turkish 5507).
// Explanations: Ibn Baz, binbaz.org.sa/fatwas/5171 and /28963. Turkish scholar lines are
// Claude's translation (needs a Turkish reviewer).

const { amiri, serif, sans } = fonts;

export type TwoWordsMotionProps = ReelBase & {
  arabicLines: [string, string];
  quote1: [string, string];
  quote2: string;
};
export const calculateTwoWordsMetadata = reelMetadata<TwoWordsMotionProps>();

const GROUND = 1390;
const WORD_A = "سُبْحَانَ اللَّهِ الْعَظِيمِ";
const WORD_B = "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ";

const Title: React.FC<{ p: number; size: number; color?: string; children: React.ReactNode }> = ({ p, size, color = "#fff", children }) => (
  <div style={{ fontFamily: sans, fontWeight: 800, fontSize: size, color, opacity: p, transform: `scale(${lerp(2, 1, p)})`, textShadow: "0 10px 40px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>{children}</div>
);

const Pill: React.FC<{ children: React.ReactNode; gold?: boolean; size?: number }> = ({ children, gold = false, size = 40 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 30px", borderRadius: 999, background: gold ? theme.gold : "rgba(15,26,69,0.88)", border: `3px solid ${theme.gold}`, fontFamily: sans, fontWeight: 800, fontSize: size, color: gold ? "#1b2d66" : theme.gold, whiteSpace: "nowrap", boxShadow: gold ? "0 0 40px rgba(212,168,82,0.6)" : "0 10px 30px rgba(0,0,0,0.4)" }}>
    {children}
  </div>
);

/** Glowing card with one of the two phrases. */
const WordCard: React.FC<{ text: string; size?: number }> = ({ text, size = 40 }) => (
  <div lang="ar" dir="rtl" style={{ padding: "6px 22px", borderRadius: 18, background: "linear-gradient(180deg, #fffcf4, #f7e8c3)", border: `3px solid ${theme.gold}`, boxShadow: "0 0 30px rgba(212,168,82,0.7)", fontFamily: amiri, fontWeight: 700, fontSize: size, color: "#8a5a12", whiteSpace: "nowrap", lineHeight: 1.6 }}>
    {text}
  </div>
);

// Scene 1: two light word cards float up, then drop into the scale and pull it down.
const Hook: React.FC<SceneProps> = ({ t, dur, W }) => {
  const s = keys(t, [
    [0, 1.1],
    [dur, 1.0],
  ]);
  const l1 = prog(t, W("saniyeler"), W("saniyeler") + 0.2);
  const l2 = prog(t, W("mizanını"), W("mizanını") + 0.2);
  const cards = springy(t, W("iki"), 2.4, 7);
  const drop = prog(t, W("mizanını"), W("mizanını") + 0.6, easeInOut);
  const tilt = lerp(-6, 20, prog(t, W("mizanını") + 0.5, W("doldurabilir") + 0.4, easeInOut));
  const scale = springy(t, W("mizanını") - 0.3, 2.4, 7);
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1200} s={s}>
        {scale > 0 ? (
          <At x={540} y={1300} style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
            <Balance width={760} tilt={tilt} right={drop > 0.95 ? <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center", transform: "scale(0.55)", transformOrigin: "50% 100%" }}><WordCard text={WORD_A} /><WordCard text={WORD_B} /></div> : null} />
          </At>
        ) : null}
        {cards > 0 && drop < 0.95
          ? [WORD_A, WORD_B].map((w, i) => (
              <At key={i} x={lerp(i ? 760 : 320, 760, drop)} y={lerp(1010 + Math.sin(t * 2 + i) * 14, 1200, drop)} style={{ transform: `translate(-50%, -50%) scale(${cards * lerp(1, 0.55, drop)})` }}>
                <WordCard text={w} />
              </At>
            ))
          : null}
      </Camera>
      <div style={{ position: "absolute", top: 340, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <Title p={l1} size={80}>
          SANİYELER SÜREN
        </Title>
        <Title p={l1} size={80}>
          İKİ KELİME
        </Title>
        <Title p={l2} size={72} color={theme.gold}>
          MİZANINI DOLDURABİLİR Mİ?
        </Title>
      </div>
    </AbsoluteFill>
  );
};

// Scroll overlay: DİLE KOLAY · MİZANDA AĞIR · RAHMAN'A SEVİMLİ.
const HadithOverlay: React.FC<SceneProps> = ({ t, dur, W }) => {
  const items = [
    { label: "DİLE KOLAY", at: W("kolay"), x: 180 },
    { label: "MİZANDA AĞIR", at: W("ağır"), x: 520 },
    { label: "RAHMAN'A SEVİMLİ", at: W("sevimlidir"), x: 870, gold: true },
  ];
  const out = prog(t, dur - 0.5, dur - 0.2);
  return (
    <AbsoluteFill style={{ opacity: 1 - out }}>
      {items.map((s, i) => {
        const p = springy(t, s.at, 2.6, 7);
        if (p <= 0) return null;
        return (
          <At key={i} x={s.x} y={300} style={{ transform: `translate(-50%, -50%) scale(${p})` }}>
            <div style={{ padding: "10px 20px", borderRadius: 999, background: s.gold ? theme.gold : "rgba(15,26,69,0.9)", border: `3px solid ${theme.gold}`, fontFamily: sans, fontWeight: 800, fontSize: 30, color: s.gold ? "#1b2d66" : theme.gold, whiteSpace: "nowrap" }}>{s.label}</div>
          </At>
        );
      })}
    </AbsoluteFill>
  );
};

// Scene 3: Ibn Baz. A man says the words quietly to himself; the words rise; reward gathers.
const Explain1: React.FC<SceneProps & { quote: [string, string] }> = ({ t, dur, W, words, quote }) => {
  const card = prog(t, 0.05, 0.55);
  const tStart = W("kişinin");
  const tOk = W("sakınca");
  const tRather = W("aksine");
  const tGood = W("büyük");
  const ok = springy(t, tOk, 2.6, 7) * (1 - prog(t, tRather - 0.3, tRather));
  const good = springy(t, tGood, 2.6, 7);
  const glow = prog(t, tGood, tGood + 0.8);
  const rising = prog(t, W("tesbih") - 0.2, W("tesbih") + 0.3);
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1080} s={keys(t, [[0, 1.08], [tStart, 1.0], [dur, 1.04]])}>
        {glow > 0 ? (
          <At x={540} y={1080} style={{ opacity: glow * 0.8 }}>
            <Rays size={720} spin={t * 14} opacity={0.5} />
          </At>
        ) : null}
        <At x={540} y={GROUND} anchor="bottom">
          <Man pose={breathe(POSES.quiet, t)} style={MAN_WHITE} size={540} heart={{ color: theme.gold, glow: 0.4 + glow, scale: 1.1 }} />
        </At>
        {rising > 0
          ? [0, 1, 2, 3].map((i) => {
              const p = (t * 0.32 + i / 4) % 1;
              return (
                <At key={i} x={540 + (i % 2 ? 1 : -1) * (90 + p * 120)} y={930 - p * 300} style={{ transform: `translate(-50%, -50%) scale(${0.55 + p * 0.25})`, opacity: rising * Math.sin(p * Math.PI) }}>
                  <WordCard text={i % 2 ? WORD_B : WORD_A} size={36} />
                </At>
              );
            })
          : null}
      </Camera>
      {ok > 0.01 ? (
        <At x={540} y={500} style={{ transform: `translate(-50%, -50%) scale(${ok})` }}>
          <Pill size={46}>
            <Check size={48} p={prog(t, tOk + 0.3, tOk + 0.7)} />
            SAKINCA YOK
          </Pill>
        </At>
      ) : null}
      {good > 0 ? (
        <At x={540} y={500} style={{ transform: `translate(-50%, -50%) scale(${good})` }}>
          <Pill gold size={46}>
            <Star size={40} color="#1b2d66" />
            BÜYÜK HAYIR, BOL SEVAP
          </Pill>
        </At>
      ) : null}
      <div style={{ position: "absolute", top: 270, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `translate(${(1 - card) * -900}px, ${(1 - card) * -300}px) rotate(${(1 - card) * -12}deg)`, opacity: 1 - prog(t, tStart - 0.4, tStart - 0.1) }}>
        <NameCard kicker={UI.tr.explanation} name={UI.tr.ibnBaz} font={serif} arabicFont={amiri} />
      </div>
      <ArabicLine t={t} text={quote[0]} from={tStart} to={tRather - 0.1} y={1440} size={52} />
      <ArabicLine t={t} text={quote[1]} from={tRather} to={dur} y={1440} size={56} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

// Scene 4: a restless heart (jagged lines) calms into a steady gold glow with dhikr and istighfar.
const Explain2: React.FC<SceneProps & { quote: string }> = ({ t, dur, W, words, quote }) => {
  const tDhikr = W("zikretmek");
  const tIstighfar = W("istiğfar");
  const tPeace = W("huzurunun");
  const calm = prog(t, tDhikr, tPeace + 0.4, easeInOut);
  const peace = springy(t, tPeace, 2.4, 7);
  const jitter = (1 - calm) * 14;
  const pills = [
    { label: "ZİKİR", at: tDhikr, x: 260 },
    { label: "İSTİĞFAR", at: tIstighfar, x: 820 },
  ];
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1000} s={keys(t, [[0, 1.05], [tDhikr, 1.0], [dur, 1.05]])}>
        <At x={540} y={1000} style={{ opacity: calm * 0.8 }}>
          <Rays size={760} spin={t * 12} opacity={0.5} />
        </At>
        <At x={540 + Math.sin(t * 40) * jitter} y={1000 + Math.cos(t * 33) * jitter}>
          <Heart size={420} color={calm > 0.5 ? theme.gold : "#7d89a8"} glow={0.4 + calm} />
        </At>
        {/* Restless jagged lines around the heart, fading as it calms */}
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: 1 - calm }}>
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const a = (i / 6) * Math.PI * 2 + t;
            const r = 260;
            const x = 540 + Math.cos(a) * r;
            const y = 1000 + Math.sin(a) * r;
            return <path key={i} d={`M ${x} ${y} l 20 -20 l 10 30 l 20 -24`} stroke="#9aa6c4" strokeWidth={6} fill="none" strokeLinecap="round" />;
          })}
        </svg>
      </Camera>
      {pills.map((p, i) => {
        const a = springy(t, p.at, 2.6, 7);
        if (a <= 0) return null;
        return (
          <At key={i} x={p.x} y={600} style={{ transform: `translate(-50%, -50%) scale(${a})` }}>
            <Pill size={44}>{p.label}</Pill>
          </At>
        );
      })}
      {peace > 0 ? (
        <At x={540} y={1000} style={{ transform: `translate(-50%, -50%) scale(${peace})` }}>
          <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 64, color: "#1b2d66" }}>HUZUR</div>
        </At>
      ) : null}
      <ArabicLine t={t} text={quote} from={W("allahı")} to={dur} y={1440} size={44} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

const ownCues = (p: TwoWordsMotionProps) => (add: AddCue) => {
  const W = (scene: SceneKey) => wordTime(p.words[scene]);
  const h = W("hook");
  add("hook", h("iki"), "sparkle", 0.3);
  add("hook", h("mizanını"), "whoosh", 0.3);
  add("hook", h("mizanını") + 0.6, "hit", 0.4);
  const d = W("hadith");
  add("hadith", d("kolay"), "pop_high", 0.22);
  add("hadith", d("ağır"), "hit", 0.3);
  add("hadith", d("sevimlidir"), "chime", 0.35);
  const e = W("explain1");
  add("explain1", 0.05, "swipe", 0.35);
  add("explain1", e("tesbih"), "rise", 0.3);
  add("explain1", e("sakınca") + 0.3, "ding", 0.3);
  add("explain1", e("büyük"), "sparkle", 0.4);
  const f = W("explain2");
  add("explain2", 0.2, "heartbeat", 0.4);
  add("explain2", f("zikretmek"), "pop", 0.3);
  add("explain2", f("istiğfar"), "pop", 0.3);
  add("explain2", f("huzurunun"), "chime", 0.4);
};

export const TwoWordsMotion: React.FC<TwoWordsMotionProps> = (p) => {
  const hadith: HadithLayout = {
    narrator: "Rivayet eden: Ebû Hureyre",
    stamp: "Sahih Buhârî 6406",
    arabic: p.arabicLines,
    line1: ["iki", 0],
    line2: ["bunlar", 0],
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
