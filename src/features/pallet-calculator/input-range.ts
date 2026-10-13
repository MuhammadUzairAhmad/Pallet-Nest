import type { Input } from "../../lib/pallet-engine/calculate.ts";
export type NumericKey = Exclude<
  keyof Input,
  "rotation" | "partial" | "packageKind"
>;
export function inputRange(
  name: NumericKey,
  units: "metric" | "imperial",
  pallet?: { length?: number | null; width?: number | null },
) {
  const integer = name === "quantity" || name === "maxLayers";
  const weight =
    name === "cartonWeight" || name === "tare" || name === "maxWeight";
  const factor = integer || units === "metric" ? 1 : weight ? 0.45359237 : 25.4;
  const unit = integer
    ? name === "quantity"
      ? "items"
      : "layers"
    : weight
      ? units === "metric"
        ? "kg"
        : "lb"
      : units === "metric"
        ? "mm"
        : "in";
  const minimum =
    name === "tare" || name === "gap" || name === "edgeClearance"
      ? 0
      : weight
        ? 0.001
        : 1;
  let maximum = name === "quantity" ? 1000000 : weight ? 100000 : 10000;
  if (
    name === "edgeClearance" &&
    Number.isFinite(pallet?.length) &&
    Number.isFinite(pallet?.width) &&
    pallet!.length! >= 1 &&
    pallet!.width! >= 1
  ) {
    // Leave at least one internal precision unit of usable footprint; equality is invalid.
    maximum = Math.min(
      maximum,
      Math.floor(
        (Math.min(
          Math.round(pallet!.length! * 1000),
          Math.round(pallet!.width! * 1000),
        ) -
          1) /
          2,
      ) / 1000,
    );
  }
  // Round inward so a value copied from the hint passes physical-unit validation.
  const min = Math.ceil((minimum / factor) * 1e6) / 1e6;
  const max = Math.floor((maximum / factor) * 1e6) / 1e6;
  const format = (n: number) =>
    n.toLocaleString("en-US", { maximumFractionDigits: 6 });
  return {
    min,
    max,
    factor,
    unit,
    integer,
    minText: format(min),
    maxText: format(max),
  };
}
