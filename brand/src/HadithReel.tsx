import React from "react";
import {
  AbsoluteFill,
  Easing,
  Html5Audio,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  type CalculateMetadataFunction,
} from "remotion";
import { loadFont as loadAmiri } from "@remotion/google-fonts/Amiri";
import { loadFont as loadNewsreader } from "@remotion/google-fonts/Newsreader";
import { BayanMark } from "./BayanMark";
import { Arabic, Latin } from "./Wordmark";
import { StarPattern } from "./StarPattern";
import { dark as theme } from "./theme";

const { fontFamily: amiri } = loadAmiri("normal", {
  weights: ["400", "700"],
  subsets: ["arabic"],
});
const { fontFamily: serif } = loadNewsreader("normal", {
  weights: ["400", "500"],
  subsets: ["latin", "latin-ext"],
});
const { fontFamily: serifItalic } = loadNewsreader("italic", {
  weights: ["400"],
  subsets: ["latin", "latin-ext"],
});

// A teaching reel: hook, the hadith (Arabic and meaning together), scholar
// explanations, closing. Every scene lasts as long as its voiceover clip
// (public/vo/<id>-<lang>-<scene>.wav, made by voiceover/generate.mjs).

export type Segment = {
  ar: string;
  tr: string;
  at: number; // when it appears, as a fraction of the scene's voice (0..1)
  cited?: string; // shown when the segment is a hadith the scholar cites
};

export type Explanation = {
  kicker: string; // "Explanation"
  scholar: string; // "Shaykh Abdul-Aziz ibn Baz"
  link: string; // shown on screen, full link goes in the caption
  segments: Segment[];
};

export type HadithReelProps = {
  id: string;
  lang: "en" | "de";
  durations: Record<
    "hook" | "hadith" | "explain1" | "explain2" | "close",
    number
  >;
  hook: string;
  intro: string;
  narrator: string;
  arabicLines: string[];
  translation: string[];
  source: string;
  grade: string;
  explain: [Explanation, Explanation];
  closeLine: string;
  tagline: string;
};

const FPS = 30;
const LEAD = 0.35; // seconds of motion before the voice starts
const TAIL = 0.75; // seconds after the voice ends
const OUTRO_HOLD = 2.2; // logo stays after the last words

const sceneSeconds = (d: HadithReelProps["durations"]) => ({
  hook: LEAD + d.hook + 0.45,
  hadith: LEAD + d.hadith + TAIL + 0.6,
  explain1: LEAD + d.explain1 + TAIL,
  explain2: LEAD + d.explain2 + TAIL + 0.4,
  close: LEAD + d.close + OUTRO_HOLD,
});

export const calculateHadithMetadata: CalculateMetadataFunction<
  HadithReelProps
> = ({ props }) => {
  const s = sceneSeconds(props.durations);
  const total = Object.values(s).reduce((a, b) => a + b, 0);
  return { durationInFrames: Math.ceil(total * FPS) };
};

const ease = Easing.bezier(0.16, 1, 0.3, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const useReveal = (start: number, rise = 30): React.CSSProperties => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = interpolate(frame, [start * fps, (start + 0.8) * fps], [0, 1], {
    ...clamp,
    easing: ease,
  });
  return {
    opacity: t,
    transform: `translateY(${(1 - t) * rise}px)`,
    filter: `blur(${(1 - t) * 8}px)`,
  };
};

