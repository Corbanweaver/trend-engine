import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-svh overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-[-6rem] h-80 w-80 animate-pulse rounded-full bg-fuchsia-500/25 blur-3xl" />
        <div className="absolute right-[-5rem] top-10 h-96 w-96 animate-pulse rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-[-7rem] left-1/3 h-96 w-96 animate-pulse rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-7">
        <Link
          href="/"
          className="fluid-transition text-sm font-semibold tracking-[0.18em] text-white/95 hover:text-cyan-200"
        >
          Trend Engine
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/pricing"
            className="fluid-transition font-medium text-slate-300 hover:text-white"
          >
            Pricing
          </Link>
        </nav>
      </header>

      <section className="relative mx-auto flex min-h-[calc(100svh-5.5rem)] w-full max-w-6xl flex-col items-center justify-center px-6 py-18 text-center">
        <span className="glass-surface hairline-ring rounded-full border border-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
          Trend Engine
        </span>

        <h1 className="mt-8 max-w-5xl text-balance bg-gradient-to-r from-white via-cyan-100 to-fuchsia-200 bg-clip-text text-5xl font-extrabold leading-tight text-transparent sm:text-6xl lg:text-7xl">
          Turn Trends Into Scroll-Stopping Content
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-300/95">
          Discover viral trends and generate AI video ideas instantly
        </p>

        <a
          href="/dashboard"
          className="fluid-transition mt-12 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-indigo-500 px-10 py-4 text-base font-bold text-slate-950 shadow-[0_0_40px_rgba(56,189,248,0.45)] hover:-translate-y-0.5 hover:shadow-[0_0_50px_rgba(56,189,248,0.65)]"
        >
          Start Finding Trends
        </a>
      </section>
    </main>
  );
}
