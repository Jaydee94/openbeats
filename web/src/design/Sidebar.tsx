/* OpenBeats — left navigation rail */
import { NavLink, useNavigate, useParams } from "react-router-dom";
import type { Playlist } from "../api/types";
import { coverFor } from "./palette";
import { Cover } from "./Cover";
import { Icon } from "./Icon";

const BrandMark = ({ size = 34, glyph = 19 }: { size?: number; glyph?: number }) => (
  <div className="brand__mark" style={{ width: size, height: size }}>
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: glyph, height: glyph }}
    >
      <path d="M4 13h2l2-6 3 12 2.5-8 1.5 4h3" />
    </svg>
  </div>
);

export { BrandMark };

export function Sidebar({
  playlists,
  storagePct,
  onNewPlaylist,
}: {
  playlists: Playlist[];
  storagePct: number;
  onNewPlaylist: () => void;
}) {
  const navigate = useNavigate();
  const { id: activeId } = useParams();

  const navClass = ({ isActive }: { isActive: boolean }) => "nav__item" + (isActive ? " active" : "");

  return (
    <aside className="sidebar">
      <div className="brand">
        <BrandMark />
        <div className="brand__name">
          Open<b>Beats</b>
        </div>
      </div>

      <nav className="nav">
        <NavLink to="/" end className={navClass}>
          <Icon name="home" /> Home
        </NavLink>
        <NavLink to="/search" className={navClass}>
          <Icon name="search" /> Search
        </NavLink>
        <NavLink to="/library" className={navClass}>
          <Icon name="library" /> Library
        </NavLink>
      </nav>

      <div className="side-section">
        <div className="side-section__head">
          <span>Playlists</span>
          <button onClick={onNewPlaylist} aria-label="New playlist">
            <Icon name="plus" />
          </button>
        </div>
        <div className="playlist-list">
          {playlists.map((p) => {
            const { pal, motif } = coverFor(`playlist::${p.id}`);
            return (
              <div
                key={p.id}
                className={"playlist-list__item" + (activeId === p.id ? " active" : "")}
                onClick={() => navigate(`/playlist/${p.id}`)}
              >
                <Cover className="playlist-list__swatch" pal={pal} motif={motif} radius={6} />
                <span>{p.name}</span>
              </div>
            );
          })}
          {playlists.length === 0 && (
            <div className="playlist-list__item" style={{ cursor: "default" }}>
              <span style={{ color: "var(--faint)" }}>No playlists yet</span>
            </div>
          )}
        </div>
      </div>

      <div className="side-foot">
        <div className="storage">
          <div className="storage__bar">
            <div className="storage__fill" style={{ width: `${Math.min(100, storagePct)}%` }} />
          </div>
          <div className="storage__label">
            <span>Library</span>
            <span>{Math.round(storagePct)}%</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
