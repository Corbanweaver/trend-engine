export default function Home() {
  return (
    <main className="relative min-h-svh overflow-hidden bg-gradient-to-br from-[#020617] via-[#0b1120] to-[#1e1b4b] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-[-6rem] h-80 w-80 animate-pulse rounded-full bg-fuchsia-500/25 blur-3xl" />
        <div className="absolute right-[-5rem] top-10 h-96 w-96 animate-pulse rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-[-7rem] left-1/3 h-96 w-96 animate-pulse rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      <section className="relative mx-auto flex min-h-svh w-full max-w-6xl flex-col items-center justify-center px-6 py-24 text-center">
        <span className="rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
          Content Idea Maker
        </span>

        <h1 className="mt-8 max-w-5xl text-balance bg-gradient-to-r from-white via-cyan-100 to-fuchsia-200 bg-clip-text text-5xl font-extrabold leading-tight text-transparent sm:text-6xl lg:text-7xl">
          Turn Trends Into Scroll-Stopping Content
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-300">
          Discover viral trends and generate AI video ideas instantly
        </p>

        <a
          href="/dashboard"
          className="mt-12 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-indigo-500 px-10 py-4 text-base font-bold text-slate-950 shadow-[0_0_40px_rgba(56,189,248,0.45)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_0_50px_rgba(56,189,248,0.65)]"
        >
          Start Finding Trends
        </a>
      </section>
    </main>
  );
}
