"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import Image from "next/image";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { certificates, experiences, profile, projects } from "@/data/profile";
import type { GithubData, GithubRepo } from "@/lib/github";

const ease = [0.22, 1, 0.36, 1] as const;
const RADIUS = "clamp(18px, 1.9vw, 30px)";
const WHATSAPP_IMG = "/images/rooftop-kochi.png";

/* ────────────────── Text animation primitives ────────────────── */

type SplitTextProps = {
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

function SplitText({
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

type CardId = "image" | "bio" | "analytics" | "letter";

/* ────────────────── Social icons (minimal inline SVG) ────────────────── */

function SocialIcon({ name, size = 18 }: { name: string; size?: number }) {
  const stroke = "currentColor";
  const sw = 1.6;
  switch (name) {
    case "github":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={stroke} aria-hidden>
          <path d="M12 1.5a10.5 10.5 0 0 0-3.32 20.46c.53.1.72-.23.72-.5v-1.8c-2.92.63-3.54-1.4-3.54-1.4-.48-1.22-1.17-1.54-1.17-1.54-.95-.65.07-.64.07-.64 1.06.08 1.62 1.09 1.62 1.09.94 1.6 2.47 1.14 3.07.87.1-.68.37-1.14.67-1.4-2.33-.27-4.78-1.17-4.78-5.18 0-1.14.41-2.07 1.08-2.8-.11-.27-.47-1.34.1-2.8 0 0 .89-.28 2.9 1.06a10 10 0 0 1 5.27 0c2.01-1.34 2.9-1.06 2.9-1.06.57 1.46.21 2.53.1 2.8a4.05 4.05 0 0 1 1.08 2.8c0 4.02-2.46 4.9-4.8 5.16.38.33.71.96.71 1.95v2.89c0 .28.19.61.73.5A10.5 10.5 0 0 0 12 1.5Z"/>
        </svg>
      );
    case "linkedin":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={stroke} aria-hidden>
          <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.95v5.66H9.36V9h3.4v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.26 2.37 4.26 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.23 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.21 0 22.23 0Z"/>
        </svg>
      );
    case "mail":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="3" y="5" width="18" height="14" rx="2"/>
          <path d="m3 7 9 7 9-7"/>
        </svg>
      );
    case "phone":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"/>
        </svg>
      );
    case "resume":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <path d="M14 2v6h6M9 13h6M9 17h6"/>
        </svg>
      );
    default:
      return null;
  }
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease, delay: 0.1 },
  },
  exit: { opacity: 0, y: -6, transition: { duration: 0.18, ease } },
};

const stagger: Variants = {
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.12 } },
};

const CONTENT_BASE_DELAY = 1.3;

const socialIconStagger: Variants = {
  hidden: {},
  show: {
    transition: {
      delayChildren: CONTENT_BASE_DELAY + 0.45,
      staggerChildren: 0.08,
    },
  },
};

const socialIconItem: Variants = {
  hidden: { opacity: 0, scale: 0.3, y: 10 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.6, ease },
  },
};

const langDots: Record<string, string> = {
  Python: "#f4ebd8",
  Rust: "#f08047",
  JavaScript: "#f4ebd8",
  TypeScript: "#f08047",
  HTML: "#f4ebd8",
  CSS: "#f08047",
};

const SKY_BG = "#a8c4dc";

export function PortfolioShell({ github }: { github: GithubData }) {
  const [expanded, setExpanded] = useState<CardId | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const reduce = useReducedMotion();
  const letterOpen = expanded === "letter";

  useEffect(() => {
    if (reduce) {
      setIsLoaded(true);
      return;
    }
    const t = setTimeout(() => setIsLoaded(true), 1200);
    return () => clearTimeout(t);
  }, [reduce]);

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
          className="col-span-12 relative grid min-h-0"
          style={{
            gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
            gridTemplateRows: "repeat(6, minmax(0, 1fr))",
            gap: "clamp(8px, 1.2svh, 14px)",
          }}
        >
          <LayoutGroup>
            {/* IMAGE — tall left */}
            <BentoCard
              id="image"
              expanded={expanded}
              onOpen={setExpanded}
              gridArea="1 / 1 / 7 / 5"
              variant="image"
              bleed
            >
              <ImageInner />
            </BentoCard>

            {/* BIO — left half of top right strip */}
            <BentoCard
              id="bio"
              expanded={expanded}
              onOpen={setExpanded}
              gridArea="1 / 5 / 4 / 10"
              variant="cream"
            >
              <BioCollapsed github={github} />
            </BentoCard>

            {/* LETTER — top corner, sits beside bio with natural grid gap */}
            <BentoCard
              id="letter"
              expanded={expanded}
              onOpen={setExpanded}
              gridArea="1 / 10 / 3 / 13"
              variant="sky"
            >
              <LetterCollapsed />
            </BentoCard>

            {/* SOCIAL — small contact strip directly under the letter */}
            <SocialCard gridArea="3 / 10 / 4 / 13" />

            {/* ANALYTICS + PROJECTS + STACK — wide bottom */}
            <BentoCard
              id="analytics"
              expanded={expanded}
              onOpen={setExpanded}
              gridArea="4 / 5 / 7 / 13"
              variant="accent"
            >
              <AnalyticsCollapsed github={github} />
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
                  onClose={() => setExpanded(null)}
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
          <div className="col-span-12 t-mono-xs opacity-70">
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

/* ───────────────────────── CARDS ───────────────────────── */

type Variant = "cream" | "accent" | "image" | "sky";

function surfaceStyles(v: Variant) {
  if (v === "cream") return { bg: "var(--cream)", fg: "var(--orange-deep)" };
  if (v === "sky") return { bg: SKY_BG, fg: "#0f1f3a" };
  return { bg: "var(--orange-deep)", fg: "var(--cream)" };
}

function BentoCard({
  id,
  expanded,
  onOpen,
  gridArea,
  variant,
  children,
  bleed = false,
  extraStyle,
}: {
  id: CardId;
  expanded: CardId | null;
  onOpen: (id: CardId) => void;
  gridArea: string;
  variant: Variant;
  children: React.ReactNode;
  bleed?: boolean;
  extraStyle?: React.CSSProperties;
}) {
  const isHidden = expanded === id;
  const otherOpen = expanded !== null && expanded !== id;
  const surface = surfaceStyles(variant);
  const interactive = !otherOpen && !isHidden;

  const hoverShadow =
    variant === "cream"
      ? "0 18px 40px -14px rgba(192,68,15,0.45), 0 4px 12px -6px rgba(192,68,15,0.25)"
      : variant === "sky"
        ? "0 18px 40px -14px rgba(15,31,58,0.5), 0 4px 12px -6px rgba(15,31,58,0.28)"
        : "0 20px 44px -14px rgba(0,0,0,0.55), 0 6px 14px -6px rgba(0,0,0,0.35)";

  return (
    <motion.div
      layoutId={`card-${id}`}
      animate={{ opacity: otherOpen ? 0.25 : 1, scale: otherOpen ? 0.985 : 1 }}
      whileHover={
        interactive && id !== "bio" && id !== "letter" && id !== "analytics" && id !== "image"
          ? { scale: 1.012, y: -4, boxShadow: hoverShadow }
          : undefined
      }
      transition={{ duration: 0.4, ease }}
      style={{
        gridArea,
        borderRadius: RADIUS,
        background: surface.bg,
        color: surface.fg,
        visibility: isHidden ? "hidden" : "visible",
        minWidth: 0,
        minHeight: 0,
        ...extraStyle,
      }}
      className="relative overflow-hidden"
    >
      <button
        type="button"
        onClick={() => onOpen(id)}
        className="group relative flex h-full w-full flex-col text-left outline-none focus-visible:ring-2 focus-visible:ring-cream cursor-pointer"
        style={{ borderRadius: "inherit" }}
      >
        {/* Bleed cards: image fills full container, chrome floats on top */}
        {bleed && (
          <div className="absolute inset-0 z-[1] overflow-hidden" style={{ borderRadius: "inherit" }}>
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

const innerPadding = {
  paddingTop: "clamp(36px,3.6svh,52px)",
  paddingRight: "clamp(28px,2.4vw,52px)",
  paddingBottom: "clamp(14px,1.6svh,24px)",
  paddingLeft: "clamp(14px,1.4vw,26px)",
};

function ExpandedCard({
  id,
  github,
  onClose,
}: {
  id: CardId;
  github: GithubData;
  onClose: () => void;
}) {
  const variant: Variant =
    id === "image"
      ? "image"
      : id === "letter"
        ? "sky"
        : id === "analytics"
          ? "accent"
          : "cream";
  const surface = surfaceStyles(variant);
  const isLetter = id === "letter";

  return (
    <motion.div
      layoutId={`card-${id}`}
      className="absolute inset-0 z-30 overflow-hidden"
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
        </motion.div>
      )}
    </motion.div>
  );
}

/* ───────────────────────── IMAGE ───────────────────────── */

function ImageInner() {
  const reduce = useReducedMotion();
  return (
    <div className="relative h-full w-full overflow-hidden" style={{ borderRadius: "inherit" }}>
      {/* Image with vertical clip-path wipe reveal */}
      <motion.div
        className="absolute inset-0"
        initial={reduce ? false : { clipPath: "inset(100% 0 0 0)" }}
        animate={{ clipPath: "inset(0% 0 0 0)" }}
        transition={{ duration: 1.1, ease, delay: CONTENT_BASE_DELAY }}
      >
        <Image
          src="/images/portrait.jpeg"
          alt="Illustrated portrait of Ajas Mohammed"
          fill
          sizes="(max-width: 1024px) 100vw, 34vw"
          priority
          className="object-cover scale-[1.08] transition-transform duration-500 ease-out group-hover:scale-100"
        />
      </motion.div>
      {/* Top fade so the chrome overlay text stays legible */}
      <div
        className="absolute inset-x-0 top-0 h-[22%] pointer-events-none"
        style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.32), transparent)" }}
      />
      {/* Bottom fade for the name plate */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none"
        style={{ background: "linear-gradient(180deg, transparent, rgba(192,68,15,0.78))" }}
      />
      <div className="absolute left-3 right-3 bottom-3 flex items-end justify-between gap-2 text-cream">
        <div className="min-w-0">
          <p className="t-display text-[clamp(18px,1.8vw,30px)] leading-none overflow-hidden flex flex-col py-2">
            <SplitText delay={CONTENT_BASE_DELAY + 0.8}>Ajas</SplitText>
            <SplitText delay={CONTENT_BASE_DELAY + 0.95}>Mohammed</SplitText>
          </p>
          <motion.p
            className="t-mono-xs mt-1.5 opacity-85 truncate"
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 0.85, y: 0 }}
            transition={{ duration: 0.5, ease, delay: CONTENT_BASE_DELAY + 1.15 }}
          >
            est. 2024 · py · django · react
          </motion.p>
        </div>
        <motion.p
          className="t-mono-xs opacity-85 shrink-0"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 0.85 }}
          transition={{ duration: 0.5, ease, delay: CONTENT_BASE_DELAY + 1.25 }}
        >
          fig.01 / 01
        </motion.p>
      </div>
    </div>
  );
}

