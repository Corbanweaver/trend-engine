import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { recordOperationalEvent } from "@/lib/server-events";
import type { ConversionEventName } from "@/lib/telemetry";

const allowedConversionEvents = new Set<ConversionEventName>([
  "landing_page_viewed",
  "free_tool_used",
  "signup_clicked",
  "signup_completed",
  "signup_google_clicked",
  "analyze_clicked",
  "analyze_completed",
  "checkout_started",
  "checkout_completed",
]);

const sensitiveKeyPattern =
  /email|password|token|secret|key|cookie|authorization|card|customer/i;

let conversionAdmin: SupabaseClient | null = null;

function getConversionAdmin() {
  if (conversionAdmin) return conversionAdmin;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  conversionAdmin = createClient(supabaseUrl, serviceRoleKey);
  return conversionAdmin;
}

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return value.slice(0, 180);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    return value.slice(0, 10).map((item) => sanitizeValue(item, depth + 1));
  }
  if (typeof value === "object" && depth < 2) {
    return sanitizeMetadata(value as Record<string, unknown>, depth + 1);
  }
  return String(value).slice(0, 180);
}

export function isAllowedConversionEvent(
  event: unknown,
): event is ConversionEventName {
  return (
    typeof event === "string" &&
    allowedConversionEvents.has(event as ConversionEventName)
  );
}

export function sanitizeMetadata(
  metadata: Record<string, unknown> | undefined,
  depth = 0,
) {
  if (!metadata) return {};
  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([key]) => !sensitiveKeyPattern.test(key))
      .slice(0, 24)
      .map(([key, value]) => [key, sanitizeValue(value, depth)]),
  );
}

export async function recordConversionEvent({
  event,
  userId,
  metadata,
}: {
  event: ConversionEventName;
  userId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const safeMetadata = sanitizeMetadata(metadata);
  const admin = getConversionAdmin();
  if (!admin) {
    console.info("[conversion-event]", {
      event,
      userId: userId ?? null,
      ...safeMetadata,
    });
    return;
  }

  await recordOperationalEvent(admin, {
    level: "info",
    source: "conversion",
    message: event,
    userId: userId ?? null,
    metadata: safeMetadata,
  });
}
