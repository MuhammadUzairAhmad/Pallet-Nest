import { ContentPage } from "@/components/layout/content-page";
import Link from "next/link";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "How to use PalletNest",
  description:
    "Simple help for measuring boxes and bags, choosing a pallet, and printing a pallet loading plan.",
  ...(process.env.NEXT_PUBLIC_SITE_URL
    ? { alternates: { canonical: "/guide" } }
    : {}),
};
export default function Guide() {
  return (
    <ContentPage
      label="HELP"
      title="Make a pallet plan"
      description="All boxes or bags in one plan must be the same size. You do not need an account."
    >
      <h2>1. Measure one box or bag</h2>
      <p>
        Choose Boxes or Bags. Enter the length, width, height and weight of one
        item. Use the size of a closed box or a filled bag. For bags, lay the
        bag in the position you will use on the pallet. Thickness means how high
        that filled bag is.
      </p>
      <p>
        Enter the number of items you want to send. Leave it blank if you only
        want to know how much fits on one pallet.
      </p>
      <h2>2. Choose your pallet and limits</h2>
      <p>
        Pick the pallet size, or choose Enter another size. The pallet height
        and empty weight start at 150 mm and 25 kg. Change these if your pallet
        is different.
      </p>
      <p>
        <strong>Height limit (with pallet)</strong> means from the floor to the
        top of the goods, including the pallet.{" "}
        <strong>Weight limit (goods only)</strong> means the goods only, without
        the empty pallet. Use the real limits for your pallet and shipping
        method. A pallet size does not tell us its weight limit.
      </p>
      <h2>3. Make your plan</h2>
      <p>
        Click Make my plan. The result tells you how many pallets you need and
        where to put each item. A layer is one level of items on the pallet.
        Repeat the full-layer picture for each full layer. The last pallet may
        need fewer items in its top layer. The plan shows a separate picture for
        that layer.
      </p>
      <p>
        Numbers on the picture show places, not the order to load. Top-view
        picture sizes are always in mm, even when your input uses inches.
      </p>
      <h2>4. Print or save</h2>
      <p>
        Click Print loading sheet to print the full loading steps, or choose
        Save as PDF in your browser. You can add a product name, order number or
        loading note first. The full sheet prints even when its steps are closed
        on the page.
      </p>
      <p>
        Save on this device keeps one plan in this browser. Saving again
        replaces it. Open saved plan brings it back and checks the numbers
        again. It is not shared with other devices. If browser data is cleared,
        the saved plan may be lost.
      </p>
      <h2>What about the sample?</h2>
      <p>
        The sample is for learning. It is not your real load. Click Start my
        plan to enter your own sizes and limits. Printing and saving are turned
        off for the sample.
      </p>
      <h2>Check the real load</h2>
      <p>
        The plan checks space, height and weight. It cannot check box strength,
        whether the stack will stay steady, or how bags bend and squash. Ask the
        product or bag supplier for the allowed number of layers. Check the
        stack and secure it before moving it.
      </p>
      <details className="help-details">
        <summary>More loading options</summary>
        <p>
          <strong>Most layers allowed:</strong> limits the number of levels
          stacked on the pallet.
        </p>
        <p>
          <strong>Space between items:</strong> leaves the same space between
          items along the length and width. It does not add space between
          layers.
        </p>
        <p>
          <strong>Space at pallet edges:</strong> keeps space empty on all four
          sides. A dashed line on the picture shows where items must stay.
        </p>
        <p>
          <strong>Let boxes or bags turn sideways:</strong> turns an item on its
          base. Its height stays the same.
        </p>
        <p>
          <strong>Allow fewer items in the top layer:</strong> lets a pallet use
          some of the top layer when a full layer would weigh too much. The last
          order pallet always uses only the number needed, even if this option
          is off.
        </p>
      </details>
      <details className="help-details">
        <summary>Other layouts and the 3D view</summary>
        <p>
          The suggested plan holds the most items among the layouts checked. See
          other ways to load lets you compare simpler rows or turned items.
          These may need more pallets.
        </p>
        <p>
          View in 3D helps you see the stack. Drag to turn it, or use the
          buttons. You can view the last pallet or one layer. Large loads use
          one simple outer shape to keep the view fast. The top-view pictures
          still show the exact places. Bags appear as filled block shapes.
        </p>
      </details>
      <details className="help-details">
        <summary>How the numbers are checked</summary>
        <p>
          The calculator checks straight rows, turned rows, and mixed rows or
          columns. Every layout is checked for overlap, edge space and gaps. It
          picks the highest item count, then more items per layer and simpler
          turns. It does not claim to find every possible layout.
        </p>
        <p>
          Sizes are rounded to 0.001 mm and weights to 0.001 kg. Sizes can be
          1–10,000 mm. Gaps and edge spaces can be 0–10,000 mm if items still
          fit. The empty pallet can weigh zero. Other weights must be above zero
          and no more than 100,000 kg. Orders can contain 1–1,000,000 items.
        </p>
        <p>
          Search is limited to 80 splits per item size on each side and 2,000
          possible items per layer. A large search may stop early. The displayed
          plan explains this. Partial top layers use a centered group of the
          checked places. This checks space, not support or balance.
        </p>
      </details>
      <Link className="button primary" href="/calculator">
        Make a plan →
      </Link>
    </ContentPage>
  );
}
