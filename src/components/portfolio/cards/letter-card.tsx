"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import {
  ease,
  RADIUS,
  WHATSAPP_IMG,
  CONTENT_BASE_DELAY,
  SKY_BG,
  LETTER_INK,
  LETTER_INK_SOFT,
} from "../constants";
import { SplitText } from "../split-text";
import { socialIconStagger, socialIconItem } from "../animations";
import { SocialIcon } from "../social-icon";
import { innerPadding } from "../card";
import { contactIcons } from "./bio-card";

export function LetterCollapsed() {
  const reduce = useReducedMotion();
  return (
    <>
      {/* Desktop / lg+ — 2x2 editorial grid */}
      <div className="hidden lg:grid grid-cols-2 grid-rows-2 w-full h-full gap-2 min-w-0 origin-left transition-transform duration-500 ease-out group-hover:scale-[0.94]">
        {/* Top-left: soft serif invite, words stair-stepped left → right within the cell */}
        <div
          className="t-serif self-start justify-self-stretch flex flex-col w-full min-w-0"
          style={{
            color: LETTER_INK_SOFT,
            fontSize: "clamp(20px, 2.4vw, 38px)",
            fontWeight: 700,
            letterSpacing: "-0.01em",
            wordSpacing: "0.4em",
            lineHeight: 1.25,
          }}
        >
          <motion.div
            className="text-left whitespace-nowrap"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: CONTENT_BASE_DELAY + 0.55 }}
          >
            if
          </motion.div>
          <motion.div
            className="text-left whitespace-nowrap"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: CONTENT_BASE_DELAY + 0.7 }}
          >
            you
          </motion.div>
          <motion.div
            className="text-left whitespace-nowrap"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: CONTENT_BASE_DELAY + 0.85 }}
          >
            have a
          </motion.div>
          <motion.div
            className="text-left whitespace-nowrap"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: CONTENT_BASE_DELAY + 1.0 }}
          >
            moment
          </motion.div>
        </div>

        {/* Top-right: section label */}
        <p
          className="t-mono-xs self-start justify-self-end text-right"
          style={{ opacity: 0.7, fontSize: "clamp(10px,0.78vw,13px)", letterSpacing: "0.18em" }}
        >
          note
        </p>

        {/* Bottom-left: click hint */}
        <motion.p
          className="t-mono self-end justify-self-start"
          style={{
            letterSpacing: "0.08em",
            fontSize: "clamp(10px,0.78vw,13px)",
            opacity: 0.85,
          }}
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 0.85, y: 0 }}
          transition={{ duration: 0.6, ease, delay: CONTENT_BASE_DELAY + 1.0 }}
        >
          click to read →
        </motion.p>

        {/* Bottom-right: main headline */}
        <h3
          className="t-display min-w-0 self-end justify-self-end text-right"
          style={{
            fontSize: "clamp(18px, 2vw, 34px)",
            lineHeight: 1.05,
            letterSpacing: "-0.01em",
            overflowWrap: "break-word",
          }}
        >
          <SplitText delay={CONTENT_BASE_DELAY + 0.25}>A small letter.</SplitText>
        </h3>
      </div>

      {/* Mobile — compact square: a quiet hello */}
      <div className="flex lg:hidden flex-col items-center justify-center w-full h-full gap-1 px-2 py-2">
        <h3
          className="t-display text-center"
          style={{
            fontSize: "clamp(22px, 8vw, 38px)",
            lineHeight: 0.9,
            letterSpacing: "-0.02em",
          }}
        >
          <SplitText delay={CONTENT_BASE_DELAY + 0.2}>hello.</SplitText>
        </h3>
        <motion.p
          className="t-serif text-center"
          style={{
            color: LETTER_INK_SOFT,
            fontSize: "clamp(10px, 3vw, 13px)",
            letterSpacing: "0.02em",
          }}
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease, delay: CONTENT_BASE_DELAY + 0.7 }}
        >
          a note inside
        </motion.p>
      </div>
    </>
  );
}

