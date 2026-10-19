import React from "react";
import { AbsoluteFill } from "remotion";
import { dark as theme } from "./theme";
import { easeInOut, keys, lerp, prog, springy } from "./motion/anim";
import { MAN_GREY, MAN_WHITE, Man, POSES, breathe, mixPose, walk, type Pose } from "./motion/Man";
import { CrossBadge, Heart, NameCard, Rays, SpeechBubbleGold, Star } from "./motion/Props";
import { ArabicLine, At, Camera, Captions, ReelRunner, UI, fonts, reelMetadata, wordTime, type AddCue, type HadithLayout, type ReelBase, type SceneKey, type SceneProps } from "./motion/ReelKit";

// Video 07 (Turkish): "SELAMI YAYIN". Hadith: Sahih Muslim 54 (HadeethEnc Turkish 3361).
// Explanation: Ibn Baz, binbaz.org.sa/fatwas/22274. Turkish scholar lines are
// Claude's translation (needs a Turkish reviewer).

const { amiri, serif, sans } = fonts;

export type SalamMotionProps = ReelBase & {
  arabicLines: [string, string];
  quote1: string;
  quote2: [string, string];
};
export const calculateSalamMetadata = reelMetadata<SalamMotionProps>();

const GROUND = 1390;
/** Right hand raised in greeting. */
const GREET: Pose = { ...POSES.stand, right: { out: 138, bend: 32 }, headTilt: -3 };

