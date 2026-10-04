import React from "react";

// Faceless rigged character in flat style: white thobe, kufi cap, dark beard
// shape, no eyes or mouth. Origin is between the feet; height about 480 units.
// Arms: `out` swings the arm away from the body (0 = hanging), `bend` folds the
// forearm towards the head. All angles in degrees.

export type ArmPose = { out: number; bend: number };
export type Pose = {
  left: ArmPose; // character's left = screen left in this front view
  right: ArmPose;
  lean: number; // body tilt
  headTilt: number;
  bob: number; // vertical bounce in units
  stepL: number; // foot lift -1..1 (walking)
  stepR: number;
};

export const POSES = {
  stand: { left: { out: 8, bend: 4 }, right: { out: 8, bend: 4 }, lean: 0, headTilt: 0, bob: 0, stepL: 0, stepR: 0 },
  give: { left: { out: 8, bend: 4 }, right: { out: 62, bend: 32 }, lean: 2, headTilt: 3, bob: 0, stepL: 0, stepR: 0 },
  takbir: { left: { out: 78, bend: 162 }, right: { out: 78, bend: 162 }, lean: 0, headTilt: 0, bob: 0, stepL: 0, stepR: 0 },
  point: { left: { out: 8, bend: 4 }, right: { out: 150, bend: 8 }, lean: -2, headTilt: -4, bob: 0, stepL: 0, stepR: 0 },
  think: { left: { out: 18, bend: 120 }, right: { out: 30, bend: 145 }, lean: 0, headTilt: 6, bob: 0, stepL: 0, stepR: 0 },
  carry: { left: { out: 8, bend: 4 }, right: { out: 14, bend: 0 }, lean: 0, headTilt: 0, bob: 0, stepL: 0, stepR: 0 },
  // Strongman flexing both arms (upper arms out, forearms up).
  flex: { left: { out: 92, bend: 92 }, right: { out: 92, bend: 92 }, lean: 0, headTilt: 0, bob: 0, stepL: 0, stepR: 0 },
  // Arms lifting something above the head (barbell).
  lift: { left: { out: 150, bend: 22 }, right: { out: 150, bend: 22 }, lean: 0, headTilt: -3, bob: 0, stepL: 0, stepR: 0 },
  // Angry: fists tight in front, leaning forward.
  fists: { left: { out: 22, bend: -48 }, right: { out: 22, bend: -48 }, lean: 4, headTilt: 5, bob: 0, stepL: 0, stepR: 0 },
  // Pointing sideways at someone.
  accuse: { left: { out: 18, bend: -40 }, right: { out: 82, bend: -6 }, lean: 5, headTilt: 4, bob: 0, stepL: 0, stepR: 0 },
  // Calm, hands open low.
  calm: { left: { out: 22, bend: 18 }, right: { out: 22, bend: 18 }, lean: 0, headTilt: -2, bob: 0, stepL: 0, stepR: 0 },
} satisfies Record<string, Pose>;

const mixArm = (a: ArmPose, b: ArmPose, p: number): ArmPose => ({ out: a.out + (b.out - a.out) * p, bend: a.bend + (b.bend - a.bend) * p });

export const mixPose = (a: Pose, b: Pose, p: number): Pose => ({
  left: mixArm(a.left, b.left, p),
  right: mixArm(a.right, b.right, p),
  lean: a.lean + (b.lean - a.lean) * p,
  headTilt: a.headTilt + (b.headTilt - a.headTilt) * p,
  bob: a.bob + (b.bob - a.bob) * p,
  stepL: a.stepL + (b.stepL - a.stepL) * p,
  stepR: a.stepR + (b.stepR - a.stepR) * p,
});

/** Walk cycle on top of a pose: t in seconds, speed in steps per second. */
export const walk = (base: Pose, t: number, speed = 2.2, amount = 1): Pose => {
  const ph = t * speed * Math.PI;
  const s = Math.sin(ph);
  // Front view: arms swing forward and back, which reads as the arm staying at
  // the side while the elbow bends on the forward swing. Arms never swing out
  // sideways or cross the body. Each arm moves opposite to its own leg.
  const fwdL = Math.max(0, -s); // left arm forward while the right foot steps
  const fwdR = Math.max(0, s);
  return {
    ...base,
    // Positive bend folds the forearm outward in this rig, so walking uses a
    // negative bend: the forearm swings in front of the body, like a real step.
    left: { out: base.left.out + (4 + fwdL * 6) * amount, bend: base.left.bend - (4 + fwdL * 26) * amount },
    right: { out: base.right.out + (4 + fwdR * 6) * amount, bend: base.right.bend - (4 + fwdR * 26) * amount },
    bob: base.bob + Math.abs(Math.cos(ph)) * 10 * amount,
    stepL: Math.max(0, s) * amount,
    stepR: Math.max(0, -s) * amount,
    lean: base.lean + 2 * amount,
  };
};

/** Gentle breathing so a standing figure is never frozen. */
export const breathe = (base: Pose, t: number): Pose => ({ ...base, bob: base.bob + Math.sin(t * 2.4) * 2.5, headTilt: base.headTilt + Math.sin(t * 1.3) * 1.5 });

