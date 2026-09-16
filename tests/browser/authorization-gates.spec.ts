import { expect, test } from "@playwright/test";

const protectedRoutes = [
  "/profile",
  "/dashboard",
  "/dashboard/create-project",
  "/dashboard/withdraw",
  "/admin",
  "/admin/kyc",
  "/investment/verify",
  "/marketplace",
];

test.describe("unauthenticated authorization and feature gates", () => {
  for (const route of protectedRoutes) {
    test(`${route} does not expose protected content anonymously`, async ({
      page,
    }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login|\/dashboard|\/admin|\/marketplace/);
      await expect(page.locator("body")).not.toContainText(
        /private key|access token|password hash/i,
      );
    });
  }

  test("ROI discovery remains gated for an unverified visitor", async ({
    page,
  }) => {
    await page.goto("/explore?type=ROI");
    await expect(page).toHaveURL(/\/explore/);
    await expect(page.locator("body")).not.toContainText(
      /investment successful|wallet connected|payment complete/i,
    );
  });

  test("deal room and payment result show non-settling states", async ({
    page,
  }) => {
    await page.goto("/deal-room/qa-e2e-project");
    await expect(page.locator("body")).toContainText(
      /unavailable|sign in|access/i,
    );

    await page.goto("/payment/result?status=success&projectId=qa-e2e-project");
    await expect(page.locator("body")).toContainText(
      /processing|pending|do not pay again/i,
    );
    await expect(page.locator("body")).not.toContainText(
      /payment successful|settled/i,
    );
  });
});
