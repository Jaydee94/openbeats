import { useParams } from "react-router-dom";
import type { Track } from "../api/types";
import { usePlayerStore } from "../store/player";
import { useLikesStore } from "../store/likes";
import { usePlaylist } from "../hooks/usePlaylists";
import { useLibrary } from "../hooks/useLibrary";
import { coverColors, coverFor } from "../design/palette";
import { fmtLong, playCount } from "../design/format";
import { Cover } from "../design/Cover";
import { Icon } from "../design/Icon";
import { TrackRow } from "../design/TrackRow";

interface CollectionViewProps {
  kind: "album" | "playlist";
  title: string;
  owner: string;
  meta?: string;
  tracks: Track[];
  pal: string;
  motif: string;
  coverSrc?: string;
}

function CollectionView({ kind, title, owner, meta, tracks, pal, motif, coverSrc }: CollectionViewProps) {
  const playQueue = usePlayerStore((s) => s.playQueue);
  const toggle = usePlayerStore((s) => s.toggle);
  const queue = usePlayerStore((s) => s.queue);
  const index = usePlayerStore((s) => s.index);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const liked = useLikesStore((s) => s.liked);
  const toggleLike = useLikesStore((s) => s.toggle);

  const current = queue[index] ?? null;
  const isThis = tracks.some((t) => current && t.id === current.id);
  const totalSec = tracks.reduce((sum, t) => sum + t.duration_seconds, 0);
  const [c1, c2] = coverColors(pal);

  const playCollection = () => {
    if (isThis) toggle();
    else playQueue(tracks, 0);
  };

  return (
    <div className="fade-in">
      <div className="hero">
        <div
          className="hero__bg"
          style={{
            background: `radial-gradient(120% 130% at 18% 0%, ${c1}66, transparent 55%), linear-gradient(160deg, ${c2}55, transparent 60%)`,
          }}
        />
        <Cover className="hero__art" pal={pal} motif={motif} src={coverSrc} radius={18} />
        <div className="hero__info">
          <div className="hero__eyebrow">{kind === "album" ? "Album" : "Playlist"}</div>
          <h1 className="hero__title">{title}</h1>
          <div className="hero__meta">
            <b>{owner}</b>
            {meta && (
              <>
                <span className="hero__dot" />
                <span>{meta}</span>
              </>
            )}
            <span className="hero__dot" />
            <span>
              {tracks.length} {tracks.length === 1 ? "song" : "songs"}
            </span>
            {totalSec > 0 && (
              <>
                <span className="hero__dot" />
                <span>{fmtLong(totalSec)}</span>
              </>
            )}
          </div>
          <div className="hero__actions">
            <button className="play-cta" onClick={playCollection} disabled={tracks.length === 0}>
              <Icon name={isThis && isPlaying ? "pause" : "play"} />
              {isThis && isPlaying ? "Pause" : "Play"}
            </button>
            <button className="ghost-btn">
              <Icon name="shuffle" /> Shuffle
            </button>
          </div>
        </div>
      </div>

      <div className="page" style={{ paddingTop: 8 }}>
        {tracks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__title">This {kind} is empty</div>
            {kind === "playlist" ? "Add tracks from any album or the library." : "No tracks found."}
          </div>
        ) : (
          <div className="tracklist">
            <div className="tracklist__head">
              <span>#</span>
              <span>Title</span>
              <span>{kind === "album" ? "Plays" : "Album"}</span>
              <span className="ta-r">
                <Icon name="clock" style={{ width: 15, height: 15 }} />
              </span>
            </div>
            {tracks.map((t, i) => (
              <TrackRow
                key={t.id + i}
                track={t}
                index={i}
                isCurrent={current?.id === t.id}
                isPlaying={isPlaying}
                liked={liked.has(t.id)}
                middleText={kind === "album" ? playCount(t.id) : t.album || "Single"}
                onPlay={() => playQueue(tracks, i)}
                onLike={() => toggleLike(t.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function AlbumView() {
  const { id } = useParams();
  const { albums, isLoading } = useLibrary();
  const album = albums.find((a) => a.id === id);

  if (isLoading) return <div className="page">Loading…</div>;
  if (!album) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-state__title">Album not found</div>
        </div>
      </div>
    );
  }

  return (
    <CollectionView
      kind="album"
      title={album.title}
      owner={album.artist}
      tracks={album.tracks}
      pal={album.pal}
      motif={album.motif}
      coverSrc={album.coverSrc}
    />
  );
}

export function PlaylistView() {
  const { id } = useParams();
  const { data: detail, isLoading } = usePlaylist(id ?? null);
  const { pal, motif } = coverFor(`playlist::${id}`);

  if (isLoading) return <div className="page">Loading…</div>;
  if (!detail) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-state__title">Playlist not found</div>
        </div>
      </div>
    );
  }

  return (
    <CollectionView
      kind="playlist"
      title={detail.playlist.name}
      owner="OpenBeats"
      tracks={detail.tracks}
      pal={pal}
      motif={motif}
    />
  );
}
