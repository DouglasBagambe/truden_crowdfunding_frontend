import { expect, test } from "@playwright/test";

test("USDC investment modal shows bounded presets and transparent review for campaign zero", async ({
  context,
  page,
}) => {
  await context.addCookies([
    {
      name: "keibo_access",
      value: "mock-investor",
      url: "http://127.0.0.1:3000",
    },
  ]);
  await page.route("**/api/users/me", (route) =>
    route.fulfill({
      json: {
        user: {
          id: "investor",
          email: "investor@example.test",
          isEmailVerified: true,
          capabilities: { viewRoi: true },
          roles: ["INVESTOR"],
        },
      },
    }),
  );
  await page.route("**/api/projects/modal-campaign", (route) =>
    route.fulfill({
      json: {
        project: {
          _id: "modal-campaign",
          name: "USDC modal fixture",
          projectType: "ROI",
          status: "FUNDING",
          onchainProvisioningStatus: "READY",
          projectOnchainId: "0",
          targetAmount: 10,
          raisedAmount: 0,
          currency: "USDC",
          fundingEndDate: "2030-01-01",
          agreements: [],
          roiAgreements: [],
          requiresAgreement: true,
        },
        milestones: [],
      },
    }),
  );
  await page.goto("/projects/modal-campaign");
  await page.getByRole("button", { name: "Invest Now" }).click();
  const modal = page.getByRole("dialog", { name: "Invest in Project" });
  await expect(modal).toBeVisible();
  for (const value of [1, 2, 5, 10])
    await expect(
      modal.getByRole("button", { name: String(value), exact: true }),
    ).toBeVisible();
  await expect(
    modal.getByRole("button", { name: "50,000", exact: true }),
  ).toHaveCount(0);
  await modal.getByRole("spinbutton").fill("1");
  await expect(
    modal.getByText("Campaign ID: 0", { exact: true }),
  ).toBeVisible();
  await expect(
    modal.getByText("Investment: 1 USDC", { exact: true }),
  ).toBeVisible();
  await expect(
    modal.getByText("Investor fee: 0 USDC", { exact: true }),
  ).toBeVisible();
  await expect(
    modal.getByText("Total debit: 1 USDC", { exact: true }),
  ).toBeVisible();
  await expect(
    modal.getByText("No campaign agreements require acceptance.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(modal.getByRole("checkbox")).toHaveCount(0);
});
