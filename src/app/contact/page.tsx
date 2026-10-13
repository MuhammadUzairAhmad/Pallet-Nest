import { ContentPage } from "@/components/layout/content-page";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Get help",
  description:
    "Prepare useful feedback about a PalletNest loading calculation.",
  ...(process.env.NEXT_PUBLIC_SITE_URL
    ? { alternates: { canonical: "/contact" } }
    : {}),
};
export default function Contact() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  return (
    <ContentPage
      label="HELP IMPROVE PALLETNEST"
      title="Need help with a plan?"
      description="If a plan looks wrong, share the numbers so it can be checked."
    >
      <h2>What to send</h2>
      <ul>
        <li>Box or filled bag size and weight, with units.</li>
        <li>Pallet size, height and empty weight.</li>
        <li>Height and goods weight limits, and any extra loading options.</li>
        <li>Number of items, chosen layout and what you expected.</li>
        <li>A printed plan, and the browser you used.</li>
      </ul>
      {email ? (
        <a
          className="button primary"
          href={`mailto:${encodeURIComponent(email)}?subject=PalletNest%20feedback`}
        >
          Email for help ↗
        </a>
      ) : (
        <p>
          Email help is not available yet. Save or print your plan and share it
          with the person who gave you this tool.
        </p>
      )}
    </ContentPage>
  );
}
