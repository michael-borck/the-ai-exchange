import { expect, test } from "@playwright/test";
import { USER, login } from "./helpers";

test.describe("authentication", () => {
  test("valid login lands on the authed app", async ({ page }) => {
    await login(page, USER);
    // Authed shell exposes the "Share Idea" nav and a Logout control.
    await expect(page.getByText(/share idea/i).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /logout/i })).toBeVisible();
  });

  test("wrong password shows an error and stays on login", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(USER.email);
    await page.locator('input[type="password"]').fill("wrong-password");
    await page.getByRole("button", { name: "Sign In" }).click();
    // The message appears in both an inline alert and a toast; match the first.
    await expect(page.getByText(/invalid email or password/i).first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(page).toHaveURL(/\/login$/);
  });

  test("logout returns to anonymous state", async ({ page }) => {
    await login(page, USER);
    await page.getByRole("button", { name: /logout/i }).click();
    // Back to the marketing landing.
    await expect(page.getByRole("heading", { name: /how your colleagues/i })).toBeVisible();
  });
});
