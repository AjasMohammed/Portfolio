"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "framer-motion";
import Lenis from "lenis";
import type { GithubData } from "@/lib/github";
import type { Testimonial } from "@/lib/testimonials";
import {
  ease,
  GAP,
  RADIUS,
  SKY_BG,
  LETTER_INK,
  LETTER_INK_SOFT,
} from "@/components/portfolio/constants";
import type { CardId } from "@/components/portfolio/types";
import { SplitText } from "@/components/portfolio/split-text";
import { BootBar } from "@/components/portfolio/boot-bar";
import { BackgroundField } from "@/components/portfolio/background-field";
import { BentoCard, ExpandedCard } from "@/components/portfolio/card";
import { ImageInner } from "@/components/portfolio/cards/image-card";
import { BioCollapsed } from "@/components/portfolio/cards/bio-card";
import { LetterCollapsed, SocialCard, SocialMobileCells } from "@/components/portfolio/cards/letter-card";
import { AnalyticsCollapsed } from "@/components/portfolio/cards/analytics-card";
import { ProjectsCollapsed } from "@/components/portfolio/cards/projects-card";
import { TestimonialsCollapsed } from "@/components/portfolio/cards/testimonials-card";
import { WelcomeCollapsed } from "@/components/portfolio/cards/welcome-card";
import { usePerfTier } from "@/components/portfolio/use-perf-tier";

/* The welcome tile sits full-bleed on the cosmos-wall art. It is already
   landscape and mostly pale, so it needs no crop — just a thin cream veil to
   lift the copy off the bloom and the shapes in the bottom-right. */
/* One `background` shorthand, not longhands: React warns (and can mis-style)
   when a rerender mixes shorthand and longhand background properties. */
const WELCOME_SURFACE: React.CSSProperties = {
  background:
    "linear-gradient(rgba(244,235,216,0.42), rgba(244,235,216,0.42)) center / cover no-repeat, url(/images/cosmos-wall.webp) center / cover no-repeat var(--cream)",
};

/* The compact tile is half as tall and much wider, so `cover` centres the bloom
   straight on the headline — anchoring low lifts it up into the filename bar. */
const WELCOME_SURFACE_COMPACT: React.CSSProperties = {
  background:
    "linear-gradient(rgba(244,235,216,0.42), rgba(244,235,216,0.42)) center / cover no-repeat, url(/images/cosmos-wall.webp) center bottom / cover no-repeat var(--cream)",
};

