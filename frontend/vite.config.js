import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // Port your Python backend runs on (FastAPI/Flask/Django)
        changeOrigin: true,
      },
    },
  },
});