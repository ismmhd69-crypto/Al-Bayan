import React from "react";
import { dark as theme } from "../theme";

// Props added for videos 04 to 06 (Turkish). Flat style, brand colours.
const GOLD = theme.gold;

/**
 * Faceless mother: long dress, headscarf over head and shoulders, plain face oval
 * (no eyes or mouth). Origin is between the feet like Man; height ~480 units.
 * `armUp` 0..1 lifts her right hand (a blessing/welcome gesture).
 */
export const MotherFigure: React.FC<{ size?: number; glow?: number; armUp?: number; bob?: number; dress?: string; scarf?: string }> = ({
  size = 480,
  glow = 0,
  armUp = 0,
  bob = 0,
  dress = "#6a5a8e",
  scarf = "#f2ece2",
}) => {
  const H = 500;
  const a = -armUp * 70; // shoulder rotation for the raised hand
  return (
    <svg width={size * 0.7} height={size} viewBox={`-175 ${-H + 10} 350 ${H}`} style={{ overflow: "visible" }}>
      {glow > 0 ? <circle cx={0} cy={-260} r={210} fill={GOLD} opacity={0.16 * glow} /> : null}
      <g transform={`translate(0 ${-bob})`}>
        {/* Feet just visible under the dress */}
        <ellipse cx={-22} cy={-8} rx={22} ry={9} fill="#3b2f2a" />
        <ellipse cx={22} cy={-8} rx={22} ry={9} fill="#3b2f2a" />
        {/* Long dress */}
        <path d="M -62 -330 Q 0 -346 62 -330 L 86 -120 Q 96 -40 98 -12 Q 0 0 -98 -12 Q -96 -40 -86 -120 Z" fill={dress} />
        <path d="M 34 -250 Q 46 -130 52 -20" stroke="rgba(0,0,0,0.12)" strokeWidth={4} fill="none" />
        {/* Left hand resting */}
        <circle cx={-70} cy={-170} r={15} fill="#b88660" />
        {/* Right arm (sleeve + hand), can lift */}
        <g transform={`translate(58 -300) rotate(${a})`}>
          <rect x={-17} y={-6} width={34} height={150} rx={17} fill={dress} />
          <circle cx={0} cy={152} r={15} fill="#b88660" />
        </g>
        {/* Headscarf: covers head, neck and shoulders */}
        <path d="M -86 -250 Q -92 -330 -60 -390 Q -40 -446 0 -448 Q 40 -446 60 -390 Q 92 -330 86 -250 Q 0 -230 -86 -250 Z" fill={scarf} />
        {/* Face oval (faceless) */}
        <ellipse cx={0} cy={-378} rx={30} ry={38} fill="#c99a72" />
        {/* Scarf rim framing the face */}
        <path d="M -36 -396 Q -40 -430 0 -432 Q 40 -430 36 -396 Q 34 -356 0 -338 Q -34 -356 -36 -396 Z" fill="none" stroke={scarf} strokeWidth={8} />
      </g>
    </svg>
  );
};

export const GiftBox: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="-50 -55 100 100">
    <rect x={-40} y={-20} width={80} height={60} rx={6} fill="#c9733a" />
    <rect x={-46} y={-34} width={92} height={18} rx={5} fill="#e08a4c" />
    <rect x={-7} y={-34} width={14} height={74} fill={GOLD} />
    <path d="M 0 -34 Q -26 -60 -30 -40 Q -26 -30 0 -34 Q 26 -30 30 -40 Q 26 -60 0 -34 Z" fill={GOLD} />
  </svg>
);

