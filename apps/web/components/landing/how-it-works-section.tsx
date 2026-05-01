"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type { LucideIcon } from "lucide-react";
import { ScanLine, Sparkles, Target } from "lucide-react";

import { cn } from "@/lib/utils";

export type HowStep = {
  step: string;
  title: string;
  body: string;
};

const stepIcons: LucideIcon[] = [Target, ScanLine, Sparkles];

export function HowItWorksSection({
  steps,
}: {
  steps: readonly HowStep[];
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="relative z-20 mx-auto w-full max-w-6xl px-6 py-20"
    >
      <div className="text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.28em] text-primary dark:text-cyan-200">
          How it works
        </span>
        <h2 className="mt-4 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
          From signal to script in three moves
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          Built for creators who want speed without sacrificing depth—one flow,
          many platforms.
        </p>
      </div>

      <div className="relative mt-14 md:mt-16">
        <div className="hidden md:flex md:items-center md:justify-center md:gap-0 md:px-2">
          {steps.flatMap((s, i) => {
            const Icon = stepIcons[i] ?? Sparkles;
            const isLast = i === steps.length - 1;
            const iconEl = (
              <div
                key={`icon-${s.step}`}
                className="flex shrink-0 justify-center"
                style={{ width: "5.25rem" }}
              >
                <div
                  className={cn(
                    "relative z-10 flex size-[3.25rem] items-center justify-center rounded-2xl border-2 border-primary/30 bg-card shadow-[0_0_24px_rgba(59,130,246,0.14)] transition-all duration-500 dark:border-cyan-400/35 dark:shadow-[0_0_28px_rgba(34,211,238,0.14)]",
                    visible && "how-step-icon-pop",
                  )}
                  style={{
                    animationDelay: visible ? `${100 + i * 90}ms` : "0ms",
                  }}
                >
                  <Icon className="size-6 text-primary dark:text-cyan-300" />
                </div>
              </div>
            );
            if (isLast) return [iconEl];
            const lineEl = (
              <div
                key={`line-${s.step}`}
                className="mx-2 h-[3px] min-h-[3px] min-w-[2rem] flex-1 max-w-[8rem] overflow-hidden rounded-full bg-muted/60 dark:bg-white/10"
                aria-hidden
              >
                <div
                  className={cn(
                    "h-full w-full origin-left rounded-full bg-gradient-to-r from-primary via-cyan-400 to-fuchsia-400 transition-transform duration-1000 ease-out",
                    visible ? "scale-x-100" : "scale-x-0",
                  )}
                  style={{
                    transitionDelay: visible ? `${180 + i * 200}ms` : "0ms",
                  }}
                />
              </div>
            );
            return [iconEl, lineEl];
          })}
        </div>

        <ul className="relative mt-0 flex flex-col gap-10 md:mt-10 md:grid md:grid-cols-3 md:gap-8">
          {steps.map((s, i) => {
            const Icon = stepIcons[i] ?? Sparkles;
            return (
              <li
                key={s.step}
                className={cn(
                  "relative flex gap-4 md:block md:text-center",
                  visible && "how-step-reveal",
                )}
                style={
                  {
                    ["--how-delay" as string]: `${60 + i * 100}ms`,
                  } as CSSProperties
                }
              >
                <div className="flex shrink-0 flex-col items-center md:hidden">
                  <div className="relative flex flex-col items-center">
                    <div
                      className={cn(
                        "flex size-14 items-center justify-center rounded-2xl border-2 border-primary/30 bg-card shadow-sm",
                        visible && "how-step-icon-pop",
                      )}
                      style={{
                        animationDelay: visible ? `${100 + i * 90}ms` : "0ms",
                      }}
                    >
                      <Icon className="size-6 text-primary dark:text-cyan-300" />
                    </div>
                    {i < steps.length - 1 && (
                      <div
                        className="mt-2 h-12 w-px overflow-hidden rounded-full bg-border dark:bg-white/15"
                        aria-hidden
                      >
                        <div
                          className={cn(
                            "h-full w-full origin-top bg-gradient-to-b from-primary to-cyan-400 transition-transform duration-700 ease-out",
                            visible ? "scale-y-100" : "scale-y-0",
                          )}
                          style={{
                            transitionDelay: visible ? `${200 + i * 150}ms` : "0ms",
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="min-w-0 flex-1 rounded-2xl border border-border bg-card/80 p-6 text-left shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/50 md:p-8 md:text-center">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary dark:text-cyan-300">
                    Step {s.step}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold">{s.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {s.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
