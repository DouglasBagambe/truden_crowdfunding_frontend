import { expect, test, type Page } from "@playwright/test";
const campaign = {
  _id: "507f1f77bcf86cd799439011",
  name: "Test campaign",
  projectType: "CHARITY",
  category: "ngo",
  status: "APPROVED",
  summary: "Test",
  targetAmount: 10000,
  currency: "UGX",
};
async function session(page: Page) {
  await page.route("**/api/users/me", (route) =>
    route.fulfill({
      json: { id: "uat-user", roles: ["INVESTOR"], kycStatus: "NOT_VERIFIED" },
    }),
  );
  await page.route("**/api/auth/csrf", (route) =>
    route.fulfill({ json: { csrfToken: "isolated-test-csrf" } }),
  );
}
test("Explore follows URL, pagination metadata, reload and navbar search", async ({
  page,
  isMobile,
}) => {
  await session(page);
  await page.route("**/api/projects?**", (route) => {
    const params = new URL(route.request().url()).searchParams;
    const pageNumber = Number(params.get("page") || 1);
    const search = params.get("search") || "All";
    return route.fulfill({
      json: {
        projects: [{ ...campaign, name: `${search} page ${pageNumber}` }],
        total: 25,
        page: pageNumber,
        pageSize: 12,
      },
    });
  });
  await page.goto("/explore?search=Test");
  await expect(page.getByText("Test page 1", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByText("Test page 2", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Test page 2", { exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByText("Test page 1", { exact: true })).toBeVisible();
  if (!isMobile) {
    const search = page.getByPlaceholder("Search projects", { exact: true });
    await search.fill("Tes");
    await search.press("Enter");
    await expect(page.getByText("Tes page 1", { exact: true })).toBeVisible();
    await expect(
      page.getByPlaceholder("Search projects by title or description..."),
    ).toHaveValue("Tes");
  }
});
test("Save survives reload and donation dialog traps and restores focus without payment", async ({
  page,
}) => {
  await session(page);
  let saved = false;
  await page.route(`**/api/projects/${campaign._id}`, (route) =>
    route.fulfill({ json: { project: campaign, milestones: [] } }),
  );
  await page.route(`**/api/projects/${campaign._id}/donors*`, (route) =>
    route.fulfill({ json: [] }),
  );
  await page.route(`**/api/projects/${campaign._id}/saved`, (route) => {
    if (route.request().method() === "PUT") saved = true;
    if (route.request().method() === "DELETE") saved = false;
    return route.fulfill({ json: { saved } });
  });
  await page.route("**/api/payments/dpo/quote*", (route) =>
    route.fulfill({ json: {} }),
  );
  const submissions: string[] = [];
  page.on("request", (req) => {
    if (
      req.method() === "POST" &&
      /\/api\/(financial|payments)/.test(req.url())
    )
      submissions.push(req.url());
  });
  await page.goto(`/projects/${campaign._id}`);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Saved", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Saved", exact: true }),
  ).toBeVisible();
  const donate = page.getByRole("button", { name: /Donate Now/i }).first();
  await donate.click();
  const dialog = page.getByRole("dialog", { name: "Donate to Project" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  await page.keyboard.press("Shift+Tab");
  expect(
    await dialog.evaluate((el) => el.contains(document.activeElement)),
  ).toBe(true);
  await page.keyboard.press("Tab");
  expect(
    await dialog.evaluate((el) => el.contains(document.activeElement)),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(donate).toBeFocused();
  expect(submissions).toEqual([]);
});
test("one page has no fake controls and canonical category label agrees", async ({
  page,
  isMobile,
}) => {
  await session(page);
  await page.route("**/api/projects?**", (route) =>
    route.fulfill({
      json: { projects: [campaign], total: 1, page: 1, pageSize: 12 },
    }),
  );
  await page.goto("/explore?type=CHARITY&category=NGO");
  await expect(page.getByText("Test campaign", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Campaign pages" }),
  ).toHaveCount(0);
  if (isMobile)
    await page
      .getByRole("button", { name: /Filters/ })
      .first()
      .click();
  await expect(
    page.getByRole("button", { name: /Category: NGO/ }).last(),
  ).toBeVisible();
});

for (const scenario of [
  "profile-error",
  "submit-error",
  "hosted-session",
] as const) {
  test(`KYC ${scenario} exposes errors or hosted link without granting verification`, async ({
    page,
  }) => {
    await page.context().addCookies([
      {
        name: "keibo_access",
        value: "isolated-kyc-fixture",
        url: "http://127.0.0.1:3000",
      },
    ]);
    const requests: string[] = [];
    await page.route("**/api/**", (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === "/api/users/me")
        return route.fulfill({
          json: {
            id: "uat-user",
            firstName: "Test",
            lastName: "Tester",
            roles: ["CREATOR"],
            emailVerified: true,
            kycStatus: "NOT_VERIFIED",
            capabilities: {
              viewRoi: true,
              createRoi: false,
              createCharity: true,
            },
          },
        });
      if (path === "/api/auth/csrf")
        return route.fulfill({ json: { csrfToken: "isolated-kyc-fixture" } });
      if (path === "/api/kyc/profile") {
        if (route.request().method() === "PATCH") {
          requests.push("profile");
          if (scenario === "profile-error")
            return route.fulfill({
              status: 400,
              json: {
                message: ["dateOfBirth must be a valid ISO 8601 date string"],
              },
            });
        }
        return route.fulfill({
          json: {
            status: "DRAFT",
            userKycStatus: "NOT_VERIFIED",
            documents: [],
          },
        });
      }
      if (path === "/api/kyc/submit") {
        requests.push("submit");
        return scenario === "submit-error"
          ? route.fulfill({
              status: 503,
              json: {
                message:
                  "Identity verification is temporarily unavailable. Please contact support.",
              },
            })
          : route.fulfill({
              json: {
                status: "PENDING",
                userKycStatus: "PENDING",
                documents: [],
                verificationUrl: "https://verify.didit.me/isolated-session",
              },
            });
      }
      return route.fulfill({ json: [] });
    });
    await page.goto("/dashboard?tab=kyc");
    await page.getByRole("button", { name: "Start Verification" }).click();
    await page
      .getByRole("button", { name: "Continue to Verification" })
      .click();
    if (scenario === "hosted-session") {
      await expect(
        page.getByRole("link", { name: "Open Verification Page" }),
      ).toHaveAttribute("href", "https://verify.didit.me/isolated-session");
      expect(requests).toEqual(["profile", "submit"]);
    } else {
      await expect(
        page.getByText(
          scenario === "profile-error"
            ? "dateOfBirth must be a valid ISO 8601 date string"
            : "Identity verification is temporarily unavailable. Please contact support.",
          { exact: true },
        ),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Continue to Verification" }),
      ).toBeEnabled();
      expect(requests).toEqual(
        scenario === "profile-error" ? ["profile"] : ["profile", "submit"],
      );
    }
    await expect(page.getByText("Verified", { exact: true })).toHaveCount(0);
  });
}
