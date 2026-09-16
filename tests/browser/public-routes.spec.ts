import { expect, test } from "@playwright/test";

test.describe("public routes", () => {
  test("home navigation reaches discovery and authentication", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await expect(page.locator('a[href="/explore"]').first()).toBeAttached();
    await page.goto("/explore", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/explore/);
    await expect(
      page.getByPlaceholder("Search projects by title or description..."),
    ).toBeVisible();

    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "Welcome Back" }),
    ).toBeVisible();
    await page.goto("/register", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "Join Keibo" }),
    ).toBeVisible();
  });

  test("discovery exposes honest empty or loaded states and preserves filters", async ({
    page,
  }) => {
    await page.goto("/explore");
    await expect(
      page.getByPlaceholder("Search projects by title or description..."),
    ).toBeVisible();

    const search = page.getByPlaceholder(
      "Search projects by title or description...",
    );
    await search.fill("qa-e2e-no-match");
    await expect(page).toHaveURL(/search=qa-e2e-no-match/);
    await expect(page.locator("body")).not.toContainText(
      /payment successful|funded successfully|settled/i,
    );
  });

  test("legal, support, missing routes, and mobile layout are usable", async ({
    page,
  }) => {
    for (const route of ["/terms", "/privacy", "/support"]) {
      await page.goto(route);
      await expect(page.locator("body")).toBeVisible();
    }

    const missingResponse = await page.goto("/qa-e2e-route-does-not-exist");
    expect(missingResponse?.status()).toBe(404);
    await expect(page.locator("body")).toContainText(/404|not found/i);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
  });
});
