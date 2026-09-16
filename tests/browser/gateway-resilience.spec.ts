import { expect, test } from "@playwright/test";

const authenticatedUser = {
  user: {
    id: "gateway-e2e-user",
    email: "gateway-e2e@example.test",
    roles: ["INVESTOR"],
  },
};

test.describe("auth gateway resilience", () => {
  test("keeps the login form usable when session bootstrap fails", async ({
    page,
  }) => {
    await page.route("**/api/users/me", async (route) => {
      await route.abort("connectionrefused");
    });

    await page.goto("/login");

    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "We could not verify your session" }),
    ).toContainText("We could not verify your session");

    await page.getByRole("button", { name: "Retry session check" }).click();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("allows an authenticated cookie session to render the dashboard", async ({
    context,
    page,
  }) => {
    await page.route("**/api/users/me", async (route) => {
      await route.fulfill({ json: authenticatedUser });
    });
    await page.goto("/");
    await context.addCookies([
      {
        name: "keibo_access",
        value: "e2e-session",
        url: new URL(page.url()).origin,
      },
    ]);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("guides an authenticated investor through Charity Creator enrollment", async ({
    page,
  }) => {
    await page.route("**/api/users/me", async (route) => {
      await route.fulfill({
        json: {
          user: {
            ...authenticatedUser.user,
            capabilities: { createCharity: false, createRoi: false },
          },
        },
      });
    });

    await page.goto("/dashboard/create-project");

    await expect(
      page.getByRole("heading", { name: "Become a Charity Creator" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Become a Charity Creator" }),
    ).toBeVisible();
    await expect(
      page.getByText("ROI creation separately requires verified KYC"),
    ).toBeVisible();
  });
});
