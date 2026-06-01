import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import { AffiliateAttributionCapture } from "@/components/analytics/affiliate-attribution-capture";
import { GoogleAdsTag } from "@/components/analytics/google-ads-tag";
import { PwaRegistration } from "@/components/pwa-registration";
import { BlobField } from "@/components/creator/blob-field";

import "./globals.css";

const SITE_URL = "https://www.contentideamaker.com";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

// Display font for headings — editorial, warm, distinctive
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "TrendBoard - Organic video idea maker for creators",
    template: "%s | TrendBoard",
  },
  applicationName: "TrendBoard",
  description:
    "Find rising organic video ideas, verify source context, and turn trend windows into hooks, shot lists, captions, and calendar-ready posts.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "TrendBoard",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    shortcut: "/icon.svg",
    apple: [
      {
        url: "/api/pwa-icon?size=180",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  openGraph: {
    title: "TrendBoard - Organic video idea maker for creators",
    description:
      "Analyze creator trend signals and turn promising windows into source-backed organic video ideas.",
    url: SITE_URL,
    siteName: "TrendBoard",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TrendBoard - Organic video idea maker for creators",
    description: "Find rising waves and turn them into source-backed organic video ideas.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f7f8f5",
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "TrendBoard",
  url: SITE_URL,
  logo: `${SITE_URL}/icon.svg`,
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "TrendBoard",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: SITE_URL,
  description:
    "Organic video idea maker and Trend Radar for TikTok, Instagram, YouTube Shorts, Pinterest, and creator content calendars.",
  offers: [
    {
      "@type": "Offer",
      name: "Free",
      price: "0",
      priceCurrency: "USD",
    },
    {
      "@type": "Offer",
      name: "Creator",
      price: "19.99",
      priceCurrency: "USD",
    },
    {
      "@type": "Offer",
      name: "Pro",
      price: "49.99",
      priceCurrency: "USD",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(softwareJsonLd),
          }}
        />
      </head>
      <body
        className={`theme-creator ${geistSans.variable} ${geistMono.variable} ${bricolage.variable} ${geistSans.className}`}
      >
        <BlobField />
        {children}
        <AffiliateAttributionCapture />
        <GoogleAdsTag />
        <PwaRegistration />
      </body>
    </html>
  );
}
