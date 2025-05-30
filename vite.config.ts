import { defineConfig } from "vite";
import { defineConfig as defineVitestConfig } from "vitest/config";

export default defineConfig({
  build: {
    target: "esnext",
    outDir: "dist",
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
    },
    rollupOptions: {
      external: [],
    },
  },

  test: {
    environment: "jsdom",
  },
});

const vitestConfig = defineVitestConfig({
  test: {
    environment: "jsdom",
  },
});

export { vitestConfig };
