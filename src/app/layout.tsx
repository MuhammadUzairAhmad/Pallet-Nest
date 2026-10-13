import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { Container } from "@/components/layout/container";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: {
    default: "PalletNest — Pallet Shipment Planner & Loading Sheets",
    template: "%s | PalletNest",
  },
  description:
    "Plan smarter pallet loads. Compare carton and filled bag arrangements, calculate height and weight limits, plan order quantities, and print a clear loading sheet with optional 3D preview.",
  applicationName: "PalletNest",
  openGraph: {
    type: "website",
    siteName: "PalletNest",
    title: "PalletNest — Plan smarter pallet loads",
    description:
      "A clear, practical pallet loading calculator. Compare layouts, plan quantities, and print your loading instructions.",
  },
  twitter: {
    card: "summary_large_image",
    title: "PalletNest — Plan smarter pallet loads",
    description:
      "Calculate carton and filled bag capacity and create clear pallet loading plans.",
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="[scrollbar-gutter:stable]">
      <body
        suppressHydrationWarning
        className="flex min-h-dvh flex-col print:block print:min-h-0"
      >
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <header className="shrink-0 border-0 border-b border-solid border-line bg-white print:hidden">
          <Container className="flex min-h-[82px] flex-wrap items-center gap-x-8 gap-y-3 py-4 sm:py-0 lg:gap-x-16">
            <Link
              className="flex shrink-0 items-center text-[23px] font-bold tracking-[-1px]"
              href="/"
              aria-label="PalletNest home"
            >
              <span className="mr-2.5 grid size-[37px] place-items-center rounded-[10px] bg-brand text-white">
                <Icon name="layers" size={23} />
              </span>
              Pallet<span className="font-normal text-brand">Nest</span>
            </Link>
            <nav
              aria-label="Main navigation"
              className="flex flex-wrap items-center gap-x-5 text-[13px] font-semibold sm:gap-x-8 [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center [&_a]:gap-1"
            >
              <Link href="/calculator">Make a plan</Link>
              <Link href="/guide">How it works</Link>
              <Link href="/contact">
                Contact <span aria-hidden="true">↗</span>
              </Link>
            </nav>
            <span className="ml-auto hidden items-center gap-2 text-xs text-secondary lg:flex">
              <span className="live-dot" /> Free to use. No account needed.
            </span>
          </Container>
        </header>
        <main
          id="main"
          className="w-full flex-1 pt-8 pb-10 xl:pt-[45px] print:p-0"
        >
          <Container>{children}</Container>
        </main>
        <footer className="shrink-0 print:hidden">
          <Container>
            <div className="flex flex-col justify-between gap-3 border-0 border-t border-solid border-line py-6 text-xs text-secondary sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <Link
                  className="inline-flex min-h-11 items-center text-[13px] font-semibold text-brand"
                  href="/"
                >
                  PalletNest
                </Link>
                <span>Plan smarter pallet loads.</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center">
                <span>Your numbers stay in this browser</span>
                <Link href="/guide">Help</Link>
                <Link href="/privacy">Privacy</Link>
              </div>
            </div>
          </Container>
        </footer>
      </body>
    </html>
  );
}
