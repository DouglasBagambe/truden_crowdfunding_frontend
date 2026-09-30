import {
  expect,
  test,
  type BrowserContext,
  type Page,
  type Route,
} from "@playwright/test";

const csrf = (route: Route) =>
  route.fulfill({ json: { csrfToken: "test-csrf" } });

async function mockSession(page: Page) {
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
  await page.route("**/api/auth/csrf", csrf);
}

async function authenticate(context: BrowserContext) {
  await context.addCookies([
    {
      name: "keibo_access",
      value: "financial-e2e-session",
      url: "http://127.0.0.1:3000",
    },
  ]);
}

test.describe("KEIBO financial fail-closed surfaces", () => {
  test("marketplace renders the non-transferable boundary without legacy listing traffic", async ({
    page,
  }) => {
    const legacyRequests: string[] = [];
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on("request", (request) => {
      if (
        /^\/api\/(marketplace|nfts?|wallet\/withdrawal-method)(\/|$)/.test(
          new URL(request.url()).pathname,
        )
      )
        legacyRequests.push(request.url());
    });
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await page.goto("/marketplace");
    await expect(page).toHaveURL(/\/marketplace$/);
    await expect(page).toHaveTitle(/KEIBO/i);
    await expect(
      page.getByText(
        "KEIBO investment receipts are non-transferable and cannot be listed for resale.",
      ),
    ).toBeVisible();
    expect(legacyRequests).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(
      consoleErrors.filter(
        (message) => !message.includes("Lit is in dev mode"),
      ),
    ).toEqual([]);
  });

  test("creator releases a charity milestone once and keeps external payout separate", async ({
    context,
    page,
  }) => {
    await authenticate(context);
    await mockSession(page);
    const releaseRequests: { body: unknown; idempotencyKey: string | null }[] =
      [];
    await page.route("**/api/projects/charity-1", (route) =>
      route.fulfill({
        json: {
          project: { type: "CHARITY" },
          milestones: [
            {
              id: "milestone-1",
              title: "First delivery",
              payoutPercentage: 50,
            },
          ],
        },
      }),
    );
    await page.route("**/api/financial/payout-destinations", (route) =>
      route.fulfill({ json: [] }),
    );
    await page.route("**/api/financial/payouts", (route) =>
      route.fulfill({ json: [] }),
    );
    await page.route("**/api/wallet/withdraw", async (route) => {
      releaseRequests.push({
        body: route.request().postDataJSON(),
        idempotencyKey: await route.request().headerValue("Idempotency-Key"),
      });
      await route.fulfill({ json: { id: "release-1" } });
    });

    await page.goto("/dashboard/withdraw?projectId=charity-1");
    await expect(
      page.getByRole("heading", { name: "Release milestone funds" }),
    ).toBeVisible();
    await page.locator("select").first().selectOption("milestone-1");
    const releaseButton = page.getByRole("button", {
      name: "Release milestone funds",
    });
    await releaseButton.dblclick();
    await expect(
      page
        .getByText(
          "Funds released to your KEIBO payable balance. External payout is a separate step.",
        )
        .first(),
    ).toBeVisible();
    expect(releaseRequests).toHaveLength(1);
    expect(releaseRequests[0]).toMatchObject({
      body: { projectId: "charity-1", milestoneId: "milestone-1" },
    });
    expect(releaseRequests[0].idempotencyKey).toBeTruthy();
    expect(JSON.stringify(releaseRequests[0].body)).not.toContain("amount");
    await expect(page.getByText(/bank\/mobile payout completed/i)).toHaveCount(
      0,
    );
  });

  test("release errors fail closed", async ({ context, page }) => {
    await authenticate(context);
    await mockSession(page);
    await page.route("**/api/projects/charity-1", (route) =>
      route.fulfill({
        json: {
          project: { type: "CHARITY" },
          milestones: [{ id: "milestone-1", title: "First delivery" }],
        },
      }),
    );
    await page.route("**/api/financial/payout-destinations", (route) =>
      route.fulfill({ json: [] }),
    );
    await page.route("**/api/financial/payouts", (route) =>
      route.fulfill({ json: [] }),
    );
    let status = 403;
    await page.route("**/api/wallet/withdraw", (route) =>
      route.fulfill({ status, json: { message: "rejected" } }),
    );
    await page.goto("/dashboard/withdraw?projectId=charity-1");
    await page.locator("select").first().selectOption("milestone-1");
    const release = page.getByRole("button", {
      name: "Release milestone funds",
    });
    await release.click();
    await expect(
      page.getByText("You are not eligible to perform this action."),
    ).toBeVisible();
    status = 409;
    await release.click();
    await expect(
      page.getByText(/already been processed or conflicts/i),
    ).toBeVisible();
    status = 503;
    await release.click();
    await expect(
      page.getByText(/temporarily unavailable. No action was completed/i),
    ).toBeVisible();
    await expect(
      page.getByText(/Funds released to your KEIBO payable balance/),
    ).toHaveCount(0);
  });

  test("destinations stay masked and external payout uses only a selected verified destination", async ({
    context,
    page,
  }) => {
    await authenticate(context);
    await mockSession(page);
    let destinations = [
      {
        id: "dest-1",
        type: "mobile_money",
        currency: "UGX",
        maskedDisplay: "MTN •••• 1234",
        status: "verified",
      },
    ];
    const payoutRequests: unknown[] = [];
    await page.route("**/api/projects/charity-1", (route) =>
      route.fulfill({
        json: {
          project: { type: "CHARITY" },
          milestones: [{ id: "milestone-1", title: "First delivery" }],
        },
      }),
    );
    await page.route(
      "**/api/financial/payout-destinations**",
      async (route) => {
        const pathname = new URL(route.request().url()).pathname;
        if (pathname.endsWith("/dest-1/disable")) {
          destinations = [
            { ...destinations[0], status: "disabled" },
            ...destinations.slice(1),
          ];
          return route.fulfill({ json: destinations[0] });
        }
        if (route.request().method() === "GET") {
          return route.fulfill({ json: destinations });
        }
        const body = route.request().postDataJSON() as {
          accountNumber: string;
        };
        expect(body.accountNumber).toBe("0770000000");
        destinations = [
          ...destinations,
          {
            id: "dest-2",
            type: "bank",
            currency: "UGX",
            maskedDisplay: "Bank •••• 9876",
            status: "verified",
          },
        ];
        return route.fulfill({ json: destinations[1] });
      },
    );
    await page.route("**/api/financial/payouts", (route) =>
      route.fulfill({
        json: [
          {
            id: "payout-pending",
            amountMinor: "5000",
            currency: "UGX",
            state: "pending",
            maskedDisplay: "MTN •••• 1234",
            keiboReference: "pay-1",
          },
        ],
      }),
    );
    await page.route("**/api/wallet/withdraw", (route) =>
      route.fulfill({ json: { id: "release-1" } }),
    );
    await page.route(
      "**/api/financial/releases/release-1/payout",
      async (route) => {
        payoutRequests.push(route.request().postDataJSON());
        await route.fulfill({
          json: {
            id: "payout-new",
            state: "processing",
            currency: "UGX",
            amountMinor: "5000",
          },
        });
      },
    );

    await page.goto("/dashboard/withdraw?projectId=charity-1");
    await expect(
      page.getByText("MTN •••• 1234 · UGX · verified"),
    ).toBeVisible();
    await page.getByPlaceholder("Account or mobile number").fill("0770000000");
    await page.getByRole("button", { name: "Add destination" }).click();
    await expect(
      page.getByText("Bank •••• 9876 · UGX · verified"),
    ).toBeVisible();
    await expect(page.getByText("0770000000")).toHaveCount(0);
    await page.getByRole("button", { name: "Disable" }).first().click();
    await expect(
      page.getByText("MTN •••• 1234 · UGX · disabled"),
    ).toBeVisible();
    await expect(
      page
        .getByText("MTN •••• 1234 · UGX · disabled")
        .locator("..")
        .getByRole("radio"),
    ).toBeDisabled();
    await page.locator("select").first().selectOption("milestone-1");
    await page.getByRole("button", { name: "Release milestone funds" }).click();
    const bankDestinationRow = page
      .locator('div:has(input[type="radio"])')
      .filter({ hasText: "Bank •••• 9876 · UGX · verified" });
    const bankDestinationRadio = bankDestinationRow.locator(
      'input[type="radio"]',
    );
    await expect(bankDestinationRadio).toBeEnabled();
    await bankDestinationRadio.check();
    await page.getByRole("button", { name: "Request payout" }).click();
    expect(payoutRequests).toEqual([{ destinationId: "dest-2" }]);
    await expect(
      page.getByText("PENDING · 5000 UGX · MTN •••• 1234 · pay-1"),
    ).toBeVisible();
    await expect(page.locator('input[type="number"]')).toHaveCount(0);
  });

  test("receipt lifecycle authorizes, issues, refreshes, and never exposes resale", async ({
    page,
  }) => {
    await mockSession(page);
    let state = "SUBMITTED";
    const receiptRequests: string[] = [];
    await page.route("**/api/payments/dpo/verify/settled-token", (route) =>
      route.fulfill({
        json: {
          status: "settled",
          paymentIntentId: "settlement-1",
          verify: { status: "settled", message: "Settled" },
        },
      }),
    );
    await page.route(
      "**/api/financial/receipts/settlement-1/authorize",
      (route) => {
        receiptRequests.push("authorize");
        return route.fulfill({ json: { state: "AUTHORIZED" } });
      },
    );
    await page.route(
      "**/api/financial/receipts/settlement-1/issue",
      (route) => {
        receiptRequests.push("issue");
        return route.fulfill({ json: { id: "receipt-1", state } });
      },
    );
    await page.route("**/api/financial/receipts/settlement-1", (route) => {
      receiptRequests.push("status");
      state = "ISSUED";
      return route.fulfill({ json: { id: "receipt-1", state } });
    });
    await page.goto("/payment/result?token=settled-token");
    await expect(
      page.getByText("Investment receipt", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(/KEIBO receipts are non-transferable/),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Issue investment receipt" })
      .click();
    await expect(page.getByText("Status: SUBMITTED")).toBeVisible();
    await page.getByRole("button", { name: "Refresh status" }).click();
    await expect(page.getByText("Status: ISSUED")).toBeVisible();
    expect(receiptRequests).toEqual(["authorize", "issue", "status"]);
    await expect(
      page.getByRole("button", { name: /resale|mint|marketplace/i }),
    ).toHaveCount(0);
  });
});
