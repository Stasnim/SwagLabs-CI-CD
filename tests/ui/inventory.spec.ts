import { test, expect } from "@playwright/test";
import { InventoryPage } from "../../src/pages/InventoryPage";
import { AUTH } from "../../playwright.config";

function assertAscByName(names: string[])    { expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b))); }
function assertDescByName(names: string[])   { expect(names).toEqual([...names].sort((a, b) => b.localeCompare(a))); }
function assertAscByPrice(prices: number[])  { expect(prices).toEqual([...prices].sort((a, b) => a - b)); }
function assertDescByPrice(prices: number[]) { expect(prices).toEqual([...prices].sort((a, b) => b - a)); }

// ─── standard_user @standard ──────────────────────────────────────────────────

test.describe("Inventory — standard_user @standard", () => {
  test.use({ storageState: AUTH.standard_user });

  let inv: InventoryPage;

  test.beforeEach(async ({ page }) => {
    inv = new InventoryPage(page);
    await inv.goto();
  });

  test.afterEach(async ({ page }) => {
    await new InventoryPage(page).resetAppState();
  });

  // ── Catalog ───────────────────────────────────────────────────────────────

  test("page has at least one product @standard", async () => {
    // Enterprise: don't assert exactly 6 — catalog size can grow
    expect(await inv.getProductCount()).toBeGreaterThan(0);
  });

  test("every product has a non-empty name @standard", async () => {
    const products = await inv.getAllProducts();
    for (const p of products) {
      expect(p.name.trim(), "Product name should not be empty").not.toBe("");
    }
  });

  test("every product has a positive price @standard", async () => {
    const products = await inv.getAllProducts();
    for (const p of products) {
      expect(p.price, `"${p.name}" should have a positive price`).toBeGreaterThan(0);
    }
  });

  /*test("all product images load @standard", async () => {
    const widths = await inv.getImageNaturalWidths();
    for (const [i, w] of widths.entries()) {
      expect(w, `Image ${i} failed to load`).toBeGreaterThan(0);
    }
  });*/

  // ── Sorting ───────────────────────────────────────────────────────────────

  test("sort A→Z @standard", async () => {
    await inv.sortBy("az");
    assertAscByName(await inv.getProductNames());
  });

  test("sort Z→A @standard", async () => {
    await inv.sortBy("za");
    assertDescByName(await inv.getProductNames());
  });

  test("sort price low→high @standard", async () => {
    await inv.sortBy("lohi");
    assertAscByPrice(await inv.getProductPrices());
  });

  test("sort price high→low @standard", async () => {
    await inv.sortBy("hilo");
    assertDescByPrice(await inv.getProductPrices());
  });

  // ── Cart badge ────────────────────────────────────────────────────────────

  test("cart badge hidden when empty @standard", async () => {
    expect(await inv.getCartBadgeCount()).toBeNull();
  });

  test("badge shows 1 after adding one item @standard", async () => {
    const products = await inv.getAllProducts();
    await inv.addToCart(products[0].name);
    expect(await inv.getCartBadgeCount()).toBe(1);
  });

  test("badge reflects count of all added items @standard", async () => {
    const products = await inv.getAllProducts();
    for (const p of products.slice(0, 3)) {
      await inv.addToCart(p.name);
    }
    expect(await inv.getCartBadgeCount()).toBe(3);
  });

  test("Remove button appears after adding; Add disappears @standard", async () => {
    const products = await inv.getAllProducts();
    await inv.addToCart(products[0].name);
    expect(await inv.isRemoveVisible(products[0].name)).toBe(true);
    expect(await inv.isAddToCartVisible(products[0].name)).toBe(false);
  });

  test("badge resets after removing item @standard", async () => {
    const products = await inv.getAllProducts();
    await inv.addToCart(products[0].name);
    await inv.removeFromCart(products[0].name);
    expect(await inv.getCartBadgeCount()).toBeNull();
  });

  // ── Product detail ────────────────────────────────────────────────────────

  test("clicking product name opens detail page @standard", async ({ page }) => {
    const products = await inv.getAllProducts();
    await inv.clickProductName(products[0].name);
    await expect(page).toHaveURL(/inventory-item/);
    await expect(
      page.locator('[data-test="inventory-item-name"]')
    ).toHaveText(products[0].name);
  });

  test("Back button returns to inventory @standard", async ({ page }) => {
    const products = await inv.getAllProducts();
    await inv.clickProductName(products[0].name);
    await page.locator('[data-test="back-to-products"]').click();
    await expect(page).toHaveURL(/inventory\.html/);
  });
});

// ─── problem_user @problem ────────────────────────────────────────────────────

test.describe("Inventory — problem_user @problem", () => {
  test.use({ storageState: AUTH.problem_user });

  let inv: InventoryPage;

  test.beforeEach(async ({ page }) => {
    inv = new InventoryPage(page);
    await inv.goto();
  });

  test.afterEach(async ({ page }) => {
    await new InventoryPage(page).resetAppState();
  });

  test("page has at least one product @problem", async () => {
    expect(await inv.getProductCount()).toBeGreaterThan(0);
  });

  /*test("[DEFECT] product images fail to load @problem", async () => {
    const widths = await inv.getImageNaturalWidths();
    expect(widths.filter((w) => w === 0).length).toBeGreaterThan(0);
  });*/

  test("[DEFECT] all images share the same broken src @problem", async () => {
    const srcs = await inv.getImageSources();
    expect(new Set(srcs).size).toBe(1);
  });

 /* test("sort still works @problem", async () => {
    await inv.sortBy("az");
    assertAscByName(await inv.getProductNames());
  });*/

  test("can add first available product to cart @problem", async () => {
    const products = await inv.getAllProducts();
    await inv.addToCart(products[0].name);
    expect(await inv.getCartBadgeCount()).toBe(1);
  });
});

// ─── performance_glitch_user @performance ─────────────────────────────────────

test.describe("Inventory — performance_glitch_user @performance", () => {
  test.use({ storageState: AUTH.performance_glitch_user });

  let inv: InventoryPage;

  test.beforeEach(async ({ page }) => {
    inv = new InventoryPage(page);
    await inv.goto();
  });

  test.afterEach(async ({ page }) => {
    await new InventoryPage(page).resetAppState();
  });

  test("page has at least one product @performance", async () => {
    expect(await inv.getProductCount()).toBeGreaterThan(0);
  });

  /*test("product images load correctly @performance", async () => {
    const widths = await inv.getImageNaturalWidths();
    for (const w of widths) expect(w).toBeGreaterThan(0);
  });*/

  test("can add first available product to cart @performance", async () => {
    const products = await inv.getAllProducts();
    await inv.addToCart(products[0].name);
    expect(await inv.getCartBadgeCount()).toBe(1);
  });

  test("sort works correctly @performance", async () => {
    await inv.sortBy("lohi");
    assertAscByPrice(await inv.getProductPrices());
  });
});
