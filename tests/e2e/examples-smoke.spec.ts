import { expect, test, type Page } from "@playwright/test";

import {
  collectBrowserErrors,
  expectA11yClean,
  expectLongTasksWithinBudget,
  expectNoBrowserErrors,
  expectNoInvalidSvgGeometry,
  expectNoVisibleTextOverflow,
  installLongTaskObserver,
} from "./helpers";

test("examples app renders and supports core chart interactions", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "desktop interaction coverage");

  const errors = collectBrowserErrors(page);

  await installLongTaskObserver(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "@moritzbrantner/charts" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Compose" })).toHaveAttribute(
    "href",
    /compose\.html$/,
  );
  await expect(page.getByTestId("dense-trend-example")).toContainText("Responsive dense trend");
  await expect(page.getByTestId("chart-playground-example")).toHaveCount(0);
  await expect(page.locator(".recharts-wrapper").first()).toBeVisible();

  await expectA11yClean(page);
  await expectNoInvalidSvgGeometry(page);
  await expectNoVisibleTextOverflow(page);
  await page.evaluate(() => {
    window.__chartLongTasks = [];
  });

  await expectInteractionFast(page, async () => {
    await page.getByRole("radio", { name: /^14 days/ }).click();
    await page.getByRole("radio", { name: "Count" }).first().click();
  });
  await expect(page.getByRole("radio", { name: /^14 days/ })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await expect(page.getByRole("radio", { name: "Count" }).first()).toHaveAttribute(
    "aria-checked",
    "true",
  );

  await page.locator(".recharts-wrapper").first().hover();
  await page.mouse.wheel(160, 0);

  const minimap = page.getByRole("img", { name: "Chart domain minimap" }).first();
  await expect(minimap).toBeVisible();
  const box = await minimap.boundingBox();

  expect(box).not.toBeNull();
  if (box) {
    await expectInteractionFast(page, async () => {
      await page.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.5);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.5, { steps: 4 });
      await page.mouse.up();
    });
  }

  await page.getByTestId("chart-variant-examples").scrollIntoViewIfNeeded();
  await expect(page.getByTestId("chart-variant-examples")).toContainText("Chart variants");
  await expect(page.getByTestId("chart-variant-examples").locator(".recharts-wrapper")).toHaveCount(
    1,
  );
  await page.getByRole("radio", { name: "Volume bars" }).click();
  await expect(page.getByRole("radio", { name: "Volume bars" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await expect(page.getByTestId("chart-variant-examples")).toContainText("Volume bars");
  await expect(page.getByTestId("chart-variant-examples").locator(".recharts-wrapper")).toHaveCount(
    1,
  );
  await page.getByTestId("distribution-examples").scrollIntoViewIfNeeded();
  await expect(page.getByTestId("distribution-examples")).toContainText("Distribution charts");

  await expectNoInvalidSvgGeometry(page);
  await expectLongTasksWithinBudget(page, 24);
  expectNoBrowserErrors(errors);
});

test("compose page renders a single chart composer", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "desktop interaction coverage");

  const errors = collectBrowserErrors(page);

  await installLongTaskObserver(page);
  await page.goto("/compose.html");
  await expect(page.getByRole("link", { name: "Compose" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByTestId("chart-playground-example")).toContainText("Chart playground");
  await expect(page.getByTestId("dense-trend-example")).toHaveCount(0);
  await expect(page.getByTestId("distribution-examples")).toHaveCount(0);
  await expect(page.locator(".recharts-wrapper").first()).toBeVisible();

  await expectA11yClean(page);
  await expectNoInvalidSvgGeometry(page);
  await expectNoVisibleTextOverflow(page);
  await page.evaluate(() => {
    window.__chartLongTasks = [];
  });

  const playground = page.getByTestId("chart-playground-example");
  await expect(page.getByLabel("Active chart labels")).toBeVisible();
  await expect(page.getByRole("group", { name: "Chart series legend" })).toBeVisible();

  await expectInteractionFast(page, async () => {
    await page.getByRole("switch", { name: "Labels" }).click();
    await page.getByRole("switch", { name: "Labels" }).click();
    await page.getByRole("switch", { name: "Legend" }).click();
    await page.getByRole("switch", { name: "Legend" }).click();
  });
  await expect(page.getByLabel("Active chart labels")).toBeVisible();
  await expect(page.getByRole("group", { name: "Chart series legend" })).toBeVisible();

  await playground.locator("select").nth(2).selectOption("line");
  await expect(playground).toContainText("Line chart");

  const yAxisTrigger = playground.locator("[data-chart-y-axis-range-trigger]").first();
  await yAxisTrigger.click({ button: "right", position: { x: 8, y: 24 } });
  const yAxisDialog = page.getByRole("dialog", { name: "Y-axis transform menu" });
  await expect(yAxisDialog).toBeVisible();
  await yAxisDialog.getByLabel("Min").fill("0");
  await yAxisDialog.getByLabel("Max").fill("250");
  await yAxisDialog.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByRole("dialog", { name: "Y-axis transform menu" })).toHaveCount(0);
  await yAxisTrigger.click({ button: "right", position: { x: 8, y: 24 } });
  await expect(page.getByRole("group", { name: "Y-axis series legend" })).toContainText("Average");
  await page.keyboard.press("Escape");

  await page.getByLabel("Y scale").selectOption("log");
  await expect(playground.locator("[data-chart-axis-transform-trigger='y']").first()).toBeVisible();
  await page.getByLabel("Axes").selectOption("horizontal");
  await expect(playground.locator("[data-chart-axis-transform-trigger='x']").first()).toBeVisible();
  await page.getByLabel("Animation").selectOption("draw");
  await page.getByRole("switch", { name: "Playback" }).click();
  await page.getByRole("button", { name: "Play" }).click();
  await page.getByRole("button", { name: "Pause" }).click();
  await page.getByRole("button", { name: "Reset" }).click();
  await page.getByRole("switch", { name: "Playback" }).click();
  await page.getByLabel("Axes").selectOption("vertical");
  await page.getByLabel("Y scale").selectOption("linear");

  await playground.locator("select").nth(2).selectOption("candle");
  await expect(playground).toContainText("Candle chart");
  await expect(page.getByRole("img", { name: "Candle chart" })).toBeVisible();

  await expectNoInvalidSvgGeometry(page);
  await expectLongTasksWithinBudget(page, 24);
  expectNoBrowserErrors(errors);
});

