import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  // WICHTIG: Erlaubt korrekte Pfade auf deiner Subdomain
  root: "src/web",
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
      "@": path.resolve(__dirname, "./src/web"),
    },
  },
  build: {
    outDir: "../../dist",
    emptyOutDir: true,
    
    // ÄNDERUNG: Wir entfernen 'esbuild' als Minifier, da Vite 8 
    // standardmäßig 'terser' oder den internen 'oxc'/'rolldown' Weg nutzt.
    // Wenn du es weglässt, nutzt Vite den stabilsten Standard für v8.
    minify: true, 
    
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
