/* OpenBeats — draggable seek / volume bar */
import { useRef } from "react";

export function Bar({ pct, onSeek }: { pct: number; onSeek: (fraction: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);

  const handle = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let f = (clientX - r.left) / r.width;
    f = Math.max(0, Math.min(1, f));
    onSeek(f);
  };

  const down = (e: React.MouseEvent) => {
    handle(e.clientX);
    const move = (ev: MouseEvent) => handle(ev.clientX);
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="bar" ref={ref} onMouseDown={down}>
      <div className="bar__fill" style={{ width: clamped + "%" }} />
      <div className="bar__knob" style={{ left: clamped + "%" }} />
    </div>
  );
}
