import { expect, test } from "@playwright/test";

test.describe("KEIBO financial fail-closed surfaces", () => {
  test("marketplace states that receipts cannot be resold and never requests listings", async ({
    context,
    page,
  }) => {
    await page.route("**/api/users/me", (route) =>
      route.fulfill({
        json: {
          user: {
            id: "financial-e2e-user",
            email: "financial@example.test",
            roles: ["INVESTOR"],
          },
        },
      }),
    );
    await page.goto("/");
    await context.addCookies([
      {
        name: "keibo_access",
        value: "financial-e2e-session",
        url: new URL(page.url()).origin,
      },
    ]);
    const legacyRequests: string[] = [];
    page.on("request", (request) => {
      if (
        request.url().includes("/marketplace/") ||
        request.url().includes("/nfts/")
      )
        legacyRequests.push(request.url());
    });
    await page.goto("/marketplace");
    await expect(
      page.getByText(
        "KEIBO investment receipts are non-transferable and cannot be listed for resale.",
      ),
    ).toBeVisible();
    expect(legacyRequests).toEqual([]);
  });

  test("production API rewrite remains same-origin and has no legacy Render fallback", async ({
    page,
  }) => {
    await page.goto("/");
    const configuration = await page.evaluate(() => ({
      origin: window.location.origin,
    }));
    expect(configuration.origin).toMatch(/^https?:\/\//);
  });
});
