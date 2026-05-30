/* OpenBeats — generative cover palettes + deterministic motif/palette selection */

export const PALETTES: Record<string, [string, string]> = {
  ember: ["#ff8a5b", "#b1295c"],
  ocean: ["#3ad6c0", "#1e4fa3"],
  violet: ["#9b7bff", "#4338ca"],
  sunset: ["#fbbf24", "#d9466b"],
  forest: ["#43e0a0", "#0f766e"],
  rose: ["#fb7aa0", "#7c3aed"],
  mono: ["#cbd5e1", "#475569"],
  gold: ["#f5d547", "#b45309"],
  ice: ["#7ce6f9", "#6366f1"],
  crimson: ["#fb5577", "#7f1d1d"],
  mint: ["#9bf3cd", "#14b8a6"],
  dusk: ["#c79bff", "#5b21b6"],
  slate: ["#94a3d8", "#3b3f72"],
  coral: ["#ff9a76", "#c2367a"],
};

export type Motif = "rings" | "diag" | "orb" | "grid" | "wave" | "arc" | "halo" | "split";

export const MOTIFS: Motif[] = ["rings", "diag", "orb", "grid", "wave", "arc", "halo", "split"];

const PALETTE_KEYS = Object.keys(PALETTES);

/** Stable 32-bit FNV-1a hash of a string. */
export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministically derive a palette + motif from any seed string. */
export function coverFor(seed: string): { pal: string; motif: Motif } {
  const h = hashString(seed);
  return {
    pal: PALETTE_KEYS[h % PALETTE_KEYS.length],
    motif: MOTIFS[(h >>> 5) % MOTIFS.length],
  };
}

export function coverColors(pal: string): [string, string] {
  return PALETTES[pal] || PALETTES.violet;
}
