/* OpenBeats — fullscreen Now Playing overlay */
import { useMemo, useRef } from "react";
import { usePlayerStore } from "../store/player";
import { useLikesStore } from "../store/likes";
import { fmt, waveHeights } from "./format";
import { coverColors, coverFor } from "./palette";
import { trackCoverSrc, trackSeed } from "../hooks/useLibrary";
import { Cover } from "./Cover";
import { Icon } from "./Icon";

export function NowPlaying() {
  const queue = usePlayerStore((s) => s.queue);
  const index = usePlayerStore((s) => s.index);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const progress = usePlayerStore((s) => s.progress);
  const duration = usePlayerStore((s) => s.duration);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const repeat = usePlayerStore((s) => s.repeat);
  const store = usePlayerStore;

  const track = queue[index] ?? null;
  const liked = useLikesStore((s) => (track ? s.liked.has(track.id) : false));
  const toggleLike = useLikesStore((s) => s.toggle);

  const waveRef = useRef<HTMLDivElement>(null);
  const bars = useMemo(() => (track ? waveHeights(track.id, 64) : []), [track]);

  if (!track) return null;

  const s = store.getState();
  const [c1, c2] = coverColors(coverFor(trackSeed(track)).pal);
  const { pal, motif } = coverFor(trackSeed(track));
  const playedPct = duration ? progress / duration : 0;

  const seekWave = (e: React.MouseEvent) => {
    const el = waveRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let f = (e.clientX - r.left) / r.width;
    f = Math.max(0, Math.min(1, f));
    s.seek(f * duration);
  };

  return (
    <div className="nowplaying">
      <div className="nowplaying__bg" style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }} />

      <div className="np-left">
        <div className="np-topbar">
          <div className="np-topbar__label">
            <Icon name="device" style={{ width: 15, height: 15 }} /> Playing from {track.album || "your library"}
          </div>
          <button className="icon-btn" onClick={() => s.closeNowPlaying()} aria-label="Close">
            <Icon name="chevronDown" />
          </button>
        </div>

        <div className="np-stage">
          <div className="np-cover">
            <div className="np-cover__glow" style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }} />
            <Cover pal={pal} motif={motif} src={trackCoverSrc(track)} style={{ width: "100%", height: "100%" }} radius={24} />
          </div>

          <div className="np-detail">
            <div className="np-detail__row">
              <div>
                <div className="np-detail__title">{track.title}</div>
                <div className="np-detail__artist">{track.artist || "Unknown artist"}</div>
              </div>
              <button
                className={"np-detail__like" + (liked ? " on" : "")}
                onClick={() => toggleLike(track.id)}
                aria-label="Like"
              >
                <Icon name={liked ? "heartFill" : "heart"} />
              </button>
            </div>

            <div className="wave" ref={waveRef} onClick={seekWave}>
              {bars.map((h, i) => (
                <i key={i} className={i / bars.length <= playedPct ? "on" : ""} style={{ height: h * 100 + "%" }} />
              ))}
            </div>
            <div className="np-time">
              <span>{fmt(progress)}</span>
              <span>-{fmt(Math.max(0, duration - progress))}</span>
            </div>

            <div className="np-controls">
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
          </div>
        </div>
      </div>

      <div className="np-right">
        <div className="np-right__tabs">
          <div className="np-tab active">Queue</div>
          <div className="np-tab">Lyrics</div>
          <div className="np-tab">Related</div>
        </div>
        <div className="np-queue">
          <div className="np-queue__label">Now playing</div>
          <QueueRow track={track} active />
          <div className="np-queue__label" style={{ marginTop: 10 }}>
            Next up
          </div>
          {queue.map(
            (t, i) =>
              i > index && (
                <QueueRow key={t.id + i} track={t} onClick={() => store.getState().jumpTo(i)} />
              ),
          )}
        </div>
      </div>
    </div>
  );
}

function QueueRow({
  track,
  active = false,
  onClick,
}: {
  track: import("../api/types").Track;
  active?: boolean;
  onClick?: () => void;
}) {
  const { pal, motif } = coverFor(trackSeed(track));
  return (
    <div className={"qrow" + (active ? " active" : "")} onClick={onClick}>
      <Cover className="qrow__cover" pal={pal} motif={motif} src={trackCoverSrc(track)} radius={7} />
      <div className="qrow__t">
        <div className="qrow__title">{track.title}</div>
        <div className="qrow__artist">{track.artist || "Unknown artist"}</div>
      </div>
      {active ? (
        <span className="eqbars" style={{ height: 14 }}>
          <i />
          <i />
          <i />
          <i />
        </span>
      ) : (
        <span className="qrow__dur">{fmt(track.duration_seconds)}</span>
      )}
    </div>
  );
}
