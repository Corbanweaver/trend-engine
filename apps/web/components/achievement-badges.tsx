"use client";

import { cn } from "@/lib/utils";
import {
  BADGE_DEFINITIONS,
  type BadgeDefinition,
  type BadgeId,
} from "@/lib/user-stats";

type AchievementBadgesProps = {
  earnedIds: Set<BadgeId>;
  className?: string;
  showLocked?: boolean;
};

export function AchievementBadges({
  earnedIds,
  className,
  showLocked = true,
}: AchievementBadgesProps) {
  const badges: BadgeDefinition[] = showLocked
    ? BADGE_DEFINITIONS
    : BADGE_DEFINITIONS.filter((b) => earnedIds.has(b.id));

  if (!showLocked && badges.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No badges yet — run analyses and save ideas to earn your first achievements.
      </p>
    );
  }

  return (
    <ul
      className={cn("flex flex-wrap gap-3", className)}
      aria-label="Achievement badges"
    >
      {badges.map((badge) => {
        const earned = earnedIds.has(badge.id);
        return (
          <li
            key={badge.id}
            className={cn(
              "fluid-transition flex min-w-[140px] max-w-[200px] flex-1 flex-col rounded-xl border p-3 text-left sm:min-w-[160px]",
              earned
                ? "border-emerald-400/40 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.12)]"
                : "border-border bg-muted/30 opacity-60 dark:border-white/10",
            )}
          >
            <div className="flex items-start gap-2">
              <span className="text-2xl leading-none" aria-hidden>
                {badge.emoji}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{badge.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{badge.description}</p>
              </div>
            </div>
            <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {earned ? "Unlocked" : "Locked"}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
