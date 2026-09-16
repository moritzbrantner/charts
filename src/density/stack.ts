export type ChartStackOffset = "diverging" | "zero";

export type ChartStackTransformOptions<TDatum, TKey extends string = string> = {
  keys: readonly TKey[];
  offset?: ChartStackOffset;
  order?: readonly TKey[];
  value: (datum: TDatum, key: TKey, datumIndex: number) => number | null | undefined;
};

export type ChartStackPoint<TDatum> = {
  datum: TDatum;
  datumIndex: number;
  defined: boolean;
  end: number;
  start: number;
  value: number;
};

export type ChartStackSeries<TDatum, TKey extends string = string> = {
  index: number;
  key: TKey;
  points: Array<ChartStackPoint<TDatum>>;
};

export type ChartStackTransform<TDatum, TKey extends string = string> = {
  domain: [number, number];
  series: Array<ChartStackSeries<TDatum, TKey>>;
};

type ChartStackValue = {
  defined: boolean;
  value: number;
};

function getUniqueStackKeys<TKey extends string>(keys: readonly TKey[], label: string): TKey[] {
  const seen = new Set<TKey>();
  const normalized: TKey[] = [];

  for (const key of keys) {
    if (seen.has(key)) {
      throw new RangeError(`${label} must not contain duplicate keys`);
    }

    seen.add(key);
    normalized.push(key);
  }

  return normalized;
}

function resolveStackKeys<TKey extends string>(
  keys: readonly TKey[],
  order: readonly TKey[] | undefined,
): TKey[] {
  const normalizedKeys = getUniqueStackKeys(keys, "keys");

  if (!order) {
    return normalizedKeys;
  }

  const normalizedOrder = getUniqueStackKeys(order, "order");
  const keySet = new Set(normalizedKeys);

  if (
    normalizedOrder.length !== normalizedKeys.length ||
    normalizedOrder.some((key) => !keySet.has(key))
  ) {
    throw new RangeError("order must contain every stack key exactly once");
  }

  return normalizedOrder;
}

function readStackValue<TDatum, TKey extends string>(
  datum: TDatum,
  key: TKey,
  datumIndex: number,
  valueAccessor: ChartStackTransformOptions<TDatum, TKey>["value"],
): ChartStackValue {
  const value = valueAccessor(datum, key, datumIndex);

  if (value === null || value === undefined) {
    return { defined: false, value: 0 };
  }

  if (!Number.isFinite(value)) {
    throw new RangeError(
      `stack value for key ${JSON.stringify(key)} at datum ${datumIndex} must be finite`,
    );
  }

  return { defined: true, value };
}

export function createChartStackTransform<TDatum, TKey extends string = string>(
  data: readonly TDatum[],
  options: ChartStackTransformOptions<TDatum, TKey>,
): ChartStackTransform<TDatum, TKey> {
  const keys = resolveStackKeys(options.keys, options.order);
  const offset = options.offset ?? "diverging";

  if (offset !== "diverging" && offset !== "zero") {
    throw new RangeError('offset must be "diverging" or "zero"');
  }

  const series = keys.map(
    (key, index): ChartStackSeries<TDatum, TKey> => ({ index, key, points: [] }),
  );
  let domainMin = 0;
  let domainMax = 0;

  data.forEach((datum, datumIndex) => {
    let positive = 0;
    let negative = 0;
    let cumulative = 0;

    series.forEach((stackSeries) => {
      const stackValue = readStackValue(datum, stackSeries.key, datumIndex, options.value);
      let start: number;
      let end: number;

      if (offset === "zero") {
        start = cumulative;
        end = cumulative + stackValue.value;
        cumulative = end;
      } else if (stackValue.value < 0) {
        end = negative;
        start = negative + stackValue.value;
        negative = start;
      } else {
        start = positive;
        end = positive + stackValue.value;
        positive = end;
      }

      if (!Number.isFinite(start) || !Number.isFinite(end)) {
        throw new RangeError(
          `stack boundary for key ${JSON.stringify(stackSeries.key)} at datum ${datumIndex} must be finite`,
        );
      }

      domainMin = Math.min(domainMin, start, end);
      domainMax = Math.max(domainMax, start, end);
      stackSeries.points.push({
        datum,
        datumIndex,
        defined: stackValue.defined,
        end,
        start,
        value: stackValue.value,
      });
    });
  });

  return {
    domain: [domainMin, domainMax],
    series,
  };
}
