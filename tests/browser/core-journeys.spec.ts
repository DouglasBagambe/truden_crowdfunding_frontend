import { expect, test } from "@playwright/test";

test.describe("public core journeys", () => {
  test("authentication and recovery controls are available", async ({
    page,
  }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("heading", { name: "Welcome Back" }),
    ).toBeVisible();
    await expect(page.getByLabel("Email Address")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Forgot Password?" }),
    ).toHaveAttribute("href", "/forgot-password");

    await page.goto("/register");
    await expect(
      page.getByRole("heading", { name: "Join Keibo" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Create Global Account" }),
    ).toBeVisible();
  });

  for (const legalPage of [
    { path: "/terms", heading: "Terms of Service" },
    { path: "/privacy", heading: "Privacy Notice" },
    { path: "/support", heading: "Support" },
  ]) {
    test(`${legalPage.path} is a real route`, async ({ page }) => {
      await page.goto(legalPage.path);
      await expect(
        page.getByRole("heading", { name: legalPage.heading }),
      ).toBeVisible();
    });
  }

  test("disabled deal room reports the missing durable infrastructure", async ({
    page,
  }) => {
    await page.goto("/deal-room/browser-test-project");
    await expect(
      page.getByRole("heading", { name: "Deal room unavailable" }),
    ).toBeVisible();
    await expect(
      page.getByText(/Durable encrypted document storage/),
    ).toBeVisible();
  });

  test("provider redirect cannot claim success without ledger evidence", async ({
    page,
  }) => {
    await page.goto(
      "/payment/result?status=success&projectId=browser-test-project",
    );
    await expect(
      page.getByRole("heading", { name: "Processing Payment…" }),
    ).toBeVisible();
    await expect(page.getByText(/Do not pay again/)).toBeVisible();
  });

  test("home page renders its primary journey at the configured viewport", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
  });
});
