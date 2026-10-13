import test from "node:test";
import assert from "node:assert/strict";
import {
  calculate,
  palletFor,
  type Input,
} from "../../lib/pallet-engine/calculate.ts";
import { sceneBoxes, DETAIL_LIMIT } from "./scene.ts";
const input: Input = {
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
  partial: true,
};
test("3D geometry matches actual full and centered partial layers", () => {
  const pattern = calculate(input).patterns[0],
    pallet = palletFor(25, pattern, input);
  const scene = sceneBoxes(input, pattern, pallet);
  assert.equal(scene.boxes.length, 26);
  assert.equal(scene.simplified, false);
  assert.equal(
    Math.max(...scene.boxes.map((b) => b.z + b.height)),
    pallet.height,
  );
  const top = sceneBoxes(input, pattern, pallet, 2);
  assert.equal(top.boxes.length, 2);
  assert.equal(top.boxes[1].x, pallet.top[0].x);
  assert.equal(top.boxes[1].y, pallet.top[0].y);
  assert.equal(top.boxes[1].z, 650);
});
test("large 3D scenes stay bounded and explicitly use an envelope", () => {
  const large = {
    ...input,
    cartonHeight: 1,
    cartonWeight: 0.001,
    maxHeight: 10000,
    maxWeight: 100000,
  };
  const pattern = calculate(large).patterns[0],
    pallet = palletFor(pattern.capacity, pattern, large);
  assert.ok(pallet.count > DETAIL_LIMIT);
  const scene = sceneBoxes(large, pattern, pallet);
  assert.equal(scene.simplified, true);
  assert.equal(scene.boxes.length, 2);
  assert.equal(scene.count, pallet.count);
  assert.equal(scene.boxes[1].height, pallet.height - large.palletHeight);
  assert.equal(sceneBoxes(large, pattern, pallet, 0).simplified, false);
});

test("3D detailed and simplified loads retain edge clearance and package gaps", () => {
  const spaced = { ...input, gap: 10, edgeClearance: 20 };
  const pattern = calculate(spaced).patterns[0],
    pallet = palletFor(pattern.capacity, pattern, spaced);
  const scene = sceneBoxes(spaced, pattern, pallet, 0);
  assert.deepEqual(
    scene.boxes.slice(1).map((b) => [b.x, b.y, b.length, b.width]),
    pattern.positions.map((p) => [p.x, p.y, p.length, p.width]),
  );
  const large = {
    ...spaced,
    cartonHeight: 1,
    cartonWeight: 0.001,
    maxHeight: 10000,
    maxWeight: 100000,
  };
  const p = calculate(large).patterns[0],
    load = palletFor(p.capacity, p, large),
    envelope = sceneBoxes(large, p, load);
  assert.equal(envelope.simplified, true);
  assert.equal(envelope.boxes[1].x, 20);
  assert.equal(envelope.boxes[1].y, 20);
  assert.ok(
    envelope.boxes[1].x + envelope.boxes[1].length <= large.palletLength - 20,
  );
  assert.ok(
    envelope.boxes[1].y + envelope.boxes[1].width <= large.palletWidth - 20,
  );
});
