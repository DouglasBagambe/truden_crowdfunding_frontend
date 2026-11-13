import { expect, test, type Page } from "@playwright/test";

import { campaignMediaUrl } from "../../src/lib/campaign-media";
import { safeRedirectPath } from "../../src/lib/safe-redirect";

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
          firstName: "Public",
          lastName: "Donor",
          roles: ["INNOVATOR", "ADMIN"],
          emailVerifiedAt: "2026-10-01",
          kycStatus: "VERIFIED",
          capabilities: { createCharity: true, createRoi: true, viewRoi: true },
        },
      });
    if (path === "/api/auth/csrf")
      return route.fulfill({ json: { csrfToken: "charity-test" } });
    if (path === "/api/financial/availability")
      return route.fulfill({
        json: {
          donationsConfigured: true,
          payoutsConfigured: true,
          payoutEnvironment: "live",
          realWithdrawalsConfigured: true,
        },
      });
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

test("charity creation requires no milestones and submits no milestone schedule", async ({
  page,
}) => {
  await charitySession(page);
  let submitted: Record<string, unknown> | undefined;
  await page.route("**/api/projects", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    submitted = route.request().postDataJSON();
    await route.fulfill({ json: { project: { id: campaignId } } });
  });
  await page.goto("/dashboard/create-project");
  const next = page.getByRole("button", { name: "Next Step", exact: true });
  await next.click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByPlaceholder("e.g. Solar Energy for Rural Schools")
    .fill("Sandbox charity creation");
  await page
    .getByPlaceholder("e.g. St. Jude Primary School")
    .fill("Sandbox test only");
  await page
    .getByPlaceholder(
      "Briefly describe the impact of your project in 2 sentences...",
    )
    .fill("Sandbox-only workflow regression, no real donations.");
  await next.click();
  await page
    .getByPlaceholder(
      "Tell the world why you started this, the challenges you face, and the exact difference you will make. Use paragraphs for readability...",
    )
    .fill("This is sandbox test content, not a real charitable appeal.");
  await next.click();
  await page.getByRole("spinbutton").fill("10000");
  const futureDate = new Date(Date.now() + 30 * 86400_000)
    .toISOString()
    .slice(0, 10);
  await page.locator('input[type="date"]').fill(futureDate);
  await expect(
    page.getByRole("button", { name: "ADD MILESTONE", exact: true }),
  ).toHaveCount(0);
  await next.click();
  await next.click();
  await expect(
    page.getByRole("region", { name: "Review campaign details" }),
  ).not.toContainText("Milestones");
  await page
    .getByRole("button", { name: "Submit project", exact: true })
    .click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(submitted).toMatchObject({ type: "CHARITY" });
  expect(submitted).not.toHaveProperty("milestones");
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

test("campaign transfer only credits Wallet; Withdraw all queues one external payout", async ({
  page,
}) => {
  await charitySession(page);
  let available = "0",
    held = "0",
    transfers = 0,
    withdrawals = 0;
  await page.route("**/api/projects/me", (r) =>
    r.fulfill({
      json: [
        {
          id: campaignId,
          name: "My charity",
          projectType: "CHARITY",
          status: "APPROVED",
        },
      ],
    }),
  );
  await page.route("**/api/financial/wallet", (r) =>
    r.fulfill({
      json: {
        balances: [
          {
            currency: "UGX",
            availableMinor: available,
            heldMinor: held,
            paidMinor: "0",
          },
        ],
        transfers: [],
      },
    }),
  );
  await page.route("**/api/financial/payout-destinations", (r) =>
    r.fulfill({
      json: [
        {
          id: "dest",
          status: "verified",
          currency: "UGX",
          maskedDisplay: "Mobile money •••1234",
        },
      ],
    }),
  );
  await page.route("**/api/financial/wallet/transfers", (r) => {
    transfers++;
    expect(r.request().postDataJSON()).toEqual({ projectId: campaignId });
    expect(r.request().headers()["idempotency-key"]).toBeTruthy();
    available = "9500";
    return r.fulfill({ json: { id: "wallet-credit" } });
  });
  await page.route("**/api/financial/wallet/withdrawals", (r) => {
    withdrawals++;
    expect(r.request().postDataJSON()).toEqual({
      destinationId: "dest",
      expectedAmountMinor: "9500",
    });
    available = "0";
    held = "9500";
    return r.fulfill({
      json: {
        id: "withdrawal",
        state: "pending",
        keiboReference: "wallet-ref",
      },
    });
  });
  await page.goto("/dashboard?tab=wallet");
  await page.getByLabel("Wallet payout destination").selectOption("dest");
  await expect(
    page.getByRole("button", { name: "Withdraw all", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Transfer My charity to wallet", exact: true })
    .dblclick();
  await expect(
    page.getByText(/No bank or mobile-money payment was made/),
  ).toBeVisible();
  expect(transfers).toBe(1);
  expect(withdrawals).toBe(0);
  await expect(
    page.getByRole("button", { name: "Withdraw all", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Withdraw all", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Confirm Wallet withdrawal" }),
  ).toContainText("9,500");
  await page
    .getByRole("button", { name: "Confirm withdrawal", exact: true })
    .click();
  await expect(page.getByText(/Withdrawal queued, not yet paid/)).toBeVisible();
  expect(withdrawals).toBe(1);
  await expect(
    page.getByRole("button", { name: "Withdraw all", exact: true }),
  ).toBeDisabled();
  await expect(page.getByText(/Milestone/)).toHaveCount(0);
});

test("Wallet explains unavailable live payouts before accepting a withdrawal", async ({
  page,
}) => {
  await charitySession(page);
  await page.route("**/api/financial/availability", (r) =>
    r.fulfill({
      json: {
        donationsConfigured: true,
        payoutsConfigured: true,
        payoutEnvironment: "test",
        realWithdrawalsConfigured: false,
      },
    }),
  );
  await page.route("**/api/financial/wallet", (r) =>
    r.fulfill({
      json: {
        balances: [
          {
            currency: "UGX",
            availableMinor: "475",
            heldMinor: "0",
            paidMinor: "0",
          },
        ],
        transfers: [],
      },
    }),
  );
  await page.route("**/api/financial/payout-destinations", (r) =>
    r.fulfill({
      json: [
        {
          id: "test-destination",
          status: "verified",
          currency: "UGX",
          maskedDisplay: "Mobile money •••1234",
        },
      ],
    }),
  );
  await page.goto("/dashboard?tab=wallet");
  await expect(
    page.getByText("Bank and mobile-money withdrawals are disabled.", {
      exact: false,
    }),
  ).toBeVisible();
  await page
    .getByLabel("Wallet payout destination")
    .selectOption("test-destination");
  await expect(
    page.getByRole("button", { name: "Withdraw all", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Add bank or mobile money", exact: true }),
  ).toBeDisabled();
});

for (const availabilityFailure of ["disabled", "unreachable"] as const) {
  test(`Wallet fails closed for open withdrawal and destination forms when payouts become ${availabilityFailure}`, async ({
    page,
  }) => {
    await charitySession(page);
    let payoutsAvailable = true;
    let externalRequests = 0;
    await page.route("**/api/financial/availability", (route) => {
      if (!payoutsAvailable && availabilityFailure === "unreachable") {
        return route.fulfill({ status: 503, json: { message: "Unavailable" } });
      }
      return route.fulfill({
        json: {
          donationsConfigured: true,
          payoutsConfigured: true,
          payoutEnvironment: payoutsAvailable ? "live" : "test",
          realWithdrawalsConfigured: payoutsAvailable,
        },
      });
    });
    await page.route("**/api/financial/wallet", (route) =>
      route.fulfill({
        json: {
          balances: [
            {
              currency: "UGX",
              availableMinor: "475",
              heldMinor: "0",
              paidMinor: "0",
            },
          ],
          transfers: [],
        },
      }),
    );
    await page.route("**/api/financial/payout-destinations", (route) => {
      if (route.request().method() !== "GET") {
        externalRequests++;
        return route.fulfill({ status: 500, json: {} });
      }
      return route.fulfill({
        json: [
          {
            id: "dest",
            status: "verified",
            currency: "UGX",
            maskedDisplay: "Mobile money •••1234",
          },
        ],
      });
    });
    await page.route("**/api/financial/wallet/withdrawals", (route) => {
      externalRequests++;
      return route.fulfill({ status: 500, json: {} });
    });
    await page.goto("/dashboard?tab=wallet");
    await page.getByLabel("Wallet payout destination").selectOption("dest");
    await page
      .getByRole("button", { name: "Withdraw all", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Add bank or mobile money", exact: true })
      .click();
    const confirm = page.getByRole("button", {
      name: "Confirm withdrawal",
      exact: true,
    });
    const save = page.getByRole("button", {
      name: "Save destination",
      exact: true,
    });
    await expect(confirm).toBeEnabled();
    await expect(save).toBeEnabled();
    payoutsAvailable = false;
    await page
      .getByRole("button", { name: "Refresh wallet", exact: true })
      .click();
    if (availabilityFailure === "disabled") {
      await expect(
        page.getByText("Bank and mobile-money withdrawals are disabled.", {
          exact: false,
        }),
      ).toBeVisible();
    } else {
      await expect(
        page.getByText("Unavailable", { exact: true }),
      ).toBeVisible();
    }
    await expect(confirm).toBeDisabled();
    await expect(save).toBeDisabled();
    expect(externalRequests).toBe(0);
  });
}

test("double-clicking Donate starts only one checkout and a provider error allows explicit retry", async ({
  page,
}) => {
  await charitySession(page);
  await page.route(`**/api/projects/${campaignId}`, (route) =>
    route.fulfill({
      json: {
        project: {
          id: campaignId,
          projectType: "CHARITY",
          name: "Charity test cause",
          status: "APPROVED",
          currency: "UGX",
          targetAmount: 10000,
        },
        milestones: [],
      },
    }),
  );
  await page.route("**/api/payments/dpo/quote", (route) =>
    route.fulfill({
      json: {
        projectId: campaignId,
        projectType: "CHARITY",
        projectName: "Charity test cause",
        currency: "UGX",
        requestedAmount: 5000,
        grossAmount: 5200,
        dpoFee: 150,
        dpoVat: 0,
        keiboFee: 50,
        providerNetAmount: 5050,
        projectNetAmount: 5000,
        roundingAdjustment: 0,
      },
    }),
  );
  let intentRequests = 0,
    checkoutRequests = 0;
  const submittedNames: string[] = [];
  await page.route("**/api/financial/payment-intents", (route) => {
    intentRequests++;
    return route.fulfill({ json: { id: "same-intent", state: "pending" } });
  });
  await page.route("**/api/payments/dpo/initialize", async (route) => {
    checkoutRequests++;
    submittedNames.push(route.request().postDataJSON().donorName);
    await route.fulfill({
      status: 503,
      json: { message: "Sandbox provider unavailable; no charge attempted" },
    });
  });
  await page.goto(`/projects/${campaignId}`);
  await page.getByRole("button", { name: "Donate Now", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Public donor name" }),
  ).toHaveValue("Public Donor");
  await page.getByPlaceholder("e.g. 10000").fill("5000");
  await expect(page.getByText("Total", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Donate", exact: true }).dblclick();
  await expect(
    page.getByText("Sandbox provider unavailable; no charge attempted"),
  ).toBeVisible();
  expect({ intentRequests, checkoutRequests }).toEqual({
    intentRequests: 1,
    checkoutRequests: 1,
  });
  expect(submittedNames).toEqual(["Public Donor"]);
  await page.getByRole("checkbox", { name: "Donate anonymously" }).check();
  await page.getByRole("button", { name: "Donate", exact: true }).click();
  await expect.poll(() => checkoutRequests).toBe(2);
  expect(submittedNames).toEqual(["Public Donor", "Anonymous"]);
});

test("paid campaign funds with unknown provider fee cannot trigger a wallet transfer", async ({
  page,
}) => {
  await charitySession(page);
  await page.route("**/api/projects/me", (route) =>
    route.fulfill({
      json: [
        {
          id: campaignId,
          name: "Awaiting settlement charity",
          type: "CHARITY",
          projectType: "CHARITY",
          status: "APPROVED",
          currency: "UGX",
          raisedAmount: 2501,
          targetAmount: 10000,
          walletFunds: [
            {
              currency: "UGX",
              awaitingSettlementMinor: "2001",
              transferableMinor: "0",
              transferredMinor: "500",
            },
          ],
        },
      ],
    }),
  );
  await page.route("**/api/financial/wallet", (route) =>
    route.fulfill({
      json: {
        balances: [
          {
            currency: "UGX",
            availableMinor: "0",
            heldMinor: "475",
            paidMinor: "0",
          },
        ],
        transfers: [],
      },
    }),
  );
  let transfers = 0;
  await page.route("**/api/financial/wallet/transfers", (route) => {
    transfers++;
    return route.fulfill({ status: 500 });
  });
  await page.goto("/dashboard?tab=campaigns");
  await page
    .getByRole("navigation", { name: "Dashboard sections" })
    .getByRole("button", { name: "My Projects", exact: true })
    .click();
  await expect(page.getByText(/Payment confirmed; provider fee still being verified:/)).toContainText(
    "2,001",
  );
  await expect(
    page.getByRole("button", { name: "Transfer to wallet", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("navigation", { name: "Dashboard sections" })
    .getByRole("button", { name: "Wallet", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Transfer Awaiting settlement charity to wallet",
      exact: true,
    }),
  ).toBeDisabled();
  await expect(page.getByText(/Reserved for withdrawals:/)).toContainText(
    "475",
  );
  await expect(page.getByText(/Payment confirmed; provider fee still being verified:/)).toContainText(
    "2,001",
  );
  expect(transfers).toBe(0);
  await page.screenshot({
    path: test.info().outputPath("wallet-fund-location.png"),
    fullPage: true,
  });
});

test("charity discovery has no type selector or crypto wallet controls", async ({
  page,
}) => {
  const hydrationErrors: string[] = [];
  page.on("pageerror", (error) => {
    if (/hydration|server rendered HTML/i.test(error.message))
      hydrationErrors.push(error.message);
  });
  await charitySession(page);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Give where it counts" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: /All Projects|^Charity$|Connect Wallet|Link Wallet|^Linked /,
    }),
  ).toHaveCount(0);
  await page.goto("/explore");
  await expect(page.getByText("Project Type", { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /Connect Wallet|Link Wallet|^Linked / }),
  ).toHaveCount(0);
  await expect(
    page.locator('button[aria-label="Open account menu"]'),
  ).toHaveCount(1);
  expect(hydrationErrors).toEqual([]);
});

test("My Projects transfers funds once before opening Wallet, independently of payout setup", async ({
  page,
}) => {
  await charitySession(page);
  await page.route("**/api/projects/me", (r) =>
    r.fulfill({
      json: [
        {
          id: campaignId,
          name: "My charity",
          projectType: "CHARITY",
          status: "APPROVED",
          raisedAmount: 500,
          targetAmount: 10000,
        },
      ],
    }),
  );
  let transfers = 0;
  await page.route("**/api/financial/availability", (r) =>
    r.fulfill({
      json: {
        donationsConfigured: true,
        payoutsConfigured: true,
        payoutEnvironment: "test",
        realWithdrawalsConfigured: false,
      },
    }),
  );
  await page.route("**/api/financial/wallet/transfers", async (r) => {
    transfers++;
    expect(r.request().postDataJSON()).toEqual({ projectId: campaignId });
    expect(r.request().headers()["idempotency-key"]).toBeTruthy();
    await new Promise((resolve) => setTimeout(resolve, 150));
    return r.fulfill({
      json: { id: "wallet-credit", ownerProceedsMinor: "475" },
    });
  });
  await page.route("**/api/financial/wallet", (r) =>
    r.fulfill({
      json: {
        balances: [
          {
            currency: "UGX",
            availableMinor: transfers ? "475" : "0",
            heldMinor: "0",
            paidMinor: "0",
          },
        ],
        transfers: [],
      },
    }),
  );
  await page.goto("/dashboard");
  await page
    .getByRole("navigation", { name: "Dashboard sections" })
    .getByRole("button", { name: "My Projects", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Transfer to wallet", exact: true })
    .dblclick();
  await expect(
    page.getByText(
      "Campaign funds transferred to Wallet after the existing campaign fee. No bank or mobile-money payment was made.",
      { exact: true },
    ),
  ).toBeVisible();
  expect(transfers).toBe(1);
  await expect(
    page.getByRole("heading", { name: "Wallet", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/Flutterwave is running in test mode/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Transfer My charity to wallet",
      exact: true,
    }),
  ).toBeVisible();
  await page.goto(`/dashboard/withdraw?projectId=${campaignId}`);
  await expect(
    page.getByRole("heading", { name: "Wallet", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Campaign milestone" }),
  ).toHaveCount(0);
  await page.goto("/profile");
  await page.getByRole("button", { name: "Wallet", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Withdraw all", exact: true }),
  ).toBeVisible();
});

test("rejected My Projects transfer stays on campaigns and retries with the same idempotency key", async ({
  page,
}) => {
  await charitySession(page);
  await page.route("**/api/projects/me", (r) =>
    r.fulfill({
      json: [
        {
          id: campaignId,
          name: "My charity",
          projectType: "CHARITY",
          status: "APPROVED",
        },
      ],
    }),
  );
  const keys: string[] = [];
  await page.route("**/api/financial/wallet/transfers", (r) => {
    keys.push(r.request().headers()["idempotency-key"]);
    return keys.length === 1
      ? r.fulfill({
          status: 409,
          json: {
            message:
              "No settled campaign funds are available to transfer to Wallet",
          },
        })
      : r.fulfill({ json: { id: "wallet-credit" } });
  });
  await page.route("**/api/financial/wallet", (r) =>
    r.fulfill({ json: { balances: [], transfers: [] } }),
  );
  await page.goto("/dashboard");
  await page
    .getByRole("navigation", { name: "Dashboard sections" })
    .getByRole("button", { name: "My Projects", exact: true })
    .click();
  const transfer = page.getByRole("button", {
    name: "Transfer to wallet",
    exact: true,
  });
  await transfer.click();
  await expect(
    page.getByRole("alert").filter({ hasText: "No settled campaign funds" }),
  ).toContainText(
    "No settled campaign funds are available to transfer to Wallet",
  );
  await expect(
    page.getByRole("heading", { name: "Wallet", exact: true }),
  ).toHaveCount(0);
  await expect(transfer).toBeEnabled();
  await transfer.click();
  await expect(
    page.getByRole("heading", { name: "Wallet", exact: true }),
  ).toBeVisible();
  expect(keys).toHaveLength(2);
  expect(keys[0]).toBeTruthy();
  expect(keys[1]).toBe(keys[0]);
});

test("authentication return paths reject external and browser-normalized redirects", () => {
  for (const path of [
    "https://example.invalid",
    "//example.invalid",
    "/\\example.invalid",
    "/\t/example.invalid",
    "javascript:alert(1)",
  ]) {
    expect(safeRedirectPath(path, "/dashboard")).toBe("/dashboard");
  }
  expect(safeRedirectPath("/dashboard?tab=wallet")).toBe(
    "/dashboard?tab=wallet",
  );
});

test("Wallet payout history preserves currency and converts cents without combining balances", async ({
  page,
}) => {
  await charitySession(page);
  await page.route("**/api/financial/wallet", (r) =>
    r.fulfill({ json: { balances: [], transfers: [] } }),
  );
  await page.route("**/api/financial/payouts", (r) =>
    r.fulfill({
      json: [
        { id: "paid-ugx", amountMinor: "5000", currency: "UGX", state: "paid" },
        {
          id: "paid-usd",
          amountMinor: "12345",
          currency: "USD",
          state: "paid",
        },
        {
          id: "pending-usd",
          amountMinor: "1050",
          currency: "USD",
          state: "processing",
        },
      ],
    }),
  );
  await page.goto("/dashboard?tab=wallet");
  const usd = page.getByText("Paid out · USD", { exact: true }).locator("..");
  const ugx = page.getByText("Paid out · UGX", { exact: true }).locator("..");
  await expect(usd).toContainText("123.45");
  await expect(ugx).toContainText("5,000");
  await expect(
    page.getByText("In motion · USD", { exact: true }).locator(".."),
  ).toContainText("10.50");
  await expect(
    page.getByRole("row").filter({ hasText: "paid-usd" }),
  ).toContainText("123.45");
});

test("stopped withdrawal shows safe diagnostics without claiming payment or offering retry", async ({
  page,
}) => {
  await charitySession(page);
  let providerChecks = 0;
  let replacementPayments = 0;
  await page.route(
    "**/api/financial/payouts/stopped-payout/provider-evidence",
    (route) => {
      providerChecks++;
      expect(route.request().method()).toBe("GET");
      return route.fulfill({
        json: {
          outcome: "NO_MATCHING_TRANSFER",
          reference: "KEIBO-WALLET-stopped",
          checkedAt: new Date().toISOString(),
          message:
            "No matching transfer was returned for this reference. Admin reconciliation is required. No payment or balance change was made.",
        },
      });
    },
  );
  await page.route("**/api/financial/wallet/withdrawals", (route) => {
    replacementPayments++;
    return route.fulfill({ status: 500 });
  });
  await page.route("**/api/financial/wallet", (r) =>
    r.fulfill({
      json: {
        balances: [
          {
            currency: "UGX",
            availableMinor: "0",
            heldMinor: "475",
            paidMinor: "0",
          },
        ],
        transfers: [],
      },
    }),
  );
  await page.route("**/api/financial/payouts", (r) =>
    r.fulfill({
      json: [
        {
          id: "stopped-payout",
          keibo_reference: "KEIBO-WALLET-stopped",
          amount_minor: "475",
          currency: "UGX",
          state: "pending",
          processingStatus: "review_required",
          failureStage: "provider_submission",
          errorCode: "PROVIDER_PERMANENT",
          errorMessage:
            "Flutterwave transfer submission failed (HTTP 400): Amount is below the provider minimum.",
        },
      ],
    }),
  );
  await page.goto("/dashboard?tab=wallet");
  await expect(
    page.getByRole("alert").filter({ hasText: "withdrawal has stopped" }),
  ).toBeVisible();
  const row = page.getByRole("row").filter({ hasText: "KEIBO-WALLET-stopped" });
  await expect(row).toContainText("review required");
  await expect(row).toContainText("HTTP 400");
  await expect(row).toContainText("provider submission");
  await expect(row).toContainText("PROVIDER_PERMANENT");
  await expect(row).toContainText("Funds remain reserved");
  await expect(
    page.getByText("In motion · UGX", { exact: true }).locator(".."),
  ).toContainText("0");
  await expect(row.getByRole("button")).toHaveCount(0);
  expect(providerChecks).toBe(0);
  await page
    .getByRole("button", { name: "Check provider status", exact: true })
    .click();
  await expect(
    page.getByText(/No matching transfer was returned/),
  ).toBeVisible();
  expect(providerChecks).toBe(1);
  expect(replacementPayments).toBe(0);
});

test("KEIBO uploads survive a backend move without rewriting external media", () => {
  const path = "/api/projects/files/6ac6718422950b54565ade97";
  expect(
    campaignMediaUrl(`https://keibo-full-uat-api.onrender.com${path}`),
  ).toBe(path);
  expect(
    campaignMediaUrl(`https://keibo-full-uat-api-po8w.onrender.com${path}`),
  ).toBe(path);
  expect(campaignMediaUrl(`https://example.invalid${path}`)).toBe(
    `https://example.invalid${path}`,
  );
  expect(campaignMediaUrl(path)).toBe(path);
});

test("charity sessions never initialize or reconnect injected crypto wallets", async ({
  page,
}) => {
  await charitySession(page);
  await page.addInitScript(() => {
    const requests: string[] = [];
    Object.defineProperty(window, "__charityWalletRequests", {
      value: requests,
    });
    Object.defineProperty(window, "ethereum", {
      value: {
        isMetaMask: true,
        request: async ({ method }: { method: string }) => {
          requests.push(method);
          if (method === "eth_chainId") return "0xaa36a7";
          return [];
        },
        on: () => undefined,
        removeListener: () => undefined,
      },
    });
  });
  await page.goto("/dashboard");
  await expect(
    page.getByRole("navigation", { name: "Dashboard sections" }),
  ).toBeVisible();
  await page.goto("/profile");
  await expect(
    page.getByRole("button", { name: "Wallet", exact: true }),
  ).toBeVisible();
  const requests = await page.evaluate(
    () =>
      (window as unknown as { __charityWalletRequests: string[] })
        .__charityWalletRequests,
  );
  expect(requests).toEqual([]);
});
