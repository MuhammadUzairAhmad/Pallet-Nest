import test from "node:test";
import assert from "node:assert/strict";
import {
  calculate,
  palletFor,
  planOrder,
  validateLayout,
  type Input,
} from "./calculate.ts";
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
  rotation: false,
  partial: false,
};
test("reference case includes pallet height and rounds down to full layers", () => {
  const p = calculate(base).patterns[0];
  assert.equal(p.perLayer, 12);
  assert.equal(p.capacity, 48);
  assert.equal(p.height, 1150);
  assert.equal(p.cargo, 480);
  assert.equal(p.gross, 505);
  assert.deepEqual(p.limiting, ["Weight"]);
});
test("partial top layer uses exactly 50 cartons within both constraints", () => {
  const i = { ...base, partial: true };
  const p = calculate(i).patterns[0];
  const pallet = palletFor(p.capacity, p, i);
  assert.equal(p.capacity, 50);
  assert.equal(pallet.fullLayers, 4);
  assert.equal(pallet.top.length, 2);
  assert.equal(pallet.height, 1400);
  assert.equal(pallet.gross, 525);
  assert.ok(validateLayout(pallet.top, i));
});
test("exact and oversized footprint, rotation permission", () => {
  const i = { ...base, palletLength: 400, palletWidth: 200, rotation: false };
  assert.equal(calculate(i).patterns[0].perLayer, 1);
  assert.equal(calculate({ ...i, cartonLength: 400.001 }).patterns.length, 0);
  const r = { ...i, cartonLength: 200, cartonWidth: 400 };
  assert.equal(calculate(r).patterns.length, 0);
  assert.equal(calculate({ ...r, rotation: true }).patterns[0].perLayer, 1);
});
test("mixed orientation beats both regular grids", () => {
  const i = {
    ...base,
    rotation: true,
    palletLength: 1000,
    palletWidth: 1000,
    cartonLength: 600,
    cartonWidth: 400,
    maxWeight: 100000,
    maxHeight: 400,
    cartonHeight: 250,
  };
  const p = calculate(i).patterns[0];
  assert.equal(p.perLayer, 3);
  assert.ok(p.name.startsWith("Mixed"));
  assert.ok(validateLayout(p.positions, i));
});
test("height, weight and tied constraints, no-fit loads", () => {
  assert.equal(calculate({ ...base, maxHeight: 399 }).patterns[0].capacity, 0);
  assert.equal(calculate({ ...base, maxWeight: 119 }).patterns[0].capacity, 0);
  assert.deepEqual(
    calculate({ ...base, maxWeight: 600 }).patterns[0].limiting,
    ["Height", "Weight"],
  );
  assert.equal(
    calculate({ ...base, partial: true, maxWeight: 9 }).patterns[0].capacity,
    0,
  );
});
test("rejects zero, negative, nonfinite and excessive complexity", () => {
  for (const value of [0, -1, NaN, Infinity])
    assert.ok(calculate({ ...base, cartonLength: value }).errors.length);
  assert.equal(calculate({ ...base, tare: 0 }).errors.length, 0);
  assert.ok(
    calculate({ ...base, cartonLength: 1, cartonWidth: 1 }).errors.length,
  );
  assert.ok(calculate({ ...base, quantity: 1.2 }).errors.length);
});
test("exact order totals below, at and above capacity; actual partial metrics", () => {
  for (const quantity of [1, 47, 48, 49, 96, 100, 1000000]) {
    const i = { ...base, quantity };
    const p = calculate(i).patterns[0];
    const o = planOrder(p, i)!;
    assert.equal(o.fullPallets * p.capacity + (o.last?.count ?? 0), quantity);
    if (o.last) {
      assert.ok(o.last.cargo <= i.maxWeight);
      assert.ok(o.last.height <= i.maxHeight);
      assert.ok(validateLayout(o.last.top, i));
      assert.equal(
        o.last.fullLayers * p.perLayer + o.last.top.length,
        o.last.count,
      );
    }
  }
  const o = planOrder(calculate(base).patterns[0], { ...base, quantity: 49 })!;
  assert.equal(o.last?.height, 400);
  assert.equal(o.last?.gross, 35);
});
test("placement validator rejects overlaps, boundaries and invalid orientation", () => {
  const p = calculate(base).patterns[0].positions;
  assert.equal(validateLayout([p[0], p[0]], base), false);
  assert.equal(validateLayout([{ ...p[0], x: -0.001 }], base), false);
  assert.equal(validateLayout([{ ...p[0], length: 401 }], base), false);
});
test("imperial conversion and normalization agree with metric reference", () => {
  const i = { ...base };
  for (const key of [
    "cartonLength",
    "cartonWidth",
    "cartonHeight",
    "palletLength",
    "palletWidth",
    "palletHeight",
    "maxHeight",
  ] as const)
    i[key] = (base[key] / 25.4) * 25.4;
  for (const key of ["cartonWeight", "tare", "maxWeight"] as const)
    i[key] = (base[key] / 0.45359237) * 0.45359237;
  const p = calculate(i).patterns[0];
  assert.equal(p.capacity, 48);
  assert.equal(p.perLayer, 12);
});
test("all alternatives valid and actual capacity metrics consistent", () => {
  for (let length = 600; length <= 1200; length += 100) {
    const i = { ...base, rotation: true, palletLength: length, partial: true };
    for (const p of calculate(i).patterns) {
      assert.ok(validateLayout(p.positions, i));
      const actual = palletFor(p.capacity, p, i);
      assert.equal(
        actual.fullLayers * p.perLayer + actual.top.length,
        p.capacity,
      );
      assert.equal(actual.layers, p.layers);
      assert.ok(actual.height <= i.maxHeight);
      assert.ok(actual.cargo <= i.maxWeight);
      assert.ok(validateLayout(actual.top, i));
    }
  }
});

