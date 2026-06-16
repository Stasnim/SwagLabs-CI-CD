import { type Page, type Locator, expect } from "@playwright/test";

export class ProductDetailPage {
  readonly productName: Locator;
  readonly productDescription: Locator;
  readonly productPrice: Locator;
  readonly productImage: Locator;
  readonly addToCartButton: Locator;
  readonly removeButton: Locator;
  readonly backButton: Locator;

  constructor(private readonly page: Page) {
    this.productName = page.locator('[data-test="inventory-item-name"]');
    this.productDescription = page.locator('[data-test="inventory-item-desc"]');
    this.productPrice = page.locator('[data-test="inventory-item-price"]');
    this.productImage = page.locator('[data-test="item-sauce-labs-backpack-img"]').or(
      page.locator(".inventory_details_img"));
    this.addToCartButton = page.locator('[data-test^="add-to-cart"]');
    this.removeButton = page.locator('[data-test^="remove"]');
    this.backButton = page.locator('[data-test="back-to-products"]');
  }

  async waitForPageReady(): Promise<void> {
    await expect(this.page).toHaveURL(/inventory-item/);
    await expect(this.productName).toBeVisible();
  }

  // ─── Actions ──────────────────────────────────────────────────────────────

  async addToCart(): Promise<void> {
    await this.addToCartButton.click();
  }

  async removeFromCart(): Promise<void> {
    await this.removeButton.click();
  }

  async goBack(): Promise<void> {
    await this.backButton.click();
    await expect(this.page).toHaveURL(/inventory\.html/);
  }

  // ─── Queries ──────────────────────────────────────────────────────────────

  async getName(): Promise<string> {
    return (await this.productName.textContent())?.trim() ?? "";
  }

  async getDescription(): Promise<string> {
    return (await this.productDescription.textContent())?.trim() ?? "";
  }

  async getPrice(): Promise<number> {
    const text = await this.productPrice.textContent();
    return parseFloat((text ?? "0").replace("$", ""));
  }

  async isImageLoaded(): Promise<boolean> {
    const img = this.page.locator(".inventory_details_img");
    const w = await img.evaluate((el) => (el as HTMLImageElement).naturalWidth);
    return w > 0;
  }

  async isAddToCartVisible(): Promise<boolean> {
    return this.addToCartButton.isVisible();
  }

  async isRemoveButtonVisible(): Promise<boolean> {
    return this.removeButton.isVisible();
  }

  async getCartBadgeCount(): Promise<number | null> {
    const badge = this.page.locator('[data-test="shopping-cart-badge"]');
    if (!(await badge.isVisible())) return null;
    return parseInt((await badge.textContent()) ?? "0", 10);
  }
}
