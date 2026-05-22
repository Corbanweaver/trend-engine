const affiliateStorageKey = "trendboard:affiliate_attribution";

const affiliateParamKeys = [
  "ref",
  "affiliate",
  "affiliate_id",
  "affiliate_ref",
  "creator",
  "creator_id",
] as const;

export type AffiliateParamKey = (typeof affiliateParamKeys)[number];

export type AffiliateAttribution = {
  code: string;
  param: AffiliateParamKey;
  landingPath: string;
  capturedAt: string;
};

function isAffiliateParamKey(value: string): value is AffiliateParamKey {
  return (affiliateParamKeys as readonly string[]).includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function normalizeAffiliateCode(value: string | null | undefined) {
  const normalized = value
    ?.trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 64);

  return normalized || null;
}

function normalizeAttribution(value: unknown): AffiliateAttribution | null {
  if (!isRecord(value)) return null;
  const code = normalizeAffiliateCode(
    typeof value.code === "string" ? value.code : null,
  );
  const param =
    typeof value.param === "string" && isAffiliateParamKey(value.param)
      ? value.param
      : "ref";
  const landingPath =
    typeof value.landingPath === "string" && value.landingPath.startsWith("/")
      ? value.landingPath.slice(0, 180)
      : "/";
  const capturedAt =
    typeof value.capturedAt === "string" ? value.capturedAt : "";

  if (!code) return null;
  return {
    code,
    param,
    landingPath,
    capturedAt: capturedAt || new Date().toISOString(),
  };
}

export function readAffiliateAttribution(): AffiliateAttribution | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(affiliateStorageKey);
    return normalizeAttribution(raw ? JSON.parse(raw) : null);
  } catch {
    return null;
  }
}

export function getAffiliateFromSearchParams(
  params: URLSearchParams,
  landingPath = "/",
): AffiliateAttribution | null {
  for (const key of affiliateParamKeys) {
    const code = normalizeAffiliateCode(params.get(key));
    if (code) {
      return {
        code,
        param: key,
        landingPath:
          landingPath.startsWith("/") && !landingPath.startsWith("//")
            ? landingPath.slice(0, 180)
            : "/",
        capturedAt: new Date().toISOString(),
      };
    }
  }

  return null;
}

export function captureAffiliateAttribution(): AffiliateAttribution | null {
  if (typeof window === "undefined") return null;

  const current = getAffiliateFromSearchParams(
    new URLSearchParams(window.location.search),
    `${window.location.pathname}${window.location.search}`,
  );
  if (!current) return readAffiliateAttribution();

  try {
    window.localStorage.setItem(affiliateStorageKey, JSON.stringify(current));
  } catch {
    /* affiliate tracking should never block the UI */
  }

  return current;
}

export function appendAffiliateToUrl(
  url: string,
  affiliate: AffiliateAttribution | null,
) {
  if (!affiliate) return url;
  const [base, hash] = url.split("#");
  const separator = base.includes("?") ? "&" : "?";
  const params = new URLSearchParams({
    affiliate_ref: affiliate.code,
    affiliate_param: affiliate.param,
  });
  return `${base}${separator}${params.toString()}${hash ? `#${hash}` : ""}`;
}

export function affiliateToSignupMetadata(
  affiliate: AffiliateAttribution | null,
) {
  if (!affiliate) return undefined;
  return {
    affiliate_ref: affiliate.code,
    affiliate_param: affiliate.param,
    affiliate_landing_path: affiliate.landingPath,
    affiliate_captured_at: affiliate.capturedAt,
  };
}