// Fade a whole scene in and out so cuts feel soft.
const SceneFade: React.FC<{ seconds: number; children: React.ReactNode }> = ({
  seconds,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const end = seconds * fps;
  const opacity = interpolate(
    frame,
    [0, 0.3 * fps, end - 0.35 * fps, end],
    [0, 1, 1, 0],
    clamp,
  );
  return (
    <AbsoluteFill
      style={{
        opacity,
        alignItems: "center",
        justifyContent: "center",
        padding: "0 72px",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const GoldRule: React.FC<{ width: number; at: number }> = ({ width, at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = interpolate(frame, [at * fps, (at + 0.9) * fps], [0, 1], {
    ...clamp,
    easing: ease,
  });
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        justifyContent: "center",
        height: 16,
        opacity: t > 0 ? 1 : 0,
      }}
    >
      <div
        style={{
          width: (width / 2) * t,
          height: 2,
          background: `linear-gradient(to left, ${theme.gold}, transparent)`,
        }}
      />
      <div
        style={{
          width: 11,
          height: 11,
          transform: `rotate(45deg) scale(${t})`,
          background: theme.gold,
        }}
      />
      <div
        style={{
          width: (width / 2) * t,
          height: 2,
          background: `linear-gradient(to right, ${theme.gold}, transparent)`,
        }}
      />
    </div>
  );
};

const Kicker: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <div
    style={{
      fontFamily: serif,
      fontSize: 27,
      letterSpacing: "0.22em",
      textTransform: "uppercase",
      color: theme.lineSoft,
      textAlign: "center",
      ...style,
    }}
  >
    {children}
  </div>
);

const Pill: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <div
    style={{
      fontFamily: serif,
      fontSize: 32,
      color: theme.gold,
      border: `2px solid ${theme.gold}`,
      borderRadius: 999,
      padding: "8px 30px",
      ...style,
    }}
  >
    {children}
  </div>
);

// Arabic words fade in quickly one after another, all within ~1 s.
const ArabicReveal: React.FC<{
  text: string;
  at: number;
  size: number;
  glow?: boolean;
}> = ({ text, at, size, glow }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // A "|" in the text forces a line break (avoids a lone word on the last line).
  const rows = text.split("|").map((r) => r.trim().split(" "));
  const total = rows.reduce((n, r) => n + r.length, 0);
  const step = Math.min(0.09, 0.9 / total);
  const pulse = 0.5 + 0.5 * Math.sin(frame / 20);
  let i = 0;
  return (
    <>
      {rows.map((words, ri) => (
        <div
          key={ri}
          lang="ar"
          dir="rtl"
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            columnGap: size * 0.26,
          }}
        >
          {words.map((w) => {
            const wi = i++;
            const t0 = (at + wi * step) * fps;
            const t = interpolate(frame, [t0, t0 + 0.6 * fps], [0, 1], {
              ...clamp,
              easing: ease,
            });
            const pop = spring({
              frame: frame - t0,
              fps,
              config: { damping: 14, stiffness: 110 },
            });
            return (
              <span
                key={wi}
                style={{
                  fontFamily: amiri,
                  fontWeight: 700,
                  fontSize: size,
                  lineHeight: 1.7,
                  color: theme.gold,
                  opacity: t,
                  filter: `blur(${(1 - t) * 8}px)`,
                  transform: `scale(${0.88 + 0.12 * pop})`,
                  textShadow: glow
                    ? `0 0 ${22 + pulse * 16}px rgba(212,168,82,${0.35 * t})`
                    : undefined,
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
      ))}
    </>
  );
};

const Background: React.FC<{ progress: number }> = ({ progress }) => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(ellipse at 50% 40%, #2c4596 0%, #1b2d66 50%, #0f1a45 100%)",
    }}
  >
    <StarPattern color={theme.line} gold={theme.gold} />
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(6,12,36,0.55) 100%)",
      }}
    />
    {/* Brand tag and progress line, inside the top safe area. */}
    <div
      style={{
        position: "absolute",
        top: 150,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 14,
        opacity: 0.75,
      }}
    >
      <BayanMark theme={theme} size={40} />
      <Latin theme={theme} size={22} />
    </div>
    <div
      style={{
        position: "absolute",
        top: 212,
        left: 300,
        right: 300,
        height: 3,
        borderRadius: 2,
        background: "rgba(244,239,227,0.12)",
      }}
    >
      <div
        style={{
          width: `${progress * 100}%`,
          height: "100%",
          borderRadius: 2,
          background: theme.gold,
        }}
      />
    </div>
  </AbsoluteFill>
);

