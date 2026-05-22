"use client";

import {
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { GithubData } from "@/lib/github";
import {
  ease,
  RADIUS,
  CONTENT_BASE_DELAY,
  langDots,
  langFallbackPalette,
} from "../constants";

type Segment = {
  i: number;
  name: string;
  count: number;
  pct: number;
  dash: number;
  offset: number;
  startDeg: number;
  endDeg: number;
  color: string;
};

function buildRingSegments(
  langs: { name: string; count: number; pct: number }[],
  circumference: number,
  gapPx: number,
): Segment[] {
  let acc = 0;
  return langs.map((l, i) => {
    const len = (l.pct / 100) * circumference;
    const dash = Math.max(0, len - gapPx);
    const offset = -acc;
    const startDeg = (acc / circumference) * 360;
    acc += len;
    const endDeg = (acc / circumference) * 360;
    return {
      i,
      name: l.name,
      count: l.count,
      pct: l.pct,
      dash,
      offset,
      startDeg,
      endDeg,
      color:
        langDots[l.name] ??
        langFallbackPalette[i % langFallbackPalette.length],
    };
  });
}

export function RingChartCard({
  github,
  className,
}: {
  github: GithubData;
  className?: string;
}) {
  const reduce = useReducedMotion();

  // ── data ──────────────────────────────────────────────
  const total =
    github.topLanguages.reduce((n, l) => n + l.count, 0) || 1;
  const langs = github.topLanguages.map((l) => ({
    name: l.name,
    count: l.count,
    pct: (l.count / total) * 100,
  }));

  // ── geometry (viewBox units) ─────────────────────────
  const VB = 160;
  const stroke = 18;
  const radius = (VB - stroke) / 2;
  const cx = VB / 2;
  const cy = VB / 2;
  const circumference = 2 * Math.PI * radius;
  const gapPx = 1.5;

  const segments: Segment[] = useMemo(
    () => buildRingSegments(langs, circumference, gapPx),
    [langs, circumference, gapPx],
  );

  // ── interaction state ────────────────────────────────
  // locked = click/tap selection that persists. hover = transient pointer track.
  // Hover never overrides a lock; pointer leave clears hover only.
  const [locked, setLocked] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const activeIdx = locked ?? hover;
  const focus =
    activeIdx !== null && activeIdx < segments.length
      ? segments[activeIdx]
      : segments[0];
  const centerPct = focus ? `${Math.round(focus.pct)}%` : "—";
  const centerName = focus ? focus.name.toLowerCase() : "languages";
  const centerColor = focus?.color ?? "var(--cream)";

  // pulse the center text whenever the displayed selection changes —
  // keying the motion.g on activeIdx forces a remount + replay on change.
  const pulseKey = activeIdx ?? "none";

  // ── polar hit detection ──────────────────────────────
  const pickIndex = (e: ReactPointerEvent<HTMLDivElement>): number | null => {
    const el = wrapRef.current;
    if (!el || segments.length === 0) return null;
    const r = el.getBoundingClientRect();
    const px = e.clientX - r.left - r.width / 2;
    const py = e.clientY - r.top - r.height / 2;
    const dist = Math.hypot(px, py);
    const outerPx = Math.min(r.width, r.height) / 2;
    const ringInnerPx =
      (outerPx * (radius - stroke / 2)) / (radius + stroke / 2);
    if (dist > outerPx * 1.06) return null;
    if (dist < ringInnerPx * 0.55) return -1; // dead-zone — keep current

    let deg = (Math.atan2(py, px) * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;

    for (const s of segments) {
      if (deg >= s.startDeg && deg < s.endDeg) return s.i;
    }
    return null;
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (locked !== null) return; // locked: don't let hover steal focus
    const idx = pickIndex(e);
    if (idx === -1) return; // dead-zone
    setHover(idx);
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const idx = pickIndex(e);
    if (idx === null) {
      // tapped outside the donut → clear lock
      setLocked(null);
      setHover(null);
      return;
    }
    if (idx === -1) return; // dead-zone tap — ignore
    setLocked((prev) => (prev === idx ? null : idx));
    setHover(null);
  };

  const handlePointerLeave = () => {
    setHover(null);
  };

  return (
    <div
      style={{
        borderRadius: RADIUS,
        background: "var(--orange-deep)",
        color: "var(--cream)",
        minWidth: 0,
        minHeight: 0,
      }}
      className={`relative overflow-hidden ${className ?? ""}`}
    >
      <div
        className="flex h-full w-full flex-col"
        style={{
          padding: "clamp(12px,1.8svh,18px) clamp(12px,1.6vw,18px)",
          gap: "clamp(6px,1svh,10px)",
        }}
      >
        {/* header */}
        <div className="flex items-baseline justify-between">
          <p
            className="t-mono-xs"
            style={{
              opacity: 0.7,
              fontSize: "clamp(9px,0.74vw,12px)",
              letterSpacing: "0.18em",
            }}
          >
            languages
          </p>
          <p
            className="t-mono-xs"
            style={{
              opacity: 0.5,
              fontSize: "clamp(9px,0.74vw,12px)",
              letterSpacing: "0.16em",
            }}
          >
            {segments.length} tracked
          </p>
        </div>

        {/* chart */}
        <div className="relative flex-1 flex items-center justify-center min-h-0">
          <div
            ref={wrapRef}
            className="relative"
            style={{
              aspectRatio: "1 / 1",
              height: "100%",
              maxWidth: "100%",
              maxHeight: "100%",
              touchAction: "none",
              cursor: "pointer",
            }}
            onPointerMove={handlePointerMove}
            onPointerDown={handlePointerDown}
            onPointerLeave={handlePointerLeave}
          >
            <svg
              width="100%"
              height="100%"
              viewBox={`0 0 ${VB} ${VB}`}
              preserveAspectRatio="xMidYMid meet"
              style={{ display: "block", pointerEvents: "none" }}
            >
              {/* segments — rotated so 0° begins at the top */}
              <g transform={`rotate(-90 ${cx} ${cy})`}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill="none"
                  stroke="rgba(244,235,216,0.12)"
                  strokeWidth={stroke}
                />
                {segments.map((s) => {
                  const isActive = activeIdx === s.i;
                  const isDimmed = activeIdx !== null && !isActive;
                  return (
                    <motion.circle
                      key={s.name}
                      cx={cx}
                      cy={cy}
                      r={radius}
                      fill="none"
                      stroke={s.color}
                      strokeLinecap="butt"
                      initial={
                        reduce
                          ? false
                          : {
                              strokeDasharray: `0 ${circumference}`,
                              strokeWidth: stroke,
                              opacity: 1,
                            }
                      }
                      animate={{
                        strokeDasharray: `${s.dash} ${circumference - s.dash}`,
                        strokeWidth: isActive ? stroke + 4 : stroke,
                        opacity: isDimmed ? 0.3 : 1,
                      }}
                      transition={{
                        strokeDasharray: {
                          duration: 0.85,
                          delay: CONTENT_BASE_DELAY + 0.3 + s.i * 0.08,
                          ease,
                        },
                        strokeWidth: { duration: 0.28, ease },
                        opacity: { duration: 0.28, ease },
                      }}
                      style={{ strokeDashoffset: s.offset }}
                    />
                  );
                })}
              </g>

              {/* center label — pulses on active change */}
              <motion.g
                key={pulseKey}
                initial={reduce ? false : { opacity: 0.35, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.28, ease }}
                style={{ transformOrigin: `${cx}px ${cy}px` }}
              >
                <motion.text
                  x={cx}
                  y={cy - VB * 0.015}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="t-display"
                  animate={{ fill: centerColor }}
                  transition={{ duration: 0.32, ease }}
                  style={{
                    fontSize: VB * 0.24,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {centerPct}
                </motion.text>
                <text
                  x={cx}
                  y={cy + VB * 0.16}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="t-mono-xs"
                  fill="var(--cream)"
                  opacity={0.7}
                  style={{
                    fontSize: VB * 0.075,
                    letterSpacing: "0.14em",
                  }}
                >
                  {centerName}
                </text>
              </motion.g>
            </svg>
          </div>
        </div>

        {/* legend strip — interactive dots */}
        <div
          className="flex items-center justify-center"
          style={{ gap: "clamp(6px,0.9vw,10px)" }}
        >
          {segments.slice(0, 6).map((s) => {
            const isActive = activeIdx === s.i;
            return (
              <motion.button
                key={s.name}
                type="button"
                aria-label={`${s.name} ${Math.round(s.pct)}%`}
                onPointerEnter={() => {
                  if (locked === null) setHover(s.i);
                }}
                onPointerLeave={() => {
                  if (locked === null) setHover(null);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setLocked((prev) => (prev === s.i ? null : s.i));
                  setHover(null);
                }}
                animate={{
                  scale: isActive ? 1.35 : 1,
                  opacity: activeIdx !== null && !isActive ? 0.45 : 1,
                }}
                transition={{ duration: 0.22, ease }}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: s.color,
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  boxShadow: isActive
                    ? `0 0 0 3px rgba(244,235,216,0.18)`
                    : "none",
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
