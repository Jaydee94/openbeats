import { NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Player } from "./components/Player";
import { Library } from "./pages/Library";
import { Login } from "./pages/Login";
import { Playlists } from "./pages/Playlists";
import { useAuthStore } from "./store/auth";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const location = useLocation();
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

function Shell({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  return (
    <div className="app">
      <nav className="topnav">
        <span className="brand">
          <img src="/logo.svg" alt="OpenBeats" height={28} />
        </span>
        <NavLink to="/" end>
          Library
        </NavLink>
        <NavLink to="/playlists">Playlists</NavLink>
        <span className="spacer" />
        {user && <span className="user">{user.username}</span>}
        <button onClick={logout}>Logout</button>
      </nav>
      <main className="content">{children}</main>
      <Player />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Shell>
              <Library />
            </Shell>
          </RequireAuth>
        }
      />
      <Route
        path="/playlists"
        element={
          <RequireAuth>
            <Shell>
              <Playlists />
            </Shell>
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
