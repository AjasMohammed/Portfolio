"use client";

import { useEffect, useState, type FormEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Testimonial } from "@/lib/testimonials";
import { ease, CONTENT_BASE_DELAY } from "../constants";
import { SplitText } from "../split-text";
import { fadeUp, stagger } from "../animations";

const ROTATE_MS = 7000;

/* ────────── COLLAPSED ────────── */

export function TestimonialsCollapsed({ items }: { items: Testimonial[] }) {
  const reduce = useReducedMotion();
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const hasItems = items.length > 0;

  // Reduced-motion users get a static quote (WCAG 2.2.2); everyone else can
  // pause the rotation by hovering or focusing the tile.
  useEffect(() => {
    if (!hasItems || items.length === 1 || reduce || paused) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), ROTATE_MS);
    return () => clearInterval(t);
  }, [hasItems, items.length, reduce, paused]);

  const current = hasItems ? items[idx % items.length] : null;

  return (
    <div
      className="flex flex-col w-full h-full gap-2 origin-left transition-transform duration-500 ease-out group-hover:scale-[0.96]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="flex items-baseline justify-between gap-2 min-w-0 shrink-0">
        <p
          className="t-mono-xs"
          style={{ opacity: 0.7, fontSize: "clamp(10px,0.78vw,13px)", letterSpacing: "0.18em" }}
        >
          kind words
        </p>
        <p
          className="t-mono-xs shrink-0"
          style={{ opacity: 0.55, fontSize: "clamp(10px,0.78vw,13px)", letterSpacing: "0.18em" }}
        >
          {hasItems ? `${(idx % items.length) + 1} / ${items.length}` : "—"}
        </p>
      </div>

      <div className="flex-1 min-h-0 flex flex-col justify-center">
        {current ? (
          <motion.figure
            key={current.name + idx}
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease }}
            className="flex flex-col gap-[clamp(8px,1svh,14px)] min-w-0"
          >
            <p
              className="t-serif"
              style={{
                fontSize: "clamp(15px,1.5vw,24px)",
                lineHeight: 1.25,
                color: "var(--orange-deep)",
                fontStyle: "italic",
                letterSpacing: "-0.005em",
                display: "-webkit-box",
                WebkitLineClamp: 4,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              “{current.message}”
            </p>
            <figcaption
              className="t-mono"
              style={{ fontSize: "clamp(10px,0.78vw,12px)", letterSpacing: "0.12em", opacity: 0.8 }}
            >
              — {current.name}
              {current.role ? (
                <span style={{ opacity: 0.6 }}> · {current.role}</span>
              ) : null}
            </figcaption>
          </motion.figure>
        ) : (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: CONTENT_BASE_DELAY + 0.1 }}
            className="flex flex-col gap-2 min-w-0"
          >
            <p
              className="t-display"
              style={{
                fontSize: "clamp(20px,2vw,32px)",
                lineHeight: 1,
                color: "var(--orange-deep)",
                letterSpacing: "-0.01em",
              }}
            >
              <SplitText delay={CONTENT_BASE_DELAY + 0.2}>kind words.</SplitText>
            </p>
            <p
              className="t-body"
              style={{
                fontSize: "clamp(11px,0.9vw,14px)",
                lineHeight: 1.45,
                color: "var(--orange-deep)",
                opacity: 0.75,
              }}
            >
              No notes yet — be the first to leave one.
            </p>
          </motion.div>
        )}
      </div>

      <motion.p
        className="t-mono shrink-0"
        style={{
          letterSpacing: "0.08em",
          fontSize: "clamp(10px,0.78vw,13px)",
          opacity: 0.85,
        }}
        initial={reduce ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 0.85, y: 0 }}
        transition={{ duration: 0.6, ease, delay: CONTENT_BASE_DELAY + 0.5 }}
      >
        click to read all →
      </motion.p>
    </div>
  );
}

/* ────────── EXPANDED ────────── */

type SubmitState =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "done" }
  | { kind: "error"; msg: string };

