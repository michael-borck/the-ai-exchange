import { expect, test } from "@playwright/test";
import { ADMIN, login } from "./helpers";

test.describe("admin", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN);
  });

  test("dashboard shows stats and management tabs", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: /admin dashboard/i })).toBeVisible();
    await expect(page.getByText(/total users/i)).toBeVisible();
    for (const tab of ["Users", "Resources", "Analytics", "Configuration"]) {
      await expect(page.getByRole("tab", { name: tab })).toBeVisible();
    }
  });

  test("users tab lists the seeded accounts", async ({ page }) => {
    await page.goto("/admin");
    // Users is the default tab; the table loads async. Target table cells
    // (the admin's own email also appears in the user menu).
    await expect(page.getByRole("cell", { name: ADMIN.email })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("cell", { name: "e2e-user@curtin.edu.au" })).toBeVisible();
  });

  test("configuration tab loads", async ({ page }) => {
    await page.goto("/admin");
    await page.getByRole("tab", { name: "Configuration" }).click();
    // The config manager has its own nested tabs once mounted.
    await expect(page.getByRole("tab", { name: /current configuration/i })).toBeVisible({
      timeout: 10_000,
    });
  });
});
