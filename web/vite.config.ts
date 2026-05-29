import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// During development the frontend dev server proxies /api and /healthz to the
// Go backend so the browser can use same-origin requests.
const proxyTarget = "http://localhost:8080";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": { target: proxyTarget, changeOrigin: true },
      "/healthz": { target: proxyTarget, changeOrigin: true },
    },
  },
});
