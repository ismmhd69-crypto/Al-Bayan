import React from "react";
import { AbsoluteFill, Html5Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig, type CalculateMetadataFunction } from "remotion";
import { noise2D } from "@remotion/noise";
import { loadFont as loadAmiri } from "@remotion/google-fonts/Amiri";
import { loadFont as loadNewsreader } from "@remotion/google-fonts/Newsreader";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { BayanMark } from "../BayanMark";
import { Arabic as ArabicName, Latin } from "../Wordmark";
import { StarPattern } from "../StarPattern";
import { dark as theme } from "../theme";
import { ease, easeInOut, keys, lerp, prog, shake, springy } from "./anim";
import { Rays, Stamp } from "./Props";

// Shared kit for every Al-Bayan reel (BAYAN_PLAN.md section 15): same background,
// camera, transitions, captions, hadith scroll, ending, voice and sound handling.
// A video only supplies its hook and two explanation scenes plus their sound cues.

export const fonts = {
  amiri: loadAmiri("normal", { weights: ["400", "700"], subsets: ["arabic"] }).fontFamily,
  serif: loadNewsreader("normal", { weights: ["400", "500"], subsets: ["latin"] }).fontFamily,
  serifItalic: loadNewsreader("italic", { weights: ["400"], subsets: ["latin"] }).fontFamily,
  sans: loadInter("normal", { weights: ["800"], subsets: ["latin"] }).fontFamily,
};
const { amiri, serif, serifItalic, sans } = fonts;

// ---------------------------------------------------------------------------
// Timing

export type Word = { word: string; start: number; end: number };
export type SceneKey = "hook" | "hadith" | "explain1" | "explain2" | "close";
export type ReelBase = {
  id: string;
  lang: "en" | "de";
  durations: Record<SceneKey, number>;
  words: Record<SceneKey, Word[]>;
};

export const FPS = 30;
export const LEAD = 0.35;
export const ORDER: SceneKey[] = ["hook", "hadith", "explain1", "explain2", "close"];
export const sceneSeconds = (d: Record<SceneKey, number>): Record<SceneKey, number> => ({
  hook: LEAD + d.hook + 0.45,
  hadith: LEAD + d.hadith + 0.95,
  explain1: LEAD + d.explain1 + 0.8,
  explain2: LEAD + d.explain2 + 0.95,
  close: LEAD + d.close + 4.2, // time to read the closing hadith
});

/** Length follows the voice clips. Use as `calculateMetadata={reelMetadata<MyProps>()}`. */
export const reelMetadata =
  <T extends ReelBase>(): CalculateMetadataFunction<T> =>
  ({ props }) => {
    const s = sceneSeconds(props.durations);
    return { durationInFrames: Math.ceil(ORDER.reduce((a, k) => a + s[k], 0) * FPS) };
  };

export const norm = (w: string) => w.toLowerCase().replace(/[^a-z-]/g, "");

/** Scene-local time (s) when the nth occurrence of `word` is spoken, slightly early. */
export const wordTime = (words: Word[]) => (word: string, nth = 0) => {
  let n = 0;
  for (const w of words) {
    if (norm(w.word) === word) {
      if (n === nth) return LEAD + w.start - 0.06;
      n++;
    }
  }
  throw new Error(`word not found: ${word} #${nth}`);
};
export type WordFn = ReturnType<typeof wordTime>;

/** Index of the nth occurrence of a word in a word list. */
export const wordIndex = (words: Word[], word: string, nth = 0) => {
  let n = 0;
  for (let i = 0; i < words.length; i++) {
    if (norm(words[i].word) === word) {
      if (n === nth) return i;
      n++;
    }
  }
  throw new Error(`word not found: ${word} #${nth}`);
};

// ---------------------------------------------------------------------------
// Layout and camera

/** Absolutely positioned element centred on (x, y). */
export const At: React.FC<{ x: number; y: number; children: React.ReactNode; style?: React.CSSProperties; anchor?: "center" | "bottom" }> = ({
  x,
  y,
  children,
  style,
  anchor = "center",
}) => (
  <div style={{ position: "absolute", left: x, top: y, transform: anchor === "center" ? "translate(-50%, -50%)" : "translate(-50%, -100%)", ...style }}>
    {children}
  </div>
);

