export const ENGINE_VERSION = "1.2.0";
export type Input = {
  packageKind?: "carton" | "bag";
  maxLayers?: number;
  gap?: number;
  edgeClearance?: number;
  cartonLength: number;
  cartonWidth: number;
  cartonHeight: number;
  cartonWeight: number;
  palletLength: number;
  palletWidth: number;
  palletHeight: number;
  tare: number;
  maxHeight: number;
  maxWeight: number;
  rotation: boolean;
  partial: boolean;
  quantity?: number;
};
export type Placement = {
  x: number;
  y: number;
  length: number;
  width: number;
  rotated: boolean;
};
export type Pattern = {
  id: string;
  name: string;
  positions: Placement[];
  perLayer: number;
  capacity: number;
  layers: number;
  cargo: number;
  gross: number;
  height: number;
  utilization: number;
  limiting: string[];
  usedLength: number;
  usedWidth: number;
};
export type Pallet = {
  count: number;
  fullLayers: number;
  top: Placement[];
  layers: number;
  cargo: number;
  gross: number;
  height: number;
};
const precision = 1000;
const fixed = (n: number) => Math.round(n * precision);
export function normalizeInput(input: Input): Input {
  const next = { ...input };
  for (const key of [
    "cartonLength",
    "cartonWidth",
    "cartonHeight",
    "cartonWeight",
    "palletLength",
    "palletWidth",
    "palletHeight",
    "tare",
    "maxHeight",
    "maxWeight",
  ] as const)
    next[key] = fixed(next[key]) / precision;
  next.gap = fixed(input.gap ?? 0) / precision;
  next.edgeClearance = fixed(input.edgeClearance ?? 0) / precision;
  return next;
}
export function inputErrors(i: Input): string[] {
  const errors: string[] = [];
  for (const key of [
    "cartonLength",
    "cartonWidth",
    "cartonHeight",
    "palletLength",
    "palletWidth",
    "palletHeight",
    "maxHeight",
  ] as const) {
    if (!Number.isFinite(i[key]) || i[key] < 1 || i[key] > 10000)
      errors.push(`${key}: enter a dimension between 1 and 10,000 mm.`);
  }
  for (const key of ["cartonWeight", "maxWeight", "tare"] as const) {
    if (
      !Number.isFinite(i[key]) ||
      i[key] < (key === "tare" ? 0 : 0.001) ||
      i[key] > 100000
    )
      errors.push(`${key}: enter a valid weight (up to 100,000 kg).`);
  }
  for (const key of ["gap", "edgeClearance"] as const) {
    const value = i[key] ?? 0;
    if (!Number.isFinite(value) || value < 0 || value > 10000)
      errors.push(`${key}: enter a distance between 0 and 10,000 mm.`);
  }
  if (
    Number.isFinite(i.edgeClearance ?? 0) &&
    2 * fixed(i.edgeClearance ?? 0) >=
      Math.min(fixed(i.palletLength), fixed(i.palletWidth))
  )
    errors.push("edgeClearance: leave a positive usable pallet footprint.");
  if (i.packageKind !== undefined && !["carton", "bag"].includes(i.packageKind))
    errors.push("packageKind: choose cartons or bags.");
  if (
    i.maxLayers !== undefined &&
    (!Number.isSafeInteger(i.maxLayers) ||
      i.maxLayers < 1 ||
      i.maxLayers > 10000)
  )
    errors.push("maxLayers: enter a whole number from 1 to 10,000.");
  if (typeof i.rotation !== "boolean" || typeof i.partial !== "boolean")
    errors.push("Invalid loading options.");
  if (
    i.quantity !== undefined &&
    (!Number.isSafeInteger(i.quantity) ||
      i.quantity < 1 ||
      i.quantity > 1000000)
  )
    errors.push("Order quantity must be a whole number from 1 to 1,000,000.");
  if (
    !errors.length &&
    Math.floor(
      (fixed(i.palletLength) -
        2 * fixed(i.edgeClearance ?? 0) +
        fixed(i.gap ?? 0)) /
        (Math.min(fixed(i.cartonLength), fixed(i.cartonWidth)) +
          fixed(i.gap ?? 0)),
    ) *
      Math.floor(
        (fixed(i.palletWidth) -
          2 * fixed(i.edgeClearance ?? 0) +
          fixed(i.gap ?? 0)) /
          (Math.min(fixed(i.cartonLength), fixed(i.cartonWidth)) +
            fixed(i.gap ?? 0)),
      ) >
      2000
  )
    errors.push(
      "This load is too detailed. Use sizes that produce at most 2,000 potential packages per layer.",
    );
  return errors;
}
export function validateLayout(positions: Placement[], i: Input): boolean {
  const L = fixed(i.palletLength),
    W = fixed(i.palletWidth),
    edge = fixed(i.edgeClearance ?? 0),
    gap = fixed(i.gap ?? 0);
  return positions.every((p, index) => {
    const x = fixed(p.x),
      y = fixed(p.y),
      l = fixed(p.length),
      w = fixed(p.width);
    if (
      ![x, y, l, w].every(Number.isFinite) ||
      l <= 0 ||
      w <= 0 ||
      x < edge ||
      y < edge ||
      x + l > L - edge ||
      y + w > W - edge
    )
      return false;
    if (
      l !== fixed(p.rotated ? i.cartonWidth : i.cartonLength) ||
      w !== fixed(p.rotated ? i.cartonLength : i.cartonWidth) ||
      (p.rotated && !i.rotation)
    )
      return false;
    return !positions
      .slice(0, index)
      .some(
        (q) =>
          x < fixed(q.x) + fixed(q.length) + gap &&
          x + l + gap > fixed(q.x) &&
          y < fixed(q.y) + fixed(q.width) + gap &&
          y + w + gap > fixed(q.y),
      );
  });
}
export function calculate(i: Input): {
  patterns: Pattern[];
  errors: string[];
  budgetLimited: boolean;
  version: string;
} {
  const errors = inputErrors(i);
  if (errors.length)
    return {
      patterns: [],
      errors,
      budgetLimited: false,
      version: ENGINE_VERSION,
    };
  i = normalizeInput(i);
  // Virtual footprint includes one trailing gap so no gap is charged at the outer edge.
  const edge = fixed(i.edgeClearance ?? 0),
    gap = fixed(i.gap ?? 0);
  const L = fixed(i.palletLength) - 2 * edge + gap,
    W = fixed(i.palletWidth) - 2 * edge + gap,
    a = fixed(i.cartonLength),
    b = fixed(i.cartonWidth);
  const candidates: { name: string; positions: Placement[] }[] = [];
  function grid(x: number, y: number, l: number, w: number, rotated: boolean) {
    const cl = rotated ? b : a,
      cw = rotated ? a : b;
    const positions: Placement[] = [];
    for (let row = 0; row < Math.floor(w / (cw + gap)); row++)
      for (let col = 0; col < Math.floor(l / (cl + gap)); col++)
        positions.push({
          x: (edge + x + col * (cl + gap)) / precision,
          y: (edge + y + row * (cw + gap)) / precision,
          length: cl / precision,
          width: cw / precision,
          rotated,
        });
    return positions;
  }
  candidates.push({
    name: "Straight grid",
    positions: grid(0, 0, L, W, false),
  });
  if (i.rotation)
    candidates.push({
      name: "Rotated grid",
      positions: grid(0, 0, L, W, true),
    });
  let budgetLimited = false;
  if (i.rotation && a !== b) {
    for (const axis of ["x", "y"]) {
      const extent = axis === "x" ? L : W;
      const cuts = new Set<number>();
      for (const size of [a + gap, b + gap]) {
        const n = Math.floor(extent / size);
        if (n > 80) budgetLimited = true;
        for (let k = 1; k <= Math.min(n, 80); k++) {
          cuts.add(k * size);
          cuts.add(extent - k * size);
        }
      }
      for (const cut of cuts) {
        if (cut <= 0 || cut >= extent) continue;
        for (const r of [false, true]) {
          const positions =
            axis === "x"
              ? [...grid(0, 0, cut, W, r), ...grid(cut, 0, L - cut, W, !r)]
              : [...grid(0, 0, L, cut, r), ...grid(0, cut, L, W - cut, !r)];
          candidates.push({
            name: axis === "x" ? "Mixed columns" : "Mixed rows",
            positions,
          });
        }
      }
    }
  }
  const geometricLayers = Math.max(
    0,
    Math.floor(
      (fixed(i.maxHeight) - fixed(i.palletHeight)) / fixed(i.cartonHeight),
    ),
  );
  const heightLayers = Math.min(geometricLayers, i.maxLayers ?? Infinity);
  const heightLimit =
    i.maxLayers !== undefined && i.maxLayers <= geometricLayers
      ? "Layer limit"
      : "Height";
  const weightCartons = Math.floor(fixed(i.maxWeight) / fixed(i.cartonWeight));
  const seen = new Set<string>();
  const ranked = candidates
    .filter((c) => c.positions.length)
    .map((c) => {
      const perLayer = c.positions.length;
      const weightLayers = Math.floor(weightCartons / perLayer);
      const capacity = i.partial
        ? Math.min(heightLayers * perLayer, weightCartons)
        : Math.min(heightLayers, weightLayers) * perLayer;
      const layers = Math.ceil(capacity / perLayer);
      const cargo = (capacity * fixed(i.cartonWeight)) / precision;
      const limiting =
        heightLayers === 0
          ? [heightLimit]
          : weightCartons === 0
            ? ["Weight"]
            : i.partial
              ? [
                  ...(heightLayers * perLayer <= weightCartons
                    ? [heightLimit]
                    : []),
                  ...(weightCartons <= heightLayers * perLayer
                    ? ["Weight"]
                    : []),
                ]
              : [
                  ...(heightLayers <= weightLayers ? [heightLimit] : []),
                  ...(weightLayers <= heightLayers ? ["Weight"] : []),
                ];
      return {
        id: "",
        name: c.name,
        positions: c.positions,
        perLayer,
        capacity,
        layers,
        cargo,
        gross: cargo + i.tare,
        height: i.palletHeight + layers * i.cartonHeight,
        utilization:
          ((perLayer * a * b) /
            (fixed(i.palletLength) * fixed(i.palletWidth))) *
          100,
        limiting,
        usedLength: Math.max(...c.positions.map((p) => p.x + p.length)),
        usedWidth: Math.max(...c.positions.map((p) => p.y + p.width)),
      };
    })
    .sort(
      (a, b) =>
        b.capacity - a.capacity ||
        b.perLayer - a.perLayer ||
        Number(a.name.startsWith("Mixed")) -
          Number(b.name.startsWith("Mixed")) ||
        a.positions.filter((p) => p.rotated).length -
          b.positions.filter((p) => p.rotated).length,
    );
  const patterns: Pattern[] = [];
  for (const candidate of ranked) {
    const key = JSON.stringify(
      candidate.positions
        .map((p) => [p.x, p.y, p.length, p.width])
        .sort((a, b) => a[0] - b[0] || a[1] - b[1]),
    );
    if (
      seen.has(key) ||
      patterns.some(
        (p) => p.name === candidate.name && p.perLayer === candidate.perLayer,
      )
    )
      continue;
    seen.add(key);
    if (!validateLayout(candidate.positions, i)) continue;
    candidate.id = `pattern-${patterns.length}`;
    patterns.push(candidate);
    if (patterns.length === 3) break;
  }
  return {
    patterns,
    errors: patterns.length
      ? []
      : [
          "Footprint: the package does not fit within the pallet edge clearance in any permitted orientation.",
        ],
    budgetLimited,
    version: ENGINE_VERSION,
  };
}
export function palletFor(count: number, p: Pattern, i: Input): Pallet {
  i = normalizeInput(i);
  if (!Number.isSafeInteger(count) || count < 0 || count > p.capacity)
    throw new Error("Invalid pallet count");
  const fullLayers = Math.floor(count / p.perLayer),
    remainder = count % p.perLayer;
  // Center the bounding box of a subset of the validated pattern. Translation preserves non-overlap.
  const subset = p.positions.slice(0, remainder);
  const left = subset.length ? Math.min(...subset.map((p) => p.x)) : 0;
  const top = subset.length ? Math.min(...subset.map((p) => p.y)) : 0;
  const right = subset.length
    ? Math.max(...subset.map((p) => p.x + p.length))
    : 0;
  const bottom = subset.length
    ? Math.max(...subset.map((p) => p.y + p.width))
    : 0;
  const positions = subset.map((p) => ({
    ...p,
    x:
      Math.floor(
        ((i.palletLength - (right - left)) / 2 + p.x - left) * precision,
      ) / precision,
    y:
      Math.floor(
        ((i.palletWidth - (bottom - top)) / 2 + p.y - top) * precision,
      ) / precision,
  }));
  const layers = fullLayers + Number(remainder > 0),
    cargo = (count * fixed(i.cartonWeight)) / precision;
  return {
    count,
    fullLayers,
    top: positions,
    layers,
    cargo,
    gross: cargo + i.tare,
    height: i.palletHeight + layers * i.cartonHeight,
  };
}
export function planOrder(p: Pattern, i: Input) {
  if (!p.capacity) return null;
  const quantity = i.quantity ?? p.capacity;
  const fullPallets = Math.floor(quantity / p.capacity),
    remainder = quantity % p.capacity;
  const last = remainder ? palletFor(remainder, p, i) : null;
  return {
    quantity,
    fullPallets,
    last,
    totalPallets: fullPallets + Number(remainder > 0),
    remainingCapacity: remainder ? p.capacity - remainder : 0,
    full: palletFor(p.capacity, p, i),
  };
}
