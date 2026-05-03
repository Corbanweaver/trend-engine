import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

type OperationalEvent = {
  level: "info" | "warn" | "error";
  source: string;
  message: string;
  userId?: string | null;
  metadata?: Record<string, unknown>;
};

function safeMetadata(metadata: Record<string, unknown> | undefined) {
  if (!metadata) return {};
  try {
    return JSON.parse(JSON.stringify(metadata)) as Record<string, unknown>;
  } catch {
    return { serialization_error: true };
  }
}

export async function recordOperationalEvent(
  admin: SupabaseClient,
  event: OperationalEvent,
) {
  const { error } = await admin.from("operational_events").insert({
    level: event.level,
    source: event.source,
    message: event.message.slice(0, 1000),
    user_id: event.userId ?? null,
    metadata: safeMetadata(event.metadata),
  });

  if (error) {
    console.error("Failed to record operational event:", error);
  }
}
