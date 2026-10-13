import { ContentPage } from "@/components/layout/content-page";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Privacy",
  description: "How PalletNest uses your numbers and saved plans.",
  ...(process.env.NEXT_PUBLIC_SITE_URL
    ? { alternates: { canonical: "/privacy" } }
    : {}),
};
export default function Privacy() {
  return (
    <ContentPage
      label="YOUR DATA"
      title="Your numbers stay in your browser."
      description="The calculator works out your plan in your browser. Your box, bag and pallet numbers are not sent to a project database."
    >
      <h2>Saved plans</h2>
      <p>
        Save on this device keeps one plan in this browser. Saving again
        replaces it. You cannot open it on another device. Clear this website’s
        browser data to remove it. Clearing browser data may also remove a plan
        you want to keep.
      </p>
      <h2>Accounts and tracking</h2>
      <p>
        There are no accounts, ads or tracking tools in this app. Printing uses
        your browser.
      </p>
      <h2>Loading this website</h2>
      <p>
        Your browser contacts the hosting server to load pages and assets. The
        hosting provider may keep request logs, including IP addresses and
        browser information, under its own privacy policy. The site operator
        should provide the hosting policy and contact details before public
        release.
      </p>
    </ContentPage>
  );
}
