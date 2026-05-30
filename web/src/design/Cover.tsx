/* OpenBeats — generative cover art (falls back to a real cover image when given) */
import type { CSSProperties } from "react";
import { PALETTES, type Motif as MotifKind } from "./palette";

function Motif({ kind }: { kind: string }) {
  const w = "rgba(255,255,255,0.85)";
  switch (kind) {
    case "rings":
      return (
        <g fill="none" stroke={w} strokeWidth="1.4" opacity="0.4">
          <circle cx="68" cy="34" r="10" />
          <circle cx="68" cy="34" r="20" />
          <circle cx="68" cy="34" r="30" opacity="0.6" />
          <circle cx="68" cy="34" r="42" opacity="0.35" />
        </g>
      );
    case "diag":
      return (
        <g stroke={w} strokeWidth="6" opacity="0.18">
          {[-20, 5, 30, 55, 80, 105].map((x, i) => (
            <line key={i} x1={x} y1="0" x2={x + 40} y2="100" />
          ))}
        </g>
      );
    case "orb":
      return (
        <g opacity="0.5">
          <circle cx="32" cy="64" r="34" fill={w} opacity="0.16" />
          <circle cx="70" cy="30" r="14" fill={w} opacity="0.22" />
        </g>
      );
    case "grid":
      return (
        <g fill={w} opacity="0.32">
          {Array.from({ length: 36 }).map((_, i) => (
            <circle key={i} cx={14 + (i % 6) * 14.5} cy={14 + Math.floor(i / 6) * 14.5} r="1.7" />
          ))}
        </g>
      );
    case "wave":
      return (
        <g fill="none" stroke={w} strokeWidth="2" opacity="0.4">
          <path d="M-5 60 Q 20 40 45 60 T 95 60 T 145 60" />
          <path d="M-5 74 Q 20 54 45 74 T 95 74 T 145 74" opacity="0.6" />
          <path d="M-5 46 Q 20 26 45 46 T 95 46 T 145 46" opacity="0.45" />
        </g>
      );
    case "arc":
      return (
        <g fill="none" stroke={w} strokeWidth="2.4" opacity="0.42">
          <path d="M6 96 A 70 70 0 0 1 96 6" />
          <path d="M22 96 A 56 56 0 0 1 96 22" opacity="0.6" />
          <path d="M40 96 A 40 40 0 0 1 96 40" opacity="0.4" />
        </g>
      );
    case "halo":
      return (
        <g opacity="0.55">
          <circle cx="50" cy="46" r="26" fill="none" stroke={w} strokeWidth="2" />
          <circle cx="50" cy="46" r="14" fill={w} opacity="0.2" />
        </g>
      );
    case "split":
      return (
        <g opacity="0.4">
          <polygon points="0,0 100,0 0,100" fill={w} opacity="0.12" />
          <line x1="100" y1="0" x2="0" y2="100" stroke={w} strokeWidth="1.6" />
        </g>
      );
    default:
      return null;
  }
}

export function Cover({
  pal,
  motif,
  src,
  alt,
  className,
  style,
  radius,
}: {
  pal: string;
  motif: MotifKind | string;
  /** When provided (a real cover URL), render the image instead of generative art. */
  src?: string;
  alt?: string;
  className?: string;
  style?: CSSProperties;
  radius?: number;
}) {
  const base: CSSProperties = {
    position: "relative",
    overflow: "hidden",
    borderRadius: radius,
    ...style,
  };

  if (src) {
    return (
      <div className={className} style={base}>
        <img
          src={src}
          alt={alt ?? ""}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>
    );
  }

  const [c1, c2] = PALETTES[pal] || PALETTES.violet;
  return (
    <div className={className} style={{ ...base, background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(120% 90% at 80% 10%, rgba(255,255,255,0.28), transparent 55%)",
        }}
      />
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <Motif kind={motif} />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.22))",
        }}
      />
    </div>
  );
}
