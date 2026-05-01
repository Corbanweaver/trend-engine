import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-svh overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-[-6rem] h-80 w-80 animate-pulse rounded-full bg-blue-300/30 blur-3xl dark:bg-fuchsia-500/25" />
        <div className="absolute right-[-5rem] top-10 h-96 w-96 animate-pulse rounded-full bg-blue-400/20 blur-3xl dark:bg-cyan-500/20" />
        <div className="absolute bottom-[-7rem] left-1/3 h-96 w-96 animate-pulse rounded-full bg-blue-500/20 blur-3xl dark:bg-indigo-500/20" />
      </div>

      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-7">
        <Link
          href="/"
          className="fluid-transition text-sm font-semibold tracking-[0.18em] text-foreground hover:text-primary"
        >
          Trend Engine
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/pricing"
            className="fluid-transition font-medium text-muted-foreground hover:text-foreground"
          >
            Pricing
          </Link>
        </nav>
      </header>

      <section className="relative mx-auto flex min-h-[calc(100svh-5.5rem)] w-full max-w-6xl flex-col items-center justify-center px-6 py-18 text-center">
        <span className="glass-surface hairline-ring rounded-full border border-border bg-card px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary dark:text-cyan-200">
          Trend Engine
        </span>

        <h1 className="mt-8 max-w-5xl text-balance bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-5xl font-extrabold leading-tight text-transparent sm:text-6xl lg:text-7xl dark:from-white dark:via-cyan-100 dark:to-fuchsia-200">
          Turn Trends Into Scroll-Stopping Content
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
          Discover viral trends and generate AI video ideas instantly
        </p>

        <a
          href="/dashboard"
          className="fluid-transition mt-12 inline-flex items-center justify-center rounded-2xl bg-primary px-10 py-4 text-base font-bold text-primary-foreground shadow-[0_0_28px_rgba(59,130,246,0.35)] hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(59,130,246,0.45)] dark:bg-gradient-to-r dark:from-cyan-400 dark:to-indigo-500 dark:text-slate-950"
        >
          Start Finding Trends
        </a>
      </section>
    </main>
  );
}
