import { expect, type Page } from "@playwright/test";

export const ADMIN = { email: "e2e-admin@curtin.edu.au", password: "E2ePass123!" };
export const USER = { email: "e2e-user@curtin.edu.au", password: "E2ePass123!" };

// Log in through the real UI. The backend sets httpOnly cookies which Playwright
// keeps on the browser context, so subsequent navigations are authenticated.
export async function login(page: Page, creds: { email: string; password: string }): Promise<void> {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(creds.email);
  await page.locator('input[type="password"]').fill(creds.password);
  await page.getByRole("button", { name: "Sign In" }).click();
  // After login the app redirects off /login.
  await expect(page).not.toHaveURL(/\/login$/, { timeout: 10_000 });
}
