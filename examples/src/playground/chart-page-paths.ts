import { getInitialSnapshot, getNextSnapshot } from "xstate";
import { getAdjacencyMap, getShortestPaths } from "xstate/graph";

import { linePageEventLabels, linePageMachine, linePageStates } from "./chart-page-machine";

import type { LinePageEvent, LinePageState } from "./chart-page-machine";

export type LinePagePath = {
  events: LinePageEvent[];
  name: string;
  states: LinePageState[];
};

const initialState = getInitialSnapshot(linePageMachine).value as LinePageState;

function getPathStates(events: readonly LinePageEvent[]): LinePageState[] {
  let snapshot = getInitialSnapshot(linePageMachine);
  const states: LinePageState[] = [snapshot.value as LinePageState];

  for (const event of events) {
    snapshot = getNextSnapshot(linePageMachine, snapshot, { type: event });
    states.push(snapshot.value as LinePageState);
  }

  return states;
}

function pathName(events: readonly LinePageEvent[], states: readonly LinePageState[]): string {
  return events.length === 0
    ? `initial ${initialState}`
    : `${initialState} → ${events.map((event) => linePageEventLabels[event]).join(" → ")} → ${states.at(-1)}`;
}

function createPath(events: LinePageEvent[]): LinePagePath {
  const states = getPathStates(events);

  return { events, name: pathName(events, states), states };
}

const graph = getAdjacencyMap(linePageMachine, {}) as unknown as Record<
  string,
  { transitions: Record<string, { event: { type: string }; state: { value: unknown } }> }
>;
const graphEdges = Object.entries(graph).flatMap(([serializedState, node]) => {
  const state = (JSON.parse(serializedState) as { value: LinePageState }).value;

  return Object.values(node.transitions).map(({ event, state: target }) => ({
    event: event.type as LinePageEvent,
    from: state,
    to: target.value as LinePageState,
  }));
});

/**
 * The default set reaches every state with shortest generated paths and adds
 * one blocked self-loop. Full traversal builds a path for every graph edge.
 * XState's path generators omit self loops, so those are appended explicitly.
 */
const shortestPaths = getShortestPaths(linePageMachine).map((path) =>
  createPath(path.steps.slice(1).map((step) => step.event.type as LinePageEvent)),
);

const loops = graphEdges
  .filter(({ from, to, event }) => from === to && event === "BLOCKED_CHART_CHANGE")
  .slice(0, 1)
  .map(({ event, from }) => {
    const route = shortestPaths.find((path) => path.states.at(-1) === from);

    return createPath([...(route?.events ?? []), event]);
  });

export const linePagePaths = [...shortestPaths, ...loops];

export const linePageAllEdgePaths = graphEdges.map(({ event, from }) => {
  const route = shortestPaths.find((path) => path.states.at(-1) === from);

  return createPath([...(route?.events ?? []), event]);
});

export function getLinePageCoverage(paths: readonly LinePagePath[]) {
  const coveredEdges = new Set<string>();
  const coveredStates = new Set<LinePageState>();

  for (const path of paths) {
    for (const state of path.states) coveredStates.add(state);
    path.events.forEach((event, index) => {
      coveredEdges.add(`${path.states[index]}|${event}`);
    });
  }

  const uncoveredStates = linePageStates.filter((state) => !coveredStates.has(state));
  const uncoveredEdges = graphEdges
    .filter(({ from, event }) => !coveredEdges.has(`${from}|${event}`))
    .map(({ from, event, to }) => `${from} --${linePageEventLabels[event]}--> ${to}`)
    .sort((left, right) => left.localeCompare(right));

  return { uncoveredEdges, uncoveredStates };
}
