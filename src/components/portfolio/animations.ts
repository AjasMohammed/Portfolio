import type { Variants } from "framer-motion";
import { ease, CONTENT_BASE_DELAY } from "./constants";

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease, delay: 0.1 },
  },
  exit: { opacity: 0, y: -6, transition: { duration: 0.18, ease } },
};

export const stagger: Variants = {
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.12 } },
};

export const socialIconStagger: Variants = {
  hidden: {},
  show: {
    transition: {
      delayChildren: CONTENT_BASE_DELAY + 0.45,
      staggerChildren: 0.08,
    },
  },
};

export const socialIconItem: Variants = {
  hidden: { opacity: 0, scale: 0.3, y: 10 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.6, ease },
  },
};
