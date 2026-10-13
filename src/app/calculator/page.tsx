import type { Metadata } from "next";
import Calculator from "@/features/pallet-calculator/calculator";
export const metadata: Metadata = {
  title: "Pallet Shipment Planner",
  description:
    "Turn an order quantity into a pallet shipment plan. Compare layouts and print a warehouse loading sheet with package counts and layer instructions.",
  ...(process.env.NEXT_PUBLIC_SITE_URL
    ? { alternates: { canonical: "/calculator" } }
    : {}),
};
export default function Page() {
  return <Calculator />;
}
