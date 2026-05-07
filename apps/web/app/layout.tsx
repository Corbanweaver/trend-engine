import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { FloatingAiAssistant } from "@/components/floating-ai-assistant";
import { PwaRegistration } from "@/components/pwa-registration";

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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "TrendBoard - AI Content Idea Generator for TikTok, Instagram, YouTube Shorts, and Pinterest",
    template: "%s | TrendBoard",
  },
  applicationName: "TrendBoard",
  description:
    "Find live content trends, generate polished idea cards, and turn them into hooks, scripts, hashtags, and calendar-ready posts.",
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
    title:
      "TrendBoard - AI Content Idea Generator for TikTok, Instagram, YouTube Shorts, and Pinterest",
    description:
      "Analyze trend signals across creator platforms and generate AI-powered content ideas with source-backed thumbnails.",
    url: SITE_URL,
    siteName: "TrendBoard",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "TrendBoard - AI Content Idea Generator for TikTok, Instagram, YouTube Shorts, and Pinterest",
    description:
      "Find live trends and turn them into AI-assisted content ideas.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#07111f",
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
    "AI content idea generator for TikTok, Instagram, YouTube Shorts, Pinterest, and creator content calendars.",
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

async function hasAuthenticatedUser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return false;
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // Root layout only needs to read auth state for conditional UI.
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return Boolean(user);
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const showFloatingAssistant = await hasAuthenticatedUser();

  return (
    <html lang="en" className="dark">
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
(() => {
  try {
    localStorage.setItem("theme", "dark");
    document.documentElement.classList.add("dark");
  } catch {}
})();
`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${geistSans.className}`}
      >
        {children}
        <PwaRegistration />
        {showFloatingAssistant ? <FloatingAiAssistant /> : null}
      </body>
    </html>
  );
}
