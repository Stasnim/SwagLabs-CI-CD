import { type Page, type Locator, expect } from "@playwright/test";
import type { Product, SortOption } from "../types";

export class InventoryPage {
  readonly inventoryList:  Locator;
  readonly sortDropdown:   Locator;
  readonly cartBadge:      Locator;
  readonly cartLink:       Locator;
  readonly burgerMenu:     Locator;
  readonly resetStateLink: Locator;
  readonly closeMenuBtn:   Locator;
  readonly logoutLink:     Locator;

  // Default action/assertion timeout for this page object. Pass the
  // performance-glitch-user's PERF_TIMEOUT in to apply it everywhere,
  // not just on goto().
  constructor(private readonly page: Page, private readonly timeout = 10_000) {
    this.inventoryList  = page.locator('[data-test="inventory-item"]');
    this.sortDropdown   = page.locator('[data-test="product-sort-container"]');
    this.cartBadge      = page.locator('[data-test="shopping-cart-badge"]');
    this.cartLink       = page.locator('[data-test="shopping-cart-link"]');
    this.burgerMenu     = page.locator("#react-burger-menu-btn");
    this.resetStateLink = page.locator('[data-test="reset-sidebar-link"]');
    this.closeMenuBtn   = page.locator("#react-burger-cross-btn");
    this.logoutLink     = page.locator('[data-test="logout-sidebar-link"]');
  }

  async goto(timeout = this.timeout): Promise<void> {
    await this.page.goto("/inventory.html");
    await expect(this.inventoryList.first()).toBeVisible({ timeout });
  }

  // Fetches all products live from the page
  async getAllProducts(): Promise<Product[]> {
    const items = this.page.locator('[data-test="inventory-item"]');
    const count = await items.count();
    const products: Product[] = [];

    for (let i = 0; i < count; i++) {
      const item  = items.nth(i);
      const name  = await item.locator('[data-test="inventory-item-name"]').textContent({ timeout: this.timeout });
      const price = await item.locator('[data-test="inventory-item-price"]').textContent({ timeout: this.timeout });
      products.push({
        name:  name?.trim() ?? "",
        price: parseFloat((price ?? "0").replace("$", "")),
      });
    }
    return products;
  }

  /*async resetAppState(): Promise<void> {
    await this.burgerMenu.click({ timeout: this.timeout });
    await this.resetStateLink.click({ timeout: this.timeout });
    await this.closeMenuBtn.click({ timeout: this.timeout });
  }*/

   async resetAppState(): Promise<void> {
    // Gracefully handle situations where the test left the user logged out
    if (!this.page.url().includes("/inventory.html")) {
      return;
    }
    await this.burgerMenu.click({ timeout: this.timeout });
    await this.resetStateLink.click({ timeout: this.timeout });
    await this.closeMenuBtn.click({ timeout: this.timeout });
  }

  async logout(): Promise<void> {
    await this.burgerMenu.click({ timeout: this.timeout });
    await this.logoutLink.click({ timeout: this.timeout });
    await expect(this.page.locator('[data-test="login-button"]')).toBeVisible({ timeout: this.timeout });
  }

  // ─── Actions ──────────────────────────────────────────────────────────────

  async addToCart(productName: string): Promise<void> {
    await this.itemByName(productName)
      .locator('[data-test^="add-to-cart"]')
      .click({ timeout: this.timeout });
  }

  async removeFromCart(productName: string): Promise<void> {
    await this.itemByName(productName)
      .locator('[data-test^="remove"]')
      .click({ timeout: this.timeout });
  }

  async sortBy(option: SortOption): Promise<void> {
    await this.sortDropdown.selectOption(option, { timeout: this.timeout });
  }

  async openCart(): Promise<void> {
    await this.cartLink.click({ timeout: this.timeout });
    await expect(this.page).toHaveURL(/cart/, { timeout: this.timeout });
  }

  async clickProductName(name: string): Promise<void> {
    await this.page
      .locator('[data-test="inventory-item-name"]', { hasText: name })
      .click({ timeout: this.timeout });
  }

  // ─── Queries ──────────────────────────────────────────────────────────────

  async getProductCount(): Promise<number> {
    return this.inventoryList.count();
  }

  async getProductNames(): Promise<string[]> {
    return this.page
      .locator('[data-test="inventory-item-name"]')
      .allTextContents();
  }

  async getProductPrices(): Promise<number[]> {
    const texts = await this.page
      .locator('[data-test="inventory-item-price"]')
      .allTextContents();
    return texts.map((t) => parseFloat(t.replace("$", "")));
  }

  async getCartBadgeCount(): Promise<number | null> {
    // isVisible() doesn't accept a timeout option; wrap with a bounded wait
    // so the badge has time to appear under glitch-user latency before we
    // conclude it's absent.
    try {
      await this.cartBadge.waitFor({ state: "visible", timeout: this.timeout });
    } catch {
      return null;
    }
    return parseInt((await this.cartBadge.textContent()) ?? "0", 10);
  }

  async getImageNaturalWidths(): Promise<number[]> {
    const images = this.page.locator('[data-test^="inventory-item-"][data-test$="-img"]');
    const count  = await images.count();
    const widths: number[] = [];
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      // Wait for the image to finish loading (success or error) before
      // reading naturalWidth, otherwise we race the network under latency.
      await img.evaluate(
        (el) =>
          new Promise<void>((resolve) => {
            const image = el as HTMLImageElement;
            if (image.complete) return resolve();
            image.addEventListener("load", () => resolve(), { once: true });
            image.addEventListener("error", () => resolve(), { once: true });
          }),
        undefined,
        { timeout: this.timeout }
      );
      widths.push(await img.evaluate((el) => (el as HTMLImageElement).naturalWidth));
    }
    return widths;
  }

  async getImageSources(): Promise<string[]> {
    const images = this.page.locator('[data-test^="inventory-item-"][data-test$="-img"]');
    const count  = await images.count();
    const srcs: string[] = [];
    for (let i = 0; i < count; i++) {
      srcs.push((await images.nth(i).getAttribute("src")) ?? "");
    }
    return srcs;
  }

  async isAddToCartVisible(productName: string): Promise<boolean> {
    return this.itemByName(productName)
      .locator('[data-test^="add-to-cart"]')
      .isVisible();
  }

  async isRemoveVisible(productName: string): Promise<boolean> {
    return this.itemByName(productName)
      .locator('[data-test^="remove"]')
      .isVisible();
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private itemByName(name: string): Locator {
    return this.page
      .locator('[data-test="inventory-item"]')
      .filter({
        has: this.page.locator('[data-test="inventory-item-name"]', { hasText: name }),
      });
  }
}