const Title: React.FC<{ p: number; size: number; color?: string; children: React.ReactNode }> = ({ p, size, color = "#fff", children }) => (
  <div style={{ fontFamily: sans, fontWeight: 800, fontSize: size, color, opacity: p, transform: `scale(${lerp(2, 1, p)})`, textShadow: "0 10px 40px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>{children}</div>
);

const Pill: React.FC<{ children: React.ReactNode; gold?: boolean; size?: number }> = ({ children, gold = false, size = 40 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 30px", borderRadius: 999, background: gold ? theme.gold : "rgba(15,26,69,0.88)", border: `3px solid ${theme.gold}`, fontFamily: sans, fontWeight: 800, fontSize: size, color: gold ? "#1b2d66" : theme.gold, whiteSpace: "nowrap", boxShadow: gold ? "0 0 40px rgba(212,168,82,0.6)" : "0 10px 30px rgba(0,0,0,0.4)" }}>
    {children}
  </div>
);

/** Greeting bubble: Turkish on top, the Arabic greeting under it. */
const Greeting: React.FC<{ tr: string; ar: string; glow?: number }> = ({ tr, ar, glow = 0.8 }) => (
  <SpeechBubbleGold width={400} glow={glow} tail="bottom">
    <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 30, color: "#1b2d66", whiteSpace: "nowrap" }}>{tr}</div>
    <div lang="ar" dir="rtl" style={{ fontFamily: amiri, fontWeight: 700, fontSize: 38, color: "#8a5a12", lineHeight: 1.6, marginTop: 2 }}>
      {ar}
    </div>
  </SpeechBubbleGold>
);

// Scene 1: two people walk toward each other and stand apart, cold and silent.
const Hook: React.FC<SceneProps> = ({ t, dur, W }) => {
  const s = keys(t, [
    [0, 1.3],
    [dur, 1.12],
  ]);
  const w = prog(t, 0.1, 1.7, easeInOut);
  const walking = t > 0.1 && t < 1.7;
  const ax = lerp(-150, 330, w);
  const bx = lerp(1230, 750, w);
  const l1 = prog(t, W("birbirinizi"), W("birbirinizi") + 0.2);
  const l2 = prog(t, W("en"), W("en") + 0.2);
  const q = springy(t, W("yolu"), 2.6, 7);
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1100} s={s}>
        <At x={ax} y={GROUND} anchor="bottom">
          <Man pose={walking ? walk(POSES.stand, t, 2.4, 1) : breathe({ ...POSES.stand, headTilt: 6 }, t)} style={MAN_GREY} size={520} />
        </At>
        <At x={bx} y={GROUND} anchor="bottom" style={{ transform: "translate(-50%, -100%) scaleX(-1)" }}>
          <Man pose={walking ? walk(POSES.stand, t + 0.4, 2.4, 1) : breathe({ ...POSES.stand, headTilt: 6 }, t + 1)} style={MAN_GREY} size={520} />
        </At>
        {q > 0 ? (
          <At x={540} y={1020} style={{ transform: `translate(-50%, -50%) scale(${q})` }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Heart size={190} color="#7d89a8" glow={0.4} />
              <div style={{ position: "absolute", fontFamily: sans, fontWeight: 800, fontSize: 80, color: "#fff", marginTop: -14 }}>?</div>
            </div>
          </At>
        ) : null}
      </Camera>
      <div style={{ position: "absolute", top: 380, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <Title p={l1} size={78}>
          BİRBİRİNİZİ SEVMENİN
        </Title>
        <Title p={l2} size={96} color={theme.gold}>
          EN KOLAY YOLU NE?
        </Title>
      </div>
    </AbsoluteFill>
  );
};

// Scroll overlay: the chain of the hadith builds above the scroll: SELAM → SEVGİ → İMAN → CENNET.
const HadithOverlay: React.FC<SceneProps> = ({ t, dur, W }) => {
  const steps = [
    { label: "SELAM", at: W("selamı"), x: 150 },
    { label: "SEVGİ", at: W("sevmedikçe"), x: 400 },
    { label: "İMAN", at: W("iman"), x: 655 },
    { label: "CENNET", at: W("cennete"), x: 920 },
  ];
  const out = prog(t, dur - 0.5, dur - 0.2);
  return (
    <AbsoluteFill style={{ opacity: 1 - out }}>
      {steps.map((s, i) => {
        const p = prog(t, s.at - 0.02, s.at + 0.18, easeInOut);
        if (p <= 0) return null;
        const first = i === 0;
        return (
          <At key={i} x={s.x} y={300} style={{ transform: `translate(-50%, -50%) scale(${lerp(2.2, 1, p)})`, opacity: p }}>
            <Pill gold={first} size={first ? 38 : 32}>
              {first ? <Star size={30} color="#1b2d66" /> : null}
              {s.label}
            </Pill>
          </At>
        );
      })}
      {[0, 1, 2].map((i) => {
        const a = prog(t, Math.max(steps[i].at, steps[i + 1].at), Math.max(steps[i].at, steps[i + 1].at) + 0.4);
        if (a <= 0) return null;
        return (
          <At key={`a${i}`} x={(steps[i].x + steps[i + 1].x) / 2 + (i === 0 ? 14 : 4)} y={300} style={{ opacity: a }}>
            <svg width={44} height={30} viewBox="0 0 44 30">
              <path d="M 2 15 L 34 15 M 24 4 L 38 15 L 24 26" stroke={theme.gold} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </At>
        );
      })}
    </AbsoluteFill>
  );
};

// Scene 3: Ibn Baz. The believer greets first: he walks up, raises his hand, gold greeting.
const Explain1: React.FC<SceneProps & { quote: string }> = ({ t, dur, W, words, quote }) => {
  const card = prog(t, 0.05, 0.55);
  const tMumin = W("mümin");
  const tSelam = W("selamı");
  const tIlk = W("ilk");
  const tStingy = W("cimrilik");
  const tRun = W("koşmalıdır");
  const tSunnah = W("sünneti");
  const walkIn = prog(t, 0.6, 2.8, easeInOut);
  const run = prog(t, tRun - 0.2, tRun + 0.6, easeInOut);
  const ax = lerp(-150, 270, walkIn) + run * 110;
  const bx = lerp(1230, 790, walkIn);
  const moving = (t > 0.6 && t < 2.8) || (t > tRun - 0.2 && t < tRun + 0.6);
  const greet = prog(t, tSelam - 0.3, tSelam + 0.2);
  const aPose = moving ? walk(mixPose(POSES.stand, GREET, greet), t, 2.6, 1) : breathe(mixPose(POSES.stand, GREET, greet), t);
  const bubble = springy(t, tSelam, 2.6, 7);
  const ilk = springy(t, tIlk, 2.6, 7) * (1 - prog(t, tStingy - 0.3, tStingy));
  const stingy = springy(t, tStingy, 2.6, 7) * (1 - prog(t, tSunnah - 0.4, tSunnah - 0.1));
  const cross = prog(t, tStingy + 0.4, tStingy + 0.8);
  const sunnah = springy(t, tSunnah, 2.4, 7);
  const glow = prog(t, tSunnah, tSunnah + 0.6);
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1050} s={keys(t, [[0, 1.08], [tMumin, 1.0], [dur, 1.04]])}>
        {glow > 0 ? (
          <At x={ax} y={1080} style={{ opacity: glow * 0.8 }}>
            <Rays size={560} spin={t * 16} opacity={0.5} />
          </At>
        ) : null}
        <At x={bx} y={GROUND} anchor="bottom" style={{ transform: "translate(-50%, -100%) scaleX(-1)" }}>
          <Man pose={t > 0.6 && t < 2.8 ? walk(POSES.stand, t + 0.3, 2.6, 1) : breathe(POSES.stand, t + 1)} style={MAN_GREY} size={500} />
        </At>
        <At x={ax} y={GROUND} anchor="bottom">
          <Man pose={aPose} style={MAN_WHITE} size={520} heart={glow > 0 ? { color: theme.gold, glow, scale: 1 } : null} />
        </At>
        {bubble > 0 ? (
          <At x={ax - 10} y={680} style={{ transform: `translate(-50%, -50%) scale(${bubble})` }}>
            <Greeting tr="ESSELÂMU ALEYKÜM" ar="السَّلَامُ عَلَيْكُمْ" glow={0.6 + glow * 0.6} />
          </At>
        ) : null}
      </Camera>
      {ilk > 0.01 ? (
        <At x={540} y={470} style={{ transform: `translate(-50%, -50%) scale(${ilk})` }}>
          <Pill gold size={46}>
            İLK SEN VER
          </Pill>
        </At>
      ) : null}
      {stingy > 0.01 ? (
        <At x={540} y={470} style={{ transform: `translate(-50%, -50%) scale(${stingy})` }}>
          <div style={{ position: "relative" }}>
            <Pill size={42}>SELAMDA CİMRİLİK</Pill>
            <div style={{ position: "absolute", right: -30, top: -30 }}>
              <CrossBadge size={70} p={cross} />
            </div>
          </div>
        </At>
      ) : null}
      {sunnah > 0 ? (
        <At x={540} y={470} style={{ transform: `translate(-50%, -50%) scale(${sunnah})` }}>
          <Pill gold size={50}>
            <Star size={38} color="#1b2d66" />
            MÜMİNİN SÜNNETİ
          </Pill>
        </At>
      ) : null}
      <div style={{ position: "absolute", top: 270, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `translate(${(1 - card) * -900}px, ${(1 - card) * -300}px) rotate(${(1 - card) * -12}deg)`, opacity: 1 - prog(t, tMumin - 0.4, tMumin - 0.1) }}>
        <NameCard kicker={UI.tr.explanation} name={UI.tr.ibnBaz} font={serif} arabicFont={amiri} />
      </div>
      <ArabicLine t={t} text={quote} from={tMumin} to={dur} y={1440} size={44} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

// Scene 4: the first one greets (1), the other must answer (2, VACİP); love rises between them.
const Explain2: React.FC<SceneProps & { quote: [string, string] }> = ({ t, dur, W, words, quote }) => {
  const tKisi = W("kişi");
  const tReply = W("selamı", 1);
  const tWajib = W("vaciptir");
  const greetA = prog(t, tKisi - 0.2, tKisi + 0.3);
  const greetB = prog(t, tReply - 0.2, tReply + 0.3);
  const bubA = springy(t, tKisi + 0.1, 2.6, 7);
  const bubB = springy(t, tReply + 0.1, 2.6, 7);
  const stamp = prog(t, tWajib, tWajib + 0.18, easeInOut);
  const love = prog(t, tWajib + 0.3, dur);
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1050} s={keys(t, [[0, 1.05], [tKisi, 1.0], [dur, 1.05]])}>
        {love > 0 ? (
          <At x={540} y={1060} style={{ opacity: love }}>
            <Rays size={620} spin={t * 16} opacity={0.5} />
          </At>
        ) : null}
        <At x={300} y={GROUND} anchor="bottom">
          <Man pose={breathe(mixPose(POSES.stand, GREET, greetA), t)} style={MAN_WHITE} size={520} />
        </At>
        <At x={780} y={GROUND} anchor="bottom" style={{ transform: "translate(-50%, -100%) scaleX(-1)" }}>
          <Man pose={breathe(mixPose(POSES.stand, GREET, greetB), t + 1)} style={MAN_GREY} size={500} />
        </At>
        {[0, 1, 2, 3, 4].map((i) => {
          const p = (love * 1.6 + i / 5) % 1;
          if (love <= 0) return null;
          return (
            <At key={i} x={540 + Math.sin(i * 2.1 + t * 2) * 60} y={1150 - p * 260} style={{ opacity: Math.sin(p * Math.PI) }}>
              <Heart size={70 + (i % 2) * 20} color={theme.gold} glow={0.6} />
            </At>
          );
        })}
      </Camera>
      {bubA > 0 ? (
        <At x={300} y={560} style={{ transform: `translate(-50%, -50%) scale(${bubA})` }}>
          <div style={{ position: "relative" }}>
            <Greeting tr="ESSELÂMU ALEYKÜM" ar="السَّلَامُ عَلَيْكُمْ" />
            <div style={{ position: "absolute", top: -22, left: -18, width: 50, height: 50, borderRadius: 99, background: "#1b2d66", border: `3px solid ${theme.gold}`, color: "#fff", fontFamily: sans, fontWeight: 800, fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3 }}>1</div>
          </div>
        </At>
      ) : null}
      {bubB > 0 ? (
        <At x={780} y={720} style={{ transform: `translate(-50%, -50%) scale(${bubB})` }}>
          <div style={{ position: "relative" }}>
            <Greeting tr="VE ALEYKÜM SELAM" ar="وَعَلَيْكُمُ السَّلَامُ" />
            <div style={{ position: "absolute", top: -22, left: -18, width: 50, height: 50, borderRadius: 99, background: "#1b2d66", border: `3px solid ${theme.gold}`, color: "#fff", fontFamily: sans, fontWeight: 800, fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3 }}>2</div>
            {t >= tWajib ? (
              <div style={{ position: "absolute", right: -26, top: -78, transform: `rotate(-9deg) scale(${lerp(2.4, 1, stamp)})`, opacity: stamp, zIndex: 4 }}>
                <div style={{ padding: "8px 26px", borderRadius: 14, border: "6px solid #b3261e", background: "rgba(255,255,255,0.92)", color: "#b3261e", fontFamily: sans, fontWeight: 800, fontSize: 44, letterSpacing: "0.06em" }}>VACİP</div>
              </div>
            ) : null}
          </div>
        </At>
      ) : null}
      <ArabicLine t={t} text={quote[0]} from={tKisi} to={tReply - 0.1} y={1440} size={50} />
      <ArabicLine t={t} text={quote[1]} from={tReply} to={dur} y={1440} size={54} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

const ownCues = (p: SalamMotionProps) => (add: AddCue) => {
  const W = (scene: SceneKey) => wordTime(p.words[scene]);
  const h = W("hook");
  for (let tt = 0.15; tt < 1.7; tt += 0.4) add("hook", tt, "step", 0.22);
  add("hook", h("birbirinizi"), "hit", 0.35);
  add("hook", h("en"), "pop", 0.3);
  add("hook", h("yolu"), "heartbeat", 0.45);
  const d = W("hadith");
  for (const w of ["iman", "cennete", "sevmedikçe"]) add("hadith", d(w), "pop_high", 0.25);
  add("hadith", d("selamı"), "chime", 0.35);
  const e = W("explain1");
  add("explain1", 0.05, "swipe", 0.35);
  for (let tt = 0.7; tt < 2.8; tt += 0.42) add("explain1", tt, "step", 0.25);
  add("explain1", e("selamı"), "bubble", 0.35);
  add("explain1", e("ilk"), "pop", 0.35);
  add("explain1", e("cimrilik"), "pop", 0.3);
  add("explain1", e("cimrilik") + 0.4, "strike", 0.3);
  for (let i = 0; i < 2; i++) add("explain1", e("koşmalıdır") + i * 0.3, "step", 0.3);
  add("explain1", e("sünneti"), "sparkle", 0.4);
  const f = W("explain2");
  add("explain2", f("kişi"), "bubble", 0.35);
  add("explain2", f("selamı", 1), "bubble", 0.35);
  add("explain2", f("vaciptir") + 0.1, "stamp", 0.5);
  add("explain2", f("vaciptir") + 0.5, "chime", 0.3);
};

export const SalamMotion: React.FC<SalamMotionProps> = (p) => {
  const hadith: HadithLayout = {
    narrator: "Rivayet eden: Ebû Hureyre",
    stamp: "Sahih Müslim 54",
    arabic: p.arabicLines,
    line1: ["iman", 0],
    line2: ["yaptığınız", 0],
    stampWord: "müslim",
    arabicSize: 62,
    englishSize: 40,
    contentTop: 240,
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
