import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Web dev server proxies API-by-contract requests to the backend
// (default: Prism mock on http://localhost:4010).
const BACKEND = process.env.VITE_API_BASE_URL ?? "http://localhost:4010";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/event-types": { target: BACKEND, changeOrigin: true },
      "/bookings": { target: BACKEND, changeOrigin: true },
      "/admin": { target: BACKEND, changeOrigin: true },
    },
  },
});