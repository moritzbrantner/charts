import { chartPageLinks } from "./controls";

import type { ExamplePage, PlaygroundChartType } from "./model";

export function getExamplePage(): ExamplePage {
  const pathname = window.location.pathname.replace(/\/$/, "");
  const filename = pathname.split("/").pop() ?? "";

  if (filename === "compose" || filename === "compose.html") {
    return "compose";
  }

  const chartPage = chartPageLinks.find(
    (link) => filename === link.path || filename === link.path.replace(/\.html$/, ""),
  );

  return chartPage ? chartPage.id : "examples";
}

export function getChartPageType(page: ExamplePage): PlaygroundChartType | null {
  return page.startsWith("chart-") ? (page.slice("chart-".length) as PlaygroundChartType) : null;
}
