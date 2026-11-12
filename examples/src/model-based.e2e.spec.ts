import { expect, test } from "@playwright/test";

import { linePageEventLabels } from "./playground/chart-page-machine";
import {
  linePageAllEdgePaths,
  linePagePaths,
  getLinePageCoverage,
} from "./playground/chart-page-paths";

import type { LinePageEvent, LinePageState } from "./playground/chart-page-machine";
import type { LinePagePath } from "./playground/chart-page-paths";
import type { Page } from "@playwright/test";

const fullTraversal = process.env.CHARTS_MODEL_FULL === "1";
const generatedPaths = fullTraversal ? linePageAllEdgePaths : linePagePaths;

function stateExpectations(state: LinePageState) {
  const [dataset, viewport, series] = state.split("-");

  return {
    dataset: dataset === "sparse" ? "sparse" : "telemetry",
    seriesVisible: series === "visible",
    viewport: viewport === "month" ? "month" : "week",
  };
}

async function assertVisibleState(page: Page, state: LinePageState) {
  const expected = stateExpectations(state);
  const controls = page.getByTestId("chart-playground-example");

  await expect(controls.locator("select").nth(0), `dataset in ${state}`).toHaveValue(
    expected.dataset,
  );
  await expect(controls.locator("select").nth(1), `viewport in ${state}`).toHaveValue(
    expected.viewport,
  );
  await expect(controls.locator("select").nth(2), `fixed chart in ${state}`).toBeDisabled();
  await expect(page.getByRole("heading", { name: "Line chart" })).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: "Rolling" }),
    `Rolling series in ${state}`,
  ).toHaveAttribute("aria-checked", String(expected.seriesVisible));
}

async function performEvent(page: Page, event: LinePageEvent) {
  const controls = page.getByTestId("chart-playground-example");

  switch (event) {
    case "SELECT_SPARSE":
      await controls.locator("select").nth(0).selectOption("sparse");
      break;
    case "SELECT_TELEMETRY":
      await controls.locator("select").nth(0).selectOption("telemetry");
      break;
    case "SELECT_MONTH":
      await controls.locator("select").nth(1).selectOption("month");
      break;
    case "SELECT_WEEK":
      await controls.locator("select").nth(1).selectOption("week");
      break;
    case "HIDE_SERIES":
    case "SHOW_SERIES":
      await page.getByRole("checkbox", { name: "Rolling" }).click();
      break;
    case "BLOCKED_CHART_CHANGE":
      await expect(controls.locator("select").nth(2)).toBeDisabled();
      await expect(controls.locator("select").nth(2)).toHaveValue("line");
      break;
  }
}

test.describe("generated Charts Page state paths", () => {
  test("reports deterministic state and transition coverage", () => {
    const testInfo = test.info();

    test.skip(testInfo.project.name !== "desktop-chromium", "one deterministic report per run");
    const { uncoveredEdges, uncoveredStates } = getLinePageCoverage(generatedPaths);

    console.log(
      [
        `model coverage (${fullTraversal ? "full" : "default"})`,
        `uncovered states: ${uncoveredStates.length === 0 ? "none" : uncoveredStates.join(", ")}`,
        `uncovered transitions: ${uncoveredEdges.length === 0 ? "none" : uncoveredEdges.join("; ")}`,
      ].join("\n"),
    );
    expect(uncoveredStates).toEqual([]);
    if (fullTraversal) {
      expect(uncoveredEdges).toEqual([]);
    }
  });

  for (const path of generatedPaths) {
    test(`desktop: ${path.name}`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "desktop-chromium", "desktop generated paths");
      await runPath(page, path);
    });
  }

  test("mobile: select a dataset, change viewport, and toggle a series", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-chromium", "responsive interaction path");
    await runPath(page, {
      events: ["SELECT_SPARSE", "SELECT_MONTH", "HIDE_SERIES", "SHOW_SERIES"],
      name: "mobile responsive interaction",
      states: [
        "telemetry-week-visible",
        "sparse-week-visible",
        "sparse-month-visible",
        "sparse-month-hidden",
        "sparse-month-visible",
      ],
    });
  });
});

async function runPath(page: Page, path: LinePagePath) {
  await page.goto("/line.html");
  await expect(page.getByTestId("chart-playground-example")).toBeVisible();
  await assertVisibleState(page, path.states[0]);

  for (const [index, event] of path.events.entries()) {
    await test.step(`${index + 1}. ${linePageEventLabels[event]}`, async () => {
      await performEvent(page, event);
      await assertVisibleState(page, path.states[index + 1]);
    });
  }

  expect(path.states).toHaveLength(path.events.length + 1);
}
