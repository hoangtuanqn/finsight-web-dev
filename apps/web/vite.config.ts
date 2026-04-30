import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true,
    watch: {
      usePolling: true,
      interval: 300,
    },
    hmr: {
      host: "localhost",
      port: 5173,
    },
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY || "http://127.0.0.1:5001",
        changeOrigin: true,
      },
    },
  },
});
