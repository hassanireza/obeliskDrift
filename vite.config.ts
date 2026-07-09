import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Base path matches the GitHub Pages repo name.
// Override at build time with VITE_BASE_PATH if the repo is renamed.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH ?? "/obeliskDrift/",
});
