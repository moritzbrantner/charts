import { Button, NativeSelectOption } from "@moritzbrantner/ui";

import {
  CHART_VALUE_MODE_DEFINITIONS,
  ChartPanel,
  getChartAxisScaleDefinitions,
} from "@moritzbrantner/charts";

import {
  ControlSelect,
  KnobSlider,
  SwitchKnob,
  chartAxisOrientationOptions,
  chartGapBehaviorOptions,
  isChartAxisOrientation,
  isChartAxisScale,
  isChartGapBehavior,
  isChartValueMode,
  isExampleDataSetId,
  isPlaygroundAnimationMode,
  isPlaygroundChartType,
  isPlaygroundCurve,
  playgroundAnimationOptions,
  playgroundChartOptions,
  playgroundCurveOptions,
} from "./controls";
import { ranges } from "./model";

import type {
  ExampleDataSet,
  ExampleDataSetId,
  PlaygroundAnimationMode,
  PlaygroundChartType,
  PlaygroundCurve,
} from "./model";
import type {
  ChartAxesTransform,
  ChartGapBehavior,
  ChartValueMode,
  useChartPlaybackDomain,
} from "@moritzbrantner/charts";
import type { Dispatch, SetStateAction } from "react";

type PlaygroundControlPanelProps = {
  animationMode: PlaygroundAnimationMode;
  axesTransform: ChartAxesTransform;
  barRadius: number;
  chartCapabilities: {
    advancedControls: boolean;
    grid: boolean;
    labels: boolean;
    legend: boolean;
    minimap: boolean;
    playback: boolean;
    styleControls: boolean;
    threshold: boolean;
    valueMode: boolean;
  };
  chartType: PlaygroundChartType;
  clearBusinessSelections: () => void;
  curve: PlaygroundCurve;
  datasets: ExampleDataSet[];
  fillOpacity: number;
  fixedChartType?: PlaygroundChartType | null;
  gapBehavior: ChartGapBehavior;
  hasLegendItems: boolean;
  heatmapYBins: number;
  histogramBuckets: number;
  onDataSetChange: (id: ExampleDataSetId) => void;
  onRangeChange: (rangeId: string) => void;
  onValueModeChange: (mode: ChartValueMode) => void;
  playback: ReturnType<typeof useChartPlaybackDomain>;
  playbackEnabled: boolean;
  rangeId: string;
  rollingWindow: number;
  selectedDataset: ExampleDataSet;
  setAnimationMode: (mode: PlaygroundAnimationMode) => void;
  setAxesTransform: Dispatch<SetStateAction<ChartAxesTransform>>;
  setBarRadius: (value: number) => void;
  setCurve: (curve: PlaygroundCurve) => void;
  setFillOpacity: (value: number) => void;
  setGapBehavior: (behavior: ChartGapBehavior) => void;
  setHeatmapYBins: (value: number) => void;
  setHistogramBuckets: (value: number) => void;
  setPlaybackEnabled: (enabled: boolean) => void;
  setRollingWindow: (value: number) => void;
  setSelectedChartType: (chartType: PlaygroundChartType) => void;
  setShowGrid: (show: boolean) => void;
  setShowLabels: (show: boolean) => void;
  setShowLegend: (show: boolean) => void;
  setShowMinimap: (show: boolean) => void;
  setShowThreshold: (show: boolean) => void;
  setStrokeWidth: (value: number) => void;
  setTargetBinCount: (value: number) => void;
  setThreshold: (value: number) => void;
  showGrid: boolean;
  showLabels: boolean;
  showLegend: boolean;
  showMinimap: boolean;
  showThreshold: boolean;
  strokeWidth: number;
  supportsAxisOrientation: boolean;
  targetBinCount: number;
  threshold: number;
  valueMode: ChartValueMode;
};

