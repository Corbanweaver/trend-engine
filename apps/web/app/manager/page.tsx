import type { Metadata } from "next";

import { AppQuickNav } from "@/components/app-quick-nav";
import { CreatorAccountManager } from "@/components/creator-account-manager";

export const metadata: Metadata = {
  title: "Creator Manager",
  description:
    "Scan a creator account, detect the niche, and build an online content manager plan for posts, tasks, schedules, and growth actions.",
};

export const dynamic = "force-dynamic";

export default function ManagerPage() {
  return (
    <main className="creator-app-page min-h-svh overflow-x-hidden px-3 py-8 pb-24 text-foreground sm:px-4 lg:pb-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <AppQuickNav active="manager" />
        <CreatorAccountManager />
      </div>
    </main>
  );
}
