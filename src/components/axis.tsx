import { Button, Input, NativeSelect, NativeSelectOption } from "@moritzbrantner/ui";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePlotArea } from "recharts";

import { ChartSeriesLegend } from "./chrome";
import {
  ChartMenuButton,
  ChartYAxisRangeLegendList,
  clamp,
  formatCompactNumber,
  getChartAxisMenuStyle,
  getChartAxisTriggerRect,
  isChartAxisScale,
  isFiniteNumber,
  joinClassNames,
  normalizeDomain,
} from "./shared";

import type {
  ChartAxisScale,
  ChartAxisTransformMenuProps,
  ChartAxisTransformStatus,
  ChartXAxisNavigationMenuProps,
  ChartYAxisRangeMenuProps,
} from "./types";
import type { JSX, MouseEvent } from "react";

const CHART_AXIS_SCALE_DEFINITIONS: Array<{
  description: string;
  id: ChartAxisScale;
  label: string;
}> = [
  {
    description: "Even spacing for ordinary numeric values.",
    id: "linear",
    label: "Linear",
  },
  {
    description: "Compresses positive values across orders of magnitude.",
    id: "log",
    label: "Logarithmic",
  },
  {
    description: "Softens large values while preserving zero.",
    id: "sqrt",
    label: "Square root",
  },
  {
    description: "Log-like scaling that also supports zero and negative values.",
    id: "symlog",
    label: "Symmetric log",
  },
];

export function getChartAxisScaleDefinitions(): Array<{
  id: ChartAxisScale;
  label: string;
  description: string;
}> {
  return [...CHART_AXIS_SCALE_DEFINITIONS];
}

export function resolveChartAxisTransformStatus({
  dataDomain,
  scale,
}: {
  dataDomain: [number, number] | null;
  scale: ChartAxisScale;
}): ChartAxisTransformStatus {
  if (scale === "log" && (!dataDomain || dataDomain[0] <= 0)) {
    return {
      message: "Log scale needs a strictly positive data domain.",
      renderScale: "linear",
      valid: false,
    };
  }

  return {
    message: null,
    renderScale: scale,
    valid: true,
  };
}

export function ChartAxisTransformMenu(props: ChartAxisTransformMenuProps): JSX.Element | null {
  return <ChartAxisTransformMenuContent {...props} />;
}

