import * as React from "react";

import { cn } from "@/lib/utils";

function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card"
      className={cn(
        "fluid-transition glass-surface hairline-ring rounded-2xl border border-border bg-card/80 text-card-foreground shadow-[0_8px_24px_rgba(34,39,47,0.07)] dark:border-white/10 dark:shadow-[0_8px_28px_rgba(0,0,0,0.16)]",
        "hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_14px_32px_rgba(34,39,47,0.1)] dark:hover:shadow-[0_14px_34px_rgba(0,0,0,0.22)]",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col space-y-1.5 p-4", className)}
      {...props}
    />
  );
}

function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-title"
      className={cn("font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  );
}

function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-slot="card-content" className={cn("p-4 pt-0", className)} {...props} />
  );
}

function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center p-4 pt-0", className)}
      {...props}
    />
  );
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
