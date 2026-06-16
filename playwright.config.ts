import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config();

// Auth state files written once by the setup project, reused by all tests.
export const AUTH = {
  standard_user:           ".auth/standard_user.json",
  problem_user:            ".auth/problem_user.json",
  performance_glitch_user: ".auth/performance_glitch_user.json",
} as const;

export default defineConfig({
  testDir: "./tests",

  // SauceDemo auth lives in localStorage per browser context — parallel is safe.
  fullyParallel: true,

  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 3 : undefined,

  timeout: 30_000,
  expect:  { timeout: 8_000 },

  reporter: [
    ["list"],
    ["html", { outputFolder: "reports/html", open: "never" }],
  ],

  use: {
    baseURL:           process.env.BASE_URL ?? "https://www.saucedemo.com",
    headless:          true,
    screenshot:        "only-on-failure",
    video:             "retain-on-failure",
    trace:             "retain-on-failure",
    actionTimeout:     10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    
    {
      name: "setup",
      testMatch: /setup\/auth\.setup\.ts/,
      fullyParallel: true,
    },

    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
      dependencies: ["setup"],
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
      dependencies: ["setup"],
    },
  ],
});
