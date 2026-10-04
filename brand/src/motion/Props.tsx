import React from "react";
import { dark as theme } from "../theme";

// Flat vector props for the motion videos. All drawn around their own centre
// unless noted, sized in px.

const GOLD = theme.gold;
const CREAM = theme.line;
const LAPIS = "#1b2d66";

export const Coin: React.FC<{ size?: number }> = ({ size = 34 }) => (
  <svg width={size} height={size} viewBox="-20 -20 40 40" style={{ overflow: "visible", transform: "translate(-50%, -50%)", position: "absolute" }}>
    <circle r={18} fill={GOLD} stroke="#a77b2b" strokeWidth={3} />
    <circle r={11} fill="none" stroke="#f6dc9b" strokeWidth={2} />
  </svg>
);

/** Same coin, as a plain SVG group (for use inside another SVG). */
export const CoinG: React.FC<{ r?: number }> = ({ r = 18 }) => (
  <g>
    <circle r={r} fill={GOLD} stroke="#a77b2b" strokeWidth={3} />
    <circle r={r * 0.6} fill="none" stroke="#f6dc9b" strokeWidth={2} />
  </g>
);

export const Heart: React.FC<{ size: number; color: string; glow: number }> = ({ size, color, glow }) => (
  <svg width={size} height={size} viewBox="-60 -60 120 120" style={{ overflow: "visible" }}>
    <circle r={58} fill={color} opacity={0.18 * glow} />
    <circle r={40} fill={color} opacity={0.28 * glow} />
    <path d="M 0 14 C -26 -4 -24 -24 -10 -24 C -4 -24 0 -18 0 -14 C 0 -18 4 -24 10 -24 C 24 -24 26 -4 0 14 Z" fill={color} transform="scale(1.6)" />
  </svg>
);

export const Star: React.FC<{ size: number; color?: string }> = ({ size, color = GOLD }) => (
  <svg width={size} height={size} viewBox="-12 -12 24 24" style={{ overflow: "visible" }}>
    <path d="M0 -11 L3 -3.5 L11 -3.4 L4.8 1.6 L7 9.5 L0 5 L-7 9.5 L-4.8 1.6 L-11 -3.4 L-3 -3.5 Z" fill={color} />
  </svg>
);

/** Rays behind something important. `spin` in degrees. */
export const Rays: React.FC<{ size: number; spin: number; opacity: number; color?: string }> = ({ size, spin, opacity, color = GOLD }) => (
  <svg width={size} height={size} viewBox="-100 -100 200 200" style={{ opacity }}>
    <g transform={`rotate(${spin})`}>
      {Array.from({ length: 16 }, (_, i) => (
        <path key={i} d="M -5 -30 L 0 -100 L 5 -30 Z" fill={color} opacity={i % 2 ? 0.35 : 0.6} transform={`rotate(${i * 22.5})`} />
      ))}
    </g>
  </svg>
);

export const Masjid: React.FC<{ width: number; color?: string; accent?: string }> = ({ width, color = "#2c4596", accent = GOLD }) => (
  <svg width={width} height={width * 0.9} viewBox="-150 -270 300 270" style={{ overflow: "visible" }}>
    {/* Minarets */}
    {[-120, 120].map((x) => (
      <g key={x}>
        <rect x={x - 12} y={-230} width={24} height={230} fill={color} />
        <rect x={x - 17} y={-170} width={34} height={10} fill={accent} />
        <path d={`M ${x - 14} -230 Q ${x} -262 ${x + 14} -230 Z`} fill={color} />
        <line x1={x} y1={-262} x2={x} y2={-276} stroke={accent} strokeWidth={3} />
      </g>
    ))}
    {/* Hall and dome */}
    <rect x={-90} y={-110} width={180} height={110} fill={color} />
    <path d="M -70 -110 Q -70 -200 0 -210 Q 70 -200 70 -110 Z" fill={color} />
    <path d="M -70 -110 Q -70 -200 0 -210 Q 70 -200 70 -110" fill="none" stroke={accent} strokeWidth={3} opacity={0.6} />
    <circle cx={0} cy={-222} r={6} fill={accent} />
    <path d="M -22 0 L -22 -50 Q 0 -78 22 -50 L 22 0 Z" fill={accent} opacity={0.85} />
    {[-62, 62].map((x) => (
      <path key={x} d={`M ${x - 10} -40 L ${x - 10} -64 Q ${x} -78 ${x + 10} -64 L ${x + 10} -40 Z`} fill={accent} opacity={0.55} />
    ))}
  </svg>
);

