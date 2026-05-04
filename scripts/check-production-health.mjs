const siteUrl = (process.env.SITE_URL || "https://www.contentideamaker.com").replace(
  /\/$/,
  "",
);
const healthSecret = process.env.HEALTHCHECK_SECRET || process.env.OPERATIONAL_API_KEY || "";
const timeoutMs = Number(process.env.HEALTHCHECK_TIMEOUT_MS || 15000);
const redirects = new Set([301, 302, 303, 307, 308]);

function withTimeout() {
  return AbortSignal.timeout(timeoutMs);
}

async function checkStatus(path, expectedStatuses, options = {}) {
  const url = `${siteUrl}${path}`;
  const started = Date.now();
  const response = await fetch(url, {
    cache: "no-store",
    signal: withTimeout(),
    redirect: "manual",
    ...options,
  });

  const responseLocation = response.headers.get("location");
  return {
    path,
    url,
    status: response.status,
    ok: expectedStatuses.includes(response.status),
    location: responseLocation,
    latencyMs: Date.now() - started,
    text: await response.text().catch(() => ""),
  };
}

async function checkJson(path, options = {}) {
  const url = `${siteUrl}${path}`;
  const started = Date.now();
  const response = await fetch(url, {
    ...options,
    cache: "no-store",
    redirect: "manual",
    signal: withTimeout(),
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  return {
    url,
    status: response.status,
    ok: response.ok,
    latencyMs: Date.now() - started,
    body,
  };
}

function printResult(name, result) {
  const marker = result.ok ? "PASS" : "FAIL";
  const locationInfo = result.location ? ` -> ${result.location}` : "";
  console.log(`${marker} ${name}: HTTP ${result.status} in ${result.latencyMs}ms${locationInfo}`);
  if (!result.ok) {
    console.log(JSON.stringify(result.body, null, 2));
    if (result.text) {
      console.log(result.text.slice(0, 200));
    }
  }
}

const failures = [];
const publicPageChecks = [
  { name: "homepage", path: "/", expected: [200, ...redirects] },
  { name: "pricing", path: "/pricing", expected: [200] },
  { name: "terms", path: "/terms", expected: [200] },
  { name: "privacy", path: "/privacy", expected: [200] },
  { name: "support", path: "/support", expected: [200] },
  { name: "login", path: "/login", expected: [200] },
  { name: "signup", path: "/signup", expected: [200] },
  { name: "dashboard", path: "/dashboard", expected: [200, ...redirects] },
  { name: "saved", path: "/saved", expected: [200, ...redirects] },
  { name: "alerts", path: "/alerts", expected: [200, ...redirects] },
  { name: "admin", path: "/admin", expected: [200, ...redirects] },
  { name: "calendar", path: "/calendar", expected: [200, ...redirects] },
];

try {
  for (const check of publicPageChecks) {
    const result = await checkStatus(check.path, check.expected);
    printResult(check.name, result);
    if (!result.ok) {
      failures.push(`${check.name} check failed for ${check.path}.`);
    }
  }

  const basic = await checkJson("/api/health");
  printResult("public health", basic);
  if (!basic.ok || basic.body?.status !== "ok") {
    failures.push("Public health check failed.");
  }

  if (healthSecret) {
    const deep = await checkJson("/api/health/deep", {
      headers: {
        Authorization: `Bearer ${healthSecret}`,
      },
    });
    printResult("deep health", deep);
    if (!deep.ok || deep.body?.status !== "ok") {
      failures.push("Deep health check failed.");
    }
  } else {
    console.log("SKIP deep health: HEALTHCHECK_SECRET is not set.");
  }
} catch (error) {
  failures.push(error instanceof Error ? error.message : "Unknown monitor failure.");
}

if (failures.length > 0) {
  console.error("\nProduction health monitor failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("\nProduction health monitor passed.");