export function ChartXAxisNavigationMenu({
  "aria-label": ariaLabel = "X-axis navigation menu",
  axisHeight = 36,
  className,
  domain,
  formatValue = formatCompactNumber,
  fullDomain,
  minSpan,
  onDomainChange,
  orientation = "bottom",
  ranges = [],
}: ChartXAxisNavigationMenuProps): JSX.Element | null {
  const plotArea = usePlotArea();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [anchorValue, setAnchorValue] = useState<number | null>(null);
  const open = menuPosition !== null;
  const triggerRect = getChartAxisTriggerRect(plotArea, orientation, Math.max(1, axisHeight));
  const normalizedFullDomain = normalizeDomain(fullDomain, fullDomain, minSpan ?? 0);
  const normalizedDomain = normalizeDomain(domain, normalizedFullDomain, minSpan ?? 0);
  const span = normalizedDomain[1] - normalizedDomain[0];
  const resolvedMinSpan =
    minSpan ?? Math.max(1e-9, (normalizedFullDomain[1] - normalizedFullDomain[0]) / 10_000);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handlePointerDown = (event: globalThis.PointerEvent) => {
      const menu = menuRef.current;

      if (menu && event.target instanceof Node && menu.contains(event.target)) {
        return;
      }

      setMenuPosition(null);
    };
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuPosition(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!plotArea) {
    return null;
  }

  const closeWithDomain = (nextDomain: [number, number]) => {
    onDomainChange(normalizeDomain(nextDomain, normalizedFullDomain, resolvedMinSpan));
    setMenuPosition(null);
  };
  const getAnchor = () => anchorValue ?? (normalizedDomain[0] + normalizedDomain[1]) / 2;
  const zoom = (factor: number) => {
    const anchor = getAnchor();
    const nextSpan = clamp(
      span * factor,
      resolvedMinSpan,
      normalizedFullDomain[1] - normalizedFullDomain[0],
    );

    closeWithDomain([anchor - nextSpan / 2, anchor + nextSpan / 2]);
  };
  const pan = (direction: -1 | 1) => {
    const offset = span * direction;

    closeWithDomain([normalizedDomain[0] + offset, normalizedDomain[1] + offset]);
  };
  const handleContextMenu = (event: MouseEvent<SVGRectElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratio = clamp((event.clientX - bounds.left) / Math.max(1, bounds.width), 0, 1);

    setAnchorValue(normalizedDomain[0] + ratio * span);
    setMenuPosition({ x: event.clientX, y: event.clientY });
  };
  const openFromKeyboard = (event: {
    currentTarget: SVGRectElement;
    preventDefault: () => void;
  }) => {
    const bounds = event.currentTarget.getBoundingClientRect();

    event.preventDefault();
    setAnchorValue((normalizedDomain[0] + normalizedDomain[1]) / 2);
    setMenuPosition({
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height / 2,
    });
  };
  const menu =
    open && typeof document !== "undefined" && menuPosition
      ? createPortal(
          <div
            ref={menuRef}
            aria-label={ariaLabel}
            className={joinClassNames(
              "fixed z-50 w-64 border border-border bg-popover p-2 text-popover-foreground shadow-lg outline-none",
              className,
            )}
            role="dialog"
            style={getChartAxisMenuStyle(menuPosition)}
            tabIndex={-1}
          >
            <div className="grid gap-1">
              <div className="px-2 py-1 text-xs text-muted-foreground">
                {formatValue(normalizedDomain[0])} to {formatValue(normalizedDomain[1])}
              </div>
              <ChartMenuButton onClick={() => zoom(0.5)}>Zoom in</ChartMenuButton>
              <ChartMenuButton onClick={() => zoom(2)}>Zoom out</ChartMenuButton>
              <ChartMenuButton onClick={() => pan(-1)}>Pan left</ChartMenuButton>
              <ChartMenuButton onClick={() => pan(1)}>Pan right</ChartMenuButton>
              <ChartMenuButton onClick={() => closeWithDomain(normalizedFullDomain)}>
                Reset range
              </ChartMenuButton>
              {ranges.length > 0 ? (
                <div className="mt-1 border-t border-border/60 pt-1">
                  {ranges.map((range) => (
                    <ChartMenuButton key={range.id} onClick={() => closeWithDomain(range.domain)}>
                      {range.label}
                    </ChartMenuButton>
                  ))}
                </div>
              ) : null}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <g className={className} data-chart-x-axis-navigation-menu="">
        <rect
          aria-label={ariaLabel}
          data-chart-x-axis-navigation-trigger=""
          x={triggerRect.x}
          y={triggerRect.y}
          width={triggerRect.width}
          height={triggerRect.height}
          fill="transparent"
          role="button"
          tabIndex={0}
          onContextMenu={handleContextMenu}
          onPointerDown={(event) => {
            event.stopPropagation();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              openFromKeyboard(event);
            }
          }}
        >
          <title>{ariaLabel}</title>
        </rect>
      </g>
      {menu}
    </>
  );
}

