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
