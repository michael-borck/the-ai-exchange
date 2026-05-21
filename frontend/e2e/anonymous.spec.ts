import { expect, test } from "@playwright/test";

// Flows available without logging in. The marketing landing must never leak
// the gated catalogue, and protected routes must bounce anonymous visitors.
test.describe("anonymous", () => {
  test("landing shows marketing hero and auth CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /how your colleagues/i })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /register with your curtin email/i })
    ).toBeVisible();
    // The landing has two "Sign in" CTAs (hero + lower section).
    await expect(page.getByRole("button", { name: /^sign in$/i }).first()).toBeVisible();
    // No resource catalogue is rendered for anon visitors.
    await expect(page.getByText(/what you'll find inside/i)).toBeVisible();
  });

  test("login page renders the form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });

  test("register page renders the form", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test("public info pages render", async ({ page }) => {
    for (const path of ["/about", "/support", "/legal", "/getting-started"]) {
      await page.goto(path);
      await expect(page.locator("#root")).not.toBeEmpty();
    }
  });

  test("protected routes redirect to login", async ({ page }) => {
    await page.goto("/resources");
    await expect(page).toHaveURL(/\/login$/);

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login$/);
  });
});
