"use client";

import { ArrowRight } from "lucide-react";

import { AffiliateCheckoutFields } from "@/components/affiliate-checkout-fields";
import { trackConversionEvent } from "@/lib/telemetry";

type CreatorCheckoutFormProps = {
  buttonClassName: string;
  className?: string;
  label?: string;
  placement: string;
};

export function CreatorCheckoutForm({
  buttonClassName,
  className,
  label = "Start Creator checkout",
  placement,
}: CreatorCheckoutFormProps) {
  return (
    <form
      action="/api/stripe/checkout"
      method="POST"
      className={className}
      onSubmit={() =>
        trackConversionEvent({
          event: "upgrade_prompt_clicked",
          context: {
            placement,
            plan: "free",
            targetPlan: "creator",
          },
        })
      }
    >
      <input type="hidden" name="plan" value="creator" />
      <AffiliateCheckoutFields />
      <button type="submit" className={buttonClassName}>
        {label}
        <ArrowRight className="size-4" />
      </button>
    </form>
  );
}
