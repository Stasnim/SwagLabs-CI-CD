import { type Page, type Locator, expect } from "@playwright/test";
import type { CheckoutInfo } from "../types";

export class CheckoutPage {
  // Step 1
  readonly firstNameInput:  Locator;
  readonly lastNameInput:   Locator;
  readonly postalCodeInput: Locator;
  readonly continueButton:  Locator;
  readonly cancelButton:    Locator;
  readonly errorMessage:    Locator;

  // Step 2
  readonly finishButton:  Locator;
  readonly subtotalLabel: Locator;
  readonly taxLabel:      Locator;
  readonly totalLabel:    Locator;

  // Complete
  readonly confirmationHeader: Locator;
  readonly backHomeButton:     Locator;

  constructor(private readonly page: Page) {
    this.firstNameInput     = page.locator('[data-test="firstName"]');
    this.lastNameInput      = page.locator('[data-test="lastName"]');
    this.postalCodeInput    = page.locator('[data-test="postalCode"]');
    this.continueButton     = page.locator('[data-test="continue"]');
    this.cancelButton       = page.locator('[data-test="cancel"]');
    this.errorMessage       = page.locator('[data-test="error"]');
    this.finishButton       = page.locator('[data-test="finish"]');
    this.subtotalLabel      = page.locator(".summary_subtotal_label");
    this.taxLabel           = page.locator(".summary_tax_label");
    this.totalLabel         = page.locator(".summary_total_label");
    this.confirmationHeader = page.locator(".complete-header");
    this.backHomeButton     = page.locator('[data-test="back-to-products"]');
  }

  // ─── Step 1 actions ───────────────────────────────────────────────────────

  async fillInfo(info: CheckoutInfo): Promise<void> {
    await this.firstNameInput.fill(info.firstName);
    await this.lastNameInput.fill(info.lastName);
    await this.postalCodeInput.fill(info.postalCode);
  }

  /*async continue(): Promise<void> {
    await this.continueButton.click();
    await expect(this.page).toHaveURL(/checkout-step-two/);
  }*/
 async continue(): Promise<void> {
    await this.continueButton.click();
   
  }

  async getErrorMessage(): Promise<string> {
    await expect(this.errorMessage).toBeVisible();
    return (await this.errorMessage.textContent()) ?? "";
  }

  // ─── Step 2 actions ───────────────────────────────────────────────────────

  async finish(): Promise<void> {
    await this.finishButton.click();
    await expect(this.page).toHaveURL(/checkout-complete/);
  }

  // ─── Composite ────────────────────────────────────────────────────────────

  async completeCheckout(info: CheckoutInfo): Promise<void> {
    await this.fillInfo(info);
    await this.continue();
    await this.finish();
  }

  // ─── Queries ──────────────────────────────────────────────────────────────

  async getSubtotal(): Promise<number> {
    return this.extractPrice(await this.subtotalLabel.textContent());
  }

  async getTax(): Promise<number> {
    return this.extractPrice(await this.taxLabel.textContent());
  }

  async getTotal(): Promise<number> {
    return this.extractPrice(await this.totalLabel.textContent());
  }

  async getConfirmationHeader(): Promise<string> {
    return (await this.confirmationHeader.textContent()) ?? "";
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private extractPrice(text: string | null): number {
    return parseFloat((text ?? "0").replace(/[^0-9.]/g, ""));
  }
}
