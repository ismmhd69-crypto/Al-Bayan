// Bayan mark (same geometry as brand/src/BayanMark.tsx): an eight-pointed star
// band in lapis with a gold rosette. `detail` adds the thin gold inner star and
// the rays; it is off at small sizes so the mark stays crisp.
const NOTCH = Math.cos(Math.PI / 4) / Math.cos(Math.PI / 8);

function starPath(r: number, turnDeg = 0) {
  return (
    Array.from({ length: 16 }, (_, i) => {
      const rad = ((turnDeg - 90 + i * 22.5) * Math.PI) / 180;
      const radius = i % 2 === 0 ? r : r * NOTCH;
      return `${i === 0 ? "M" : "L"}${(Math.cos(rad) * radius).toFixed(2)} ${(Math.sin(rad) * radius).toFixed(2)}`;
    }).join(" ") + "Z"
  );
}

const BAND = `${starPath(84)} ${starPath(71)}`;
const INNER = starPath(49, 22.5);
const ROSETTE = starPath(22);
const RAY_START = 84 * NOTCH + 6;
const RAYS = Array.from({ length: 8 }, (_, k) => {
  const rad = ((22.5 + k * 45 - 90) * Math.PI) / 180;
  const at = (r: number) => [(Math.cos(rad) * r).toFixed(2), (Math.sin(rad) * r).toFixed(2)];
  return [at(RAY_START), at(RAY_START + 15)];
});

export function Beacon({ size = 30, detail = size >= 40 }: { size?: number; detail?: boolean }) {
  // Without rays the star fills more of the box.
  const viewBox = detail ? "-100 -100 200 200" : "-88 -88 176 176";
  return (
    <svg width={size} height={size} viewBox={viewBox} aria-hidden="true" focusable="false">
      <path d={BAND} fillRule="evenodd" fill="var(--accent)" />
      {detail && (
        <>
          <path d={INNER} fill="none" stroke="var(--gold)" strokeWidth={1.8} strokeLinejoin="round" />
          {RAYS.map(([[x1, y1], [x2, y2]]) => (
            <line key={`${x1}${y1}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--gold)" strokeWidth={3.4} strokeLinecap="round" />
          ))}
        </>
      )}
      <path d={ROSETTE} fill="var(--gold)" transform={detail ? undefined : "scale(1.25)"} />
      <circle r={detail ? 7.5 : 9.4} fill="var(--surface)" />
      <circle r={detail ? 3.2 : 4} fill="var(--gold)" />
    </svg>
  );
}

export default function Logo({ brandAr }: { brandAr: string }) {
  return (
    <span className="brand">
      <Beacon />
      <span className="brand-name">
        Bayan <span className="brand-sep">|</span>{" "}
        <span className="brand-ar" lang="ar">
          {brandAr}
        </span>
      </span>
    </span>
  );
}
