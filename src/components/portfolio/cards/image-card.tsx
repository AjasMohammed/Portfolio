"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { certificates } from "@/data/profile";
import { ease, CONTENT_BASE_DELAY } from "../constants";
import { SplitText } from "../split-text";

/* ───────────────────────── IMAGE ───────────────────────── */

export function ImageInner() {
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
          className="object-cover object-top scale-[1.08] transition-transform duration-500 ease-out group-hover:scale-100"
        />
      </motion.div>
      {/* Top fade so the chrome overlay text stays legible */}
      <div
        className="absolute inset-x-0 top-0 h-[22%] pointer-events-none"
        style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.32), transparent)" }}
      />
      <div className="absolute left-3 right-3 bottom-3 hidden lg:flex items-end justify-between gap-2 text-cream">
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
