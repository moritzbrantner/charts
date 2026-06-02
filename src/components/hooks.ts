import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  areDomainsEqual,
  cancelFrame,
  clamp,
  clampDomain,
  getDomainPointerBounds,
  getDomainValueFromClientX,
  getVisibleChartSeriesIds,
  normalizeDomain,
  normalizeHiddenChartSeriesIds,
  requestFrame,
  roundToStep,
  toggleChartSeriesId,
} from "./shared";

import type { ChartDomainDragState, ChartWheelEvent } from "./shared";
import type {
  ChartDomainDragSelection,
  UseChartBinCountOptions,
  UseChartBinCountResult,
  UseChartDragDomainOptions,
  UseChartDragDomainResult,
  UseChartSeriesVisibilityOptions,
  UseChartSeriesVisibilityResult,
  UseChartWheelDomainOptions,
  UseChartWheelDomainResult,
} from "./types";
import type { MouseEvent, PointerEvent, WheelEvent } from "react";

export function useChartBinCount<TElement extends Element = HTMLDivElement>(
  options: UseChartBinCountOptions = {},
): UseChartBinCountResult<TElement> {
  const {
    defaultBinCount = 144,
    maxBinCount = 360,
    minBinCount = 48,
    pixelsPerBin = 8,
    step = 12,
  } = options;
  const [element, setElement] = useState<TElement | null>(null);
  const [width, setWidth] = useState<number | null>(null);
  const [manualBinCount, setManualBinCountState] = useState<number | null>(null);
  const autoBinCount =
    width === null
      ? defaultBinCount
      : roundToStep(width / Math.max(1, pixelsPerBin), step, minBinCount, maxBinCount);
  const targetBinCount = manualBinCount ?? autoBinCount;
  const containerRef = useCallback((node: TElement | null) => {
    setElement(node);
  }, []);
  const setManualBinCount = useCallback(
    (value: number) => {
      setManualBinCountState(roundToStep(value, step, minBinCount, maxBinCount));
    },
    [maxBinCount, minBinCount, step],
  );
  const resetAuto = useCallback(() => {
    setManualBinCountState(null);
  }, []);

  useEffect(() => {
    if (!element || typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (entry) {
        setWidth(entry.contentRect.width);
      }
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [element]);

  return {
    containerRef,
    isAuto: manualBinCount === null,
    resetAuto,
    setManualBinCount,
    targetBinCount,
    width,
  };
}

export function useChartDragDomain<TElement extends Element = HTMLElement>({
  disabled = false,
  domain,
  fullDomain,
  minDragPixels = 4,
  minSpan,
  onDomainChange,
  onDomainPreviewChange,
  panScale = 1,
  resetOnDoubleClick = true,
  selectModifier = "shift-or-alt",
  updateMode = "live",
}: UseChartDragDomainOptions): UseChartDragDomainResult<TElement> {
  const elementRef = useRef<TElement | null>(null);
  const dragStateRef = useRef<ChartDomainDragState | null>(null);
  const domainRef = useRef(domain);
  const fullDomainRef = useRef(fullDomain);
  const onDomainChangeRef = useRef(onDomainChange);
  const onDomainPreviewChangeRef = useRef(onDomainPreviewChange);
  const previewDomainRef = useRef<[number, number] | null>(null);
  const pendingDomainRef = useRef<[number, number] | null>(null);
  const frameIdRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selection, setSelection] = useState<ChartDomainDragSelection | null>(null);

  useEffect(() => {
    domainRef.current = domain;
    fullDomainRef.current = fullDomain;
    onDomainChangeRef.current = onDomainChange;
    onDomainPreviewChangeRef.current = onDomainPreviewChange;
  }, [domain, fullDomain, onDomainChange, onDomainPreviewChange]);

  const flushPendingDomain = useCallback(() => {
    if (frameIdRef.current !== null) {
      cancelFrame(frameIdRef.current);
      frameIdRef.current = null;
    }

    const pendingDomain = pendingDomainRef.current;

    if (!pendingDomain) {
      return;
    }

    pendingDomainRef.current = null;

    if (!areDomainsEqual(pendingDomain, domainRef.current)) {
      domainRef.current = pendingDomain;
      onDomainChangeRef.current(pendingDomain);
    }
  }, []);
  const stageDomainChange = useCallback(
    (nextDomain: [number, number]) => {
      const resolvedFullDomain = fullDomainRef.current;
      const fullSpan = resolvedFullDomain[1] - resolvedFullDomain[0];
      const resolvedMinSpan = Math.min(
        fullSpan,
        Math.max(minSpan ?? fullSpan / 1000, Number.EPSILON),
      );
      const normalized = normalizeDomain(nextDomain, resolvedFullDomain, resolvedMinSpan);
      const currentDomain = pendingDomainRef.current ?? domainRef.current;

      if (areDomainsEqual(normalized, currentDomain)) {
        return;
      }

      pendingDomainRef.current = normalized;

      if (frameIdRef.current !== null) {
        return;
      }

      frameIdRef.current = requestFrame(() => {
        frameIdRef.current = null;

        const pendingDomain = pendingDomainRef.current;

        if (!pendingDomain) {
          return;
        }

        pendingDomainRef.current = null;

        if (!areDomainsEqual(pendingDomain, domainRef.current)) {
          domainRef.current = pendingDomain;
          onDomainChangeRef.current(pendingDomain);
        }
      });
    },
    [minSpan],
  );
  const previewDomainChange = useCallback(
    (nextDomain: [number, number], startDomain: [number, number], width: number) => {
      const resolvedFullDomain = fullDomainRef.current;
      const fullSpan = resolvedFullDomain[1] - resolvedFullDomain[0];
      const resolvedMinSpan = Math.min(
        fullSpan,
        Math.max(minSpan ?? fullSpan / 1000, Number.EPSILON),
      );
      const normalized = normalizeDomain(nextDomain, resolvedFullDomain, resolvedMinSpan);
      const span = Math.max(Number.EPSILON, startDomain[1] - startDomain[0]);
      const offsetPx = -((normalized[0] - startDomain[0]) / span) * width;
      const previousPreview = previewDomainRef.current;

      previewDomainRef.current = normalized;

      if (
        previousPreview &&
        areDomainsEqual(previousPreview, normalized) &&
        onDomainPreviewChangeRef.current
      ) {
        return;
      }

      onDomainPreviewChangeRef.current?.({
        domain: normalized,
        offsetPx,
      });
    },
    [minSpan],
  );
  const containerRef = useCallback((node: TElement | null) => {
    elementRef.current = node;
  }, []);
  const shouldSelect = useCallback(
    (event: PointerEvent<TElement>) => {
      if (selectModifier === "shift") {
        return event.shiftKey;
      }

      if (selectModifier === "alt") {
        return event.altKey;
      }

      return event.shiftKey || event.altKey;
    },
    [selectModifier],
  );
  const stopDragging = useCallback(
    (event: PointerEvent<TElement>) => {
      const dragState = dragStateRef.current;

      if (!dragState || dragState.pointerId !== event.pointerId) {
        return;
      }

      event.currentTarget.releasePointerCapture?.(event.pointerId);

      if (dragState.mode === "pan") {
        if (updateMode === "preview") {
          const nextDomain = previewDomainRef.current;

          if (nextDomain && !areDomainsEqual(nextDomain, domainRef.current)) {
            domainRef.current = nextDomain;
            onDomainChangeRef.current(nextDomain);
          }
        } else {
          flushPendingDomain();
        }
      } else {
        flushPendingDomain();
      }

      if (dragState.mode === "select" && dragState.dragged) {
        const startValue = getDomainValueFromClientX(
          dragState.startClientX,
          dragState.bounds,
          dragState.startDomain,
        );
        const endValue = getDomainValueFromClientX(
          event.clientX,
          dragState.bounds,
          dragState.startDomain,
        );
        const fullSpan = fullDomainRef.current[1] - fullDomainRef.current[0];
        const resolvedMinSpan = Math.min(
          fullSpan,
          Math.max(minSpan ?? fullSpan / 1000, Number.EPSILON),
        );
        const nextDomain = normalizeDomain(
          [startValue, endValue],
          fullDomainRef.current,
          resolvedMinSpan,
        );

        if (!areDomainsEqual(nextDomain, domainRef.current)) {
          domainRef.current = nextDomain;
          onDomainChangeRef.current(nextDomain);
        }
      }

      dragStateRef.current = null;
      previewDomainRef.current = null;
      onDomainPreviewChangeRef.current?.(null);
      setIsDragging(false);
      setSelection(null);
    },
    [flushPendingDomain, minSpan, updateMode],
  );
  const onPointerDown = useCallback(
    (event: PointerEvent<TElement>) => {
      if (disabled || event.button !== 0 || event.isPrimary === false) {
        return;
      }

      const span = domain[1] - domain[0];
      const fullSpan = fullDomain[1] - fullDomain[0];

      if (span <= 0 || fullSpan <= 0) {
        return;
      }

      event.currentTarget.setPointerCapture?.(event.pointerId);
      dragStateRef.current = {
        bounds: getDomainPointerBounds(event.currentTarget),
        dragged: false,
        mode: shouldSelect(event) ? "select" : "pan",
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startDomain: domain,
      };
    },
    [disabled, domain, fullDomain, shouldSelect],
  );
  const onPointerMove = useCallback(
    (event: PointerEvent<TElement>) => {
      const dragState = dragStateRef.current;

      if (!dragState || dragState.pointerId !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - dragState.startClientX;

      if (!dragState.dragged && Math.abs(deltaX) < Math.max(0, minDragPixels)) {
        return;
      }

      event.preventDefault();

      if (!dragState.dragged) {
        dragState.dragged = true;
        setIsDragging(true);
      }

      if (dragState.mode === "select") {
        const left = clamp(
          Math.min(dragState.startClientX, event.clientX) - dragState.bounds.left,
          0,
          dragState.bounds.width,
        );
        const right = clamp(
          Math.max(dragState.startClientX, event.clientX) - dragState.bounds.left,
          0,
          dragState.bounds.width,
        );

        setSelection({
          left,
          width: Math.max(0, right - left),
        });

        return;
      }

      const width = Math.max(1, dragState.bounds.width);
      const span = dragState.startDomain[1] - dragState.startDomain[0];
      const shift = (-deltaX / width) * span * panScale;
      const nextDomain: [number, number] = [
        dragState.startDomain[0] + shift,
        dragState.startDomain[1] + shift,
      ];

      if (updateMode === "preview") {
        previewDomainChange(nextDomain, dragState.startDomain, width);

        return;
      }

      stageDomainChange(nextDomain);
    },
    [minDragPixels, panScale, previewDomainChange, stageDomainChange, updateMode],
  );
  const onPointerUp = useCallback(
    (event: PointerEvent<TElement>) => {
      stopDragging(event);
    },
    [stopDragging],
  );
  const onPointerCancel = useCallback(
    (event: PointerEvent<TElement>) => {
      stopDragging(event);
    },
    [stopDragging],
  );
  const onDoubleClick = useCallback(
    (event: MouseEvent<TElement>) => {
      if (
        disabled ||
        !resetOnDoubleClick ||
        areDomainsEqual(domainRef.current, fullDomainRef.current)
      ) {
        return;
      }

      event.preventDefault();
      onDomainChangeRef.current(fullDomainRef.current);
      domainRef.current = fullDomainRef.current;
    },
    [disabled, resetOnDoubleClick],
  );

  useEffect(
    () => () => {
      if (frameIdRef.current !== null) {
        cancelFrame(frameIdRef.current);
      }

      frameIdRef.current = null;
      previewDomainRef.current = null;
      onDomainPreviewChangeRef.current?.(null);
    },
    [],
  );

  return {
    containerRef,
    isDragging,
    onDoubleClick,
    onPointerCancel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    selection,
  };
}

export function useChartWheelDomain<TElement extends Element = HTMLElement>({
  disabled = false,
  domain,
  fullDomain,
  minSpan,
  onDomainChange,
  scrollScale = 1,
  zoomScale = 2,
}: UseChartWheelDomainOptions): UseChartWheelDomainResult<TElement> {
  const [element, setElement] = useState<TElement | null>(null);
  const handledNativeWheelEventsRef = useRef<WeakSet<globalThis.WheelEvent>>(new WeakSet());
  const handleWheel = useCallback(
    (event: ChartWheelEvent, currentTarget: TElement) => {
      if (disabled) {
        return;
      }

      const span = domain[1] - domain[0];
      const fullSpan = fullDomain[1] - fullDomain[0];

      if (span <= 0 || fullSpan <= 0) {
        return;
      }

      const isZoomGesture = event.ctrlKey || event.metaKey;
      const hasHorizontalIntent = Math.abs(event.deltaX) > Math.abs(event.deltaY) || event.shiftKey;

      if (!isZoomGesture && !hasHorizontalIntent) {
        return;
      }

      const primaryDelta = isZoomGesture
        ? Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY
        : event.shiftKey && event.deltaX === 0
          ? event.deltaY
          : event.deltaX;

      if (primaryDelta === 0) {
        return;
      }

      event.preventDefault();

      const bounds = currentTarget.getBoundingClientRect();
      const width = Math.max(1, bounds.width);
      const pixelDelta =
        event.deltaMode === 1
          ? primaryDelta * 16
          : event.deltaMode === 2
            ? primaryDelta * width
            : primaryDelta;

      if (isZoomGesture) {
        const resolvedMinSpan = Math.min(
          fullSpan,
          Math.max(minSpan ?? fullSpan / 1000, Number.EPSILON),
        );
        const anchorRatio = clamp((event.clientX - bounds.left) / width, 0, 1);
        const nextSpan = clamp(
          span * Math.exp((pixelDelta / width) * zoomScale),
          resolvedMinSpan,
          fullSpan,
        );

        if (nextSpan === span) {
          return;
        }

        const scale = nextSpan / span;
        const anchor = domain[0] + anchorRatio * span;
        const nextDomain = clampDomain(
          [anchor - (anchor - domain[0]) * scale, anchor + (domain[1] - anchor) * scale],
          fullDomain,
        );

        if (nextDomain[0] !== domain[0] || nextDomain[1] !== domain[1]) {
          onDomainChange(nextDomain);
        }

        return;
      }

      if (fullSpan <= span) {
        return;
      }

      const shift = (pixelDelta / width) * span * scrollScale;
      const nextDomain = clampDomain([domain[0] + shift, domain[1] + shift], fullDomain);

      if (nextDomain[0] === domain[0] && nextDomain[1] === domain[1]) {
        return;
      }

      onDomainChange(nextDomain);
    },
    [disabled, domain, fullDomain, minSpan, onDomainChange, scrollScale, zoomScale],
  );
  const containerRef = useCallback((node: TElement | null) => {
    setElement(node);
  }, []);
  const onWheel = useCallback(
    (event: WheelEvent<TElement>) => {
      if (handledNativeWheelEventsRef.current.has(event.nativeEvent)) {
        return;
      }

      handleWheel(event, event.currentTarget);
    },
    [handleWheel],
  );

  useEffect(() => {
    if (!element) {
      return undefined;
    }

    const handledNativeWheelEvents = handledNativeWheelEventsRef.current;
    const handleNativeWheel: EventListener = (event) => {
      const wheelEvent = event as globalThis.WheelEvent;

      handledNativeWheelEvents.add(wheelEvent);
      handleWheel(wheelEvent, element);
    };

    element.addEventListener("wheel", handleNativeWheel, { passive: false });

    return () => element.removeEventListener("wheel", handleNativeWheel);
  }, [element, handleWheel]);

  return {
    containerRef,
    onWheel,
  };
}

export function useChartSeriesVisibility({
  defaultHiddenIds = [],
  hiddenIds,
  itemIds,
  minVisible = 1,
  onHiddenIdsChange,
}: UseChartSeriesVisibilityOptions): UseChartSeriesVisibilityResult {
  const [uncontrolledHiddenIds, setUncontrolledHiddenIds] = useState(() =>
    normalizeHiddenChartSeriesIds(defaultHiddenIds, itemIds, Math.max(0, minVisible)),
  );
  const resolvedHiddenIds = useMemo(
    () =>
      normalizeHiddenChartSeriesIds(
        hiddenIds ?? uncontrolledHiddenIds,
        itemIds,
        Math.max(0, minVisible),
      ),
    [hiddenIds, itemIds, minVisible, uncontrolledHiddenIds],
  );
  const visibleIds = useMemo(
    () => getVisibleChartSeriesIds(itemIds, resolvedHiddenIds),
    [itemIds, resolvedHiddenIds],
  );
  const setHiddenIds = useCallback(
    (nextHiddenIds: readonly string[]) => {
      const normalized = normalizeHiddenChartSeriesIds(
        nextHiddenIds,
        itemIds,
        Math.max(0, minVisible),
      );

      if (hiddenIds === undefined) {
        setUncontrolledHiddenIds(normalized);
      }

      onHiddenIdsChange?.(normalized);
    },
    [hiddenIds, itemIds, minVisible, onHiddenIdsChange],
  );
  const toggle = useCallback(
    (id: string) => {
      setHiddenIds(toggleChartSeriesId(id, resolvedHiddenIds, itemIds, Math.max(0, minVisible)));
    },
    [itemIds, minVisible, resolvedHiddenIds, setHiddenIds],
  );
  const showAll = useCallback(() => setHiddenIds([]), [setHiddenIds]);
  const isVisible = useCallback((id: string) => visibleIds.includes(id), [visibleIds]);

  return {
    hiddenIds: resolvedHiddenIds,
    isVisible,
    setHiddenIds,
    showAll,
    toggle,
    visibleIds,
  };
}
