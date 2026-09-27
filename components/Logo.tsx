// The eight-pointed star from the mockup: lapis star, white ring, gold centre.
export function Beacon({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <rect x="9" y="9" width="22" height="22" rx="2" fill="var(--accent)" />
      <rect x="9" y="9" width="22" height="22" rx="2" fill="var(--accent)" transform="rotate(45 20 20)" />
      <circle cx="20" cy="20" r="6.4" fill="var(--surface)" />
      <circle cx="20" cy="20" r="3.2" fill="var(--gold)" />
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
