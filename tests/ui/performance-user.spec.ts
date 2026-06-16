/**
 * Dedicated tests for performance_glitch_user.
 *
 * The site artificially injects latency for this user.
 * Every feature must still work — just within a wider timeout.
 * The login timing test is the only place we measure duration explicitly.
 */
import { test, expect } from "@playwright/test";
import { InventoryPage } from "../../src/pages/InventoryPage";
import { CartPage } from "../../src/pages/CartPage";
import { CheckoutPage } from "../../src/pages/CheckoutPage";
import { AUTH } from "../../playwright.config";

test.use({ storageState: AUTH.performance_glitch_user });

// Dynamically scale performance timeouts safely
const PERF_TIMEOUT = parseInt(process.env.PERFORMANCE_LOGIN_TIMEOUT ?? "15000", 10);
const VALID_INFO   = { firstName: "Perf", lastName: "Glitch", postalCode: "12345" };

let inv: InventoryPage;

test.beforeEach(async ({ page }) => {
  // Give extra action time margin to elements under latency configurations
  test.setTimeout(PERF_TIMEOUT * 2);
  // FIX: pass PERF_TIMEOUT into the page object so every locator action
  // (click, selectOption, textContent, etc.) honors it — not just goto().
  inv = new InventoryPage(page, PERF_TIMEOUT);
  await inv.goto(PERF_TIMEOUT);
});

test.afterEach(async ({ page }) => {
  // Make certain state resets work globally across page boundaries safely
  const teardownInv = new InventoryPage(page, PERF_TIMEOUT);
  await teardownInv.resetAppState();
});

test("inventory loads within extended timeout @performance", async ({ page }) => {
  await expect(
    page.locator('[data-test="inventory-item"]').first()
  ).toBeVisible({ timeout: PERF_TIMEOUT });
});

test("page has at least one product @performance", async () => {
  expect(await inv.getProductCount()).toBeGreaterThan(0);
});

test("every product has a non-empty name @performance", async () => {
  const products = await inv.getAllProducts();
  for (const p of products) {
    expect(p.name.trim(), "Product name should not be empty").not.toBe("");
  }
});

test("every product has a positive price @performance", async () => {
  const products = await inv.getAllProducts();
  for (const p of products) {
    expect(p.price, `"${p.name}" should have a positive price`).toBeGreaterThan(0);
  }
});

test("product images load correctly — no image defect @performance", async () => {
  const widths = await inv.getImageNaturalWidths();
  for (const w of widths) expect(w).toBeGreaterThan(0);
});

test("sort works correctly @performance", async () => {
  await inv.sortBy("lohi");
  // FIX: confirm the sort actually applied before reading prices, since
  // selectOption resolves on dispatch, not on the resulting re-render.
  await expect(inv.sortDropdown).toHaveValue("lohi", { timeout: PERF_TIMEOUT });
  const prices = await inv.getProductPrices();
  expect(prices).toEqual([...prices].sort((a, b) => a - b));
});

test("can add first available product to cart @performance", async () => {
  const products = await inv.getAllProducts();
  await inv.addToCart(products[0].name);
  expect(await inv.getCartBadgeCount()).toBe(1);
});

test("can remove item from cart @performance", async () => {
  const products = await inv.getAllProducts();
  await inv.addToCart(products[0].name);
  await inv.removeFromCart(products[0].name);
  expect(await inv.getCartBadgeCount()).toBeNull();
});

test("completes full checkout end-to-end @performance", async ({ page }) => {
  const products = await inv.getAllProducts();
  const cart     = new CartPage(page);
  const checkout = new CheckoutPage(page);
  await inv.addToCart(products[0].name);
  await inv.openCart();
  await cart.proceedToCheckout();
  await checkout.completeCheckout(VALID_INFO);
  await expect(page).toHaveURL(/checkout-complete/, { timeout: PERF_TIMEOUT });
  expect(await checkout.getConfirmationHeader()).toContain("Thank you");
});

test("can log out from inventory page @performance", async () => {
  await inv.logout();
});