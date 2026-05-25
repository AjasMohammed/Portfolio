"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "framer-motion";
import type { GithubData } from "@/lib/github";
import type { Testimonial } from "@/lib/testimonials";
import {
  ease,
  RADIUS,
  SKY_BG,
  LETTER_INK,
  LETTER_INK_SOFT,
} from "@/components/portfolio/constants";
import type { CardId } from "@/components/portfolio/types";
import { SplitText } from "@/components/portfolio/split-text";
import { BackgroundField } from "@/components/portfolio/background-field";
import { BentoCard, ExpandedCard } from "@/components/portfolio/card";
import { ImageInner } from "@/components/portfolio/cards/image-card";
import { BioCollapsed } from "@/components/portfolio/cards/bio-card";
import { LetterCollapsed, SocialCard, SocialMobileCells } from "@/components/portfolio/cards/letter-card";
import { AnalyticsCollapsed } from "@/components/portfolio/cards/analytics-card";
import { TestimonialsCollapsed } from "@/components/portfolio/cards/testimonials-card";
import { WelcomeCollapsed } from "@/components/portfolio/cards/welcome-card";

export function PortfolioShell({
  github,
  testimonials,
}: {
  github: GithubData;
  testimonials: Testimonial[];
}) {
  const [expanded, setExpanded] = useState<CardId | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const reduce = useReducedMotion();
  const letterOpen = expanded === "letter";
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (expanded && sectionRef.current) {
      sectionRef.current.scrollTop = 0;
    }
  }, [expanded]);

  useEffect(() => {
    const t = setTimeout(() => setIsLoaded(true), reduce ? 0 : 1200);
    return () => clearTimeout(t);
  }, [reduce]);

  useEffect(() => {
    // Mirror the lg: custom-variant in globals.css.
    const mq = window.matchMedia(
      "(min-width: 1280px), (min-width: 1024px) and (max-height: 800px)",
    );
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
    <main
      className="relative grain h-svh max-h-screen w-svw overflow-hidden text-cream"
      style={{
        background: letterOpen ? SKY_BG : "var(--ink)",
        transition: "background 0.9s cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      <BackgroundField reduce={!!reduce} />

      <div
        className="relative z-10 grid h-full w-full"
        style={{
          gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
          gridTemplateRows: "auto 1fr auto",
          gap: "clamp(8px, 1.2svh, 14px)",
          padding: "clamp(10px, 1.6svh, 18px) clamp(12px, 1.6vw, 22px)",
        }}
      >
        {/* ─── HEADER ─── */}
        <header
          className="col-span-12 grid items-center"
          style={{ gridTemplateColumns: "repeat(12, minmax(0, 1fr))" }}
        >
          <div className="col-span-7 flex items-baseline gap-3 min-w-0">
            <span
              className="t-display text-[clamp(18px,1.7vw,24px)]"
              style={{
                color: letterOpen ? LETTER_INK : undefined,
                transition: "color 0.9s cubic-bezier(0.22,1,0.36,1)",
              }}
            >
              Ajas
              <span style={{ color: letterOpen ? LETTER_INK_SOFT : undefined }} className={letterOpen ? undefined : "text-cream-deep"}>
                /
              </span>
              Mohammed
            </span>
            <span className="t-mono opacity-60 hidden md:inline truncate">
              software developer
            </span>
          </div>
        </header>

        {/* ─── BENTO ─── */}
        <section
          ref={sectionRef}
          className={`col-span-12 relative grid grid-cols-10 grid-rows-[5fr_4fr_4fr_5fr_6fr] min-h-0 overflow-hidden max-[463px]:grid-cols-[3fr_2fr] max-[463px]:grid-rows-[clamp(110px,28vw,140px)_clamp(110px,28vw,140px)_clamp(260px,68vw,360px)_clamp(260px,68vw,360px)_clamp(150px,36vw,180px)_clamp(200px,52vw,260px)] ${expanded ? "" : "max-[463px]:overflow-y-auto"} max-[1279px]:overflow-y-auto lg:grid-cols-12 lg:grid-rows-6 lg:overflow-visible`}
          style={{
            gap: "clamp(8px, 1.2svh, 14px)",
          }}
        >
          <LayoutGroup>
            {/* IMAGE — top-right (tablet) / col 2 rows 1–2 (mobile <464) / tall left (desktop) */}
            <BentoCard
              id="image"
              expanded={expanded}
              onOpen={setExpanded}
              variant="image"
              bleed
              overflowBleed
              className="col-start-6 col-end-11 row-start-1 row-end-3 max-[463px]:col-start-2 max-[463px]:col-end-3 max-[463px]:row-start-1 max-[463px]:row-end-3 lg:col-start-5 lg:col-end-7 lg:row-start-1 lg:row-end-4"
            >
              <ImageInner />
            </BentoCard>

            {/* WELCOME (compact) — mobile + tablet (top-left). Replaces ring chart spot. */}
            <div
              className="hidden max-[1279px]:block col-start-1 col-end-6 row-start-1 row-end-2 max-[463px]:col-start-1 max-[463px]:col-end-2 max-[463px]:row-end-3 lg:hidden relative overflow-hidden"
              style={{
                borderRadius: RADIUS,
                background: "var(--cream)",
                color: "var(--orange-deep)",
                padding: "clamp(8px,2vw,14px) clamp(10px,2vw,16px)",
              }}
            >
              <WelcomeCollapsed compact />
            </div>

            {/* BIO — col 1 row 2 (tablet) / full-width row 3 (mobile <464) / top middle (desktop) */}
            <BentoCard
              id="bio"
              expanded={expanded}
              onOpen={setExpanded}
              variant="cream"
              className="col-start-1 col-end-6 row-start-2 row-end-4 max-[463px]:col-start-1 max-[463px]:col-end-3 max-[463px]:row-start-3 max-[463px]:row-end-4 lg:col-start-7 lg:col-end-13 lg:row-start-1 lg:row-end-4"
            >
              <BioCollapsed />
            </BentoCard>

            {/* WELCOME — desktop top-left hero (where the note used to live) */}
            <div
              className="hidden lg:block lg:col-start-1 lg:col-end-5 lg:row-start-1 lg:row-end-4 relative overflow-hidden"
              style={{
                borderRadius: RADIUS,
                background: "var(--cream)",
                color: "var(--orange-deep)",
                padding:
                  "clamp(14px,1.8svh,22px) clamp(14px,1.5vw,22px) clamp(18px,2.2svh,28px)",
              }}
            >
              <WelcomeCollapsed />
            </div>

            {/* LETTER — desktop: small square below the review (testimonials) card */}
            <BentoCard
              id="letter"
              expanded={expanded}
              onOpen={setExpanded}
              variant="sky"
              className="hidden lg:block lg:col-start-1 lg:col-end-2 lg:row-start-6 lg:row-end-7"
            >
              <LetterCollapsed compact />
            </BentoCard>

            {/* SOCIAL — desktop: strip beside the small letter, below review */}
            <SocialCard
              className="lg:col-start-2 lg:col-end-5 lg:row-start-6 lg:row-end-7"
            />

            {/* MOBILE/TABLET — note card + 5 social mini-cards
                (tablet ≥464: col 2 row 4, shares row with testimonials, 3×2 grid)
                (mobile <464: full-width row 5 as 3×2) */}
            <div
              className="col-start-6 col-end-11 row-start-5 row-end-6 self-start aspect-3/2 grid grid-cols-3 grid-rows-2 max-[463px]:col-start-1 max-[463px]:col-end-3 max-[463px]:row-start-5 max-[463px]:row-end-6 max-[463px]:self-auto max-[463px]:aspect-auto lg:hidden"
              style={{ gap: "clamp(6px, 1.6vw, 10px)", minWidth: 0, minHeight: 0 }}
            >
              <BentoCard
                id="letter"
                expanded={expanded}
                onOpen={setExpanded}
                variant="sky"
                layoutKey="card-letter-mobile"
              >
                <LetterCollapsed />
              </BentoCard>
              <SocialMobileCells />
            </div>

            {/* ANALYTICS — col 2 rows 2–3 (tablet) / full-width row 4 (mobile <464) / wide bottom (desktop) */}
            <BentoCard
              id="analytics"
              expanded={expanded}
              onOpen={setExpanded}
              variant="accent"
              className="col-start-6 col-end-11 row-start-3 row-end-5 max-[463px]:col-start-1 max-[463px]:col-end-3 max-[463px]:row-start-4 max-[463px]:row-end-5 lg:col-start-5 lg:col-end-13 lg:row-start-4 lg:row-end-7"
            >
              <AnalyticsCollapsed github={github} />
            </BentoCard>

            {/* TESTIMONIALS — col 1 rows 3–4 (tablet) / full-width row 6 (mobile <464) / bottom-right (desktop) */}
            <BentoCard
              id="testimonials"
              expanded={expanded}
              onOpen={setExpanded}
              variant="cream"
              className="col-start-1 col-end-6 row-start-4 row-end-6 max-[463px]:col-start-1 max-[463px]:col-end-3 max-[463px]:row-start-6 max-[463px]:row-end-7 lg:col-start-1 lg:col-end-5 lg:row-start-4 lg:row-end-6"
            >
              <TestimonialsCollapsed items={testimonials} />
            </BentoCard>

            <AnimatePresence>
              {expanded && (
                <motion.div
                  key="backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="absolute inset-0 z-20"
                  style={{
                    background: letterOpen
                      ? "rgba(168,196,220,0.32)"
                      : "rgba(192,68,15,0.32)",
                    borderRadius: RADIUS,
                    transition: "background 0.9s cubic-bezier(0.22,1,0.36,1)",
                  }}
                  onClick={() => setExpanded(null)}
                />
              )}
              {expanded && (
                <ExpandedCard
                  key={expanded}
                  id={expanded}
                  github={github}
                  testimonials={testimonials}
                  onClose={() => setExpanded(null)}
                  layoutKey={
                    expanded === "letter" && !isDesktop
                      ? "card-letter-mobile"
                      : undefined
                  }
                />
              )}
            </AnimatePresence>
          </LayoutGroup>
        </section>

        {/* ─── FOOTER ─── */}
        <footer
          className="col-span-12 grid items-center"
          style={{ gridTemplateColumns: "repeat(12, minmax(0, 1fr))" }}
        >
          <div className="hidden lg:block col-span-12 t-mono-xs opacity-70 compact:hidden">
            click any tile to expand · esc to close · github synced every 10m
          </div>
        </footer>
      </div>
    </main>

    <AnimatePresence>
      {!isLoaded && (
        <motion.div
          key="boot"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease } }}
          className="fixed inset-0 z-[100] grain flex items-center justify-center"
          style={{ background: "var(--ink)", color: "var(--cream)" }}
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <SplitText
              className="t-display text-[clamp(36px,4.5vw,64px)] leading-none"
              delay={0.15}
              stagger={0.035}
            >
              Ajas Mohammed
            </SplitText>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, ease, delay: 0.55 }}
              style={{
                height: 1,
                width: "clamp(60px,6vw,90px)",
                background: "var(--cream)",
                transformOrigin: "center",
                opacity: 0.45,
              }}
            />
            <motion.span
              className="t-mono-xs"
              style={{ letterSpacing: "0.22em" }}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 0.7, y: 0 }}
              transition={{ duration: 0.6, ease, delay: 0.65 }}
            >
              software developer
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
