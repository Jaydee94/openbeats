/* OpenBeats — per-track overflow menu: add to playlist, delete from library */
import { useEffect, useRef, useState } from "react";
import type { Track } from "../api/types";
import { useAuthStore } from "../store/auth";
import { usePlaylists, useCreatePlaylist, useAddTrackToPlaylist } from "../hooks/usePlaylists";
import { useDeleteTrack } from "../hooks/useTracks";
import { Icon } from "../design/Icon";

type Mode = "root" | "newPlaylist" | "confirmDelete";

export function TrackMenu({ track }: { track: Track }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("root");
  const [name, setName] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  const user = useAuthStore((s) => s.user);
  const { data: playlists } = usePlaylists();
  const createPlaylist = useCreatePlaylist();
  const addTrack = useAddTrackToPlaylist();
  const deleteTrack = useDeleteTrack();

  const canDelete = !!user && (user.role === "admin" || user.id === track.uploaded_by);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => {
    setOpen(false);
    setMode("root");
    setName("");
  };

  const addToPlaylist = (playlistId: string) => {
    addTrack.mutate({ playlistId, trackId: track.id });
    close();
  };

  const createAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const playlist = await createPlaylist.mutateAsync(name.trim());
    await addTrack.mutateAsync({ playlistId: playlist.id, trackId: track.id });
    close();
  };

  const confirmDelete = () => {
    deleteTrack.mutate(track.id);
    close();
  };

  return (
    <div className="track-menu" ref={wrapRef}>
      <button
        className="row-menu"
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <Icon name="more" style={{ width: 18, height: 18 }} />
      </button>

      {open && (
        <div className="menu" role="menu" onClick={(e) => e.stopPropagation()}>
          {mode === "root" && (
            <>
              <div className="menu__label">Add to playlist</div>
              <div className="menu__scroll">
                {(playlists ?? []).map((p) => (
                  <button key={p.id} className="menu__item" role="menuitem" onClick={() => addToPlaylist(p.id)}>
                    {p.name}
                  </button>
                ))}
                {(playlists ?? []).length === 0 && <div className="menu__empty">No playlists yet</div>}
              </div>
              <button className="menu__item" role="menuitem" onClick={() => setMode("newPlaylist")}>
                <Icon name="plus" style={{ width: 15, height: 15 }} /> New playlist…
              </button>
              {canDelete && (
                <>
                  <div className="menu__divider" />
                  <button
                    className="menu__item menu__item--danger"
                    role="menuitem"
                    onClick={() => setMode("confirmDelete")}
                  >
                    <Icon name="trash" style={{ width: 15, height: 15 }} /> Remove from library
                  </button>
                </>
              )}
            </>
          )}

          {mode === "newPlaylist" && (
            <form className="menu__form" onSubmit={createAndAdd}>
              <div className="menu__label">New playlist</div>
              <input
                className="menu__input"
                placeholder="Playlist name"
                value={name}
                autoFocus
                onChange={(e) => setName(e.target.value)}
              />
              <div className="menu__actions">
                <button type="button" className="ghost-btn" onClick={() => setMode("root")}>
                  Back
                </button>
                <button
                  type="submit"
                  className="upload-btn"
                  disabled={!name.trim() || createPlaylist.isPending || addTrack.isPending}
                >
                  <Icon name="check" style={{ width: 15, height: 15 }} /> Create &amp; add
                </button>
              </div>
            </form>
          )}

          {mode === "confirmDelete" && (
            <div className="menu__form">
              <div className="menu__label">Remove “{track.title}” from the library?</div>
              <div className="menu__actions">
                <button type="button" className="ghost-btn" onClick={() => setMode("root")}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="menu__item--danger upload-btn"
                  onClick={confirmDelete}
                  disabled={deleteTrack.isPending}
                >
                  <Icon name="trash" style={{ width: 15, height: 15 }} /> Delete
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
