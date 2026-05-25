"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ease, CONTENT_BASE_DELAY } from "../constants";

const TITLE_TEXT =
  "come in, the bento's freshly tiled. nothing here bites — poke any tile and the bento fills in the rest.";
const TITLE_TEXT_COMPACT = "come in. bento's freshly tiled.";

const WELCOME_STYLES = `
  @keyframes welcomeCaret {
    0%, 49% { opacity: 0.85; }
    50%, 100% { opacity: 0; }
  }
  .welcome-caret { animation: welcomeCaret 1.05s steps(1) infinite; }
  .typing-caret { opacity: 0.85; }
  .typing-caret--blink { animation: welcomeCaret 1.05s steps(1) infinite; }
  @media (prefers-reduced-motion: reduce) {
    .welcome-caret, .typing-caret, .typing-caret--blink { animation: none; opacity: 0.85; }
  }
`;

const TYPING_SPEED_MS = 28;
const TITLE_START = 0.4; // seconds after CONTENT_BASE_DELAY
const BOOT_START =
  TITLE_START + (TITLE_TEXT.length * TYPING_SPEED_MS) / 1000 + 0.25;

type BootRow = { mark: string; label: string; time: string; pending?: boolean };

const BASE_BOOT_ROWS: BootRow[] = [
  { mark: "✓", label: "palette loaded", time: ".12s" },
  { mark: "✓", label: "typography ready", time: ".04s" },
  { mark: "✓", label: "bento mounted", time: ".28s" },
  { mark: "→", label: "awaiting click", time: "…", pending: true },
];

function buildBootRows(visits: number | null | undefined): BootRow[] {
  if (typeof visits !== "number") return BASE_BOOT_ROWS;
  const visitorRow: BootRow = {
    mark: "✓",
    label: `visitor #${visits.toLocaleString()} logged`,
    time: ".03s",
  };
  // Insert just before the pending "awaiting click" row.
  const last = BASE_BOOT_ROWS[BASE_BOOT_ROWS.length - 1];
  return [...BASE_BOOT_ROWS.slice(0, -1), visitorRow, last];
}

