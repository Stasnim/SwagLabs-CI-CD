/**
 * Login tests — always start from a clean unauthenticated page.
 */
import { test, expect } from "@playwright/test";
import { LoginPage } from "../../src/pages/LoginPage";
import { InventoryPage } from "../../src/pages/InventoryPage";
import { USERS } from "../../src/fixtures/users";

// Override any project-level storageState — login tests need a fresh session.
test.use({ storageState: { cookies: [], origins: [] } });

// ─── Page rendering ───────────────────────────────────────────────────────────

test("login page renders correctly", async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();

  await expect(page.locator(".login_logo")).toBeVisible();
  await expect(login.usernameInput).toBeVisible();
  await expect(login.passwordInput).toBeVisible();
  await expect(login.loginButton).toHaveText("Login");
  await expect(login.passwordInput).toHaveAttribute("type", "password");
});

// ─── standard_user @standard ──────────────────────────────────────────────────

test.describe("standard_user @standard", () => {
  test("logs in and lands on inventory", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.loginSuccessfully(USERS.standard_user);
    await expect(page.locator('[data-test="title"]')).toHaveText("Products");
  });

  test("session persists after page reload", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.loginSuccessfully(USERS.standard_user);
    await page.reload();
    await expect(page).toHaveURL(/inventory/);
  });

  test("already logged-in user is redirected away from login page", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.loginSuccessfully(USERS.standard_user);
    await page.goto("/inventory.html");
    await expect(page).toHaveURL(/inventory/);
    await expect(page.locator('[data-test="title"]')).toHaveText("Products");
  });

  test("submits with Enter key", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.usernameInput.fill(USERS.standard_user.username);
    await login.passwordInput.fill(USERS.standard_user.password);
    await login.passwordInput.press("Enter");
    await expect(page).toHaveURL(/inventory/);
  });

  test("can log in again after logging out", async ({ page }) => {
    const login = new LoginPage(page);
    const inv   = new InventoryPage(page);

    // First login
    await login.goto();
    await login.loginSuccessfully(USERS.standard_user);

    // Logout
    await inv.logout();
    await expect(page).toHaveURL(/saucedemo\.com\/?$/);

    // Login again
    await login.loginSuccessfully(USERS.standard_user);
    await expect(page).toHaveURL(/inventory/);
  });
});

// ─── locked_out_user @locked ──────────────────────────────────────────────────

test.describe("locked_out_user @locked", () => {
  test("login is rejected with error message", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(USERS.locked_out_user);
    await expect(page).not.toHaveURL(/inventory/);
    expect(await login.getErrorMessage()).toContain("locked out");
  });

  test("error message can be dismissed", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(USERS.locked_out_user);
    await login.dismissError();
    await expect(login.errorMessage).not.toBeVisible();
  });

  test("direct navigation to inventory is blocked", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(USERS.locked_out_user);
    await page.goto("/inventory.html");
    await expect(login.loginButton).toBeVisible();
  });
});

// ─── Validation edge cases ────────────────────────────────────────────────────

test.describe("validation", () => {
  let login: LoginPage;

  test.beforeEach(async ({ page }) => {
    login = new LoginPage(page);
    await login.goto();
  });

  test("wrong password shows credential error", async () => {
    await login.login({ username: "standard_user", password: "wrong_password" });
    expect(await login.getErrorMessage()).toContain("Username and password do not match");
  });

  test("empty username shows validation error", async () => {
    await login.usernameInput.fill("");
    await login.passwordInput.fill("secret_sauce");
    await login.loginButton.click();
    expect(await login.getErrorMessage()).toContain("Username is required");
  });

  test("empty password shows validation error", async () => {
    await login.usernameInput.fill("standard_user");
    await login.passwordInput.fill("");
    await login.loginButton.click();
    expect(await login.getErrorMessage()).toContain("Password is required");
  });
});

// ─── problem_user @problem ────────────────────────────────────────────────────

test.describe("problem_user @problem", () => {
  test("logs in successfully", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.loginSuccessfully(USERS.problem_user);
    await expect(page).toHaveURL(/inventory/);
  });

  test("can log in again after logging out", async ({ page }) => {
    const login = new LoginPage(page);
    const inv   = new InventoryPage(page);

    await login.goto();
    await login.loginSuccessfully(USERS.problem_user);
    await inv.logout();
    await login.loginSuccessfully(USERS.problem_user);
    await expect(page).toHaveURL(/inventory/);
  });
});

// ─── performance_glitch_user @performance ─────────────────────────────────────

test.describe("performance_glitch_user @performance", () => {
  test("logs in within extended timeout", async ({ page }) => {
    const TIMEOUT = parseInt(process.env.PERFORMANCE_LOGIN_TIMEOUT ?? "15000", 10);
    const login   = new LoginPage(page);
    await login.goto();

    const start = Date.now();
    await login.login(USERS.performance_glitch_user);
    await expect(page).toHaveURL(/inventory/, { timeout: TIMEOUT });

    const elapsed = Date.now() - start;
    console.log(`performance_glitch_user login: ${elapsed}ms`);
    expect(elapsed, `Login must complete within ${TIMEOUT}ms`).toBeLessThan(TIMEOUT);
  });

  test("can log in again after logging out", async ({ page }) => {
    const TIMEOUT = parseInt(process.env.PERFORMANCE_LOGIN_TIMEOUT ?? "15000", 10);
    const login   = new LoginPage(page);
    const inv     = new InventoryPage(page);

    await login.goto();
    await login.login(USERS.performance_glitch_user);
    await expect(page).toHaveURL(/inventory/, { timeout: TIMEOUT });

    await inv.logout();

    await login.login(USERS.performance_glitch_user);
    await expect(page).toHaveURL(/inventory/, { timeout: TIMEOUT });
  });
});
