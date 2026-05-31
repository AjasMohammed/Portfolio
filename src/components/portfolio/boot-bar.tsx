"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

const SEGMENTS = 26;

/**
 * ASCII progress bar for the boot overlay — `[████░░░░░] 42%`. Fills smoothly
 * over `duration` ms, then idles full. Reduced-motion renders it complete.
 * Purely decorative; the real boot timing lives in PortfolioShell.
 */
export function BootBar({ duration = 1050 }: { duration?: number }) {
  const reduce = useReducedMotion();
  const [p, setP] = useState(0);

  useEffect(() => {
    // Reduced motion: nothing to animate — the bar is rendered full below.
    if (reduce) return;
    let raf = 0;
    let t0: number | null = null;
    const tick = (now: number) => {
      if (t0 === null) t0 = now;
      const next = Math.min(1, (now - t0) / duration);
      // ease-out so it decelerates into "ready"
      setP(1 - Math.pow(1 - next, 2));
      if (next < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce, duration]);

  // When reduced-motion is on, show a completed bar without animating state.
  const shown = reduce ? 1 : p;
  const filled = Math.round(shown * SEGMENTS);
  const pct = Math.round(shown * 100);

  return (
    <p
      className="t-mono-xs"
      aria-hidden
      style={{
        letterSpacing: "0.12em",
        fontSize: "clamp(10px,0.8vw,13px)",
        opacity: 0.7,
        fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
      }}
    >
      <span style={{ opacity: 0.55 }}>[</span>
      <span style={{ color: "var(--orange)" }}>{"█".repeat(filled)}</span>
      <span style={{ opacity: 0.4 }}>{"░".repeat(SEGMENTS - filled)}</span>
      <span style={{ opacity: 0.55 }}>]</span>{" "}
      <span style={{ opacity: 0.8 }}>{String(pct).padStart(3, " ")}%</span>
    </p>
  );
}
