import { expect, test } from "@playwright/test";

const stories = [
  { id: "charts-quality--dense-trend", name: "dense-trend", responsive: true },
  { id: "charts-quality--gap-behaviors", name: "gap-behaviors", responsive: false },
  { id: "charts-quality--heatmap", name: "heatmap", responsive: false },
  { id: "charts-quality--box-plot", name: "box-plot", responsive: false },
  { id: "charts-quality--scatter-bubble", name: "scatter-bubble", responsive: false },
  { id: "charts-quality--waterfall-funnel", name: "waterfall-funnel", responsive: false },
  { id: "charts-quality--hierarchy-charts", name: "hierarchy-charts", responsive: false },
  { id: "charts-quality--crowded-overlay", name: "crowded-overlay", responsive: false },
  { id: "charts-quality--axis-transforms", name: "axis-transforms", responsive: false },
  { id: "charts-quality--animated-trend", name: "animated-trend", responsive: false },
  { id: "charts-quality--interactive-samples", name: "interactive-samples", responsive: true },
] as const;

for (const story of stories) {
  test(`${story.name} visual snapshot`, async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name === "mobile-chromium" && !story.responsive,
      "desktop-only visual story",
    );

    await page.goto(`/iframe.html?id=${story.id}&viewMode=story`);
    await expect(page.locator("#storybook-root")).toBeVisible();
    if ((await page.locator(".recharts-wrapper").count()) > 0) {
      await expect(page.locator(".recharts-wrapper").first()).toBeVisible();
    } else {
      await expect(page.getByRole("img").first()).toBeVisible();
    }

    await expect(page.locator("#storybook-root")).toHaveScreenshot(`${story.name}.png`);
  });
}

test("y-axis range menu visual snapshot", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "desktop dialog snapshot");

  await page.goto("/iframe.html?id=charts-quality--y-axis-range-menu&viewMode=story");
  await expect(page.locator("#storybook-root")).toBeVisible();

  const trigger = page.locator("[data-chart-y-axis-range-trigger]").first();
  await trigger.click({ button: "right", position: { x: 8, y: 24 } });
  await expect(page.getByRole("dialog", { name: "Y-axis range menu" })).toBeVisible();

  await expect(page.locator("#storybook-root")).toHaveScreenshot("y-axis-range-menu.png");
});

test("axis transform menu visual snapshot", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "desktop dialog snapshot");

  await page.goto("/iframe.html?id=charts-quality--axis-transform-menu&viewMode=story");
  await expect(page.locator("#storybook-root")).toBeVisible();

  const trigger = page.locator("[data-chart-axis-transform-trigger='y']").first();
  await trigger.click({ button: "right", position: { x: 8, y: 24 } });
  await expect(page.getByRole("dialog", { name: "Y-axis transform menu" })).toBeVisible();

  await expect(page.locator("#storybook-root")).toHaveScreenshot("axis-transform-menu.png");
});

test("x-axis navigation menu visual snapshot", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "desktop dialog snapshot");

  await page.goto("/iframe.html?id=charts-quality--x-axis-navigation-menu&viewMode=story");
  await expect(page.locator("#storybook-root")).toBeVisible();

  const trigger = page.locator("[data-chart-x-axis-navigation-trigger]").first();
  await trigger.click({ button: "right", position: { x: 120, y: 12 } });
  await expect(page.getByRole("dialog", { name: "X-axis navigation menu" })).toBeVisible();

  await expect(page.locator("#storybook-root")).toHaveScreenshot("x-axis-navigation-menu.png");
});