const Hook: React.FC<{ text: string; seconds: number }> = ({
  text,
  seconds,
}) => {
  const style = useReveal(0.05, 40);
  return (
    <SceneFade seconds={seconds}>
      <div
        style={{
          ...style,
          fontFamily: serif,
          fontSize: 88,
          lineHeight: 1.18,
          color: theme.text,
          textAlign: "center",
          padding: "0 30px",
          textWrap: "balance",
        }}
      >
        {text}
      </div>
    </SceneFade>
  );
};

// The hadith: Arabic and meaning appear together.
const Hadith: React.FC<{ p: HadithReelProps; seconds: number }> = ({
  p,
  seconds,
}) => {
  const head = useReveal(0.05);
  const at = LEAD + p.durations.hadith * 0.18;
  const tr = useReveal(at + 0.15, 20);
  const src = useReveal(LEAD + p.durations.hadith * 0.84, 16);
  return (
    <SceneFade seconds={seconds}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 26,
        }}
      >
        <div
          style={{
            ...head,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{ fontFamily: serifItalic, fontSize: 52, color: theme.text }}
          >
            {p.intro}
          </div>
          <Kicker>{p.narrator}</Kicker>
        </div>
        <GoldRule width={420} at={0.4} />
        <div style={{ margin: "6px 0" }}>
          {p.arabicLines.map((line, i) => (
            <ArabicReveal
              key={i}
              text={line}
              at={at + i * 0.25}
              size={96}
              glow
            />
          ))}
        </div>
        <div
          style={{
            ...tr,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          {p.translation.map((line, i) => (
            <div
              key={i}
              style={{
                fontFamily: serif,
                fontSize: 48,
                lineHeight: 1.3,
                color: theme.text,
                textAlign: "center",
              }}
            >
              {line}
            </div>
          ))}
        </div>
        <Pill style={{ ...src, marginTop: 24 }}>
          {p.source} · {p.grade}
        </Pill>
      </div>
    </SceneFade>
  );
};

// One scholar explanation; each segment shows its Arabic and translation together.
const Explain: React.FC<{ e: Explanation; voice: number; seconds: number }> = ({
  e,
  voice,
  seconds,
}) => {
  const head = useReveal(0.05);
  const link = useReveal(0.6, 10);
  return (
    <SceneFade seconds={seconds}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 22,
          width: "100%",
        }}
      >
        <div
          style={{
            ...head,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Kicker style={{ color: theme.gold }}>{e.kicker}</Kicker>
          <div
            style={{
              fontFamily: serif,
              fontWeight: 500,
              fontSize: 50,
              color: theme.text,
              textAlign: "center",
            }}
          >
            {e.scholar}
          </div>
          <div
            lang="ar"
            dir="rtl"
            style={{ fontFamily: amiri, fontSize: 34, color: theme.lineSoft }}
          >
            رحمه الله
          </div>
        </div>
        <GoldRule width={380} at={0.4} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 34,
            marginTop: 10,
            width: "100%",
          }}
        >
          {e.segments.map((s, i) => (
            <SegmentBlock key={i} s={s} at={LEAD + voice * s.at} />
          ))}
        </div>
        <div
          style={{
            ...link,
            fontFamily: serif,
            fontSize: 28,
            color: theme.lineSoft,
            marginTop: 20,
            letterSpacing: "0.04em",
          }}
        >
          {e.link}
        </div>
      </div>
    </SceneFade>
  );
};

