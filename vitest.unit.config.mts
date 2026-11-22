// Vitest voor de gewone tests (tests/unit): pure functies, zonder emulator.
// De regeltests hebben hun eigen configuratie in vitest.config.mts.
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Dezelfde afkorting als in tsconfig.json: "@/lib/..." is "src/lib/...".
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
  },
});
