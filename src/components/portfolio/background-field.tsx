"use client";

import { useEffect, useRef } from "react";

// Sparse → dense ASCII ramp. The leading space keeps the field mostly empty so
// it reads as faint texture behind the grid, not a wall of characters.
const RAMP = "  ...:::-==+++*#%@";

/**
 * Ambient ASCII flow field rendered behind the bento grid. A few overlapping
 * sine waves make a slowly drifting plasma; the pointer adds a soft ripple.
 * Replaces the old pair of blurred fade-in orbs.
 *
 * Gating mirrors the previous component:
 *   - reduced-motion or low perf tier  → paint a single static frame (or skip)
 *   - card expanded (`paused`)         → freeze the animation loop
 * One DOM text write per throttled frame keeps it cheap; the loop also bails
 * while the tab is hidden.
 */
export function BackgroundField({
  reduce,
  lite = false,
  paused = false,
}: {
  reduce: boolean;
  lite?: boolean;
  paused?: boolean;
}) {
  const preRef = useRef<HTMLPreElement>(null);
  const mouse = useRef({ x: 0.5, y: 0.5, active: false });
  const pausedRef = useRef(paused);

  // Keep the loop's pause flag in sync without re-subscribing the rAF effect.
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  // Reduced motion: no animated background at all (keeps the page perfectly still).
  const enabled = !reduce;

  useEffect(() => {
    if (!enabled) return;
    const pre = preRef.current;
    if (!pre) return;

    // Measure one character cell so the grid matches the rendered monospace glyphs.
    const probe = document.createElement("span");
    probe.textContent = "M".repeat(40);
    probe.style.cssText =
      "position:absolute;visibility:hidden;white-space:pre;font:inherit;";
    pre.appendChild(probe);
    const cellW = probe.getBoundingClientRect().width / 40 || 8.4;
    const cs = getComputedStyle(pre);
    const lineH =
      parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2 || 17;
    pre.removeChild(probe);

    let cols = 1;
    let rows = 1;
    const measure = () => {
      const r = pre.getBoundingClientRect();
      cols = Math.max(8, Math.floor(r.width / cellW) + 1);
      rows = Math.max(6, Math.floor(r.height / lineH) + 1);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(pre);

    const onMove = (e: PointerEvent) => {
      const r = pre.getBoundingClientRect();
      mouse.current.x = (e.clientX - r.left) / r.width;
      mouse.current.y = (e.clientY - r.top) / r.height;
      mouse.current.active = true;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const last = RAMP.length - 1;
    const draw = (time: number) => {
      const t = time * 0.001;
      const { x: mx, y: my, active } = mouse.current;
      let s = "";
      for (let y = 0; y < rows; y++) {
        const ny = y / rows;
        for (let x = 0; x < cols; x++) {
          const nx = x / cols;
          let v =
            Math.sin(nx * 6 + t * 0.78) +
            Math.sin(ny * 4 - t * 0.6) +
            Math.sin((nx + ny) * 5 + t * 0.98) +
            Math.sin(Math.hypot(nx - 0.5, ny - 0.5) * 10 - t * 0.85);
          if (active) {
            const d = Math.hypot(nx - mx, ny - my);
            v += 2.2 * Math.sin(d * 20 - t * 5) * Math.exp(-d * 4.5);
          }
          let n = (v + 4.5) / 9;
          n = n < 0 ? 0 : n > 1 ? 1 : n;
          s += RAMP[(n * last) | 0];
        }
        if (y < rows - 1) s += "\n";
      }
      pre.textContent = s;
    };

    // Static tier (low perf): paint once and stop — texture without a render loop.
    if (lite) {
      draw(0);
      return () => {
        ro.disconnect();
        window.removeEventListener("pointermove", onMove);
      };
    }

    let raf = 0;
    let prev = 0;
    const interval = 1000 / 24; // ~24fps — smooth drift, still light on the CPU
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (pausedRef.current || document.hidden) return;
      if (now - prev < interval) return;
      prev = now;
      draw(now);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, [enabled, lite]);

  if (!enabled) return null;

  return (
    <pre
      ref={preRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
      style={{
        margin: 0,
        zIndex: 0,
        fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
        fontSize: "clamp(11px, 1vw, 15px)",
        lineHeight: 1.2,
        letterSpacing: "0.12em",
        color: "var(--cream)",
        opacity: 0.06,
        whiteSpace: "pre",
        // Fade the texture toward the edges so it melts into the ink background.
        WebkitMaskImage:
          "radial-gradient(120% 90% at 50% 30%, #000 0%, rgba(0,0,0,0.5) 55%, transparent 100%)",
        maskImage:
          "radial-gradient(120% 90% at 50% 30%, #000 0%, rgba(0,0,0,0.5) 55%, transparent 100%)",
        transition: "opacity 0.6s ease",
      }}
    />
  );
}
