import { useEffect, useRef, useState } from "react";

import { cancelFrame, clamp, interpolateNumber, now, requestFrame } from "./shared";

import type { ChartAnimationOptions } from "./types";

export function getRechartsAnimationProps(options: ChartAnimationOptions = {}): {
  animationDuration: number;
  animationEasing: string;
  isAnimationActive: boolean;
} {
  const {
    durationMs = 600,
    easing = "ease",
    enabled = false,
    mode = enabled ? "draw" : "none",
    respectReducedMotion = true,
  } = options;
  const reducedMotion =
    respectReducedMotion &&
    typeof matchMedia !== "undefined" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isAnimationActive = enabled && mode !== "none" && !reducedMotion;

  return {
    animationDuration: isAnimationActive ? durationMs : 0,
    animationEasing: easing,
    isAnimationActive,
  };
}

export function useChartAnimatedDomain({
  domain,
  durationMs = 600,
  enabled = false,
  respectReducedMotion = true,
}: {
  domain: [number, number];
  durationMs?: number;
  enabled?: boolean;
  respectReducedMotion?: boolean;
}): [number, number] {
  const [animatedDomain, setAnimatedDomain] = useState<[number, number]>(domain);
  const previousDomainRef = useRef(domain);
  const reducedMotion =
    respectReducedMotion &&
    typeof matchMedia !== "undefined" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  const active = enabled && !reducedMotion && durationMs > 0;

  useEffect(() => {
    if (!active) {
      previousDomainRef.current = domain;

      return undefined;
    }

    const startDomain = previousDomainRef.current;
    const startTime = now();
    let frameId: number | null = null;

    const tick: FrameRequestCallback = () => {
      const progress = clamp((now() - startTime) / durationMs, 0, 1);
      const nextDomain: [number, number] = [
        interpolateNumber(startDomain[0], domain[0], progress),
        interpolateNumber(startDomain[1], domain[1], progress),
      ];

      setAnimatedDomain(nextDomain);

      if (progress < 1) {
        frameId = requestFrame(tick);

        return;
      }

      previousDomainRef.current = domain;
    };

    frameId = requestFrame(tick);

    return () => {
      if (frameId !== null) {
        cancelFrame(frameId);
      }
    };
  }, [active, domain, durationMs]);

  return active ? animatedDomain : domain;
}

export function useChartPlaybackDomain({
  durationMs = 4000,
  enabled,
  fullDomain,
  onComplete,
  playing,
}: {
  durationMs?: number;
  enabled: boolean;
  fullDomain: [number, number];
  onComplete?: () => void;
  playing: boolean;
}): {
  domain: [number, number];
  pause: () => void;
  play: () => void;
  progress: number;
  reset: () => void;
} {
  const [internalPlaying, setInternalPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const onCompleteRef = useRef(onComplete);
  const progressRef = useRef(0);
  const resolvedProgress = enabled ? progress : 0;
  const resolvedPlaying = enabled && (playing || internalPlaying);
  const span = Math.max(Number.EPSILON, fullDomain[1] - fullDomain[0]);
  const minimumSpan = span / 100;
  const playbackSpan = minimumSpan + (span - minimumSpan) * resolvedProgress;
  const domain: [number, number] = [
    fullDomain[0],
    Math.min(fullDomain[1], fullDomain[0] + playbackSpan),
  ];

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    progressRef.current = resolvedProgress;
  }, [resolvedProgress]);

  useEffect(() => {
    if (!resolvedPlaying) {
      return undefined;
    }

    const startProgress = progressRef.current;
    const startTime = now();
    const remainingDuration = Math.max(1, durationMs * (1 - startProgress));
    let frameId: number | null = null;

    const tick: FrameRequestCallback = () => {
      const nextProgress = clamp(startProgress + (now() - startTime) / remainingDuration, 0, 1);

      setProgress(nextProgress);

      if (nextProgress < 1) {
        frameId = requestFrame(tick);

        return;
      }

      setInternalPlaying(false);
      onCompleteRef.current?.();
    };

    frameId = requestFrame(tick);

    return () => {
      if (frameId !== null) {
        cancelFrame(frameId);
      }
    };
  }, [durationMs, resolvedPlaying]);

  return {
    domain: enabled ? domain : fullDomain,
    pause: () => setInternalPlaying(false),
    play: () => setInternalPlaying(true),
    progress: enabled ? resolvedProgress : 1,
    reset: () => {
      setInternalPlaying(false);
      setProgress(0);
    },
  };
}
