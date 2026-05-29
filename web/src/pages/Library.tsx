import { useState } from "react";
import { mediaUrl } from "../api/client";
import { UploadDialog } from "../components/UploadDialog";
import { useDeleteTrack, useTracks } from "../hooks/useTracks";
import { useAddTrackToPlaylist, usePlaylists } from "../hooks/usePlaylists";
import { usePlayerStore } from "../store/player";

export function Library() {
  const [q, setQ] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const { data: tracks, isLoading } = useTracks({ q: q || undefined });
  const { data: playlists } = usePlaylists();
  const playQueue = usePlayerStore((s) => s.playQueue);
  const deleteTrack = useDeleteTrack();
  const addToPlaylist = useAddTrackToPlaylist();

  return (
    <div className="library">
      <div className="library__toolbar">
        <input
          placeholder="Search title, artist, album…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button onClick={() => setShowUpload(true)}>Upload</button>
      </div>

      {isLoading && <p>Loading…</p>}

      <table className="track-table">
        <thead>
          <tr>
            <th></th>
            <th>Title</th>
            <th>Artist</th>
            <th>Album</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {tracks?.map((t, i) => (
            <tr key={t.id} onDoubleClick={() => playQueue(tracks, i)}>
              <td>
                {t.has_cover ? (
                  <img
                    className="cover"
                    src={mediaUrl(`/api/tracks/${t.id}/cover`)}
                    alt=""
                  />
                ) : (
                  <div className="cover cover--empty">♪</div>
                )}
              </td>
              <td>{t.title}</td>
              <td>{t.artist}</td>
              <td>{t.album}</td>
              <td className="track-table__actions">
                <button onClick={() => playQueue(tracks, i)}>▶</button>
                {playlists && playlists.length > 0 && (
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        addToPlaylist.mutate({
                          playlistId: e.target.value,
                          trackId: t.id,
                        });
                        e.target.value = "";
                      }
                    }}
                  >
                    <option value="">+ Playlist</option>
                    {playlists.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                )}
                <button onClick={() => deleteTrack.mutate(t.id)}>🗑</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {tracks?.length === 0 && !isLoading && (
        <p className="empty">No tracks yet. Upload some music to get started.</p>
      )}

      {showUpload && <UploadDialog onClose={() => setShowUpload(false)} />}
    </div>
  );
}
