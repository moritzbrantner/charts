import { expect, test } from "@playwright/test";

import {
  collectBrowserErrors,
  expectA11yClean,
  expectNoBrowserErrors,
  expectNoInvalidSvgGeometry,
} from "../../examples/src/testing/playwright";

const storyIds = [
  "charts-quality--dense-trend",
  "charts-quality--gap-behaviors",
  "charts-quality--grouped-stacked",
  "charts-quality--histogram",
  "charts-quality--heatmap",
  "charts-quality--box-plot",
  "charts-quality--crowded-overlay",
  "charts-quality--range-selector",
  "charts-quality--value-mode-selector",
  "charts-quality--series-legend",
  "charts-quality--y-axis-range-menu",
  "charts-quality--backend-status",
  "charts-quality--interactive-samples",
  "charts-quality--thresholds-and-anomalies",
] as const;

for (const storyId of storyIds) {
  test(`${storyId} has no accessibility or geometry regressions`, async ({ page }) => {
    const errors = collectBrowserErrors(page);

    await page.goto(`/iframe.html?id=${storyId}&viewMode=story`);
    await expect(page.locator("#storybook-root")).toBeVisible();
    await expect(page.getByRole("heading").first()).toBeVisible();

    await expectA11yClean(page);
    await expectNoInvalidSvgGeometry(page);
    expectNoBrowserErrors(errors);
  });
}
