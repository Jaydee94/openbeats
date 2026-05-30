import { useNavigate } from "react-router-dom";
import { usePlayerStore } from "../store/player";
import { usePlaylists } from "../hooks/usePlaylists";
import { useLibrary, type Album } from "../hooks/useLibrary";
import { coverFor } from "../design/palette";
import { AlbumCard } from "../design/AlbumCard";
import { SectionHead } from "../design/SectionHead";
import { Cover } from "../design/Cover";
import { Icon } from "../design/Icon";

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function newest(album: Album): number {
  return album.tracks.reduce((max, t) => Math.max(max, Date.parse(t.created_at) || 0), 0);
}

export function Home() {
  const navigate = useNavigate();
  const { albums, isLoading } = useLibrary();
  const { data: playlists } = usePlaylists();
  const playQueue = usePlayerStore((s) => s.playQueue);

  const openAlbum = (a: Album) => navigate(`/album/${a.id}`);
  const playAlbum = (a: Album) => playQueue(a.tracks, 0);

  const quick = albums.slice(0, 6);
  const recent = [...albums].sort((a, b) => newest(b) - newest(a)).slice(0, 10);

  if (!isLoading && albums.length === 0) {
    return (
      <div className="page fade-in">
        <SectionHead title={greeting()} />
        <div className="empty-state">
          <div className="empty-state__title">Your library is empty</div>
          Upload some music with the button in the top bar to get started.
        </div>
      </div>
    );
  }

  return (
    <div className="page fade-in">
      <div className="section">
        <SectionHead title={greeting()} />
        <div className="quickpicks">
          {quick.map((a) => (
            <div className="qp" key={a.id} onClick={() => openAlbum(a)}>
              <Cover className="qp__art" pal={a.pal} motif={a.motif} src={a.coverSrc} />
              <div className="qp__title">{a.title}</div>
              <button
                className="qp__play"
                onClick={(e) => {
                  e.stopPropagation();
                  playAlbum(a);
                }}
                aria-label="Play"
              >
                <Icon name="play" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {playlists && playlists.length > 0 && (
        <div className="section">
          <SectionHead title="Your playlists" more="Show all" onMore={() => navigate("/library")} />
          <div className="shelf">
            {playlists.map((p) => {
              const { pal, motif } = coverFor(`playlist::${p.id}`);
              return (
                <AlbumCard
                  key={p.id}
                  title={p.name}
                  sub="Playlist"
                  pal={pal}
                  motif={motif}
                  onOpen={() => navigate(`/playlist/${p.id}`)}
                  onPlay={() => navigate(`/playlist/${p.id}`)}
                />
              );
            })}
          </div>
        </div>
      )}

      <div className="section">
        <SectionHead title="Recently added" more="Show all" onMore={() => navigate("/library")} />
        <div className="shelf">
          {recent.map((a) => (
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

      <div className="section">
        <SectionHead title="Albums in your library" more="Show all" onMore={() => navigate("/library")} />
        <div className="shelf">
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
    </div>
  );
}
