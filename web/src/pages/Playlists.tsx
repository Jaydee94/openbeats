import { useState } from "react";
import {
  useCreatePlaylist,
  usePlaylist,
  usePlaylists,
} from "../hooks/usePlaylists";
import { usePlayerStore } from "../store/player";

export function Playlists() {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const { data: playlists } = usePlaylists();
  const { data: detail } = usePlaylist(selected);
  const create = useCreatePlaylist();
  const playQueue = usePlayerStore((s) => s.playQueue);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await create.mutateAsync(name.trim());
    setName("");
  };

  return (
    <div className="playlists">
      <aside className="playlists__sidebar">
        <form onSubmit={submit} className="playlists__create">
          <input
            placeholder="New playlist name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit">Create</button>
        </form>
        <ul>
          {playlists?.map((p) => (
            <li
              key={p.id}
              className={p.id === selected ? "active" : ""}
              onClick={() => setSelected(p.id)}
            >
              {p.name}
            </li>
          ))}
        </ul>
      </aside>

      <section className="playlists__detail">
        {!selected && <p>Select a playlist.</p>}
        {detail && (
          <>
            <h2>{detail.playlist.name}</h2>
            <button
              disabled={detail.tracks.length === 0}
              onClick={() => playQueue(detail.tracks, 0)}
            >
              ▶ Play all
            </button>
            <ol>
              {detail.tracks.map((t, i) => (
                <li key={t.id} onDoubleClick={() => playQueue(detail.tracks, i)}>
                  {t.title} — {t.artist}
                </li>
              ))}
            </ol>
            {detail.tracks.length === 0 && (
              <p className="empty">
                Empty playlist. Add tracks from the Library view.
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
