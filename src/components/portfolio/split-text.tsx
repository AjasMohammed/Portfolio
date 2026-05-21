"use client";

import { useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import { ease } from "./constants";

/* ────────────────── Text animation primitives ────────────────── */

export type SplitTextProps = {
  children: string;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  duration?: number;
  stagger?: number;
  reveal?: "y" | "clip";
  /** re-trigger animation when this value changes */
  triggerKey?: string | number;
  as?: keyof React.JSX.IntrinsicElements;
};

export function SplitText({
  children,
  className,
  style,
  delay = 0,
  duration = 0.7,
  stagger = 0.022,
  reveal = "y",
  triggerKey,
  as: Tag = "span",
}: SplitTextProps) {
  const words = useMemo(() => children.split(/(\s+)/), [children]);

  const parent: Variants = {
    hidden: {},
    show: {
      transition: { delayChildren: delay, staggerChildren: stagger },
    },
  };
  const child: Variants =
    reveal === "y"
      ? {
          hidden: { y: "110%", opacity: 0 },
          show: {
            y: "0%",
            opacity: 1,
            transition: { duration, ease },
          },
        }
      : {
          hidden: { clipPath: "inset(0 100% 0 0)" },
          show: { clipPath: "inset(0 0% 0 0)", transition: { duration, ease } },
        };

  return (
    <Tag className={className} style={style}>
      <motion.span
        key={triggerKey}
        variants={parent}
        initial="hidden"
        animate="show"
        className="inline"
      >
        {words.map((w, wi) => {
          if (/^\s+$/.test(w)) return <span key={`s-${wi}`}>{w}</span>;
          return (
            <span key={`w-${wi}`} className="split-line inline-block align-baseline">
              {[...w].map((ch, ci) => (
                <motion.span
                  key={`c-${wi}-${ci}`}
                  variants={child}
                  className="split-char"
                >
                  {ch}
                </motion.span>
              ))}
            </span>
          );
        })}
      </motion.span>
    </Tag>
  );
}
