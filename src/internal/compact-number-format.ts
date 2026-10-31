/**
 * Number formatter for chart labels: compact notation from 10,000 up, standard below.
 * Each Intl.NumberFormat is built once on first use because construction costs far more
 * than format(), and label formatters run per mark.
 */
export function createCompactNumberFormatter(maximumFractionDigits: number) {
  let standard: Intl.NumberFormat | undefined;
  let compact: Intl.NumberFormat | undefined;

  return (value: number) => {
    if (Math.abs(value) >= 10_000) {
      compact ??= new Intl.NumberFormat("en", { maximumFractionDigits, notation: "compact" });

      return compact.format(value);
    }

    standard ??= new Intl.NumberFormat("en", { maximumFractionDigits, notation: "standard" });

    return standard.format(value);
  };
}
