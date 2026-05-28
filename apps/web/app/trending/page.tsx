import type { Metadata } from "next";

import { TrendingLivePage } from "./trending-client";

export const metadata: Metadata = {
  title: "Live Creator Trends",
  description:
    "Find live creator trends from social, search, community, and news signals before turning them into content ideas.",
  alternates: {
    canonical: "/trending",
  },
};

export const dynamic = "force-dynamic";

export default function TrendingPage() {
  return <TrendingLivePage />;
}
