"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

import { AffiliateCheckoutFields } from "@/components/affiliate-checkout-fields";

type ResumeCheckoutFormProps = {
  plan: "creator" | "pro";
  planName: string;
  autoSubmit?: boolean;
};

export function ResumeCheckoutForm({
  plan,
  planName,
  autoSubmit = true,
}: ResumeCheckoutFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isResuming, setIsResuming] = useState(false);

  useEffect(() => {
    if (!autoSubmit) return;
    const timer = window.setTimeout(() => {
      setIsResuming(true);
      formRef.current?.requestSubmit();
    }, 350);

    return () => window.clearTimeout(timer);
  }, [autoSubmit]);

  return (
    <form ref={formRef} action="/api/stripe/checkout" method="POST">
      <input type="hidden" name="plan" value={plan} />
      <AffiliateCheckoutFields />
      <button
        type="submit"
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300 sm:w-auto"
      >
        {isResuming
          ? "Opening checkout..."
          : `Continue ${planName} checkout`}
        <ArrowRight className="size-4" />
      </button>
    </form>
  );
}