/** Balance scale; tilt in degrees (positive = right pan goes down). */
export const Balance: React.FC<{ width: number; tilt: number; left?: React.ReactNode; right?: React.ReactNode }> = ({ width, tilt, left, right }) => {
  const r = (tilt * Math.PI) / 180;
  const arm = 150;
  const ly = -Math.sin(r) * arm;
  const ry = Math.sin(r) * arm;
  return (
    <div style={{ position: "relative", width, height: width * 0.8 }}>
      <svg width={width} height={width * 0.8} viewBox="-200 -170 400 320" style={{ position: "absolute", inset: 0 }}>
        <rect x={-8} y={-120} width={16} height={240} rx={6} fill={GOLD} />
        <rect x={-70} y={112} width={140} height={18} rx={9} fill={GOLD} />
        <circle cx={0} cy={-124} r={14} fill={GOLD} />
        <line x1={-arm * Math.cos(r)} y1={-124 + ly} x2={arm * Math.cos(r)} y2={-124 + ry} stroke={GOLD} strokeWidth={10} strokeLinecap="round" />
        {[-1, 1].map((side) => {
          const x = side * arm * Math.cos(r);
          const y = -124 + (side < 0 ? ly : ry);
          return (
            <g key={side}>
              <line x1={x} y1={y} x2={x - 46} y2={y + 70} stroke={GOLD} strokeWidth={3} />
              <line x1={x} y1={y} x2={x + 46} y2={y + 70} stroke={GOLD} strokeWidth={3} />
              <path d={`M ${x - 56} ${y + 70} Q ${x} ${y + 104} ${x + 56} ${y + 70} Z`} fill={GOLD} />
            </g>
          );
        })}
      </svg>
      {[
        { node: left, side: -1, dy: ly },
        { node: right, side: 1, dy: ry },
      ].map(({ node, side, dy }, i) =>
        node ? (
          <div key={i} style={{ position: "absolute", left: width / 2 + side * (arm * Math.cos(r)) * (width / 400) , top: ((-124 + dy + 70 + 170) / 320) * width * 0.8, transform: "translate(-50%, -100%)" }}>
            {node}
          </div>
        ) : null,
      )}
    </div>
  );
};

/** Soft glowing orb of light (knowledge passed on). */
export const LightOrb: React.FC<{ size: number; intensity?: number }> = ({ size, intensity = 1 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: 999,
      background: `radial-gradient(circle, rgba(255,247,220,${intensity}) 0%, rgba(212,168,82,${0.85 * intensity}) 35%, rgba(212,168,82,0) 70%)`,
    }}
  />
);

/** One brick of the "one building"; `p` 0..1 drops it into place. */
export const Brick: React.FC<{ w: number; h: number; color?: string }> = ({ w, h, color = "#c98e4a" }) => (
  <div style={{ width: w, height: h, borderRadius: 6, background: color, boxShadow: "inset 0 -6px 0 rgba(0,0,0,0.18), 0 6px 14px rgba(0,0,0,0.25)" }} />
);

/** Points of a standing human outline, normalised to -1..1 (x) and 0..1 (y, 0 = top). Used to arrange people into "one body". */
export const BODY_POINTS: [number, number][] = (() => {
  const pts: [number, number][] = [];
  // head ring
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    pts.push([Math.cos(a) * 0.16, 0.09 + Math.sin(a) * 0.08]);
  }
  // shoulders and arms
  for (let i = 0; i <= 6; i++) {
    const t = i / 6;
    pts.push([-0.22 - t * 0.5, 0.24 + t * 0.32]);
    pts.push([0.22 + t * 0.5, 0.24 + t * 0.32]);
  }
  // torso
  for (let i = 0; i <= 5; i++) {
    const t = i / 5;
    pts.push([-0.24, 0.24 + t * 0.34]);
    pts.push([0.24, 0.24 + t * 0.34]);
    pts.push([0, 0.26 + t * 0.32]);
  }
  // legs
  for (let i = 0; i <= 6; i++) {
    const t = i / 6;
    pts.push([-0.14 - t * 0.06, 0.6 + t * 0.38]);
    pts.push([0.14 + t * 0.06, 0.6 + t * 0.38]);
  }
  return pts;
})();

// ---------------------------------------------------------------------------
// Props added for videos 07 to 21 (Turkish series 2).

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Tree that grows from a sprout; origin is the base of the trunk (bottom centre),
 * height ~ size. `grow` 0..1 builds trunk then canopy; `fruit` 0..1 shows fruits.
 */
