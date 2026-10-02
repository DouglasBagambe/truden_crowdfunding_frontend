import { expect, test } from "@playwright/test";

const authenticatedUser = {
  id: "uat-browser-user",
  email: "uat@example.test",
  roles: ["INNOVATOR"],
  capabilities: { createCharity: true, createRoi: false },
};

test("an authenticated direct dashboard visit remains authenticated after refresh", async ({
  page,
  context,
  baseURL,
}) => {
  if (!baseURL) throw new Error("Playwright baseURL is required");
  const url = new URL(baseURL);
  await context.addCookies([
    {
      name: "keibo_access",
      value: "uat-browser-session",
      domain: url.hostname,
      path: "/",
    },
  ]);
  await page.route("**/api/users/me", async (route) => {
    await route.fulfill({ json: authenticatedUser });
  });

  await page.goto("/dashboard");
  await expect(page).not.toHaveURL(/\/login/);
  await page.reload();
  await expect(page).not.toHaveURL(/\/login/);
});

test("anonymous settings deep link redirects to the canonical login route", async ({
  page,
}) => {
  await page.goto("/settings");
  await expect(page).toHaveURL(/\/login\?next=%2Fsettings/);
});
