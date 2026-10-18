/** Amounts are in display currency units, bounded by known remaining capacity. */
export function investmentPresets(
  currency: string,
  remaining: number,
): number[] {
  if (!Number.isFinite(remaining) || remaining <= 0) return [];
  const unit = currency.toUpperCase() === "USDC" ? 1_000_000 : 100;
  const candidates =
    currency.toUpperCase() === "USDC"
      ? [1, 2, 5, 10, remaining]
      : [50000, 100000, 500000, 1000000, remaining];
  return [
    ...new Set(candidates.map((value) => Math.floor(value * unit) / unit)),
  ]
    .filter((value) => value > 0 && value <= remaining)
    .sort((a, b) => a - b)
    .slice(0, 4);
}
