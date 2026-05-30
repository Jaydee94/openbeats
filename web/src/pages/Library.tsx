import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePlayerStore } from "../store/player";
import { useLibrary, type Album } from "../hooks/useLibrary";
import { AlbumCard } from "../design/AlbumCard";
import { Cover } from "../design/Cover";

export function Library() {
  const [tab, setTab] = useState<"albums" | "artists">("albums");
  const navigate = useNavigate();
  const { albums, artists, isLoading } = useLibrary();
  const playQueue = usePlayerStore((s) => s.playQueue);

  const openAlbum = (a: Album) => navigate(`/album/${a.id}`);
  const playAlbum = (a: Album) => playQueue(a.tracks, 0);

  return (
    <div className="page fade-in">
      <div className="section__head" style={{ marginBottom: 22 }}>
        <h2 className="section__title" style={{ fontSize: 28 }}>
          Your Library
        </h2>
        <div style={{ display: "flex", gap: 6 }}>
          {(["albums", "artists"] as const).map((k) => (
            <button
              key={k}
              className={"np-tab" + (tab === k ? " active" : "")}
              onClick={() => setTab(k)}
              style={{ textTransform: "capitalize" }}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p className="muted">Loading…</p>}

      {!isLoading && albums.length === 0 && (
        <div className="empty-state">
          <div className="empty-state__title">Nothing here yet</div>
          Upload music to build out your library.
        </div>
      )}

      {tab === "albums" && (
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
      )}

      {tab === "artists" && (
        <div className="card-grid">
          {artists.map((artist) => (
            <div
              className="card"
              key={artist.id}
              onClick={() => artist.albums[0] && openAlbum(artist.albums[0])}
              style={{ textAlign: "center" }}
            >
              <div className="card__art" style={{ borderRadius: "50%", aspectRatio: "1" }}>
                <Cover
                  pal={artist.pal}
                  motif={artist.motif}
                  style={{ width: "100%", height: "100%", borderRadius: "50%" }}
                />
              </div>
              <div className="card__title" style={{ textAlign: "center" }}>
                {artist.name}
              </div>
              <div className="card__sub" style={{ textAlign: "center" }}>
                {artist.trackCount} {artist.trackCount === 1 ? "song" : "songs"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
