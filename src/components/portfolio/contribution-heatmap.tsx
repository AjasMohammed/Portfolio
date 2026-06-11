"use client";

import {
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Contributions } from "@/lib/github";
import { ease, CONTENT_BASE_DELAY } from "./constants";

const LEVEL_COLORS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "rgba(192,68,15,0.08)",
  1: "rgba(240,128,71,0.40)",
  2: "rgba(234,90,26,0.65)",
  3: "rgba(234,90,26,0.85)",
  4: "rgba(192,68,15,1)",
};

const WEEKDAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

function formatLongDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function ContributionHeatmap({
  contributions,
  cellSize = 11,
  gap = 2.5,
  showLabels = true,
  className,
}: {
  contributions: Contributions;
  cellSize?: number;
  gap?: number;
  showLabels?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [hovered, setHovered] = useState<{
    date: string;
    count: number;
  } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  // Tooltip position is written straight to the DOM — routing mousemove
  // through setState re-rendered the whole ~370-cell grid on every frame.
  const posRef = useRef({ x: 0, y: 0 });
  const tipRef = useRef<HTMLDivElement | null>(null);

  const applyTip = () => {
    const el = tipRef.current;
    if (!el) return;
    el.style.left = `${posRef.current.x}px`;
    el.style.top = `${posRef.current.y}px`;
  };

  const handleMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    posRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    applyTip();
  };

  const totalContributions = contributions.weeks.reduce(
    (sum, week) => sum + week.reduce((s, d) => s + (d?.count ?? 0), 0),
    0,
  );

  const monthLabels: { idx: number; label: string }[] = [];
  let lastMonth = -1;
  contributions.weeks.forEach((week, i) => {
    const first = week[0];
    if (!first) return;
    const m = new Date(first.date + "T00:00:00Z").getUTCMonth();
    if (m !== lastMonth) {
      lastMonth = m;
      monthLabels.push({
        idx: i,
        label: new Date(first.date + "T00:00:00Z").toLocaleDateString("en-US", {
          month: "short",
          timeZone: "UTC",
        }),
      });
    }
  });

  const labelGutter = showLabels ? 28 : 0;
  const monthGutter = showLabels ? 14 : 0;

  return (
    <div
      ref={wrapRef}
      className={`relative ${className ?? ""}`}
      style={{ paddingLeft: labelGutter, paddingTop: monthGutter }}
      role="img"
      aria-label={`GitHub contribution heatmap: ${totalContributions} contributions in the last year`}
    >
      {showLabels && (
        <>
          <div
            className="absolute top-0 left-0 right-0"
            style={{ height: monthGutter, paddingLeft: labelGutter }}
          >
            {monthLabels.map((m) => (
              <span
                key={`${m.idx}-${m.label}`}
                className="t-mono-xs absolute"
                style={{
                  left: m.idx * (cellSize + gap),
                  top: 0,
                  fontSize: 10,
                  opacity: 0.55,
                  letterSpacing: "0.08em",
                }}
              >
                {m.label.toLowerCase()}
              </span>
            ))}
          </div>
          <div
            className="absolute left-0"
            style={{
              top: monthGutter,
              width: labelGutter,
              display: "grid",
              gridTemplateRows: `repeat(7, ${cellSize + gap}px)`,
            }}
          >
            {WEEKDAY_LABELS.map((d, i) => (
              <span
                key={i}
                className="t-mono-xs"
                style={{
                  fontSize: 9,
                  opacity: 0.5,
                  letterSpacing: "0.05em",
                  lineHeight: `${cellSize + gap}px`,
                }}
              >
                {d.toLowerCase()}
              </span>
            ))}
          </div>
        </>
      )}

      {/* Memoized — hover only changes tooltip content, so the cell grid
          (~370 motion spans) must not re-render with it. */}
      {useMemo(
        () => (
          <div
            className="grid"
            style={{
              gridAutoFlow: "column",
              gridTemplateRows: `repeat(7, ${cellSize}px)`,
              gridAutoColumns: `${cellSize}px`,
              gap,
            }}
            onMouseMove={handleMove}
            onMouseLeave={() => setHovered(null)}
          >
            {contributions.weeks.map((week, wi) =>
              Array.from({ length: 7 }).map((_, di) => {
                const day = week[di];
                if (!day) {
                  return (
                    <span
                      key={`${wi}-${di}-empty`}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        background: "transparent",
                      }}
                    />
                  );
                }
                return (
                  <motion.span
                    key={day.date}
                    className="heat-cell"
                    initial={reduce ? false : { opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: 0.3,
                      ease,
                      delay:
                        CONTENT_BASE_DELAY +
                        0.2 +
                        Math.min(0.9, (wi / contributions.weeks.length) * 0.9),
                    }}
                    onMouseEnter={() =>
                      setHovered({ date: day.date, count: day.count })
                    }
                    style={{
                      width: cellSize,
                      height: cellSize,
                      borderRadius: 2,
                      background: LEVEL_COLORS[day.level],
                      cursor: "default",
                    }}
                  />
                );
              }),
            )}
          </div>
        ),
        // handleMove and setHovered only touch refs/stable setters.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [contributions.weeks, cellSize, gap, reduce],
      )}

      <AnimatePresence>
        {hovered && (
          <motion.div
            key="tip"
            ref={(el: HTMLDivElement | null) => {
              tipRef.current = el;
              applyTip();
            }}
            // Opacity only — animating `y` would hand `transform` to
            // framer-motion and discard the centering translate below.
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease }}
            className="t-mono pointer-events-none absolute z-10 whitespace-nowrap"
            style={{
              transform: "translate(-50%, calc(-100% - 10px))",
              fontSize: 11,
              color: "var(--cream)",
              padding: "3px 7px",
              background: "rgba(35,21,16,0.92)",
              border: "1px solid rgba(244,235,216,0.3)",
              borderRadius: 4,
            }}
          >
            {hovered.count === 0
              ? "no contributions"
              : `${hovered.count} ${hovered.count === 1 ? "contribution" : "contributions"}`}
            <span style={{ opacity: 0.65 }}> · {formatLongDate(hovered.date)}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ContributionLegend({ cellSize = 10 }: { cellSize?: number }) {
  return (
    <div
      className="inline-flex items-center gap-1.5"
      style={{ fontSize: 10, opacity: 0.7 }}
    >
      <span className="t-mono-xs" style={{ letterSpacing: "0.05em" }}>
        less
      </span>
      {([0, 1, 2, 3, 4] as const).map((l) => (
        <span
          key={l}
          style={{
            width: cellSize,
            height: cellSize,
            background: LEVEL_COLORS[l],
            borderRadius: 2,
            outline: "1px solid rgba(192,68,15,0.08)",
          }}
        />
      ))}
      <span className="t-mono-xs" style={{ letterSpacing: "0.05em" }}>
        more
      </span>
    </div>
  );
}

export function formatMostActiveDay(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
