const PLACEHOLDER_AVATAR_HOSTS = new Set(["example.com", "www.example.com"]);

export function getSafeAvatarUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    if (PLACEHOLDER_AVATAR_HOSTS.has(url.hostname.toLowerCase())) return "";
    return trimmed;
  } catch {
    return "";
  }
}