const SegmentBlock: React.FC<{ s: Segment; at: number }> = ({ s, at }) => {
  const tr = useReveal(at + 0.1, 18);
  const box = useReveal(at - 0.05, 0);
  const inner = (
    <>
      <ArabicReveal text={s.ar} at={at} size={s.cited ? 50 : 58} />
      <div
        style={{
          ...tr,
          fontFamily: s.cited ? serif : serifItalic,
          fontSize: s.cited ? 38 : 44,
          lineHeight: 1.32,
          color: theme.text,
          textAlign: "center",
          marginTop: 4,
          textWrap: "balance",
        }}
      >
        {s.tr}
      </div>
    </>
  );
  if (!s.cited)
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {inner}
      </div>
    );
  return (
    <div
      style={{
        ...box,
        border: `2px solid rgba(212,168,82,0.55)`,
        borderRadius: 26,
        background: "rgba(15,26,69,0.55)",
        padding: "26px 34px 30px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {inner}
      <Pill style={{ ...tr, fontSize: 26, padding: "6px 22px", marginTop: 18 }}>
        {s.cited}
      </Pill>
    </div>
  );
};

const Close: React.FC<{ line: string; tagline: string; seconds: number }> = ({
  line,
  tagline,
  seconds,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = (sec: number) => sec * fps;
  const draw = interpolate(frame, [s(0.05), s(1.0)], [0, 1], {
    ...clamp,
    easing: ease,
  });
  const fill = interpolate(frame, [s(0.7), s(1.2)], [0, 1], clamp);
  const centre = spring({
    frame: frame - s(1.0),
    fps,
    config: { damping: 12, stiffness: 120 },
  });
  const rays = interpolate(frame, [s(1.2), s(1.6)], [0, 1], {
    ...clamp,
    easing: ease,
  });
  const words = useReveal(0.1, 20);
  const brand = useReveal(1.1, 16);
  const tag = useReveal(1.5, 12);
  const end = seconds * fps;
  const out = interpolate(frame, [end - 0.25 * fps, end], [1, 0], clamp);
  return (
    <AbsoluteFill
      style={{ alignItems: "center", justifyContent: "center", opacity: out }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
        }}
      >
        <div
          style={{
            ...words,
            fontFamily: serifItalic,
            fontSize: 56,
            color: theme.text,
            textAlign: "center",
            padding: "0 80px",
            marginBottom: 40,
            textWrap: "balance",
          }}
        >
          {line}
        </div>
        <BayanMark
          theme={theme}
          size={300}
          progress={{ draw, fill, centre, rays }}
        />
        <div style={brand}>
          <Arabic theme={theme} size={104} />
        </div>
        <div style={brand}>
          <Latin theme={theme} size={42} />
        </div>
        <div
          style={{
            ...tag,
            fontFamily: serif,
            fontSize: 34,
            color: theme.lineSoft,
            marginTop: 10,
          }}
        >
          {tagline}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const HadithReel: React.FC<HadithReelProps> = (p) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const sec = sceneSeconds(p.durations);
  const order = ["hook", "hadith", "explain1", "explain2", "close"] as const;
  const starts: Record<string, number> = {};
  let t = 0;
  for (const k of order) {
    starts[k] = t;
    t += sec[k];
  }
  const f = (s: number) => Math.round(s * fps);
  const vo = (scene: string) => staticFile(`vo/${p.id}-${p.lang}-${scene}.wav`);

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      <Background progress={frame / durationInFrames} />
      {order.map((k) => (
        <Sequence
          key={k}
          from={f(starts[k])}
          durationInFrames={f(sec[k])}
          name={k}
        >
          <Sequence from={f(LEAD)} name={`voice ${k}`} layout="none">
            <Html5Audio src={vo(k)} />
          </Sequence>
          {k === "hook" ? <Hook text={p.hook} seconds={sec.hook} /> : null}
          {k === "hadith" ? <Hadith p={p} seconds={sec.hadith} /> : null}
          {k === "explain1" ? (
            <Explain
              e={p.explain[0]}
              voice={p.durations.explain1}
              seconds={sec.explain1}
            />
          ) : null}
          {k === "explain2" ? (
            <Explain
              e={p.explain[1]}
              voice={p.durations.explain2}
              seconds={sec.explain2}
            />
          ) : null}
          {k === "close" ? (
            <Close line={p.closeLine} tagline={p.tagline} seconds={sec.close} />
          ) : null}
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