/** Camera: scales/rotates the world around focus (fx, fy) and puts it at the screen centre. */
export const Camera: React.FC<{ fx: number; fy: number; s: number; r?: number; blur?: number; children: React.ReactNode }> = ({ fx, fy, s, r = 0, blur = 0, children }) => (
  <AbsoluteFill style={{ overflow: "hidden" }}>
    <div
      style={{
        position: "absolute",
        width: 1080,
        height: 1920,
        transformOrigin: `${fx}px ${fy}px`,
        transform: `translate(${540 - fx}px, ${960 - fy}px) scale(${s}) rotate(${r}deg)`,
        filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
      }}
    >
      {children}
    </div>
  </AbsoluteFill>
);

/** Whip transition in and out of a scene: slides along a direction with motion blur. */
export const Whip: React.FC<{ t: number; dur: number; dirIn: [number, number]; dirOut: [number, number]; children: React.ReactNode }> = ({
  t,
  dur,
  dirIn,
  dirOut,
  children,
}) => {
  const pin = prog(t, 0, 0.38);
  const pout = prog(t, dur - 0.3, dur, easeInOut);
  const dx = dirIn[0] * (1 - pin) * 1100 - dirOut[0] * pout * 1100;
  const dy = dirIn[1] * (1 - pin) * 1900 - dirOut[1] * pout * 1900;
  const blur = (1 - pin) * 26 + pout * 26;
  return (
    <AbsoluteFill style={{ transform: `translate(${dx}px, ${dy}px)`, filter: blur > 0.5 ? `blur(${blur}px)` : undefined }}>{children}</AbsoluteFill>
  );
};

export const Background: React.FC<{ t: number; progress: number }> = ({ t, progress }) => {
  const blobs = [0, 1, 2].map((i) => ({
    x: 540 + noise2D(`bx${i}`, t * 0.08, i) * 520,
    y: 960 + noise2D(`by${i}`, t * 0.07, i + 5) * 820,
    c: i === 1 ? "rgba(212,168,82,0.16)" : "rgba(76,110,214,0.35)",
  }));
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #2a4290 0%, #1b2d66 52%, #0e1940 100%)" }}>
      {blobs.map((b, i) => (
        <div key={i} style={{ position: "absolute", left: b.x - 500, top: b.y - 500, width: 1000, height: 1000, borderRadius: 999, background: `radial-gradient(circle, ${b.c} 0%, transparent 65%)` }} />
      ))}
      <StarPattern color={theme.line} gold={theme.gold} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(6,12,36,0.6) 100%)" }} />
      <div style={{ position: "absolute", top: 150, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 14, opacity: 0.8 }}>
        <BayanMark theme={theme} size={40} />
        <Latin theme={theme} size={22} />
        <span style={{ fontFamily: serif, fontSize: 24, color: theme.lineSoft, marginLeft: 6 }}>· askbayan.org</span>
      </div>
      <div style={{ position: "absolute", top: 210, left: 300, right: 300, height: 4, borderRadius: 2, background: "rgba(244,239,227,0.12)" }}>
        <div style={{ width: `${progress * 100}%`, height: "100%", borderRadius: 2, background: theme.gold }} />
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Text

