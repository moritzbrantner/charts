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
  const minimapPanel = minimap.locator("xpath=..");
  const chartFrame = page.locator("[data-chart-domain-drag-frame]").first();
  const chartBox = await chartFrame.boundingBox();

  expect(chartBox).not.toBeNull();
  if (chartBox) {
    const beforeChartDrag = await minimapPanel.textContent();

    await expectInteractionFast(page, async () => {
      await page.mouse.move(chartBox.x + chartBox.width * 0.42, chartBox.y + chartBox.height * 0.5);
      await page.mouse.down();
      await page.mouse.move(
        chartBox.x + chartBox.width * 0.58,
        chartBox.y + chartBox.height * 0.5,
        {
          steps: 4,
        },
      );
      await page.mouse.up();
    });
    await expect.poll(async () => minimapPanel.textContent()).not.toBe(beforeChartDrag);

    const beforeZoom = await minimapPanel.textContent();

    await chartFrame.hover();
    await page.keyboard.down("Control");
    try {
      await page.mouse.wheel(0, -180);
    } finally {
      await page.keyboard.up("Control");
    }
    await expect.poll(async () => minimapPanel.textContent()).not.toBe(beforeZoom);
  }

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
  await expectLongTasksWithinBudget(page, 32);
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
  const xAxisNavigationTrigger = playground
    .locator("[data-chart-x-axis-navigation-trigger]")
    .first();
  await xAxisNavigationTrigger.click({ button: "right", position: { x: 80, y: 12 } });
  await expect(page.getByRole("dialog", { name: "X-axis navigation menu" })).toBeVisible();
  await page.getByRole("button", { name: "Zoom in" }).click();
  await expect(page.getByRole("dialog", { name: "X-axis navigation menu" })).toHaveCount(0);
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
  await expectLongTasksWithinBudget(page, 32);
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

test("chart type pages render locked composers from the top navbar", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "desktop chart page coverage");

  const errors = collectBrowserErrors(page);
  const chartPages = [
    { label: "Area", path: "/area.html", title: "Area chart", value: "area" },
    { label: "Line", path: "/line.html", title: "Line chart", value: "line" },
    { label: "Bar", path: "/bar.html", title: "Bar chart", value: "bar" },
    { label: "Scatter", path: "/scatter.html", title: "Scatter plot", value: "scatter" },
    { label: "Bubble", path: "/bubble.html", title: "Bubble chart", value: "bubble" },
    {
      interactiveDomain: true,
      label: "Candle",
      path: "/candle.html",
      title: "Candle chart",
      value: "candle",
    },
    {
      label: "Area + rolling",
      path: "/combo.html",
      title: "Area chart with rolling line",
      value: "combo",
    },
    { label: "Histogram", path: "/histogram.html", title: "Histogram", value: "histogram" },
    { label: "Heatmap", path: "/heatmap.html", title: "Heatmap", value: "heatmap" },
    { label: "Stacked bars", path: "/stacked.html", title: "Stacked bars", value: "stacked" },
    { label: "Waterfall", path: "/waterfall.html", title: "Waterfall chart", value: "waterfall" },
    { label: "Funnel", path: "/funnel.html", title: "Funnel chart", value: "funnel" },
    { label: "Treemap", path: "/treemap.html", title: "Treemap", value: "treemap" },
    { label: "Sunburst", path: "/sunburst.html", title: "Sunburst chart", value: "sunburst" },
  ];

  for (const chartPage of chartPages) {
    await page.goto(chartPage.path);

    const playground = page.getByTestId("chart-playground-example");

    await expect(page.getByRole("link", { exact: true, name: chartPage.label })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(playground).toContainText(chartPage.title);
    await expect(playground.locator("select").nth(2)).toHaveValue(chartPage.value);
    await expect(playground.locator("select").nth(2)).toBeDisabled();
    await expect(page.getByRole("switch", { name: "Legend" })).toBeVisible();
    await expect(page.getByRole("switch", { name: "Minimap" })).toBeVisible();
    await expect(page.getByRole("group", { name: "Chart series legend" })).toBeVisible();

    await expect(page.getByRole("img", { name: "Chart domain minimap" }).first()).toBeVisible();
  }

  expectNoBrowserErrors(errors);
});

async function expectInteractionFast(page: Page, run: () => Promise<void>) {
  const startedAt = await page.evaluate(() => performance.now());

  await run();

  const elapsedMs = await page.evaluate((start) => performance.now() - start, startedAt);

  expect(elapsedMs).toBeLessThan(3_000);
}
