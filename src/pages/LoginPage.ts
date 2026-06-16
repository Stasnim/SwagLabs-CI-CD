import { type Page, type Locator, expect } from "@playwright/test";
import type { User } from "../types";

export class LoginPage {
  readonly usernameInput:      Locator;
  readonly passwordInput:      Locator;
  readonly loginButton:        Locator;
  readonly errorMessage:       Locator;
  readonly errorDismissButton: Locator;

  constructor(private readonly page: Page) {
    this.usernameInput      = page.locator('[data-test="username"]');
    this.passwordInput      = page.locator('[data-test="password"]');
    this.loginButton        = page.locator('[data-test="login-button"]');
    this.errorMessage       = page.locator('[data-test="error"]');
    this.errorDismissButton = page.locator('[data-test="error-button"]');
  }

  async goto(): Promise<void> {
    await this.page.goto("/");
    await expect(this.loginButton).toBeVisible();
  }

  /** Fills credentials and clicks Login. Does NOT assert success — caller decides. */
  async login(user: User): Promise<void> {
    await this.usernameInput.fill(user.username);
    await this.passwordInput.fill(user.password);
    await this.loginButton.click();
  }

  /** Logs in and asserts redirect to inventory. */
  async loginSuccessfully(user: User): Promise<void> {
    await this.login(user);
    await expect(this.page).toHaveURL(/inventory/);
  }

  async getErrorMessage(): Promise<string> {
    await expect(this.errorMessage).toBeVisible();
    return (await this.errorMessage.textContent()) ?? "";
  }

  async dismissError(): Promise<void> {
    await this.errorDismissButton.click();
    await expect(this.errorMessage).not.toBeVisible();
  }
}
