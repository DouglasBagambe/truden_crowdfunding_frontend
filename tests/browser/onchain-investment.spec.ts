import { expect, test } from "@playwright/test";
import { build } from "esbuild";
import { investmentPresets } from "../../src/lib/investment-presets";

const wallet = "0x16795588BB337E43D90DF5008Aef0eebF1E17AA5";
const asset = "0x1c7d4b196cb0c7b01d743fbc6116a902379c7238";
let bundle: string;
test.beforeAll(async () => {
  const result = await build({
    stdin: {
      contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import {OnchainContributionButton} from './src/components/payments/OnchainContributionButton';
      const state = window.fixture;
      createRoot(document.getElementById('root')).render(<OnchainContributionButton projectId="campaign" projectName="Test campaign" projectOnchainId="0" investorWallet="${wallet}" amountMinor="1000000" agreements={state.agreements} onError={message => document.getElementById('error').textContent = message} onSettled={() => state.settled++} />);`,
      resolveDir: process.cwd(),
      loader: "tsx",
    },
    bundle: true,
    write: false,
    format: "iife",
    jsx: "automatic",
    define: {
      "process.env.NODE_ENV": '"production"',
      "process.env.NEXT_PUBLIC_KEIBO_ESCROW_ADDRESS":
        '"0xA6ef13Ad706BF24F0B28506FD18a06FEac9abF93"',
    },
    plugins: [
      {
        name: "isolated-wallet",
        setup(builder) {
          builder.onResolve(
            {
              filter:
                /^(wagmi|@\/lib\/financial-service|@\/lib\/user-service|@\/hooks\/useWalletSync|@\/lib\/api-client)$/,
            },
            (args) => ({ path: args.path, namespace: "fixture" }),
          );
          builder.onLoad({ filter: /.*/, namespace: "fixture" }, (args) => ({
            contents:
              args.path === "wagmi"
                ? `
        const state = window.fixture;
        export const useChainId = () => 11155111;
        export const useSwitchChain = () => ({switchChainAsync: async () => {}});
        export const usePublicClient = () => ({readContract: async ({functionName}) => {
          if (functionName === 'campaigns') return ['${wallet}', '${asset}', 10000000n, 0n, 9999999999n, 0];
          if (functionName === 'symbol') return 'USDC'; if (functionName === 'decimals') return 6;
          if (functionName === 'allowance') { if (state.rpcError) throw new Error('RPC unavailable'); return BigInt(state.allowance); }
        }, waitForTransactionReceipt: async () => ({status: state.reverted ? 'reverted' : 'success'})});
        export const useWriteContract = () => ({writeContractAsync: async request => { state.writes.push({functionName:request.functionName, amount:request.args.at(-1).toString()}); if(request.functionName === 'approve' && !state.insufficientAfterApproval) state.allowance = '1000000'; return '0x' + '1'.repeat(64); }});
      `
                : args.path.endsWith("financial-service")
                  ? `export const createPaymentIntent = async () => ({id:'intent'}); export const submitOnchainContribution = async () => {};`
                  : args.path.endsWith("user-service")
                    ? `export const userService = {getMe:async () => ({primaryWallet:'${wallet}'})};`
                    : args.path.endsWith("useWalletSync")
                      ? `export const hasLinkedWallet = (user,address) => user.primaryWallet.toLowerCase() === address.toLowerCase();`
                      : `export const financialErrorMessage = (error,fallback) => fallback;`,
          }));
        },
      },
    ],
  });
  bundle = result.outputFiles[0].text;
});

async function mount(
  page: import("@playwright/test").Page,
  allowance: string,
  options = {},
) {
  await page.route("http://127.0.0.1:3000/__onchain_fixture", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<html><body></body></html>",
    }),
  );
  await page.goto("http://127.0.0.1:3000/__onchain_fixture");
  await page.setContent('<div id="root"></div><div id="error"></div>');
  await page.evaluate(
    ({ allowance, options }) => {
      Object.assign(window, {
        fixture: {
          allowance,
          agreements: [],
          writes: [],
          settled: 0,
          ...options,
        },
      });
    },
    { allowance, options },
  );
  await page.addScriptTag({ content: bundle });
}
const writes = (page: import("@playwright/test").Page) =>
  page.evaluate(
    () =>
      (window as unknown as { fixture: { writes: unknown[] } }).fixture.writes,
  );

test("presets stay within remaining capacity, including fractions and closed campaigns", () => {
  expect(investmentPresets("USDC", 10)).toEqual([1, 2, 5, 10]);
  for (const remaining of [0, 0.000001, 0.25, 1.5, 3, 7, 10, 100]) {
    expect(
      investmentPresets("USDC", remaining).every(
        (value) => value > 0 && value <= remaining,
      ),
    ).toBe(true);
  }
  expect(investmentPresets("USDC", NaN)).toEqual([]);
});

test("sufficient allowance skips approval and review itself never opens a wallet", async ({
  page,
}) => {
  await mount(page, "1000000");
  await page.getByRole("button", { name: "Review investment" }).click();
  await expect(page.getByText(/Approval skipped/)).toBeVisible();
  expect(await writes(page)).toEqual([]);
  await expect(page.getByText("Investor fee: 0 USDC")).toBeVisible();
  await expect(page.getByText("Total debit: 1 USDC")).toBeVisible();
  await page.getByRole("button", { name: "Contribute 1 USDC" }).click();
  await expect(
    page.getByRole("button", { name: "Contribution settled" }),
  ).toBeDisabled();
  expect(await writes(page)).toEqual([
    { functionName: "contribute", amount: "1000000" },
  ]);
});

test("insufficient allowance approves exact amount and requires a second explicit click", async ({
  page,
}) => {
  await mount(page, "0");
  await page.getByRole("button", { name: "Review investment" }).click();
  await page.getByRole("button", { name: "Approve 1 USDC" }).click();
  await expect(page.getByText(/Approval confirmed/)).toBeVisible();
  expect(await writes(page)).toEqual([
    { functionName: "approve", amount: "1000000" },
  ]);
  await page.getByRole("button", { name: "Contribute 1 USDC" }).click();
  await expect(
    page.getByRole("button", { name: "Contribution settled" }),
  ).toBeDisabled();
  expect(await writes(page)).toEqual([
    { functionName: "approve", amount: "1000000" },
    { functionName: "contribute", amount: "1000000" },
  ]);
});

test("required agreements block progression and are shown visibly", async ({
  page,
}) => {
  await mount(page, "0", {
    agreements: [
      {
        title: "Campaign terms",
        description: "Review these terms",
        requiresAcceptance: true,
      },
    ],
  });
  await expect(
    page.getByRole("button", { name: "Review investment" }),
  ).toBeDisabled();
  await expect(page.getByText("Review these terms")).toBeVisible();
  expect(await writes(page)).toEqual([]);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Review investment" }).click();
  await expect(
    page.getByRole("button", { name: "Approve 1 USDC" }),
  ).toBeEnabled();
  await page.getByRole("checkbox").uncheck();
  await expect(
    page.getByRole("button", { name: "Review investment" }),
  ).toBeDisabled();
});

test("insufficient allowance after mined approval blocks contribution", async ({
  page,
}) => {
  await mount(page, "0", { insufficientAfterApproval: true });
  await page.getByRole("button", { name: "Review investment" }).click();
  await page.getByRole("button", { name: "Approve 1 USDC" }).click();
  await expect(page.locator("#error")).toContainText(
    "allowance is still insufficient",
  );
  await expect(
    page.getByRole("button", { name: "Contribute 1 USDC" }),
  ).toHaveCount(0);
  expect(await writes(page)).toEqual([
    { functionName: "approve", amount: "1000000" },
  ]);
});

test("RPC failures fail closed without wallet requests", async ({ page }) => {
  await mount(page, "0", { rpcError: true });
  await page.getByRole("button", { name: "Review investment" }).click();
  await expect(page.locator("#error")).toContainText("RPC unavailable");
  expect(await writes(page)).toEqual([]);
});
