import test from "node:test";
import assert from "node:assert/strict";
import { inputRange } from "./input-range.ts";
import { inputErrors, type Input } from "../../lib/pallet-engine/calculate.ts";
const base: Input = {
  cartonLength: 400,
  cartonWidth: 200,
  cartonHeight: 250,
  cartonWeight: 10,
  palletLength: 1200,
  palletWidth: 800,
  palletHeight: 150,
  tare: 25,
  maxHeight: 1400,
  maxWeight: 500,
  rotation: true,
  partial: false,
};
test("dimension hints and input bounds stay inside actual physical limits in both units", () => {
  for (const units of ["metric", "imperial"] as const)
    for (const key of [
      "cartonLength",
      "cartonWidth",
      "cartonHeight",
      "palletLength",
      "palletWidth",
      "palletHeight",
      "maxHeight",
    ] as const) {
      const range = inputRange(key, units);
      for (const value of [range.min, range.max]) {
        const errors = inputErrors({ ...base, [key]: value * range.factor });
        assert.equal(
          errors.some((e) => e.startsWith(`${key}:`)),
          false,
          `${key} ${units} ${value}`,
        );
      }
      assert.equal(range.unit, units === "metric" ? "mm" : "in");
    }
});
test("zero values and whole-number limits match their fields", () => {
  for (const key of ["gap", "edgeClearance", "tare"] as const)
    assert.equal(inputRange(key, "metric").min, 0);
  assert.equal(inputRange("quantity", "imperial").max, 1000000);
  assert.equal(inputRange("maxLayers", "imperial").max, 10000);
  for (const units of ["metric", "imperial"] as const)
    for (const key of ["cartonWeight", "tare", "maxWeight"] as const) {
      const r = inputRange(key, units);
      for (const value of [r.min, r.max])
        assert.equal(
          inputErrors({ ...base, [key]: value * r.factor }).some((e) =>
            e.startsWith(`${key}:`),
          ),
          false,
        );
    }
});
test("edge clearance maximum leaves usable room on all four sides", () => {
  for (const units of ["metric", "imperial"] as const) {
    const r = inputRange("edgeClearance", units, { length: 1200, width: 800 });
    assert.equal(
      inputErrors({ ...base, edgeClearance: r.max * r.factor }).length,
      0,
    );
    assert.ok(r.max * r.factor < 400);
  }
  assert.equal(
    inputRange("edgeClearance", "metric", { length: 1200, width: 800 }).max,
    399.999,
  );
  assert.equal(
    inputRange("edgeClearance", "metric", { length: 500, width: 300 }).max,
    149.999,
  );
});
