import "server-only";

import { getApiBaseUrl } from "@/lib/api";

function getBackendKey() {
  return (
    process.env.TREND_ENGINE_BACKEND_KEY?.trim() ||
    process.env.OPERATIONAL_API_KEY?.trim() ||
    ""
  );
}

export function getBackendHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init);
  const backendKey = getBackendKey();
  if (backendKey) {
    headers.set("X-Operational-Key", backendKey);
  }
  return headers;
}

export function getBackendUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalized}`;
}
