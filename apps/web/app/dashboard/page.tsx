import type { Metadata } from "next";

import { TrendDashboard } from "@/components/trend-dashboard";

export const metadata: Metadata = {
  title: "Content Idea Maker",
  description:
    "Pinterest-style trend intelligence dashboard with AI-generated video ideas",
};

export default function DashboardPage() {
  return <TrendDashboard />;
}
