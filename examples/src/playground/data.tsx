import { formatNumber } from "./model";

import type { ExampleDataSet, TelemetryProperties } from "./model";
import type { ChartSeriesPoint } from "@moritzbrantner/charts";

export function createExampleDataSets(): ExampleDataSet[] {
  const telemetry = createTelemetryPoints();

  return [
    {
      description:
        "Product telemetry with release lift, campaign pulse, quiet windows, and spikes.",
      id: "telemetry",
      label: "Product telemetry",
      points: telemetry,
    },
    {
      description:
        "Retail demand with weekday cadence, weekend peaks, launch lift, and sale spikes.",
      id: "retail",
      label: "Retail demand",
      points: createRetailPoints(),
    },
    {
      description:
        "Operations load with incidents, recovery periods, and a stronger latency metric.",
      id: "operations",
      label: "Operations load",
      points: createOperationsPoints(),
    },
    {
      description: "Sparse telemetry with intentional empty windows for gap behavior testing.",
      id: "sparse",
      label: "Sparse gaps",
      points: createSparsePoints(telemetry),
    },
  ];
}

export function createTelemetryPoints(): ChartSeriesPoint<TelemetryProperties>[] {
  const points: ChartSeriesPoint<TelemetryProperties>[] = [];
  const channels: TelemetryProperties["channel"][] = ["direct", "partner", "marketplace"];
  const plans: TelemetryProperties["plan"][] = ["starter", "scale", "enterprise"];

  for (let hour = 0; hour <= 30 * 24; hour += 0.25) {
    const day = hour / 24;
    const dayCycle = Math.sin((hour / 24) * Math.PI * 2 - 0.8);
    const weekCycle = Math.sin((day / 7) * Math.PI * 2);
    const releaseLift = day > 18 ? 18 * Math.log1p(day - 18) : 0;
    const campaignPulse = Math.exp(-Math.pow(day - 23, 2) / 9) * 36;
    const analyticsSpike = Math.exp(-Math.pow(day - 26, 2) / 0.03) * 150;
    const maintenanceDip = day > 12 && day < 13.5 ? -22 : 0;
    const quietPeriod = day > 8 && day < 9.25 ? -38 : 0;
    const deterministicNoise = seededWave(hour * 9.731) * 9;
    const y = Math.max(
      4,
      92 +
        dayCycle * 26 +
        weekCycle * 12 +
        releaseLift +
        campaignPulse +
        analyticsSpike +
        maintenanceDip +
        quietPeriod +
        deterministicNoise,
    );
    const revenue = y * (18 + seededWave(hour * 0.73) * 4);

    points.push({
      id: `hour-${hour.toFixed(2)}`,
      label: formatHour(hour),
      metrics: {
        latency: Math.max(20, 120 - y * 0.32 + seededWave(hour * 2.2) * 12),
        revenue,
        signups: Math.max(0, Math.round(y / 9 + seededWave(hour * 1.6) * 3)),
      },
      properties: {
        channel: channels[Math.floor(hour * 3) % channels.length],
        note: `Sample ${formatHour(hour)}`,
        plan: plans[Math.floor(hour / 11) % plans.length],
      },
      x: hour,
      y,
    });
  }

  return points;
}

export function createRetailPoints(): ChartSeriesPoint<TelemetryProperties>[] {
  const points: ChartSeriesPoint<TelemetryProperties>[] = [];
  const channels: TelemetryProperties["channel"][] = ["marketplace", "direct", "partner"];
  const plans: TelemetryProperties["plan"][] = ["starter", "scale", "enterprise"];

  for (let hour = 0; hour <= 30 * 24; hour += 0.25) {
    const day = hour / 24;
    const hourOfDay = hour % 24;
    const dailyTraffic = Math.max(0, Math.sin(((hourOfDay - 7) / 24) * Math.PI));
    const eveningPeak = Math.exp(-Math.pow(hourOfDay - 20, 2) / 14) * 42;
    const weekend = Math.floor(day) % 7 >= 5 ? 36 : 0;
    const launchLift = day > 14 ? 12 * Math.log1p(day - 14) : 0;
    const flashSale = Math.exp(-Math.pow(day - 21, 2) / 0.12) * 140;
    const stockoutDip = day > 24.5 && day < 25.5 ? -68 : 0;
    const deterministicNoise = seededWave(hour * 5.31) * 11;
    const y = Math.max(
      6,
      44 +
        dailyTraffic * 86 +
        eveningPeak +
        weekend +
        launchLift +
        flashSale +
        stockoutDip +
        deterministicNoise,
    );
    const revenue = y * (28 + weekend * 0.18 + seededWave(hour * 0.41) * 6);

    points.push({
      id: `retail-${hour.toFixed(2)}`,
      label: formatHour(hour),
      metrics: {
        latency: Math.max(35, 170 - y * 0.26 + seededWave(hour * 1.9) * 18),
        revenue,
        signups: Math.max(0, Math.round(y / 11 + seededWave(hour * 1.2) * 4)),
      },
      properties: {
        channel: channels[Math.floor(hour / 5) % channels.length],
        note: `Retail sample ${formatHour(hour)}`,
        plan: plans[Math.floor((hour + 9) / 17) % plans.length],
      },
      x: hour,
      y,
    });
  }

  return points;
}

