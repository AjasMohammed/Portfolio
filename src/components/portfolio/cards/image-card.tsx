"use client";

import Image from "next/image";
import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { certificates } from "@/data/profile";
import { ease, CONTENT_BASE_DELAY } from "../constants";
import { SplitText } from "../split-text";

/* ───────────────────────── IMAGE ───────────────────────── */

export function ImageInner() {
  const reduce = useReducedMotion();

  // Pointer position normalized to [-1, 1] over the card.
  const px = useMotionValue(0);
  const py = useMotionValue(0);

  // Spring smoothing so movement feels weighted, not jittery.
  const sx = useSpring(px, { stiffness: 90, damping: 18, mass: 0.6 });
  const sy = useSpring(py, { stiffness: 90, damping: 18, mass: 0.6 });

  // Depth layers — background drifts slightly, foreground travels further
  // and tilts, which sells the parallax illusion.
  const bgX = useTransform(sx, (v) => v * 10);
  const bgY = useTransform(sy, (v) => v * 6);
  const fgX = useTransform(sx, (v) => v * 28);
  const fgY = useTransform(sy, (v) => v * 18);
  const fgRotY = useTransform(sx, (v) => v * 4);
  const fgRotX = useTransform(sy, (v) => v * -3);

  const containerRef = useRef<HTMLDivElement | null>(null);

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduce) return;
    const el = containerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
    px.set(nx);
    py.set(ny);
  }

  function handleLeave() {
    px.set(0);
    py.set(0);
  }

  return (
    <div
      ref={containerRef}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className="relative h-full w-full"
      style={{ borderRadius: "inherit", perspective: 900 }}
    >
      {/* Mobile + tablet: single portrait image with the wipe reveal.
          The desktop card shape (tall + narrow) lets the foreground spill
          above and below the card; the tablet shape (wide + short) and
          mobile shape (very small) don't have that geometry, so we fall
          back to the original single-image treatment. */}
      <div
        className="absolute inset-0 overflow-hidden lg:hidden"
        style={{ borderRadius: "inherit" }}
      >
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
            // This variant is lg:hidden — on desktop viewports resolve it to a
            // 16px source so the (still-issued) request costs ~1KB, not the
            // full-size image. Mirrors the `lg` custom variant in globals.css.
            sizes="(min-width: 1280px) 16px, (min-width: 1024px) and (max-height: 800px) 16px, 100vw"
            priority
            className="object-cover object-top scale-[1.08] transition-transform duration-500 ease-out group-hover:scale-100"
          />
        </motion.div>
        <div
          className="absolute inset-x-0 top-0 h-[22%] pointer-events-none"
          style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.32), transparent)" }}
        />
      </div>

      {/* Desktop: layered background, clipped to the card shape */}
      <div
        className="absolute inset-0 overflow-hidden hidden lg:block"
        style={{ borderRadius: "inherit" }}
      >
        <motion.div
          className="absolute inset-0"
          initial={reduce ? false : { clipPath: "inset(100% 0 0 0)" }}
          animate={{ clipPath: "inset(0% 0 0 0)" }}
          transition={{ duration: 1.1, ease, delay: CONTENT_BASE_DELAY }}
        >
          <motion.div
            className="absolute -inset-[6%]"
            style={{ x: bgX, y: bgY, willChange: "transform" }}
          >
            <Image
              src="/images/background.png"
              alt=""
              aria-hidden
              fill
              // Desktop-only (hidden lg:block) — phones/tablets fetch a 16px
              // stub instead of the full PNG.
              sizes="(min-width: 1280px) 34vw, (min-width: 1024px) and (max-height: 800px) 34vw, 16px"
              priority
              className="object-cover object-center scale-110 transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            />
          </motion.div>
        </motion.div>
        {/* Top fade so the chrome overlay text stays legible */}
        <div
          className="absolute inset-x-0 top-0 h-[22%] pointer-events-none"
          style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.32), transparent)" }}
        />
      </div>

      {/* Desktop: foreground escapes the card top, clipped at the card bottom.
          Outer holds parallax transforms; inner clips so anything pushed
          below the card edge is hidden. */}
      <motion.div
        className="absolute pointer-events-none hidden lg:block"
        style={{
          left: "-18%",
          right: "-18%",
          bottom: 0,
          height: "138%",
          x: fgX,
          y: fgY,
          rotateX: fgRotX,
          rotateY: fgRotY,
          transformPerspective: 900,
          transformOrigin: "50% 100%",
          willChange: "transform",
          zIndex: 3,
        }}
      >
        <motion.div
          className="absolute inset-0 overflow-hidden"
          initial={reduce ? false : { clipPath: "inset(100% 0 0 0)" }}
          animate={{ clipPath: "inset(0 0 0 0)" }}
          transition={{ duration: 1.1, ease, delay: CONTENT_BASE_DELAY }}
        >
          <div
            className="absolute inset-0"
            style={{ transform: "translateY(14%)" }}
          >
            <Image
              src="/images/foreground-2.png"
              alt="Illustrated portrait of Ajas Mohammed"
              fill
              // Desktop-only (hidden lg:block) — phones/tablets fetch a 16px
              // stub instead of the full PNG.
              sizes="(min-width: 1280px) 40vw, (min-width: 1024px) and (max-height: 800px) 40vw, 16px"
              priority
              className="object-cover object-bottom transition-transform duration-500 ease-out group-hover:scale-[1.04]"
              style={{ transformOrigin: "50% 100%" }}
            />
          </div>
        </motion.div>
      </motion.div>
      <div
        className="absolute left-3 right-3 bottom-3 hidden lg:flex compact:hidden items-end justify-between gap-2 text-cream"
        style={{ zIndex: 4 }}
      >
        <div className="min-w-0">
          <motion.p
            className="t-mono-xs opacity-85 truncate"
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