export const Tree: React.FC<{ size: number; grow: number; fruit?: number; palm?: boolean; glow?: number }> = ({ size, grow, fruit = 0, palm = false, glow = 0 }) => {
  const g1 = clamp01(grow / 0.45);
  const g2 = clamp01((grow - 0.35) / 0.65);
  const trunkH = 40 + 200 * g1;
  const fruits = [
    [-60, -300],
    [40, -330],
    [80, -260],
    [-20, -250],
    [-90, -240],
    [10, -380],
  ];
  return (
    <svg width={size * 0.8} height={size} viewBox="-160 -400 320 400" style={{ overflow: "visible" }}>
      {glow > 0 ? <circle cx={0} cy={-280} r={170} fill={GOLD} opacity={0.18 * glow} /> : null}
      <ellipse cx={0} cy={-4} rx={70} ry={12} fill="#5a3a1e" opacity={0.8} />
      {palm ? (
        <>
          <path d={`M -6 0 Q -14 ${-trunkH * 0.5} 6 ${-trunkH * 1.35} L 18 ${-trunkH * 1.35} Q 6 ${-trunkH * 0.5} 10 0 Z`} fill="#8a5a2b" />
          {[-150, -110, -60, -20, 30, 80].map((a, i) => (
            <path
              key={i}
              d="M 0 0 Q 50 -30 110 10 Q 50 -10 0 0 Z"
              transform={`translate(12 ${-trunkH * 1.35}) rotate(${a + 40}) scale(${g2})`}
              fill={i % 2 ? "#2f8f6b" : "#3ba57c"}
            />
          ))}
          {g2 > 0.5
            ? [-14, 4, 20].map((x, i) => <circle key={i} cx={12 + x} cy={-trunkH * 1.35 + 18} r={9 * fruit} fill="#b0612a" />)
            : null}
        </>
      ) : (
        <>
          <path d={`M -12 0 L -8 ${-trunkH} L 8 ${-trunkH} L 12 0 Z`} fill="#8a5a2b" />
          <path d={`M -4 ${-trunkH * 0.6} L -40 ${-trunkH * 0.85}`} stroke="#8a5a2b" strokeWidth={8 * g1} strokeLinecap="round" />
          <path d={`M 4 ${-trunkH * 0.7} L 44 ${-trunkH * 0.95}`} stroke="#8a5a2b" strokeWidth={8 * g1} strokeLinecap="round" />
          <g transform={`translate(0 ${-trunkH - 40}) scale(${g2})`}>
            <circle cx={-70} cy={20} r={70} fill="#2f8f6b" />
            <circle cx={70} cy={20} r={70} fill="#2f8f6b" />
            <circle cx={0} cy={-40} r={90} fill="#3ba57c" />
            <circle cx={-30} cy={30} r={70} fill="#3ba57c" />
            <circle cx={40} cy={40} r={60} fill="#34996f" />
          </g>
          {grow >= 1 && fruit > 0
            ? fruits.map(([x, y], i) => <circle key={i} cx={x} cy={y + (240 - trunkH)} r={14 * clamp01(fruit * 6 - i)} fill="#e0322b" stroke="#a51f19" strokeWidth={3} />)
            : null}
        </>
      )}
      {grow < 0.12 ? <path d="M 0 -4 Q -10 -30 -26 -34 Q -12 -20 0 -4 Q 10 -34 26 -38 Q 12 -18 0 -4 Z" fill="#3ba57c" transform={`scale(${grow / 0.12})`} /> : null}
    </svg>
  );
};

/** Wheat stalk; origin bottom centre; `grow` 0..1. */
export const Wheat: React.FC<{ size: number; grow: number; sway?: number }> = ({ size, grow, sway = 0 }) => {
  const h = 30 + 170 * clamp01(grow);
  return (
    <svg width={size * 0.4} height={size} viewBox="-40 -220 80 220" style={{ overflow: "visible" }}>
      <g transform={`rotate(${sway} 0 0)`}>
        <path d={`M 0 0 Q 4 ${-h / 2} 0 ${-h}`} stroke="#c9a24a" strokeWidth={5} fill="none" />
        {grow > 0.6
          ? Array.from({ length: 5 }, (_, i) => (
              <React.Fragment key={i}>
                <ellipse cx={-7} cy={-h + 10 + i * 13} rx={6} ry={11} fill={GOLD} transform={`rotate(-25 -7 ${-h + 10 + i * 13})`} />
                <ellipse cx={7} cy={-h + 16 + i * 13} rx={6} ry={11} fill={GOLD} transform={`rotate(25 7 ${-h + 16 + i * 13})`} />
              </React.Fragment>
            ))
          : null}
        <path d={`M 0 ${-h * 0.4} Q -24 ${-h * 0.5} -30 ${-h * 0.7}`} stroke="#5f9a4a" strokeWidth={4} fill="none" />
      </g>
    </svg>
  );
};

