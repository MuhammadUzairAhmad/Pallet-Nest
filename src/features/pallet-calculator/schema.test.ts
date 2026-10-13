import test from "node:test";
import assert from "node:assert/strict";
import { EXAMPLE, inputSchema, savedSchema, toFormValues } from "./schema.ts";
import { calculate, planOrder } from "../../lib/pallet-engine/calculate.ts";
test("blank optional form numbers stay empty and produce capacity input", () => {
  const form = toFormValues({
    ...EXAMPLE,
    quantity: undefined,
    maxLayers: undefined,
    gap: undefined,
    edgeClearance: undefined,
  });
  assert.equal(form.quantity, null);
  assert.equal(form.maxLayers, null);
  const input = inputSchema.parse(form);
  assert.equal(input.quantity, undefined);
  assert.equal(input.maxLayers, undefined);
  const p = calculate(input).patterns[0];
  assert.equal(planOrder(p, input)!.totalPallets, 1);
  assert.equal(toFormValues(input).quantity, null);
});
test("empty required measurements cannot produce a real plan", () => {
  for (const key of [
    "cartonLength",
    "cartonWidth",
    "cartonHeight",
    "cartonWeight",
    "maxHeight",
    "maxWeight",
  ] as const)
    assert.equal(
      inputSchema.safeParse({ ...toFormValues(EXAMPLE), [key]: NaN }).success,
      false,
    );
  assert.equal(
    inputSchema.safeParse({ ...toFormValues(EXAMPLE), quantity: 0 }).success,
    false,
  );
});
test("old saved projects load and preserve loading options", () => {
  const { gap, edgeClearance, maxLayers, packageKind, ...oldInput } = EXAMPLE;
  void gap;
  void edgeClearance;
  void maxLayers;
  void packageKind;
  const parsed = savedSchema.parse({
    schemaVersion: 1,
    engineVersion: "1.0.0",
    units: "metric",
    input: { ...oldInput, rotation: false, partial: true },
  });
  assert.equal(parsed.input.rotation, false);
  assert.equal(parsed.input.partial, true);
  assert.equal(parsed.input.gap, undefined);
  assert.equal(toFormValues(parsed.input).maxLayers, null);
  assert.deepEqual(parsed.details, { product: "", reference: "", notes: "" });
});
