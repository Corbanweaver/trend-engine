"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

import {
  trackConversionEvent,
  type ConversionEventName,
} from "@/lib/telemetry";

type ConversionLinkProps = ComponentProps<typeof Link> & {
  event: ConversionEventName;
  eventContext?: Record<string, unknown>;
};

export function ConversionLink({
  event,
  eventContext,
  onClick,
  ...props
}: ConversionLinkProps) {
  return (
    <Link
      {...props}
      onClick={(clickEvent) => {
        trackConversionEvent({
          event,
          context: eventContext,
        });
        onClick?.(clickEvent);
      }}
    />
  );
}
