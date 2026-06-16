import { test, expect } from "@playwright/test";
import { InventoryPage } from "../../src/pages/InventoryPage";
import { CartPage } from "../../src/pages/CartPage";
import { CheckoutPage } from "../../src/pages/CheckoutPage";
import { AUTH } from "../../playwright.config";
import type { CheckoutInfo } from "../../src/types";

// ─── Shared ───────────────────────────────────────────────────────────────────

const VALID_INFO: CheckoutInfo = {
  firstName: "Jane",
  lastName:  "Tester",
  postalCode: "10001",
};

// ─── standard_user @standard ──────────────────────────────────────────────────

test.describe("Checkout — standard_user @standard", () => {
  test.use({ storageState: AUTH.standard_user });

  let inv:      InventoryPage;
  let cart:     CartPage;
  let checkout: CheckoutPage;

  test.beforeEach(async ({ page }) => {
    inv      = new InventoryPage(page);
    cart     = new CartPage(page);
    checkout = new CheckoutPage(page);
    await inv.goto();
  });

  test.afterEach(async ({ page }) => {
    await new InventoryPage(page).resetAppState();
  });

  // ── Step 1 validation ─────────────────────────────────────────────────────

  test("shows error when first name is missing @standard", async () => {
    const products = await inv.getAllProducts();
    await inv.addToCart(products[0].name);
    await inv.openCart();
    await cart.proceedToCheckout();

    await checkout.fillInfo({ firstName: "", lastName: "Tester", postalCode: "10001" });
    await checkout.continueButton.click();
    expect(await checkout.getErrorMessage()).toContain("First Name is required");
  });

  test("shows error when last name is missing @standard", async () => {
    const products = await inv.getAllProducts();
    await inv.addToCart(products[0].name);
    await inv.openCart();
    await cart.proceedToCheckout();

    await checkout.fillInfo({ firstName: "Jane", lastName: "", postalCode: "10001" });
    await checkout.continueButton.click();
    expect(await checkout.getErrorMessage()).toContain("Last Name is required");
  });

  test("shows error when postal code is missing @standard", async () => {
    const products = await inv.getAllProducts();
    await inv.addToCart(products[0].name);
    await inv.openCart();
    await cart.proceedToCheckout();

    await checkout.fillInfo({ firstName: "Jane", lastName: "Tester", postalCode: "" });
    await checkout.continueButton.click();
    expect(await checkout.getErrorMessage()).toContain("Postal Code is required");
  });

  test("Cancel returns to cart @standard", async ({ page }) => {
    const products = await inv.getAllProducts();
    await inv.addToCart(products[0].name);
    await inv.openCart();
    await cart.proceedToCheckout();

    await checkout.cancelButton.click();
    await expect(page).toHaveURL(/cart/);
  });

  test("valid info advances to step 2 @standard", async ({ page }) => {
    const products = await inv.getAllProducts();
    await inv.addToCart(products[0].name);
    await inv.openCart();
    await cart.proceedToCheckout();

    await checkout.fillInfo(VALID_INFO);
    await checkout.continue();
    await expect(page).toHaveURL(/checkout-step-two/);
  });

  // ── Step 2 overview ───────────────────────────────────────────────────────

  test("subtotal matches price of added product @standard", async () => {
    // Fetch price from page — not hardcoded
    const products = await inv.getAllProducts();
    await inv.addToCart(products[0].name);
    await inv.openCart();
    await cart.proceedToCheckout();
    await checkout.fillInfo(VALID_INFO);
    await checkout.continue();

    expect(await checkout.getSubtotal()).toBe(products[0].price);
  });

  test("total equals subtotal + tax @standard", async () => {
    const products = await inv.getAllProducts();
    await inv.addToCart(products[0].name);
    await inv.openCart();
    await cart.proceedToCheckout();
    await checkout.fillInfo(VALID_INFO);
    await checkout.continue();

    const subtotal = await checkout.getSubtotal();
    const tax      = await checkout.getTax();
    const total    = await checkout.getTotal();
    expect(total).toBeCloseTo(subtotal + tax, 2);
  });

  test("subtotal is sum of all added products @standard", async () => {
    const products = await inv.getAllProducts();
    const toAdd    = products.slice(0, 2);

    for (const p of toAdd) await inv.addToCart(p.name);
    await inv.openCart();
    await cart.proceedToCheckout();
    await checkout.fillInfo(VALID_INFO);
    await checkout.continue();

    const expected = toAdd.reduce((sum, p) => sum + p.price, 0);
    expect(await checkout.getSubtotal()).toBeCloseTo(expected, 2);
  });

  // ── Complete ──────────────────────────────────────────────────────────────

  test("completes order and shows thank-you confirmation @standard", async ({ page }) => {
    const products = await inv.getAllProducts();
    await inv.addToCart(products[0].name);
    await inv.openCart();
    await cart.proceedToCheckout();
    await checkout.completeCheckout(VALID_INFO);

    await expect(page).toHaveURL(/checkout-complete/);
    expect(await checkout.getConfirmationHeader()).toContain("Thank you");
  });

  test("Back Home button returns to inventory @standard", async ({ page }) => {
    const products = await inv.getAllProducts();
    await inv.addToCart(products[0].name);
    await inv.openCart();
    await cart.proceedToCheckout();
    await checkout.completeCheckout(VALID_INFO);

    await checkout.backHomeButton.click();
    await expect(page).toHaveURL(/inventory/);
  });

  test("cart badge is gone after completing order @standard", async ({ page }) => {
    const products = await inv.getAllProducts();
    await inv.addToCart(products[0].name);
    await inv.openCart();
    await cart.proceedToCheckout();
    await checkout.completeCheckout(VALID_INFO);

    await checkout.backHomeButton.click();
    await expect(page.locator('[data-test="shopping-cart-badge"]')).not.toBeVisible();
  });
});

// ─── performance_glitch_user @performance ─────────────────────────────────────

test.describe("Checkout — performance_glitch_user @performance", () => {
  test.use({ storageState: AUTH.performance_glitch_user });

  test("completes full checkout despite slow responses @performance", async ({ page }) => {
    const PERF_TIMEOUT = parseInt(process.env.PERFORMANCE_LOGIN_TIMEOUT ?? "15000", 10);
    const inv      = new InventoryPage(page);
    const cart     = new CartPage(page);
    const checkout = new CheckoutPage(page);

    await inv.goto();
    const products = await inv.getAllProducts();
    await inv.addToCart(products[0].name);
    await inv.openCart();
    await cart.proceedToCheckout();
    await checkout.completeCheckout(VALID_INFO);

    await expect(page).toHaveURL(/checkout-complete/, { timeout: PERF_TIMEOUT });
    expect(await checkout.getConfirmationHeader()).toContain("Thank you");
  });
});

// ─── problem_user @problem ────────────────────────────────────────────────────

test.describe("Checkout — problem_user @problem", () => {
  test.use({ storageState: AUTH.problem_user });

  let inv:      InventoryPage;
  let cart:     CartPage;
  let checkout: CheckoutPage;

  test.beforeEach(async ({ page }) => {
    inv      = new InventoryPage(page);
    cart     = new CartPage(page);
    checkout = new CheckoutPage(page);
    await inv.goto();
  });

  test("completes full checkout despite broken images @problem", async ({ page }) => {
   
    test.fail();

    const products = await inv.getAllProducts();
    await inv.addToCart(products[0].name);
    await inv.openCart();
    await cart.proceedToCheckout();
    
    await checkout.completeCheckout({ firstName: "Tester", lastName: "User", postalCode: "10001" });
    
    await expect(page).toHaveURL(/checkout-complete/);
  });
});