export const Building: React.FC<{ w: number; h: number; color: string; windows?: string }> = ({ w, h, color, windows = "rgba(244,239,227,0.18)" }) => (
  <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
    <rect width={w} height={h} rx={6} fill={color} />
    {Array.from({ length: Math.floor((h - 30) / 46) }, (_, r) =>
      Array.from({ length: Math.floor((w - 20) / 40) }, (_, c) => (
        <rect key={`${r}-${c}`} x={18 + c * 40} y={24 + r * 46} width={18} height={24} rx={3} fill={windows} />
      )),
    )}
  </svg>
);

/** Rolled scroll; `open` 0..1 unrolls it horizontally from the centre. */
export const Scroll: React.FC<{ width: number; height: number; open: number; children?: React.ReactNode }> = ({ width, height, open, children }) => {
  const w = Math.max(open * width, 0.001);
  return (
    <div style={{ position: "relative", width, height, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          position: "relative",
          width: w,
          height: height - 40,
          marginTop: 20,
          background: "linear-gradient(180deg, #fbf3df 0%, #f2e4c2 100%)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.35), inset 0 0 60px rgba(167,123,43,0.25)",
          overflow: "hidden",
          borderTop: `6px solid ${GOLD}`,
          borderBottom: `6px solid ${GOLD}`,
        }}
      >
        <div style={{ position: "absolute", left: (w - width) / 2, top: 0, width, height: height - 40 }}>{children}</div>
      </div>
      {[-1, 1].map((side) => (
        <div
          key={side}
          style={{
            position: "absolute",
            top: 0,
            left: width / 2 + (side * w) / 2 - 22,
            width: 44,
            height,
            borderRadius: 22,
            background: "linear-gradient(90deg, #6b4423, #a77b2b 45%, #5a3a1e)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
          }}
        />
      ))}
    </div>
  );
};

export const Bubble: React.FC<{ width: number; text: string; tail?: "left" | "right"; thought?: boolean; font: string; size?: number }> = ({
  width,
  text,
  tail = "left",
  thought,
  font,
  size = 40,
}) => (
  <div style={{ position: "relative", width }}>
    <div
      style={{
        background: "#ffffff",
        color: "#151c33",
        borderRadius: thought ? 999 : 36,
        padding: thought ? "34px 46px" : "26px 34px",
        fontFamily: font,
        fontSize: size,
        lineHeight: 1.2,
        textAlign: "center",
        border: "5px solid #151c33",
        boxShadow: "0 18px 40px rgba(0,0,0,0.3)",
      }}
    >
      {text}
    </div>
    {thought ? (
      <>
        <div style={{ position: "absolute", width: 34, height: 34, borderRadius: 99, background: "#fff", border: "5px solid #151c33", bottom: -40, [tail]: 70 }} />
        <div style={{ position: "absolute", width: 20, height: 20, borderRadius: 99, background: "#fff", border: "4px solid #151c33", bottom: -70, [tail]: 52 }} />
      </>
    ) : (
      <svg width={60} height={46} style={{ position: "absolute", bottom: -40, [tail]: 60, transform: tail === "right" ? "scaleX(-1)" : undefined }}>
        <path d="M 4 0 L 40 0 L 6 42 Z" fill="#fff" stroke="#151c33" strokeWidth={5} strokeLinejoin="round" />
        <rect x={6} y={-4} width={34} height={8} fill="#fff" />
      </svg>
    )}
  </div>
);

export const Stamp: React.FC<{ text: string; sub?: string; font: string }> = ({ text, sub, font }) => (
  <div
    style={{
      border: "6px solid #b3261e",
      borderRadius: 16,
      padding: "10px 26px",
      color: "#b3261e",
      fontFamily: font,
      fontWeight: 500,
      fontSize: 40,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      textAlign: "center",
      background: "rgba(255,255,255,0.15)",
      boxShadow: "inset 0 0 0 3px rgba(179,38,30,0.35)",
    }}
  >
    {text}
    {sub ? <div style={{ fontSize: 26, letterSpacing: "0.2em" }}>{sub}</div> : null}
  </div>
);

