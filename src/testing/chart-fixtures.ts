import type { ChartSeriesPoint } from "../density";

export type FixturePlan = "starter" | "scale" | "enterprise";
export type FixtureChannel = "direct" | "partner" | "marketplace";

export type FixtureProperties = {
  channel: FixtureChannel;
  plan: FixturePlan;
};

const plans: FixturePlan[] = ["starter", "scale", "enterprise"];
const channels: FixtureChannel[] = ["direct", "partner", "marketplace"];

export function createTelemetryPoints(): Array<ChartSeriesPoint<FixtureProperties>> {
  return Array.from({ length: 720 }, (_, index) => {
    const dayCycle = Math.sin((index / 24) * Math.PI * 2);
    const weeklyCycle = Math.cos((index / 168) * Math.PI * 2);
    const launchLift = index > 420 && index < 520 ? 34 : 0;
    const pulse = index % 57 === 0 ? 18 : 0;
    const y = 92 + dayCycle * 22 + weeklyCycle * 12 + launchLift + pulse;

    return {
      id: `telemetry-${index}`,
      label: `Hour ${index}`,
      metrics: {
        orders: 1 + (index % 5),
        revenue: Math.max(0, y * (8 + (index % 7))),
      },
      properties: {
        channel: channels[index % channels.length],
        plan: plans[index % plans.length],
      },
      x: index,
      y,
    };
  });
}

export function createSparsePoints(): Array<ChartSeriesPoint<FixtureProperties>> {
  return createTelemetryPoints().filter((point, index) => {
    if (index > 170 && index < 245) {
      return false;
    }

    if (index > 500 && index < 560) {
      return index % 11 === 0;
    }

    return index % 3 !== 0;
  });
}

export function createOutlierPoints(): Array<ChartSeriesPoint<FixtureProperties>> {
  return createTelemetryPoints().map((point, index) => ({
    ...point,
    y: index === 180 || index === 512 ? point.y * 2.8 : index === 304 ? point.y * 0.28 : point.y,
  }));
}

export function createGroupedPlanPoints(): Array<ChartSeriesPoint<FixtureProperties>> {
  return createTelemetryPoints().map((point, index) => {
    const plan = plans[index % plans.length];
    const planLift = plan === "enterprise" ? 40 : plan === "scale" ? 20 : 0;

    return {
      ...point,
      metrics: {
        ...point.metrics,
        accounts: plan === "enterprise" ? 3 : plan === "scale" ? 2 : 1,
      },
      properties: {
        channel: point.properties?.channel ?? channels[index % channels.length],
        plan,
      },
      y: point.y + planLift,
    };
  });
}

export function createLargeDeterministicPoints(
  count: number,
): Array<ChartSeriesPoint<FixtureProperties>> {
  return Array.from({ length: count }, (_, index) => {
    const trend = index / Math.max(1, count - 1);
    const wave = Math.sin(index / 19) * 16 + Math.cos(index / 41) * 9;

    return {
      id: `large-${index}`,
      label: `Point ${index}`,
      metrics: {
        orders: 1,
        revenue: 50 + trend * 500 + wave,
      },
      properties: {
        channel: channels[index % channels.length],
        plan: plans[index % plans.length],
      },
      x: index,
      y: 80 + trend * 120 + wave,
    };
  });
}
