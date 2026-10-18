import { expect, test, type Page } from "@playwright/test";
import { displayDate } from "../../src/lib/display-date";
const id = "507f1f77bcf86cd799439011";
const wallet = "0x1111111111111111111111111111111111111111";
const viewports = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
];
async function fixtures(
  page: Page,
  type = "ROI",
  persistedWallet = false,
  status = "FUNDING",
) {
  let primaryWallet = persistedWallet ? wallet : undefined;
  let challenges = 0;
  let links = 0;
  let decisions = 0;
  await page.context().addCookies([
    {
      name: "keibo_access",
      value: "isolated-stabilization",
      url: "http://127.0.0.1:3000",
    },
  ]);
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/users/me")
      return route.fulfill({
        json: {
          id: "creator",
          roles: ["ADMIN", "INNOVATOR"],
          emailVerified: true,
          primaryWallet,
          linkedWallets: [],
          creatorVerification: { status: "VERIFIED" },
          kycStatus: "VERIFIED",
          capabilities: { createRoi: true, createCharity: true, viewRoi: true },
        },
      });
    if (path === "/api/auth/csrf")
      return route.fulfill({ json: { csrfToken: "isolated-stabilization" } });
    if (path === "/api/auth/siwe/nonce") {
      challenges++;
      return route.fulfill({
        json: {
          purpose: "link",
          nonce: "a1b2c3d4e5f60708",
          domain: "localhost",
          uri: "http://localhost",
          chainIds: [11155111],
          issuedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 240000).toISOString(),
        },
      });
    }
    if (path === "/api/users/me/wallets") {
      links++;
      primaryWallet = wallet;
      return route.fulfill({ json: { primaryWallet } });
    }
    const campaign = {
      _id: id,
      name: "Stabilization investment",
      projectType: type,
      status,
      creatorId: "creator",
      onchainProvisioningStatus: "READY",
      projectOnchainId: "0",
      story: "A genuine fixture story",
      summary: "Fixture",
      targetAmount: 100,
      currency: "USDC",
      risks: "Capital can be lost",
      disclosures: ["No guaranteed returns"],
      roiAgreements: [
        { title: "Investor terms", content: "Read the project agreement" },
      ],
      milestones: [
        {
          title: "Delivery milestone",
          description: "Deliver equipment",
          dueDate: "2030-01-15T00:00:00.000Z",
        },
      ],
    };
    if (path === `/api/projects/${id}`)
      return route.fulfill({
        json: { project: campaign, milestones: campaign.milestones },
      });
    if (path.endsWith("/saved"))
      return route.fulfill({ json: { saved: false } });
    if (path.includes("/decision")) {
      decisions++;
      return route.fulfill({
        status: 400,
        json: {
          message:
            "Approval blocked: fixture chain failure. Project status is unchanged.",
        },
      });
    }
    if (path.includes("/admin") && path.includes("projects"))
      return route.fulfill({
        json: {
          projects: [
            {
              ...campaign,
              status: "PENDING_REVIEW",
              onchainProvisioningStatus: "FAILED",
              onchainProvisioningError: "fixture chain failure",
            },
          ],
        },
      });
    return route.fulfill({ json: [] });
  });
  return { counts: () => ({ challenges, links, decisions }) };
}
async function injectWallet(page: Page, rejectSignature = true) {
  await page.addInitScript(
    ({ wallet, rejectSignature }) => {
      const listeners = new Map<string, Array<(...args: unknown[]) => void>>();
      let connected =
        sessionStorage.getItem("fixture-wallet-connected") === "true";
      const provider = {
        isMetaMask: true,
        on(event: string, listener: (...args: unknown[]) => void) {
          listeners.set(event, [...(listeners.get(event) || []), listener]);
        },
        removeListener() {},
        async request({ method }: { method: string; params?: unknown[] }) {
          if (method === "eth_chainId") return "0xaa36a7";
          if (method === "net_version") return "11155111";
          if (method === "eth_accounts") return connected ? [wallet] : [];
          if (method === "eth_requestAccounts") {
            connected = true;
            sessionStorage.setItem("fixture-wallet-connected", "true");
            return [wallet];
          }
          if (
            method === "wallet_requestPermissions" ||
            method === "wallet_getPermissions"
          )
            return [
              {
                parentCapability: "eth_accounts",
                caveats: [
                  { type: "restrictReturnedAccounts", value: [wallet] },
                ],
              },
            ];
          if (method === "personal_sign") {
            if (!rejectSignature) return `0x${"11".repeat(65)}`;
            const error = new Error("User rejected the signature") as Error & {
              code: number;
            };
            error.code = 4001;
            throw error;
          }
          throw new Error(`Unexpected wallet method: ${method}`);
        },
      };
      Object.defineProperty(window, "ethereum", {
        value: provider,
        configurable: true,
      });
    },
    { wallet, rejectSignature },
  );
}
for (const viewport of viewports) {
  test(`ROI detail and wallet action at ${viewport.width}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await fixtures(page);
    await page.goto(`/projects/${id}`);
    await expect(
      page.getByText("Investment Escrow Tracking", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Donation Transparency Tracking", { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByText("Donation Disclosure", { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByText("Capital can be lost", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Investor terms", { exact: true }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("button", { name: "Connect Wallet", exact: true })
        .filter({ visible: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Invest Now", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: /timeline/i }).click();
    await expect(page.getByText("15 Jan 2030", { exact: false })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
  test(`admin failure dismisses and a new failure can reappear at ${viewport.width}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const fixture = await fixtures(page);
    await page.goto("/admin");
    await expect(
      page.getByText("Platform Overview", { exact: true }),
    ).toBeVisible();
    const campaignsTab = page.getByRole("button", {
      name: "Campaigns",
      exact: true,
    });
    await expect(campaignsTab).toBeVisible();
    await campaignsTab.click();
    await page.getByRole("button", { name: "Approve", exact: true }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: "Campaign action failed" }),
    ).toContainText("HTTP 400");
    await page
      .getByRole("button", { name: "Dismiss campaign action error" })
      .click();
    await expect(
      page.getByRole("alert").filter({ hasText: "Campaign action failed" }),
    ).toHaveCount(0);
    for (const button of await page
      .getByRole("button", { name: "Dismiss notification" })
      .all())
      await button.click();
    await expect(
      page.getByText("Campaign action failed", { exact: true }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "Approve", exact: true }).click();
    await expect(
      page.getByText("Campaign action failed", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("PENDING REVIEW", { exact: true }).first(),
    ).toBeVisible();
    expect(fixture.counts().decisions).toBe(2);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
}
test("wallet rejection requires explicit retry and never links on mount or navigation", async ({
  page,
}) => {
  const fixture = await fixtures(page);
  await injectWallet(page);
  await page.goto("/dashboard");
  expect(fixture.counts().challenges).toBe(0);
  await page
    .getByRole("button", { name: "Connect Wallet", exact: true })
    .filter({ visible: true })
    .click();
  await page
    .getByRole("button", { name: "Link Wallet", exact: true })
    .filter({ visible: true })
    .click();
  await expect(
    page.getByText(/Wallet linking cancelled or failed/),
  ).toBeVisible();
  expect(fixture.counts()).toMatchObject({ challenges: 1, links: 0 });
  await page.goto("/explore");
  await expect(
    page
      .getByRole("button", { name: "Link Wallet", exact: true })
      .filter({ visible: true }),
  ).toBeVisible();
  expect(fixture.counts()).toMatchObject({ challenges: 1, links: 0 });
  await page
    .getByRole("button", { name: "Link Wallet", exact: true })
    .filter({ visible: true })
    .click();
  await expect.poll(() => fixture.counts().challenges).toBe(2);
});
test("charity keeps donation disclosure and optional media can be empty", async ({
  page,
}) => {
  await fixtures(page, "CHARITY");
  await page.goto(`/projects/${id}`);
  await expect(
    page.getByText("Donation Disclosure", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Investment Disclosure", { exact: true }),
  ).toHaveCount(0);
  await expect(page.locator('img[src=""]')).toHaveCount(0);
});
test("schedule dates preserve calendar days and handle missing or invalid data", () => {
  expect(displayDate("2030-01-15")).toBe("15 Jan 2030");
  expect(displayDate("2030-01-15T00:00:00.000Z")).toBe("15 Jan 2030");
  expect(displayDate()).toBe("Not set");
  expect(displayDate("invalid")).toBe("Date unavailable");
});

test("first explicit link becomes server-persisted and refresh does not request another signature", async ({
  page,
}) => {
  const fixture = await fixtures(page);
  await injectWallet(page, false);
  await page.goto("/dashboard");
  await page
    .getByRole("button", { name: "Connect Wallet", exact: true })
    .filter({ visible: true })
    .click();
  await expect(
    page
      .getByRole("button", { name: "Link Wallet", exact: true })
      .filter({ visible: true }),
  ).toBeVisible();
  expect(fixture.counts().challenges).toBe(0);
  await page
    .getByRole("button", { name: "Link Wallet", exact: true })
    .filter({ visible: true })
    .click();
  await expect(
    page
      .getByRole("button", { name: /Linked 0x1111/ })
      .filter({ visible: true }),
  ).toBeVisible();
  expect(fixture.counts()).toMatchObject({ challenges: 1, links: 1 });
  await page.reload();
  await expect(
    page
      .getByRole("button", { name: /Linked 0x1111/ })
      .filter({ visible: true }),
  ).toBeVisible();
  expect(fixture.counts()).toMatchObject({ challenges: 1, links: 1 });
});
test("a previously linked connected wallet never requests another challenge", async ({
  page,
}) => {
  const fixture = await fixtures(page, "ROI", true);
  await injectWallet(page);
  await page.goto("/dashboard");
  await page
    .getByRole("button", { name: "Connect Wallet", exact: true })
    .filter({ visible: true })
    .click();
  await expect(
    page
      .getByRole("button", { name: /Linked 0x1111/ })
      .filter({ visible: true }),
  ).toBeVisible();
  expect(fixture.counts()).toMatchObject({ challenges: 0, links: 0 });
});
for (const viewport of viewports) {
  test(`ROI Review includes story, milestones, risks, dates and empty media at ${viewport.width}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await fixtures(page);
    await page.goto("/dashboard/create-project");
    await page.getByRole("button", { name: /^Investment/ }).click();
    await page.getByRole("button", { name: "Next Step" }).click();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page
      .getByPlaceholder("e.g. Solar Energy for Rural Schools")
      .fill("Creator-signed campaign fixture");
    await page
      .getByPlaceholder("e.g. St. Jude Primary School")
      .fill("Fixture company");
    await page
      .getByPlaceholder(
        "Briefly describe the impact of your project in 2 sentences...",
      )
      .fill("A complete test investment summary");
    await page.getByRole("button", { name: "Next Step" }).click();
    await page
      .getByPlaceholder(
        "Tell the world why you started this, the challenges you face, and the exact difference you will make. Use paragraphs for readability...",
      )
      .fill("Review must retain this full investment story.");
    await page.getByRole("button", { name: "Next Step" }).click();
    await page.getByPlaceholder("1000000").fill("100");
    await page.locator("input[type=date]").first().fill("2099-12-31");
    await page.getByRole("button", { name: /Add Milestone/i }).click();
    await page
      .getByPlaceholder("e.g. Groundbreaking & Foundations")
      .fill("Equipment delivery");
    await page.getByPlaceholder("e.g. 25").fill("100");
    await page.locator("input[type=date]").nth(1).fill("2099-11-15");
    await page.getByRole("button", { name: "Next Step" }).click();
    await page
      .getByLabel("Investment risks", { exact: true })
      .fill("Loss of invested capital");
    await page
      .getByLabel("Disclosures (one per line)")
      .fill("Delivery is uncertain");
    await page.getByRole("button", { name: "Next Step" }).click();
    const review = page.getByRole("region", {
      name: "Review campaign details",
    });
    await expect(review).toContainText(
      "Review must retain this full investment story.",
    );
    await expect(review).toContainText("Equipment delivery");
    await expect(review).toContainText("15 Nov 2099");
    await expect(review).toContainText("Loss of invested capital");
    await expect(review).toContainText("Delivery is uncertain");
    await expect(review).toContainText("No cover image");
    await expect(page.getByText("Beneficiary", { exact: true })).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
}

for (const viewport of viewports) {
  test(`pending-review notice is explicit in both themes at ${viewport.width}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await fixtures(page, "ROI", false, "PENDING_REVIEW");
    await page.goto(`/projects/${id}`);
    const notice = page.getByRole("status", { name: "Campaign review status" });
    await expect(notice).toContainText("Your campaign is under review");
    await expect(notice).toBeVisible();
    await page.evaluate(() => document.documentElement.classList.add("dark"));
    await expect(notice).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
}