/** Open book that fills with a golden glow; `fill` 0..1. */
export const DeedsBook: React.FC<{ width: number; fill: number; label: string; font: string }> = ({ width, fill, label, font }) => (
  <div style={{ position: "relative", width, display: "flex", flexDirection: "column", alignItems: "center" }}>
    <svg width={width} height={width * 0.62} viewBox="-160 -100 320 200" style={{ overflow: "visible" }}>
      <circle r={150 * (0.6 + fill * 0.5)} fill={GOLD} opacity={0.15 + fill * 0.2} />
      <path d="M 0 -70 Q -80 -95 -150 -72 L -150 84 Q -80 62 0 86 Z" fill="#fbf3df" stroke={GOLD} strokeWidth={5} />
      <path d="M 0 -70 Q 80 -95 150 -72 L 150 84 Q 80 62 0 86 Z" fill="#f2e4c2" stroke={GOLD} strokeWidth={5} />
      <line x1={0} y1={-70} x2={0} y2={86} stroke="#a77b2b" strokeWidth={4} />
      {/* Lines of writing that appear as it fills */}
      {Array.from({ length: 6 }, (_, i) => (
        <React.Fragment key={i}>
          <line x1={-130} y1={-44 + i * 20} x2={-130 + 104 * Math.min(1, Math.max(0, fill * 6 - i))} y2={-44 + i * 20} stroke="#8a6a3a" strokeWidth={5} strokeLinecap="round" />
          <line x1={22} y1={-44 + i * 20} x2={22 + 104 * Math.min(1, Math.max(0, fill * 6 - i - 0.5))} y2={-44 + i * 20} stroke="#8a6a3a" strokeWidth={5} strokeLinecap="round" />
        </React.Fragment>
      ))}
    </svg>
    <div style={{ fontFamily: font, fontSize: 30, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, marginTop: 6 }}>{label}</div>
  </div>
);

export const Bed: React.FC<{ width: number; children?: React.ReactNode }> = ({ width, children }) => (
  <div style={{ position: "relative", width, height: width * 0.55 }}>
    <svg width={width} height={width * 0.55} viewBox="0 0 400 220" style={{ position: "absolute", inset: 0 }}>
      <rect x={14} y={60} width={26} height={160} rx={8} fill="#6b4423" />
      <rect x={360} y={110} width={26} height={110} rx={8} fill="#6b4423" />
      <rect x={30} y={140} width={344} height={44} rx={10} fill="#8a5a2b" />
      <rect x={44} y={112} width={86} height={38} rx={18} fill="#ffffff" />
    </svg>
    {children}
    <svg width={width} height={width * 0.55} viewBox="0 0 400 220" style={{ position: "absolute", inset: 0 }}>
      <path d="M 110 132 Q 230 96 368 128 L 368 160 L 104 160 Z" fill="#5f79c4" />
      <path d="M 110 132 Q 230 96 368 128" fill="none" stroke="#7f98dd" strokeWidth={8} />
    </svg>
  </div>
);

/** Faceless head resting on a pillow, for the bed scene (bed viewBox 0 0 400 220). */
export const LyingMan: React.FC<{ width: number; breath: number }> = ({ width, breath }) => (
  <svg width={width} height={width * 0.55} viewBox="0 0 400 220" style={{ position: "absolute", inset: 0 }}>
    {/* Body bump under where the blanket will go */}
    <path d={`M 120 140 Q 240 ${92 - breath * 4} 368 124 L 368 150 L 120 150 Z`} fill="#f6f3ec" />
    <g transform="translate(92 104) rotate(-80)">
      <ellipse cx={0} cy={0} rx={30} ry={34} fill="#b88660" />
      <path d="M -30 -6 Q -31 26 -14 36 Q 0 42 14 36 Q 31 26 30 -6 Q 20 18 0 19 Q -20 18 -30 -6 Z" fill="#2a211d" />
      <path d="M -31 -10 Q -30 -40 0 -42 Q 30 -40 31 -10 Q 0 -18 -31 -10 Z" fill="#ffffff" />
    </g>
  </svg>
);

