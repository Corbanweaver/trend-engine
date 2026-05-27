import type { Metadata } from "next";

import { FloatingAiAssistant } from "@/components/floating-ai-assistant";
import { TrendDashboard } from "@/components/trend-dashboard";

export const metadata: Metadata = {
  title: "Analyze Trends",
  description:
    "Run TrendBoard's trend analysis workflow and generate source-backed organic video idea cards.",
};

export const dynamic = "force-dynamic";

export default function AnalyzePage() {
  return (
    <>
      <TrendDashboard />
      <FloatingAiAssistant />
    </>
  );
}
