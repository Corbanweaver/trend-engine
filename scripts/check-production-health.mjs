const siteUrl = (process.env.SITE_URL || "https://www.contentideamaker.com").replace(
  /\/$/,
  "",
);
const healthSecret = process.env.HEALTHCHECK_SECRET || process.env.OPERATIONAL_API_KEY || "";
const timeoutMs = Number(process.env.HEALTHCHECK_TIMEOUT_MS || 15000);

function withTimeout() {
  return AbortSignal.timeout(timeoutMs);
}

async function checkJson(path, options = {}) {
  const url = `${siteUrl}${path}`;
  const started = Date.now();
  const response = await fetch(url, {
    ...options,
    cache: "no-store",
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
  console.log(`${marker} ${name}: HTTP ${result.status} in ${result.latencyMs}ms`);
  if (!result.ok) {
    console.log(JSON.stringify(result.body, null, 2));
  }
}

const failures = [];

try {
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
