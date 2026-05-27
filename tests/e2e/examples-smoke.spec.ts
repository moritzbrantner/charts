import { expect, test } from "@playwright/test";

test("examples app renders and supports core chart interactions", async ({ page }) => {
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
  await expect(page.getByText("Responsive dense trend")).toBeVisible();
  await expect(page.locator(".recharts-wrapper").first()).toBeVisible();

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
