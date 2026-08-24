import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // In the cluster Traefik routes /api to the Python service. Locally, point
    // this at wherever you run it so the app stays same-origin either way.
    proxy: {
      '/api': {
        target: process.env.API_ORIGIN ?? 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
