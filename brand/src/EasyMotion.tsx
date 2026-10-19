import React from "react";
import { AbsoluteFill } from "remotion";
import { dark as theme } from "./theme";
import { easeInOut, keys, lerp, prog, springy } from "./motion/anim";
import { MAN_GREY, MAN_STRONG, MAN_WHITE, Man, POSES, breathe, walk } from "./motion/Man";
import { Bed, CrossBadge, LyingMan, NameCard, Rays, Star } from "./motion/Props";
import { ArabicLine, At, Camera, Captions, ReelRunner, UI, fonts, reelMetadata, wordTime, type AddCue, type HadithLayout, type ReelBase, type SceneKey, type SceneProps } from "./motion/ReelKit";

// Video 21 (Turkish): "DİN KOLAYLIKTIR". Hadith: Sahih al-Bukhari 39 (HadeethEnc Turkish 5795).
// Explanation: Ibn Baz, binbaz.org.sa/fatwas/21163. Turkish scholar lines are Claude's
// translation (needs a Turkish reviewer).

const { amiri, serif, sans } = fonts;

export type EasyMotionProps = ReelBase & {
  arabicLines: [string, string];
  quote1: string;
  quote2: [string, string];
};
export const calculateEasyMetadata = reelMetadata<EasyMotionProps>();

const GROUND = 1390;

