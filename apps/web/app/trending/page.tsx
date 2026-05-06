import type { Metadata } from "next";

import { TrendingLivePage } from "./trending-client";

export const metadata: Metadata = {
  title: "Live Creator Trends Across TikTok, Instagram, Pinterest, YouTube, and Search",
  description:
    "See a public creator-focused trend pulse across TikTok, Instagram, X, Pinterest, YouTube Shorts, search, and news context.",
  alternates: {
    canonical: "/trending",
  },
};

export const dynamic = "force-dynamic";

export default function TrendingPage() {
  return <TrendingLivePage />;
}
