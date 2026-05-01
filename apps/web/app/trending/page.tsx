import type { Metadata } from "next";

import { TrendingLivePage } from "./trending-client";

export const metadata: Metadata = {
  title: "Live trending — Trend Engine",
  description:
    "Today's top trends across Google, news, YouTube Shorts, TikTok, Reddit, and tech communities.",
};

export const dynamic = "force-dynamic";

export default function TrendingPage() {
  return <TrendingLivePage />;
}
