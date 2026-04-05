import type { Metadata } from "next";

import { TrendDashboard } from "@/components/trend-dashboard";

export const metadata: Metadata = {
  title: "Trend dashboard",
  description: "Live trends and AI video ideas from the Content Engine API",
};

export default function DashboardPage() {
  return <TrendDashboard />;
}
