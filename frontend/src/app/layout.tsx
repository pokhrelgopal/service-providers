import type { Metadata } from "next";
import localFont from "next/font/local";
import { Inter_Tight, Manrope } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const satoshi = localFont({
  src: [
    { path: "../fonts/Satoshi-Light.otf", weight: "300", style: "normal" },
    { path: "../fonts/Satoshi-Regular.otf", weight: "400", style: "normal" },
    { path: "../fonts/Satoshi-Medium.otf", weight: "500", style: "normal" },
    { path: "../fonts/Satoshi-Bold.otf", weight: "700", style: "normal" },
    { path: "../fonts/Satoshi-Black.otf", weight: "900", style: "normal" },
  ],
  variable: "--font-satoshi",
  display: "swap",
});

// ─────────────────────────────────────────────────────────────────────────
// ADMIN PANEL FONT — used only in the admin area (via the `font-admin` class).
// To try a different font, swap `Inter_Tight` for any next/font/google import
// (e.g. Manrope, Geist) — this is the single place to change it.
// ─────────────────────────────────────────────────────────────────────────
const adminFont = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-admin-src",
  display: "swap",
});

// PROVIDER AREA FONT — used in the provider dashboard (via `font-provider`).
// Swap `Manrope` for any next/font/google import to change it.
const providerFont = Manrope({
  subsets: ["latin"],
  variable: "--font-provider-src",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Servio — Find trusted service providers near you",
  description:
    "A location-aware marketplace connecting seekers with verified local service providers. Discover providers on a live map, request a service, chat in realtime.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${satoshi.variable} ${adminFont.variable} ${providerFont.variable}`}
    >
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
