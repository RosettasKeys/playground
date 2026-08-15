import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    // The portfolio reserves a bare index.html for its root hub; every stub
    // site is <concept>-index.html.  The singlefile plugin follows the input
    // basename, so the build emits dist/thresholds-index.html.
    rollupOptions: {
      input: path.resolve(__dirname, "thresholds-index.html"),
    },
  },
});
