import { expect, test } from "@playwright/test";
import { USER, login } from "./helpers";

test.describe("resources", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USER);
  });

  test("browse page loads the catalogue", async ({ page }) => {
    await page.goto("/resources");
    await expect(page).toHaveURL(/\/resources$/);
    await expect(page.getByRole("heading", { name: /browse ideas/i })).toBeVisible();
    await expect(page.getByPlaceholder(/search ideas/i)).toBeVisible();
  });

  test("create a resource end to end", async ({ page }) => {
    await page.goto("/resources/new");
    await expect(page.getByRole("heading", { name: /share your resource/i })).toBeVisible();

    const title = `E2E test resource ${Date.now()}`;
    await page.getByPlaceholder(/give your resource a clear/i).fill(title);
    await page
      .getByPlaceholder(/describe your resource/i)
      .fill("Created by the Playwright e2e suite to verify the submit flow.");

    await page.getByRole("button", { name: /share resource/i }).click();

    // On success the app navigates away from the create form.
    await expect(page).not.toHaveURL(/\/resources\/new$/, { timeout: 10_000 });
  });
});
