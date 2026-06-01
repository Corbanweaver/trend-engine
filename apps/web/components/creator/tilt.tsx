"use client";

import { type ReactNode, useRef } from "react";

import { cn } from "@/lib/utils";

/**
 * Interactive 3D tilt: the wrapped element rotates in perspective toward the
 * pointer, then eases back on leave. Disabled for reduced-motion + touch.
 */
export function Tilt({
  children,
  className,
  max = 7,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || e.pointerType === "touch") return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(1100px) rotateY(${px * max}deg) rotateX(${-py * max}deg)`;
  };

  const reset = () => {
    const el = ref.current;
    if (el) el.style.transform = "";
  };

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      className={cn("transition-transform duration-200 ease-out will-change-transform", className)}
      style={{ transformStyle: "preserve-3d" }}
    >
      {children}
    </div>
  );
}
