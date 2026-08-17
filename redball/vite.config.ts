import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: ".pages-src",
  base: "/redball/",
  publicDir: false,
  plugins: [react()],
  build: {
    outDir: "../.pages-build",
    emptyOutDir: true,
  },
});
