import { expect, test, type Page } from "@playwright/test";

const campaignId = "507f1f77bcf86cd799439011";
async function charitySession(page: Page) {
  const requests: string[] = [];
  await page.context().addCookies([
    {
      name: "keibo_access",
      value: "charity-test-only",
      url: "http://127.0.0.1:3000",
    },
  ]);
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    requests.push(path);
    if (path === "/api/users/me")
      return route.fulfill({
        json: {
          id: "creator",
          roles: ["INNOVATOR", "ADMIN"],
          emailVerifiedAt: "2026-10-01",
          kycStatus: "VERIFIED",
          capabilities: { createCharity: true, createRoi: true, viewRoi: true },
        },
      });
    if (path === "/api/auth/csrf")
      return route.fulfill({ json: { csrfToken: "charity-test" } });
    if (path === "/api/projects/donations/me")
      return route.fulfill({
        json: [
          {
            id: "donation-1",
            projectId: campaignId,
            amount: 1000,
            currency: "UGX",
            project: {
              id: campaignId,
              title: "Charity test cause",
              type: "CHARITY",
            },
          },
        ],
      });
    if (path === "/api/projects")
      return route.fulfill({
        json: {
          items: [
            {
              id: campaignId,
              projectType: "CHARITY",
              name: "Charity test cause",
              status: "APPROVED",
              currency: "UGX",
              raisedAmount: 1000,
              targetAmount: 10000,
            },
            { id: "roi-hidden", projectType: "ROI", name: "Hidden investment" },
          ],
          total: 1,
        },
      });
    if (path === "/api/projects/me") return route.fulfill({ json: [] });
    if (path === `/api/projects/${campaignId}`)
      return route.fulfill({
        json: {
          project: {
            id: campaignId,
            projectType: "ROI",
            name: "Hidden investment",
            status: "FUNDING",
          },
          milestones: [],
        },
      });
    if (path.endsWith("/saved"))
      return route.fulfill({ json: { saved: false } });
    return route.fulfill({ json: [] });
  });
  return requests;
}

for (const width of [390, 768, 1024, 1440]) {
  test(`charity dashboard tabs remain reachable and search does not collide at ${width}px`, async ({
    page,
  }) => {
    const requests = await charitySession(page);
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/dashboard");
    const nav = page.getByRole("navigation", { name: "Dashboard sections" });
    await expect(
      nav.getByRole("button", { name: "Donations", exact: true }),
    ).toBeVisible();
    await expect(
      nav.getByRole("button", { name: "My Projects", exact: true }),
    ).toBeVisible();
    await expect(
      nav.getByRole("button", { name: "Identity", exact: true }),
    ).toBeVisible();
    const search = page.getByRole("textbox", {
      name: "Search dashboard projects",
    });
    const [tabsBox, searchBox] = await Promise.all([
      nav.boundingBox(),
      search.boundingBox(),
    ]);
    expect(tabsBox).not.toBeNull();
    expect(searchBox).not.toBeNull();
    expect(searchBox!.y).toBeGreaterThanOrEqual(tabsBox!.y + tabsBox!.height);
    await search.fill("Charity test");
    await expect(page.getByText("Charity test cause").first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Investments", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "My Receipts", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Investments", exact: true }),
    ).toHaveCount(0);
    expect(requests).toContain("/api/projects/donations/me");
    expect(
      requests.some((path) =>
        /^\/api\/(investments|nfts|marketplace)(\/|$)/.test(path),
      ),
    ).toBe(false);
    await nav.getByRole("button", { name: "Identity", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Verification Details" }).first(),
    ).toBeVisible();
    await nav.getByRole("button", { name: "My Projects", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Your Managed Projects" }),
    ).toBeVisible();
  });
}

test("first Create Campaign Back is enabled and returns to dashboard; investment choice is hidden even for eligible admins", async ({
  page,
}) => {
  await charitySession(page);
  await page.goto("/dashboard/create-project");
  await expect(
    page.getByRole("heading", { name: "Choose project type" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Investment", exact: true }),
  ).toHaveCount(0);
  const back = page.getByRole("button", { name: "Back", exact: true });
  await expect(back).toBeEnabled();
  await back.click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("old investment and marketplace URLs cannot expose investment actions", async ({
  page,
}) => {
  await charitySession(page);
  await page.goto("/explore?type=ROI");
  await expect(page.getByText("Charity test cause").first()).toBeVisible();
  await expect(page.getByText("ROI Projects", { exact: true })).toHaveCount(0);
  await expect(
    page.getByText("Hidden investment", { exact: true }),
  ).toHaveCount(0);
  await page.goto("/marketplace");
  await expect(page).toHaveURL(/\/explore\?type=CHARITY$/);
  await page.goto(`/projects/${campaignId}`);
  await expect(
    page.getByRole("heading", { name: "Project Not Found" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Invest Now" })).toHaveCount(0);
});

test("charity milestone review precedes release and settlement failure is visible", async ({
  page,
}) => {
  await charitySession(page);
  let status = "PLANNED";
  let submits = 0,
    reviews = 0,
    releases = 0;
  await page.route(`**/api/projects/${campaignId}`, (route) =>
    route.fulfill({
      json: {
        project: { type: "CHARITY" },
        milestones: [
          {
            id: "milestone-1",
            title: "Test delivery",
            status,
            payoutPercentage: 100,
            proofLinks:
              status === "PLANNED" ? [] : ["https://keibo.test/evidence"],
          },
        ],
      },
    }),
  );
  await page.route(
    `**/api/projects/${campaignId}/milestones/milestone-1/submit`,
    (route) => {
      submits++;
      expect(route.request().postDataJSON()).toEqual({
        proofLinks: ["https://keibo.test/evidence"],
      });
      status = "IN_REVIEW";
      return route.fulfill({ json: { status } });
    },
  );
  await page.route(
    `**/api/admin/projects/${campaignId}/milestones/milestone-1/decision`,
    (route) => {
      reviews++;
      expect(route.request().postDataJSON()).toMatchObject({
        decision: "APPROVED",
        reason: "Reviewed sandbox delivery evidence",
      });
      status = "APPROVED";
      return route.fulfill({ json: { status } });
    },
  );
  await page.route("**/api/wallet/withdraw", (route) => {
    releases++;
    return route.fulfill({
      status: 409,
      json: { message: "Campaign has no settled funds available" },
    });
  });
  await page.goto(`/dashboard/withdraw?projectId=${campaignId}`);
  await page
    .getByRole("combobox", { name: "Campaign milestone" })
    .selectOption("milestone-1");
  const release = page.getByRole("button", {
    name: "Release milestone funds",
    exact: true,
  });
  await expect(release).toBeDisabled();
  await page
    .getByLabel("Milestone evidence URL")
    .fill("https://keibo.test/evidence");
  await page
    .getByRole("button", { name: "Submit evidence for review" })
    .click();
  await expect(page.getByText("IN_REVIEW", { exact: true })).toBeVisible();
  await expect(release).toBeDisabled();
  await page
    .getByLabel("Administrator review reason")
    .fill("Reviewed sandbox delivery evidence");
  await page
    .getByRole("button", { name: "Approve milestone", exact: true })
    .click();
  await expect(release).toBeEnabled();
  await release.click();
  await expect(
    page.getByText("Campaign has no settled funds available", { exact: true }),
  ).toBeVisible();
  expect({ submits, reviews, releases }).toEqual({
    submits: 1,
    reviews: 1,
    releases: 1,
  });
  await expect(
    page.getByText(/Funds released to your KEIBO payable balance/),
  ).toHaveCount(0);
});
