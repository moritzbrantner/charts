export type ChartDensityPreparationFacts = {
  binnedIndexBuilds: number;
  fallbackIndexBuilds: number;
  pointStoreBuilds: number;
  rangeAggregateStoreBuilds: number;
  wasmStateBuilds: number;
};

export type ChartDensityQueryFacts = {
  binnedSeries: number;
  bounds: number;
  chartPoints: number;
  chartSeries: number;
  groupedSeries: number;
  heatmaps: number;
  histograms: number;
  pointLookups: number;
  scatters: number;
};

export type ChartDensityMaterializationFacts = {
  bins: number;
  buckets: number;
  cells: number;
  groups: number;
  points: number;
  samples: number;
  scatterPoints: number;
  wasmCoordinateValues: number;
  wasmPreparedPoints: number;
};

export type ChartDensityCacheFacts = {
  hits: number;
  misses: number;
};

export type ChartDensityWorkFacts = {
  cache: ChartDensityCacheFacts;
  materialized: ChartDensityMaterializationFacts;
  preparation: ChartDensityPreparationFacts;
  queries: ChartDensityQueryFacts;
  sourcePointCount: number;
};

export type MutableChartDensityWorkFacts = ChartDensityWorkFacts;

const factsByIndex = new WeakMap<object, MutableChartDensityWorkFacts>();

export function createMutableChartDensityWorkFacts(
  sourcePointCount: number,
): MutableChartDensityWorkFacts {
  return {
    cache: {
      hits: 0,
      misses: 0,
    },
    materialized: {
      bins: 0,
      buckets: 0,
      cells: 0,
      groups: 0,
      points: 0,
      samples: 0,
      scatterPoints: 0,
      wasmCoordinateValues: 0,
      wasmPreparedPoints: 0,
    },
    preparation: {
      binnedIndexBuilds: 0,
      fallbackIndexBuilds: 0,
      pointStoreBuilds: 0,
      rangeAggregateStoreBuilds: 0,
      wasmStateBuilds: 0,
    },
    queries: {
      binnedSeries: 0,
      bounds: 0,
      chartPoints: 0,
      chartSeries: 0,
      groupedSeries: 0,
      heatmaps: 0,
      histograms: 0,
      pointLookups: 0,
      scatters: 0,
    },
    sourcePointCount,
  };
}

export function attachChartDensityWorkFacts<TIndex extends object>(
  index: TIndex,
  facts: MutableChartDensityWorkFacts,
): TIndex {
  factsByIndex.set(index, facts);
  return index;
}

export function getMutableChartDensityWorkFacts(
  index: object,
): MutableChartDensityWorkFacts | null {
  return factsByIndex.get(index) ?? null;
}

export function getChartDensityWorkFacts(index: object): ChartDensityWorkFacts | null {
  const facts = factsByIndex.get(index);

  if (!facts) {
    return null;
  }

  return {
    cache: { ...facts.cache },
    materialized: { ...facts.materialized },
    preparation: { ...facts.preparation },
    queries: { ...facts.queries },
    sourcePointCount: facts.sourcePointCount,
  };
}
