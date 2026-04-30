type TelemetryLevel = "info" | "warn" | "error";

type TelemetryEvent = {
  area: string;
  action: string;
  level?: TelemetryLevel;
  message?: string;
  context?: Record<string, unknown>;
};

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
