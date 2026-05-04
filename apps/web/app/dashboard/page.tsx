import type { Metadata } from "next";

import { TrendDashboard } from "@/components/trend-dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Pinterest-style trend intelligence dashboard with AI-generated video ideas",
};

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return <TrendDashboard />;
}