function TypingTitle({
  text,
  startDelay,
  speed = 28,
}: {
  text: string;
  startDelay: number;
  speed?: number;
}) {
  const reduce = useReducedMotion();
  const [count, setCount] = useState(reduce ? text.length : 0);

  useEffect(() => {
    if (reduce) {
      setCount(text.length);
      return;
    }
    setCount(0);
    let interval: ReturnType<typeof setInterval> | undefined;
    const start = window.setTimeout(() => {
      interval = setInterval(() => {
        setCount((prev) => {
          if (prev >= text.length) {
            if (interval) clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    }, startDelay * 1000);

    return () => {
      window.clearTimeout(start);
      if (interval) clearInterval(interval);
    };
  }, [text, startDelay, speed, reduce]);

  const done = count >= text.length;

  return (
    <>
      {text.slice(0, count)}
      <span
        aria-hidden
        className={`typing-caret${done ? " typing-caret--blink" : ""}`}
        style={{
          display: "inline-block",
          width: "0.5ch",
          height: "0.95em",
          marginLeft: "0.1ch",
          transform: "translateY(0.12em)",
          background: "currentColor",
          opacity: 0.85,
        }}
      />
    </>
  );
}

const ACCENT = "rgba(192,68,15,0.55)";
const ACCENT_SOFT = "rgba(192,68,15,0.32)";
const ACCENT_FAINT = "rgba(192,68,15,0.18)";
const RULE = "1px solid rgba(192,68,15,0.18)";

function Dot({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      style={{
        width: "clamp(7px,0.7vw,10px)",
        height: "clamp(7px,0.7vw,10px)",
        borderRadius: 9999,
        background: color,
        display: "inline-block",
      }}
    />
  );
}

export function WelcomeCollapsed({
  compact = false,
  visits,
}: { compact?: boolean; visits?: number | null } = {}) {
  const reduce = useReducedMotion();

  if (compact) return <WelcomeCompact visits={visits} />;

  const bootRows = buildBootRows(visits);

  return (
    <div className="flex flex-col w-full h-full origin-left transition-transform duration-500 ease-out group-hover:scale-[0.97]">
      {/* ─── File tab ─── */}
      <div
        className="flex items-center gap-[clamp(6px,0.7vw,10px)] shrink-0"
        style={{
          paddingBottom: "clamp(8px,1svh,12px)",
          borderBottom: RULE,
        }}
      >
        <span className="flex items-center gap-[clamp(3px,0.4vw,6px)]">
          <Dot color={ACCENT} />
          <Dot color={ACCENT_SOFT} />
          <Dot color={ACCENT_FAINT} />
        </span>
        <p
          className="t-mono-xs"
          style={{
            fontSize: "clamp(9px,0.72vw,12px)",
            letterSpacing: "0.06em",
            opacity: 0.85,
          }}
        >
          welcome.md
        </p>
        <span className="flex-1" />
        <p
          className="t-mono-xs shrink-0 inline-flex items-center gap-1"
          style={{
            fontSize: "clamp(9px,0.7vw,12px)",
            letterSpacing: "0.16em",
            opacity: 0.55,
          }}
        >
          <span aria-hidden>⌥</span> main
        </p>
      </div>

      {/* ─── Body — JSDoc comment block ─── */}
      <div
        className="flex-1 min-h-0 flex flex-col justify-center"
        style={{ paddingTop: "clamp(8px,1svh,14px)", paddingBottom: "clamp(8px,1svh,14px)" }}
      >
        <motion.div
          className="flex flex-col"
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: CONTENT_BASE_DELAY + 0.2 }}
          style={{ gap: "clamp(6px,0.7svh,10px)" }}
        >
          <p
            className="t-mono-xs"
            style={{
              fontSize: "clamp(10px,0.85vw,14px)",
              letterSpacing: "0.04em",
              opacity: 0.5,
            }}
          >
            /**
          </p>

          <p
            className="t-display"
            style={{
              fontSize: "clamp(13px,1.4vw,22px)",
              lineHeight: 1.3,
              letterSpacing: "-0.005em",
              borderLeft: "1px solid rgba(192,68,15,0.22)",
              marginLeft: "0.35em",
              paddingLeft: "0.85em",
              minHeight: "calc(1.3em * 3)",
            }}
          >
            <TypingTitle
              text={TITLE_TEXT}
              startDelay={CONTENT_BASE_DELAY + TITLE_START}
              speed={TYPING_SPEED_MS}
            />
          </p>

          {/* Boot log — rows tick in sequentially */}
          <div
            className="t-mono"
            style={{
              fontSize: "clamp(9px,0.78vw,12px)",
              lineHeight: 1.55,
              letterSpacing: "0.04em",
              borderLeft: "1px solid rgba(192,68,15,0.22)",
              marginLeft: "0.35em",
              paddingLeft: "0.85em",
              display: "grid",
              gridTemplateColumns: "auto minmax(0,1fr) auto",
              columnGap: "clamp(6px,0.7vw,12px)",
              rowGap: "clamp(2px,0.3svh,5px)",
              alignItems: "baseline",
            }}
          >
            {bootRows.map((r, i) => {
              const rowDelay = CONTENT_BASE_DELAY + BOOT_START + i * 0.35;
              return (
                <motion.div
                  key={r.label}
                  className="contents"
                  initial={reduce ? false : { opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.32, ease, delay: rowDelay }}
                >
                  <span
                    style={{
                      color: "var(--orange)",
                      opacity: r.pending ? 0.95 : 0.7,
                    }}
                  >
                    [{r.mark}]
                  </span>
                  <span
                    className="min-w-0 truncate"
                    style={{ opacity: r.pending ? 0.9 : 0.78 }}
                  >
                    {r.label}
                    {r.pending ? " …" : ""}
                  </span>
                  <span
                    className="shrink-0"
                    style={{ opacity: 0.45, fontVariantNumeric: "tabular-nums" }}
                  >
                    {r.time}
                  </span>
                </motion.div>
              );
            })}
          </div>

          <p
            className="t-mono-xs"
            style={{
              fontSize: "clamp(10px,0.85vw,14px)",
              letterSpacing: "0.04em",
              opacity: 0.5,
            }}
          >
            */
          </p>
        </motion.div>
      </div>

      {/* ─── Status bar ─── */}
      <motion.div
        className="flex items-center justify-between gap-2 shrink-0"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease, delay: CONTENT_BASE_DELAY + 0.6 }}
        style={{
          paddingTop: "clamp(8px,1svh,12px)",
          borderTop: RULE,
        }}
      >
        <p
          className="t-mono-xs min-w-0 truncate inline-flex items-baseline gap-1"
          style={{
            fontSize: "clamp(9px,0.7vw,12px)",
            letterSpacing: "0.04em",
            opacity: 0.75,
          }}
        >
          <span style={{ opacity: 0.65 }}>$</span>
          <span>make yourself at home</span>
          <span
            aria-hidden
            className="welcome-caret"
            style={{
              display: "inline-block",
              width: "0.55ch",
              height: "1em",
              marginLeft: "0.15ch",
              transform: "translateY(0.12em)",
              background: "currentColor",
              opacity: 0.85,
            }}
          />
        </p>
        <p
          className="t-mono-xs shrink-0"
          style={{
            fontSize: "clamp(9px,0.7vw,12px)",
            letterSpacing: "0.16em",
            opacity: 0.5,
          }}
        >
          UTF-8 · ✓
        </p>
      </motion.div>

      <style>{WELCOME_STYLES}</style>
    </div>
  );
}

