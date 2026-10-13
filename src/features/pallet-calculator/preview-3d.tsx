"use client";
import { useMemo, useRef, useState } from "react";
import type { Input, Pallet, Pattern } from "@/lib/pallet-engine/calculate";
import { sceneBoxes } from "./scene";
type Point = [number, number, number];
const faces = [
  [0, 3, 2, 1],
  [4, 5, 6, 7],
  [0, 1, 5, 4],
  [1, 2, 6, 5],
  [2, 3, 7, 6],
  [3, 0, 4, 7],
];
export default function Preview3D({
  input,
  pattern,
  pallet,
  label,
}: {
  input: Input;
  pattern: Pattern;
  pallet: Pallet;
  label: string;
}) {
  const [angle, setAngle] = useState({ yaw: 0.65, pitch: 0.55, zoom: 1 });
  const [layer, setLayer] = useState<number | undefined>();
  const pointer = useRef<{ id: number; x: number; y: number } | null>(null);
  const scene = useMemo(
    () => sceneBoxes(input, pattern, pallet, layer),
    [input, pattern, pallet, layer],
  );
  const polygons = useMemo(() => {
    const { yaw, pitch, zoom } = angle;
    const scale =
      (300 / Math.hypot(input.palletLength, input.palletWidth, pallet.height)) *
      zoom;
    function project([x, y, z]: Point) {
      x -= input.palletLength / 2;
      y -= input.palletWidth / 2;
      z -= pallet.height / 2;
      const horizontal = x * Math.cos(yaw) - y * Math.sin(yaw),
        depth = x * Math.sin(yaw) + y * Math.cos(yaw);
      return [
        320 + horizontal * scale,
        210 + (depth * Math.sin(pitch) - z * Math.cos(pitch)) * scale,
        depth * Math.cos(pitch) + z * Math.sin(pitch),
      ];
    }
    return scene.boxes
      .flatMap((b, index) => {
        const points: Point[] = [
          [b.x, b.y, b.z],
          [b.x + b.length, b.y, b.z],
          [b.x + b.length, b.y + b.width, b.z],
          [b.x, b.y + b.width, b.z],
          [b.x, b.y, b.z + b.height],
          [b.x + b.length, b.y, b.z + b.height],
          [b.x + b.length, b.y + b.width, b.z + b.height],
          [b.x, b.y + b.width, b.z + b.height],
        ];
        const projected = points.map(project);
        return faces.flatMap((face, f) => {
          const v = face.map((i) => projected[i]);
          // Cull faces turned away from the viewer; draw remaining faces from back to front.
          const winding =
            (v[1][0] - v[0][0]) * (v[2][1] - v[0][1]) -
            (v[1][1] - v[0][1]) * (v[2][0] - v[0][0]);
          if (winding <= 0) return [];
          return [
            {
              key: `${index}-${f}`,
              points: v.map((p) => `${p[0]},${p[1]}`).join(" "),
              depth: v.reduce((s, p) => s + p[2], 0) / 4,
              fill: b.base
                ? ["#c9ae83", "#eadcc3", "#b6986a"][f % 3]
                : ["#b8d5c7", "#e0eee6", "#92bba8"][f % 3],
            },
          ];
        });
      })
      .sort((a, b) => a.depth - b.depth);
  }, [angle, input, pallet.height, scene]);
  const rotate = (yaw: number, pitch = 0) =>
    setAngle((a) => ({
      ...a,
      yaw: a.yaw + yaw,
      pitch: Math.max(0.12, Math.min(1.35, a.pitch + pitch)),
    }));
  return (
    <div className="scene-view">
      <p className="scene-caption">
        <strong>{label}</strong> · {pallet.count.toLocaleString("en-US")}{" "}
        {input.packageKind === "bag"
          ? pallet.count === 1
            ? "bag"
            : "bags"
          : pallet.count === 1
            ? "box"
            : "boxes"}{" "}
        · {pallet.layers} {pallet.layers === 1 ? "layer" : "layers"}
      </p>
      <svg
        className="scene-canvas"
        viewBox="0 0 640 420"
        role="img"
        aria-label={`${label}, 3D view. ${pallet.count} ${pallet.count === 1 ? "package" : "packages"}. Use the buttons below to turn the view or zoom.`}
        onPointerDown={(e) => {
          if (e.pointerType === "mouse" && e.button !== 0) return;
          pointer.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const p = pointer.current;
          if (!p || p.id !== e.pointerId) return;
          rotate((e.clientX - p.x) * 0.008, (e.clientY - p.y) * 0.008);
          pointer.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
        }}
        onPointerUp={() => {
          pointer.current = null;
        }}
        onPointerCancel={() => {
          pointer.current = null;
        }}
        onLostPointerCapture={() => {
          pointer.current = null;
        }}
      >
        <title>
          {label} ·{" "}
          {scene.simplified
            ? "Simple shape for a large load"
            : "Boxes or bags in their places"}
        </title>
        {polygons.map((p) => (
          <polygon
            key={p.key}
            points={p.points}
            fill={p.fill}
            stroke="#527361"
            strokeWidth="0.7"
            strokeLinejoin="round"
          />
        ))}
      </svg>
      <div
        className="scene-controls"
        role="group"
        aria-label="3D view controls"
      >
        <button
          className="button"
          onClick={() => rotate(-0.25)}
          aria-label="Turn left"
        >
          ↶
        </button>
        <button
          className="button"
          onClick={() => rotate(0.25)}
          aria-label="Turn right"
        >
          ↷
        </button>
        <button className="button" onClick={() => rotate(0, 0.15)}>
          Look from above
        </button>
        <button className="button" onClick={() => rotate(0, -0.15)}>
          Look from the side
        </button>
        <button
          className="button"
          aria-label="Zoom in"
          disabled={angle.zoom >= 1.5}
          onClick={() =>
            setAngle((a) => ({ ...a, zoom: Math.min(1.5, a.zoom + 0.1) }))
          }
        >
          +
        </button>
        <button
          className="button"
          aria-label="Zoom out"
          disabled={angle.zoom <= 0.5}
          onClick={() =>
            setAngle((a) => ({ ...a, zoom: Math.max(0.5, a.zoom - 0.1) }))
          }
        >
          −
        </button>
        <button
          className="button"
          onClick={() => setAngle({ yaw: 0.65, pitch: 0.55, zoom: 1 })}
        >
          Reset view
        </button>
      </div>
      <label className="scene-layer">
        Show the stack{" "}
        <select
          value={layer === undefined ? "all" : "single"}
          onChange={(e) => setLayer(e.target.value === "all" ? undefined : 0)}
        >
          <option value="all">Whole pallet</option>
          <option value="single">One layer only</option>
        </select>
      </label>
      {layer !== undefined && (
        <label className="scene-layer">
          Layer {layer + 1} of {pallet.layers}
          <input
            aria-label="Layer number"
            type="range"
            min={0}
            max={pallet.layers - 1}
            value={layer}
            onChange={(e) => setLayer(Number(e.target.value))}
          />
        </label>
      )}
      <p className="scene-hint">
        Drag to turn the view, or use the buttons.{" "}
        {scene.simplified
          ? "This large load uses a simple outer shape to keep the view fast. The printed pictures show the exact places."
          : "Items use the same places as the loading sheet."}{" "}
        {input.packageKind === "bag" &&
          "Bags are shown as filled block shapes. Bending and squeezing are not worked out."}
      </p>
    </div>
  );
}