const PERSONAL_DETAILS: { k: string; v: string }[] = [
  { k: "Born", v: "January 20, 2002" },
  { k: "From", v: "Anchal, Kollam, Kerala" },
  { k: "Based in", v: "Kochi, India" },
  { k: "Speaks", v: "Malayalam · English" },
  { k: "Reads", v: "books, slowly" },
  { k: "Listens to", v: "music, always" },
  { k: "Tinkers with", v: "code on weekends" },
];

export function ImageExpanded() {
  return (
    <div
      className="flex flex-col h-full overflow-y-auto scrollbar-styled lg:grid lg:overflow-hidden lg:grid-cols-[1fr_clamp(220px,20vw,320px)]"
      style={{
        gap: "clamp(16px,1.6svh,28px)",
        color: "var(--orange-deep)",
      }}
    >
      <div
        className="flex flex-col min-w-0 gap-[clamp(16px,2svh,28px)] scrollbar-styled lg:overflow-y-auto lg:overflow-x-hidden lg:min-h-0 lg:w-[60vw]"
      >
        {/* Mobile only — small round avatar at top-right above the details */}
        <div className="flex justify-end lg:hidden">
          <Image
            src="/images/portrait.jpeg"
            alt="Portrait of Ajas Mohammed"
            width={200}
            height={200}
            sizes="96px"
            className="object-cover object-top shrink-0"
            style={{
              width: "clamp(64px, 18vw, 96px)",
              height: "clamp(64px, 18vw, 96px)",
              borderRadius: 9999,
              border: "1px solid rgba(192,68,15,0.32)",
            }}
          />
        </div>

        {/* Header — horizontal title lockup + tagline */}
        <header className="flex flex-col gap-[clamp(10px,1.4svh,18px)] min-w-0">
          <div className="flex items-baseline gap-[clamp(10px,1.6vw,20px)] min-w-0">
            <h2
              className="t-display shrink-0"
              style={{
                fontSize: "clamp(28px,5.4vw,58px)",
                lineHeight: 0.95,
                letterSpacing: "-0.015em",
                color: "var(--orange-deep)",
              }}
            >
              <SplitText delay={0.1}>About me.</SplitText>
            </h2>
            <span
              aria-hidden
              className="flex-1 min-w-0"
              style={{
                height: 1,
                background: "rgba(192,68,15,0.32)",
                transform: "translateY(-0.35em)",
              }}
            />
            <p
              className="t-mono-xs shrink-0"
              style={{
                opacity: 0.7,
                fontSize: "clamp(9px,2.2vw,12px)",
                letterSpacing: "0.18em",
                color: "var(--orange)",
                transform: "translateY(-0.35em)",
              }}
            >
              {String(PERSONAL_DETAILS.length).padStart(2, "0")}
            </p>
          </div>

          <p
            className="t-body"
            style={{
              fontSize: "clamp(12px,2.8vw,17px)",
              lineHeight: 1.45,
              opacity: 0.85,
              color: "var(--orange-deep)",
              maxWidth: "44ch",
            }}
          >
            The bits that don&apos;t fit on a résumé.
          </p>
        </header>

        {/* Editorial grid of personal details */}
        <ul
          className="grid grid-cols-1 sm:grid-cols-2 min-w-0"
          style={{
            gap: "clamp(2px, 0.2svh, 6px) clamp(16px,2.4vw,40px)",
          }}
        >
          {PERSONAL_DETAILS.map((row) => (
            <li
              key={row.k}
              className="flex flex-col min-w-0"
              style={{
                padding: "clamp(10px,1.4svh,18px) 0",
                borderTop: "1px solid rgba(192,68,15,0.22)",
              }}
            >
              <p
                className="t-mono-xs"
                style={{
                  fontSize: "clamp(9px,2vw,12px)",
                  letterSpacing: "0.22em",
                  opacity: 0.75,
                  textTransform: "uppercase",
                  color: "var(--orange)",
                }}
              >
                {row.k}
              </p>
              <p
                className="t-body min-w-0"
                style={{
                  fontSize: "clamp(14px,3vw,20px)",
                  lineHeight: 1.3,
                  letterSpacing: "0.005em",
                  color: "var(--orange-deep)",
                  overflowWrap: "break-word",
                  marginTop: "clamp(3px,0.5svh,6px)",
                }}
              >
                {row.v}
              </p>
            </li>
          ))}
        </ul>

        <div
          className="flex flex-col gap-[clamp(8px,1svh,14px)] min-w-0"
          style={{
            borderTop: "1px solid rgba(192,68,15,0.22)",
            paddingTop: "clamp(12px,1.6svh,20px)",
          }}
        >
          <p
            className="max-w-prose"
            style={{
              opacity: 0.85,
              fontFamily: "var(--font-hanken), system-ui, sans-serif",
              fontSize: "clamp(12px,2.6vw,15px)",
              lineHeight: 1.6,
              letterSpacing: "0.05em",
              color: "var(--orange-deep)",
              maxWidth: "60ch",
            }}
          >
            <span
              className="t-mono-xs"
              style={{
                color: "var(--orange)",
                opacity: 0.9,
                marginRight: "0.5em",
                letterSpacing: "0.18em",
              }}
            >
              btw —
            </span>
            on paper i&apos;m an electrical engineering diploma kid. code just got me first — curiosity for how things work, ideas that can ship the same week, and the rabbit holes of modern tooling pulled me in and never really let go.
          </p>
          <p
            className="max-w-prose"
            style={{
              opacity: 0.85,
              fontFamily: "var(--font-hanken), system-ui, sans-serif",
              fontSize: "clamp(12px,2.6vw,15px)",
              lineHeight: 1.6,
              letterSpacing: "0.05em",
              color: "var(--orange-deep)",
              maxWidth: "60ch",
            }}
          >
            <span
              className="t-mono-xs"
              style={{
                color: "var(--orange)",
                opacity: 0.9,
                marginRight: "0.5em",
                letterSpacing: "0.18em",
              }}
            >
              also —
            </span>
            never took a paid course or chased a fancy cert, so the badges over there are mostly hackerrank basics. please don&apos;t weigh me by those — i&apos;d rather the shipped work and the years on the keyboard speak first. I hope the skills and experience fill in what the paperwork misses.
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN — portrait + certificates */}
      <div
        className="flex flex-col gap-[clamp(10px,1.4svh,22px)] min-w-0 scrollbar-styled lg:min-h-0 lg:overflow-y-auto lg:overflow-x-hidden"
      >
        {/* Portrait — desktop only (mobile already shows it in the collapsed card) */}
        <Image
          src="/images/portrait.jpeg"
          alt="Illustrated portrait"
          width={853}
          height={1280}
          sizes="320px"
          className="hidden lg:block h-auto w-full self-start"
          style={{
            borderRadius: "clamp(5px,0.5vw,9px)",
            border: "1px solid rgba(192,68,15,0.22)",
          }}
        />

        {certificates.length > 0 && (
          <div className="min-w-0">
            <div className="flex items-baseline justify-between mb-2">
              <p
                className="t-mono"
                style={{
                  opacity: 0.75,
                  fontSize: "clamp(10px,2.6vw,14px)",
                  letterSpacing: "0.08em",
                  color: "var(--orange-deep)",
                }}
              >
                certificates · verified
              </p>
              <p
                className="t-mono-xs opacity-60 shrink-0"
                style={{ fontSize: "clamp(9px,2.4vw,12px)", color: "var(--orange-deep)" }}
              >
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
                      padding: "clamp(8px,2vw,12px) clamp(10px,2.4vw,14px)",
                      border: "1px solid rgba(192,68,15,0.28)",
                      borderRadius: "clamp(4px,1vw,6px)",
                      background: "rgba(192,68,15,0.04)",
                    }}
                  >
                    <div className="min-w-0">
                      <p
                        className="t-display truncate"
                        style={{
                          fontSize: "clamp(12px,3vw,17px)",
                          fontWeight: 700,
                          letterSpacing: "-0.005em",
                          lineHeight: 1.15,
                          color: "var(--orange-deep)",
                        }}
                      >
                        {c.title}
                      </p>
                      <p
                        className="t-body truncate"
                        style={{
                          color: "rgba(192,68,15,0.78)",
                          fontSize: "clamp(10px,2.4vw,13px)",
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
