import { create } from "zustand";
import type { User } from "../api/types";

// SECURITY NOTE: The JWT is intentionally kept only in memory (Zustand store),
// not in localStorage, to reduce the XSS token-theft surface. The trade-off is
// that a full page reload loses the session and the user must log in again.
// For a production deployment that needs persistent sessions, switch to an
// httpOnly, Secure, SameSite cookie issued by the backend instead.
interface AuthState {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  login: (token, user) => set({ token, user }),
  logout: () => set({ token: null, user: null }),
}));

// Non-reactive accessor for use outside React (e.g. axios interceptors).
export const getToken = (): string | null => useAuthStore.getState().token;
