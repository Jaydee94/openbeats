import { useEffect, useRef, useState } from "react";
import { mediaUrl } from "../api/client";
import { usePlayerStore } from "../store/player";
import { isVideo } from "../utils/media";

function fmt(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function Player() {
  const mediaRef = useRef<HTMLMediaElement>(null);
  const queue = usePlayerStore((s) => s.queue);
  const index = usePlayerStore((s) => s.index);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const setPlaying = usePlayerStore((s) => s.setPlaying);
  const next = usePlayerStore((s) => s.next);
  const prev = usePlayerStore((s) => s.prev);

  const track = queue[index] ?? null;
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  // Load a new source whenever the current track changes.
  useEffect(() => {
    const el = mediaRef.current;
    if (!el || !track) return;
    el.src = mediaUrl(`/api/tracks/${track.id}/stream`);
    el.load();
    if (isPlaying) void el.play().catch(() => setPlaying(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.id]);

  // React to play/pause state changes.
  useEffect(() => {
    const el = mediaRef.current;
    if (!el || !track) return;
    if (isPlaying) void el.play().catch(() => setPlaying(false));
    else el.pause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  useEffect(() => {
    if (mediaRef.current) mediaRef.current.volume = volume;
  }, [volume]);

  if (!track) {
    return (
      <footer className="player player--empty">
        <span>No track selected</span>
      </footer>
    );
  }

  const mediaProps = {
    ref: mediaRef as React.RefObject<HTMLVideoElement & HTMLAudioElement>,
    onTimeUpdate: (e: React.SyntheticEvent<HTMLMediaElement>) =>
      setCurrent(e.currentTarget.currentTime),
    onLoadedMetadata: (e: React.SyntheticEvent<HTMLMediaElement>) =>
      setDuration(e.currentTarget.duration),
    onEnded: () => next(),
    onPlay: () => setPlaying(true),
    onPause: () => setPlaying(false),
  };

  return (
    <footer className="player">
      {isVideo(track.mime_type) ? (
        <video {...mediaProps} controls className="player__video" />
      ) : (
        <audio {...mediaProps} />
      )}

      <div className="player__meta">
        <strong>{track.title}</strong>
        <span>{track.artist || "Unknown artist"}</span>
      </div>

      <div className="player__controls">
        <button onClick={() => prev()} aria-label="Previous">⏮</button>
        <button onClick={() => setPlaying(!isPlaying)} aria-label="Play/Pause">
          {isPlaying ? "⏸" : "▶"}
        </button>
        <button onClick={() => next()} aria-label="Next">⏭</button>
      </div>

      <div className="player__seek">
        <span>{fmt(current)}</span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={current}
          onChange={(e) => {
            const t = Number(e.target.value);
            if (mediaRef.current) mediaRef.current.currentTime = t;
            setCurrent(t);
          }}
        />
        <span>{fmt(duration)}</span>
      </div>

      <div className="player__volume">
        🔊
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
        />
      </div>
    </footer>
  );
}
