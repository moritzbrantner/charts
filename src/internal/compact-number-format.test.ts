import { describe, expect, test } from "vitest";

import { createCompactNumberFormatter } from "./compact-number-format";

describe("createCompactNumberFormatter", () => {
  test.each([0, -0, 1.25, 9_999.96, 10_000, -10_000, 1_234_567, -98_765.4, NaN, Infinity])(
    "matches a freshly built Intl.NumberFormat for %s",
    (value) => {
      for (const maximumFractionDigits of [1, 2]) {
        const expected = new Intl.NumberFormat("en", {
          maximumFractionDigits,
          notation: Math.abs(value) >= 10_000 ? "compact" : "standard",
        }).format(value);

        expect(createCompactNumberFormatter(maximumFractionDigits)(value)).toBe(expected);
      }
    },
  );

  test("keeps notations separate when one formatter sees both ranges", () => {
    const format = createCompactNumberFormatter(1);

    expect([format(12), format(12_000), format(12)]).toEqual(["12", "12K", "12"]);
  });
});
