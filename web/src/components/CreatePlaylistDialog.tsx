import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreatePlaylist } from "../hooks/usePlaylists";
import { Icon } from "../design/Icon";

export function CreatePlaylistDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const create = useCreatePlaylist();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const playlist = await create.mutateAsync(name.trim());
    onClose();
    navigate(`/playlist/${playlist.id}`);
  };

  return (
    <div className="backdrop" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="modal__head">
          <div className="modal__title">New playlist</div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="playlist-name">Name</label>
          <input
            id="playlist-name"
            placeholder="My playlist"
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        {create.isError && <p className="login__error">Could not create playlist.</p>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button type="button" className="ghost-btn" style={{ height: 42 }} onClick={onClose}>
            Cancel
          </button>
          <button className="upload-btn" type="submit" disabled={!name.trim() || create.isPending}>
            <Icon name="check" /> {create.isPending ? "Creating…" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
