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

type AffiliateMetadata = {
  affiliate_ref?: unknown;
  affiliate_param?: unknown;
  affiliate_landing_path?: unknown;
  affiliate_captured_at?: unknown;
  affiliate?: unknown;
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

function normalizeParam(value: unknown): AffiliateParamKey {
  return typeof value === "string" && isAffiliateParamKey(value)
    ? value
    : "ref";
}

function normalizeLandingPath(value: unknown): string {
  if (typeof value !== "string") return "/";
  return value.startsWith("/") && !value.startsWith("//")
    ? value.slice(0, 180)
    : "/";
}

function normalizeCapturedAt(value: unknown): string {
  if (typeof value !== "string") return new Date().toISOString();
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? new Date().toISOString() : value;
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

export function getAffiliateFromMetadata(
  metadata: AffiliateMetadata | null | undefined,
): AffiliateAttribution | null {
  if (!metadata) return null;

  const directCode = normalizeAffiliateCode(
    typeof metadata.affiliate_ref === "string"
      ? metadata.affiliate_ref
      : undefined,
  );
  if (directCode) {
    return {
      code: directCode,
      param: normalizeParam(metadata.affiliate_param),
      landingPath: normalizeLandingPath(metadata.affiliate_landing_path),
      capturedAt: normalizeCapturedAt(metadata.affiliate_captured_at),
    };
  }

  return normalizeAttribution(metadata.affiliate);
}

type FormValueReader = {
  get(name: string): FormDataEntryValue | string | null;
};

export function getAffiliateFromFormData(
  formData: FormValueReader,
): AffiliateAttribution | null {
  const code = normalizeAffiliateCode(
    typeof formData.get("affiliate_ref") === "string"
      ? String(formData.get("affiliate_ref"))
      : undefined,
  );
  if (!code) return null;

  return {
    code,
    param: normalizeParam(formData.get("affiliate_param")),
    landingPath: normalizeLandingPath(formData.get("affiliate_landing_path")),
    capturedAt: normalizeCapturedAt(formData.get("affiliate_captured_at")),
  };
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

export function affiliateToStripeMetadata(
  affiliate: AffiliateAttribution | null,
): Record<string, string> {
  if (!affiliate) return {};
  return {
    affiliate_ref: affiliate.code,
    affiliate_param: affiliate.param,
    affiliate_landing_path: affiliate.landingPath,
    affiliate_captured_at: affiliate.capturedAt,
  };
}
