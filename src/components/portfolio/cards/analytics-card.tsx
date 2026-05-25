"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import { experiences, profile, projects } from "@/data/profile";
import type { GithubData } from "@/lib/github";
import { ease, CONTENT_BASE_DELAY, langDots, langFallbackPalette } from "../constants";
import { SplitText } from "../split-text";
import { fadeUp, stagger } from "../animations";
import { SocialIcon } from "../social-icon";
import { Counter } from "../stat";
import {
  ContributionHeatmap,
  ContributionLegend,
  formatMostActiveDay,
} from "../contribution-heatmap";
import { skillGroups } from "./skills-card";
import { formatRelative } from "./projects-card";

/* ───────────────────────── ANALYTICS ───────────────────────── */

export function buildAnalytics(github: GithubData) {
  const repos = github.ownedRepos;
  // Year buckets from pushed_at, with per-language breakdown
  const yearMap = new Map<number, { count: number; langs: Map<string, number> }>();
  for (const r of repos) {
    const y = new Date(r.pushed_at).getFullYear();
    let entry = yearMap.get(y);
    if (!entry) {
      entry = { count: 0, langs: new Map() };
      yearMap.set(y, entry);
    }
    entry.count += 1;
    const lang = r.language ?? "other";
    entry.langs.set(lang, (entry.langs.get(lang) ?? 0) + 1);
  }
  const years = [...yearMap.entries()]
    .map(([y, e]) => ({
      year: y,
      count: e.count,
      byLang: [...e.langs.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
    }))
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

const MONTHS = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];

function parseMonthYear(str: string): number | null {
  const m = str.trim().match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (!m) return null;
  const mi = MONTHS.indexOf(m[1].slice(0, 3).toLowerCase());
  if (mi < 0) return null;
  return new Date(parseInt(m[2], 10), mi, 1).getTime();
}

export function computeExperienceYears() {
  const starts = experiences
    .map((e) => parseMonthYear(e.period.split(/\s*[-–]\s*/)[0]))
    .filter((t): t is number => t !== null);
  if (starts.length === 0) return 1;
  const earliest = Math.min(...starts);
  const years = (Date.now() - earliest) / (365.25 * 24 * 60 * 60 * 1000);
  return Math.max(1, Math.floor(years));
}

/* Mini language bar — stacked horizontal */
export function LanguageBar({
  data,
  height = 8,
}: {
  data: { name: string; pct: number }[];
  height?: number;
}) {
  return (
    <div
      className="flex w-full overflow-hidden"
      style={{ height, borderRadius: 999, background: "rgba(192,68,15,0.18)" }}
    >
      {data.map((d, i) => (
        <motion.span
          key={d.name}
          initial={{ width: 0 }}
          animate={{ width: `${d.pct}%` }}
          transition={{ duration: 0.9, delay: 0.1 + i * 0.08, ease }}
          style={{
            background: langDots[d.name] ?? (i % 2 === 0 ? "var(--orange-deep)" : "var(--orange-soft)"),
            opacity: 1 - i * 0.08,
          }}
          title={`${d.name} ${d.pct}%`}
        />
      ))}
    </div>
  );
}

type DonutSegment = {
  d: { name: string; pct: number };
  i: number;
  dash: number;
  offset: number;
  color: string;
};

function buildDonutSegments(
  data: { name: string; pct: number }[],
  circumference: number,
  gap: number,
): DonutSegment[] {
  let cumulative = 0;
  return data.map((d, i) => {
    const len = (d.pct / 100) * circumference;
    const dash = Math.max(0, len - gap);
    const offset = -cumulative;
    cumulative += len;
    return {
      d,
      i,
      dash,
      offset,
      color: langDots[d.name] ?? langFallbackPalette[i % langFallbackPalette.length],
    };
  });
}

/* Donut chart — hollow-center ring of language percentages */
export function LanguageDonut({
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

  const segments = useMemo(
    () => buildDonutSegments(data, circumference, gap),
    [data, circumference, gap],
  );

  const active = hovered !== null ? data[hovered] : null;
  const activeColor = active
    ? langDots[active.name] ?? langFallbackPalette[hovered! % langFallbackPalette.length]
    : "var(--orange-deep)";

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
            stroke="rgba(192,68,15,0.16)"
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

/* Activity histogram — vertical bars stacked by language, with hover tooltip */
export function ActivityBars({
  years,
  maxYear,
  height,
}: {
  years: {
    year: number;
    count: number;
    byLang: { name: string; count: number }[];
  }[];
  maxYear: number;
  height?: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  return (
    <div
      className="grid items-end gap-[clamp(2px,0.3vw,4px)]"
      style={{
        gridTemplateColumns: `repeat(${Math.max(1, years.length)}, minmax(0, 1fr))`,
        height: height ?? "clamp(80px,12svh,150px)",
      }}
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
              className="flex flex-col-reverse w-full overflow-hidden"
              style={{
                borderRadius: "2px 2px 0 0",
                opacity: isDimmed ? 0.35 : isActive ? 1 : 0.85,
                transition: "opacity 0.2s ease",
              }}
            >
              {y.byLang.map((l) => (
                <div
                  key={l.name}
                  style={{
                    height: `${(l.count / y.count) * 100}%`,
                    background: langDots[l.name] ?? "var(--orange-soft)",
                  }}
                />
              ))}
            </motion.div>
            <AnimatePresence>
              {isActive && (
                <motion.div
                  key="tip"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.18, ease }}
                  className="t-mono pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap z-10 flex flex-col gap-0.5"
                  style={{
                    bottom: "calc(100% + 4px)",
                    fontSize: "clamp(10px,0.72vw,12px)",
                    color: "var(--cream)",
                    padding: "4px 7px",
                    background: "rgba(35,21,16,0.92)",
                    border: "1px solid rgba(244,235,216,0.3)",
                    borderRadius: 4,
                  }}
                >
                  <span style={{ fontWeight: 600 }}>
                    {y.year} · {y.count} {y.count === 1 ? "repo" : "repos"}
                  </span>
                  {y.byLang.slice(0, 4).map((l) => (
                    <span key={l.name} className="inline-flex items-center gap-1.5">
                      <span
                        className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: langDots[l.name] ?? "var(--cream-soft)" }}
                      />
                      <span style={{ opacity: 0.9 }}>
                        {l.name} · {l.count}
                      </span>
                    </span>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

export function AnalyticsCollapsed({ github }: { github: GithubData }) {
  const { years, joinedYear, langPct } = buildAnalytics(github);
  const yearsOnGithub = joinedYear ? new Date().getFullYear() - joinedYear : null;
  const heroYears = yearsOnGithub ?? computeExperienceYears();
  const maxYear = Math.max(1, ...years.map((y) => y.count));
  const headline = github.ownedRepos.slice(0, 10);
  const reduce = useReducedMotion();

  // Mirrors the `compact:` custom-variant in globals.css. The ring chart size is a JS prop,
  // so we can't shrink it with a CSS class alone.
  const [isCompact, setIsCompact] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px) and (max-height: 800px)");
    const apply = () => setIsCompact(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const colHidden = reduce ? false : { opacity: 0, y: 18 };

  return (
    <>
      {/* Mobile — compact: stat + title, plus mini language bar and activity chart */}
      <div className="flex lg:hidden flex-col w-full h-full justify-between gap-3 px-3 py-3">
        <div className="flex items-start justify-between gap-3">
          <motion.h2
            className="t-display min-w-0"
            style={{
              fontFamily: "var(--font-gunterz), sans-serif",
              fontWeight: 900,
              fontSize: "clamp(20px, 3.4vw, 38px)",
              lineHeight: 0.95,
              letterSpacing: "-0.015em",
            }}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: CONTENT_BASE_DELAY + 0.15 }}
          >
            <SplitText delay={CONTENT_BASE_DELAY + 0.2}>Dev Profile.</SplitText>
          </motion.h2>
          <h2
            className="t-display min-w-0 text-right"
            style={{
              fontWeight: 900,
              fontSize: "clamp(20px, 3.4vw, 38px)",
              lineHeight: 0.95,
              letterSpacing: "-0.015em",
            }}
          >
            <SplitText delay={CONTENT_BASE_DELAY + 0.4}>Live</SplitText>
            <br />
            <SplitText delay={CONTENT_BASE_DELAY + 0.55}>projects.</SplitText>
          </h2>
        </div>

        {/* Mini activity chart */}
        <motion.div
          className="flex flex-col gap-1"
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: CONTENT_BASE_DELAY + 0.85 }}
        >
          <div className="flex items-baseline justify-between">
            <p className="t-mono-xs" style={{ opacity: 0.75, fontSize: "clamp(10px, 1.2vw, 14px)", letterSpacing: "0.16em" }}>
              pushed · activity
            </p>
            <p className="t-mono-xs" style={{ opacity: 0.55, fontSize: "clamp(10px, 1.2vw, 14px)", letterSpacing: "0.16em" }}>
              ★ {github.totalStars}
            </p>
          </div>
          <ActivityBars years={years} maxYear={maxYear} height="clamp(42px, 7vw, 90px)" />
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${Math.max(1, years.length)}, minmax(0, 1fr))`,
              opacity: 0.6,
            }}
          >
            {years.map((y) => (
              <span
                key={y.year}
                className="t-mono text-center"
                style={{ fontSize: "clamp(9px, 1.1vw, 13px)", letterSpacing: "0.06em" }}
              >
                &apos;{String(y.year).slice(2)}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Desktop / lg+ — full 3-column dashboard */}
      <div className="hidden lg:flex flex-col w-full h-full gap-3 min-w-0">
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

      {/* 3-column body — collapses to 2 cols on compact (landscape-short) since the right "repos · live"
          column is hidden there. */}
      <div
        className="grid flex-1 min-h-0 gap-[clamp(14px,1.6vw,28px)] grid-cols-[1fr_0.9fr_1.15fr] compact:grid-cols-[1.1fr_1fr]"
        style={{ paddingTop: "clamp(12px,1.6svh,22px)" }}
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
                  "4px 4px 0 rgba(192,68,15,0.22), 8px 8px 0 rgba(192,68,15,0.08)",
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
          style={{ borderLeft: "1px solid rgba(192,68,15,0.22)" }}
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
          <div className="flex-1 min-h-0 flex items-center justify-center p-[clamp(8px,1.2vw,18px)] compact:p-1">
            <LanguageDonut
              data={langPct}
              size={isCompact ? 96 : 170}
              centerLabel={langPct.length}
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
                  style={{ background: langDots[l.name] ?? "var(--orange-soft)" }}
                />
                <span className="truncate">{l.name}</span>
                <span style={{ opacity: 0.65 }}>{l.pct}%</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Right: live repos — dropped on compact (Nest Hub) where the row budget can't fit it */}
        <motion.div
          className="flex flex-col gap-2 min-w-0 min-h-0 pl-[clamp(12px,1.2vw,22px)] compact:hidden"
          style={{ borderLeft: "1px solid rgba(192,68,15,0.22)" }}
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
                    style={{ background: langDots[r.language ?? ""] ?? "var(--orange-soft)" }}
                  />
                  <span
                    className="t-display truncate"
                    style={{
                      fontSize: "clamp(14px,1.2vw,20px)",
                      fontWeight: 400,
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
    </>
  );
}

export function AnalyticsExpanded({ github }: { github: GithubData }) {
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
      className="flex flex-col h-full min-w-0 overflow-x-hidden overflow-y-auto scrollbar-styled-ink gap-[clamp(16px,1.8vw,32px)] compact:gap-3 lg:grid lg:grid-cols-[0.95fr_1.15fr_1.25fr] lg:grid-rows-[auto_auto] compact:grid-cols-[0.55fr_1.3fr_1.5fr]"
    >
      {/* Left: hero retro number + stat list (spans both rows on lg) */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col gap-3 min-w-0 lg:row-span-2 lg:justify-between"
      >
        <div
          className="grid grid-cols-2 gap-x-3 items-start lg:flex lg:flex-col lg:gap-0 pt-[clamp(8px,2.2svh,32px)] compact:pt-1"
        >
          {joinedYear && (
            <div className="col-start-1 row-start-1 flex items-end gap-2 min-w-0">
              <p
                className="t-retro text-[clamp(44px,11vw,140px)] lg:text-[clamp(36px,4.2vw,96px)] compact:text-[clamp(28px,3vw,40px)]"
                style={{
                  textShadow:
                    "3px 3px 0 rgba(192,68,15,0.22), 6px 6px 0 rgba(192,68,15,0.08)",
                }}
              >
                <Counter to={new Date().getFullYear() - joinedYear} />
              </p>
              <p
                className="t-mono pb-2"
                style={{ opacity: 0.8, fontSize: "clamp(11px,2.6vw,16px)", letterSpacing: "0.08em" }}
              >
                years
              </p>
            </div>
          )}
          <div
            className="col-start-1 row-start-2 mt-3 flex items-end gap-2 min-w-0"
            style={{ paddingTop: "clamp(6px,0.8svh,10px)" }}
          >
            <p
              className="t-retro text-[clamp(44px,11vw,140px)] lg:text-[clamp(36px,4.2vw,96px)]"
              style={{
                textShadow:
                  "3px 3px 0 rgba(192,68,15,0.22), 6px 6px 0 rgba(192,68,15,0.08)",
              }}
            >
              <Counter to={repoCount} />
            </p>
            <p
              className="t-mono pb-2"
              style={{ opacity: 0.8, fontSize: "clamp(11px,2.6vw,16px)", letterSpacing: "0.08em" }}
            >
              public repos
            </p>
          </div>
          <h2
            className="col-start-2 row-start-2 self-start mt-3 text-left lg:mt-4 lg:pl-[clamp(12px,2vw,32px)] min-w-0 text-[clamp(26px,8vw,84px)] lg:text-[clamp(28px,4.4vw,72px)] compact:text-[clamp(20px,2.6vw,32px)] compact:mt-1"
            style={{
              lineHeight: 0.9,
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            <SplitText className="block" delay={0.1}>Built</SplitText>
            <SplitText
              className="block text-center t-serif"
              style={{ color: "var(--orange)", fontWeight: 400 }}
              delay={0.28}
            >
              over
            </SplitText>
            <SplitText className="block text-center" delay={0.46}>the years.</SplitText>
          </h2>
        </div>
        <ul className="flex flex-col gap-2 compact:gap-0.5">
          {[
            { k: "followers", v: u?.followers ?? 0 },
            { k: "following", v: u?.following ?? 0 },
            { k: "total stars", v: github.totalStars },
            { k: "joined", v: joinedYear ?? "—" },
            ...(github.contributions
              ? [
                  {
                    k: "contributions · 1y",
                    v: github.contributions.totalContributions,
                  },
                  ...(github.contributions.mostActiveDay
                    ? [
                        {
                          k: "most active",
                          v: formatMostActiveDay(
                            github.contributions.mostActiveDay.date,
                          ),
                        },
                      ]
                    : []),
                  {
                    k: "longest streak",
                    v: `${github.contributions.longestStreak}d`,
                  },
                ]
              : []),
          ].map((s) => (
            <li
              key={s.k}
              className="flex items-baseline justify-between gap-3 pt-1.5 compact:pt-1"
              style={{ borderTop: "1px solid rgba(192,68,15,0.2)" }}
            >
              <span
                className="t-mono opacity-75 text-[clamp(9px,2.2vw,12px)] compact:text-[9px]"
                style={{ letterSpacing: "0.08em" }}
              >
                {s.k}
              </span>
              <span
                className="t-num text-[clamp(13px,3vw,18px)] compact:text-[11px]"
                style={{ fontWeight: 700 }}
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
        className="flex flex-col min-w-0 gap-3"
      >
        <div className="flex flex-col">
          <div className="flex items-baseline justify-between mb-2">
            <p
              className="t-mono opacity-70"
              style={{ fontSize: "clamp(10px,2.6vw,14px)" }}
            >
              featured · curated
            </p>
            <p
              className="t-mono-xs opacity-60"
              style={{ fontSize: "clamp(9px,2.2vw,12px)" }}
            >
              {featured.length} projects · click to expand
            </p>
          </div>
          <ul className="flex flex-col">
            {featured.map((p, i) => {
              const isOpen = openProject === p.name;
              return (
                <li
                  key={p.name}
                  className="min-w-0"
                  style={{ borderTop: i === 0 ? "1px solid rgba(192,68,15,0.22)" : "1px solid rgba(192,68,15,0.14)" }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenProject(isOpen ? null : p.name)}
                    aria-expanded={isOpen}
                    className="w-full flex items-baseline justify-between gap-3 text-left py-[clamp(8px,1svh,14px)] compact:py-1.5 group"
                  >
                    <span className="inline-flex items-baseline gap-2 min-w-0">
                      <span
                        className="t-retro shrink-0 text-[clamp(18px,5vw,38px)] compact:text-[clamp(14px,1.8vw,20px)]"
                        style={{
                          opacity: isOpen ? 1 : 0.55,
                          transition: "opacity 0.3s ease",
                        }}
                      >
                        {isOpen ? "−" : "+"}
                      </span>
                      <span
                        className="t-display truncate text-[clamp(18px,5vw,38px)] compact:text-[clamp(14px,1.8vw,20px)]"
                        style={{
                          fontWeight: 400,
                          letterSpacing: "-0.01em",
                          lineHeight: 1,
                        }}
                      >
                        {p.name}
                      </span>
                    </span>
                    <span
                      className="t-mono-xs opacity-55 shrink-0"
                      style={{ fontSize: "clamp(9px,2.2vw,12px)" }}
                    >
                      {p.context.split(",")[0]}
                    </span>
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
                        <div className="pb-[clamp(10px,1.4svh,18px)] pl-[clamp(14px,3.4vw,36px)] flex flex-col gap-2">
                          <p
                            className="t-serif"
                            style={{
                              color: "var(--orange)",
                              fontSize: "clamp(12px,3.2vw,20px)",
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
                                  fontSize: "clamp(11px,2.6vw,15px)",
                                  lineHeight: 1.5,
                                  opacity: 0.88,
                                }}
                              >
                                <span className="opacity-50 shrink-0">·</span>
                                <span>{h}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="mt-2 min-w-0">
                            <p
                              className="t-mono opacity-85 mb-0.5"
                              style={{
                                fontSize: "clamp(10px,1.2vw,13px)",
                                letterSpacing: "0.08em",
                              }}
                            >
                              <span style={{ opacity: 0.55 }}>$ </span>
                              tech
                            </p>
                            <p
                              className="t-code wrap-break-word"
                              style={{
                                fontSize: "clamp(10px,1.05vw,13px)",
                                lineHeight: 1.6,
                                opacity: 0.85,
                                paddingLeft: "1em",
                                letterSpacing: 0,
                              }}
                            >
                              {p.technologies.map((t) => t.toLowerCase()).join(" · ")}
                            </p>
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
            <p
              className="t-mono opacity-70 inline-flex items-center gap-1.5"
              style={{ fontSize: "clamp(10px,2.6vw,14px)" }}
            >
              <span className="live-dot" /> repos · live
            </p>
            <a
              href={profile.social.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="t-mono-xs opacity-70 link-line inline-flex items-center gap-1"
              style={{ fontSize: "clamp(9px,2.2vw,12px)" }}
            >
              <SocialIcon name="github" size={12} /> @{profile.social.githubUser} ↗
            </a>
          </div>
          <ul
            className="grid gap-x-[clamp(8px,2vw,16px)] gap-y-[clamp(4px,0.6svh,8px)] overflow-hidden"
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
                      style={{ background: langDots[r.language ?? ""] ?? "var(--orange-soft)" }}
                    />
                    <span
                      className="t-display truncate link-line"
                      style={{ fontSize: "clamp(10px,2.6vw,14px)" }}
                    >
                      {r.name}
                    </span>
                  </span>
                  <span
                    className="t-mono-xs opacity-55 shrink-0"
                    style={{ fontSize: "clamp(9px,2.2vw,12px)" }}
                  >
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
        className="flex flex-col min-w-0 gap-3"
      >
        <div className="flex flex-col">
          <div className="flex items-baseline justify-between mb-3">
            <p
              className="t-mono opacity-75"
              style={{ fontSize: "clamp(11px,1.4vw,15px)", letterSpacing: "0.08em" }}
            >
              skills
            </p>
            <p
              className="t-mono-xs opacity-60"
              style={{ fontSize: "clamp(9px,1vw,13px)" }}
            >
              {groups.reduce((n, g) => n + g.items.length, 0)} total
            </p>
          </div>

          {/* Terminal-style listing — one category per row, used on all screens */}
          <div className="flex flex-col gap-3 min-w-0">
            {groups.map((g) => (
              <div
                key={g.key}
                className="min-w-0 pt-2"
                style={{ borderTop: "1px solid rgba(192,68,15,0.22)" }}
              >
                <div className="flex items-baseline justify-between mb-1">
                  <p
                    className="t-mono opacity-85"
                    style={{
                      fontSize: "clamp(11px,1.4vw,15px)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    <span style={{ opacity: 0.55 }}>$ </span>
                    {g.key.toLowerCase()}
                  </p>
                  <p
                    className="t-mono-xs opacity-50"
                    style={{ fontSize: "clamp(9px,1vw,13px)" }}
                  >
                    {String(g.items.length).padStart(2, "0")}
                  </p>
                </div>
                <p
                  className="t-code wrap-break-word"
                  style={{
                    fontSize: "clamp(11px,1.1vw,14px)",
                    lineHeight: 1.6,
                    opacity: 0.85,
                    paddingLeft: "1em",
                    letterSpacing: 0,
                  }}
                >
                  {g.items.map((it) => it.toLowerCase()).join(" · ")}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-3" style={{ borderTop: "1px solid rgba(192,68,15,0.22)" }}>
          <div className="flex items-baseline justify-between mb-3">
            <p
              className="t-mono opacity-70"
              style={{ fontSize: "clamp(10px,2.6vw,14px)" }}
            >
              languages · github
            </p>
            <p
              className="t-mono-xs opacity-60"
              style={{ fontSize: "clamp(9px,2.2vw,12px)" }}
            >
              {langPct.length} tracked
            </p>
          </div>
          <div className="flex items-center gap-[clamp(10px,2.4vw,22px)] min-w-0">
            <div className="shrink-0 p-[clamp(8px,1.6vw,16px)]">
              <LanguageDonut
                data={langPct}
                size={120}
                centerLabel={langPct.length}
                centerSublabel="langs"
              />
            </div>
            <ul className="flex flex-col gap-1.5 min-w-0 flex-1">
              {langPct.map((l, i) => (
                <li key={l.name} className="flex items-baseline justify-between gap-2 min-w-0">
                  <span className="inline-flex items-center gap-1.5 min-w-0">
                    <span
                      className="inline-block w-2 h-2 rounded-full shrink-0"
                      style={{ background: langDots[l.name] ?? (i % 2 === 0 ? "var(--orange-deep)" : "var(--orange-soft)") }}
                    />
                    <span
                      className="t-display truncate"
                      style={{ fontSize: "clamp(11px,2.8vw,18px)", letterSpacing: "0.01em" }}
                    >
                      {l.name}
                    </span>
                  </span>
                  <span className="t-num shrink-0" style={{ fontSize: "clamp(11px,2.8vw,18px)" }}>
                    {l.pct}%
                  </span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </motion.div>

      {/* Bottom band: contribution heatmap — spans middle + right columns on lg */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col min-w-0 gap-2 lg:col-start-2 lg:col-span-2 lg:row-start-2 lg:pt-3"
        style={{ borderTop: "1px solid rgba(192,68,15,0.22)" }}
      >
        <div className="flex items-baseline justify-between">
          <p
            className="t-mono opacity-70 inline-flex items-center gap-1.5"
            style={{ fontSize: "clamp(10px,1vw,14px)" }}
          >
            {github.contributions ? (
              <>
                <span className="live-dot" /> contributions · 1y
              </>
            ) : (
              "activity · pushed"
            )}
          </p>
          <p
            className="t-mono-xs opacity-60"
            style={{ fontSize: "clamp(9px,0.85vw,12px)" }}
          >
            {github.contributions
              ? `${github.contributions.totalContributions} total · ${github.contributions.daysActive} active days · streak ${github.contributions.currentStreak}d · longest ${github.contributions.longestStreak}d`
              : `${years.length} yrs`}
          </p>
        </div>
        {github.contributions ? (
          <div className="flex flex-col gap-2 min-w-0">
            <div className="w-full max-w-full overflow-x-auto scrollbar-styled-ink">
              <ContributionHeatmap
                contributions={github.contributions}
                cellSize={14}
                gap={3}
              />
            </div>
            <ContributionLegend cellSize={12} />
          </div>
        ) : (
          <>
            <ActivityBars years={years} maxYear={maxYear} height="clamp(56px,10svh,150px)" />
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
                  style={{ fontSize: "clamp(9px,2.2vw,12px)" }}
                >
                  &apos;{String(y.year).slice(2)}
                </span>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
