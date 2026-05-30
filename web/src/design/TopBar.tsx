/* OpenBeats — sticky top bar: history nav, search, upload, account */
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { Icon } from "./Icon";

function initials(name?: string): string {
  if (!name) return "··";
  const parts = name.trim().split(/\s+/);
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2);
  return letters.toUpperCase();
}

export function TopBar({
  query,
  onQueryChange,
  onUpload,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  onUpload: () => void;
}) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <header className="topbar">
      <div className="topbar__nav">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Back">
          <Icon name="chevronLeft" />
        </button>
        <button className="icon-btn" onClick={() => navigate(1)} aria-label="Forward">
          <Icon name="chevronRight" />
        </button>
      </div>
      <div className="search">
        <Icon name="search" />
        <input
          placeholder="Search songs, albums, artists…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={() => navigate("/search")}
        />
      </div>
      <div className="topbar__spacer" />
      <button className="upload-btn" onClick={onUpload}>
        <Icon name="upload" /> Upload
      </button>
      <button className="icon-btn" onClick={logout} aria-label="Log out" title="Log out">
        <Icon name="logout" />
      </button>
      <div className="avatar" title={user?.username}>
        {initials(user?.username)}
      </div>
    </header>
  );
}
