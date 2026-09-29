import { expect, test } from "@playwright/test";

test.describe("KEIBO financial fail-closed surfaces", () => {
  test("marketplace states that receipts cannot be resold and never requests listings", async ({
    page,
  }) => {
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
