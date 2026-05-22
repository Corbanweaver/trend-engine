"use client";

import { useEffect } from "react";

import { captureAffiliateAttribution } from "@/lib/affiliate-attribution";

export function AffiliateAttributionCapture() {
  useEffect(() => {
    captureAffiliateAttribution();
  }, []);

  return null;
}
