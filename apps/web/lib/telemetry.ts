type TelemetryLevel = "info" | "warn" | "error";

type TelemetryEvent = {
  area: string;
  action: string;
  level?: TelemetryLevel;
  message?: string;
  context?: Record<string, unknown>;
};

export type ConversionEventName =
  | "landing_page_viewed"
  | "landing_cta_clicked"
  | "free_tool_used"
  | "free_tool_generated"
  | "signup_prompt_clicked"
  | "signup_clicked"
  | "signup_completed"
  | "signup_google_clicked"
  | "analyze_clicked"
  | "analyze_completed"
  | "checkout_started"
  | "checkout_completed";

type ConversionEvent = {
  event: ConversionEventName;
  path?: string;
  context?: Record<string, unknown>;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (
      command: "event",
      eventName: "conversion",
      params: Record<string, unknown>,
    ) => void;
  }
}

const sensitiveKeyPattern =
  /email|password|token|secret|key|cookie|authorization|card|customer/i;

const attributionStorageKey = "trendboard:ad_attribution";
const defaultGoogleAdsSignupSendTo = "AW-18175424255/vbasCLON2LAcEP_t29pD";
const defaultGoogleAdsSubscribeSendTo = "AW-18175424255/vi8WCLaN2LAcEP_t29pD";
const googleAdsConversionSendTo: Partial<Record<ConversionEventName, string>> =
  {
    signup_completed:
      process.env.NEXT_PUBLIC_GOOGLE_ADS_SIGNUP_CONVERSION_LABEL?.trim() ||
      defaultGoogleAdsSignupSendTo,
    checkout_completed:
      process.env.NEXT_PUBLIC_GOOGLE_ADS_SUBSCRIBE_CONVERSION_LABEL?.trim() ||
      defaultGoogleAdsSubscribeSendTo,
  };
const adAttributionKeys = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "utm_source_platform",
  "gclid",
  "gbraid",
  "wbraid",
  "fbclid",
  "ttclid",
  "rdt_cid",
  "msclkid",
] as const;

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return value.slice(0, 180);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    return value.slice(0, 10).map((item) => sanitizeValue(item, depth + 1));
  }
  if (typeof value === "object" && depth < 2) {
    return sanitizeContext(value as Record<string, unknown>, depth + 1);
  }
  return String(value).slice(0, 180);
}

function sanitizeContext(
  context: Record<string, unknown> | undefined,
  depth = 0,
) {
  if (!context) return {};
  return Object.fromEntries(
    Object.entries(context)
      .filter(([key]) => !sensitiveKeyPattern.test(key))
      .slice(0, 20)
      .map(([key, value]) => [key, sanitizeValue(value, depth)]),
  );
}

function readStoredAttribution(): Record<string, unknown> {
  try {
    const raw = window.localStorage.getItem(attributionStorageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function captureAttribution(): Record<string, unknown> {
  const params = new URLSearchParams(window.location.search);
  const current = Object.fromEntries(
    adAttributionKeys
      .map((key) => [key, params.get(key)?.trim()] as const)
      .filter(([, value]) => Boolean(value)),
  );

  const stored = readStoredAttribution();
  if (!Object.keys(current).length) return stored;

  const now = new Date().toISOString();
  const next = {
    ...stored,
    first_touch:
      stored.first_touch && typeof stored.first_touch === "object"
        ? stored.first_touch
        : { ...current, captured_at: now },
    last_touch: { ...current, captured_at: now },
  };

  try {
    window.localStorage.setItem(attributionStorageKey, JSON.stringify(next));
  } catch {
    /* local attribution should not block the UI */
  }

  return next;
}

function sendGoogleAdsConversion(event: ConversionEvent): void {
  const sendTo = googleAdsConversionSendTo[event.event];
  if (!sendTo) return;

  const value =
    typeof event.context?.value === "number" &&
    Number.isFinite(event.context.value)
      ? event.context.value
      : 1;
  const currency =
    typeof event.context?.currency === "string" && event.context.currency
      ? event.context.currency
      : "USD";

  const gtag =
    window.gtag ??
    ((...args: unknown[]) => {
      window.dataLayer = window.dataLayer ?? [];
      window.dataLayer.push(args);
    });

  gtag("event", "conversion", {
    send_to: sendTo,
    value,
    currency,
  });
}

/**
 * Lightweight client-side breadcrumb logger.
 * Keeps output local (console) and intentionally avoids sensitive payloads.
 */
export function trackUiEvent(event: TelemetryEvent): void {
  if (typeof window === "undefined") return;
  const payload = {
    ts: new Date().toISOString(),
    area: event.area,
    action: event.action,
    message: event.message ?? "",
    context: event.context ?? {},
  };
  const level = event.level ?? "info";
  if (level === "error") {
    console.error("[ui-telemetry]", payload);
    return;
  }
  if (level === "warn") {
    console.warn("[ui-telemetry]", payload);
    return;
  }
  console.info("[ui-telemetry]", payload);
}

/**
 * First-party conversion tracker for the small marketing funnel.
 * Payloads are intentionally allowlisted and scrubbed before leaving the page.
 */
export function trackConversionEvent(event: ConversionEvent): void {
  if (typeof window === "undefined") return;
  const attribution = captureAttribution();
  sendGoogleAdsConversion(event);

  const payload = JSON.stringify({
    event: event.event,
    path: event.path ?? window.location.pathname,
    context: sanitizeContext({
      ...event.context,
      attribution,
    }),
    ts: new Date().toISOString(),
  });

  try {
    if ("sendBeacon" in navigator) {
      const blob = new Blob([payload], { type: "application/json" });
      if (navigator.sendBeacon("/api/conversion-events", blob)) return;
    }
  } catch {
    /* fall back to fetch */
  }

  fetch("/api/conversion-events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {
    /* conversion tracking should never block the UI */
  });
}
