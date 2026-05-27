import Link from "next/link";
import { ArrowRight, BarChart3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MarketingHeaderProps = {
  currentPath?: string;
  ctaHref?: string;
  ctaLabel?: string;
  className?: string;
};

type MarketingFooterProps = {
  guideLinks?: Array<{
    title: string;
    href: string;
  }>;
};

const navItems = [
  { label: "Analyze", href: "/analyze" },
  { label: "Trends", href: "/trending" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Support", href: "/support" },
] as const;

const defaultGuideLinks = [
  { title: "Free TikTok hook ideas", href: "/free-tiktok-hook-ideas" },
  { title: "TikTok content ideas", href: "/tiktok-content-ideas" },
  { title: "Instagram Reels hooks", href: "/instagram-reels-hook-ideas" },
  { title: "Content calendar tool", href: "/content-calendar-tool" },
  { title: "Niche ideas", href: "/niches" },
];

export function MarketingLogo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
      <span className="creator-sidebar-active flex size-8 items-center justify-center rounded-md text-primary-foreground">
        <BarChart3 className="size-4" />
      </span>
      <span>TrendBoard</span>
    </Link>
  );
}

export function MarketingHeader({
  currentPath,
  ctaHref = "/analyze",
  ctaLabel = "Analyze trends",
  className,
}: MarketingHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:px-6",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
        <MarketingLogo />
        <nav className="hidden items-center gap-6 text-sm md:flex">
          {navItems.map((item) => {
            const active = currentPath === item.href;
            return (
              <Link
                key={item.href}
                className={cn(
                  "font-medium text-muted-foreground transition-colors hover:text-foreground",
                  active && "text-primary",
                )}
                href={item.href}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Button asChild className="creator-cta shrink-0">
          <Link href={ctaHref}>
            {ctaLabel}
            <ArrowRight data-icon="inline-end" />
          </Link>
        </Button>
      </div>
    </header>
  );
}

export function MarketingFooter({ guideLinks }: MarketingFooterProps) {
  const guides = guideLinks?.length ? guideLinks : defaultGuideLinks;

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-sm">
          <MarketingLogo />
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Trend analysis, organic video idea cards, and source-backed creator
            planning for people who need to film while the window is open.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
          <div>
            <p className="font-semibold text-foreground">Product</p>
            <ul className="mt-4 flex flex-col gap-2 text-muted-foreground">
              <li>
                <Link href="/analyze" className="hover:text-foreground">
                  Analyze
                </Link>
              </li>
              <li>
                <Link href="/trending" className="hover:text-foreground">
                  Live trends
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-foreground">
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/free-tiktok-hook-ideas"
                  className="hover:text-foreground"
                >
                  Free tools
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-foreground">Company</p>
            <ul className="mt-4 flex flex-col gap-2 text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-foreground">
                  About
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-foreground">
                  Support
                </Link>
              </li>
              <li>
                <Link href="/status" className="hover:text-foreground">
                  Status
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-foreground">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-foreground">Guides</p>
            <ul className="mt-4 flex flex-col gap-2 text-muted-foreground">
              {guides.slice(0, 7).map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-foreground">
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-border py-5">
        <p className="text-center text-xs text-muted-foreground">
          (c) {new Date().getFullYear()} TrendBoard. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
