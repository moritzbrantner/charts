import { useMemo, useState } from "react";

import {
  ChartAnomalyMarkerList,
  ChartBackendStatus,
  ChartPanel,
  ChartSampleSparkline,
  ChartThresholdMarker,
  createChartDensityIndex,
  getChartAnomalyAnnotations,
  getChartThresholdAnnotations,
} from "@moritzbrantner/charts";

import { createOutlierPoints, createTelemetryPoints } from "../../testing/chart-fixtures";

import { StoryFrame } from "./story-support";

export function BackendStatusStory() {
  return (
    <StoryFrame title="Backend status">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ChartPanel title="Scheduled">
          <ChartBackendStatus
            onWarmNow={() => undefined}
            status={{
              activeBackend: "hybrid-js",
              isWarming: false,
              wasmError: null,
              wasmReady: false,
            }}
          />
        </ChartPanel>
        <ChartPanel title="Warming">
          <ChartBackendStatus
            progress={62}
            status={{
              activeBackend: "hybrid-js",
              isWarming: true,
              wasmError: null,
              wasmReady: false,
            }}
          />
        </ChartPanel>
        <ChartPanel title="Ready">
          <ChartBackendStatus
            status={{
              activeBackend: "wasm-index",
              isWarming: false,
              wasmError: null,
              wasmReady: true,
            }}
          />
        </ChartPanel>
        <ChartPanel title="Fallback">
          <ChartBackendStatus
            status={{
              activeBackend: "hybrid-js",
              isWarming: false,
              wasmError: "load failed",
              wasmReady: false,
            }}
          />
        </ChartPanel>
      </div>
    </StoryFrame>
  );
}

export function InteractiveSamplesStory() {
  const index = useMemo(() => createChartDensityIndex(createTelemetryPoints()), []);
  const series = useMemo(
    () =>
      index.getChartSeries({
        includeEmptyBins: true,
        targetBinCount: 64,
        xDomain: [0, 720],
      }),
    [index],
  );
  const [selected, setSelected] = useState(series.samples[24]?.index ?? null);

  return (
    <StoryFrame title="Interactive samples">
      <ChartPanel title="Sparkline selection">
        <ChartSampleSparkline
          domain={[0, 720]}
          samples={series.samples}
          selectedSampleIndex={selected}
          onSampleSelect={(sample) => setSelected(sample.index)}
        />
      </ChartPanel>
    </StoryFrame>
  );
}

export function ThresholdsAndAnomaliesStory() {
  const index = useMemo(() => createChartDensityIndex(createOutlierPoints()), []);
  const series = useMemo(
    () =>
      index.getChartSeries({
        includeEmptyBins: true,
        targetBinCount: 96,
        xDomain: [0, 720],
      }),
    [index],
  );
  const thresholds = getChartThresholdAnnotations(series.samples, 150);
  const anomalies = getChartAnomalyAnnotations(series.samples, { sensitivity: 2.2 });

  return (
    <StoryFrame title="Thresholds and anomalies">
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartPanel title="Threshold ranges">
          <ChartThresholdMarker annotations={thresholds} />
        </ChartPanel>
        <ChartPanel title="Anomalies">
          <ChartAnomalyMarkerList anomalies={anomalies} />
        </ChartPanel>
      </div>
    </StoryFrame>
  );
}
