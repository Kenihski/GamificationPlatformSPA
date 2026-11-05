import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// During local development, keep React requests same-origin and proxy API and
// uploaded/default image paths to the ASP.NET Core API (http launch profile).
// A deployed frontend may instead set VITE_API_BASE_URL explicitly.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5116',
        changeOrigin: true,
      },
      '/images': {
        target: 'http://localhost:5116',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5116',
        changeOrigin: true,
      },
    },
  },
})
