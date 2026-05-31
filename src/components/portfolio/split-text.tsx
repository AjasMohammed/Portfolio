"use client";

import { useEffect, useMemo, useRef } from "react";
import { useReducedMotion } from "framer-motion";

/* ────────────────── Text animation primitives ────────────────── */

export type SplitTextProps = {
  children: string;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  duration?: number;
  stagger?: number;
  /** Kept for API compatibility — every reveal now decodes through ASCII glyphs. */
  reveal?: "y" | "clip" | "scramble";
  /** re-trigger animation when this value changes */
  triggerKey?: string | number;
  as?: keyof React.JSX.IntrinsicElements;
};

// Decode alphabet — uppercase + digits + a few code-flavored symbols. The
// settling character is always the real glyph; these only flicker on the way in.
const GLYPHS = "ABCDEFGHIJKLMNPQRSTUVWXYZ0123456789#%&@*+=-<>/\\{}[]";
const randGlyph = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];

/**
 * Renders text that "decodes" into place: each character flickers through random
 * ASCII glyphs before resolving to the real one, cascading left → right. The
 * real glyph is always present (opacity 0) so it reserves its own width — the
 * scramble overlays it absolutely and never reflows, which keeps proportional
 * display faces and `<br/>`-driven line breaks rock-steady mid-animation.
 *
 * Honors prefers-reduced-motion (renders final text, no animation). Timing
 * (`delay`, `duration`, `stagger`) maps 1:1 onto the old SplitText choreography,
 * so every existing call site keeps its sequencing for free.
 *
 * The animation walks the rendered `.split-char` cells (in document order) and
 * drives their two child spans directly — no reliance on custom data-attribute
 * serialization, and each cell's start time is recomputed from its index using
 * the same `delay + i * stagger` formula used at render time.
 */
export function SplitText({
  children,
  className,
  style,
  delay = 0,
  duration = 0.7,
  stagger = 0.022,
  triggerKey,
  as: Tag = "span",
}: SplitTextProps) {
  const reduce = useReducedMotion();
  const words = useMemo(() => children.split(/(\s+)/), [children]);
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (reduce) return;
    const root = rootRef.current;
    if (!root) return;

    // Per-char flicker window — kept short and capped so the decode reads as a
    // quick "snap into place" rather than a long shimmer, while the cascade
    // (delay + i*stagger) still gives the line its left→right sweep.
    const flicker = Math.min(420, Math.max(220, duration * 1000 * 0.5));
    // Glyph swap cadence, in ms — time-based (not per-frame-random) so the
    // flicker speed is identical on 60Hz and 120Hz displays and never strobes.
    const SWAP_MS = 45;

    const cells = Array.from(
      root.querySelectorAll<HTMLElement>(".split-char"),
    ).map((el, i) => {
      const start = (delay + i * stagger) * 1000;
      return {
        finalEl: el.children[0] as HTMLElement | undefined,
        glyphEl: el.children[1] as HTMLElement | undefined,
        start,
        end: start + flicker,
        settled: false,
        lastSwap: -Infinity,
      };
    });
    if (cells.length === 0) return;

    let raf = 0;
    let t0: number | null = null;

    const frame = (now: number) => {
      if (t0 === null) t0 = now;
      const t = now - t0;
      let remaining = false;

      for (const c of cells) {
        if (c.settled || !c.glyphEl || !c.finalEl) continue;
        if (t < c.start) {
          remaining = true;
          continue;
        }
        if (t >= c.end) {
          c.settled = true;
          c.glyphEl.style.opacity = "0";
          c.finalEl.style.opacity = "1";
          continue;
        }
        remaining = true;
        // Swap on a fixed time cadence so the flicker feels even and smooth.
        if (t - c.lastSwap >= SWAP_MS) {
          c.lastSwap = t;
          c.glyphEl.textContent = randGlyph();
        }
      }

      if (remaining) raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [reduce, children, delay, duration, stagger, triggerKey]);

  return (
    <Tag className={className} style={style}>
      <span ref={rootRef} key={triggerKey} className="inline">
        {words.map((w, wi) => {
          if (/^\s+$/.test(w)) return <span key={`s-${wi}`}>{w}</span>;
          return (
            <span
              key={`w-${wi}`}
              className="split-line inline-block align-baseline"
            >
              {[...w].map((ch, ci) => (
                <span
                  key={`c-${wi}-${ci}`}
                  className="split-char"
                  style={{ position: "relative", display: "inline-block" }}
                >
                  {/* Real glyph — reserves the cell's width; revealed on settle */}
                  <span
                    style={{
                      opacity: reduce ? 1 : 0,
                      transition: "opacity 0.12s ease-out",
                    }}
                  >
                    {ch}
                  </span>
                  {/* Scramble overlay — absolute, so its width never disturbs layout */}
                  {!reduce && (
                    <span
                      aria-hidden
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                      }}
                    />
                  )}
                </span>
              ))}
            </span>
          );
        })}
      </span>
    </Tag>
  );
}
