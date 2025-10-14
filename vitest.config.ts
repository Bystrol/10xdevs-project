/// <reference types="vitest" />
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    // Configure jsdom for DOM testing
    environment: "jsdom",
    // Make expect, describe, it etc. globally available
    globals: true,
    // Test file patterns
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    // Global test setup file
    setupFiles: ["./src/test/setup.ts"],
    // TypeScript configuration
    typecheck: {
      tsconfig: "./tsconfig.json",
    },
  },
  // Path resolution for imports
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
