"use client";

import { motion } from "framer-motion";

/**
 * Two large blurred orbs that drift slowly behind the bento grid. Each is a
 * `blur-3xl` (~64px) layer composited every frame, so on low-end devices we
 * skip them entirely. When a card is expanded, the orbs are paused — there's
 * nothing for the user to see behind the backdrop overlay anyway, and pausing
 * frees the compositor during the shared-layout expand animation.
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
  if (reduce || lite) return null;

  const orbA = paused
    ? { x: "-20%", y: "-10%" }
    : { x: ["-20%", "-12%", "-20%"], y: ["-10%", "-4%", "-10%"] };
  const orbB = paused
    ? { x: "5%", y: "10%" }
    : { x: ["5%", "0%", "5%"], y: ["10%", "5%", "10%"] };

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        initial={{ x: "-20%", y: "-10%" }}
        animate={orbA}
        transition={
          paused
            ? { duration: 0.4 }
            : { duration: 22, repeat: Infinity, ease: "easeInOut" }
        }
        className="absolute -top-32 -left-40 h-[55svh] w-[55svh] rounded-full bg-cream opacity-[0.05] blur-3xl"
      />
      <motion.div
        initial={{ x: "5%", y: "10%" }}
        animate={orbB}
        transition={
          paused
            ? { duration: 0.4 }
            : { duration: 28, repeat: Infinity, ease: "easeInOut" }
        }
        className="absolute bottom-[-20svh] right-[-10vw] h-[70svh] w-[70svh] rounded-full bg-cream opacity-[0.04] blur-3xl"
      />
    </div>
  );
}