export type ManStyle = { thobe: string; shade: string; skin: string; beard: string; cap: string; shoe: string };
export const MAN_WHITE: ManStyle = { thobe: "#f6f3ec", shade: "#d9d3c6", skin: "#b88660", beard: "#2a211d", cap: "#ffffff", shoe: "#3b2f2a" };
export const MAN_STRONG: ManStyle = { thobe: "#3d4f86", shade: "#2c3a68", skin: "#a87952", beard: "#1d1714", cap: "#d9dde8", shoe: "#1f1a18" };
export const MAN_GREY: ManStyle = { thobe: "#9aa6c4", shade: "#7d89a8", skin: "#a87952", beard: "#231b18", cap: "#e9ecf3", shoe: "#2c2522" };

const UPPER = 108;
const FORE = 96;
const SLEEVE = 34;

const Arm: React.FC<{ side: 1 | -1; pose: ArmPose; s: ManStyle; item?: React.ReactNode; bulk?: number }> = ({ side, pose, s, item, bulk = 1 }) => {
  const SL = SLEEVE * bulk;
  // side 1 = screen right. SVG rotate is clockwise; outward for the right arm is anticlockwise.
  const up = -side * pose.out;
  const fore = -side * pose.bend;
  return (
    <g transform={`translate(${side * 54 * bulk} -350) rotate(${up})`}>
      <rect x={-SL / 2} y={-8} width={SL} height={UPPER + 12} rx={SL / 2} fill={s.thobe} stroke={s.shade} strokeWidth={3} />
      <g transform={`translate(0 ${UPPER}) rotate(${fore})`}>
        <rect x={-SL / 2 + 1} y={-10} width={SL - 2} height={FORE + 6} rx={SL / 2} fill={s.thobe} stroke={s.shade} strokeWidth={3} />
        <circle cx={0} cy={FORE + 8} r={17 * Math.sqrt(bulk)} fill={s.skin} />
        {item ? <g transform={`translate(0 ${FORE + 22})`}>{item}</g> : null}
      </g>
    </g>
  );
};

export const Man: React.FC<{
  pose: Pose;
  style?: ManStyle;
  size?: number; // rendered height in px
  heart?: { color: string; glow: number; scale?: number } | null;
  rightItem?: React.ReactNode;
  headTint?: number; // 0..1 red flush of anger
  bulk?: number; // >1 = broader body and arms (strongman)
}> = ({ pose, style = MAN_WHITE, size = 520, heart, rightItem, headTint = 0, bulk = 1 }) => {
  const s = style;
  const H = 520;
  const footY = (lift: number) => -10 - lift * 22;
  return (
    <svg width={size * 0.8} height={size} viewBox={`-208 ${-H + 10} 416 ${H}`} style={{ overflow: "visible" }}>
      <g transform={`translate(0 ${-pose.bob}) rotate(${pose.lean} 0 -200)`}>
        {/* Feet */}
        <ellipse cx={-26} cy={footY(pose.stepL)} rx={26} ry={11} fill={s.shoe} />
        <ellipse cx={26} cy={footY(pose.stepR)} rx={26} ry={11} fill={s.shoe} />
        {/* Back arm (screen left) behind the body */}
        <Arm side={-1} pose={pose.left} s={{ ...s, thobe: s.shade }} bulk={bulk} />
        {/* Thobe */}
        <path
          d="M -56 -368 Q 0 -384 56 -368 L 70 -110 Q 78 -40 80 -16 Q 0 -6 -80 -16 Q -78 -40 -70 -110 Z"
          transform={bulk !== 1 ? `scale(${bulk} 1)` : undefined}
          fill={s.thobe}
          stroke={s.shade}
          strokeWidth={3}
        />
        {/* Placket and a soft fold */}
        <path d="M 0 -372 L 0 -270" stroke={s.shade} strokeWidth={4} strokeLinecap="round" />
        <path d="M 30 -200 Q 40 -110 44 -24" stroke={s.shade} strokeWidth={3} fill="none" opacity={0.6} />
        {heart ? (
          <g transform={`translate(-22 -300) scale(${heart.scale ?? 1})`}>
            <circle r={60} fill={heart.color} opacity={0.25 * heart.glow} />
            <circle r={34} fill={heart.color} opacity={0.35 * heart.glow} />
            <path d="M 0 14 C -26 -4 -24 -24 -10 -24 C -4 -24 0 -18 0 -14 C 0 -18 4 -24 10 -24 C 24 -24 26 -4 0 14 Z" fill={heart.color} transform="scale(1.5)" />
          </g>
        ) : null}
        {/* Neck and head (faceless) */}
        <g transform={`rotate(${pose.headTilt} 0 -390)`}>
          <rect x={-14} y={-398} width={28} height={30} fill={s.skin} />
          <ellipse cx={0} cy={-432} rx={44} ry={50} fill={s.skin} />
          {headTint > 0 ? <ellipse cx={0} cy={-432} rx={44} ry={50} fill="#e0322b" opacity={0.75 * headTint} /> : null}
          {/* Beard covers jaw and chin */}
          <path d="M -44 -440 Q -46 -392 -20 -378 Q 0 -368 20 -378 Q 46 -392 44 -440 Q 30 -404 0 -402 Q -30 -404 -44 -440 Z" fill={s.beard} />
          {/* Kufi cap */}
          <path d="M -45 -446 Q -44 -488 0 -490 Q 44 -488 45 -446 Q 0 -456 -45 -446 Z" fill={s.cap} stroke={s.shade} strokeWidth={2} />
        </g>
        {/* Front arm (screen right) */}
        <Arm side={1} pose={pose.right} s={s} item={rightItem} bulk={bulk} />
      </g>
    </svg>
  );
};
