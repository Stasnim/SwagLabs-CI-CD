import { test, expect } from "@playwright/test";
import { InventoryPage } from "../../src/pages/InventoryPage";
import { CartPage } from "../../src/pages/CartPage";
import { AUTH } from "../../playwright.config";

// ─── standard_user @standard ──────────────────────────────────────────────────

test.describe("Cart — standard_user @standard", () => {
  test.use({ storageState: AUTH.standard_user });

  let inv:  InventoryPage;
  let cart: CartPage;

  test.beforeEach(async ({ page }) => {
    inv  = new InventoryPage(page);
    cart = new CartPage(page);
    await inv.goto();
  });

  test.afterEach(async ({ page }) => {
    await new InventoryPage(page).resetAppState();
  });

  test("empty cart shows no items @standard", async () => {
    await inv.openCart();
    expect(await cart.isEmpty()).toBe(true);
  });

  test("added items appear in cart @standard", async () => {
    // Fetch products dynamically
    const products = await inv.getAllProducts();
    const toAdd    = products.slice(0, 2);

    for (const p of toAdd) await inv.addToCart(p.name);
    await inv.openCart();

    const inCart = await cart.getItemNames();
    for (const p of toAdd) {
      expect(inCart).toContain(p.name);
    }
    expect(await cart.getItemCount()).toBe(2);
  });

  test("cart item shows correct price @standard", async () => {
    const products = await inv.getAllProducts();
    await inv.addToCart(products[0].name);
    await inv.openCart();

    // Price in cart must match price shown on inventory page
    expect(await cart.getItemPrice(products[0].name)).toBe(products[0].price);
  });

  test("cart item shows quantity of 1 @standard", async () => {
    const products = await inv.getAllProducts();
    await inv.addToCart(products[0].name);
    await inv.openCart();
    expect(await cart.getItemQuantity(products[0].name)).toBe(1);
  });

  test("removing an item removes only that item @standard", async () => {
    const products = await inv.getAllProducts();
    await inv.addToCart(products[0].name);
    await inv.addToCart(products[1].name);
    await inv.openCart();

    await cart.removeItem(products[0].name);

    expect(await cart.hasItem(products[0].name)).toBe(false);
    expect(await cart.hasItem(products[1].name)).toBe(true);
  });

  test("removing all items leaves empty cart @standard", async () => {
    const products = await inv.getAllProducts();
    await inv.addToCart(products[0].name);
    await inv.openCart();
    await cart.removeItem(products[0].name);
    expect(await cart.isEmpty()).toBe(true);
  });

  test("Continue Shopping returns to inventory with cart preserved @standard", async ({ page }) => {
    const products = await inv.getAllProducts();
    await inv.addToCart(products[0].name);
    await inv.openCart();
    await cart.continueShopping();

    await expect(page).toHaveURL(/inventory/);
    expect(await inv.getCartBadgeCount()).toBe(1);
  });

  test("Checkout button navigates to checkout step 1 @standard", async ({ page }) => {
    const products = await inv.getAllProducts();
    await inv.addToCart(products[0].name);
    await inv.openCart();
    await cart.proceedToCheckout();
    await expect(page).toHaveURL(/checkout-step-one/);
  });
});

// ─── performance_glitch_user @performance ─────────────────────────────────────

test.describe("Cart — performance_glitch_user @performance", () => {
  test.use({ storageState: AUTH.performance_glitch_user });

  test("added item appears in cart @performance", async ({ page }) => {
    const inv  = new InventoryPage(page);
    const cart = new CartPage(page);

    await inv.goto();
    const products = await inv.getAllProducts();
    await inv.addToCart(products[0].name);
    await inv.openCart();

    expect(await cart.hasItem(products[0].name)).toBe(true);
  });
});

// ─── problem_user @problem ────────────────────────────────────────────────────

test.describe("Cart — problem_user @problem", () => {
  test.use({ storageState: AUTH.problem_user });

  test("can add item to cart and view it @problem", async ({ page }) => {
    const inv  = new InventoryPage(page);
    const cart = new CartPage(page);

    await inv.goto();
    const products = await inv.getAllProducts();
    await inv.addToCart(products[0].name);
    await inv.openCart();

    expect(await cart.getItemCount()).toBe(1);
  });
});