const coverLetterParagraphs = [
  "I'm Ajas Mohammed — a Python developer based in Kochi, India, with around two years of hands-on experience building backend systems, REST APIs, and full-stack web applications for content publishing and learning platforms.",
  "I currently work as a Software Developer at Neumeral Technologies, where I design and implement REST APIs with Django and Django REST Framework, build asynchronous workflows with Celery and Redis, and refactor legacy codebases for maintainability, scalability, and performance. I also containerize services with Docker and automate deployments using Ansible.",
  "Before that, I worked at Allwin Technologies as a Backend Developer designing scalable RESTful APIs, and started out as a Python Django intern at Imiot TechnoLabs, shipping backend features and bug fixes remotely.",
  "A few things I've built along the way: Learnabble, a learning portal where I built backend services, optimized Django ORM queries, and integrated the YouTube API and Odoo for course data synchronization; Neusler, a Django and Wagtail publishing platform I refactored through caching strategies, CMS enhancements, and new API endpoints; and GitAI, a FastAPI application I wrote that generates structured Git commit messages using LangChain prompt pipelines and GitPython.",
  "Day to day I reach for Python, Django, Django REST Framework, FastAPI, Wagtail, React and Next.js — backed by PostgreSQL, MySQL or SQLite, with Docker, Redis, Celery, Ansible and Linux for the plumbing. I'm certified in Python, SQL, REST APIs and problem solving through HackerRank.",
  "I care about code that ages well, queries that don't surprise anyone in production, and small careful changes over heroic rewrites. If you're building something patient and useful, I'd love to talk — every door (email, phone, GitHub, LinkedIn, resume) is on the contact card.",
];