export function PlaygroundControlPanel({
  animationMode,
  axesTransform,
  barRadius,
  chartCapabilities,
  chartType,
  clearBusinessSelections,
  curve,
  datasets,
  fillOpacity,
  fixedChartType,
  gapBehavior,
  hasLegendItems,
  heatmapYBins,
  histogramBuckets,
  onDataSetChange,
  onRangeChange,
  onValueModeChange,
  playback,
  playbackEnabled,
  rangeId,
  rollingWindow,
  selectedDataset,
  setAnimationMode,
  setAxesTransform,
  setBarRadius,
  setCurve,
  setFillOpacity,
  setGapBehavior,
  setHeatmapYBins,
  setHistogramBuckets,
  setPlaybackEnabled,
  setRollingWindow,
  setSelectedChartType,
  setShowGrid,
  setShowLabels,
  setShowLegend,
  setShowMinimap,
  setShowThreshold,
  setStrokeWidth,
  setTargetBinCount,
  setThreshold,
  showGrid,
  showLabels,
  showLegend,
  showMinimap,
  showThreshold,
  strokeWidth,
  supportsAxisOrientation,
  targetBinCount,
  threshold,
  valueMode,
}: PlaygroundControlPanelProps) {
  return (
    <ChartPanel title="Knobs" description="Controls for the active chart.">
      <div className="grid gap-5">
        <div className="grid gap-3">
          <ControlSelect
            label="Dataset"
            value={selectedDataset.id}
            onChange={(value) => {
              if (isExampleDataSetId(value)) {
                clearBusinessSelections();
                onDataSetChange(value);
              }
            }}
          >
            {datasets.map((dataset) => (
              <NativeSelectOption key={dataset.id} value={dataset.id}>
                {dataset.label}
              </NativeSelectOption>
            ))}
          </ControlSelect>
          <ControlSelect
            label="Viewport"
            value={rangeId}
            onChange={(value) => {
              clearBusinessSelections();
              onRangeChange(value);
            }}
          >
            {ranges.map((range) => (
              <NativeSelectOption key={range.id} value={range.id}>
                {range.label}
              </NativeSelectOption>
            ))}
          </ControlSelect>
          <ControlSelect
            label="Chart"
            value={chartType}
            disabled={Boolean(fixedChartType)}
            onChange={(value) => {
              if (!fixedChartType && isPlaygroundChartType(value)) {
                clearBusinessSelections();
                setSelectedChartType(value);
              }
            }}
          >
            {playgroundChartOptions.map((option) => (
              <NativeSelectOption key={option.id} value={option.id}>
                {option.label}
              </NativeSelectOption>
            ))}
          </ControlSelect>
          {chartCapabilities.valueMode ? (
            <ControlSelect
              label="Value"
              value={valueMode}
              onChange={(value) => {
                if (isChartValueMode(value)) {
                  onValueModeChange(value);
                }
              }}
            >
              {CHART_VALUE_MODE_DEFINITIONS.map((mode) => (
                <NativeSelectOption key={mode.id} value={mode.id}>
                  {mode.label}
                </NativeSelectOption>
              ))}
            </ControlSelect>
          ) : null}
        </div>

        {chartCapabilities.styleControls ? (
          <div className="grid gap-4">
            <KnobSlider
              label="Bins"
              max={240}
              min={12}
              onValueChange={setTargetBinCount}
              step={6}
              value={targetBinCount}
            />
            <KnobSlider
              label="Histogram buckets"
              max={60}
              min={6}
              onValueChange={setHistogramBuckets}
              step={3}
              value={histogramBuckets}
            />
            <KnobSlider
              label="Heatmap y bins"
              max={24}
              min={4}
              onValueChange={setHeatmapYBins}
              step={1}
              value={heatmapYBins}
            />
            <KnobSlider
              label="Rolling window"
              max={31}
              min={1}
              onValueChange={setRollingWindow}
              step={2}
              value={rollingWindow}
            />
            <KnobSlider
              label="Threshold"
              max={320}
              min={20}
              onValueChange={setThreshold}
              step={5}
              value={threshold}
            />
            <KnobSlider
              label="Stroke"
              max={5}
              min={1}
              onValueChange={setStrokeWidth}
              step={0.2}
              suffix="px"
              value={strokeWidth}
            />
            <KnobSlider
              label="Fill"
              max={60}
              min={0}
              onValueChange={setFillOpacity}
              step={2}
              suffix="%"
              value={fillOpacity}
            />
            <KnobSlider
              label="Bar radius"
              max={12}
              min={0}
              onValueChange={setBarRadius}
              step={1}
              suffix="px"
              value={barRadius}
            />
          </div>
        ) : null}

        {chartCapabilities.advancedControls ? (
          <div className="grid gap-3">
            <ControlSelect
              label="Curve"
              value={curve}
              onChange={(value) => {
                if (isPlaygroundCurve(value)) {
                  setCurve(value);
                }
              }}
            >
              {playgroundCurveOptions.map((option) => (
                <NativeSelectOption key={option.id} value={option.id}>
                  {option.label}
                </NativeSelectOption>
              ))}
            </ControlSelect>
            <ControlSelect
              label="Gaps"
              value={gapBehavior}
              onChange={(value) => {
                if (isChartGapBehavior(value)) {
                  setGapBehavior(value);
                }
              }}
            >
              {chartGapBehaviorOptions.map((option) => (
                <NativeSelectOption key={option.id} value={option.id}>
                  {option.label}
                </NativeSelectOption>
              ))}
            </ControlSelect>
            <ControlSelect
              label="Axes"
              value={axesTransform.orientation}
              onChange={(value) => {
                if (isChartAxisOrientation(value)) {
                  setAxesTransform((current) => ({ ...current, orientation: value }));
                }
              }}
            >
              {chartAxisOrientationOptions.map((option) => (
                <NativeSelectOption
                  key={option.id}
                  value={option.id}
                  disabled={!supportsAxisOrientation && option.id === "horizontal"}
                >
                  {option.label}
                </NativeSelectOption>
              ))}
            </ControlSelect>
            <ControlSelect
              label="X scale"
              value={axesTransform.x.scale}
              onChange={(value) => {
                if (isChartAxisScale(value)) {
                  setAxesTransform((current) => ({
                    ...current,
                    x: { ...current.x, scale: value },
                  }));
                }
              }}
            >
              {getChartAxisScaleDefinitions().map((option) => (
                <NativeSelectOption key={option.id} value={option.id}>
                  {option.label}
                </NativeSelectOption>
              ))}
            </ControlSelect>
            <ControlSelect
              label="Y scale"
              value={axesTransform.y.scale}
              onChange={(value) => {
                if (isChartAxisScale(value)) {
                  setAxesTransform((current) => ({
                    ...current,
                    y: { ...current.y, scale: value },
                  }));
                }
              }}
            >
              {getChartAxisScaleDefinitions().map((option) => (
                <NativeSelectOption key={option.id} value={option.id}>
                  {option.label}
                </NativeSelectOption>
              ))}
            </ControlSelect>
            <ControlSelect
              label="Animation"
              value={animationMode}
              onChange={(value) => {
                if (isPlaygroundAnimationMode(value)) {
                  setAnimationMode(value);
                }
              }}
            >
              {playgroundAnimationOptions.map((option) => (
                <NativeSelectOption key={option.id} value={option.id}>
                  {option.label}
                </NativeSelectOption>
              ))}
            </ControlSelect>
          </div>
        ) : null}

        <div className="grid gap-3">
          {chartCapabilities.grid ? (
            <SwitchKnob label="Grid" checked={showGrid} onCheckedChange={setShowGrid} />
          ) : null}
          {chartCapabilities.labels ? (
            <SwitchKnob label="Labels" checked={showLabels} onCheckedChange={setShowLabels} />
          ) : null}
          {chartCapabilities.legend && hasLegendItems ? (
            <SwitchKnob label="Legend" checked={showLegend} onCheckedChange={setShowLegend} />
          ) : null}
          {chartCapabilities.threshold ? (
            <SwitchKnob
              label="Threshold"
              checked={showThreshold}
              onCheckedChange={setShowThreshold}
            />
          ) : null}
          {chartCapabilities.minimap ? (
            <SwitchKnob label="Minimap" checked={showMinimap} onCheckedChange={setShowMinimap} />
          ) : null}
          {chartCapabilities.playback ? (
            <SwitchKnob
              label="Playback"
              checked={playbackEnabled}
              onCheckedChange={setPlaybackEnabled}
            />
          ) : null}
          {playbackEnabled && chartCapabilities.playback ? (
            <div className="grid grid-cols-3 gap-2">
              <Button type="button" variant="outline" size="sm" onClick={playback.play}>
                Play
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={playback.pause}>
                Pause
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={playback.reset}>
                Reset
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </ChartPanel>
  );
}
