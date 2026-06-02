import { useMemo } from "react";

import { CHART_VALUE_MODE_DEFINITIONS, getChartAxisScaleDefinitions } from "@moritzbrantner/charts";

import {
  chartAxisOrientationOptions,
  isChartAxisOrientation,
  isChartAxisScale,
  isChartValueMode,
  isPlaygroundChartType,
  playgroundChartOptions,
  playgroundChartTitles,
} from "./controls";

import type { PlaygroundChartType } from "./model";
import type { ChartAxesTransform, ChartValueMode } from "@moritzbrantner/charts";
import type { MenuActionItem } from "@moritzbrantner/ui";
import type { Dispatch, ReactNode, SetStateAction } from "react";

type PlaygroundContextMenuOptions = {
  axesTransform: ChartAxesTransform;
  chartCapabilities: {
    advancedControls: boolean;
    grid: boolean;
    labels: boolean;
    legend: boolean;
    minimap: boolean;
    threshold: boolean;
    valueMode: boolean;
  };
  chartType: PlaygroundChartType;
  clearBusinessSelections: () => void;
  effectiveDomain: [number, number];
  fixedChartType?: PlaygroundChartType | null;
  fullDomain: [number, number];
  handleInteractiveDomainChange: (domain: [number, number]) => void;
  hasLegendItems: boolean;
  onValueModeChange: (mode: ChartValueMode) => void;
  setAxesTransform: Dispatch<SetStateAction<ChartAxesTransform>>;
  setSelectedChartType: (chartType: PlaygroundChartType) => void;
  setShowGrid: (show: boolean) => void;
  setShowLabels: (show: boolean) => void;
  setShowLegend: (show: boolean) => void;
  setShowMinimap: (show: boolean) => void;
  setShowThreshold: (show: boolean) => void;
  showGrid: boolean;
  showLabels: boolean;
  showLegend: boolean;
  showMinimap: boolean;
  showThreshold: boolean;
  supportsAxisOrientation: boolean;
  valueMode: ChartValueMode;
};

export function usePlaygroundContextMenu({
  axesTransform,
  chartCapabilities,
  chartType,
  clearBusinessSelections,
  effectiveDomain,
  fixedChartType,
  fullDomain,
  handleInteractiveDomainChange,
  hasLegendItems,
  onValueModeChange,
  setAxesTransform,
  setSelectedChartType,
  setShowGrid,
  setShowLabels,
  setShowLegend,
  setShowMinimap,
  setShowThreshold,
  showGrid,
  showLabels,
  showLegend,
  showMinimap,
  showThreshold,
  supportsAxisOrientation,
  valueMode,
}: PlaygroundContextMenuOptions): { header: ReactNode; items: MenuActionItem[] } {
  const header = (
    <div className="grid gap-1 px-2 py-1.5 text-sm">
      <span className="font-medium">Chart options</span>
      <span className="text-xs text-muted-foreground">{playgroundChartTitles[chartType]}</span>
    </div>
  );

  const items = useMemo<MenuActionItem[]>(() => {
    const nextItems: MenuActionItem[] = [];
    const valueModeOptions = CHART_VALUE_MODE_DEFINITIONS.filter((mode) =>
      ["average", "count", "max", "sum"].includes(mode.id),
    );

    if (!fixedChartType) {
      nextItems.push({
        id: "chart-type",
        label: "Chart",
        options: playgroundChartOptions.map((option) => ({
          id: `chart-type-${option.id}`,
          label: option.label,
          value: option.id,
        })),
        type: "radio-group",
        value: chartType,
        onValueChange: (value) => {
          if (isPlaygroundChartType(value)) {
            clearBusinessSelections();
            setSelectedChartType(value);
          }
        },
      });
    }

    if (chartCapabilities.valueMode) {
      nextItems.push({
        id: "value-mode",
        label: "Value",
        options: valueModeOptions.map((mode) => ({
          id: `value-mode-${mode.id}`,
          label: mode.label,
          value: mode.id,
        })),
        type: "radio-group",
        value: valueMode,
        onValueChange: (value) => {
          if (isChartValueMode(value)) {
            onValueModeChange(value);
          }
        },
      });
    }

    if (supportsAxisOrientation) {
      nextItems.push({
        id: "axis-orientation",
        label: "Axes",
        options: chartAxisOrientationOptions.map((option) => ({
          id: `axis-orientation-${option.id}`,
          label: option.label,
          value: option.id,
        })),
        type: "radio-group",
        value: axesTransform.orientation,
        onValueChange: (value) => {
          if (isChartAxisOrientation(value)) {
            setAxesTransform((current) => ({ ...current, orientation: value }));
          }
        },
      });
    }

    if (chartCapabilities.advancedControls) {
      nextItems.push({
        id: "y-scale",
        label: "Y scale",
        options: getChartAxisScaleDefinitions().map((definition) => ({
          id: `y-scale-${definition.id}`,
          label: definition.label,
          value: definition.id,
        })),
        type: "radio-group",
        value: axesTransform.y.scale,
        onValueChange: (value) => {
          if (isChartAxisScale(value)) {
            setAxesTransform((current) => ({
              ...current,
              y: { ...current.y, scale: value },
            }));
          }
        },
      });
    }

    nextItems.push({ id: "display-separator", type: "separator" });

    if (chartCapabilities.grid) {
      nextItems.push({
        checked: showGrid,
        id: "toggle-grid",
        label: "Grid",
        onCheckedChange: setShowGrid,
        type: "checkbox",
      });
    }

    if (chartCapabilities.labels) {
      nextItems.push({
        checked: showLabels,
        id: "toggle-labels",
        label: "Labels",
        onCheckedChange: setShowLabels,
        type: "checkbox",
      });
    }

    if (chartCapabilities.legend && hasLegendItems) {
      nextItems.push({
        checked: showLegend,
        id: "toggle-legend",
        label: "Legend",
        onCheckedChange: setShowLegend,
        type: "checkbox",
      });
    }

    if (chartCapabilities.threshold) {
      nextItems.push({
        checked: showThreshold,
        id: "toggle-threshold",
        label: "Threshold",
        onCheckedChange: setShowThreshold,
        type: "checkbox",
      });
    }

    if (chartCapabilities.minimap) {
      nextItems.push({
        checked: showMinimap,
        id: "toggle-minimap",
        label: "Minimap",
        onCheckedChange: setShowMinimap,
        type: "checkbox",
      });
    }

    nextItems.push(
      { id: "viewport-separator", type: "separator" },
      {
        disabled: effectiveDomain[0] === fullDomain[0] && effectiveDomain[1] === fullDomain[1],
        id: "reset-viewport",
        label: "Reset viewport",
        onSelect: () => handleInteractiveDomainChange(fullDomain),
      },
    );

    return nextItems;
  }, [
    axesTransform.orientation,
    axesTransform.y,
    chartCapabilities.advancedControls,
    chartCapabilities.grid,
    chartCapabilities.labels,
    chartCapabilities.legend,
    chartCapabilities.minimap,
    chartCapabilities.threshold,
    chartCapabilities.valueMode,
    chartType,
    clearBusinessSelections,
    effectiveDomain,
    fixedChartType,
    fullDomain,
    handleInteractiveDomainChange,
    hasLegendItems,
    onValueModeChange,
    setAxesTransform,
    setSelectedChartType,
    setShowGrid,
    setShowLabels,
    setShowLegend,
    setShowMinimap,
    setShowThreshold,
    showGrid,
    showLabels,
    showLegend,
    showMinimap,
    showThreshold,
    supportsAxisOrientation,
    valueMode,
  ]);

  return { header, items };
}
