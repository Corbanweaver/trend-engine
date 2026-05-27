"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Account features are not configured in this preview.");
  }

  return { url, anonKey };
}

export function getSupabaseClient(): SupabaseClient {
  if (typeof window === "undefined") {
    throw new Error("Supabase browser client must only be initialized on the client.");
  }

  if (browserClient) return browserClient;

  const { url, anonKey } = getSupabaseConfig();
  browserClient = createBrowserClient(url, anonKey);

  return browserClient;
}
