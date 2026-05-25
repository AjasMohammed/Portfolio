"use client";

import { motion } from "framer-motion";
import type { GithubData } from "@/lib/github";
import type { Testimonial } from "@/lib/testimonials";
import { ease, RADIUS, SKY_BG } from "./constants";
import type { CardId, Variant } from "./types";
import { fadeUp } from "./animations";
import { ImageExpanded } from "./cards/image-card";
import { LetterExpanded } from "./cards/letter-card";
import { BioExpanded } from "./cards/bio-card";
import { AnalyticsExpanded } from "./cards/analytics-card";
import { TestimonialsExpanded } from "./cards/testimonials-card";

/* ───────────────────────── CARDS ───────────────────────── */

export function surfaceStyles(v: Variant) {
  if (v === "cream") return { bg: "var(--cream)", fg: "var(--orange-deep)" };
  if (v === "sky") return { bg: SKY_BG, fg: "#0f1f3a" };
  return { bg: "var(--orange-deep)", fg: "var(--cream)" };
}

export function BentoCard({
  id,
  expanded,
  onOpen,
  variant,
  children,
  bleed = false,
  overflowBleed = false,
  extraStyle,
  className,
  layoutKey,
}: {
  id: CardId;
  expanded: CardId | null;
  onOpen: (id: CardId) => void;
  variant: Variant;
  children: React.ReactNode;
  bleed?: boolean;
  overflowBleed?: boolean;
  extraStyle?: React.CSSProperties;
  className?: string;
  layoutKey?: string;
}) {
  const isHidden = expanded === id;
  const otherOpen = expanded !== null && expanded !== id;
  const surface = surfaceStyles(variant);
  const interactive = !otherOpen && !isHidden;
  const allowBleed = overflowBleed && !otherOpen;

  const hoverShadow =
    variant === "cream"
      ? "0 18px 40px -14px rgba(192,68,15,0.45), 0 4px 12px -6px rgba(192,68,15,0.25)"
      : variant === "sky"
        ? "0 18px 40px -14px rgba(15,31,58,0.5), 0 4px 12px -6px rgba(15,31,58,0.28)"
        : "0 20px 44px -14px rgba(0,0,0,0.55), 0 6px 14px -6px rgba(0,0,0,0.35)";

  return (
    <motion.div
      layoutId={layoutKey ?? `card-${id}`}
      animate={{ opacity: otherOpen ? 0.25 : 1, scale: otherOpen ? 0.985 : 1 }}
      whileHover={
        interactive && id !== "bio" && id !== "letter" && id !== "analytics" && id !== "image"
          ? { scale: 1.012, y: -4, boxShadow: hoverShadow }
          : undefined
      }
      transition={{ duration: 0.4, ease }}
      style={{
        borderRadius: RADIUS,
        background: surface.bg,
        color: surface.fg,
        visibility: isHidden ? "hidden" : "visible",
        minWidth: 0,
        minHeight: 0,
        ...extraStyle,
      }}
      className={`relative ${allowBleed ? "" : "overflow-hidden"} ${className ?? ""}`}
    >
      <button
        type="button"
        onClick={() => onOpen(id)}
        className="group relative flex h-full w-full flex-col text-left outline-none cursor-pointer"
        style={{ borderRadius: "inherit" }}
      >
        {/* Bleed cards: image fills full container, chrome floats on top */}
        {bleed && (
          <div
            className={`absolute inset-0 z-[1] ${allowBleed ? "" : "overflow-hidden"}`}
            style={{ borderRadius: "inherit" }}
          >
            {children}
          </div>
        )}

        {/* Solid-card content fills full surface */}
        {!bleed && (
          <div
            className="relative z-[1] flex-1 min-h-0 min-w-0 overflow-hidden"
            style={{
              padding:
                "clamp(14px,1.8svh,22px) clamp(14px,1.5vw,22px) clamp(18px,2.2svh,28px)",
            }}
          >
            {children}
          </div>
        )}
      </button>
    </motion.div>
  );
}

export const innerPadding = {
  paddingTop: "clamp(36px,3.6svh,52px)",
  paddingRight: "clamp(12px,1vw,24px)",
  paddingBottom: "clamp(14px,1.6svh,24px)",
  paddingLeft: "clamp(14px,1.4vw,26px)",
};

export function ExpandedCard({
  id,
  github,
  testimonials,
  onClose,
  layoutKey,
}: {
  id: CardId;
  github: GithubData;
  testimonials: Testimonial[];
  onClose: () => void;
  layoutKey?: string;
}) {
  const variant: Variant =
    id === "image"
      ? "cream"
      : id === "letter"
        ? "sky"
        : "cream";
  const surface = surfaceStyles(variant);
  const isLetter = id === "letter";

  return (
    <motion.div
      layoutId={layoutKey ?? `card-${id}`}
      className="absolute inset-0 z-30 overflow-hidden compact:fixed compact:z-50 compact:rounded-none!"
      style={{
        borderRadius: RADIUS,
        background: surface.bg,
        color: surface.fg,
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="close"
        className="absolute top-[clamp(12px,1.4svh,18px)] right-[clamp(14px,1.6vw,24px)] z-40 inline-flex items-center justify-center transition-transform duration-300 hover:scale-110"
        style={{
          width: "clamp(28px,2.2vw,38px)",
          height: "clamp(28px,2.2vw,38px)",
          borderRadius: 999,
          border: `1px solid ${
            variant === "cream"
              ? "rgba(192,68,15,0.32)"
              : isLetter
                ? "rgba(15,31,58,0.4)"
                : "rgba(244,235,216,0.32)"
          }`,
          color: isLetter ? "#0f1f3a" : "currentColor",
          opacity: 0.85,
        }}
      >
        <svg
          width="50%"
          height="50%"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>

      {isLetter ? (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          exit="exit"
          className="absolute inset-0 overflow-hidden"
        >
          <LetterExpanded />
        </motion.div>
      ) : (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          exit="exit"
          className="absolute inset-0 overflow-hidden"
          style={innerPadding}
        >
          {id === "image" && <ImageExpanded />}
          {id === "bio" && <BioExpanded github={github} />}
          {id === "analytics" && <AnalyticsExpanded github={github} />}
          {id === "testimonials" && <TestimonialsExpanded items={testimonials} />}
        </motion.div>
      )}
    </motion.div>
  );
}
