/**
 * Auth setup — runs ONCE before all test projects.
 *
 * Logs in each user and saves their localStorage to disk.
 * Tests load the saved state instead of logging in every time.
 * locked_out_user has no auth state — always tested from the login form.
 */
import { test as setup, expect } from "@playwright/test";
import { USERS } from "../../src/fixtures/users";
import { AUTH } from "../../playwright.config";
import fs from "fs";

// Ensure .auth directory exists
fs.mkdirSync(".auth", { recursive: true });

const BASE = process.env.BASE_URL ?? "https://www.saucedemo.com";
const PERF_TIMEOUT = parseInt(process.env.PERFORMANCE_LOGIN_TIMEOUT ?? "15000", 10);

async function loginAndSave(
  page: import("@playwright/test").Page,
  username: string,
  password: string,
  stateFile: string,
  timeout = 10_000
): Promise<void> {
  await page.goto(BASE);
  await page.locator('[data-test="username"]').fill(username);
  await page.locator('[data-test="password"]').fill(password);
  await page.locator('[data-test="login-button"]').click();
  await expect(page).toHaveURL(/inventory/, { timeout });
  await page.context().storageState({ path: stateFile });
}

setup("save standard_user auth", async ({ page }) => {
  const u = USERS.standard_user;
  await loginAndSave(page, u.username, u.password, AUTH.standard_user);
});

setup("save problem_user auth", async ({ page }) => {
  const u = USERS.problem_user;
  await loginAndSave(page, u.username, u.password, AUTH.problem_user);
});

setup("save performance_glitch_user auth", async ({ page }) => {
  const u = USERS.performance_glitch_user;
  await loginAndSave(page, u.username, u.password, AUTH.performance_glitch_user, PERF_TIMEOUT);
});
