import { expect, test, type Page } from "@playwright/test";
import { resolveCampaignVideo } from "../../src/lib/campaign-video";

const id = "6ac6b0f148f0490d4401ca8d";
const youtube = "https://www.youtube.com/watch?v=aqz-KE-bpKQ";
const campaign = {
  _id: id,
  name: "KEIBO Video Playback UAT",
  projectType: "CHARITY",
  category: "ngo",
  status: "APPROVED",
  targetAmount: 100000,
  currency: "UGX",
  videoUrls: [youtube],
};
async function fixtures(page: Page, authenticated = true) {
  await page.context().addCookies([
    {
      name: "keibo_access",
      value: "isolated-ui-fixture",
      url: "http://127.0.0.1:3000",
    },
  ]);
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/users/me")
      return route.fulfill(
        authenticated
          ? {
              json: {
                id: "ui-test",
                roles: ["ADMIN", "CREATOR"],
                emailVerified: true,
                kycStatus: "NOT_VERIFIED",
                capabilities: {
                  createCharity: true,
                  createRoi: false,
                  viewRoi: true,
                },
              },
            }
          : { status: 401, json: { message: "Unauthorized" } },
      );
    if (path === `/api/projects/${id}`)
      return route.fulfill({ json: { project: campaign, milestones: [] } });
    if (path === "/api/projects")
      return route.fulfill({
        json: { projects: [], total: 0, page: 1, pageSize: 12 },
      });
    if (path === "/api/kyc/admin/profiles")
      return route.fulfill({
        json: { items: [], total: 0, page: 1, pageSize: 50 },
      });
    if (path === "/api/auth/csrf")
      return route.fulfill({ json: { csrfToken: "isolated-ui-fixture" } });
    return route.fulfill({ json: [] });
  });
  // CI verifies our provider integration, without relying on external players.
  await page.route("https://www.youtube-nocookie.com/**", (route) =>
    route.fulfill({ contentType: "text/html", body: "<button>Play</button>" }),
  );
  await page.route("https://player.vimeo.com/**", (route) =>
    route.fulfill({ contentType: "text/html", body: "<button>Play</button>" }),
  );
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(1);
}

test("video URL contract rejects unsafe lookalikes and resolves existing supported formats", () => {
  for (const url of [
    youtube,
    "https://youtu.be/aqz-KE-bpKQ",
    "https://m.youtube.com/watch?v=aqz-KE-bpKQ",
    "https://www.youtube.com/shorts/aqz-KE-bpKQ",
    "https://www.youtube.com/embed/aqz-KE-bpKQ",
  ]) {
    expect(resolveCampaignVideo(url)?.src).toBe(
      "https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ?playsinline=1",
    );
  }
  expect(resolveCampaignVideo("https://vimeo.com/76979871/abc123")?.src).toBe(
    "https://player.vimeo.com/video/76979871?h=abc123",
  );
  expect(
    resolveCampaignVideo("https://player.vimeo.com/video/76979871?h=abc123")
      ?.kind,
  ).toBe("embed");
  for (const url of [
    "https://media.example.test/film.mp4?token=signed",
    "/api/projects/files/6ac6718422950b54565ade97",
  ]) {
    expect(resolveCampaignVideo(url)?.kind).toBe("direct");
  }
  for (const url of [
    "javascript:alert(1)",
    "https://youtube.com.evil.test/watch?v=aqz-KE-bpKQ",
    "https://notyoutube.com/watch?v=aqz-KE-bpKQ",
    "https://vimeo.com.evil.test/76979871",
    "https://www.youtube.com/watch?v=bad",
    "https://media.example.test/page",
    "https://user:password@youtube.com/watch?v=aqz-KE-bpKQ",
  ]) {
    expect(resolveCampaignVideo(url)).toBeNull();
  }
});

