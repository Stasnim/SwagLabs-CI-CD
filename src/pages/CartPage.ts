import { type Page, type Locator, expect } from "@playwright/test";

export class CartPage {
  readonly cartItems:              Locator;
  readonly continueShoppingButton: Locator;
  readonly checkoutButton:         Locator;

  constructor(private readonly page: Page) {
    this.cartItems              = page.locator(".cart_item");
    this.continueShoppingButton = page.locator('[data-test="continue-shopping"]');
    this.checkoutButton         = page.locator('[data-test="checkout"]');
  }

  async goto(): Promise<void> {
    await this.page.goto("/cart.html");
    await expect(this.page.locator(".title")).toHaveText("Your Cart");
  }

  // ─── Actions ──────────────────────────────────────────────────────────────

  async removeItem(productName: string): Promise<void> {
    await this.itemByName(productName)
      .locator('[data-test^="remove"]')
      .click();
  }

  async continueShopping(): Promise<void> {
    await this.continueShoppingButton.click();
    await expect(this.page).toHaveURL(/inventory/);
  }

  async proceedToCheckout(): Promise<void> {
    await this.checkoutButton.click();
    await expect(this.page).toHaveURL(/checkout-step-one/);
  }

  // ─── Queries ──────────────────────────────────────────────────────────────

  async getItemNames(): Promise<string[]> {
    return this.page.locator(".cart_item .inventory_item_name").allTextContents();
  }

  async getItemCount(): Promise<number> {
    return this.cartItems.count();
  }

  async getItemPrice(productName: string): Promise<number> {
    const text = await this.itemByName(productName)
      .locator(".inventory_item_price")
      .textContent();
    return parseFloat((text ?? "0").replace("$", ""));
  }

  async getItemQuantity(productName: string): Promise<number> {
    const text = await this.itemByName(productName)
      .locator(".cart_quantity")
      .textContent();
    return parseInt(text ?? "0", 10);
  }

  async isEmpty(): Promise<boolean> {
    return (await this.cartItems.count()) === 0;
  }

  async hasItem(productName: string): Promise<boolean> {
    return (await this.itemByName(productName).count()) > 0;
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private itemByName(name: string): Locator {
    return this.cartItems.filter({
      has: this.page.locator(".inventory_item_name", { hasText: name }),
    });
  }
}
