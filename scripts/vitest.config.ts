import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["seed/**/*.spec.ts", "seed/**/*.test.ts"],
    // Use the scripts tsconfig for path resolution
    typecheck: {
      tsconfig: "./tsconfig.json",
    },
  },
});