/** TikTok-style captions: short chunks pop in, the spoken word turns gold. */
export const Captions: React.FC<{ t: number; words: Word[]; y?: number; until?: number }> = ({ t, words, y = 1600, until = Infinity }) => {
  const chunks: Word[][] = [];
  let cur: Word[] = [];
  for (const w of words) {
    cur.push(w);
    if (cur.length >= 4 || (/[,.;:"”]$/.test(w.word) && cur.length >= 2)) {
      chunks.push(cur);
      cur = [];
    }
  }
  if (cur.length) chunks.push(cur);
  const lt = t - LEAD;
  const idx = chunks.findIndex((c, i) => lt >= c[0].start - 0.08 && (i === chunks.length - 1 || lt < chunks[i + 1][0].start - 0.08));
  if (idx < 0 || t > until) return null;
  const chunk = chunks[idx];
  const pop = springy(lt, chunk[0].start - 0.08, 3.2, 9);
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: y, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          transform: `scale(${0.82 + 0.18 * pop})`,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          columnGap: 24,
          padding: "14px 30px",
          borderRadius: 24,
          background: "rgba(10,18,48,0.72)",
          boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
        }}
      >
        {chunk.map((w, i) => {
          const on = lt >= w.start - 0.05;
          // Only the most recently started word is gold (overlapping timings never light two).
          const next = chunk[i + 1];
          const hot = on && lt < w.end + 0.05 && !(next && lt >= next.start - 0.05);
          return (
            <span
              key={i}
              style={{
                fontFamily: sans,
                fontWeight: 800,
                fontSize: 54,
                textTransform: "uppercase",
                color: hot ? theme.gold : on ? "#fff" : "rgba(255,255,255,0.45)",
                transform: `scale(${hot ? 1.05 : 1})`,
                display: "inline-block",
              }}
            >
              {w.word.replace(/["“”]/g, "")}
            </span>
          );
        })}
      </div>
    </div>
  );
};

/** Arabic line (the scholar's original words) that wipes in right-to-left. */
export const ArabicLine: React.FC<{ t: number; text: string; from: number; to: number; y: number; size?: number; color?: string }> = ({
  t,
  text,
  from,
  to,
  y,
  size = 56,
  color = theme.gold,
}) => {
  const p = prog(t, from, from + 0.7);
  const out = prog(t, to - 0.25, to);
  if (t < from || t > to) return null;
  return (
    <div
      lang="ar"
      dir="rtl"
      style={{
        position: "absolute",
        left: 50,
        right: 50,
        top: y,
        textAlign: "center",
        fontFamily: amiri,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1.6,
        color,
        textShadow: "0 4px 20px rgba(0,0,0,0.5)",
        textWrap: "balance",
        clipPath: `inset(0 0 0 ${(1 - p) * 100}%)`,
        opacity: 1 - out,
      }}
    >
      {text}
    </div>
  );
};

export const KaraokeLine: React.FC<{ t: number; words: Word[]; show: number; size: number; color: string; hot: string }> = ({ t, words, show, size, color, hot }) => {
  const lt = t - LEAD;
  const p = prog(t, show, show + 0.5);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 14, opacity: p, transform: `translateY(${(1 - p) * 20}px)` }}>
      {words.map((w, i) => {
        const on = lt >= w.start - 0.05 && lt < w.end + 0.1;
        const said = lt >= w.start - 0.05;
        return (
          <span key={i} style={{ fontFamily: serif, fontWeight: 500, fontSize: size, color: on ? hot : said ? color : "rgba(27,45,102,0.55)", display: "inline-block", transform: `translateY(${on ? -4 : 0}px)` }}>
            {w.word}
          </span>
        );
      })}
    </div>
  );
};

export const reveal = (p: number): React.CSSProperties => ({ opacity: p, transform: `translateY(${(1 - p) * 24}px)` });

// ---------------------------------------------------------------------------
// Scene 2 (shared): the hadith on an unrolling scroll, Arabic and English together.

