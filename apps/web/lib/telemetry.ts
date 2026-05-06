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
  | "free_tool_used"
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

const sensitiveKeyPattern =
  /email|password|token|secret|key|cookie|authorization|card|customer/i;

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

  const payload = JSON.stringify({
    event: event.event,
    path: event.path ?? window.location.pathname,
    context: sanitizeContext(event.context),
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