export const Suitcase: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="-50 -60 100 110" style={{ overflow: "visible" }}>
    <path d="M -16 -40 L -16 -54 Q -16 -58 -12 -58 L 12 -58 Q 16 -58 16 -54 L 16 -40" fill="none" stroke="#3b2f2a" strokeWidth={6} />
    <rect x={-40} y={-42} width={80} height={86} rx={12} fill="#c9733a" />
    <rect x={-40} y={-10} width={80} height={8} fill="#a85a26" />
    <circle cx={-26} cy={48} r={6} fill="#3b2f2a" />
    <circle cx={26} cy={48} r={6} fill="#3b2f2a" />
  </svg>
);

export const Thermometer: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="-20 -50 40 100">
    <rect x={-7} y={-44} width={14} height={70} rx={7} fill="#fff" stroke="#151c33" strokeWidth={3} />
    <rect x={-3} y={-20} width={6} height={44} fill="#d33" />
    <circle cy={30} r={13} fill="#d33" stroke="#151c33" strokeWidth={3} />
  </svg>
);

export const RoadSign: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size * 1.4} viewBox="-60 -70 120 170" style={{ overflow: "visible" }}>
    <rect x={-5} y={0} width={10} height={100} fill="#d9d3c6" />
    <path d="M 0 -66 L 58 34 L -58 34 Z" fill="#f2b632" stroke="#151c33" strokeWidth={6} strokeLinejoin="round" />
    <rect x={-5} y={-30} width={10} height={36} rx={5} fill="#151c33" />
    <circle cy={18} r={6} fill="#151c33" />
  </svg>
);

