import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { FloatingAiAssistant } from "@/components/floating-ai-assistant";

import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.contentideamaker.com"),
  title: {
    default: "Content Idea Maker - AI Content Ideas From Live Trends",
    template: "%s | Content Idea Maker",
  },
  applicationName: "Content Idea Maker",
  description:
    "Find live content trends, generate polished idea cards, and turn them into hooks, scripts, and hashtags.",
  manifest: "/manifest.webmanifest",
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
        url: "/apple-icon.svg",
        type: "image/svg+xml",
      },
    ],
  },
  openGraph: {
    title: "Content Idea Maker - AI Content Ideas From Live Trends",
    description:
      "Analyze trend signals across creator platforms and generate AI-powered content ideas with thumbnails.",
    url: "https://www.contentideamaker.com",
    siteName: "Content Idea Maker",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Content Idea Maker - AI Content Ideas From Live Trends",
    description:
      "Find live trends and turn them into AI-assisted content ideas.",
  },
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
        {showFloatingAssistant ? <FloatingAiAssistant /> : null}
      </body>
    </html>
  );
}
