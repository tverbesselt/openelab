/*
 * Rooktests (tests/e2e) tegen `next dev` en de Firebase-emulators.
 *
 * Draaien met `npm run test:e2e`: firebase emulators:exec start Firestore en Auth, zet hun
 * adressen in de omgeving, en dit bestand start de app op poort 3100 met verzonnen
 * Firebase-waarden die naar die emulators wijzen. Er wordt niets echts geraakt.
 */
import { defineConfig, devices } from "@playwright/test";

const POORT = 3100;
const FIRESTORE = process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8089";
const AUTH = (process.env.FIREBASE_AUTH_EMULATOR_HOST ?? "127.0.0.1:9099").replace(/^https?:\/\//, "");

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: `http://localhost:${POORT}`,
    trace: "retain-on-failure",
    locale: "nl-BE",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx next dev --port ${POORT}`,
    url: `http://localhost:${POORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_FIREBASE_API_KEY: "emulator",
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "localhost",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-open-elab",
      NEXT_PUBLIC_FIREBASE_APP_ID: "1:0:web:emulator",
      NEXT_PUBLIC_FIRESTORE_DATABASE: "",
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "",
      NEXT_PUBLIC_FIRESTORE_EMULATOR: FIRESTORE,
      NEXT_PUBLIC_AUTH_EMULATOR: AUTH,
      OPENAI_API_KEY: "",
    },
  },
});
