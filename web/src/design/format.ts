/* OpenBeats — formatting + deterministic display helpers */

export function fmt(sec: number): string {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m + ":" + String(s).padStart(2, "0");
}

export function fmtLong(sec: number): string {
  const m = Math.round(sec / 60);
  return m + " min";
}

/** Deterministic, plausible-looking play count derived from a track id. */
export function playCount(id: string): string {
  let s = 1;
  for (let i = 0; i < id.length; i++) {
    s = (s * 48271 + id.charCodeAt(i) * 2654435761) % 2147483647;
  }
  return (40000 + (s % 4800000)).toLocaleString("en-US");
}

/** Deterministic pseudo-random waveform bar heights (0..1) from a track id. */
export function waveHeights(id: string, n: number): number[] {
  let seed = 0;
  for (let i = 0; i < id.length; i++) seed = (seed * 31 + id.charCodeAt(i)) % 100000;
  const out: number[] = [];
  let x = seed;
  for (let i = 0; i < n; i++) {
    x = (x * 1103515245 + 12345) % 2147483648;
    const base = 0.25 + (x / 2147483648) * 0.75;
    const env = 0.6 + 0.4 * Math.sin((i / n) * Math.PI);
    out.push(Math.max(0.12, base * env));
  }
  return out;
}
