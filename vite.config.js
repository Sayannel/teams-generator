import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/applications/teams-generator/' : '/teams-generator/',
  plugins: [react()],
}))
