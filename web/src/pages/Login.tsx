import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { LoginResponse } from "../api/types";
import { useAuthStore } from "../store/auth";
import { BrandMark } from "../design/Sidebar";

export function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post<LoginResponse>("/api/auth/login", {
        username,
        password,
      });
      login(data.token, data.user);
      navigate("/");
    } catch {
      setError("Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <div className="login__bg" />
      <form className="login__card" onSubmit={submit}>
        <div className="login__brand">
          <BrandMark size={40} glyph={22} />
          <div className="brand__name" style={{ fontSize: 22 }}>
            Open<b>Beats</b>
          </div>
        </div>
        <div className="login__title">Welcome back</div>
        <div className="login__sub">Sign in to your music server.</div>
        <div className="field">
          <label htmlFor="login-username">Username</label>
          <input
            id="login-username"
            value={username}
            autoFocus
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="login__error">{error}</p>}
        <button className="login__submit" type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
