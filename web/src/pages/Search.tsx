import { useNavigate, useOutletContext } from "react-router-dom";
import { usePlayerStore } from "../store/player";
import { useLikesStore } from "../store/likes";
import { useLibrary, type Album } from "../hooks/useLibrary";
import { AlbumCard } from "../design/AlbumCard";
import { SectionHead } from "../design/SectionHead";
import { TrackRow } from "../design/TrackRow";

interface ShellContext {
  query: string;
}

export function Search() {
  const { query } = useOutletContext<ShellContext>();
  const navigate = useNavigate();
  const q = query.trim();
  const { albums, tracks } = useLibrary(q || undefined);

  const playQueue = usePlayerStore((s) => s.playQueue);
  const index = usePlayerStore((s) => s.index);
  const queue = usePlayerStore((s) => s.queue);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const current = queue[index] ?? null;
  const liked = useLikesStore((s) => s.liked);
  const toggleLike = useLikesStore((s) => s.toggle);

  const openAlbum = (a: Album) => navigate(`/album/${a.id}`);
  const playAlbum = (a: Album) => playQueue(a.tracks, 0);

  if (!q) {
    return (
      <div className="page fade-in">
        <SectionHead title="Browse your library" />
        <div className="card-grid">
          {albums.map((a) => (
            <AlbumCard
              key={a.id}
              title={a.title}
              sub={a.artist}
              pal={a.pal}
              motif={a.motif}
              coverSrc={a.coverSrc}
              onOpen={() => openAlbum(a)}
              onPlay={() => playAlbum(a)}
            />
          ))}
        </div>
      </div>
    );
  }

  const songs = tracks.slice(0, 6);

  return (
    <div className="page fade-in">
      {songs.length > 0 && (
        <div className="section">
          <SectionHead title="Songs" />
          <div className="tracklist">
            {songs.map((t, i) => (
              <TrackRow
                key={t.id}
                track={t}
                index={i}
                isCurrent={current?.id === t.id}
                isPlaying={isPlaying}
                liked={liked.has(t.id)}
                middleText={t.album || "Single"}
                onPlay={() => playQueue(songs, i)}
                onLike={() => toggleLike(t.id)}
              />
            ))}
          </div>
        </div>
      )}

      {albums.length > 0 && (
        <div className="section">
          <SectionHead title="Albums & artists" />
          <div className="card-grid">
            {albums.map((a) => (
              <AlbumCard
                key={a.id}
                title={a.title}
                sub={a.artist}
                pal={a.pal}
                motif={a.motif}
                coverSrc={a.coverSrc}
                onOpen={() => openAlbum(a)}
                onPlay={() => playAlbum(a)}
              />
            ))}
          </div>
        </div>
      )}

      {albums.length === 0 && songs.length === 0 && (
        <div className="empty-state">
          <div className="empty-state__title">No results for “{query}”</div>
          Try a different title, artist, or album name.
        </div>
      )}
    </div>
  );
}
