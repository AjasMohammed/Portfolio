import type { Variants } from "framer-motion";
import { ease } from "./constants";

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease, delay: 0.05 },
  },
  exit: { opacity: 0, y: -6, transition: { duration: 0.18, ease } },
};

export const stagger: Variants = {
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.12 } },
};
