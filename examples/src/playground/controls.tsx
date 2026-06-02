import { Label, NativeSelect, Slider, Switch } from "@moritzbrantner/ui";

import { CHART_VALUE_MODE_DEFINITIONS, getChartAxisScaleDefinitions } from "@moritzbrantner/charts";

import type {
  ChartPageId,
  ExampleDataSetId,
  PlaygroundAnimationMode,
  PlaygroundChartType,
  PlaygroundCurve,
} from "./model";
import type {
  ChartAxisOrientation,
  ChartAxisScale,
  ChartGapBehavior,
  ChartValueMode,
} from "@moritzbrantner/charts";
import type { ReactNode } from "react";

export function ControlSelect({
  children,
  disabled = false,
  label,
  onChange,
  value,
}: {
  children: ReactNode;
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <NativeSelect
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.value)}
      >
        {children}
      </NativeSelect>
    </label>
  );
}

export function KnobSlider({
  label,
  max,
  min,
  onValueChange,
  step,
  suffix = "",
  value,
}: {
  label: string;
  max: number;
  min: number;
  onValueChange: (value: number) => void;
  step: number;
  suffix?: string;
  value: number;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
        <span className="tabular-nums text-sm font-medium">
          {Number.isInteger(value) ? value : value.toFixed(1)}
          {suffix}
        </span>
      </div>
      <Slider
        max={max}
        min={min}
        step={step}
        value={[value]}
        onValueChange={(nextValue) => onValueChange(nextValue[0] ?? value)}
        thumbAriaLabel={label}
      />
    </div>
  );
}

export function SwitchKnob({
  checked,
  label,
  onCheckedChange,
}: {
  checked: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </label>
  );
}

export const playgroundChartOptions: Array<{ id: PlaygroundChartType; label: string }> = [
  { id: "area", label: "Area" },
  { id: "line", label: "Line" },
  { id: "bar", label: "Bar" },
  { id: "scatter", label: "Scatter" },
  { id: "bubble", label: "Bubble" },
  { id: "candle", label: "Candle" },
  { id: "combo", label: "Area + rolling" },
  { id: "histogram", label: "Histogram" },
  { id: "heatmap", label: "Heatmap" },
  { id: "stacked", label: "Stacked bars" },
  { id: "waterfall", label: "Waterfall" },
  { id: "funnel", label: "Funnel" },
  { id: "treemap", label: "Treemap" },
  { id: "sunburst", label: "Sunburst" },
  { id: "icicle", label: "Icicle" },
  { id: "flame-graph", label: "Flame graph" },
  { id: "circle-pack", label: "Circle pack" },
  { id: "tree", label: "Tree" },
  { id: "radial-tree", label: "Radial tree" },
  { id: "indented-tree", label: "Indented tree" },
];

export const chartPageLinks: Array<{
  id: ChartPageId;
  label: string;
  path: string;
}> = playgroundChartOptions.map((option) => ({
  id: `chart-${option.id}`,
  label: option.label,
  path: `${option.id}.html`,
}));

export const playgroundChartTitles: Record<PlaygroundChartType, string> = {
  area: "Area chart",
  bar: "Bar chart",
  bubble: "Bubble chart",
  candle: "Candle chart",
  "circle-pack": "Circle pack chart",
  combo: "Area chart with rolling line",
  "flame-graph": "Flame graph",
  funnel: "Funnel chart",
  heatmap: "Heatmap",
  histogram: "Histogram",
  icicle: "Icicle chart",
  "indented-tree": "Indented tree chart",
  line: "Line chart",
  "radial-tree": "Radial tree chart",
  scatter: "Scatter plot",
  stacked: "Stacked bars",
  sunburst: "Sunburst chart",
  tree: "Tree chart",
  treemap: "Treemap",
  waterfall: "Waterfall chart",
};

export const playgroundCurveOptions: Array<{ id: PlaygroundCurve; label: string }> = [
  { id: "monotone", label: "Monotone" },
  { id: "linear", label: "Linear" },
  { id: "natural", label: "Natural" },
  { id: "step", label: "Step" },
];

export const chartGapBehaviorOptions: Array<{ id: ChartGapBehavior; label: string }> = [
  { id: "preserve", label: "Preserve" },
  { id: "connect", label: "Connect" },
  { id: "zero-fill", label: "Zero fill" },
  { id: "drop", label: "Drop" },
];

export const chartAxisOrientationOptions: Array<{ id: ChartAxisOrientation; label: string }> = [
  { id: "vertical", label: "Vertical" },
  { id: "horizontal", label: "Horizontal" },
];

export const playgroundAnimationOptions: Array<{ id: PlaygroundAnimationMode; label: string }> = [
  { id: "none", label: "None" },
  { id: "draw", label: "Draw" },
  { id: "rescale", label: "Rescale" },
  { id: "draw-and-rescale", label: "Draw + rescale" },
];

export function playgroundChartConfig(valueMode: ChartValueMode, valueLabel: string) {
  return {
    [valueMode]: {
      color: "var(--chart-1)",
      label: valueLabel,
    },
    count: {
      color: "var(--chart-4)",
      label: "Count",
    },
    rolling: {
      color: "var(--chart-2)",
      label: "Rolling",
    },
    value: {
      color: "var(--chart-1)",
      label: valueLabel,
    },
  };
}

export function isExampleDataSetId(value: string): value is ExampleDataSetId {
  return ["operations", "retail", "sparse", "telemetry"].includes(value);
}

export function isPlaygroundChartType(value: string): value is PlaygroundChartType {
  return playgroundChartOptions.some((option) => option.id === value);
}

export function isPlaygroundCurve(value: string): value is PlaygroundCurve {
  return playgroundCurveOptions.some((option) => option.id === value);
}

export function isChartGapBehavior(value: string): value is ChartGapBehavior {
  return chartGapBehaviorOptions.some((option) => option.id === value);
}

export function isChartAxisOrientation(value: string): value is ChartAxisOrientation {
  return chartAxisOrientationOptions.some((option) => option.id === value);
}

export function isChartAxisScale(value: string): value is ChartAxisScale {
  return getChartAxisScaleDefinitions().some((definition) => definition.id === value);
}

export function isPlaygroundAnimationMode(value: string): value is PlaygroundAnimationMode {
  return playgroundAnimationOptions.some((option) => option.id === value);
}

export function isChartValueMode(value: string): value is ChartValueMode {
  return CHART_VALUE_MODE_DEFINITIONS.some((definition) => definition.id === value);
}
