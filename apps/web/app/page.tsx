import { Button } from "@/components/ui/button";
import { getApiBaseUrl } from "@/lib/api";

async function BackendStatus() {
  const base = getApiBaseUrl();
  let label: string;
  let detail: string;

  try {
    const res = await fetch(`${base}/health`, { cache: "no-store" });
    const body = (await res.json().catch(() => null)) as
      | { status?: string }
      | null;
    if (res.ok && body?.status === "ok") {
      label = "Connected";
      detail = `FastAPI at ${base} returned healthy.`;
    } else {
      label = "Unexpected response";
      detail = `${base}/health → HTTP ${res.status}`;
    }
  } catch {
    label = "Unreachable";
    detail = `Could not reach ${base}. Start the API: cd artifacts/fastapi-server && python main.py`;
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}

export default function Home() {
  return (
    <main className="mx-auto flex min-h-svh max-w-lg flex-col justify-center gap-6 px-4 py-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Content Engine — web
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Next.js + shadcn/ui + Tailwind. API base:{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
            {getApiBaseUrl()}
          </code>
        </p>
      </div>

      <BackendStatus />

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <a href="/dashboard">Trend dashboard</a>
        </Button>
        <Button variant="secondary" asChild>
          <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer">
            Open API docs
          </a>
        </Button>
        <Button variant="outline" asChild>
          <a
            href={`${getApiBaseUrl()}/health`}
            target="_blank"
            rel="noreferrer"
          >
            Health JSON
          </a>
        </Button>
      </div>
    </main>
  );
}
