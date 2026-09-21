import { expect, test, type Page } from "@playwright/test";

const pendingReviewFixtureId = "6aaeb82f5848c3ae23424996";

const charityCampaign = (status: "PENDING_REVIEW" | "APPROVED") => ({
  id: pendingReviewFixtureId,
  _id: pendingReviewFixtureId,
  name: "QA Charity Campaign",
  projectType: "CHARITY",
  status,
  summary: "A charity campaign used to verify contribution eligibility.",
  story:
    "This campaign verifies that unavailable campaigns cannot accept contributions.",
  targetAmount: 100000,
  raisedAmount: 0,
  backerCount: 0,
  currency: "UGX",
  creatorId: "6aaeb82f5848c3ae23424997",
  category: "education",
  fundingEndDate: "2030-01-01T00:00:00.000Z",
});

async function routeCharityCampaign(
  page: Page,
  status: "PENDING_REVIEW" | "APPROVED",
) {
  await page.route(`**/api/projects/${pendingReviewFixtureId}`, (route) =>
    route.fulfill({ json: charityCampaign(status) }),
  );
  await page.route(
    `**/api/projects/${pendingReviewFixtureId}/donors?**`,
    (route) => route.fulfill({ json: [] }),
  );
}

test.describe("campaign contribution eligibility", () => {
  test("pending-review campaign has no contribution CTA", async ({ page }) => {
    await routeCharityCampaign(page, "PENDING_REVIEW");
    await page.goto(`/projects/${pendingReviewFixtureId}`);
    await expect(
      page.getByText(
        "Awaiting review. Contributions are unavailable until this campaign is approved.",
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /donate now|invest now/i }),
    ).toHaveCount(0);
  });

  test("approved campaign retains its contribution CTA", async ({ page }) => {
    await routeCharityCampaign(page, "APPROVED");
    await page.goto(`/projects/${pendingReviewFixtureId}`);
    await expect(
      page.getByRole("button", { name: "Donate Now" }),
    ).toBeVisible();
  });
});
