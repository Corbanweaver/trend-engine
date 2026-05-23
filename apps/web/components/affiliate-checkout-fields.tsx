"use client";

import { useEffect, useState } from "react";

import {
  captureAffiliateAttribution,
  type AffiliateAttribution,
} from "@/lib/affiliate-attribution";

export function AffiliateCheckoutFields() {
  const [affiliate, setAffiliate] = useState<AffiliateAttribution | null>(null);

  useEffect(() => {
    setAffiliate(captureAffiliateAttribution());
  }, []);

  if (!affiliate) return null;

  return (
    <>
      <input type="hidden" name="affiliate_ref" value={affiliate.code} />
      <input type="hidden" name="affiliate_param" value={affiliate.param} />
      <input
        type="hidden"
        name="affiliate_landing_path"
        value={affiliate.landingPath}
      />
      <input
        type="hidden"
        name="affiliate_captured_at"
        value={affiliate.capturedAt}
      />
    </>
  );
}