const Title: React.FC<{ p: number; size: number; color?: string; children: React.ReactNode }> = ({ p, size, color = "#fff", children }) => (
  <div style={{ fontFamily: sans, fontWeight: 800, fontSize: size, color, opacity: p, transform: `scale(${lerp(2, 1, p)})`, textShadow: "0 10px 40px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>{children}</div>
);

const Pill: React.FC<{ children: React.ReactNode; gold?: boolean; red?: boolean; size?: number }> = ({ children, gold = false, red = false, size = 40 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 28px", borderRadius: 999, background: gold ? theme.gold : "rgba(15,26,69,0.88)", border: `3px solid ${red ? "#e0322b" : theme.gold}`, fontFamily: sans, fontWeight: 800, fontSize: size, color: gold ? "#1b2d66" : red ? "#ff8a7f" : theme.gold, whiteSpace: "nowrap", boxShadow: gold ? "0 0 40px rgba(212,168,82,0.6)" : "0 10px 30px rgba(0,0,0,0.4)" }}>
    {children}
  </div>
);

/** A tall stack of boxes; `wobble` rotates it. Origin bottom centre. */
const BoxStack: React.FC<{ n: number; w?: number; wobble?: number }> = ({ n, w = 150, wobble = 0 }) => (
  <div style={{ display: "flex", flexDirection: "column-reverse", alignItems: "center", transform: `rotate(${wobble}deg)`, transformOrigin: "50% 100%" }}>
    {Array.from({ length: n }, (_, i) => (
      <div key={i} style={{ width: w - (i % 2) * 14, height: 64, marginTop: -2, borderRadius: 8, background: i % 2 ? "#b88660" : "#c9733a", border: "3px solid #7a4a24", transform: `translateX(${(i % 3 - 1) * 8}px)` }} />
    ))}
  </div>
);

// Scene 1: a man staggers under a tower of boxes.
const Hook: React.FC<SceneProps> = ({ t, dur, W }) => {
  const s = keys(t, [
    [0, 1.12],
    [dur, 1.0],
  ]);
  const l1 = prog(t, W("dinde"), W("dinde") + 0.2);
  const l2 = prog(t, W("çok"), W("çok") + 0.2);
  const wob = Math.sin(t * 5) * (6 + t * 3);
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1000} s={s}>
        <At x={540} y={GROUND} anchor="bottom">
          <div style={{ position: "relative", transform: `rotate(${wob * 0.3}deg)`, transformOrigin: "50% 100%" }}>
            <Man pose={{ ...POSES.lift, lean: wob * 0.3, headTilt: 8 }} style={MAN_WHITE} size={420} />
            <div style={{ position: "absolute", left: "50%", bottom: 395, transform: "translateX(-50%)" }}>
              <BoxStack n={4} w={130} wobble={wob} />
            </div>
          </div>
        </At>
      </Camera>
      <div style={{ position: "absolute", top: 340, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <Title p={l1} size={96}>
          DİNDE KENDİNİ
        </Title>
        <Title p={l2} size={72} color={theme.gold}>
          ÇOK MU ZORLUYORSUN?
        </Title>
      </div>
    </AbsoluteFill>
  );
};

const SunIcon: React.FC<{ kind: "rise" | "set" | "night" }> = ({ kind }) => (
  <svg width={70} height={60} viewBox="-35 -35 70 60">
    {kind === "night" ? (
      <path d="M 6 -26 A 26 26 0 1 0 6 26 A 40 40 0 0 1 6 -26 Z" fill="#f4e3b5" />
    ) : (
      <>
        <circle cy={kind === "rise" ? 6 : 10} r={18} fill={kind === "rise" ? "#f2b84b" : "#e08a4c"} />
        <rect x={-34} y={14} width={68} height={12} fill="#1b2d66" />
      </>
    )}
  </svg>
);

// Scroll overlay: DİN KOLAYLIKTIR → ORTA YOL → morning, evening, a little of the night.
const HadithOverlay: React.FC<SceneProps> = ({ t, dur, W }) => {
  const a = springy(t, W("kolaylıktır"), 2.6, 7) * (1 - prog(t, W("orta") - 0.3, W("orta")));
  const b = springy(t, W("orta"), 2.6, 7) * (1 - prog(t, W("günün") - 0.3, W("günün")));
  const times = [
    { kind: "rise" as const, at: W("başlangıcından"), label: "SABAH" },
    { kind: "set" as const, at: W("sonundan"), label: "AKŞAM" },
    { kind: "night" as const, at: W("geceden"), label: "GECE" },
  ];
  const out = prog(t, dur - 0.5, dur - 0.2);
  return (
    <AbsoluteFill style={{ opacity: 1 - out }}>
      {a > 0.01 ? (
        <At x={540} y={300} style={{ transform: `translate(-50%, -50%) scale(${a})` }}>
          <Pill gold size={46}>
            <Star size={38} color="#1b2d66" />
            DİN KOLAYLIKTIR
          </Pill>
        </At>
      ) : null}
      {b > 0.01 ? (
        <At x={540} y={300} style={{ transform: `translate(-50%, -50%) scale(${b})` }}>
          <Pill size={46}>ORTA YOLU TUTUN</Pill>
        </At>
      ) : null}
      {times.map((tm, i) => {
        const p = springy(t, tm.at, 2.6, 7);
        if (p <= 0) return null;
        return (
          <At key={i} x={250 + i * 290} y={290} style={{ transform: `translate(-50%, -50%) scale(${p})` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 22px 6px 12px", borderRadius: 999, background: "rgba(15,26,69,0.9)", border: `3px solid ${theme.gold}` }}>
              <SunIcon kind={tm.kind} />
              <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 30, color: theme.gold }}>{tm.label}</div>
            </div>
          </At>
        );
      })}
    </AbsoluteFill>
  );
};

// Scene 3: Ibn Baz. A narrow middle path; extremes on both sides; the believer walks steady in the middle.
const Explain1: React.FC<SceneProps & { quote: string }> = ({ t, dur, W, words, quote }) => {
  const card = prog(t, 0.05, 0.55);
  const tStart = W("mümin");
  const tHaq = W("hak");
  const tExcess = W("aşırılıktan");
  const tLax = W("gevşeklikten");
  const path = prog(t, tStart - 0.2, tStart + 0.6, easeInOut);
  const excess = springy(t, tExcess, 2.6, 7);
  const lax = springy(t, tLax, 2.6, 7);
  const go = prog(t, tHaq, dur, easeInOut);
  const glow = prog(t, tHaq, tHaq + 0.6);
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1080} s={keys(t, [[0, 1.08], [tStart, 1.0], [dur, 1.04]])}>
        {/* The middle path, drawn in perspective toward the horizon */}
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: path }}>
          <path d="M 380 1420 L 500 820 L 580 820 L 700 1420 Z" fill={`rgba(212,168,82,${0.35 + glow * 0.4})`} stroke={theme.gold} strokeWidth={4} />
          <path d="M 0 1420 L 380 1420 L 500 820 L 0 820 Z" fill="rgba(224,50,43,0.18)" />
          <path d="M 1080 1420 L 700 1420 L 580 820 L 1080 820 Z" fill="rgba(125,137,168,0.18)" />
        </svg>
        {glow > 0 ? (
          <At x={540} y={820} style={{ opacity: glow * 0.8 }}>
            <Rays size={500} spin={t * 14} opacity={0.5} />
          </At>
        ) : null}
        <At x={540} y={lerp(GROUND + 20, 1180, go)} anchor="bottom" style={{ transform: `translate(-50%, -100%) scale(${lerp(1, 0.7, go)})`, transformOrigin: "50% 100%" }}>
          <Man pose={go > 0 && go < 1 ? walk(POSES.stand, t, 2.2, 1) : breathe(POSES.stand, t)} style={MAN_WHITE} size={480} heart={{ color: theme.gold, glow: 0.4 + glow, scale: 1.1 }} />
        </At>
      </Camera>
      {excess > 0 ? (
        <At x={210} y={700} style={{ transform: `translate(-50%, -50%) scale(${excess})` }}>
          <Pill red size={38}>
            <CrossBadge size={44} p={prog(t, tExcess + 0.3, tExcess + 0.7)} />
            AŞIRILIK
          </Pill>
        </At>
      ) : null}
      {lax > 0 ? (
        <At x={870} y={700} style={{ transform: `translate(-50%, -50%) scale(${lax})` }}>
          <Pill red size={38}>
            <CrossBadge size={44} p={prog(t, tLax + 0.3, tLax + 0.7)} />
            GEVŞEKLİK
          </Pill>
        </At>
      ) : null}
      {glow > 0 ? (
        <At x={540} y={520} style={{ transform: `translate(-50%, -50%) scale(${springy(t, tHaq, 2.6, 7)})` }}>
          <Pill gold size={46}>
            HAK ÜZERE SEBAT
          </Pill>
        </At>
      ) : null}
      <div style={{ position: "absolute", top: 270, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `translate(${(1 - card) * -900}px, ${(1 - card) * -300}px) rotate(${(1 - card) * -12}deg)`, opacity: 1 - prog(t, tStart - 0.4, tStart - 0.1) }}>
        <NameCard kicker={UI.tr.explanation} name={UI.tr.ibnBaz} font={serif} arabicFont={amiri} />
      </div>
      <ArabicLine t={t} text={quote} from={tStart} to={dur} y={1440} size={52} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

// Scene 4: left, the overloaded man (excess); right, the man asleep (neglect); middle, steady and glowing.
const Explain2: React.FC<SceneProps & { quote: [string, string] }> = ({ t, dur, W, words, quote }) => {
  const tExcess = W("aşırı");
  const tLax = W("gevşeyip");
  const tMiddle = W("ikisinin");
  const left = springy(t, tExcess - 0.2, 2.4, 7);
  const right = springy(t, tLax - 0.2, 2.4, 7);
  const mid = springy(t, tMiddle - 0.1, 2.4, 7);
  const xl = prog(t, tExcess + 0.6, tExcess + 1.0);
  const xr = prog(t, tLax + 0.5, tLax + 0.9);
  const wob = Math.sin(t * 5) * 10;
  return (
    <AbsoluteFill>
      <Camera fx={540} fy={1080} s={keys(t, [[0, 1.05], [tExcess, 1.0], [dur, 1.05]])}>
        {mid > 0 ? (
          <At x={540} y={1080} style={{ opacity: mid * 0.8 }}>
            <Rays size={560} spin={t * 14} opacity={0.5} />
          </At>
        ) : null}
        {left > 0 ? (
          <At x={180} y={GROUND} anchor="bottom" style={{ transform: `translate(-50%, -100%) scale(${left})`, transformOrigin: "50% 100%" }}>
            <div style={{ position: "relative", transform: `rotate(${wob * 0.4}deg)`, transformOrigin: "50% 100%" }}>
              <Man pose={{ ...POSES.lift, headTilt: 8 }} style={MAN_GREY} size={380} />
              <div style={{ position: "absolute", left: "50%", bottom: 356, transform: "translateX(-50%)" }}>
                <BoxStack n={4} w={110} wobble={wob} />
              </div>
            </div>
          </At>
        ) : null}
        {right > 0 ? (
          <At x={900} y={GROUND} anchor="bottom" style={{ transform: `translate(-50%, -100%) scale(${right})`, transformOrigin: "50% 100%" }}>
            <Bed width={300}>
              <LyingMan width={300} breath={Math.sin(t * 2)} />
            </Bed>
          </At>
        ) : null}
        {mid > 0 ? (
          <At x={540} y={GROUND} anchor="bottom" style={{ transform: `translate(-50%, -100%) scale(${mid})`, transformOrigin: "50% 100%" }}>
            <Man pose={walk(POSES.carry, t, 2.0, 0.7)} style={MAN_STRONG} size={460} heart={{ color: theme.gold, glow: 1, scale: 1.1 }} />
          </At>
        ) : null}
      </Camera>
      {[
        { x: 330, p: xl, show: left, y: 880 },
        { x: 900, p: xr, show: right, y: 1130 },
      ].map((c, i) =>
        c.p > 0 ? (
          <At key={i} x={c.x} y={c.y} style={{ transform: `translate(-50%, -50%) scale(${c.show})` }}>
            <CrossBadge size={110} p={c.p} />
          </At>
        ) : null,
      )}
      {mid > 0 ? (
        <At x={540} y={520} style={{ transform: `translate(-50%, -50%) scale(${mid})` }}>
          <Pill gold size={44}>
            <Star size={36} color="#1b2d66" />
            İKİSİNİN ARASI
          </Pill>
        </At>
      ) : null}
      <ArabicLine t={t} text={quote[0]} from={tExcess} to={tMiddle - 0.1} y={1440} size={44} />
      <ArabicLine t={t} text={quote[1]} from={tMiddle} to={dur} y={1440} size={56} />
      <Captions t={t} words={words} y={1600} />
    </AbsoluteFill>
  );
};

const ownCues = (p: EasyMotionProps) => (add: AddCue) => {
  const W = (scene: SceneKey) => wordTime(p.words[scene]);
  const h = W("hook");
  add("hook", 0.2, "hit", 0.3);
  add("hook", h("çok"), "pop", 0.3);
  const d = W("hadith");
  add("hadith", d("kolaylıktır"), "chime", 0.35);
  add("hadith", d("orta"), "pop", 0.3);
  for (const w of ["başlangıcından", "sonundan", "geceden"]) add("hadith", d(w), "pop_high", 0.22);
  const e = W("explain1");
  add("explain1", 0.05, "swipe", 0.35);
  add("explain1", e("hak"), "sparkle", 0.35);
  add("explain1", e("aşırılıktan") + 0.3, "strike", 0.3);
  add("explain1", e("gevşeklikten") + 0.3, "strike", 0.3);
  const f = W("explain2");
  add("explain2", f("aşırı") + 0.6, "strike", 0.3);
  add("explain2", f("gevşeyip") + 0.5, "strike", 0.3);
  add("explain2", f("ikisinin"), "chime", 0.4);
};

export const EasyMotion: React.FC<EasyMotionProps> = (p) => {
  const hadith: HadithLayout = {
    narrator: "Rivayet eden: Ebû Hureyre",
    stamp: "Sahih Buhârî 39",
    arabic: p.arabicLines,
    line1: ["din", 0],
    line2: ["o", 0],
    stampWord: "buhari",
    arabicSize: 60,
    englishSize: 38,
    contentTop: 240,
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
