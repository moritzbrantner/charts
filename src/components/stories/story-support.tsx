import { ChartContainer, type ChartConfig } from "@moritzbrantner/ui";

import type { ChartRange } from "@moritzbrantner/charts";
import type { ReactNode } from "react";

export const chartConfig = {
  average: { color: "hsl(214 86% 46%)", label: "Average" },
  count: { color: "hsl(173 73% 32%)", label: "Count" },
  enterprise: { color: "hsl(214 86% 46%)", label: "Enterprise" },
  scale: { color: "hsl(173 73% 32%)", label: "Scale" },
  starter: { color: "hsl(38 92% 50%)", label: "Starter" },
  value: { color: "hsl(214 86% 46%)", label: "Value" },
} satisfies ChartConfig;

export const ranges: ChartRange[] = [
  {
    description: "The most recent operating window.",
    domain: [480, 720],
    id: "recent",
    label: "Recent",
  },
  {
    description: "Launch and recovery period.",
    domain: [360, 600],
    id: "launch",
    label: "Launch",
  },
  {
    description: "Full deterministic fixture.",
    domain: [0, 720],
    id: "full",
    label: "Full",
  },
];

export function StoryFrame({ children, title }: { children: ReactNode; title: string }) {
  return (
    <main className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto grid max-w-6xl gap-5">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {children}
      </div>
    </main>
  );
}

export function StoryChartContainer({
  children,
  className = "h-80 w-full",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <ChartContainer className={className} config={chartConfig}>
      {children}
    </ChartContainer>
  );
}

export function rangesEqual(left: [number, number], right: [number, number]) {
  return left[0] === right[0] && left[1] === right[1];
}

export function formatStoryHour(value: number) {
  return `${Math.round(value)}h`;
}

export function formatStoryNumber(value: number) {
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: 1,
    notation: "compact",
  }).format(value);
}
