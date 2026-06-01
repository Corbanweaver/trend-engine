"use client";

import { useEffect, useRef } from "react";

/**
 * Fixed, mouse-reactive field of soft gradient "3D" blobs that drift on their
 * own and parallax toward the cursor. Pure CSS/JS — no WebGL — so it's fast,
 * mobile-safe, and degrades cleanly with prefers-reduced-motion.
 */
export function BlobField() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const onMove = (e: PointerEvent) => {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--bx", `${(x * 46).toFixed(1)}px`);
        el.style.setProperty("--by", `${(y * 46).toFixed(1)}px`);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden className="blob-field">
      <span className="blob blob-1" data-depth="1.4" />
      <span className="blob blob-2" data-depth="0.8" />
      <span className="blob blob-3" data-depth="1.1" />
      <span className="blob blob-4" data-depth="0.6" />
    </div>
  );
}
