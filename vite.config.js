import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/applications/teams-generator/' : '/teams-generator/',
  plugins: [react()],
  server: {
    // Proxies to the local tg-php container serving server/ on
    // 127.0.0.1:8080 (see CLAUDE.md) so `fetch('/api/...')` works during
    // `npm run dev`.
    proxy: {
      '/api': { target: 'http://127.0.0.1:8080', changeOrigin: true },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.js',
  },
}))
