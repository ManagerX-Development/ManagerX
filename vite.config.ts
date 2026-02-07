import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  // WICHTIG: Erlaubt korrekte Pfade auf deiner Subdomain
  root: "src/web",
  // WICHTIG: Erlaubt korrekte Pfade auf deiner Subdomain
  base: "/",

  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react()
  ],
  publicDir: "../../public",
  resolve: {
    alias: {
      // Dein Alias zeigt auf . (jetzt src/web)
      "@": path.resolve(__dirname, "src/web"),
    },
  },
  build: {
    // Stellt sicher, dass der Output-Ordner 'dist' heißt (passend zur deploy.yml)
    outDir: "../../dist",
    emptyOutDir: true,
    // Optimierung für sauberen Code
    minify: "esbuild",
    reportCompressedSize: false,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "src/web/index.html"),
        datenschutz: path.resolve(__dirname, "src/web/datenschutz.html"),
        impressum: path.resolve(__dirname, "src/web/impressum.html"),
        agb: path.resolve(__dirname, "src/web/agb.html"),
      },
    },
  },
}));