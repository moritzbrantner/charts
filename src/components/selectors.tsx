import { Button, Progress, ToggleGroup, ToggleGroupItem } from "@moritzbrantner/ui";

import { CHART_VALUE_MODE_DEFINITIONS } from "../density";

import { formatDomainRange, formatUnknownError, joinClassNames } from "./shared";

import type { ChartValueMode } from "../density";
import type {
  ChartBackendStatusProps,
  ChartRangeSelectorProps,
  ChartValueModeSelectorProps,
} from "./types";
import type { JSX } from "react";

export function ChartRangeSelector({
  "aria-label": ariaLabel = "Chart range",
  className,
  formatDomain = formatDomainRange,
  onValueChange,
  ranges,
  value,
}: ChartRangeSelectorProps): JSX.Element {
  return (
    <div
      className={joinClassNames("space-y-3", className)}
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {ranges.map((range) => {
        const active = range.id === value;

        return (
          <Button
            key={range.id}
            type="button"
            role="radio"
            variant="outline"
            aria-checked={active}
            className={joinClassNames(
              "h-auto w-full justify-start whitespace-normal rounded-none border p-4 text-left transition hover:border-primary/60",
              active ? "border-primary bg-primary/10" : "border-border/60 bg-muted/20",
            )}
            onClick={() => onValueChange(range.id)}
          >
            <span className="grid min-w-0 w-full gap-2">
              <span className="flex min-w-0 flex-wrap items-center justify-between gap-3">
                <span className="font-medium">{range.label}</span>
                <span className="min-w-0 text-xs text-muted-foreground">
                  {formatDomain(range.domain)}
                </span>
              </span>
              {range.description ? (
                <span className="block text-sm leading-6 text-muted-foreground">
                  {range.description}
                </span>
              ) : null}
            </span>
          </Button>
        );
      })}
    </div>
  );
}

export function ChartValueModeSelector({
  "aria-label": ariaLabel = "Chart value mode",
  className,
  definitions = CHART_VALUE_MODE_DEFINITIONS,
  onValueChange,
  value,
}: ChartValueModeSelectorProps): JSX.Element {
  return (
    <ToggleGroup
      type="single"
      value={value}
      aria-label={ariaLabel}
      className={joinClassNames("flex flex-wrap items-center gap-2", className)}
      onValueChange={(nextValue) => {
        if (nextValue) {
          onValueChange(nextValue as ChartValueMode);
        }
      }}
    >
      {definitions.map((definition) => (
        <ToggleGroupItem key={definition.id} value={definition.id} aria-label={definition.label}>
          {definition.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export function ChartBackendStatus({
  className,
  formatError = formatUnknownError,
  onWarmNow,
  progress,
  status,
  warmLabel = "Warm WASM now",
}: ChartBackendStatusProps): JSX.Element {
  const stateLabel = status.wasmReady
    ? "ready"
    : status.isWarming
      ? "warming"
      : status.wasmError
        ? "fallback"
        : "scheduled";
  const progressValue = progress ?? (status.wasmReady ? 100 : status.isWarming ? 62 : 22);
  const warmDisabled = status.isWarming || status.wasmReady;

  return (
    <div className={joinClassNames("space-y-5", className)}>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-medium">{status.activeBackend}</span>
          <span className="text-muted-foreground">{stateLabel}</span>
        </div>
        <Progress aria-label="WASM backend warmup progress" value={progressValue} />
      </div>
      {status.wasmError ? (
        <p className="text-sm leading-6 text-muted-foreground">{formatError(status.wasmError)}</p>
      ) : null}
      {onWarmNow ? (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={warmDisabled}
          onClick={onWarmNow}
        >
          {warmLabel}
        </Button>
      ) : null}
    </div>
  );
}