export const ScrollBox: React.FC<{ open: number; children: React.ReactNode }> = ({ open, children }) => {
  const width = 960;
  const height = 1060;
  const w = Math.max(open * width, 1);
  return (
    <div style={{ position: "relative", width, height }}>
      <div
        style={{
          position: "absolute",
          left: (width - w) / 2,
          top: 24,
          width: w,
          height: height - 48,
          background: "linear-gradient(180deg, #fbf3df 0%, #f0e0bb 100%)",
          boxShadow: "0 40px 90px rgba(0,0,0,0.45), inset 0 0 70px rgba(167,123,43,0.28)",
          borderTop: `6px solid ${theme.gold}`,
          borderBottom: `6px solid ${theme.gold}`,
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", left: (w - width) / 2, top: 0, width, height: height - 48 }}>{children}</div>
      </div>
      {[-1, 1].map((side) => (
        <div
          key={side}
          style={{
            position: "absolute",
            top: 0,
            left: width / 2 + (side * w) / 2 - 24,
            width: 48,
            height,
            borderRadius: 24,
            background: "linear-gradient(90deg, #5a3a1e, #b7863a 45%, #4d3119)",
            boxShadow: "0 12px 30px rgba(0,0,0,0.45)",
          }}
        />
      ))}
    </div>
  );
};

/** Where each spoken line of the hadith starts (word + occurrence) and the word that triggers the stamp. */
export type HadithLayout = {
  narrator: string;
  stamp: string;
  arabic: [string, string];
  line1: [string, number];
  line2: [string, number];
  stampWord: string;
  arabicSize?: number;
  englishSize?: number;
  contentTop?: number; // where the Arabic/English block starts inside the scroll (default 270)
  stampBottom?: number; // stamp distance from the scroll bottom (default 70)
};

export const HadithScroll: React.FC<{ t: number; dur: number; W: WordFn; words: Word[]; h: HadithLayout }> = ({ t, dur, W, words, h }) => {
  const t1 = W(h.line1[0], h.line1[1]);
  const t2 = W(h.line2[0], h.line2[1]);
  const open = prog(t, 0.3, 1.2, easeInOut);
  const s = keys(t, [
    [0, 0.92],
    [1.2, 1.0],
    [dur, 1.1],
  ]);
  const fy = keys(t, [
    [0, 960],
    [t2, 1000],
    [dur, 1060],
  ]);
  const head = prog(t, 0.9, 1.4);
  const i0 = wordIndex(words, h.line1[0], h.line1[1]);
  const i1 = wordIndex(words, h.line2[0], h.line2[1]);
  const i2 = wordIndex(words, h.stampWord);
  const a1 = prog(t, t1, t1 + 0.9);
  const a2 = prog(t, t2, t2 + 0.9);
  const stampT = W(h.stampWord);
  const st = prog(t, stampT, stampT + 0.18, easeInOut);
  const [sx, sy] = shake(t, stampT + 0.18, 16);
  const ar = h.arabicSize ?? 100;
  const en = h.englishSize ?? 56;

  return (
    <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px)` }}>
      <Camera fx={540} fy={fy} s={s}>
        <At x={540} y={1010}>
          <div style={{ position: "relative" }}>
            <ScrollBox open={open}>
              <div style={{ position: "absolute", top: 90, left: 0, right: 0, textAlign: "center", opacity: head }}>
                <div style={{ fontFamily: serifItalic, fontSize: 58, color: "#1b2d66" }}>The Prophet ﷺ said:</div>
                <div style={{ fontFamily: serif, fontSize: 24, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8a6a3a", marginTop: 8 }}>{h.narrator}</div>
              </div>
              <div style={{ position: "absolute", top: h.contentTop ?? 270, left: 40, right: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <div lang="ar" dir="rtl" style={{ fontFamily: amiri, fontWeight: 700, fontSize: ar, lineHeight: 1.55, color: "#8a5a12", textAlign: "center", textWrap: "balance", clipPath: `inset(0 0 0 ${(1 - a1) * 100}%)` }}>
                  {h.arabic[0]}
                </div>
                <KaraokeLine t={t} words={words.slice(i0, i1)} show={t1} size={en} color="#1b2d66" hot="#b07a16" />
                <div style={{ height: h.contentTop !== undefined && h.contentTop < 270 ? 24 : 44 }} />
                <div lang="ar" dir="rtl" style={{ fontFamily: amiri, fontWeight: 700, fontSize: ar, lineHeight: 1.55, color: "#8a5a12", textAlign: "center", textWrap: "balance", clipPath: `inset(0 0 0 ${(1 - a2) * 100}%)` }}>
                  {h.arabic[1]}
                </div>
                <KaraokeLine t={t} words={words.slice(i1, i2)} show={t2} size={en} color="#1b2d66" hot="#b07a16" />
              </div>
            </ScrollBox>
            {t >= stampT ? (
              <div style={{ position: "absolute", right: 40, bottom: h.stampBottom ?? 70, transform: `rotate(-9deg) scale(${lerp(2.6, 1, st)})`, opacity: st }}>
                <Stamp text={h.stamp} sub="SAHIH" font={serif} />
              </div>
            ) : null}
          </div>
        </At>
      </Camera>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 5 (shared): the fixed ending.

export const Close: React.FC<{ t: number; dur: number; W: WordFn }> = ({ t, dur, W }) => {
  const flash = prog(t, 0, 0.35) * (1 - prog(t, 0.35, 0.8));
  const draw = prog(t, 0.2, 1.1);
  const fillP = prog(t, 0.9, 1.4, easeInOut);
  const centre = springy(t, 1.2, 2.4, 6);
  const rays = prog(t, 1.4, 1.9);
  const share = springy(t, W("share"), 2.6, 6);
  const brand = prog(t, W("deeds"), W("deeds") + 0.6);
  const out = prog(t, dur - 0.35, dur);
  const s = keys(t, [
    [0, 1.25],
    [1.4, 1],
    [dur, 1.05],
  ], ease);
  return (
    <AbsoluteFill style={{ opacity: 1 - out }}>
      <Camera fx={540} fy={960} s={s}>
        <At x={540} y={625}>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
              <Rays size={460} spin={t * 18} opacity={rays * 0.5} />
            </div>
            <BayanMark theme={theme} size={340} progress={{ draw, fill: fillP, centre, rays }} />
          </div>
        </At>
        <At x={540} y={985} style={{ opacity: brand, transform: `translate(-50%, -50%) translateY(${(1 - brand) * 30}px)` }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <ArabicName theme={theme} size={110} />
            <Latin theme={theme} size={44} />
            <div style={{ marginTop: 22, padding: "10px 34px", borderRadius: 999, border: `2px solid ${theme.gold}`, background: "rgba(15,26,69,0.7)", fontFamily: sans, fontWeight: 800, fontSize: 44, color: "#fff", letterSpacing: "0.02em" }}>
              askbayan<span style={{ color: theme.gold }}>.org</span>
            </div>
          </div>
        </At>
        {/* On-screen ending: "Share it" + Sahih Muslim 1893 (the voice keeps its own closing line). */}
        <At x={540} y={1250} anchor="center">
          {/* The words are centred on the screen; the arrow hangs off to the right. */}
          <div style={{ position: "relative", transform: `scale(${share})` }}>
            <span style={{ fontFamily: sans, fontWeight: 800, fontSize: 66, color: theme.gold, letterSpacing: "0.02em", whiteSpace: "nowrap" }}>SHARE IT</span>
            <svg width={84} height={70} viewBox="-60 -50 120 100" style={{ position: "absolute", left: "100%", top: "50%", marginLeft: 18, transform: `translate(${Math.sin(t * 6) * 8}px, -50%)` }}>
              <path d="M -40 30 Q -30 -20 20 -20 L 20 -42 L 56 -6 L 20 30 L 20 8 Q -14 8 -40 30 Z" fill={theme.gold} />
            </svg>
          </div>
        </At>
        <At x={540} y={1490}>
          <div style={{ width: 920, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{ ...reveal(prog(t, W("share") + 0.35, W("share") + 0.9)), fontFamily: serifItalic, fontSize: 38, color: theme.lineSoft }}>The Prophet ﷺ said:</div>
            <div lang="ar" dir="rtl" style={{ ...reveal(prog(t, W("share") + 0.6, W("share") + 1.2)), fontFamily: amiri, fontWeight: 700, fontSize: 58, lineHeight: 1.5, color: theme.gold }}>
              مَنْ دَلَّ عَلَى خَيْرٍ فَلَهُ مِثْلُ أَجْرِ فَاعِلِهِ
            </div>
            <div style={{ ...reveal(prog(t, W("share") + 0.8, W("share") + 1.4)), fontFamily: serif, fontSize: 46, lineHeight: 1.3, color: theme.text, textAlign: "center", textWrap: "balance" }}>
              “One who guides to something good has a reward similar to that of its doer.”
            </div>
            <div style={{ ...reveal(prog(t, W("share") + 1.1, W("share") + 1.6)), marginTop: 8, fontFamily: serif, fontSize: 28, color: theme.gold, border: `2px solid ${theme.gold}`, borderRadius: 999, padding: "5px 22px" }}>
              Sahih Muslim 1893
            </div>
          </div>
        </At>
      </Camera>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 40%, rgba(255,240,200,1) 0%, rgba(212,168,82,0.8) 30%, transparent 70%)", opacity: flash }} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Sound cues and the scene runner

export type Cue = { at: number; sfx: string; vol: number };
export type AddCue = (scene: SceneKey, at: number, sfx: string, vol?: number) => void;

/** Cues every reel shares: transitions, the scroll scene and the ending. */
const sharedCues = (p: ReelBase, add: AddCue, h: HadithLayout) => {
  add("hook", 0, "whoosh", 0.35);
  for (const k of ["hadith", "explain1", "explain2"] as SceneKey[]) add(k, -0.25, "whip", 0.4);
  add("close", -0.3, "rise", 0.35);
  const d = wordTime(p.words.hadith);
  add("hadith", 0.3, "paper", 0.35);
  add("hadith", d(h.line1[0], h.line1[1]), "scratch", 0.22);
  add("hadith", d(h.line2[0], h.line2[1]), "scratch", 0.22);
  add("hadith", d(h.stampWord) + 0.15, "stamp", 0.55);
  const g = wordTime(p.words.close);
  add("close", g("share"), "pop", 0.35);
  add("close", g("deeds"), "chime", 0.4);
};

export type SceneProps = { t: number; dur: number; W: WordFn; words: Word[] };

/** Renders a whole reel: background, the active scene with whip transitions, voice and sound effects. */
export const ReelRunner: React.FC<{
  p: ReelBase;
  hadith: HadithLayout;
  scenes: { hook: React.FC<SceneProps>; explain1: React.FC<SceneProps>; explain2: React.FC<SceneProps> };
  cues: (add: AddCue) => void;
}> = ({ p, hadith, scenes, cues }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const T = frame / fps;
  const sec = sceneSeconds(p.durations);
  const starts = {} as Record<SceneKey, number>;
  let acc = 0;
  for (const k of ORDER) {
    starts[k] = acc;
    acc += sec[k];
  }
  const f = (s: number) => Math.round(s * fps);
  const list: Cue[] = [];
  const add: AddCue = (scene, at, sfx, vol = 0.35) => list.push({ at: starts[scene] + at, sfx, vol });
  sharedCues(p, add, hadith);
  cues(add);

  const active = ORDER.find((k) => T >= starts[k] && T < starts[k] + sec[k]) ?? "close";
  const t = T - starts[active];
  const dur = sec[active];
  const W = wordTime(p.words[active]);
  const words = p.words[active];
  const dirs: Record<SceneKey, { in: [number, number]; out: [number, number] }> = {
    hook: { in: [0, 0], out: [0, 1] },
    hadith: { in: [0, 1], out: [1, 0] },
    explain1: { in: [1, 0], out: [1, 0] },
    explain2: { in: [1, 0], out: [0, 0] },
    close: { in: [0, 0], out: [0, 0] },
  };
  const Hook = scenes.hook;
  const E1 = scenes.explain1;
  const E2 = scenes.explain2;

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      <Background t={T} progress={frame / durationInFrames} />
      <Whip t={t} dur={dur} dirIn={dirs[active].in} dirOut={dirs[active].out}>
        {active === "hook" ? <Hook t={t} dur={dur} W={W} words={words} /> : null}
        {active === "hadith" ? <HadithScroll t={t} dur={dur} W={W} words={words} h={hadith} /> : null}
        {active === "explain1" ? <E1 t={t} dur={dur} W={W} words={words} /> : null}
        {active === "explain2" ? <E2 t={t} dur={dur} W={W} words={words} /> : null}
        {active === "close" ? <Close t={t} dur={dur} W={W} /> : null}
      </Whip>
      {ORDER.map((k) => (
        <Sequence key={k} from={f(starts[k] + LEAD)} name={`voice ${k}`} layout="none">
          <Html5Audio src={staticFile(`vo/${p.id}-${p.lang}-${k}.wav`)} />
        </Sequence>
      ))}
      {list.map((c, i) => (
        <Sequence key={i} from={Math.max(0, f(c.at))} name={`sfx ${c.sfx}`} layout="none">
          <Html5Audio src={staticFile(`sfx/${c.sfx}.wav`)} volume={c.vol} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
