"use client";

import { motion } from "framer-motion";

export function BackgroundField({ reduce }: { reduce: boolean }) {
  if (reduce) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        initial={{ x: "-20%", y: "-10%" }}
        animate={{ x: ["-20%", "-12%", "-20%"], y: ["-10%", "-4%", "-10%"] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-32 -left-40 h-[55svh] w-[55svh] rounded-full bg-cream opacity-[0.05] blur-3xl"
      />
      <motion.div
        initial={{ x: "5%", y: "10%" }}
        animate={{ x: ["5%", "0%", "5%"], y: ["10%", "5%", "10%"] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-20svh] right-[-10vw] h-[70svh] w-[70svh] rounded-full bg-cream opacity-[0.04] blur-3xl"
      />
    </div>
  );
}