export function PortfolioShell({
  github,
  testimonials,
  visits,
}: {
  github: GithubData;
  testimonials: Testimonial[];
  visits: number | null;
}) {
  const [expanded, setExpanded] = useState<CardId | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  // null = not yet measured (SSR / pre-hydration) — both welcome variants
  // render and CSS arbitrates; once known, only one mounts so the hidden
  // copy's typing timers don't run forever.
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);
  const [visitCount, setVisitCount] = useState(visits);
  const reduce = useReducedMotion();
  const perfTier = usePerfTier();
  const lite = perfTier === "low";
  const letterOpen = expanded === "letter";
  const sectionRef = useRef<HTMLElement | null>(null);
  const lenisRef = useRef<Lenis | null>(null);

  // The page itself never scrolls (html/body are overflow:hidden) — the bento
  // section is the scroller, and only below lg. `autoToggle` watches its
  // overflow so Lenis idles on desktop where the grid is overflow-visible, and
  // `allowNestedScroll` leaves expanded-card panels on native scrolling.
  // ponytail: no lenis.css import — its `iframe { pointer-events: none }` rule
  // would kill the live site previews in the projects card, and the only other
  // rule that matters here (scroll-behavior) is never set on the section.
  useEffect(() => {
    const wrapper = sectionRef.current;
    if (reduce || !wrapper) return;
    const lenis = new Lenis({
      wrapper,
      autoRaf: true,
      autoToggle: true,
      allowNestedScroll: true,
    });
    lenisRef.current = lenis;
    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reduce]);

  useEffect(() => {
    if (!expanded) return;
    // scrollTo keeps Lenis's own animated position in sync; a raw scrollTop
    // write would leave it mid-animation and snap back on the next frame.
    if (lenisRef.current) lenisRef.current.scrollTo(0, { immediate: true });
    else if (sectionRef.current) sectionRef.current.scrollTop = 0;
  }, [expanded]);

  useEffect(() => {
    // The boot screen plays on every load — long enough to read, short enough
    // to not annoy. Reduced motion skips straight to the grid.
    const t = setTimeout(() => setIsLoaded(true), reduce ? 0 : 1600);
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

  // Log one visit per browser session (cheap, fire-and-forget).
  useEffect(() => {
    try {
      if (sessionStorage.getItem("v_logged") === "1") return;
      sessionStorage.setItem("v_logged", "1");
    } catch {
      // Private mode or storage disabled: skip dedup, still ping once.
    }
    let tz: string | undefined;
    try {
      tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {}
    const meta = {
      tz,
      vp: `${window.innerWidth}x${window.innerHeight}`,
      lang: navigator.language,
      ref: document.referrer || undefined,
    };
    fetch("/api/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(meta),
      keepalive: true,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((j: { count?: number } | null) => {
        // The server-rendered count is up to a minute stale and predates this
        // visit — the POST response is the number that actually includes it.
        if (typeof j?.count === "number") setVisitCount(j.count);
      })
      .catch(() => {});
  }, []);

  return (
    <>
    <main
      className={`relative ${lite ? "grain-lite" : "grain"} h-svh max-h-screen w-svw overflow-hidden text-cream`}
      style={{
        background: letterOpen ? SKY_BG : "var(--ink)",
        transition: "background 0.45s cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      <BackgroundField reduce={!!reduce} lite={lite} paused={expanded !== null} />

      <div
        className="relative z-10 grid h-full w-full"
        style={{
          gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
          gridTemplateRows: "auto 1fr auto",
          gap: GAP,
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
                transition: "color 0.45s cubic-bezier(0.22,1,0.36,1)",
              }}
            >
              Ajas
              <span style={{ color: letterOpen ? LETTER_INK_SOFT : undefined }} className={letterOpen ? undefined : "text-cream-deep"}>
                {' '}
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
          className={`col-span-12 relative grid grid-cols-10 grid-rows-[minmax(150px,5fr)_minmax(120px,4fr)_minmax(120px,4fr)_minmax(150px,5fr)_minmax(180px,6fr)] min-h-0 overflow-hidden max-[639px]:grid-cols-[3fr_2fr] max-[639px]:grid-rows-[clamp(110px,28vw,140px)_clamp(110px,28vw,140px)_clamp(260px,68vw,360px)_clamp(260px,68vw,360px)_clamp(130px,34vw,170px)_clamp(150px,36vw,180px)_clamp(200px,52vw,260px)] ${expanded ? "" : "max-[639px]:overflow-y-auto"} max-[1279px]:overflow-y-auto lg:grid-cols-12 lg:grid-rows-[1fr_1fr_1fr_minmax(64px,0.5fr)_1.275fr_1.275fr] lg:overflow-visible`}
          style={{
            gap: GAP,
          }}
        >
          <LayoutGroup>
            {/* IMAGE — top-right (tablet) / col 2 rows 1–2 (mobile <640) / tall bottom-middle (desktop) */}
            <BentoCard
              id="image"
              expanded={expanded}
              onOpen={setExpanded}
              variant="image"
              bleed
              overflowBleed
              entered={isLoaded}
              enterDelay={0.07}
              enterFrom="bottom"
              className="col-start-6 col-end-11 row-start-1 row-end-3 max-[639px]:col-start-2 max-[639px]:col-end-3 max-[639px]:row-start-1 max-[639px]:row-end-3 lg:col-start-4 lg:col-end-6 lg:row-start-4 lg:row-end-7"
            >
              <ImageInner />
            </BentoCard>

            {/* WELCOME (compact) — mobile + tablet (top-left). Replaces ring chart spot. */}
            {isDesktop !== true && (
              <motion.div
                initial={reduce ? false : { x: "-110vw" }}
                animate={isLoaded || reduce ? { x: 0 } : { x: "-110vw" }}
                transition={{ duration: 0.8, ease }}
                className="hidden max-[1279px]:block col-start-1 col-end-6 row-start-1 row-end-2 max-[639px]:col-start-1 max-[639px]:col-end-2 max-[639px]:row-end-3 lg:hidden relative overflow-hidden"
                style={{
                  borderRadius: RADIUS,
                  ...WELCOME_SURFACE_COMPACT,
                  color: "var(--orange-deep)",
                  padding: "clamp(8px,2vw,14px) clamp(10px,2vw,16px)",
                }}
              >
                <WelcomeCollapsed compact visits={visitCount} />
              </motion.div>
            )}

            {/* BIO — col 1 row 2 (tablet) / full-width row 3 (mobile <640) / bottom right (desktop) */}
            <BentoCard
              id="bio"
              expanded={expanded}
              onOpen={setExpanded}
              variant="cream"
              entered={isLoaded}
              enterDelay={0.14}
              enterFrom="bottom"
              className="col-start-1 col-end-6 row-start-2 row-end-4 max-[639px]:col-start-1 max-[639px]:col-end-3 max-[639px]:row-start-3 max-[639px]:row-end-4 lg:col-start-6 lg:col-end-11 lg:row-start-4 lg:row-end-7"
            >
              <BioCollapsed />
            </BentoCard>

            {/* WELCOME — desktop top-left hero (where the note used to live) */}
            {isDesktop !== false && (
              <motion.div
                initial={reduce ? false : { x: "-110vw" }}
                animate={isLoaded || reduce ? { x: 0 } : { x: "-110vw" }}
                transition={{ duration: 0.8, ease }}
                className="hidden lg:block lg:col-start-1 lg:col-end-5 lg:row-start-1 lg:row-end-4 relative overflow-hidden"
                style={{
                  borderRadius: RADIUS,
                  ...WELCOME_SURFACE,
                  color: "var(--orange-deep)",
                  padding:
                    "clamp(14px,1.8svh,22px) clamp(14px,1.5vw,22px) clamp(18px,2.2svh,28px)",
                }}
              >
                <WelcomeCollapsed visits={visitCount} />
              </motion.div>
            )}

            {/* LETTER — desktop: small square below the review (testimonials) card */}
            <BentoCard
              id="letter"
              expanded={expanded}
              onOpen={setExpanded}
              variant="sky"
              bleed
              entered={isLoaded}
              enterDelay={0.32}
              enterFrom="right"
              className="hidden lg:block lg:col-start-11 lg:col-end-13 lg:row-start-5 lg:row-end-7"
            >
              <LetterCollapsed />
            </BentoCard>

            {/* SOCIAL — desktop: strip beside the small letter, below review */}
            <SocialCard
              entered={isLoaded}
              enterDelay={0.42}
              className="lg:col-start-11 lg:col-end-13 lg:row-start-4 lg:row-end-5"
            />

            {/* MOBILE/TABLET — note card + 5 social mini-cards
                (tablet ≥640: col 2 row 4, shares row with testimonials, 3×2 grid)
                (mobile <640: full-width row 5 as 3×2) */}
            <div
              className="col-start-6 col-end-11 row-start-5 row-end-6 self-start aspect-3/2 grid grid-cols-3 grid-rows-2 max-[639px]:col-start-1 max-[639px]:col-end-3 max-[639px]:row-start-6 max-[639px]:row-end-7 max-[639px]:self-auto max-[639px]:aspect-auto lg:hidden"
              style={{ gap: "clamp(6px, 1.6vw, 10px)", minWidth: 0, minHeight: 0 }}
            >
              <BentoCard
                id="letter"
                expanded={expanded}
                onOpen={setExpanded}
                variant="sky"
                bleed
                layoutKey="card-letter-mobile"
                entered={isLoaded}
                enterDelay={0.28}
                enterFrom="bottom"
              >
                <LetterCollapsed />
              </BentoCard>
              <SocialMobileCells />
            </div>

            {/* SKILLS · GITHUB — col 2 row 4 (tablet) / full-width row 4 (mobile <640) / wide top (desktop) */}
            <BentoCard
              id="skills"
              expanded={expanded}
              onOpen={setExpanded}
              variant="cream"
              entered={isLoaded}
              enterDelay={0.28}
              enterFrom="top"
              className="col-start-6 col-end-11 row-start-4 row-end-5 max-[639px]:col-start-1 max-[639px]:col-end-3 max-[639px]:row-start-4 max-[639px]:row-end-5 lg:col-start-5 lg:col-end-10 lg:row-start-1 lg:row-end-4"
            >
              <AnalyticsCollapsed github={github} />
            </BentoCard>

            {/* PROJECTS · previews — col 2 row 3 (tablet) / full-width row 5 (mobile <640) / narrow top-right (desktop) */}
            <BentoCard
              id="projects"
              expanded={expanded}
              onOpen={setExpanded}
              variant="cream"
              entered={isLoaded}
              enterDelay={0.35}
              enterFrom="right"
              className="col-start-6 col-end-11 row-start-3 row-end-4 max-[639px]:col-start-1 max-[639px]:col-end-3 max-[639px]:row-start-5 max-[639px]:row-end-6 lg:col-start-10 lg:col-end-13 lg:row-start-1 lg:row-end-4"
            >
              <ProjectsCollapsed />
            </BentoCard>

            {/* TESTIMONIALS — col 1 rows 3–4 (tablet) / full-width row 6 (mobile <640) / bottom-right (desktop) */}
            <BentoCard
              id="testimonials"
              expanded={expanded}
              onOpen={setExpanded}
              variant="cream"
              entered={isLoaded}
              enterDelay={0.21}
              enterFrom="left"
              className="col-start-1 col-end-6 row-start-4 row-end-6 max-[639px]:col-start-1 max-[639px]:col-end-3 max-[639px]:row-start-7 max-[639px]:row-end-8 lg:col-start-1 lg:col-end-4 lg:row-start-4 lg:row-end-7"
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
                    transition: "background 0.45s cubic-bezier(0.22,1,0.36,1)",
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
                    expanded === "letter" && isDesktop === false
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
          exit={{ opacity: 0, transition: { duration: 0.45, ease } }}
          className="fixed inset-0 z-100 grain flex items-center justify-center"
          style={{ background: "var(--ink)", color: "var(--cream)" }}
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <SplitText
              className="t-display text-[clamp(36px,4.5vw,64px)] leading-none"
              delay={0.05}
              stagger={0.022}
            >
              Ajas Mohammed
            </SplitText>
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease, delay: 0.15 }}
            >
              <BootBar duration={1450} />
            </motion.div>
            <motion.span
              className="t-mono-xs"
              style={{ letterSpacing: "0.22em" }}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 0.7, y: 0 }}
              transition={{ duration: 0.4, ease, delay: 0.25 }}
            >
              booting · software developer
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
