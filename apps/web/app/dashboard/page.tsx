import type { Metadata } from "next";

import { FloatingAiAssistant } from "@/components/floating-ai-assistant";
import { TrendDashboard } from "@/components/trend-dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Visual trend intelligence dashboard with AI-generated video ideas.",
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