function WelcomeCompact({ visits }: { visits?: number | null }) {
  return (
    <div className="flex flex-col h-full w-full justify-between gap-[clamp(4px,1vw,8px)]">
      {/* Top — small file label + traffic dots */}
      <div className="flex items-center justify-between gap-1.5 shrink-0">
        <p
          className="t-mono-xs"
          style={{
            fontSize: "clamp(9px,2.4vw,11px)",
            letterSpacing: "0.14em",
            opacity: 0.7,
          }}
        >
          // welcome.md
        </p>
        <span className="flex items-center gap-0.75">
          <Dot color={ACCENT} />
          <Dot color={ACCENT_SOFT} />
          <Dot color={ACCENT_FAINT} />
        </span>
      </div>

      {/* Middle — typed title */}
      <p
        className="t-display flex-1 min-h-0 flex items-center"
        style={{
          fontSize: "clamp(13px,3.6vw,17px)",
          lineHeight: 1.3,
          letterSpacing: "-0.005em",
        }}
      >
        <span style={{ display: "inline-block" }}>
          <TypingTitle
            text={TITLE_TEXT_COMPACT}
            startDelay={CONTENT_BASE_DELAY + TITLE_START}
            speed={45}
          />
        </span>
      </p>

      {/* Info block — boot-style status line + see-also tags */}
      <div
        className="t-mono shrink-0 flex flex-col"
        style={{
          fontSize: "clamp(8px,2.2vw,11px)",
          letterSpacing: "0.04em",
          lineHeight: 1.5,
          gap: "clamp(2px,0.5vw,4px)",
          borderLeft: "1px solid rgba(192,68,15,0.22)",
          paddingLeft: "clamp(6px,1.6vw,10px)",
          marginLeft: "0.2em",
        }}
      >
        <p className="truncate">
          <span style={{ color: "var(--orange)", opacity: 0.9 }}>[✓]</span>{" "}
          <span style={{ opacity: 0.8 }}>bento mounted · ready</span>
        </p>
        {typeof visits === "number" && (
          <p className="truncate">
            <span style={{ color: "var(--orange)", opacity: 0.9 }}>[✓]</span>{" "}
            <span style={{ opacity: 0.8 }}>
              visitor #{visits.toLocaleString()}
            </span>
          </p>
        )}
        <p className="truncate">
          <span style={{ color: "var(--orange)", opacity: 0.9 }}>@see</span>{" "}
          <span style={{ opacity: 0.75 }}>./projects · ./note · ./contact</span>
        </p>
      </div>

      {/* Bottom — tap hint */}
      <p
        className="t-mono-xs shrink-0"
        style={{
          fontSize: "clamp(8px,2.2vw,10px)",
          letterSpacing: "0.16em",
          opacity: 0.55,
        }}
      >
        ↳ tap a tile
      </p>

      <style>{WELCOME_STYLES}</style>
    </div>
  );
}
