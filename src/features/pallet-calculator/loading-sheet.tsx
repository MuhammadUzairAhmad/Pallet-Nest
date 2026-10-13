import {
  planOrder,
  type Input,
  type Pattern,
} from "@/lib/pallet-engine/calculate";
import { Preview } from "./preview";
import { layoutName } from "./plain-words";
import { Icon } from "@/components/icon";

export type ProjectDetails = {
  product: string;
  reference: string;
  notes: string;
};
export function LoadingSheet({
  input,
  pattern,
  details,
  length,
  weight,
}: {
  input: Input;
  pattern: Pattern;
  details: ProjectDetails;
  length: (n: number) => string;
  weight: (n: number) => string;
}) {
  const item = input.packageKind === "bag" ? "bag" : "box";
  const cartons = (n: number) =>
    `${n.toLocaleString("en-US")} ${n === 1 ? item : item === "box" ? "boxes" : "bags"}`;
  const order = planOrder(pattern, input);
  if (!order) return null;
  const groups = [
    ...(order.fullPallets
      ? [
          {
            title:
              order.fullPallets === 1
                ? "Pallet 1"
                : `Pallets 1–${order.fullPallets.toLocaleString("en-US")}`,
            copies: order.fullPallets,
            pallet: order.full,
          },
        ]
      : []),
    ...(order.last
      ? [
          {
            title: `Pallet ${order.totalPallets.toLocaleString("en-US")} · last pallet`,
            copies: 1,
            pallet: order.last,
          },
        ]
      : []),
  ];
  const totalCargo = order.quantity * input.cartonWeight;
  return (
    <section
      id="loading-sheet"
      className="warehouse-sheet"
      aria-label="Warehouse loading sheet"
    >
      <div className="sheet-header">
        <div>
          <div className="eyebrow">HOW TO LOAD YOUR PALLETS</div>
          <h2>
            {details.product.trim() ||
              `${input.packageKind === "bag" ? "Bag" : "Box"} loading plan`}
          </h2>
          <p>
            {details.reference.trim()
              ? `Order / reference: ${details.reference.trim()} · `
              : ""}
            {cartons(order.quantity)} ·{" "}
            {order.totalPallets.toLocaleString("en-US")}{" "}
            {order.totalPallets === 1 ? "pallet" : "pallets"} ·{" "}
            {layoutName(pattern.name)}
          </p>
        </div>
        <Icon name="layers" size={28} />
      </div>
      <div className="sheet-totals">
        <span>
          Goods weight <strong>{weight(totalCargo)}</strong>
        </span>
        <span>
          Weight with pallets{" "}
          <strong>
            {weight(totalCargo + order.totalPallets * input.tare)}
          </strong>
        </span>
        <span>
          {input.packageKind === "bag" ? "Filled bag size" : "Box size"}{" "}
          <strong>
            {length(input.cartonLength)} × {length(input.cartonWidth)} ×{" "}
            {length(input.cartonHeight)}
          </strong>
        </span>
      </div>
      <p className="sheet-note">
        Space: {length(input.gap ?? 0)} between packages;{" "}
        {length(input.edgeClearance ?? 0)} empty space at each edge of the
        pallet.{" "}
        {input.quantity &&
          (order.last
            ? `Room left on the last pallet: ${cartons(order.remainingCapacity)} within this plan’s limits. You may need to move items to make room.`
            : "All pallets are full for this plan.")}
      </p>
      {groups.map((group) => (
        <article className="pallet-instruction" key={group.title}>
          <div className="instruction-heading">
            <h3>{group.title}</h3>
            <span>
              {group.copies > 1
                ? `${group.copies} pallets loaded the same way`
                : "1 pallet"}
            </span>
          </div>
          <p className="instruction-lead">
            <strong>{cartons(group.pallet.count)} per pallet</strong> ·{" "}
            {length(group.pallet.height)} high · {weight(group.pallet.cargo)}{" "}
            goods · {weight(group.pallet.gross)} including pallet
          </p>
          <ol className="loading-steps">
            <li>
              Start with an empty {length(input.palletLength)} ×{" "}
              {length(input.palletWidth)} pallet.
            </li>
            {group.pallet.fullLayers > 0 && (
              <li>
                Load{" "}
                <strong>
                  {group.pallet.fullLayers} full{" "}
                  {group.pallet.fullLayers === 1 ? "layer" : "layers"}
                </strong>{" "}
                of {cartons(pattern.perLayer)} each using the full-layer
                picture.
              </li>
            )}
            {group.pallet.top.length > 0 && (
              <li>
                Add{" "}
                <strong>
                  {cartons(group.pallet.top.length)} in the middle of the top
                  layer
                </strong>{" "}
                using the top-layer picture.
              </li>
            )}
            <li>
              Check that {cartons(group.pallet.count)}{" "}
              {group.pallet.count === 1 ? "is" : "are"} loaded. Check the stack
              is steady. Secure it before moving it.
            </li>
          </ol>
          <div className="sheet-diagrams">
            {group.pallet.fullLayers > 0 && (
              <figure>
                <Preview
                  positions={pattern.positions}
                  length={input.palletLength}
                  width={input.palletWidth}
                  edgeClearance={input.edgeClearance ?? 0}
                />
                <figcaption>
                  Full layer · repeat {group.pallet.fullLayers}{" "}
                  {group.pallet.fullLayers === 1 ? "time" : "times"} per pallet
                </figcaption>
              </figure>
            )}
            {group.pallet.top.length > 0 && (
              <figure>
                <Preview
                  positions={group.pallet.top}
                  length={input.palletLength}
                  width={input.palletWidth}
                  edgeClearance={input.edgeClearance ?? 0}
                />
                <figcaption>
                  Last top layer · {cartons(group.pallet.top.length)}
                </figcaption>
              </figure>
            )}
          </div>
          {group.pallet.top.length > 0 && !input.partial && (
            <p className="sheet-note">
              The last pallet uses only the items needed for your order. Its top
              layer may have fewer items.
            </p>
          )}
        </article>
      ))}
      {details.notes.trim() && (
        <div className="sheet-notes">
          <h3>Loading note</h3>
          <p>{details.notes}</p>
        </div>
      )}
      <p className="sheet-note">
        Picture sizes are in mm. Keep each item in the position measured. Items
        must stay inside the pallet edges. Space between items applies within
        each layer. Numbers show places, not the order to load. This plan does
        not check box strength or whether the stack will stay steady.{" "}
        {input.packageKind === "bag" &&
          "Filled bags are shown as block shapes. Bending and squeezing are not worked out."}{" "}
        {input.maxLayers !== undefined &&
          `No more than ${input.maxLayers} layers allowed.`}
      </p>
    </section>
  );
}
