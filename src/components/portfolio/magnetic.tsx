"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";

/**
 * Nudges its children toward the cursor while hovered and springs them back
 * to rest on leave. Transform-only (compositor work, no paint), driven by
 * motion values so pointer moves never re-render React. Inert under
 * prefers-reduced-motion and for non-mouse pointers (touch/pen), where the
 * springs simply stay at rest.
 */
export function Magnetic({
  children,
  strength = 0.2,
  className,
  style,
}: {
  children: React.ReactNode;
  /** Fraction of the cursor's offset from center applied as translation. */
  strength?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 280, damping: 22, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 280, damping: 22, mass: 0.5 });

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduce || e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={className}
      style={{ x: sx, y: sy, ...style }}
    >
      {children}
    </motion.div>
  );
}