export function TestimonialsExpanded({ items }: { items: Testimonial[] }) {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="flex flex-col h-full overflow-y-auto scrollbar-styled-ink lg:grid lg:overflow-hidden lg:grid-cols-[1.2fr_1fr]"
      style={{ gap: "clamp(16px,1.6svh,28px)" }}
    >
      {/* Left: list of approved notes */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col gap-[clamp(10px,1.2svh,16px)] min-w-0 scrollbar-styled-ink lg:min-h-0 lg:overflow-y-auto lg:overflow-x-hidden lg:pr-3"
      >
        <p
          className="t-mono-xs"
          style={{
            opacity: 0.65,
            fontSize: "clamp(10px,2.6vw,14px)",
            letterSpacing: "0.22em",
          }}
        >
          kind words · approved notes
        </p>
        <h2
          className="t-display"
          style={{
            fontSize: "clamp(28px,4.6vw,64px)",
            lineHeight: 0.95,
            letterSpacing: "-0.015em",
            color: "var(--orange-deep)",
          }}
        >
          <SplitText delay={0.1}>What they said.</SplitText>
        </h2>

        {items.length === 0 ? (
          <p
            className="t-body"
            style={{
              fontSize: "clamp(13px,1vw,17px)",
              lineHeight: 1.55,
              color: "var(--orange-deep)",
              opacity: 0.7,
              maxWidth: "52ch",
            }}
          >
            No notes yet. If we&apos;ve worked together — mentor, teammate, friend —
            you&apos;re very welcome to leave the first one.
          </p>
        ) : (
          <ul
            className="flex flex-col gap-[clamp(12px,1.4svh,20px)]"
            style={{ paddingBottom: "clamp(8px,1svh,16px)" }}
          >
            {items.map((t, i) => (
              <motion.li
                key={`${t.name}-${i}`}
                variants={fadeUp}
                className="flex flex-col gap-2 pb-[clamp(10px,1.2svh,16px)]"
                style={{
                  borderBottom:
                    i === items.length - 1
                      ? "none"
                      : "1px solid rgba(192,68,15,0.18)",
                }}
              >
                <p
                  className="t-serif"
                  style={{
                    fontSize: "clamp(15px,1.4vw,22px)",
                    lineHeight: 1.35,
                    color: "var(--orange-deep)",
                    fontStyle: "italic",
                    letterSpacing: "-0.005em",
                  }}
                >
                  “{t.message}”
                </p>
                <p
                  className="t-mono"
                  style={{
                    fontSize: "clamp(10px,0.78vw,13px)",
                    letterSpacing: "0.14em",
                    opacity: 0.78,
                  }}
                >
                  — {t.name}
                  {t.role ? (
                    <span style={{ opacity: 0.55 }}> · {t.role}</span>
                  ) : null}
                </p>
              </motion.li>
            ))}
          </ul>
        )}
      </motion.div>

      {/* Right: leave-a-note form */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col gap-3 min-w-0 lg:min-h-0 lg:overflow-y-auto scrollbar-styled-ink lg:pl-1"
      >
        <div
          className="flex flex-col gap-3 p-[clamp(14px,1.6vw,22px)] rounded-[clamp(8px,0.9vw,14px)]"
          style={{
            background: "rgba(192,68,15,0.07)",
            border: "1px solid rgba(192,68,15,0.22)",
          }}
        >
          <div>
            <p
              className="t-mono-xs"
              style={{
                opacity: 0.65,
                fontSize: "clamp(10px,0.72vw,12px)",
                letterSpacing: "0.22em",
              }}
            >
              leave a note
            </p>
            <h3
              className="t-display mt-1"
              style={{
                fontSize: "clamp(20px,2vw,32px)",
                lineHeight: 1,
                color: "var(--orange-deep)",
                letterSpacing: "-0.01em",
              }}
            >
              for the wall.
            </h3>
            <p
              className="t-body mt-2"
              style={{
                fontSize: "clamp(11px,0.82vw,13px)",
                lineHeight: 1.5,
                color: "var(--orange-deep)",
                opacity: 0.72,
              }}
            >
              Notes are reviewed before they appear. Thanks for taking the time.
            </p>
          </div>
          <TestimonialForm />
        </div>
      </motion.div>
    </motion.div>
  );
}

function TestimonialForm() {
  const [state, setState] = useState<SubmitState>({ kind: "idle" });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // React nulls `currentTarget` once the synchronous dispatch ends — grab the
    // form now so it's still usable after the awaits below.
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      name: String(fd.get("name") ?? ""),
      role: String(fd.get("role") ?? ""),
      message: String(fd.get("message") ?? ""),
      email: String(fd.get("email") ?? ""),
      _gotcha: String(fd.get("_gotcha") ?? ""),
    };
    if (!payload.name.trim() || !payload.role.trim() || !payload.message.trim()) {
      setState({ kind: "error", msg: "name, role, and message are required" });
      return;
    }
    setState({ kind: "sending" });
    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setState({
          kind: "error",
          msg: j.error ?? "submission failed, try again later",
        });
        return;
      }
      setState({ kind: "done" });
      form.reset();
    } catch {
      setState({ kind: "error", msg: "network error" });
    }
  }

  if (state.kind === "done") {
    return (
      <div
        className="t-body flex flex-col gap-2"
        style={{
          fontSize: "clamp(12px,0.9vw,15px)",
          color: "var(--orange-deep)",
          opacity: 0.9,
        }}
      >
        <p className="t-display" style={{ fontSize: "clamp(18px,1.6vw,26px)", lineHeight: 1 }}>
          received — thank you.
        </p>
        <p style={{ opacity: 0.75 }}>
          I&apos;ll read it shortly. If it&apos;s good to publish, it&apos;ll
          appear here once approved.
        </p>
        <button
          type="button"
          onClick={() => setState({ kind: "idle" })}
          className="t-mono self-start mt-1 link-line"
          style={{ fontSize: "clamp(10px,0.78vw,12px)", letterSpacing: "0.14em" }}
        >
          leave another →
        </button>
      </div>
    );
  }

  const labelStyle: React.CSSProperties = {
    fontSize: "clamp(9px,0.7vw,11px)",
    letterSpacing: "0.18em",
    opacity: 0.7,
  };
  const fieldStyle: React.CSSProperties = {
    background: "transparent",
    border: "none",
    borderBottom: "1px solid rgba(192,68,15,0.32)",
    outline: "none",
    color: "var(--orange-deep)",
    fontSize: "clamp(13px,1vw,16px)",
    padding: "8px 2px",
    width: "100%",
    fontFamily: "inherit",
  };

  return (
    <form className="flex flex-col gap-3" onSubmit={onSubmit} noValidate>
      <label className="flex flex-col gap-1">
        <span className="t-mono-xs" style={labelStyle}>name *</span>
        <input
          name="name"
          type="text"
          required
          maxLength={80}
          autoComplete="name"
          style={fieldStyle}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="t-mono-xs" style={labelStyle}>you are my… *</span>
        <input
          name="role"
          type="text"
          required
          maxLength={80}
          placeholder="mentor, teammate, friend, …"
          style={fieldStyle}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="t-mono-xs" style={labelStyle}>note *</span>
        <textarea
          name="message"
          required
          rows={4}
          maxLength={1200}
          style={{
            ...fieldStyle,
            resize: "vertical",
            minHeight: "5em",
            lineHeight: 1.4,
          }}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="t-mono-xs" style={labelStyle}>email (optional)</span>
        <input
          name="email"
          type="email"
          maxLength={120}
          autoComplete="email"
          style={fieldStyle}
        />
      </label>

      {/* Honeypot — hidden from humans, picked up by naive bots */}
      <input
        type="text"
        name="_gotcha"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        style={{
          position: "absolute",
          left: "-9999px",
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: "none",
        }}
      />

      {state.kind === "error" ? (
        <p
          className="t-mono-xs"
          style={{
            color: "var(--orange-deep)",
            opacity: 0.95,
            letterSpacing: "0.12em",
            fontSize: "clamp(10px,0.72vw,12px)",
          }}
          role="alert"
        >
          {state.msg}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={state.kind === "sending"}
        className="t-mono self-start mt-1 transition-transform hover:scale-[1.02] active:scale-100 disabled:opacity-50"
        style={{
          fontSize: "clamp(10px,0.82vw,13px)",
          letterSpacing: "0.18em",
          padding: "10px 18px",
          background: "var(--orange-deep)",
          color: "var(--cream)",
          borderRadius: 999,
          cursor: state.kind === "sending" ? "wait" : "pointer",
        }}
      >
        {state.kind === "sending" ? "sending…" : "send note →"}
      </button>
    </form>
  );
}
