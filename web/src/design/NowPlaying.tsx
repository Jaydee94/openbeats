/* OpenBeats — fullscreen Now Playing overlay */
import { useMemo, useRef, useState } from "react";
import { usePlayerStore } from "../store/player";
import { useFavoritesController } from "../hooks/useFavorites";
import { fmt, waveHeights } from "./format";
import { coverColors, coverFor } from "./palette";
import { trackCoverSrc, trackSeed, useLibrary } from "../hooks/useLibrary";
import { Cover } from "./Cover";
import { Icon } from "./Icon";

type NpTab = "queue" | "lyrics" | "related";

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
  const { ids: likedIds, toggle: toggleLike } = useFavoritesController();
  const liked = track ? likedIds.has(track.id) : false;

  const [tab, setTab] = useState<NpTab>("queue");
  const { tracks: allTracks } = useLibrary();

  const waveRef = useRef<HTMLDivElement>(null);
  const bars = useMemo(() => (track ? waveHeights(track.id, 64) : []), [track]);
  const related = useMemo(
    () =>
      track
        ? allTracks.filter((t) => t.id !== track.id && t.artist && t.artist === track.artist)
        : [],
    [allTracks, track],
  );

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
                onClick={() => toggleLike(track)}
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
          <button className={"np-tab" + (tab === "queue" ? " active" : "")} onClick={() => setTab("queue")}>
            Queue
          </button>
          <button className={"np-tab" + (tab === "lyrics" ? " active" : "")} onClick={() => setTab("lyrics")}>
            Lyrics
          </button>
          <button className={"np-tab" + (tab === "related" ? " active" : "")} onClick={() => setTab("related")}>
            Related
          </button>
        </div>

        {tab === "queue" && (
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
        )}

        {tab === "lyrics" && (
          <div className="np-queue">
            <div className="empty-state" style={{ padding: "32px 8px" }}>
              <div className="empty-state__title">No lyrics available</div>
              Lyrics aren’t provided for this track.
            </div>
          </div>
        )}

        {tab === "related" && (
          <div className="np-queue">
            <div className="np-queue__label">More from {track.artist || "this artist"}</div>
            {related.length === 0 ? (
              <div className="empty-state" style={{ padding: "32px 8px" }}>
                <div className="empty-state__title">Nothing related yet</div>
                No other tracks from this artist in your library.
              </div>
            ) : (
              related.map((t) => (
                <QueueRow key={t.id} track={t} onClick={() => store.getState().playTrack(t)} />
              ))
            )}
          </div>
        )}
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
