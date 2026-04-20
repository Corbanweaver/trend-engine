import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center gap-6 px-4 text-center">
      <div>
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          That route does not exist in this app.
        </p>
      </div>
      <Button asChild>
        <Link href="/">Back to home</Link>
      </Button>
    </main>
  );
}
