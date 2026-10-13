import { useId } from "react";
import type { Placement } from "@/lib/pallet-engine/calculate";
export function Preview({
  positions,
  length,
  width,
  small = false,
  edgeClearance = 0,
}: {
  positions: Placement[];
  length: number;
  width: number;
  small?: boolean;
  edgeClearance?: number;
}) {
  const woodId = `wood-${useId().replace(/:/g, "")}`;
  const pad = Math.max(length, width) * 0.095,
    font = Math.max(length, width) * 0.044;
  return (
    <svg
      className={small ? "mini-plan" : "pallet-plan"}
      viewBox={`${-pad} ${-pad} ${length + pad * 2} ${width + pad * 2}`}
      role="img"
      aria-label={`Pallet top view: ${positions.length} ${positions.length === 1 ? "package" : "packages"}, ${length} by ${width} millimeters`}
    >
      <title>Numbers show places. Keep items inside the pallet edges.</title>
      <defs>
        <pattern
          id={woodId}
          width={length / 8}
          height={width}
          patternUnits="userSpaceOnUse"
        >
          <rect width={length / 8 - 4} height={width} fill="#efe6d7" />
          <path d={`M8 0V${width}`} stroke="#e4d8c5" strokeWidth="2" />
        </pattern>
      </defs>
      <rect
        width={length}
        height={width}
        rx={Math.min(length, width) * 0.012}
        fill={`url(#${woodId})`}
        stroke="#b6a993"
        strokeWidth={length * 0.003}
      />
      {positions.map((p, index) => (
        <g key={index}>
          <rect
            x={p.x + 1}
            y={p.y + 1}
            width={Math.max(0, p.length - 2)}
            height={Math.max(0, p.width - 2)}
            rx={Math.min(p.width, p.length) * 0.022}
            fill={p.rotated ? "#c8ded7" : "#d9e8e0"}
            stroke="#709d8b"
            strokeWidth={length * 0.002}
          />
          {!small && (
            <>
              <path
                d={`M${p.x + p.length / 2} ${p.y + 3}v${p.width - 6}`}
                stroke="#accbbd"
                strokeWidth={length * 0.0015}
              />
              <text
                x={p.x + p.length / 2}
                y={p.y + p.width / 2}
                dominantBaseline="middle"
                textAnchor="middle"
                fontSize={Math.min(font, p.width * 0.35, p.length * 0.35)}
                fontWeight="600"
                fill="#35614f"
              >
                {index + 1}
              </text>
            </>
          )}
        </g>
      ))}
      {edgeClearance > 0 && (
        <rect
          x={edgeClearance}
          y={edgeClearance}
          width={Math.max(0, length - 2 * edgeClearance)}
          height={Math.max(0, width - 2 * edgeClearance)}
          fill="none"
          stroke="#967344"
          strokeWidth={length * 0.002}
          strokeDasharray={`${length * 0.012} ${length * 0.008}`}
        >
          <title>
            Keep items inside this line: {edgeClearance} mm empty at each edge
          </title>
        </rect>
      )}
      {!small && (
        <>
          <path
            d={`M0 ${-pad * 0.52}H${length}M0 ${-pad * 0.65}v${pad * 0.26}M${length} ${-pad * 0.65}v${pad * 0.26}`}
            stroke="#89958e"
            strokeWidth={length * 0.0015}
          />
          <text
            x={length / 2}
            y={-pad * 0.65}
            textAnchor="middle"
            fontSize={font * 0.8}
            fill="#68766e"
          >
            {length.toLocaleString("en-US")} mm
          </text>
          <text
            x={length + pad * 0.45}
            y={width / 2}
            textAnchor="middle"
            fontSize={font * 0.8}
            fill="#68766e"
            transform={`rotate(90 ${length + pad * 0.45} ${width / 2})`}
          >
            {width.toLocaleString("en-US")} mm
          </text>
        </>
      )}
    </svg>
  );
}