function ImageExpanded() {
  return (
    <div className="grid h-full" style={{ gridTemplateColumns: "1fr auto", gap: "clamp(20px,2vw,40px)" }}>
      <div
        className="flex flex-col min-w-0 min-h-0 gap-4 overflow-y-auto overflow-x-hidden"
        style={{ width: "60vw", scrollbarWidth: "thin" }}
      >
        <div className="min-w-0">
          <div className="flex flex-col gap-[clamp(10px,1.2svh,16px)]">
            <p
              className="t-body"
              style={{
                fontSize: "clamp(16px,1.25vw,21px)",
                lineHeight: 1.55,
                opacity: 0.95,
              }}
            >
              Hello,
            </p>
            {coverLetterParagraphs.map((p, i) => (
              <p
                key={i}
                className="t-body"
                style={{
                  fontSize: "clamp(16px,1.25vw,21px)",
                  lineHeight: 1.55,
                  opacity: 0.92,
                }}
              >
                {p}
              </p>
            ))}
            <div className="flex flex-col gap-1 mt-2">
              <p
                className="t-serif"
                style={{
                  fontSize: "clamp(16px,1.25vw,21px)",
                  lineHeight: 1.4,
                  opacity: 0.85,
                  fontStyle: "italic",
                }}
              >
                Sincerely,
              </p>
              <p
                className="t-display"
                style={{
                  fontSize: "clamp(18px,1.5vw,26px)",
                  letterSpacing: "-0.005em",
                }}
              >
                Ajas Mohammed
              </p>
            </div>
          </div>
        </div>

      </div>
      <div
        className="flex flex-col gap-[clamp(14px,1.6svh,22px)] min-h-0 overflow-y-auto overflow-x-hidden"
        style={{ width: "clamp(220px,20vw,320px)", scrollbarWidth: "thin" }}
      >
        <Image
          src="/images/portrait.jpeg"
          alt="Illustrated portrait"
          width={853}
          height={1280}
          sizes="320px"
          className="h-auto w-full self-start"
          style={{ borderRadius: "clamp(12px,1.2vw,20px)" }}
        />

        {certificates.length > 0 && (
          <div className="min-w-0">
            <div className="flex items-baseline justify-between mb-2">
              <p
                className="t-mono"
                style={{
                  opacity: 0.7,
                  fontSize: "clamp(11px,0.85vw,14px)",
                  letterSpacing: "0.08em",
                }}
              >
                certificates · verified
              </p>
              <p className="t-mono-xs opacity-55 shrink-0">
                {String(certificates.length).padStart(2, "0")}
              </p>
            </div>
            <ul className="flex flex-col gap-[clamp(6px,0.7svh,10px)]">
              {certificates.map((c) => (
                <li key={c.url} className="min-w-0">
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 transition-transform hover:-translate-y-0.5"
                    style={{
                      padding: "clamp(8px,0.7vw,12px) clamp(10px,0.9vw,14px)",
                      border: "1px solid rgba(244,235,216,0.28)",
                      borderRadius: "clamp(8px,0.7vw,12px)",
                      background: "rgba(244,235,216,0.04)",
                    }}
                  >
                    <div className="min-w-0">
                      <p
                        className="t-display truncate"
                        style={{
                          fontSize: "clamp(13px,1vw,17px)",
                          fontWeight: 700,
                          letterSpacing: "-0.005em",
                          lineHeight: 1.15,
                        }}
                      >
                        {c.title}
                      </p>
                      <p
                        className="t-serif truncate"
                        style={{
                          color: "var(--orange)",
                          fontSize: "clamp(10px,0.78vw,13px)",
                          lineHeight: 1.2,
                        }}
                      >
                        {c.level} · {c.issuer.toLowerCase()}
                      </p>
                    </div>
                    <span
                      className="t-mono-xs inline-flex items-center gap-1 shrink-0"
                      style={{ opacity: 0.85 }}
                    >
                      <span className="live-dot" />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

const LETTER_INK = "#0f1f3a";
const LETTER_INK_SOFT = "rgba(15,31,58,0.78)";

function LetterCollapsed() {
  const reduce = useReducedMotion();
  return (
    <div className="flex flex-col justify-between w-full h-full gap-3 min-w-0 origin-left transition-transform duration-500 ease-out group-hover:scale-[0.94]">
      <div className="flex flex-col gap-3">
        <p
          className="t-mono-xs text-right"
          style={{ opacity: 0.7, fontSize: "clamp(10px,0.78vw,13px)", letterSpacing: "0.18em" }}
        >
          note
        </p>
      <h3
        className="t-display min-w-0"
        style={{
          fontSize: "clamp(26px, 3vw, 52px)",
          lineHeight: 0.95,
          letterSpacing: "-0.01em",
        }}
      >
        <SplitText delay={CONTENT_BASE_DELAY + 0.25}>Less résumé.</SplitText>
        <br />
        <SplitText
          className="t-serif"
          style={{ color: LETTER_INK_SOFT }}
          delay={CONTENT_BASE_DELAY + 0.55}
        >
          More hello.
        </SplitText>
      </h3>
      </div>

      <motion.div
        className="flex items-baseline justify-between gap-2 pt-2"
        style={{ borderTop: `1px solid ${LETTER_INK_SOFT}` }}
        initial={reduce ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease, delay: CONTENT_BASE_DELAY + 1.0 }}
      >
        <p
          className="t-mono opacity-85"
          style={{ letterSpacing: "0.08em", fontSize: "clamp(10px,0.78vw,13px)" }}
        >
          click to read →
        </p>
        <p
          className="t-mono-xs opacity-70 shrink-0"
          style={{ letterSpacing: "0.08em" }}
        >
          kochi · {new Date().getFullYear()}
        </p>
      </motion.div>
    </div>
  );
}

function SocialCard({
  gridArea,
  extraStyle,
}: {
  gridArea: string;
  extraStyle?: React.CSSProperties;
}) {
  const reduce = useReducedMotion();
  return (
    <div
      style={{
        gridArea,
        borderRadius: RADIUS,
        background: "var(--cream)",
        color: "var(--orange-deep)",
        minWidth: 0,
        minHeight: 0,
        ...extraStyle,
      }}
      className="relative overflow-hidden"
    >
      <motion.div
        className="flex flex-col items-center justify-center h-full w-full"
        style={{
          padding: "clamp(10px,1.2svh,16px) clamp(12px,1vw,18px)",
          gap: "clamp(8px,1svh,14px)",
        }}
        variants={socialIconStagger}
        initial={reduce ? false : "hidden"}
        animate="show"
      >
        <p
          className="t-display text-center"
          style={{
            fontSize: "clamp(16px,1.4vw,22px)",
            fontWeight: 700,
            letterSpacing: "-0.005em",
            lineHeight: 1,
          }}
        >
          get in touch
        </p>
        <div
          className="flex items-center justify-between w-full"
          style={{ gap: "clamp(6px,0.7vw,12px)" }}
        >
        {contactIcons.map((c) => (
          <motion.a
            key={c.name}
            href={c.href}
            target={c.ext ? "_blank" : undefined}
            rel={c.ext ? "noreferrer" : undefined}
            aria-label={c.label}
            title={c.label}
            variants={socialIconItem}
            className="inline-flex items-center justify-center transition-all hover:-translate-y-0.5 hover:scale-110"
            style={{
              width: "clamp(40px,3.4vw,56px)",
              height: "clamp(40px,3.4vw,56px)",
              borderRadius: 999,
              border: "1px solid rgba(192,68,15,0.3)",
              color: "currentColor",
              flexShrink: 0,
            }}
          >
            <SocialIcon name={c.name} size={22} />
          </motion.a>
        ))}
        </div>
      </motion.div>
    </div>
  );
}

function LetterExpanded() {
  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ background: SKY_BG, color: LETTER_INK }}
    >
      <Image
        src={WHATSAPP_IMG}
        alt="Ajas on a rooftop in Kochi, looking up at clouds"
        fill
        sizes="(max-width: 1024px) 100vw, 80vw"
        className="object-cover"
      />
      <div
        className="relative z-10 h-full grid min-h-0 overflow-hidden"
        style={{
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, clamp(320px, 46%, 560px))",
          ...innerPadding,
          gap: "clamp(14px,1.6vw,28px)",
        }}
      >
        <div aria-hidden />

        <div
          className="self-start flex flex-col gap-[clamp(10px,1.2svh,16px)] min-w-0 text-left items-start"
          style={{ color: LETTER_INK }}
        >
          <h2
            className="t-display"
            style={{
              fontSize: "clamp(26px,3.4vw,56px)",
              lineHeight: 0.95,
              letterSpacing: "-0.01em",
              color: LETTER_INK,
            }}
          >
            <SplitText delay={0.1}>A note</SplitText>
          </h2>

          <div
            className="flex flex-col gap-[clamp(6px,0.9svh,12px)] t-body"
            style={{
              fontSize: "clamp(13px,1vw,17px)",
              lineHeight: 1.6,
              letterSpacing: "0.08em",
              color: LETTER_INK,
              maxWidth: "52ch",
            }}
          >
            <p>Hello, and thanks for clicking around.</p>
            <p>
              I&apos;m Ajas — a software developer in kochi, the kind of
              afternoon where the clouds take their time. I write backends
              that try not to surprise anyone: django, fastapi, rest endpoints
              that read like english. some days I cross the fence and ship the
              ui too.
            </p>
            <p>
              I like systems that age well, codebases that don&apos;t need a
              tour, and reviews that just say lgtm. nothing flashy — just
              quiet, careful work.
            </p>
            <p>
              If you&apos;re building something patient and useful, I&apos;d
              love to hear about it. the bio card has every door — email,
              github, linkedin.
            </p>
          </div>

          <div
            className="flex items-baseline justify-end gap-3 pt-[clamp(8px,1svh,12px)] w-full"
            style={{ borderTop: `1px solid ${LETTER_INK_SOFT}` }}
          >
            <p
              className="t-display text-right"
              style={{
                fontSize: "clamp(15px,1.3vw,22px)",
                letterSpacing: "-0.005em",
                color: LETTER_INK,
              }}
            >
              — ajas mohammed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── BIO ───────────────────────── */

function BioCollapsed({ github: _github }: { github: GithubData }) {
  const experienceYears = computeExperienceYears();
  const reduce = useReducedMotion();

  return (
    <div className="flex flex-col w-full h-full gap-3 origin-left transition-transform duration-500 ease-out group-hover:scale-[0.94]">
      <div className="flex items-baseline justify-between gap-2 min-w-0">
        <p
          className="t-mono-xs"
          style={{ opacity: 0.7, fontSize: "clamp(10px,0.78vw,13px)", letterSpacing: "0.18em" }}
        >
          dev bio
        </p>
        <p
          className="t-mono-xs shrink-0"
          style={{ opacity: 0.55, fontSize: "clamp(10px,0.78vw,13px)", letterSpacing: "0.18em" }}
        >
          python
        </p>
      </div>
      <div className="flex-1 flex flex-col justify-center min-h-0 gap-3" style={{ paddingTop: "clamp(10px,1.4svh,20px)" }}>
        <div className="flex items-end gap-3 min-w-0 flex-wrap">
          <motion.div
            className="flex items-end gap-2 shrink-0"
            initial={reduce ? false : { opacity: 0, y: 24, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.85, ease, delay: CONTENT_BASE_DELAY + 0.15 }}
          >
            <p
              className="t-retro"
              style={{
                fontSize: "clamp(78px,8.6vw,180px)",
                color: "var(--orange)",
                lineHeight: 0.82,
                textShadow:
                  "4px 4px 0 rgba(192,68,15,0.22), 8px 8px 0 rgba(192,68,15,0.08)",
              }}
            >
              <Counter to={experienceYears} startDelay={CONTENT_BASE_DELAY + 0.3} />+
            </p>
            <p
              className="t-mono pb-3"
              style={{
                opacity: 0.7,
                fontSize: "clamp(12px,1vw,16px)",
                letterSpacing: "0.08em",
                lineHeight: 1.15,
              }}
            >
              years
              <br />
              building
            </p>
          </motion.div>
          <h1
            className="t-display min-w-0"
            style={{ fontSize: "clamp(26px, 3.6vw, 58px)", lineHeight: 0.94, letterSpacing: "-0.01em" }}
          >
            <SplitText delay={CONTENT_BASE_DELAY + 0.4}>Software developer.</SplitText>
            <br />
            <SplitText
              className="t-serif"
              style={{ color: "var(--orange)", fontStyle: "italic" }}
              delay={CONTENT_BASE_DELAY + 0.7}
            >
              Quietly built.
            </SplitText>
          </h1>
        </div>
      </div>

      <motion.p
        className="t-body max-w-prose"
        style={{
          fontSize: "clamp(12px, 0.95vw, 16px)",
          lineHeight: 1.5,
          borderTop: "1px solid rgba(244,235,216,0.18)",
          paddingTop: "clamp(8px, 1svh, 12px)",
        }}
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 0.85, y: 0 }}
        transition={{ duration: 0.7, ease, delay: CONTENT_BASE_DELAY + 0.95 }}
      >
        {profile.summary}
      </motion.p>
    </div>
  );
}

/* Reusable contact icon row — used in Bio collapsed + expanded */
const contactIcons = [
  { name: "github", label: "github", href: profile.social.githubUrl, ext: true },
  { name: "linkedin", label: "linkedin", href: profile.social.linkedinUrl, ext: true },
  { name: "mail", label: "email", href: `mailto:${profile.email}`, ext: false },
  { name: "phone", label: "phone", href: `tel:${profile.phone}`, ext: false },
  { name: "resume", label: "resume", href: profile.resumeUrl, ext: false },
];

function contactValue(name: string) {
  switch (name) {
    case "github": return `@${profile.social.githubUser}`;
    case "linkedin": return `in/${profile.social.linkedinHandle}`;
    case "mail": return profile.email;
    case "phone": return profile.phone;
    case "resume": return "download pdf";
    default: return "";
  }
}

function ContactIconRow({ size = 18 }: { size?: number }) {
  return (
    <ul className="flex items-center gap-1.5">
      {contactIcons.map((c) => (
        <li key={c.name}>
          <a
            href={c.href}
            target={c.ext ? "_blank" : undefined}
            rel={c.ext ? "noreferrer" : undefined}
            aria-label={c.label}
            title={c.label}
            className="inline-flex items-center justify-center transition-all hover:-translate-y-0.5 hover:scale-110"
            style={{
              width: size + 14,
              height: size + 14,
              borderRadius: "999px",
              border: "1px solid rgba(192,68,15,0.3)",
            }}
          >
            <SocialIcon name={c.name} size={size} />
          </a>
        </li>
      ))}
    </ul>
  );
}

function BioExpanded({ github }: { github: GithubData }) {
  const experienceYears = computeExperienceYears();

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="grid h-full min-h-0"
      style={{ gridTemplateColumns: "1.2fr 1fr", gap: "clamp(20px,1.8vw,40px)" }}
    >
      <motion.div
        variants={fadeUp}
        className="flex flex-col justify-between gap-4 min-w-0 min-h-0 overflow-y-auto overflow-x-hidden"
        style={{ scrollbarWidth: "thin" }}
      >
        <div className="flex flex-col gap-[clamp(10px,1.2svh,18px)] min-w-0">
          <p
            className="t-mono-xs"
            style={{ opacity: 0.65, fontSize: "clamp(11px,0.82vw,14px)", letterSpacing: "0.22em" }}
          >
            dev bio · since 2024
          </p>
          <div className="flex items-end gap-3 flex-wrap min-w-0">
            <div className="flex items-end gap-2 shrink-0">
              <p
                className="t-retro"
                style={{
                  fontSize: "clamp(96px,10vw,200px)",
                  color: "var(--orange)",
                  lineHeight: 0.82,
                  textShadow:
                    "4px 4px 0 rgba(192,68,15,0.22), 8px 8px 0 rgba(192,68,15,0.08)",
                }}
              >
                <Counter to={experienceYears} />+
              </p>
              <p
                className="t-mono pb-3"
                style={{
                  opacity: 0.75,
                  fontSize: "clamp(13px,1.05vw,17px)",
                  letterSpacing: "0.08em",
                  lineHeight: 1.15,
                }}
              >
                years
                <br />
                building
              </p>
            </div>
            <h2
              className="t-display min-w-0"
              style={{ fontSize: "clamp(28px, 3.8vw, 68px)", lineHeight: 0.92, letterSpacing: "-0.015em" }}
            >
              <SplitText delay={0.15}>Software developer.</SplitText>
              <br />
              <SplitText
                className="t-serif"
                style={{ color: "var(--orange)", fontStyle: "italic" }}
                delay={0.4}
              >
                Patient backends,
              </SplitText>
              <br />
              <SplitText delay={0.65}>honest interfaces.</SplitText>
            </h2>
          </div>
          <p
            className="t-serif max-w-prose"
            style={{
              opacity: 0.9,
              fontSize: "clamp(15px,1.15vw,20px)",
              lineHeight: 1.55,
              fontStyle: "italic",
              letterSpacing: "0.005em",
              borderLeft: "2px solid rgba(192,68,15,0.32)",
              paddingLeft: "clamp(12px,1vw,18px)",
              marginTop: "clamp(6px,0.8svh,12px)",
            }}
          >
            {profile.summary}
          </p>
        </div>
      </motion.div>

      <motion.div
        variants={fadeUp}
        className="flex flex-col justify-between gap-3 min-w-0 min-h-0 overflow-y-auto overflow-x-hidden"
        style={{ scrollbarWidth: "thin" }}
      >
        <div>
          <p className="t-mono opacity-70 mb-2">experience</p>
          <ul className="flex flex-col gap-[clamp(6px,1svh,10px)]">
            {experiences.map((e) => (
              <li key={e.company}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="t-display text-[clamp(13px,1.2vw,18px)] truncate">
                    {e.role}
                  </p>
                  <p className="t-mono-xs opacity-60 shrink-0">{e.period}</p>
                </div>
                <p className="t-serif text-[clamp(11px,0.9vw,15px)] truncate" style={{ color: "var(--orange)" }}>
                  @ {e.company} · {e.location}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-0">
          <p className="t-mono opacity-70 mb-2">education</p>
          <ul className="flex flex-col gap-[clamp(6px,1svh,10px)]">
            {profile.education.map((e) => (
              <li key={`${e.institution}-${e.degree}`} className="min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="t-display text-[clamp(13px,1.05vw,17px)] truncate">
                    {e.degree}
                  </p>
                  {e.period && (
                    <p className="t-mono-xs opacity-60 shrink-0">{e.period}</p>
                  )}
                </div>
                <p className="t-serif text-[clamp(11px,0.9vw,15px)] truncate" style={{ color: "var(--orange)" }}>
                  @ {e.institution}
                  {e.location ? ` · ${e.location}` : ""}
                </p>
                {e.grade && (
                  <p className="t-mono-xs opacity-55 mt-0.5">{e.grade}</p>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Contact block — icons + values */}
        <div className="min-w-0">
          <div className="flex items-baseline justify-between mb-2">
            <p className="t-mono opacity-70">reach me</p>
            <p className="t-mono-xs opacity-60">
              {github.user ? `${github.user.followers} followers` : "online"}
            </p>
          </div>
          <ul className="flex flex-col gap-0.5">
            {contactIcons.map((c) => (
              <li key={c.name} style={{ borderTop: "1px solid rgba(192,68,15,0.18)" }}>
                <a
                  href={c.href}
                  target={c.ext ? "_blank" : undefined}
                  rel={c.ext ? "noreferrer" : undefined}
                  className="flex items-center justify-between gap-3 py-1.5 min-w-0 group"
                >
                  <span className="inline-flex items-center gap-2 min-w-0 shrink-0">
                    <span style={{ color: "var(--orange)" }}>
                      <SocialIcon name={c.name} size={15} />
                    </span>
                    <span className="t-mono opacity-75">{c.label}</span>
                  </span>
                  <span className="t-display text-[clamp(12px,1vw,16px)] truncate link-line text-right">
                    {contactValue(c.name)}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ───────────────────────── PROJECTS / GITHUB ───────────────────────── */

function ProjectsCollapsed({ github }: { github: GithubData }) {
  const headline = github.ownedRepos.slice(0, 8);
  const repoCount = github.ownedRepos.length;

  return (
    <div className="flex flex-col justify-between w-full h-full gap-2">
      {/* Top: live numbers */}
      <div className="grid grid-cols-3 gap-2 min-w-0">
        <Stat label="public repos" value={repoCount} />
        <Stat label="stars" value={github.totalStars} />
        <Stat
          label="latest"
          value={github.latestRepo?.name ?? "—"}
          mono
        />
      </div>

      {/* Middle: marquee of repo names */}
      <div className="relative overflow-hidden h-[clamp(46px,6svh,72px)] flex items-center">
        <div className="marquee-track t-display text-[clamp(18px,1.9vw,30px)]" style={{ lineHeight: 1 }}>
          {[...headline, ...headline].map((r, i) => (
            <span key={`${r.id}-${i}`} className="mx-3 inline-flex items-baseline gap-1.5">
              {r.name}
              <span className="t-serif" style={{ color: "var(--orange)", fontSize: "0.55em" }}>
                /{r.language ?? "—"}
              </span>
              <span style={{ opacity: 0.35 }}>·</span>
            </span>
          ))}
        </div>
      </div>

      {/* Bottom: language chips */}
      <div
        className="flex flex-wrap gap-1 pt-2"
        style={{ borderTop: "1px solid rgba(192,68,15,0.22)" }}
      >
        {github.topLanguages.slice(0, 5).map((l) => (
          <span
            key={l.name}
            className="t-mono-xs px-1.5 py-0.5 inline-flex items-center gap-1"
            style={{ border: "1px solid rgba(192,68,15,0.3)", borderRadius: 999 }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: langDots[l.name] ?? "var(--orange)" }}
            />
            {l.name} · {l.count}
          </span>
        ))}
      </div>
    </div>
  );
}

function ProjectsExpanded({ github }: { github: GithubData }) {
  const featured = projects;
  const liveRepos = github.ownedRepos.slice(0, 10);

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="grid h-full min-h-0"
      style={{ gridTemplateColumns: "1fr 1.5fr", gap: "clamp(16px,1.6vw,32px)" }}
    >
      {/* Left: featured curated projects */}
      <motion.div variants={fadeUp} className="flex flex-col min-h-0 min-w-0">
        <p className="t-mono opacity-70 mb-1.5">featured · curated</p>
        <ul className="flex flex-col gap-[clamp(6px,1svh,12px)] overflow-hidden">
          {featured.map((p, i) => (
            <li
              key={p.name}
              className="pt-[clamp(6px,0.9svh,10px)] min-w-0"
              style={{ borderTop: i === 0 ? undefined : "1px solid rgba(192,68,15,0.18)" }}
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="t-display text-[clamp(16px,1.5vw,24px)] truncate">{p.name}</p>
                <p className="t-mono-xs opacity-60 shrink-0">{p.context.split(",")[0]}</p>
              </div>
              <p className="t-serif text-[clamp(12px,0.9vw,15px)] line-clamp-2" style={{ color: "var(--orange)" }}>
                {p.description}
              </p>
              <p className="t-mono-xs mt-1 opacity-70 truncate">
                {p.technologies.slice(0, 5).join(" · ")}
              </p>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Right: live GitHub repos */}
      <motion.div variants={fadeUp} className="flex flex-col min-h-0 min-w-0">
        <div className="flex items-baseline justify-between mb-1.5">
          <p className="t-mono opacity-70 inline-flex items-center gap-1.5">
            <span className="live-dot" /> live · github
          </p>
          <a
            href={profile.social.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="t-mono link-line"
            style={{ opacity: 0.75 }}
          >
            @{profile.social.githubUser} ↗
          </a>
        </div>
        <ul
          className="grid gap-[clamp(5px,0.7svh,8px)] overflow-hidden auto-rows-fr min-h-0"
          style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
        >
          {liveRepos.map((r) => (
            <RepoTile key={r.id} repo={r} />
          ))}
        </ul>
      </motion.div>
    </motion.div>
  );
}

function RepoTile({ repo }: { repo: GithubRepo }) {
  return (
    <li>
      <a
        href={repo.html_url}
        target="_blank"
        rel="noreferrer"
        className="flex flex-col min-h-0 min-w-0 justify-between px-2.5 py-1.5 transition-transform hover:-translate-y-0.5"
        style={{
          border: "1px solid rgba(192,68,15,0.2)",
          borderRadius: "clamp(8px,0.7vw,12px)",
        }}
      >
        <div className="flex items-baseline justify-between gap-2 min-w-0">
          <p className="t-display text-[clamp(12px,1vw,16px)] truncate">
            {repo.name}
          </p>
          <p className="t-mono-xs opacity-60 shrink-0">
            {formatRelative(repo.pushed_at)}
          </p>
        </div>
        <p className="t-body text-[clamp(10px,0.72vw,12px)] line-clamp-1" style={{ opacity: 0.72 }}>
          {repo.description ?? "no description"}
        </p>
        <div className="flex items-center gap-2.5 min-w-0">
          {repo.language && (
            <span className="t-mono-xs inline-flex items-center gap-1 truncate">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: langDots[repo.language] ?? "var(--orange)" }}
              />
              {repo.language}
            </span>
          )}
          {repo.stargazers_count > 0 && (
            <span className="t-mono-xs opacity-70">★ {repo.stargazers_count}</span>
          )}
          {repo.forks_count > 0 && (
            <span className="t-mono-xs opacity-70">⑂ {repo.forks_count}</span>
          )}
        </div>
      </a>
    </li>
  );
}

function formatRelative(iso: string) {
  const d = new Date(iso);
  const now = Date.now();
  const diff = Math.max(0, now - d.getTime());
  const day = 24 * 60 * 60 * 1000;
  if (diff < day) return "today";
  if (diff < 7 * day) return `${Math.round(diff / day)}d`;
  if (diff < 30 * day) return `${Math.round(diff / (7 * day))}w`;
  if (diff < 365 * day) return `${Math.round(diff / (30 * day))}mo`;
  return `${Math.round(diff / (365 * day))}y`;
}

/* ───────────────────────── SKILLS ───────────────────────── */

function skillGroups() {
  return [
    { key: "Languages", items: profile.skills.languages },
    { key: "Frameworks", items: profile.skills.frameworks },
    { key: "Databases", items: profile.skills.databases },
    { key: "Tooling", items: profile.skills.tools },
  ];
}

function SkillsCollapsed({ github }: { github: GithubData }) {
  const groups = skillGroups();
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  const top = github.topLanguages[0]?.name ?? "Python";

  return (
    <div className="flex flex-col justify-between w-full h-full gap-2 min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <p className="t-mono opacity-70">tools, daily</p>
        <p className="t-mono opacity-60 shrink-0">{total} total</p>
      </div>

      <h3
        className="t-display"
        style={{ fontSize: "clamp(24px, 3vw, 48px)", lineHeight: 0.94 }}
      >
        <SplitText delay={0.1}>{top}</SplitText>
        <span className="t-serif" style={{ color: "var(--orange)", fontSize: "0.55em" }}>
          {" "}
          <SplitText delay={0.4} className="t-serif">most used</SplitText>
        </span>
      </h3>

      <div className="flex flex-wrap gap-1">
        {profile.skills.frameworks.slice(0, 4).map((f) => (
          <span
            key={f}
            className="t-mono-xs px-1.5 py-0.5"
            style={{ border: "1px solid rgba(192,68,15,0.3)", borderRadius: 999 }}
          >
            {f}
          </span>
        ))}
      </div>
    </div>
  );
}

function SkillsExpanded({ github }: { github: GithubData }) {
  const groups = skillGroups();
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="grid h-full" style={{ gridTemplateColumns: "1.1fr 2fr", gap: "clamp(24px,2.4vw,48px)" }}>
      <motion.div variants={fadeUp} className="flex flex-col justify-between gap-3 min-w-0">
        <div>
          <p className="t-mono opacity-70 mb-2">the stack</p>
          <h2 className="t-display" style={{ fontSize: "clamp(26px,3.4vw,58px)", lineHeight: 0.92 }}>
            <SplitText delay={0.1}>Pragmatic,</SplitText>
            <br />
            <SplitText className="t-serif" style={{ color: "var(--orange)" }} delay={0.36}>not</SplitText>{" "}
            <SplitText delay={0.55}>trendy.</SplitText>
          </h2>
        </div>
        <div>
          <p className="t-mono opacity-70 mb-1">measured on github</p>
          <div className="flex flex-wrap gap-1">
            {github.topLanguages.map((l) => (
              <span key={l.name} className="t-mono-xs px-1.5 py-0.5 inline-flex items-center gap-1" style={{ border: "1px solid rgba(192,68,15,0.3)", borderRadius: 999 }}>
                <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: langDots[l.name] ?? "var(--orange)" }} />
                {l.name} · {l.count}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="grid h-full gap-x-[clamp(14px,1.4vw,24px)] gap-y-[clamp(8px,1.2svh,14px)] min-h-0" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        {groups.map((g) => (
          <div key={g.key} className="flex flex-col pt-[clamp(6px,0.8svh,10px)] min-w-0" style={{ borderTop: "1px solid rgba(192,68,15,0.22)" }}>
            <div className="flex items-baseline justify-between mb-1">
              <p className="t-mono opacity-80">{g.key}</p>
              <p className="t-mono-xs opacity-50">{String(g.items.length).padStart(2, "0")}</p>
            </div>
            <ul className="flex flex-wrap gap-x-[clamp(6px,0.8vw,12px)] gap-y-0 min-w-0">
              {g.items.map((it) => (
                <li
                  key={it}
                  className="t-display text-[clamp(13px,1.2vw,20px)] min-w-0 max-w-full"
                  style={{ lineHeight: 1.05, overflowWrap: "break-word", wordBreak: "break-word" }}
                >
                  {it}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}

/* ───────────────────────── ANALYTICS ───────────────────────── */

function buildAnalytics(github: GithubData) {
  const repos = github.ownedRepos;
  // Year buckets from pushed_at
  const yearCounts = new Map<number, number>();
  for (const r of repos) {
    const y = new Date(r.pushed_at).getFullYear();
    yearCounts.set(y, (yearCounts.get(y) ?? 0) + 1);
  }
  const years = [...yearCounts.entries()]
    .map(([y, n]) => ({ year: y, count: n }))
    .sort((a, b) => a.year - b.year);

  // Languages with percentages
  const total = github.topLanguages.reduce((n, l) => n + l.count, 0) || 1;
  const langPct = github.topLanguages.map((l) => ({
    ...l,
    pct: Math.round((l.count / total) * 100),
  }));

  // Top recent repos (already sorted by pushed_at)
  const recent = repos.slice(0, 6);

  // joined year
  const joinedYear = github.user
    ? new Date(github.user.created_at).getFullYear()
    : null;

  return { years, langPct, recent, total, joinedYear };
}

function computeExperienceYears() {
  const starts = experiences
    .map((e) => {
      const startStr = e.period.split(/\s*[-–]\s*/)[0];
      const t = new Date(startStr).getTime();
      return Number.isFinite(t) ? t : null;
    })
    .filter((t): t is number => t !== null);
  if (starts.length === 0) return 1;
  const earliest = Math.min(...starts);
  const years = (Date.now() - earliest) / (365.25 * 24 * 60 * 60 * 1000);
  return Math.max(1, Math.floor(years));
}

/* Mini language bar — stacked horizontal */
function LanguageBar({
  data,
  height = 8,
}: {
  data: { name: string; pct: number }[];
  height?: number;
}) {
  return (
    <div
      className="flex w-full overflow-hidden"
      style={{ height, borderRadius: 999, background: "rgba(244,235,216,0.18)" }}
    >
      {data.map((d, i) => (
        <motion.span
          key={d.name}
          initial={{ width: 0 }}
          animate={{ width: `${d.pct}%` }}
          transition={{ duration: 0.9, delay: 0.1 + i * 0.08, ease }}
          style={{
            background: langDots[d.name] ?? (i % 2 === 0 ? "var(--cream)" : "var(--orange-soft)"),
            opacity: 1 - i * 0.08,
          }}
          title={`${d.name} ${d.pct}%`}
        />
      ))}
    </div>
  );
}

/* Donut chart — hollow-center ring of language percentages */
function LanguageDonut({
  data,
  size = 160,
  thickness,
  centerLabel,
  centerSublabel,
}: {
  data: { name: string; pct: number }[];
  size?: number;
  thickness?: number;
  centerLabel?: string | number;
  centerSublabel?: string;
}) {
  const stroke = thickness ?? Math.max(12, Math.round(size * 0.14));
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const gap = 1.5;
  const [hovered, setHovered] = useState<number | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);

  let cumulative = 0;
  const segments = data.map((d, i) => {
    const len = (d.pct / 100) * circumference;
    const dash = Math.max(0, len - gap);
    const offset = -cumulative;
    cumulative += len;
    return { d, i, dash, offset, color: langDots[d.name] ?? (i % 2 === 0 ? "var(--cream)" : "var(--orange-soft)") };
  });

  const active = hovered !== null ? data[hovered] : null;
  const activeColor = active
    ? langDots[active.name] ?? "var(--cream)"
    : "var(--cream)";

  const handleMove = (e: ReactMouseEvent<SVGCircleElement>) => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setTip({ x: e.clientX - r.left, y: e.clientY - r.top });
  };

  return (
    <div ref={wrapRef} className="relative inline-block" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="rgba(244,235,216,0.14)"
            strokeWidth={stroke}
          />
          {segments.map((s) => {
            const isActive = hovered === s.i;
            const isDimmed = hovered !== null && !isActive;
            return (
              <motion.circle
                key={s.d.name}
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth={isActive ? stroke + 4 : stroke}
                strokeLinecap="butt"
                initial={{ strokeDasharray: `0 ${circumference}` }}
                animate={{ strokeDasharray: `${s.dash} ${circumference - s.dash}` }}
                transition={{
                  duration: 0.85,
                  delay: CONTENT_BASE_DELAY + 0.5 + s.i * 0.09,
                  ease,
                }}
                onMouseEnter={() => setHovered(s.i)}
                onMouseLeave={() => setHovered(null)}
                onMouseMove={handleMove}
                style={{
                  strokeDashoffset: s.offset,
                  opacity: isDimmed ? 0.3 : 1,
                  cursor: "pointer",
                  transition: "stroke-width 0.2s ease, opacity 0.2s ease",
                }}
              />
            );
          })}
        </g>
      </svg>
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.55,
          delay: CONTENT_BASE_DELAY + 1.1,
          ease,
        }}
      >
        {centerLabel !== undefined && (
          <span
            className="t-retro"
            style={{ fontSize: size * 0.34, lineHeight: 0.9 }}
          >
            {centerLabel}
          </span>
        )}
        {centerSublabel && (
          <span
            className="t-mono mt-1"
            style={{ opacity: 0.7, fontSize: size * 0.075 }}
          >
            {centerSublabel}
          </span>
        )}
      </motion.div>
      <AnimatePresence>
        {active && (
          <motion.div
            key="donut-tip"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15, ease }}
            className="t-mono pointer-events-none absolute z-10 whitespace-nowrap inline-flex items-center gap-1.5"
            style={{
              left: tip.x,
              top: tip.y,
              transform: "translate(-50%, calc(-100% - 10px))",
              fontSize: "clamp(10px,0.72vw,12px)",
              color: "var(--cream)",
              padding: "3px 7px",
              background: "rgba(35,21,16,0.92)",
              border: `1px solid ${activeColor}`,
              borderRadius: 4,
            }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: activeColor }}
            />
            {active.name} · {active.pct}%
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Activity histogram — vertical bars with hover tooltip */
function ActivityBars({
  years,
  maxYear,
}: {
  years: { year: number; count: number }[];
  maxYear: number;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  return (
    <div
      className="grid items-end gap-[clamp(2px,0.3vw,4px)] h-[clamp(80px,12svh,150px)]"
      style={{ gridTemplateColumns: `repeat(${Math.max(1, years.length)}, minmax(0, 1fr))` }}
    >
      {years.map((y, i) => {
        const isActive = hovered === i;
        const isDimmed = hovered !== null && !isActive;
        return (
          <div
            key={y.year}
            className="relative flex h-full w-full items-end"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: "pointer" }}
          >
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(y.count / maxYear) * 100}%` }}
              transition={{
                duration: 0.7,
                delay: CONTENT_BASE_DELAY + 0.35 + i * 0.05,
                ease,
              }}
              style={{
                width: "100%",
                background: "var(--cream)",
                borderRadius: "2px 2px 0 0",
                opacity: isDimmed ? 0.35 : isActive ? 1 : 0.85,
                transition: "opacity 0.2s ease",
              }}
            />
            <AnimatePresence>
              {isActive && (
                <motion.span
                  key="tip"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.18, ease }}
                  className="t-mono pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap z-10"
                  style={{
                    bottom: "calc(100% + 4px)",
                    fontSize: "clamp(10px,0.72vw,12px)",
                    color: "var(--cream)",
                    padding: "2px 6px",
                    background: "rgba(35,21,16,0.9)",
                    border: "1px solid rgba(244,235,216,0.3)",
                    borderRadius: 4,
                  }}
                >
                  {y.year}: {y.count}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

function AnalyticsCollapsed({ github }: { github: GithubData }) {
  const { years, joinedYear, langPct } = buildAnalytics(github);
  const yearsOnGithub = joinedYear ? new Date().getFullYear() - joinedYear : null;
  const heroYears = yearsOnGithub ?? computeExperienceYears();
  const maxYear = Math.max(1, ...years.map((y) => y.count));
  const headline = github.ownedRepos.slice(0, 10);
  const reduce = useReducedMotion();

  const colHidden = reduce ? false : { opacity: 0, y: 18 };

  return (
    <div className="flex flex-col w-full h-full gap-3 min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <p
          className="t-mono-xs shrink-0"
          style={{ opacity: 0.7, fontSize: "clamp(10px,0.78vw,13px)", letterSpacing: "0.18em" }}
        >
          projects info
        </p>
        <p
          className="t-mono-xs shrink-0 inline-flex items-center gap-1.5"
          style={{ opacity: 0.7, fontSize: "clamp(10px,0.78vw,13px)" }}
        >
          <span className="live-dot" />
          {joinedYear ? `since ${joinedYear}` : "github"}
        </p>
      </div>

      {/* 3-column body */}
      <div
        className="grid flex-1 min-h-0 gap-[clamp(14px,1.6vw,28px)]"
        style={{ gridTemplateColumns: "1fr 0.9fr 1.15fr", paddingTop: "clamp(12px,1.6svh,22px)" }}
      >
        {/* Left: hero retro number + activity chart */}
        <motion.div
          className="flex flex-col justify-between min-w-0 min-h-0"
          initial={colHidden}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: CONTENT_BASE_DELAY + 0.2 }}
        >
          <div className="flex items-end gap-3 min-w-0">
            <p
              className="t-retro"
              style={{
                fontSize: "clamp(72px,8.4vw,180px)",
                textShadow:
                  "4px 4px 0 rgba(244,235,216,0.2), 8px 8px 0 rgba(244,235,216,0.08)",
              }}
            >
              <Counter to={heroYears} startDelay={CONTENT_BASE_DELAY + 0.35} />
            </p>
            <p
              className="t-display shrink-0 pb-2"
              style={{
                opacity: 0.85,
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
                fontSize: "clamp(14px,1.2vw,22px)",
                fontWeight: 700,
                letterSpacing: "0.04em",
              }}
            >
              years
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <p
              className="t-mono"
              style={{ opacity: 0.7, fontSize: "clamp(11px,0.85vw,14px)", letterSpacing: "0.08em" }}
            >
              activity · pushed
            </p>
            <ActivityBars years={years} maxYear={maxYear} />
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${Math.max(1, years.length)}, minmax(0, 1fr))`,
                opacity: 0.65,
              }}
            >
              {years.map((y, i) => (
                <motion.span
                  key={y.year}
                  className="t-mono text-center"
                  style={{ fontSize: "clamp(10px,0.78vw,13px)" }}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: CONTENT_BASE_DELAY + 0.9 + i * 0.05,
                    ease,
                  }}
                >
                  &apos;{String(y.year).slice(2)}
                </motion.span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Middle: language ring chart */}
        <motion.div
          className="flex flex-col gap-2 min-w-0 min-h-0 pl-[clamp(12px,1.2vw,22px)]"
          style={{ borderLeft: "1px solid rgba(244,235,216,0.22)" }}
          initial={colHidden}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: CONTENT_BASE_DELAY + 0.35 }}
        >
          <div className="flex items-baseline justify-between gap-2">
            <p
              className="t-mono"
              style={{ opacity: 0.75, fontSize: "clamp(11px,0.85vw,14px)", letterSpacing: "0.08em" }}
            >
              languages · github
            </p>
            <p
              className="t-mono-xs shrink-0"
              style={{ opacity: 0.55, fontSize: "clamp(10px,0.78vw,13px)" }}
            >
              {langPct.length} tracked
            </p>
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <LanguageDonut
              data={langPct}
              size={170}
              centerLabel={langPct.length}
              centerSublabel="langs"
            />
          </div>
          <ul className="flex flex-wrap gap-x-2 gap-y-0.5 mt-auto min-w-0">
            {langPct.slice(0, 4).map((l, i) => (
              <motion.li
                key={l.name}
                className="inline-flex items-center gap-1.5 t-mono-xs min-w-0"
                style={{ fontSize: "clamp(10px,0.78vw,13px)" }}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 0.85, x: 0 }}
                transition={{
                  duration: 0.45,
                  delay: CONTENT_BASE_DELAY + 1.2 + i * 0.07,
                  ease,
                }}
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: langDots[l.name] ?? "var(--cream-soft)" }}
                />
                <span className="truncate">{l.name}</span>
                <span style={{ opacity: 0.65 }}>{l.pct}%</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Right: live repos */}
        <motion.div
          className="flex flex-col gap-2 min-w-0 min-h-0 pl-[clamp(12px,1.2vw,22px)]"
          style={{ borderLeft: "1px solid rgba(244,235,216,0.22)" }}
          initial={colHidden}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: CONTENT_BASE_DELAY + 0.5 }}
        >
          <div className="flex items-baseline justify-between gap-2">
            <p
              className="t-mono inline-flex items-center gap-1.5"
              style={{ opacity: 0.75, fontSize: "clamp(11px,0.85vw,14px)", letterSpacing: "0.08em" }}
            >
              <span className="live-dot" /> repos · live
            </p>
            <p
              className="t-mono-xs shrink-0"
              style={{ opacity: 0.6, fontSize: "clamp(10px,0.78vw,13px)" }}
            >
              ★ {github.totalStars}
            </p>
          </div>
          <ul className="flex flex-col gap-1 overflow-hidden min-h-0">
            {headline.slice(0, 8).map((r, i) => (
              <motion.li
                key={r.id}
                className="flex items-baseline justify-between gap-2 min-w-0"
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.45,
                  delay: CONTENT_BASE_DELAY + 0.95 + i * 0.06,
                  ease,
                }}
              >
                <span className="inline-flex items-baseline gap-2 min-w-0">
                  <span
                    className="inline-block w-2 h-2 rounded-full shrink-0 translate-y-px"
                    style={{ background: langDots[r.language ?? ""] ?? "var(--cream-soft)" }}
                  />
                  <span
                    className="t-display truncate"
                    style={{
                      fontSize: "clamp(14px,1.2vw,20px)",
                      fontWeight: 600,
                      letterSpacing: "-0.005em",
                    }}
                  >
                    {r.name}
                  </span>
                </span>
                <span
                  className="t-mono shrink-0"
                  style={{ opacity: 0.6, fontSize: "clamp(10px,0.8vw,13px)" }}
                >
                  {formatRelative(r.pushed_at)}
                </span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}

function AnalyticsExpanded({ github }: { github: GithubData }) {
  const { langPct, years, joinedYear } = buildAnalytics(github);
  const maxYear = Math.max(1, ...years.map((y) => y.count));
  const u = github.user;
  const groups = skillGroups();
  const repoCount = u?.public_repos ?? github.ownedRepos.length;
  const featured = projects;
  const liveRepos = github.ownedRepos.slice(0, 8);
  const [openProject, setOpenProject] = useState<string | null>(featured[0]?.name ?? null);

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="grid h-full min-h-0"
      style={{
        gridTemplateColumns: "0.95fr 1.15fr 1.25fr",
        gap: "clamp(16px,1.8vw,32px)",
      }}
    >
      {/* Left: hero retro number + stat list */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col justify-between min-w-0 min-h-0 gap-3 overflow-y-auto overflow-x-hidden"
        style={{ scrollbarWidth: "thin" }}
      >
        <div style={{ paddingTop: "clamp(16px,2.2svh,32px)" }}>
          {joinedYear && (
            <div className="flex items-end gap-2">
              <p
                className="t-retro"
                style={{
                  fontSize: "clamp(64px,7vw,140px)",
                  textShadow:
                    "3px 3px 0 rgba(244,235,216,0.2), 6px 6px 0 rgba(244,235,216,0.08)",
                }}
              >
                <Counter to={new Date().getFullYear() - joinedYear} />
              </p>
              <p
                className="t-mono pb-2"
                style={{ opacity: 0.8, fontSize: "clamp(12px,1vw,16px)", letterSpacing: "0.08em" }}
              >
                years
              </p>
            </div>
          )}
          <div
            className="mt-3 flex items-end gap-2"
            style={{ paddingTop: "clamp(6px,0.8svh,10px)" }}
          >
            <p
              className="t-retro"
              style={{
                fontSize: "clamp(64px,7vw,140px)",
                textShadow:
                  "3px 3px 0 rgba(244,235,216,0.2), 6px 6px 0 rgba(244,235,216,0.08)",
              }}
            >
              <Counter to={repoCount} />
            </p>
            <p
              className="t-mono pb-2"
              style={{ opacity: 0.8, fontSize: "clamp(12px,1vw,16px)", letterSpacing: "0.08em" }}
            >
              public repos
            </p>
          </div>
          <h2
            className="t-display mt-4"
            style={{
              fontSize: "clamp(34px,4vw,72px)",
              lineHeight: 0.9,
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            <SplitText delay={0.1}>Built</SplitText>{" "}
            <SplitText className="t-serif" style={{ color: "var(--cream-soft)", fontWeight: 400 }} delay={0.28}>over</SplitText>
            <br />
            <SplitText delay={0.46}>the years.</SplitText>
          </h2>
        </div>
        <ul className="flex flex-col gap-2">
          {[
            { k: "followers", v: u?.followers ?? 0 },
            { k: "following", v: u?.following ?? 0 },
            { k: "total stars", v: github.totalStars },
            { k: "joined", v: joinedYear ?? "—" },
          ].map((s) => (
            <li
              key={s.k}
              className="flex items-baseline justify-between gap-3 pt-1.5"
              style={{ borderTop: "1px solid rgba(244,235,216,0.2)" }}
            >
              <span
                className="t-mono opacity-75"
                style={{ fontSize: "clamp(11px,0.85vw,14px)", letterSpacing: "0.08em" }}
              >
                {s.k}
              </span>
              <span
                className="t-num"
                style={{ fontSize: "clamp(20px,1.8vw,30px)", fontWeight: 700 }}
              >
                {typeof s.v === "number" ? <Counter to={s.v} /> : s.v}
              </span>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Middle: featured projects (accordion) + live GitHub repos */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col min-w-0 min-h-0 gap-3 overflow-y-auto overflow-x-hidden"
        style={{ scrollbarWidth: "thin" }}
      >
        <div className="flex flex-col">
          <div className="flex items-baseline justify-between mb-2">
            <p className="t-mono opacity-70">featured · curated</p>
            <p className="t-mono-xs opacity-60">{featured.length} projects · click to expand</p>
          </div>
          <ul className="flex flex-col">
            {featured.map((p, i) => {
              const isOpen = openProject === p.name;
              return (
                <li
                  key={p.name}
                  className="min-w-0"
                  style={{ borderTop: i === 0 ? "1px solid rgba(244,235,216,0.22)" : "1px solid rgba(244,235,216,0.14)" }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenProject(isOpen ? null : p.name)}
                    aria-expanded={isOpen}
                    className="w-full flex items-baseline justify-between gap-3 text-left py-[clamp(8px,1svh,14px)] group"
                  >
                    <span className="inline-flex items-baseline gap-2 min-w-0">
                      <span
                        className="t-retro shrink-0"
                        style={{
                          fontSize: "clamp(22px,2.2vw,38px)",
                          opacity: isOpen ? 1 : 0.55,
                          transition: "opacity 0.3s ease",
                        }}
                      >
                        {isOpen ? "−" : "+"}
                      </span>
                      <span
                        className="t-display truncate"
                        style={{
                          fontSize: "clamp(22px,2.2vw,38px)",
                          fontWeight: 700,
                          letterSpacing: "-0.01em",
                          lineHeight: 1,
                        }}
                      >
                        {p.name}
                      </span>
                    </span>
                    <span className="t-mono-xs opacity-55 shrink-0">{p.context.split(",")[0]}</span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="body"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease }}
                        className="overflow-hidden"
                      >
                        <div className="pb-[clamp(10px,1.4svh,18px)] pl-[clamp(20px,2vw,36px)] flex flex-col gap-2">
                          <p
                            className="t-serif"
                            style={{
                              color: "var(--cream-soft)",
                              fontSize: "clamp(14px,1.1vw,20px)",
                              lineHeight: 1.45,
                              letterSpacing: "0.005em",
                            }}
                          >
                            {p.description}
                          </p>
                          <ul className="flex flex-col gap-1 mt-1">
                            {p.highlights.map((h) => (
                              <li
                                key={h}
                                className="t-body flex items-baseline gap-2"
                                style={{
                                  fontSize: "clamp(12px,0.95vw,15px)",
                                  lineHeight: 1.5,
                                  opacity: 0.88,
                                }}
                              >
                                <span className="opacity-50 shrink-0">·</span>
                                <span>{h}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {p.technologies.map((t) => (
                              <span
                                key={t}
                                className="t-mono-xs px-2 py-0.5"
                                style={{
                                  border: "1px solid rgba(244,235,216,0.3)",
                                  borderRadius: 999,
                                  letterSpacing: "0.06em",
                                }}
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex flex-col">
          <div className="flex items-baseline justify-between mb-2">
            <p className="t-mono opacity-70 inline-flex items-center gap-1.5">
              <span className="live-dot" /> repos · live
            </p>
            <a
              href={profile.social.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="t-mono-xs opacity-70 link-line inline-flex items-center gap-1"
            >
              <SocialIcon name="github" size={12} /> @{profile.social.githubUser} ↗
            </a>
          </div>
          <ul
            className="grid gap-[clamp(4px,0.6svh,8px)] overflow-hidden"
            style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
          >
            {liveRepos.map((r) => (
              <li key={r.id} className="min-w-0">
                <a
                  href={r.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-baseline justify-between gap-2 py-0.5 group"
                >
                  <span className="inline-flex items-baseline gap-1.5 min-w-0">
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full shrink-0 translate-y-px"
                      style={{ background: langDots[r.language ?? ""] ?? "var(--cream-soft)" }}
                    />
                    <span className="t-display text-[clamp(11px,0.92vw,14px)] truncate link-line">
                      {r.name}
                    </span>
                  </span>
                  <span className="t-mono-xs opacity-55 shrink-0">
                    {formatRelative(r.pushed_at)}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      {/* Right: resume stack + GitHub languages donut + activity histogram */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col min-w-0 min-h-0 gap-3 overflow-y-auto overflow-x-hidden"
        style={{ scrollbarWidth: "thin" }}
      >
        <div className="flex flex-col">
          <div className="flex items-baseline justify-between mb-3">
            <p
              className="t-mono opacity-75"
              style={{ fontSize: "clamp(12px,0.95vw,15px)", letterSpacing: "0.08em" }}
            >
              stack · from resume
            </p>
            <p className="t-mono-xs opacity-60">
              {groups.reduce((n, g) => n + g.items.length, 0)} total
            </p>
          </div>
          <ul
            className="grid gap-x-[clamp(14px,1.4vw,24px)] gap-y-[clamp(10px,1.4svh,18px)] min-h-0"
            style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
          >
            {groups.map((g) => (
              <li
                key={g.key}
                className="flex flex-col pt-[clamp(6px,0.8svh,10px)] min-w-0"
                style={{ borderTop: "1px solid rgba(244,235,216,0.22)" }}
              >
                <div className="flex items-baseline justify-between mb-2">
                  <p
                    className="t-display"
                    style={{
                      fontSize: "clamp(14px,1.1vw,19px)",
                      fontWeight: 700,
                      letterSpacing: "-0.005em",
                      textTransform: "lowercase",
                    }}
                  >
                    {g.key.toLowerCase()}
                  </p>
                  <p className="t-mono-xs opacity-50">
                    {String(g.items.length).padStart(2, "0")}
                  </p>
                </div>
                <ul className="flex flex-wrap gap-[clamp(4px,0.5svh,6px)] min-w-0">
                  {g.items.map((it) => (
                    <li
                      key={it}
                      className="t-mono"
                      style={{
                        fontSize: "clamp(10px,0.78vw,12px)",
                        padding: "clamp(3px,0.4svh,5px) clamp(7px,0.7vw,10px)",
                        border: "1px solid rgba(244,235,216,0.22)",
                        borderRadius: 999,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                        maxWidth: "100%",
                      }}
                    >
                      {it}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-3" style={{ borderTop: "1px solid rgba(244,235,216,0.22)" }}>
          <div className="flex items-baseline justify-between mb-3">
            <p className="t-mono opacity-70">languages · github</p>
            <p className="t-mono-xs opacity-60">{langPct.length} tracked</p>
          </div>
          <div className="flex items-center gap-[clamp(12px,1.4vw,22px)] min-w-0">
            <LanguageDonut
              data={langPct}
              size={Math.min(180, 160)}
              centerLabel={langPct.length}
              centerSublabel="langs"
            />
            <ul className="flex flex-col gap-1.5 min-w-0 flex-1">
              {langPct.map((l, i) => (
                <li key={l.name} className="flex items-baseline justify-between gap-2 min-w-0">
                  <span className="inline-flex items-center gap-1.5 min-w-0">
                    <span
                      className="inline-block w-2 h-2 rounded-full shrink-0"
                      style={{ background: langDots[l.name] ?? (i % 2 === 0 ? "var(--cream)" : "var(--orange-soft)") }}
                    />
                    <span
                      className="t-display truncate"
                      style={{ fontSize: "clamp(13px,1.1vw,18px)", letterSpacing: "0.01em" }}
                    >
                      {l.name}
                    </span>
                  </span>
                  <span className="t-num shrink-0" style={{ fontSize: "clamp(13px,1.1vw,18px)" }}>
                    {l.pct}%
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-baseline justify-between mt-3 mb-1.5">
            <p className="t-mono opacity-70">activity · pushed</p>
            <p className="t-mono-xs opacity-60">{years.length} yrs</p>
          </div>
          <ActivityBars years={years} maxYear={maxYear} />
          <div
            className="grid mt-1"
            style={{
              gridTemplateColumns: `repeat(${Math.max(1, years.length)}, minmax(0, 1fr))`,
              opacity: 0.55,
            }}
          >
            {years.map((y) => (
              <span
                key={y.year}
                className="t-mono-xs text-center"
              >
                &apos;{String(y.year).slice(2)}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ───────────────────────── Stat / Atmosphere ───────────────────────── */

function Stat({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: number | string;
  mono?: boolean;
}) {
  const num = typeof value === "number" ? <Counter to={value} /> : value;
  return (
    <div className="min-w-0">
      <p className="t-mono-xs" style={{ opacity: 0.65 }}>{label}</p>
      <p
        className={`${mono ? "t-mono" : "t-num"} mt-0.5 truncate`}
        style={{ fontSize: mono ? "clamp(11px,0.9vw,14px)" : "clamp(20px,2vw,32px)" }}
      >
        {num}
      </p>
    </div>
  );
}

function Counter({ to, startDelay = 0 }: { to: number; startDelay?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    let startTime: number | null = null;
    const dur = 900;
    const step = (t: number) => {
      if (startTime === null) startTime = t;
      const p = Math.min(1, (t - startTime) / dur);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(eased * to));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    const delayMs = Math.max(0, startDelay * 1000);
    const timer = setTimeout(() => {
      raf = requestAnimationFrame(step);
    }, delayMs);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [to, startDelay]);
  return <>{n}</>;
}

function BackgroundField({ reduce }: { reduce: boolean }) {
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
