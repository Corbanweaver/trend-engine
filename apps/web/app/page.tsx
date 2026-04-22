export default function Home() {
  return (
    <main className="relative min-h-svh overflow-hidden bg-[#030712] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-[-8rem] h-96 w-96 animate-pulse rounded-full bg-fuchsia-500/25 blur-3xl" />
        <div className="absolute right-[-6rem] top-24 h-[28rem] w-[28rem] animate-pulse rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-[-10rem] left-1/3 h-[26rem] w-[26rem] animate-pulse rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(34,211,238,0.2),transparent_40%),radial-gradient(circle_at_85%_20%,rgba(217,70,239,0.22),transparent_35%),radial-gradient(circle_at_50%_90%,rgba(99,102,241,0.18),transparent_40%)]" />
      </div>

      <section className="relative mx-auto flex min-h-svh w-full max-w-6xl flex-col items-center justify-center px-6 py-20 text-center">
        <span className="rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-medium uppercase tracking-[0.22em] text-cyan-200">
          Content Idea Maker
        </span>
        <h1 className="mt-8 max-w-4xl text-balance bg-gradient-to-r from-white via-cyan-100 to-fuchsia-200 bg-clip-text text-5xl font-bold leading-tight text-transparent sm:text-6xl lg:text-7xl">
          Discover viral trends and turn them into addictive video ideas.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
          A premium creator intelligence workspace that scans trend signals
          across platforms, then generates ready-to-film concepts with hooks,
          angles, scripts, and SEO metadata.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <a
            href="/dashboard"
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 px-7 py-3.5 text-sm font-semibold text-slate-950 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(56,189,248,0.45)]"
          >
            Open Dashboard
            <span className="transition-transform group-hover:translate-x-0.5">
              ->
            </span>
          </a>
          <span className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm text-slate-300">
            Pinterest-style trend feed
          </span>
        </div>
      </section>
    </main>
  );
}
