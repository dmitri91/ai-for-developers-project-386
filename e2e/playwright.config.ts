import { defineConfig, devices } from "@playwright/test";

const REUSE_SERVERS = !process.env.CI;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: [
    {
      command: "node ../backend/src/index.js",
      url: "http://localhost:4010/event-types",
      reuseExistingServer: REUSE_SERVERS,
      stdout: "ignore",
    },
    {
      command: "npm --prefix ../front run dev",
      url: "http://localhost:5173",
      reuseExistingServer: REUSE_SERVERS,
    },
  ],
});