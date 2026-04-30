/**
 * Base URL for the FastAPI Trend Engine API (no trailing slash).
 * Override with NEXT_PUBLIC_API_URL (e.g. http://localhost:8000).
 */
export function getApiBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.API_URL ??
    "http://localhost:8000";
  return raw.replace(/\/$/, "");
}

/** JSON fetch against the FastAPI backend. */
export async function apiFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const base = getApiBaseUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const headers = new Headers(init?.headers);
  if (init?.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(`${base}${normalized}`, {
    ...init,
    headers,
  });
}
