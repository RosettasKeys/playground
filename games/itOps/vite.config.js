import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Relative asset paths. The cabinet is served from a deep GitHub Pages
  // subpath (/playground/games/itOps/), so absolute /assets/... would 404.
  base: './',
  plugins: [react()],
  server: {
    watch: {
      // A locked archive in the project root (vite.config.zip, not ours)
      // crashes chokidar with EBUSY on Windows if it gets watched.
      ignored: ['**/*.zip'],
    },
  },
})
