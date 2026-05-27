import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

test("examples app renders and supports core chart interactions", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "desktop interaction coverage");

  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "@moritzbrantner/charts" })).toBeVisible();
  await expect(page.getByTestId("dense-trend-example")).toContainText("Responsive dense trend");
  await expect(page.getByTestId("chart-playground-example")).toContainText("Chart playground");
  await expect(page.getByTestId("distribution-examples")).toContainText("Distribution charts");
  await expect(page.locator(".recharts-wrapper").first()).toBeVisible();

  await expectA11yClean(page);

  await page.getByRole("radio", { name: /^14 days/ }).click();
  await expect(page.getByRole("radio", { name: /^14 days/ })).toHaveAttribute(
    "aria-checked",
    "true",
  );

  await page.getByRole("radio", { name: "Count" }).first().click();
  await expect(page.getByRole("radio", { name: "Count" }).first()).toHaveAttribute(
    "aria-checked",
    "true",
  );

  await page.locator(".recharts-wrapper").first().hover();
  await page.mouse.wheel(160, 0);

  const playground = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Chart playground" }) });
  await playground.scrollIntoViewIfNeeded();
  const playgroundScrollY = await page.evaluate(() => window.scrollY);
  await playground.locator(".recharts-wrapper").first().hover();
  await page.mouse.wheel(0, 260);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(playgroundScrollY);

  const minimap = page.getByRole("img", { name: "Chart domain minimap" }).first();
  await expect(minimap).toBeVisible();
  const box = await minimap.boundingBox();

  expect(box).not.toBeNull();
  if (box) {
    await page.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.5, { steps: 4 });
    await page.mouse.up();
  }

  await page.getByRole("radio", { name: "Volume bars" }).click();
  await expect(page.getByRole("radio", { name: "Volume bars" })).toHaveAttribute(
    "aria-checked",
    "true",
  );

  expect([...pageErrors, ...consoleErrors]).toEqual([]);
});

test("examples app renders core sections on mobile", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "mobile viewport coverage");

  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  await page.goto("/");
  await expect(page.getByTestId("examples-hero")).toContainText("@moritzbrantner/charts");
  await expect(page.getByTestId("dense-trend-example")).toContainText("Responsive dense trend");
  await expect(page.getByTestId("chart-playground-example")).toContainText("Chart playground");

  await page.getByTestId("distribution-examples").scrollIntoViewIfNeeded();
  await expect(page.getByTestId("distribution-examples")).toContainText("Distribution charts");
  await expect(page.getByTestId("gap-behavior-example")).toContainText("Gap behavior");

  await expectA11yClean(page);

  expect([...pageErrors, ...consoleErrors]).toEqual([]);
});

async function expectA11yClean(page: Page) {
  const results = await new AxeBuilder({ page }).disableRules(["color-contrast"]).analyze();

  expect(results.violations).toEqual([]);
}