/** Flat side-view animal (sheep or dog); origin bottom centre, facing right. `pant` 0..1 opens the mouth. */
export const Animal: React.FC<{ size: number; kind: "sheep" | "dog"; walk?: number; pant?: number; color?: string }> = ({ size, kind, walk = 0, pant = 0, color }) => {
  const leg = (i: number) => Math.sin(walk * 8 + i * Math.PI) * 10;
  const body = color ?? (kind === "sheep" ? "#f2ece2" : "#c9a06a");
  return (
    <svg width={size * 1.4} height={size} viewBox="-140 -200 280 200" style={{ overflow: "visible" }}>
      {[-60, -30, 40, 70].map((x, i) => (
        <rect key={i} x={x - 8} y={-70} width={16} height={70} rx={7} fill={kind === "sheep" ? "#3b2f2a" : "#a57e4f"} transform={`rotate(${leg(i)} ${x} -70)`} />
      ))}
      {kind === "sheep" ? (
        <>
          {[-60, -20, 20, 60, -40, 0, 40].map((x, i) => (
            <circle key={i} cx={x} cy={i < 4 ? -100 : -135} r={38} fill={body} />
          ))}
          <ellipse cx={100} cy={-130} rx={30} ry={24} fill="#3b2f2a" />
        </>
      ) : (
        <>
          <ellipse cx={0} cy={-95} rx={95} ry={38} fill={body} />
          <path d="M -90 -100 Q -130 -130 -120 -160" stroke={body} strokeWidth={12} fill="none" strokeLinecap="round" />
          <ellipse cx={100} cy={-130} rx={40} ry={30} fill={body} />
          <ellipse cx={136} cy={-122} rx={22} ry={14} fill={body} />
          <path d="M 84 -150 Q 76 -180 96 -170 Z" fill="#8a6440" />
          <circle cx={156} cy={-126} r={6} fill="#2a211d" />
          {pant > 0 ? <ellipse cx={146} cy={-104} rx={9} ry={14 * pant} fill="#e0707a" /> : null}
        </>
      )}
    </svg>
  );
};

/** Stone well seen from the front; origin bottom centre. */
export const Well: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size * 0.9} viewBox="-100 -180 200 180" style={{ overflow: "visible" }}>
    <rect x={-8} y={-176} width={10} height={110} fill="#8a5a2b" />
    <rect x={-92} y={-176} width={10} height={110} fill="#8a5a2b" transform="translate(170 0)" />
    <rect x={-90} y={-184} width={186} height={14} rx={6} fill="#a8742f" />
    <ellipse cx={0} cy={-80} rx={90} ry={18} fill="#2a2f45" />
    <path d="M -90 -80 L -90 0 L 90 0 L 90 -80 Q 0 -60 -90 -80 Z" fill="#9c8a72" />
    {[-70, -20, 30].map((x, i) => (
      <rect key={i} x={x} y={-56 + (i % 2) * 24} width={44} height={20} rx={4} fill="#b5a385" />
    ))}
    <ellipse cx={0} cy={-80} rx={90} ry={18} fill="none" stroke="#b5a385" strokeWidth={8} />
  </svg>
);

/** Leather sock (khuff/mest); `water` 0..1 shows it filled. Centre origin. */
export const Mest: React.FC<{ size: number; water?: number }> = ({ size, water = 0 }) => (
  <svg width={size} height={size} viewBox="-50 -50 100 100" style={{ overflow: "visible" }}>
    <path d="M -18 -44 L 14 -44 L 16 10 Q 44 12 46 30 Q 46 42 30 42 L -18 42 Q -24 0 -18 -44 Z" fill="#7a4a24" stroke="#5a3418" strokeWidth={3} />
    {water > 0 ? <ellipse cx={-2} cy={-44} rx={16} ry={5} fill="#7fc4f0" /> : null}
    {water > 0 ? [0, 1].map((i) => <path key={i} d="M 0 -8 Q 7 4 0 10 Q -7 4 0 -8 Z" transform={`translate(${-10 + i * 16} ${-56 - i * 6}) scale(${water})`} fill="#7fc4f0" />) : null}
  </svg>
);

/** Thorny branch lying flat; centre origin. */
export const ThornBranch: React.FC<{ size: number; color?: string }> = ({ size, color = "#6b4a2b" }) => (
  <svg width={size} height={size * 0.4} viewBox="-120 -48 240 96" style={{ overflow: "visible" }}>
    <path d="M -110 10 Q -40 -10 20 4 Q 70 14 110 -6" stroke={color} strokeWidth={10} fill="none" strokeLinecap="round" />
    <path d="M -30 0 Q -10 -30 20 -36" stroke={color} strokeWidth={7} fill="none" strokeLinecap="round" />
    <path d="M 40 8 Q 60 30 84 34" stroke={color} strokeWidth={6} fill="none" strokeLinecap="round" />
    {[-96, -70, -44, -16, 12, 40, 66, 92, -4, 8].map((x, i) => (
      <path key={i} d={`M ${x} ${i > 7 ? -22 : 4 + (i % 2) * 2} l ${i % 2 ? 7 : -7} ${i % 2 ? -16 : 16}`} stroke="#3a2614" strokeWidth={4} strokeLinecap="round" />
    ))}
  </svg>
);

