/* OpenBeats — glassy bottom player bar (owns the real <audio>/<video> element) */
import { useEffect, useRef } from "react";
import { mediaUrl } from "../api/client";
import { isVideo } from "../utils/media";
import { usePlayerStore } from "../store/player";
import { useFavoritesController } from "../hooks/useFavorites";
import { fmt } from "./format";
import { coverFor } from "./palette";
import { trackCoverSrc, trackSeed } from "../hooks/useLibrary";
import { Cover } from "./Cover";
import { Icon } from "./Icon";
import { Bar } from "./Bar";

export function PlayerBar() {
  const mediaRef = useRef<HTMLVideoElement & HTMLAudioElement>(null);

  const queue = usePlayerStore((s) => s.queue);
  const index = usePlayerStore((s) => s.index);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const progress = usePlayerStore((s) => s.progress);
  const duration = usePlayerStore((s) => s.duration);
  const volume = usePlayerStore((s) => s.volume);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const repeat = usePlayerStore((s) => s.repeat);
  const seekTo = usePlayerStore((s) => s.seekTo);
  const store = usePlayerStore;

  const track = queue[index] ?? null;
  const { ids: likedIds, toggle: toggleLike } = useFavoritesController();
  const liked = track ? likedIds.has(track.id) : false;

  // Load a new source whenever the current track changes.
  useEffect(() => {
    const el = mediaRef.current;
    if (!el || !track) return;
    el.src = mediaUrl(`/api/tracks/${track.id}/stream`);
    el.load();
    if (isPlaying) void el.play().catch(() => store.getState().setPlaying(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.id]);

  // React to play/pause toggles.
  useEffect(() => {
    const el = mediaRef.current;
    if (!el || !track) return;
    if (isPlaying) void el.play().catch(() => store.getState().setPlaying(false));
    else el.pause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  useEffect(() => {
    if (mediaRef.current) mediaRef.current.volume = volume;
  }, [volume]);

  // Apply a pending seek request from the store.
  useEffect(() => {
    if (seekTo == null) return;
    const el = mediaRef.current;
    if (el) el.currentTime = seekTo;
    store.getState().clearSeek();
  }, [seekTo, store]);

  const s = store.getState();
  const mediaProps = {
    ref: mediaRef,
    onTimeUpdate: (e: React.SyntheticEvent<HTMLMediaElement>) =>
      store.getState().setProgress(e.currentTarget.currentTime),
    onLoadedMetadata: (e: React.SyntheticEvent<HTMLMediaElement>) =>
      store.getState().setDuration(e.currentTarget.duration),
    onEnded: () => store.getState().handleEnded(),
    onPlay: () => store.getState().setPlaying(true),
    onPause: () => store.getState().setPlaying(false),
  };

  if (!track) {
    return (
      <footer className="playerbar" style={{ gridTemplateColumns: "1fr", justifyItems: "center" }}>
        <div className="muted" style={{ fontSize: 14 }}>
          Select a track to start listening
        </div>
      </footer>
    );
  }

  const pct = duration ? (progress / duration) * 100 : 0;
  const { pal, motif } = coverFor(trackSeed(track));
  const video = isVideo(track.mime_type);

  return (
    <footer className="playerbar">
      <div className="np">
        <div className="np__art" onClick={() => s.openNowPlaying()}>
          {video ? (
            <video {...mediaProps} className="np__media-video" playsInline />
          ) : (
            <>
              <audio {...mediaProps} className="np__media-audio" />
              <Cover pal={pal} motif={motif} src={trackCoverSrc(track)} style={{ width: "100%", height: "100%" }} radius={9} />
            </>
          )}
          <span className="expand">
            <Icon name="expand" />
          </span>
        </div>
        <div className="np__t">
          <div className="np__title">{track.title}</div>
          <div className="np__artist">{track.artist || "Unknown artist"}</div>
        </div>
        <button
          className={"np__like" + (liked ? " on" : "")}
          onClick={() => toggleLike(track)}
          aria-label="Like"
        >
          <Icon name={liked ? "heartFill" : "heart"} />
        </button>
      </div>

      <div className="controls">
        <div className="controls__btns">
          <button className={"cbtn" + (shuffle ? " on" : "")} onClick={() => s.toggleShuffle()} aria-label="Shuffle">
            <Icon name="shuffle" />
          </button>
          <button className="cbtn" onClick={() => s.prev()} aria-label="Previous">
            <Icon name="prev" />
          </button>
          <button className="cbtn cbtn--play" onClick={() => s.toggle()} aria-label="Play/Pause">
            <Icon name={isPlaying ? "pause" : "play"} />
          </button>
          <button className="cbtn" onClick={() => s.next()} aria-label="Next">
            <Icon name="next" />
          </button>
          <button className={"cbtn" + (repeat ? " on" : "")} onClick={() => s.toggleRepeat()} aria-label="Repeat">
            <Icon name="repeat" />
          </button>
        </div>
        <div className="seek">
          <span className="seek__time">{fmt(progress)}</span>
          <Bar pct={pct} onSeek={(f) => s.seek(f * duration)} />
          <span className="seek__time r">{fmt(duration)}</span>
        </div>
      </div>

      <div className="extras">
        <button className="cbtn" onClick={() => s.openNowPlaying()} aria-label="Now playing">
          <Icon name="mic" />
        </button>
        <button className="cbtn" onClick={() => s.openNowPlaying()} aria-label="Queue">
          <Icon name="queue" />
        </button>
        <div className="vol">
          <button
            className="cbtn"
            onClick={() => s.toggleMute()}
            aria-label="Volume"
            style={{ width: 30, height: 30 }}
          >
            <Icon name={volume === 0 ? "volumeOff" : "volume"} />
          </button>
          <Bar pct={volume * 100} onSeek={(f) => s.setVolume(f)} />
        </div>
      </div>
    </footer>
  );
}
