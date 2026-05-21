import { defineConfig, devices } from "@playwright/test";

// The backend serves the built frontend AND the API on the same origin (:8000),
// so e2e tests run against one URL with no CORS/proxy juggling. The backend is
// built, seeded, and started by global-setup.ts (and stopped by
// global-teardown.ts) rather than Playwright's `webServer`: spawning uvicorn via
// webServer left SQLite writes failing with "attempt to write a readonly
// database", which managing the process ourselves avoids.
const BASE_URL = "http://127.0.0.1:8000";

export default defineConfig({
  testDir: "./e2e",
  // Shared backend DB state across specs → run serially.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  // Serial tests share backend DB state; retry to absorb transient timing
  // flakes (async data loads, navigation races) rather than failing the run.
  retries: process.env.CI ? 2 : 1,
  reporter: "list",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
