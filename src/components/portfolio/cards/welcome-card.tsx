"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CURRENT_ROLE, profile } from "@/data/profile";
import { ease, CONTENT_BASE_DELAY } from "../constants";
import { LiveClock } from "../stat";

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

/* ── Presence — the card's live half ──────────────────────────────────────
   A portfolio that ticks reads as someone's desk, not a printed page. All
   three signals below are real: the clock runs in my timezone, the status
   comes from whichever role in `experiences` is still open, and the mount
   time is measured rather than typed in. */

const CITY = profile.location.split(",")[0].toLowerCase();
const STATUS = `building at ${CURRENT_ROLE.company.toLowerCase()}`;
/* Measured once per page load, on whichever welcome variant mounts first —
   from when the HTML finished arriving, not navigation start: the row claims
   how long the bento took to come up, and server render plus network latency
   aren't that. Module-level so a variant switch minutes later (resize across
   the lg boundary) reports the boot-time figure, not elapsed wall time.
   The wall clock is a separate <LiveClock/> leaf so nothing here ticks. */
let measuredMountMs: number | null = null;

function useMountMs() {
  const [ms, setMs] = useState<number | null>(null);
  useEffect(() => {
    if (measuredMountMs === null) {
      const nav = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming | undefined;
      // `responseEnd` is always set before any client JS runs.
      measuredMountMs = Math.max(0, performance.now() - (nav?.responseEnd ?? 0));
    }
    // Deliver on the next paint rather than synchronously inside the effect
    // (same pattern as LiveClock's first reading).
    const raf = requestAnimationFrame(() => setMs(measuredMountMs));
    return () => cancelAnimationFrame(raf);
  }, []);
  return ms;
}

type BootRow = { mark: string; label: string; time: string; pending?: boolean };

function buildBootRows(
  visits: number | null | undefined,
  mountMs: number | null,
): BootRow[] {
  const rows: BootRow[] = [
    { mark: "✓", label: "palette loaded", time: ".12s" },
    { mark: "✓", label: "typography ready", time: ".04s" },
    {
      mark: "✓",
      label: "bento mounted",
      // Matches the hand-written rows' format (".28s"), just measured.
      time: mountMs == null ? "…" : `${(mountMs / 1000).toFixed(2)}s`.replace(/^0/, ""),
    },
  ];
  if (typeof visits === "number") {
    rows.push({
      mark: "✓",
      label: `visitor #${visits.toLocaleString()} logged`,
      time: ".03s",
    });
  }
  rows.push({ mark: "→", label: "awaiting click", time: "…", pending: true });
  return rows;
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
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (reduce) return;
    let interval: ReturnType<typeof setInterval> | undefined;
    const start = window.setTimeout(() => {
      setCount(0);
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

  // Reduced motion renders the full line immediately — derived, not set in
  // the effect, so typing state never flows through an extra render pass.
  const shown = reduce ? text.length : count;
  const done = shown >= text.length;

  return (
    <>
      {text.slice(0, shown)}
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
  // A dispatcher, not a branch inside one component — the two variants each own
  // typing timers, and only the mounted one should be running them.
  return compact ? (
    <WelcomeCompact visits={visits} />
  ) : (
    <WelcomeFull visits={visits} />
  );
}

function WelcomeFull({ visits }: { visits?: number | null }) {
  const reduce = useReducedMotion();
  const mountMs = useMountMs();
  const bootRows = buildBootRows(visits, mountMs);

  // No group-hover on the root: the welcome tile isn't clickable, and its
  // shell wrapper has no `group` ancestor — a hover scale would be a dead class.
  return (
    <div className="flex flex-col w-full h-full">
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
          className="t-mono-xs shrink-0 inline-flex items-baseline gap-[0.5ch]"
          style={{
            fontSize: "clamp(9px,0.7vw,12px)",
            letterSpacing: "0.16em",
            opacity: 0.6,
          }}
        >
          <span>{CITY}</span>
          <span aria-hidden style={{ opacity: 0.5 }}>
            ·
          </span>
          <span style={{ fontVariantNumeric: "tabular-nums" }}><LiveClock /></span>
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
            {"/**"}
          </p>

          <p
            className="t-body"
            style={{
              fontSize: "clamp(14px,1.5vw,22px)",
              fontWeight: 500,
              lineHeight: 1.45,
              letterSpacing: 0,
              borderLeft: "1px solid rgba(192,68,15,0.22)",
              marginLeft: "0.35em",
              paddingLeft: "0.85em",
              minHeight: "calc(1.45em * 3)",
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
          <span className="truncate">{STATUS}</span>
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
          className="t-mono-xs shrink-0 inline-flex items-center gap-[0.6ch]"
          style={{
            fontSize: "clamp(9px,0.7vw,12px)",
            letterSpacing: "0.16em",
            opacity: 0.7,
          }}
        >
          <span
            className="live-dot"
            style={{
              color: "var(--orange)",
              width: "clamp(5px,0.45vw,7px)",
              height: "clamp(5px,0.45vw,7px)",
            }}
          />
          available
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
          {"// welcome.md"}
        </p>
        <span className="flex items-center gap-0.75">
          <Dot color={ACCENT} />
          <Dot color={ACCENT_SOFT} />
          <Dot color={ACCENT_FAINT} />
        </span>
      </div>

      {/* Middle — typed title */}
      <p
        className="t-body flex-1 min-h-0 flex items-center"
        style={{
          fontSize: "clamp(14px,3.8vw,18px)",
          fontWeight: 500,
          lineHeight: 1.4,
          letterSpacing: 0,
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
          <span style={{ color: "var(--orange)", opacity: 0.9 }}>[●]</span>{" "}
          <span style={{ opacity: 0.8 }}>{STATUS}</span>
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

      {/* Bottom — tap hint, with the live clock riding the same row so presence
          costs no extra height on a card this short. */}
      <div
        className="t-mono-xs shrink-0 flex items-baseline justify-between gap-2"
        style={{
          fontSize: "clamp(8px,2.2vw,10px)",
          letterSpacing: "0.16em",
          opacity: 0.55,
        }}
      >
        <span className="truncate">↳ tap a tile</span>
        <span
          className="shrink-0"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {CITY} <LiveClock />
        </span>
      </div>

      <style>{WELCOME_STYLES}</style>
    </div>
  );
}