export function createOperationsPoints(): ChartSeriesPoint<TelemetryProperties>[] {
  const points: ChartSeriesPoint<TelemetryProperties>[] = [];
  const channels: TelemetryProperties["channel"][] = ["direct", "partner", "marketplace"];
  const plans: TelemetryProperties["plan"][] = ["enterprise", "scale", "starter"];

  for (let hour = 0; hour <= 30 * 24; hour += 0.25) {
    const day = hour / 24;
    const hourOfDay = hour % 24;
    const businessHours = hourOfDay >= 8 && hourOfDay <= 18 ? 44 : 10;
    const weeklyBatch = Math.max(0, Math.sin((day / 7) * Math.PI * 2 - 1.1)) * 28;
    const incidentA = Math.exp(-Math.pow(day - 6.5, 2) / 0.05) * 125;
    const incidentB = Math.exp(-Math.pow(day - 19.75, 2) / 0.08) * 165;
    const recovery = day > 20 && day < 22 ? -34 : 0;
    const deterministicNoise = seededWave(hour * 8.17) * 13;
    const y = Math.max(
      3,
      58 + businessHours + weeklyBatch + incidentA + incidentB + recovery + deterministicNoise,
    );

    points.push({
      id: `ops-${hour.toFixed(2)}`,
      label: formatHour(hour),
      metrics: {
        latency: Math.max(25, 80 + y * 0.72 + seededWave(hour * 2.8) * 25),
        revenue: Math.max(0, (180 - y) * 13 + seededWave(hour * 0.62) * 80),
        signups: Math.max(0, Math.round(26 - y / 12 + seededWave(hour * 1.44) * 2)),
      },
      properties: {
        channel: channels[Math.floor(hour / 7) % channels.length],
        note: `Ops sample ${formatHour(hour)}`,
        plan: plans[Math.floor(hour / 13) % plans.length],
      },
      x: hour,
      y,
    });
  }

  return points;
}

export function createSparsePoints(
  source: ChartSeriesPoint<TelemetryProperties>[],
): ChartSeriesPoint<TelemetryProperties>[] {
  return source
    .filter((point) => {
      const day = point.x / 24;

      return (
        !(day > 4.2 && day < 5.8) &&
        !(day > 10.5 && day < 13.25) &&
        !(day > 17.7 && day < 18.9) &&
        !(day > 26 && day < 28.4) &&
        Math.floor(point.x * 4) % 3 !== 0
      );
    })
    .map((point) => {
      const properties = point.properties ?? {
        channel: "direct" as const,
        note: point.label ?? "Sparse sample",
        plan: "starter" as const,
      };

      return {
        ...point,
        id: `sparse-${point.id}`,
        metrics: {
          ...point.metrics,
          revenue: (point.metrics?.revenue ?? 0) * 0.82,
        },
        properties: {
          channel: properties.channel,
          note: `Sparse ${point.label ?? formatHour(point.x)}`,
          plan: properties.plan,
        },
        y: Math.max(2, point.y * 0.78 + Math.sin(point.x / 4) * 18),
      };
    });
}

export function createGapPoints(): ChartSeriesPoint<TelemetryProperties>[] {
  return createTelemetryPoints()
    .filter((point) => {
      const x = point.x;

      return x < 96 && !(x > 18 && x < 28) && !(x > 44 && x < 52) && !(x > 73 && x < 84);
    })
    .map((point) => ({
      ...point,
      id: `gap-${point.id}`,
      y: point.y * 0.72 + Math.sin(point.x / 3) * 8,
    }));
}

export function chartConfig(label: string) {
  return {
    value: {
      color: "var(--chart-1)",
      label,
    },
    average: {
      color: "var(--chart-1)",
      label,
    },
  };
}

export const variantChartConfig = {
  current: {
    color: "var(--chart-1)",
    label: "Current",
  },
  floor: {
    color: "var(--chart-3)",
    label: "Minimum",
  },
  peak: {
    color: "var(--chart-2)",
    label: "Maximum",
  },
  previous: {
    color: "var(--chart-4)",
    label: "Previous",
  },
  revenueK: {
    color: "var(--chart-5)",
    label: "Revenue (k)",
  },
  target: {
    color: "var(--muted-foreground)",
    label: "Target",
  },
  volume: {
    color: "var(--chart-4)",
    label: "Volume",
  },
};

export const analyticsChartConfig = {
  average: {
    color: "var(--chart-1)",
    label: "Average",
  },
  cumulativeRevenue: {
    color: "var(--chart-5)",
    label: "Cumulative revenue",
  },
  revenueDelta: {
    color: "var(--chart-4)",
    label: "Revenue delta %",
  },
  rollingAverage: {
    color: "var(--chart-2)",
    label: "Rolling average",
  },
};

export const bandChartConfig = {
  center: {
    color: "var(--chart-1)",
    label: "Median",
  },
  range: {
    color: "var(--chart-2)",
    label: "P25-P75",
  },
};

export function gapDescription(behavior: "preserve" | "connect" | "zero-fill") {
  switch (behavior) {
    case "connect":
      return "Drops empty rows and returns annotations for missing spans.";
    case "zero-fill":
      return "Keeps empty bins and renders them as zero values.";
    case "preserve":
      return "Keeps empty bins as null values for renderer-native gaps.";
  }
}

export function formatHour(value: number) {
  const day = Math.floor(value / 24) + 1;
  const hour = Math.round(value % 24);

  return `D${day} ${hour.toString().padStart(2, "0")}:00`;
}

export function formatCompact(value: number) {
  return formatNumber.format(value);
}

export function formatNullableCompact(value: number | null) {
  return value === null ? "n/a" : formatCompact(value);
}

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function formatNullablePercent(value: number | null) {
  return value === null ? "n/a" : formatPercent(value);
}

export function titleCase(value: string) {
  return value.replace(/\b\w/g, (match) => match.toUpperCase());
}

export function formatCurrency(value: number) {
  return `$${formatNumber.format(value)}`;
}

export function seededWave(seed: number) {
  return Math.sin(seed * 12.9898) * Math.cos(seed * 78.233);
}
