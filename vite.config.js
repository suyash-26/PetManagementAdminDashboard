import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Port 5174, not Vite's default 5173 — the user dashboard already owns 5173 and both
// apps are routinely run side by side. Note the Core backend's CORS allowlist
// (SecurityConfig.corsConfigurationSource) must include this origin or every call
// from here fails the preflight.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
  },
})
