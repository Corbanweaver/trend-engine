"use client";

import { useEffect, useRef } from "react";

import {
  trackConversionEvent,
  type ConversionEventName,
} from "@/lib/telemetry";

export function ConversionEventTracker({
  event,
  context,
}: {
  event: ConversionEventName;
  context?: Record<string, unknown>;
}) {
  const contextRef = useRef(context);
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current) return;
    trackedRef.current = true;
    trackConversionEvent({ event, context: contextRef.current });
  }, [event]);

  return null;
}