test("examples app renders core sections on mobile", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "mobile viewport coverage");

  const errors = collectBrowserErrors(page);

  await page.goto("/");
  await expect(page.getByTestId("examples-hero")).toContainText("@moritzbrantner/charts");
  await expect(page.getByTestId("dense-trend-example")).toContainText("Responsive dense trend");
  await expect(page.getByTestId("chart-playground-example")).toHaveCount(0);

  await page.getByTestId("distribution-examples").scrollIntoViewIfNeeded();
  await expect(page.getByTestId("distribution-examples")).toContainText("Distribution charts");
  await expect(page.getByTestId("gap-behavior-example")).toContainText("Gap behavior");

  await expectA11yClean(page);
  await expectNoInvalidSvgGeometry(page);
  await expectNoVisibleTextOverflow(page);
  expectNoBrowserErrors(errors);
});

test("compose page renders on mobile", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "mobile viewport coverage");

  const errors = collectBrowserErrors(page);

  await page.goto("/compose.html");
  await expect(page.getByTestId("examples-hero")).toContainText("@moritzbrantner/charts");
  await expect(page.getByTestId("chart-playground-example")).toContainText("Chart playground");
  await expect(page.getByTestId("chart-playground-example").locator("select").nth(2)).toBeVisible();

  await expectA11yClean(page);
  await expectNoInvalidSvgGeometry(page);
  await expectNoVisibleTextOverflow(page);
  expectNoBrowserErrors(errors);
});

test("compose controls support keyboard activation", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "desktop keyboard coverage");

  const errors = collectBrowserErrors(page);

  await page.goto("/compose.html");
  const labelsSwitch = page.getByRole("switch", { name: "Labels" });

  await labelsSwitch.focus();
  await page.keyboard.press("Space");
  await expect(page.getByLabel("Active chart labels")).toHaveCount(0);
  await page.keyboard.press("Space");
  await expect(page.getByLabel("Active chart labels")).toBeVisible();

  const lineOption = page.getByTestId("chart-playground-example").locator("select").nth(2);
  await lineOption.focus();
  await lineOption.selectOption("line");
  await expect(page.getByTestId("chart-playground-example")).toContainText("Line chart");

  expectNoBrowserErrors(errors);
});

async function expectInteractionFast(page: Page, run: () => Promise<void>) {
  const startedAt = await page.evaluate(() => performance.now());

  await run();

  const elapsedMs = await page.evaluate((start) => performance.now() - start, startedAt);

  expect(elapsedMs).toBeLessThan(3_000);
}