/** Icons for acts of worship: prayer mat, Kaaba (Hajj), crescent (fasting), coin (charity). */
export const WorshipIcon: React.FC<{ kind: "mat" | "kaaba" | "moon" | "coin"; size: number }> = ({ kind, size }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size,
      background: "rgba(244,239,227,0.1)",
      border: `3px solid ${GOLD}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 0 30px rgba(212,168,82,0.35)",
    }}
  >
    <svg width={size * 0.6} height={size * 0.6} viewBox="-30 -30 60 60">
      {kind === "mat" ? (
        <g>
          <rect x={-16} y={-26} width={32} height={52} rx={3} fill="#2f8f6b" />
          <path d="M -10 -14 Q 0 -26 10 -14 L 10 -6 L -10 -6 Z" fill={GOLD} />
          <rect x={-12} y={14} width={24} height={4} fill={GOLD} />
        </g>
      ) : kind === "kaaba" ? (
        <g>
          <path d="M -22 -12 L 0 -22 L 22 -12 L 22 18 L 0 26 L -22 18 Z" fill="#111" />
          <path d="M -22 -6 L 0 2 L 22 -6" stroke={GOLD} strokeWidth={4} fill="none" />
          <path d="M 0 2 L 0 26" stroke="#333" strokeWidth={2} />
        </g>
      ) : kind === "moon" ? (
        <path d="M 8 -22 A 24 24 0 1 0 8 22 A 18 18 0 1 1 8 -22 Z" fill={GOLD} />
      ) : (
        <CoinG r={20} />
      )}
    </svg>
  </div>
);

export const NameCard: React.FC<{ kicker: string; name: string; font: string; arabicFont: string }> = ({ kicker, name, font, arabicFont }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 22,
      padding: "18px 34px 18px 22px",
      borderRadius: 26,
      background: "rgba(15,26,69,0.82)",
      border: `2px solid ${GOLD}`,
      boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
    }}
  >
    <svg width={74} height={74} viewBox="-30 -30 60 60">
      <circle r={29} fill={GOLD} />
      <path d="M 0 -12 Q -10 -18 -20 -14 L -20 14 Q -10 10 0 16 Q 10 10 20 14 L 20 -14 Q 10 -18 0 -12 Z" fill={LAPIS} />
      <line x1={0} y1={-12} x2={0} y2={16} stroke={GOLD} strokeWidth={2} />
    </svg>
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontFamily: font, fontSize: 24, letterSpacing: "0.24em", textTransform: "uppercase", color: GOLD }}>{kicker}</div>
      <div style={{ fontFamily: font, fontWeight: 500, fontSize: 40, color: CREAM, whiteSpace: "nowrap" }}>
        {name} <span style={{ fontFamily: arabicFont, fontSize: 30, color: theme.lineSoft }}>رحمه الله</span>
      </div>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Props added for video 02 (anger)

/** Puff of steam; `p` 0..1 is its life (rises, grows, fades). */
export const Steam: React.FC<{ size: number; p: number; color?: string }> = ({ size, p, color = "#f4efe3" }) => (
  <svg width={size} height={size} viewBox="-50 -50 100 100" style={{ overflow: "visible", opacity: Math.sin(Math.min(Math.max(p, 0), 1) * Math.PI) * 0.9 }}>
    <g transform={`scale(${0.5 + p * 0.9})`}>
      <circle cx={-14} cy={6} r={20} fill={color} />
      <circle cx={10} cy={-4} r={24} fill={color} />
      <circle cx={18} cy={14} r={16} fill={color} />
    </g>
  </svg>
);

/** Angry speech bubble with scribbled swearing marks. */
export const ScribbleBubble: React.FC<{ width: number; tail?: "left" | "right" }> = ({ width, tail = "left" }) => (
  <svg width={width} height={width * 0.62} viewBox="0 0 260 160" style={{ overflow: "visible" }}>
    <path
      d="M 20 20 L 60 8 L 100 22 L 140 6 L 180 20 L 230 10 L 248 50 L 236 90 L 250 120 L 200 128 L 150 140 L 110 126 L 70 140 L 30 126 L 12 90 L 22 56 Z"
      fill="#fff"
      stroke="#151c33"
      strokeWidth={6}
      strokeLinejoin="round"
    />
    <path d={tail === "left" ? "M 60 132 L 40 172 L 96 134" : "M 200 132 L 220 172 L 164 134"} fill="#fff" stroke="#151c33" strokeWidth={6} strokeLinejoin="round" />
    <text x={130} y={92} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight={800} fontSize={56} fill="#d3302a">
      #@!%
    </text>
  </svg>
);

/** Vertical anger meter, `level` 0..1. */
export const AngerMeter: React.FC<{ height: number; level: number }> = ({ height, level }) => {
  const h = 200;
  const fillH = 150 * Math.min(Math.max(level, 0), 1);
  const color = level > 0.6 ? "#e0322b" : level > 0.3 ? "#f2a33a" : "#3fb58a";
  return (
    <svg width={height * 0.36} height={height} viewBox="-36 -10 72 230">
      <rect x={-18} y={0} width={36} height={170} rx={18} fill="#fff" stroke="#151c33" strokeWidth={5} />
      <rect x={-9} y={160 - fillH} width={18} height={fillH + 12} rx={9} fill={color} />
      <circle cy={h - 14} r={26} fill={color} stroke="#151c33" strokeWidth={5} />
      {[40, 80, 120].map((y) => (
        <line key={y} x1={18} y1={y} x2={30} y2={y} stroke="#151c33" strokeWidth={4} />
      ))}
    </svg>
  );
};

export const Barbell: React.FC<{ width: number }> = ({ width }) => (
  <svg width={width} height={width * 0.3} viewBox="-200 -60 400 120">
    <rect x={-190} y={-6} width={380} height={12} rx={6} fill="#9aa3b8" />
    {[-1, 1].map((s) => (
      <g key={s}>
        <rect x={s * 150 - 22} y={-52} width={44} height={104} rx={10} fill="#151c33" />
        <rect x={s * 115 - 14} y={-40} width={28} height={80} rx={8} fill="#2c3550" />
      </g>
    ))}
  </svg>
);

/** Small faceless cheering figure for crowds. */
export const CrowdFigure: React.FC<{ size: number; color: string; arm: number }> = ({ size, color, arm }) => (
  <svg width={size * 0.6} height={size} viewBox="-30 -100 60 100" style={{ overflow: "visible" }}>
    <path d="M -18 0 L -16 -56 Q 0 -64 16 -56 L 18 0 Z" fill={color} />
    <circle cy={-72} r={14} fill="#a87952" />
    <path d="M -14 -76 Q 0 -94 14 -76 Z" fill="#e9ecf3" />
    <line x1={-14} y1={-54} x2={-26} y2={-54 - 26 * arm} stroke={color} strokeWidth={8} strokeLinecap="round" />
    <line x1={14} y1={-54} x2={26} y2={-54 - 26 * arm} stroke={color} strokeWidth={8} strokeLinecap="round" />
  </svg>
);

export const Door: React.FC<{ size: number; open: number }> = ({ size, open }) => (
  <svg width={size} height={size * 1.5} viewBox="-60 -180 120 180" style={{ overflow: "visible" }}>
    <rect x={-50} y={-172} width={100} height={172} rx={6} fill="#f2d39a" />
    <rect x={-44} y={-166} width={88} height={166} fill="#0e1940" />
    <g transform={`translate(-44 0) scale(${1 - open * 0.75} 1)`}>
      <rect x={0} y={-166} width={88} height={166} fill="#8a5a2b" stroke="#5a3a1e" strokeWidth={4} />
      <circle cx={74} cy={-84} r={6} fill={GOLD} />
    </g>
  </svg>
);

/** Water tap with falling drops; `t` drives the drops. */
export const Tap: React.FC<{ size: number; t: number }> = ({ size, t }) => (
  <svg width={size} height={size * 1.4} viewBox="-60 -60 120 170" style={{ overflow: "visible" }}>
    <rect x={-50} y={-50} width={70} height={26} rx={8} fill="#c9ced9" />
    <rect x={8} y={-46} width={18} height={50} rx={8} fill="#c9ced9" />
    <rect x={-30} y={-62} width={24} height={14} rx={5} fill="#9aa3b8" />
    {[0, 1, 2, 3].map((i) => {
      const p = (t * 1.6 + i / 4) % 1;
      return <path key={i} d="M 0 -8 Q 7 4 0 10 Q -7 4 0 -8 Z" transform={`translate(17 ${10 + p * 90}) scale(1.4)`} fill="#7fc4f0" opacity={1 - p * 0.6} />;
    })}
  </svg>
);

/** Open Quran (green cover, gold pages edge) glowing softly. */
export const Quran: React.FC<{ width: number; glow: number }> = ({ width, glow }) => (
  <svg width={width} height={width * 0.7} viewBox="-150 -110 300 210" style={{ overflow: "visible" }}>
    <circle r={130} fill={GOLD} opacity={0.18 * glow} />
    <path d="M 0 -60 Q -70 -90 -136 -64 L -136 76 Q -70 54 0 80 Q 70 54 136 76 L 136 -64 Q 70 -90 0 -60 Z" fill="#1f6b52" />
    <path d="M 0 -56 Q -64 -82 -124 -60 L -124 66 Q -64 46 0 70 Z" fill="#fbf3df" />
    <path d="M 0 -56 Q 64 -82 124 -60 L 124 66 Q 64 46 0 70 Z" fill="#f2e4c2" />
    {Array.from({ length: 5 }, (_, i) => (
      <React.Fragment key={i}>
        <line x1={-108} y1={-34 + i * 20} x2={-18} y2={-30 + i * 20} stroke="#8a6a3a" strokeWidth={4} strokeLinecap="round" />
        <line x1={18} y1={-30 + i * 20} x2={108} y2={-34 + i * 20} stroke="#8a6a3a" strokeWidth={4} strokeLinecap="round" />
      </React.Fragment>
    ))}
    <line x1={0} y1={-60} x2={0} y2={80} stroke="#a77b2b" strokeWidth={4} />
  </svg>
);

/** Raised open hand in a red circle: "wait / stop". */
export const WaitHand: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="-60 -60 120 120">
    <circle r={56} fill="#d3302a" stroke="#fff" strokeWidth={6} />
    <g fill="#fff">
      <rect x={-26} y={-30} width={11} height={40} rx={5.5} />
      <rect x={-12} y={-40} width={11} height={50} rx={5.5} />
      <rect x={2} y={-38} width={11} height={48} rx={5.5} />
      <rect x={16} y={-28} width={11} height={38} rx={5.5} />
      <path d="M -27 0 L 27 0 L 27 18 Q 24 38 0 38 Q -24 38 -27 18 Z" />
      <rect x={-40} y={-4} width={11} height={30} rx={5.5} transform="rotate(-30 -34 10)" />
    </g>
  </svg>
);

export const Check: React.FC<{ size: number; p: number }> = ({ size, p }) => (
  <svg width={size} height={size} viewBox="-30 -30 60 60">
    <circle r={27} fill={GOLD} />
    <path d="M -13 1 L -3 11 L 14 -9" stroke="#1b2d66" strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
  </svg>
);
