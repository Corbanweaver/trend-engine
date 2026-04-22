import type { Metadata } from "next";

import { TrendDashboard } from "@/components/trend-dashboard";

export const metadata: Metadata = {
  title: "Content Idea Maker",
  description: "Premium AI trend dashboard for short-form content creators",
};

export default function DashboardPage() {
  return <TrendDashboard />;
}