function ChartAxisTransformMenuContent({
  "aria-label": ariaLabel,
  axis,
  axisWidth = 60,
  className,
  dataDomain = null,
  formatValue = formatCompactNumber,
  hiddenIds,
  legendItems = [],
  minSpan,
  onHiddenIdsChange,
  onValueChange,
  orientation = axis === "y" ? "left" : "bottom",
  showScale = true,
  value,
}: ChartAxisTransformMenuProps & { showScale?: boolean }): JSX.Element | null {
  const plotArea = usePlotArea();
  const minInputId = useId();
  const maxInputId = useId();
  const scaleInputId = useId();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [minInput, setMinInput] = useState("");
  const [maxInput, setMaxInput] = useState("");
  const [scaleInput, setScaleInput] = useState<ChartAxisScale>(value.scale);
  const [error, setError] = useState<string | null>(null);
  const open = menuPosition !== null;
  const resolvedAxisWidth = Math.max(1, axisWidth);
  const triggerRect = getChartAxisTriggerRect(plotArea, orientation, resolvedAxisWidth);
  const activeDomain = value.domain ?? dataDomain;
  const status = resolveChartAxisTransformStatus({
    dataDomain: activeDomain,
    scale: scaleInput,
  });
  const resolvedAriaLabel =
    ariaLabel ?? (axis === "y" ? "Y-axis transform menu" : "X-axis transform menu");
  const title = showScale
    ? axis === "y"
      ? "Y-axis transform"
      : "X-axis transform"
    : "Y-axis range";
  const scaleDefinitions = getChartAxisScaleDefinitions();

  const resetInputs = useCallback(() => {
    const nextDomain = value.domain ?? dataDomain;

    setMinInput(nextDomain ? String(nextDomain[0]) : "");
    setMaxInput(nextDomain ? String(nextDomain[1]) : "");
    setScaleInput(value.scale);
    setError(null);
  }, [dataDomain, value]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handlePointerDown = (event: globalThis.PointerEvent) => {
      const menu = menuRef.current;

      if (menu && event.target instanceof Node && menu.contains(event.target)) {
        return;
      }

      setMenuPosition(null);
    };
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuPosition(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      menuRef.current?.focus();
    }
  }, [open]);

  if (!plotArea) {
    return null;
  }

  const handleContextMenu = (event: MouseEvent<SVGRectElement>) => {
    event.preventDefault();
    event.stopPropagation();
    resetInputs();
    setMenuPosition({ x: event.clientX, y: event.clientY });
  };
  const handleApply = () => {
    const nextMin = Number(minInput);
    const nextMax = Number(maxInput);

    if (
      !minInput.trim() ||
      !maxInput.trim() ||
      !isFiniteNumber(nextMin) ||
      !isFiniteNumber(nextMax)
    ) {
      setError("Enter finite min and max values.");
      return;
    }

    if (nextMax <= nextMin) {
      setError("Max must be greater than min.");
      return;
    }

    if (minSpan !== undefined && nextMax - nextMin < minSpan) {
      setError(`Range must span at least ${formatValue(minSpan)}.`);
      return;
    }

    const nextStatus = resolveChartAxisTransformStatus({
      dataDomain: [nextMin, nextMax],
      scale: scaleInput,
    });

    onValueChange({
      domain: [nextMin, nextMax],
      scale: nextStatus.renderScale,
    });
    setMenuPosition(null);
  };
  const handleAuto = () => {
    onValueChange({
      domain: null,
      scale: status.renderScale,
    });
    setMinInput(dataDomain ? String(dataDomain[0]) : "");
    setMaxInput(dataDomain ? String(dataDomain[1]) : "");
    setError(null);
    setMenuPosition(null);
  };
  const menu =
    open && typeof document !== "undefined" && menuPosition
      ? createPortal(
          <div
            ref={menuRef}
            aria-label={resolvedAriaLabel}
            className={joinClassNames(
              "fixed z-50 w-72 border border-border bg-popover p-3 text-popover-foreground shadow-lg outline-none",
              className,
            )}
            role="dialog"
            style={getChartAxisMenuStyle(menuPosition)}
            tabIndex={-1}
          >
            <form
              className="grid gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                handleApply();
              }}
            >
              <div className="grid gap-1">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <span className="text-xs text-muted-foreground">
                    {value.domain ? "Manual" : "Auto"}
                  </span>
                </div>
                {activeDomain ? (
                  <p className="text-xs text-muted-foreground">
                    {formatValue(activeDomain[0])} to {formatValue(activeDomain[1])}
                  </p>
                ) : null}
              </div>
              {showScale ? (
                <label className="grid gap-1 text-xs font-medium" htmlFor={scaleInputId}>
                  Scale
                  <NativeSelect
                    id={scaleInputId}
                    value={scaleInput}
                    onChange={(event) => {
                      const nextScale = event.target.value;

                      if (isChartAxisScale(nextScale)) {
                        setScaleInput(nextScale);
                        setError(null);
                      }
                    }}
                  >
                    {scaleDefinitions.map((definition) => (
                      <NativeSelectOption key={definition.id} value={definition.id}>
                        {definition.label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </label>
              ) : null}
              {!status.valid ? <p className="text-xs text-destructive">{status.message}</p> : null}
              <div className="grid grid-cols-2 gap-2">
                <label className="grid gap-1 text-xs font-medium" htmlFor={minInputId}>
                  Min
                  <Input
                    id={minInputId}
                    type="number"
                    value={minInput}
                    onChange={(event) => {
                      setMinInput(event.target.value);
                      setError(null);
                    }}
                  />
                </label>
                <label className="grid gap-1 text-xs font-medium" htmlFor={maxInputId}>
                  Max
                  <Input
                    id={maxInputId}
                    type="number"
                    value={maxInput}
                    onChange={(event) => {
                      setMaxInput(event.target.value);
                      setError(null);
                    }}
                  />
                </label>
              </div>
              {error ? <p className="text-xs text-destructive">{error}</p> : null}
              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={handleAuto}>
                  Auto
                </Button>
                <Button type="button" size="sm" onClick={handleApply}>
                  Apply
                </Button>
              </div>
            </form>
            {legendItems.length > 0 ? (
              <div className="mt-3 border-t border-border/60 pt-3">
                {onHiddenIdsChange ? (
                  <ChartSeriesLegend
                    aria-label="Y-axis series legend"
                    className="gap-1"
                    hiddenIds={hiddenIds}
                    items={legendItems}
                    onHiddenIdsChange={onHiddenIdsChange}
                    showCounts={false}
                  />
                ) : (
                  <ChartYAxisRangeLegendList items={legendItems} />
                )}
              </div>
            ) : null}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <g className={className} data-chart-y-axis-range-menu="">
        <rect
          aria-label={resolvedAriaLabel}
          data-chart-y-axis-range-trigger=""
          data-chart-axis-transform-trigger={axis}
          x={triggerRect.x}
          y={triggerRect.y}
          width={triggerRect.width}
          height={triggerRect.height}
          fill="transparent"
          role="button"
          tabIndex={0}
          onContextMenu={handleContextMenu}
          onPointerDown={(event) => {
            event.stopPropagation();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              const bounds = event.currentTarget.getBoundingClientRect();

              event.preventDefault();
              resetInputs();
              setMenuPosition({
                x: bounds.left + bounds.width / 2,
                y: bounds.top + bounds.height / 2,
              });
            }
          }}
        >
          <title>{ariaLabel}</title>
        </rect>
      </g>
      {menu}
    </>
  );
}

export function ChartYAxisRangeMenu({
  "aria-label": ariaLabel = "Y-axis range menu",
  axisWidth,
  className,
  dataDomain,
  formatValue,
  hiddenIds,
  legendItems,
  minSpan,
  onHiddenIdsChange,
  onValueChange,
  orientation,
  value,
}: ChartYAxisRangeMenuProps): JSX.Element | null {
  return (
    <ChartAxisTransformMenuContent
      aria-label={ariaLabel}
      axis="y"
      axisWidth={axisWidth}
      className={className}
      dataDomain={dataDomain}
      formatValue={formatValue}
      hiddenIds={hiddenIds}
      legendItems={legendItems}
      minSpan={minSpan}
      onHiddenIdsChange={onHiddenIdsChange}
      onValueChange={(transform) => onValueChange(transform.domain)}
      orientation={orientation}
      showScale={false}
      value={{ domain: value, scale: "linear" }}
    />
  );
}
