import axios from "axios";
import { getToken, useAuthStore } from "../store/auth";

// Empty base => same-origin (production behind nginx). In dev, Vite proxies /api.
export const API_BASE = import.meta.env.VITE_API_URL ?? "";

export const api = axios.create({
  baseURL: API_BASE,
});

// Attach the in-memory JWT to every request.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401 the token is stale/invalid — drop it so the UI redirects to login.
api.interceptors.response.use(
  (resp) => resp,
  (error) => {
    if (error?.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

// Build an authenticated URL for media elements (<audio>/<img>) that cannot
// set an Authorization header. The backend accepts the token as a query param.
export function mediaUrl(path: string): string {
  const token = getToken();
  const base = `${API_BASE}${path}`;
  return token ? `${base}?token=${encodeURIComponent(token)}` : base;
}
