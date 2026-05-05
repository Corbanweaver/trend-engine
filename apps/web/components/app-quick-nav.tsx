import Link from "next/link";
import {
  BarChart3,
  Bell,
  Bookmark,
  CalendarDays,
  Sparkles,
  UserRound,
} from "lucide-react";

import { cn } from "@/lib/utils";

const appLinks = [
  { href: "/dashboard", label: "Create", icon: Sparkles, key: "dashboard" },
  { href: "/saved", label: "Saved", icon: Bookmark, key: "saved" },
  { href: "/calendar", label: "Calendar", icon: CalendarDays, key: "calendar" },
  { href: "/alerts", label: "Alerts", icon: Bell, key: "alerts" },
  { href: "/analytics", label: "Stats", icon: BarChart3, key: "analytics" },
  { href: "/profile", label: "Profile", icon: UserRound, key: "profile" },
] as const;

export type AppQuickNavKey = (typeof appLinks)[number]["key"];

export function AppQuickNav({ active }: { active: AppQuickNavKey }) {
  return (
    <nav className="-mx-1 flex gap-1 overflow-x-auto pb-1" aria-label="App">
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
                ? "border-primary bg-primary text-primary-foreground dark:border-cyan-300 dark:bg-cyan-400 dark:text-slate-950"
                : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
