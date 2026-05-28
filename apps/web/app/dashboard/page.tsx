import type { Metadata } from "next";

import { FloatingAiAssistant } from "@/components/floating-ai-assistant";
import { TrendDashboard } from "@/components/trend-dashboard";

export const metadata: Metadata = {
  title: "Create Ideas",
  description: "Find trends for a niche and turn them into post ideas.",
};

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <>
      <TrendDashboard />
      <FloatingAiAssistant />
    </>
  );
}
