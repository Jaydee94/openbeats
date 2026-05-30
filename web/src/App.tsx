import { useState } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { Sidebar } from "./design/Sidebar";
import { TopBar } from "./design/TopBar";
import { PlayerBar } from "./design/PlayerBar";
import { NowPlaying } from "./design/NowPlaying";
import { UploadDialog } from "./components/UploadDialog";
import { CreatePlaylistDialog } from "./components/CreatePlaylistDialog";
import { Home } from "./pages/Home";
import { Library } from "./pages/Library";
import { Search } from "./pages/Search";
import { AlbumView, PlaylistView } from "./pages/Collection";
import { Login } from "./pages/Login";
import { usePlaylists } from "./hooks/usePlaylists";
import { useLibrary } from "./hooks/useLibrary";
import { usePlayerStore } from "./store/player";
import { useAuthStore } from "./store/auth";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const location = useLocation();
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

// Cosmetic storage gauge: total runtime against a nominal 50-hour shelf.
function storagePercent(totalSeconds: number): number {
  return Math.min(100, (totalSeconds / (50 * 3600)) * 100);
}

function Shell() {
  const [query, setQuery] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const { data: playlists } = usePlaylists();
  const { tracks } = useLibrary();
  const npOpen = usePlayerStore((s) => s.npOpen);
  const hasTrack = usePlayerStore((s) => s.queue.length > 0);

  const totalSeconds = tracks.reduce((sum, t) => sum + t.duration_seconds, 0);

  return (
    <div className="app">
      <Sidebar
        playlists={playlists ?? []}
        storagePct={storagePercent(totalSeconds)}
        onNewPlaylist={() => setShowCreate(true)}
      />
      <main className="main">
        <TopBar query={query} onQueryChange={setQuery} onUpload={() => setShowUpload(true)} />
        <Outlet context={{ query }} />
      </main>
      <PlayerBar />

      {npOpen && hasTrack && <NowPlaying />}
      {showUpload && <UploadDialog onClose={() => setShowUpload(false)} />}
      {showCreate && <CreatePlaylistDialog onClose={() => setShowCreate(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <Shell />
          </RequireAuth>
        }
      >
        <Route index element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/library" element={<Library />} />
        <Route path="/album/:id" element={<AlbumView />} />
        <Route path="/playlist/:id" element={<PlaylistView />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