test("detail renders saved provider videos after refresh, direct video and safe invalid fallback", async ({
  page,
}) => {
  await fixtures(page);
  await page.goto(`/projects/${id}`);
  const player = page.getByTitle("KEIBO Video Playback UAT video (YouTube)");
  await expect(player).toHaveAttribute(
    "src",
    /youtube-nocookie.com\/embed\/aqz-KE-bpKQ/,
  );
  await page.reload();
  await expect(player).toBeVisible();
  await expect(page.getByText("Campaign media is not available")).toHaveCount(
    0,
  );
  for (const [url, kind] of [
    ["https://vimeo.com/76979871", "Vimeo"],
    ["https://media.example.test/video.mp4", "Video"],
    ["javascript:alert(1)", "invalid"],
  ]) {
    await page.route(`**/api/projects/${id}`, (route) =>
      route.fulfill({ json: { project: { ...campaign, videoUrls: [url] } } }),
    );
    await page.reload();
    if (kind === "Vimeo")
      await expect(
        page.getByTitle("KEIBO Video Playback UAT video (Vimeo)"),
      ).toBeVisible();
    else if (kind === "Video")
      await expect(
        page.getByRole("link", { name: "Open campaign video" }),
      ).toHaveAttribute("href", url);
    else {
      await expect(page.locator("main iframe,main video")).toHaveCount(0);
      await expect(
        page.getByText("Campaign media is not available"),
      ).toBeVisible();
    }
  }
  await page.route(`**/api/projects/${id}`, (route) =>
    route.fulfill({
      json: { project: { ...campaign, videoUrls: [], imageUrl: "/logo.jpeg" } },
    }),
  );
  await page.reload();
  await expect(page.getByAltText(campaign.name)).toBeVisible();
  await expect
    .poll(() =>
      page
        .getByAltText(campaign.name)
        .evaluate((i: HTMLImageElement) => i.naturalWidth),
    )
    .toBeGreaterThan(0);
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
]) {
  test(`responsive navbar/dashboard/admin and campaign contrast ${viewport.width}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await fixtures(page, false);
    await page.goto("/explore");
    if (viewport.width >= 768) {
      const signIn = page.getByRole("link", { name: "Sign In", exact: true });
      await expect(signIn).toBeVisible();
      const a = await signIn.boundingBox();
      const b = await page
        .getByPlaceholder("Search projects", { exact: true })
        .boundingBox();
      expect(a && b && b.x + b.width <= a.x).toBeTruthy();
    }
    await noOverflow(page);
    await fixtures(page);
    await page.goto("/dashboard");
    const submit = page.getByRole("link", {
      name: "SUBMIT PROJECT",
      exact: true,
    });
    await expect(submit).toBeVisible();
    await noOverflow(page);
    const box = await submit.boundingBox();
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
    await page.goto("/admin");
    for (const name of [
      "Overview",
      "Campaigns",
      "KYC Review",
      "Users",
      "Payouts",
    ])
      await expect(
        page.getByRole("button", { name, exact: true }),
      ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Back to App", exact: true }),
    ).toBeVisible();
    await noOverflow(page);
    for (const theme of ["light", "dark"]) {
      await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
      await page.goto("/dashboard/create-project");
      await expect(
        page.getByRole("heading", { name: "Choose project type" }),
      ).toBeVisible();
      await noOverflow(page);
      for (const type of ["Charity", "Investment"]) {
        const card = page
          .getByRole("button", { name: new RegExp(type) })
          .filter({
            has: page.getByRole("heading", { name: type, exact: true }),
          });
        await card.click();
        await expect(card).toHaveAttribute("aria-pressed", "true");
        const contrast = await card.evaluate((el) => {
          const canvas = document.createElement("canvas");
          canvas.width = canvas.height = 1;
          const ctx = canvas.getContext("2d")!;
          const rgb = (s: string) => {
            ctx.clearRect(0, 0, 1, 1);
            ctx.fillStyle = s;
            ctx.fillRect(0, 0, 1, 1);
            const c = Array.from(ctx.getImageData(0, 0, 1, 1).data);
            return [c[0], c[1], c[2], c[3] / 255];
          };
          const lum = (c: number[]) =>
            c
              .slice(0, 3)
              .map((v) => {
                v /= 255;
                return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
              })
              .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
          let bg = [255, 255, 255];
          const ancestors: Element[] = [];
          for (let e: Element | null = el; e; e = e.parentElement)
            ancestors.unshift(e);
          for (const e of ancestors) {
            const c = rgb(getComputedStyle(e).backgroundColor);
            const a = c[3] ?? 1;
            bg = c.slice(0, 3).map((v, i) => v * a + bg[i] * (1 - a));
          }
          return Array.from(el.querySelectorAll("h3,p")).map((e) => {
            const a = lum(rgb(getComputedStyle(e).color));
            const b = lum(bg);
            return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
          });
        });
        for (const ratio of contrast) expect(ratio).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
}

test("Review shows and previews selected video; Back/Next retain it without submission", async ({
  page,
}) => {
  await fixtures(page);
  await page.goto("/dashboard/create-project");
  await page.getByRole("button", { name: "Next Step" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByPlaceholder("e.g. Solar Energy for Rural Schools")
    .fill("Video regression fixture");
  await page
    .getByPlaceholder("e.g. St. Jude Primary School")
    .fill("Test beneficiary");
  await page
    .getByPlaceholder(
      "Briefly describe the impact of your project in 2 sentences...",
    )
    .fill("Isolated video regression fixture.");
  await page.getByRole("button", { name: "Next Step" }).click();
  await page
    .getByPlaceholder(
      "Tell the world why you started this, the challenges you face, and the exact difference you will make. Use paragraphs for readability...",
    )
    .fill("Isolated test story with no real campaign submission.");
  await page.getByRole("button", { name: "Next Step" }).click();
  await page.getByPlaceholder("1000000").fill("100000");
  await page.locator("input[type=date]").first().fill("2099-12-31");
  await page.getByRole("button", { name: "Next Step" }).click();
  await page
    .locator("#video-url")
    .fill("https://youtube.com.evil.test/watch?v=aqz-KE-bpKQ");
  await page.getByRole("button", { name: "Add video", exact: true }).click();
  await expect(
    page.getByText("Enter a valid YouTube, Vimeo, or direct video URL."),
  ).toBeVisible();
  await page.locator("#video-url").fill(youtube);
  await page.getByRole("button", { name: "Add video", exact: true }).click();
  await page.getByRole("button", { name: "Next Step" }).click();
  const review = page.getByRole("region", { name: "Review campaign videos" });
  await expect(review.getByRole("link", { name: youtube })).toBeVisible();
  await expect(review.getByTitle("Review video 1 (YouTube)")).toBeVisible();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByRole("link", { name: "Video 1" })).toBeVisible();
  await page.getByRole("button", { name: "Next Step" }).click();
  await expect(review.getByTitle("Review video 1 (YouTube)")).toBeVisible();
});
