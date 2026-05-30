"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  BarChart3,
  Bell,
  Bookmark,
  CalendarDays,
  LayoutDashboard,
  Sparkles,
  UserRound,
} from "lucide-react";

import { FloatingAiAssistant } from "@/components/floating-ai-assistant";
import { cn } from "@/lib/utils";

const appLinks = [
  { href: "/manager", label: "Manager", icon: LayoutDashboard, key: "manager" },
  { href: "/dashboard", label: "Create", icon: Sparkles, key: "dashboard" },
  { href: "/saved", label: "Saved", icon: Bookmark, key: "saved" },
  { href: "/calendar", label: "Calendar", icon: CalendarDays, key: "calendar" },
  { href: "/alerts", label: "Alerts", icon: Bell, key: "alerts" },
  { href: "/analytics", label: "Stats", icon: BarChart3, key: "analytics" },
  { href: "/profile", label: "Profile", icon: UserRound, key: "profile" },
] as const;

export type AppQuickNavKey = (typeof appLinks)[number]["key"];

export function AppQuickNav({ active }: { active: AppQuickNavKey }) {
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  return (
    <>
      <nav
        className="-mx-1 flex gap-1 overflow-x-auto rounded-[1.35rem] border border-border/80 bg-white/75 p-1 shadow-sm backdrop-blur"
        aria-label="App"
      >
        {appLinks.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors",
                isActive
                  ? "creator-sidebar-active border-transparent text-primary-foreground"
                  : "border-transparent bg-white/60 text-muted-foreground hover:bg-white hover:text-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <FloatingAiAssistant />
    </>
  );
}
