"use client";

import { useEffect } from "react";

export function PwaRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Installation support should never affect normal browsing.
      });
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(register, { timeout: 4000 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = globalThis.setTimeout(register, 1500);
    return () => globalThis.clearTimeout(timeoutId);
  }, []);

  return null;
}
