import Link from "next/link";
import Calculator from "@/features/pallet-calculator/calculator";
import type { Metadata } from "next";
export const metadata: Metadata = {
  ...(process.env.NEXT_PUBLIC_SITE_URL
    ? { alternates: { canonical: "/" } }
    : {}),
};
export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "PalletNest",
            description:
              "A browser-based pallet loading calculator for identical cartons and filled bags, height and weight limits, order quantities, and printable loading sheets and optional 3D previews.",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Any",
            browserRequirements: "Requires JavaScript",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            ...(process.env.NEXT_PUBLIC_SITE_URL
              ? { url: process.env.NEXT_PUBLIC_SITE_URL }
              : {}),
          }).replace(/</g, "\\u003c"),
        }}
      />
      <Calculator />
      <section className="seo-section">
        <div className="eyebrow">LESS GUESSWORK. BETTER LOADING.</div>
        <h2>Measure your goods. Know how many pallets to load.</h2>
        <div className="info-grid">
          <article>
            <span>01 / MEASURE</span>
            <h3>Measure one box or bag</h3>
            <p>
              Enter the size and weight of one item, then your pallet size and
              load limits. Use mm and kg, or inches and pounds.
            </p>
          </article>
          <article>
            <span>02 / PLAN</span>
            <h3>See how much fits</h3>
            <p>
              Get a suggested plan with the number of pallets needed and a
              picture of where to put each item.
            </p>
          </article>
          <article>
            <span>03 / PRINT</span>
            <h3>Print the loading steps</h3>
            <p>
              Print clear pictures and steps for the person loading. Save one
              plan in this browser to use again.
            </p>
          </article>
        </div>
        <Link href="/guide" className="text-link">
          Read the help page →
        </Link>
      </section>
    </>
  );
}