test("filled bag layer limit constrains capacity and validates stacking input", () => {
  const input: Input = {
    ...base,
    packageKind: "bag",
    maxLayers: 2,
    quantity: 49,
  };
  const pattern = calculate(input).patterns[0];
  assert.equal(pattern.capacity, 24);
  assert.equal(pattern.height, 650);
  assert.deepEqual(pattern.limiting, ["Layer limit"]);
  const order = planOrder(pattern, input)!;
  assert.equal(order.totalPallets, 3);
  assert.equal(order.last!.count, 1);
  for (const maxLayers of [0, -1, 1.5, NaN, 10001])
    assert.ok(calculate({ ...input, maxLayers }).errors.length);
});

test("spacing charges gaps only between packages and reserves all four edges", () => {
  const input = {
    ...base,
    palletLength: 850,
    palletWidth: 450,
    gap: 10,
    edgeClearance: 20,
    maxWeight: 1000,
  };
  const pattern = calculate(input).patterns[0];
  assert.equal(pattern.perLayer, 4);
  assert.deepEqual(
    pattern.positions.map((p) => [p.x, p.y]),
    [
      [20, 20],
      [430, 20],
      [20, 230],
      [430, 230],
    ],
  );
  assert.equal(pattern.usedLength, 830);
  assert.equal(pattern.usedWidth, 430);
  assert.equal(pattern.utilization, ((4 * 400 * 200) / (850 * 450)) * 100);
  assert.ok(validateLayout(pattern.positions, input));
  assert.equal(
    calculate({ ...input, palletLength: 849.999 }).patterns[0].perLayer,
    2,
  );
  assert.equal(
    calculate({ ...input, palletWidth: 449.999 }).patterns[0].perLayer,
    2,
  );
  const pallet = palletFor(3, pattern, input);
  assert.ok(validateLayout(pallet.top, input));
  assert.equal(pallet.top[0].x, 20);
  assert.equal(pallet.top[0].y, 20);
});
test("mixed layouts and centered partial layers respect combined spacing limits", () => {
  for (const gap of [0, 0.001, 10, 75])
    for (const edgeClearance of [0, 0.001, 20, 100]) {
      const input = {
        ...base,
        rotation: true,
        partial: true,
        gap,
        edgeClearance,
      };
      for (const pattern of calculate(input).patterns) {
        assert.ok(validateLayout(pattern.positions, input));
        for (let count = 1; count < pattern.perLayer; count++)
          assert.ok(
            validateLayout(palletFor(count, pattern, input).top, input),
          );
        for (const [aIndex, a] of pattern.positions.entries())
          for (const b of pattern.positions.slice(aIndex + 1)) {
            const separation = Math.max(
              b.x - a.x - a.length,
              a.x - b.x - b.length,
              b.y - a.y - a.width,
              a.y - b.y - b.width,
            );
            assert.ok(separation >= gap - 0.000001);
          }
      }
    }
  const zero = { ...base, gap: 0, edgeClearance: 0 };
  assert.deepEqual(calculate(base), calculate(zero));
});
test("invalid spacing and empty usable footprints are rejected", () => {
  for (const key of ["gap", "edgeClearance"] as const)
    for (const value of [-1, NaN, Infinity, 10001])
      assert.ok(calculate({ ...base, [key]: value }).errors.length);
  assert.ok(
    calculate({ ...base, edgeClearance: 400 }).errors.some((e) =>
      e.startsWith("edgeClearance:"),
    ),
  );
  assert.equal(calculate({ ...base, edgeClearance: 301 }).patterns.length, 0);
  assert.equal(calculate({ ...base, cartonLength: 0.5 }).patterns.length, 0);
  const input = { ...base, gap: 10, edgeClearance: 20 };
  assert.equal(
    validateLayout(
      [{ x: 0, y: 20, length: 400, width: 200, rotated: false }],
      input,
    ),
    false,
  );
  assert.equal(
    validateLayout(
      [
        { x: 20, y: 20, length: 400, width: 200, rotated: false },
        { x: 429.999, y: 20, length: 400, width: 200, rotated: false },
      ],
      input,
    ),
    false,
  );
});
test("final pallet remaining capacity is consistent with constrained order totals", () => {
  const input = { ...base, gap: 10, edgeClearance: 20, quantity: 101 };
  const pattern = calculate(input).patterns[0],
    order = planOrder(pattern, input)!;
  assert.equal(order.fullPallets * pattern.capacity + order.last!.count, 101);
  assert.equal(order.remainingCapacity, pattern.capacity - order.last!.count);
  assert.equal(
    planOrder(pattern, { ...input, quantity: pattern.capacity * 2 })!
      .remainingCapacity,
    0,
  );
});