/** Road (flat band with dashes); top-left origin. */
export const Road: React.FC<{ w: number; h?: number; shift?: number }> = ({ w, h = 120, shift = 0 }) => (
  <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
    <rect width={w} height={h} rx={14} fill="#3d4560" />
    {Array.from({ length: Math.ceil(w / 120) + 1 }, (_, i) => (
      <rect key={i} x={((i * 120 - shift) % (w + 120)) - 60} y={h / 2 - 5} width={60} height={10} rx={5} fill="#c9ced9" opacity={0.7} />
    ))}
  </svg>
);

/** Side-view camel facing right; origin bottom centre. */
export const Camel: React.FC<{ size: number; walk?: number }> = ({ size, walk = 0 }) => {
  const leg = (i: number) => Math.sin(walk * 7 + i * Math.PI) * 8;
  return (
    <svg width={size * 1.2} height={size} viewBox="-150 -250 300 250" style={{ overflow: "visible" }}>
      {[-70, -40, 40, 70].map((x, i) => (
        <rect key={i} x={x - 8} y={-110} width={16} height={110} rx={7} fill="#a8742f" transform={`rotate(${leg(i)} ${x} -110)`} />
      ))}
      <path d="M -100 -110 Q -100 -170 -50 -175 Q -20 -230 10 -175 Q 40 -205 70 -170 Q 100 -150 100 -110 Z" fill="#c99a5a" />
      <path d="M 90 -130 Q 120 -170 118 -215" stroke="#c99a5a" strokeWidth={26} fill="none" strokeLinecap="round" />
      <ellipse cx={136} cy={-218} rx={30} ry={16} fill="#c99a5a" />
      <path d="M -100 -125 Q -125 -110 -122 -80" stroke="#a8742f" strokeWidth={6} fill="none" strokeLinecap="round" />
      <path d="M -30 -180 L 30 -180 L 24 -160 L -24 -160 Z" fill="#b3261e" />
    </svg>
  );
};

/** Sandal in side view with its strap (the "shoelace" of the hadith); `glow` lights the strap. Centre origin. */
export const Sandal: React.FC<{ size: number; glow?: number }> = ({ size, glow = 0 }) => (
  <svg width={size} height={size * 0.5} viewBox="-100 -50 200 100" style={{ overflow: "visible" }}>
    <path d="M -92 30 Q -96 14 -80 12 L 80 6 Q 98 8 96 24 Q 94 36 80 36 L -80 40 Q -90 40 -92 30 Z" fill="#8a5a2b" />
    <path d="M -86 16 L 86 10" stroke="#a8742f" strokeWidth={6} />
    {glow > 0 ? <path d="M -40 14 Q -10 -46 30 10" stroke={GOLD} strokeWidth={22} fill="none" opacity={0.35 * glow} strokeLinecap="round" /> : null}
    <path d="M -40 14 Q -10 -46 30 10" stroke={glow > 0.5 ? GOLD : "#5a3418"} strokeWidth={10} fill="none" strokeLinecap="round" />
    <path d="M -10 -22 L 46 12" stroke={glow > 0.5 ? GOLD : "#5a3418"} strokeWidth={8} strokeLinecap="round" />
  </svg>
);

/** Hourglass; `p` 0..1 is how much sand has fallen. Centre origin. */
export const Hourglass: React.FC<{ size: number; p: number; t?: number }> = ({ size, p, t = 0 }) => {
  const top = 1 - p;
  return (
    <svg width={size * 0.66} height={size} viewBox="-66 -100 132 200">
      <rect x={-62} y={-100} width={124} height={14} rx={6} fill="#a8742f" />
      <rect x={-62} y={86} width={124} height={14} rx={6} fill="#a8742f" />
      <path d="M -50 -86 Q -50 -20 -6 0 Q -50 20 -50 86 L 50 86 Q 50 20 6 0 Q 50 -20 50 -86 Z" fill="rgba(200,230,250,0.25)" stroke="#c9ced9" strokeWidth={4} />
      <path d={`M ${-44 * top} ${-12 - 60 * top} Q 0 ${-6 - 60 * top} ${44 * top} ${-12 - 60 * top} L 4 -4 L -4 -4 Z`} fill={GOLD} />
      <path d={`M -46 82 Q 0 ${82 - 70 * p} 46 82 Z`} fill={GOLD} />
      {p > 0 && p < 1 ? <line x1={0} y1={0} x2={0} y2={80} stroke={GOLD} strokeWidth={3} strokeDasharray="6 6" strokeDashoffset={-t * 60} /> : null}
    </svg>
  );
};
