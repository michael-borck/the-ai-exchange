import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import pkg from "./package.json";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "terser",
    rollupOptions: {
      output: {
        // React + Chakra + emotion + framer-motion form a tightly coupled
        // graph; splitting them apart produces circular chunks. Keep them in
        // one cacheable ui-vendor chunk. The real payload win comes from
        // route-level code splitting (lazy pages in App.tsx), which keeps
        // admin/export/create code out of the anonymous landing's download.
        manualChunks: {
          "ui-vendor": [
            "react",
            "react-dom",
            "@chakra-ui/react",
            "@emotion/react",
            "@emotion/styled",
            "framer-motion",
          ],
          "query-vendor": ["@tanstack/react-query"],
        },
      },
    },
  },
});
