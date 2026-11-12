import { createMachine } from "xstate";

/**
 * Expected visible state for the line Charts Page. Dataset, viewport, and a
 * single legend series are deliberately finite so graph traversal stays small.
 */
export const linePageMachine = createMachine({
  id: "line-page",
  initial: "telemetry-week-visible",
  states: {
    "telemetry-week-visible": {
      on: {
        SELECT_SPARSE: "sparse-week-visible",
        SELECT_MONTH: "telemetry-month-visible",
        HIDE_SERIES: "telemetry-week-hidden",
        BLOCKED_CHART_CHANGE: {},
      },
    },
    "sparse-week-visible": {
      on: {
        SELECT_TELEMETRY: "telemetry-week-visible",
        SELECT_MONTH: "sparse-month-visible",
        HIDE_SERIES: "sparse-week-hidden",
        BLOCKED_CHART_CHANGE: {},
      },
    },
    "telemetry-month-visible": {
      on: {
        SELECT_SPARSE: "sparse-week-visible",
        SELECT_WEEK: "telemetry-week-visible",
        HIDE_SERIES: "telemetry-month-hidden",
        BLOCKED_CHART_CHANGE: {},
      },
    },
    "sparse-month-visible": {
      on: {
        SELECT_TELEMETRY: "telemetry-week-visible",
        SELECT_WEEK: "sparse-week-visible",
        HIDE_SERIES: "sparse-month-hidden",
        BLOCKED_CHART_CHANGE: {},
      },
    },
    "telemetry-week-hidden": {
      on: {
        SELECT_SPARSE: "sparse-week-hidden",
        SELECT_MONTH: "telemetry-month-hidden",
        SHOW_SERIES: "telemetry-week-visible",
        BLOCKED_CHART_CHANGE: {},
      },
    },
    "sparse-week-hidden": {
      on: {
        SELECT_TELEMETRY: "telemetry-week-hidden",
        SELECT_MONTH: "sparse-month-hidden",
        SHOW_SERIES: "sparse-week-visible",
        BLOCKED_CHART_CHANGE: {},
      },
    },
    "telemetry-month-hidden": {
      on: {
        SELECT_SPARSE: "sparse-week-hidden",
        SELECT_WEEK: "telemetry-week-hidden",
        SHOW_SERIES: "telemetry-month-visible",
        BLOCKED_CHART_CHANGE: {},
      },
    },
    "sparse-month-hidden": {
      on: {
        SELECT_TELEMETRY: "telemetry-week-hidden",
        SELECT_WEEK: "sparse-week-hidden",
        SHOW_SERIES: "sparse-month-visible",
        BLOCKED_CHART_CHANGE: {},
      },
    },
  },
});

export type LinePageState =
  | "telemetry-week-visible"
  | "sparse-week-visible"
  | "telemetry-month-visible"
  | "sparse-month-visible"
  | "telemetry-week-hidden"
  | "sparse-week-hidden"
  | "telemetry-month-hidden"
  | "sparse-month-hidden";

export type LinePageEvent =
  | "SELECT_SPARSE"
  | "SELECT_TELEMETRY"
  | "SELECT_MONTH"
  | "SELECT_WEEK"
  | "HIDE_SERIES"
  | "SHOW_SERIES"
  | "BLOCKED_CHART_CHANGE";

export const linePageStates: readonly LinePageState[] = [
  "telemetry-week-visible",
  "sparse-week-visible",
  "telemetry-month-visible",
  "sparse-month-visible",
  "telemetry-week-hidden",
  "sparse-week-hidden",
  "telemetry-month-hidden",
  "sparse-month-hidden",
];

export const linePageEventLabels: Record<LinePageEvent, string> = {
  BLOCKED_CHART_CHANGE: "select a chart type on a fixed Chart Page (blocked)",
  HIDE_SERIES: "hide Value series",
  SELECT_MONTH: "select 30 days",
  SELECT_SPARSE: "select Sparse dataset",
  SELECT_TELEMETRY: "select Telemetry dataset",
  SELECT_WEEK: "select 7 days",
  SHOW_SERIES: "show Value series",
};