export function SocialCard({
  extraStyle,
  className,
}: {
  extraStyle?: React.CSSProperties;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <div
      style={{
        borderRadius: RADIUS,
        background: "var(--cream)",
        color: "var(--orange-deep)",
        minWidth: 0,
        minHeight: 0,
        ...extraStyle,
      }}
      className={`relative overflow-hidden ${className ?? ""}`}
    >
      {/* Desktop / lg+ — horizontal label + icon row */}
      <motion.div
        className="hidden lg:flex flex-col items-center justify-center h-full w-full"
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

      {/* Mobile — scrolling ticker over a tappable icon row */}
      <motion.div
        className="flex lg:hidden flex-col h-full w-full justify-center gap-2 px-2 py-2"
        variants={socialIconStagger}
        initial={reduce ? false : "hidden"}
        animate="show"
      >
        {/* Ticker of platform names — masked edges so it fades in/out */}
        <div
          className="relative overflow-hidden"
          style={{
            maskImage:
              "linear-gradient(to right, transparent 0, #000 14%, #000 86%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0, #000 14%, #000 86%, transparent 100%)",
          }}
        >
          <div
            className="marquee-track t-display"
            style={{
              fontSize: "clamp(10px, 3.4vw, 13px)",
              letterSpacing: "-0.01em",
              opacity: 0.8,
            }}
          >
            {[0, 1].map((dup) => (
              <span key={dup} className="inline-flex items-center">
                {contactIcons.map((c) => (
                  <span key={`${dup}-${c.name}`} className="inline-flex items-center">
                    <span style={{ padding: "0 8px" }}>{c.label}</span>
                    <span style={{ opacity: 0.4 }}>·</span>
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>

        {/* Icon row — 5 tappable circles, evenly spaced */}
        <div className="flex items-center justify-between w-full" style={{ gap: 4 }}>
          {contactIcons.map((c) => (
            <motion.a
              key={c.name}
              href={c.href}
              target={c.ext ? "_blank" : undefined}
              rel={c.ext ? "noreferrer" : undefined}
              aria-label={c.label}
              title={c.label}
              variants={socialIconItem}
              className="inline-flex items-center justify-center transition-transform active:scale-90"
              style={{
                width: "clamp(22px, 7vw, 30px)",
                height: "clamp(22px, 7vw, 30px)",
                borderRadius: 999,
                border: "1px solid rgba(192,68,15,0.35)",
                color: "currentColor",
                flexShrink: 0,
              }}
            >
              <SocialIcon name={c.name} size={13} />
            </motion.a>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export function LetterExpanded() {
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
        <div className="self-start min-w-0" style={{ color: LETTER_INK }}>
          <h2
            className="t-display"
            style={{
              fontSize: "clamp(26px,3.4vw,56px)",
              lineHeight: 0.95,
              letterSpacing: "-0.01em",
              color: LETTER_INK,
            }}
          >
            <SplitText delay={0.1}>From my desk to yours.</SplitText>
          </h2>
        </div>

        <div
          className="self-start flex flex-col gap-[clamp(10px,1.2svh,16px)] min-w-0 text-left items-start"
          style={{ color: LETTER_INK, marginTop: "clamp(72px,11svh,160px)" }}
        >
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
            <p>
              <span
                className="t-display"
                style={{
                  fontSize: "clamp(22px,2.3vw,36px)",
                  fontWeight: 800,
                  letterSpacing: "-0.01em",
                  lineHeight: 1,
                  marginRight: "0.18em",
                }}
              >
                Hello
              </span>
              , and thanks for clicking around.
            </p>
            <p>
              I&apos;m Ajas — a software developer in kochi, the kind of
              afternoon where the clouds take their time. I write backends
              that try not to surprise anyone: django, fastapi, rest endpoints
              that read like english. some days I cross the fence and ship the
              ui too.
            </p>
            <p>
              I like systems that age well, codebases that don&apos;t need a
              tour, and reviews that just say looks good to me. nothing flashy — just
              quiet, careful work.
            </p>
            <p>
              I&apos;m also still learning, and I expect I always will be.
              I&apos;ll get things wrong from time to time — small things,
              sometimes less small — and when I do, I&apos;d much rather
              hear about it than not.
            </p>
            <p>
              So if you&apos;ve got feedback, a correction, an idea, or
              just something to say, please reach out.
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
