import type {
  Input,
  Pallet,
  Pattern,
} from "../../lib/pallet-engine/calculate.ts";
export type Box = {
  x: number;
  y: number;
  z: number;
  length: number;
  width: number;
  height: number;
  base?: boolean;
};
export const DETAIL_LIMIT = 400;
export function sceneBoxes(
  input: Input,
  pattern: Pattern,
  pallet: Pallet,
  layer?: number,
) {
  const boxes: Box[] = [
    {
      x: 0,
      y: 0,
      z: 0,
      length: input.palletLength,
      width: input.palletWidth,
      height: input.palletHeight,
      base: true,
    },
  ];
  const count =
    layer === undefined
      ? pallet.count
      : layer < pallet.fullLayers
        ? pattern.perLayer
        : pallet.top.length;
  const simplified = count > DETAIL_LIMIT;
  if (simplified) {
    // Use a clearly labelled envelope instead of creating unbounded SVG elements.
    const positions =
      layer === undefined
        ? [...(pallet.fullLayers ? pattern.positions : []), ...pallet.top]
        : layer < pallet.fullLayers
          ? pattern.positions
          : pallet.top;
    const x = Math.min(...positions.map((p) => p.x)),
      y = Math.min(...positions.map((p) => p.y));
    boxes.push({
      x,
      y,
      z: input.palletHeight + (layer ?? 0) * input.cartonHeight,
      length: Math.max(...positions.map((p) => p.x + p.length)) - x,
      width: Math.max(...positions.map((p) => p.y + p.width)) - y,
      height:
        layer === undefined
          ? pallet.height - input.palletHeight
          : input.cartonHeight,
    });
  } else {
    const start = layer ?? 0,
      end = layer === undefined ? pallet.layers : layer + 1;
    for (let level = start; level < end; level++) {
      const positions =
        level < pallet.fullLayers ? pattern.positions : pallet.top;
      for (const p of positions)
        boxes.push({
          x: p.x,
          y: p.y,
          z: input.palletHeight + level * input.cartonHeight,
          length: p.length,
          width: p.width,
          height: input.cartonHeight,
        });
    }
  }
  return { boxes, simplified, count };
}
