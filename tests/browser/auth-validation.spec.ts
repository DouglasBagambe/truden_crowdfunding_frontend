import { expect, test } from "@playwright/test";

test.describe("authentication validation", () => {
  test("registration rejects required and weak input before any API submission", async ({
    page,
  }) => {
    const requests: string[] = [];
    page.on("request", (request) => requests.push(request.url()));

    await page.goto("/register");
    await page.getByRole("button", { name: "Create Global Account" }).click();
    await expect(page.locator('input[name="firstName"]')).toBeVisible();

    await page.locator('input[name="firstName"]').fill("QA");
    await page.locator('input[name="lastName"]').fill("Tester");
    await page.locator('input[name="email"]').fill("not-an-email");
    await page.locator('input[name="password"]').fill("weak");
    await page.getByRole("button", { name: "Create Global Account" }).click();

    await expect(page.getByText("At least 8 characters")).toBeVisible();
    await expect(page.locator('input[name="email"]')).toHaveValue(
      "not-an-email",
    );
    expect(requests.some((url) => /\/auth\/register/.test(url))).toBe(false);
    await expect(page.locator("body")).not.toContainText(/account created/i);
  });

  test("login uses browser validation and does not redirect-loop", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Sign Into Account" }).click();
    await expect(page).toHaveURL(/\/login/);

    await page
      .locator('input[type="email"]')
      .fill("qa-e2e-invalid@example.invalid");
    await page
      .locator('input[type="password"]')
      .fill("incorrect-only-for-validation");
    await page.getByRole("button", { name: "Sign Into Account" }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText("CSRF validation failed")).toBeVisible();
    await expect(page.locator("body")).not.toContainText(
      /token|secret|password:/i,
    );
  });

  test("auth pages do not persist auth tokens in web storage", async ({
    page,
  }) => {
    await page.goto("/login");
    const storage = await page.evaluate(() => ({
      local: Object.keys(localStorage),
      session: Object.keys(sessionStorage),
    }));
    expect(storage.local).not.toContain("access_token");
    expect(storage.local).not.toContain("keibo_access");
    expect(storage.session).not.toContain("access_token");
    expect(storage.session).not.toContain("keibo_access");
  });
});
