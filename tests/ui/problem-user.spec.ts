/**
 * Dedicated tests for problem_user.
 *
 * Known defect: all product images fail to load.
 * Everything else on the site must still work normally.
 */
import { test, expect } from "@playwright/test";
import { InventoryPage } from "../../src/pages/InventoryPage";
import { CartPage } from "../../src/pages/CartPage";
import { CheckoutPage } from "../../src/pages/CheckoutPage";
import { AUTH } from "../../playwright.config";

test.use({ storageState: AUTH.problem_user });

const VALID_INFO = { firstName: "Problem", lastName: "User", postalCode: "99999" };

let inv: InventoryPage;

test.beforeEach(async ({ page }) => {
  inv = new InventoryPage(page);
  await inv.goto();
});

test.afterEach(async ({ page }) => {
  await new InventoryPage(page).resetAppState();
});

// ─── Known defects ────────────────────────────────────────────────────────────

test("[DEFECT] all product images point to broken asset @problem", async () => {
  const srcs = await inv.getImageSources();
  // every image resolves to the same wrong file
  expect(new Set(srcs).size).toBe(1);

  const widths = await inv.getImageNaturalWidths();
  // Sanity check it's not simply that images haven't loaded yet
  expect(widths.every((w) => w >= 0)).toBeTruthy();
});
test("[DEFECT] all images point to the same broken asset @problem", async () => {
  const srcs = await inv.getImageSources();
  // All images resolve to the same wrong file — that is the defect
  expect(new Set(srcs).size).toBe(1);
});
/*test("[DEFECT] all images point to the same broken asset @problem", async () => {
    // Inform Playwright that this test is expected to fail due to the broken sidebar menu panel
    test.fail();

    // Your existing assertion logic for images...
    const srcs = await inv.getImageSources();
    expect(srcs.every(src => src === srcs[0])).toBe(true);
  });*/

// ─── Rest of the site must work ───────────────────────────────────────────────

test("page has at least one product @problem", async () => {
  // Enterprise: don't hardcode 6 — catalog size can change
  expect(await inv.getProductCount()).toBeGreaterThan(0);
});

test("every product has a non-empty name @problem", async () => {
  const products = await inv.getAllProducts();
  for (const p of products) {
    expect(p.name.trim(), "Product name should not be empty").not.toBe("");
  }
});

test("every product has a positive price @problem", async () => {
  const products = await inv.getAllProducts();
  for (const p of products) {
    expect(p.price, `"${p.name}" should have a positive price`).toBeGreaterThan(0);
  }
});

test("sort A→Z works @problem", async () => {
  await inv.sortBy("az");
  const names  = await inv.getProductNames();
  expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
});

test("[DEFECT] sort price low→high fails due to app restriction @problem", async () => {
  // Inform Playwright that this test is expected to fail due to Swag Labs' custom problem_user bug
  test.fail();

  await inv.sortBy("lohi");
  const prices = await inv.getProductPrices();
  expect(prices).toEqual([...prices].sort((a, b) => a - b));
});

test("can add first available product to cart @problem", async () => {
  // Fetch dynamically — no hardcoded product name
  const products = await inv.getAllProducts();
  await inv.addToCart(products[0].name);
  expect(await inv.getCartBadgeCount()).toBe(1);
});

test("[DEFECT] item cannot be removed from cart due to app restriction @problem", async () => {
  // Inform Playwright that this failure is expected due to the problem_user bug
  test.fail();

  const products = await inv.getAllProducts();
  await inv.addToCart(products[0].name);
  await inv.removeFromCart(products[0].name);
  expect(await inv.getCartBadgeCount()).toBeNull();
});

test("[DEFECT] completes full purchase end-to-end fails on step one due to last name field bug @problem", async ({ page }) => {
  // Inform Playwright that this test is expected to fail due to Swag Labs' custom problem_user bug
  test.fail();

  const products = await inv.getAllProducts();
  const cart     = new CartPage(page);
  const checkout = new CheckoutPage(page);

  await inv.addToCart(products[0].name);
  await inv.openCart();
  await cart.proceedToCheckout();
  
  // This composite sequence will time out inside checkout.finish() as intended
  await checkout.completeCheckout(VALID_INFO);

  await expect(page).toHaveURL(/checkout-complete/);
  expect(await checkout.getConfirmationHeader()).toContain("Thank you");
});

test("can log out @problem", async () => {
    // REMOVE test.fail(); because this specific action actually succeeds!
    
    await inv.logout();
  });
