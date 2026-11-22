// Vitest voor de regeltests (tests/rules). Draait tegen de Firebase-emulators via
// `npm run test:rules`; `firebase emulators:exec` zet de adressen in de omgeving.
// Elk testbestand gebruikt een eigen project-id, dus de bestanden mogen parallel lopen.
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Dezelfde afkorting als in tsconfig.json; opslag.test.ts laadt code uit src.
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/rules/**/*.test.ts"],
    // Eén bestand tegelijk: de emulators delen hun toestand.
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});
