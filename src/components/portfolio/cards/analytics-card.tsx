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
import { experiences, profile } from "@/data/profile";
import type { GithubData } from "@/lib/github";
import { ease, CONTENT_BASE_DELAY, langDots, langFallbackPalette } from "../constants";
import { SplitText } from "../split-text";
import { fadeUp, stagger } from "../animations";
import { SocialIcon } from "../social-icon";
import { Counter } from "../stat";
import {
  ContributionHeatmap,
  ContributionLegend,
} from "../contribution-heatmap";
import { formatRelative } from "./projects-card";

/* ───────────────────────── SKILLS · GITHUB ───────────────────────── */

export function skillGroups() {
  return [
    { key: "Languages", items: profile.skills.languages },
    { key: "Frameworks", items: profile.skills.frameworks },
    { key: "Databases", items: profile.skills.databases },
    { key: "Tooling", items: profile.skills.tools },
  ];
}

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
  const wrapRef = useRef<HTMLDivElement>(null);
  // Tooltip position goes straight to the DOM — setState per mousemove would
  // re-render the whole ring on every frame.
  const posRef = useRef({ x: 0, y: 0 });
  const tipRef = useRef<HTMLDivElement | null>(null);

  const applyTip = () => {
    const el = tipRef.current;
    if (!el) return;
    el.style.left = `${posRef.current.x}px`;
    el.style.top = `${posRef.current.y}px`;
  };

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
    posRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    applyTip();
  };

  return (
    <div
      ref={wrapRef}
      className="relative inline-block"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Languages: ${data.map((d) => `${d.name} ${d.pct}%`).join(", ")}`}
    >
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
            className="t-mono pointer-events-none absolute z-10 whitespace-nowrap inline-flex items-center gap-1.5"
            style={{
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
      role="img"
      aria-label={`Repos created per year: ${years
        .map((y) => `${y.year}: ${y.count}`)
        .join(", ")}`}
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
  const { years, joinedYear, langPct } = useMemo(
    () => buildAnalytics(github),
    [github],
  );
  const yearsOnGithub = joinedYear ? new Date().getFullYear() - joinedYear : null;
  const heroYears = yearsOnGithub ?? computeExperienceYears();
  const maxYear = Math.max(1, ...years.map((y) => y.count));
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
              // cqw cap: two headings share this row — vw clamps alone wrap
              // "Profile." / "projects." mid-word (see bio-card)
              fontSize: "min(clamp(20px, 3.4vw, 38px), 5.6cqw)",
              lineHeight: 0.95,
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
              fontSize: "min(clamp(20px, 3.4vw, 38px), 5.6cqw)",
              lineHeight: 0.95,
            }}
          >
            <SplitText delay={CONTENT_BASE_DELAY + 0.4}>The</SplitText>
            <br />
            <SplitText delay={CONTENT_BASE_DELAY + 0.55}>stack.</SplitText>
          </h2>
        </div>

        {/* Mini language bar — fills the middle of the tall phone tile; the
            tablet tile is a short row and only fits headings + activity. */}
        <motion.div
          className="hidden max-[639px]:flex flex-col gap-1.5"
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: CONTENT_BASE_DELAY + 0.7 }}
        >
          <p
            className="t-mono-xs"
            style={{ opacity: 0.75, fontSize: "clamp(10px, 1.2vw, 14px)", letterSpacing: "0.16em" }}
          >
            languages
          </p>
          <LanguageBar data={langPct} />
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            {langPct.slice(0, 3).map((l, i) => (
              <p
                key={l.name}
                className="t-mono-xs inline-flex items-center gap-1"
                style={{ opacity: 0.65, fontSize: "clamp(9px, 1.1vw, 12px)" }}
              >
                <span
                  aria-hidden
                  className="inline-block rounded-full"
                  style={{
                    width: 6,
                    height: 6,
                    background:
                      langDots[l.name] ??
                      (i % 2 === 0 ? "var(--orange-deep)" : "var(--orange-soft)"),
                  }}
                />
                {l.name} {l.pct}%
              </p>
            ))}
          </div>
        </motion.div>

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

      {/* Desktop / lg+ — poster heading + mini stat strip, language donut right.
          The full stack listing, repos and heatmap live in the expanded view. */}
      <div className="hidden lg:flex flex-col w-full h-full gap-3 min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <p
          className="t-mono-xs shrink-0"
          style={{ opacity: 0.7, fontSize: "clamp(10px,0.78vw,13px)", letterSpacing: "0.18em" }}
        >
          skills · github
        </p>
        <p
          className="t-mono-xs shrink-0 inline-flex items-center gap-1.5"
          style={{ opacity: 0.7, fontSize: "clamp(10px,0.78vw,13px)" }}
        >
          <span className="live-dot" />
          {joinedYear ? `since ${joinedYear}` : "github"}
        </p>
      </div>

      <div className="grid flex-1 min-h-0 items-center gap-[clamp(16px,2vw,40px)] grid-cols-[1.1fr_0.9fr]">
        {/* Left: poster heading + stat mini-strip */}
        <motion.div
          className="flex flex-col justify-center gap-[clamp(14px,2.4svh,28px)] compact:gap-2 min-w-0 min-h-0"
          initial={colHidden}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: CONTENT_BASE_DELAY + 0.2 }}
        >
          <h2
            className="t-display min-w-0 text-[clamp(30px,3.2vw,58px)] compact:text-[clamp(22px,2.4vw,34px)]"
            style={{ lineHeight: 0.95 }}
          >
            <SplitText delay={CONTENT_BASE_DELAY + 0.3}>The</SplitText>
            <SplitText
              className="t-serif"
              style={{ color: "var(--orange)", fontWeight: 400 }}
              delay={CONTENT_BASE_DELAY + 0.45}
            >
              stack.
            </SplitText>
          </h2>
          <ul className="grid grid-cols-1 min-w-0">
            {[{ k: "years building", v: heroYears }].map((s, i) => (
              <motion.li
                key={s.k}
                className="min-w-0 pt-1.5 compact:pt-1"
                style={{ borderTop: "1px solid rgba(192,68,15,0.22)" }}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: CONTENT_BASE_DELAY + 0.7 + i * 0.08,
                  ease,
                }}
              >
                <p
                  className="t-mono-xs truncate"
                  style={{ opacity: 0.65, fontSize: "clamp(9px,0.7vw,11px)", letterSpacing: "0.1em" }}
                >
                  {s.k}
                </p>
                <p
                  className="t-num text-[clamp(20px,1.9vw,34px)] compact:text-[clamp(15px,1.5vw,22px)]"
                  style={{ lineHeight: 1.15 }}
                >
                  <Counter to={s.v} startDelay={CONTENT_BASE_DELAY + 0.75 + i * 0.08} />
                </p>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Right: language ring chart */}
        <motion.div
          className="flex flex-col gap-2 min-w-0 min-h-0 pl-[clamp(12px,1.2vw,22px)]"
          style={{ borderLeft: "1px solid rgba(192,68,15,0.22)" }}
          initial={colHidden}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: CONTENT_BASE_DELAY + 0.35 }}
        >
          <p
            className="t-mono truncate"
            style={{ opacity: 0.75, fontSize: "clamp(11px,0.85vw,14px)", letterSpacing: "0.08em" }}
          >
            languages
          </p>
          <div className="flex-1 min-h-0 flex items-center justify-center p-[clamp(8px,1.2vw,18px)] compact:p-1">
            <LanguageDonut
              data={langPct}
              size={isCompact ? 96 : 170}
              centerLabel={langPct.length}
            />
          </div>
          <ul className="flex flex-wrap gap-x-2 gap-y-0.5 mt-auto min-w-0">
            {langPct.slice(0, 3).map((l, i) => (
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
      </div>
    </div>
    </>
  );
}

export function AnalyticsExpanded({ github }: { github: GithubData }) {
  const { langPct, years, joinedYear } = useMemo(
    () => buildAnalytics(github),
    [github],
  );
  const maxYear = Math.max(1, ...years.map((y) => y.count));
  // Count what's actually listed — `public_repos` counts forks and hidden
  // repos, so it would disagree with the list right below it.
  const repoCount = github.ownedRepos.length;
  const groups = skillGroups();
  const liveRepos = github.ownedRepos.slice(0, 12);
  const contrib = github.contributions;

  const stats: { k: string; v: number | string }[] = [
    {
      k: "years",
      v: joinedYear
        ? new Date().getFullYear() - joinedYear
        : computeExperienceYears(),
    },
    { k: "joined", v: joinedYear ?? "—" },
  ];

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="flex flex-col h-full min-w-0 overflow-x-hidden overflow-y-auto scrollbar-styled-ink gap-[clamp(14px,2.2svh,26px)] compact:gap-2.5"
    >
      {/* Header: one-line display heading + live github link */}
      <motion.div
        variants={fadeUp}
        className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"
      >
        <h2
          className="split-inline min-w-0 text-[clamp(28px,7.5vw,44px)] lg:text-[clamp(30px,3.2vw,56px)] compact:text-[clamp(20px,2.2vw,30px)]"
          style={{
            fontFamily: "var(--font-pixel), sans-serif",
            fontWeight: 900,
            lineHeight: 0.95,
            letterSpacing: "0.01em",
          }}
        >
          <SplitText delay={0.1}>Built</SplitText>{" "}
          <SplitText
            className="t-serif"
            style={{ color: "var(--orange)", fontWeight: 400 }}
            delay={0.24}
          >
            over
          </SplitText>{" "}
          <SplitText delay={0.38}>the years.</SplitText>
        </h2>
        <a
          href={profile.social.githubUrl}
          target="_blank"
          rel="noreferrer"
          className="t-mono-xs opacity-70 link-line inline-flex items-center gap-1.5 shrink-0"
          style={{ fontSize: "clamp(10px,2.4vw,13px)" }}
        >
          <span className="live-dot" />
          <SocialIcon name="github" size={12} /> @{profile.social.githubUser} ↗
        </a>
      </motion.div>

      {/* Stat strip — 2-up on phones, 3-up small tablets, one band on lg */}
      <motion.ul
        variants={fadeUp}
        className="grid grid-cols-2 lg:max-w-[min(420px,36%)] gap-x-[clamp(12px,1.6vw,28px)] gap-y-[clamp(8px,1.2svh,14px)]"
      >
        {stats.map((s) => (
          <li
            key={s.k}
            className="min-w-0 pt-1.5 compact:pt-1"
            style={{ borderTop: "1px solid rgba(192,68,15,0.22)" }}
          >
            <p
              className="t-mono-xs truncate"
              style={{
                opacity: 0.65,
                fontSize: "clamp(9px,2.2vw,11px)",
                letterSpacing: "0.1em",
              }}
            >
              {s.k}
            </p>
            <p
              className="t-num text-[clamp(20px,5.5vw,28px)] lg:text-[clamp(20px,1.9vw,34px)] compact:text-[clamp(15px,1.5vw,22px)]"
              style={{ lineHeight: 1.15 }}
            >
              {typeof s.v === "number" ? <Counter to={s.v} /> : s.v}
            </p>
          </li>
        ))}
      </motion.ul>

      {/* Body: skills | languages | repos — stacks on phones, 2-col on md, 3-col band on lg */}
      <div className="grid gap-x-[clamp(18px,2.4vw,36px)] gap-y-[clamp(16px,2.4svh,26px)] md:grid-cols-2 lg:grid-cols-[1.25fr_0.95fr_1.05fr] lg:flex-1">
        {/* Skills — terminal listing */}
        <motion.div variants={fadeUp} className="flex flex-col min-w-0 gap-2">
          <div className="flex items-baseline justify-between">
            <p
              className="t-mono opacity-75"
              style={{ fontSize: "clamp(11px,2.6vw,14px)", letterSpacing: "0.08em" }}
            >
              skills
            </p>
            <p
              className="t-mono-xs opacity-55"
              style={{ fontSize: "clamp(9px,2.2vw,12px)" }}
            >
              {groups.reduce((n, g) => n + g.items.length, 0)} total
            </p>
          </div>
          <div className="flex flex-col gap-[clamp(8px,1.2svh,14px)] min-w-0">
            {groups.map((g) => (
              <div
                key={g.key}
                className="min-w-0 pt-1.5"
                style={{ borderTop: "1px solid rgba(192,68,15,0.18)" }}
              >
                <div className="flex items-baseline justify-between mb-0.5">
                  <p
                    className="t-mono opacity-85"
                    style={{
                      fontSize: "clamp(10px,2.4vw,13px)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    <span style={{ opacity: 0.55 }}>$ </span>
                    {g.key.toLowerCase()}
                  </p>
                  <p
                    className="t-mono-xs opacity-50"
                    style={{ fontSize: "clamp(9px,2.2vw,12px)" }}
                  >
                    {String(g.items.length).padStart(2, "0")}
                  </p>
                </div>
                <p
                  className="t-code wrap-break-word"
                  style={{
                    fontSize: "clamp(11px,2.6vw,13px)",
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
        </motion.div>

        {/* Languages — donut + full legend */}
        <motion.div variants={fadeUp} className="flex flex-col min-w-0 gap-2">
          <div className="flex items-baseline justify-between">
            <p
              className="t-mono opacity-75"
              style={{ fontSize: "clamp(11px,2.6vw,14px)", letterSpacing: "0.08em" }}
            >
              languages · github
            </p>
            <p
              className="t-mono-xs opacity-55"
              style={{ fontSize: "clamp(9px,2.2vw,12px)" }}
            >
              {langPct.length} tracked
            </p>
          </div>
          <div
            className="flex items-center gap-[clamp(12px,2vw,24px)] min-w-0 pt-1.5"
            style={{ borderTop: "1px solid rgba(192,68,15,0.18)" }}
          >
            <div className="shrink-0 p-[clamp(6px,1vw,12px)] compact:hidden">
              <LanguageDonut data={langPct} size={110} centerLabel={langPct.length} />
            </div>
            <ul className="flex flex-col gap-1.5 min-w-0 flex-1">
              {langPct.map((l, i) => (
                <li
                  key={l.name}
                  className="flex items-baseline justify-between gap-2 min-w-0"
                >
                  <span className="inline-flex items-center gap-1.5 min-w-0">
                    <span
                      className="inline-block w-2 h-2 rounded-full shrink-0"
                      style={{
                        background:
                          langDots[l.name] ??
                          (i % 2 === 0 ? "var(--orange-deep)" : "var(--orange-soft)"),
                      }}
                    />
                    <span
                      className="t-display-med truncate"
                      style={{ fontSize: "clamp(11px,2.8vw,16px)" }}
                    >
                      {l.name}
                    </span>
                  </span>
                  <span
                    className="t-num shrink-0"
                    style={{ fontSize: "clamp(11px,2.8vw,16px)" }}
                  >
                    {l.pct}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <LanguageBar data={langPct} height={6} />
        </motion.div>

        {/* Repos — live list; full-width row on md, own column on lg */}
        <motion.div
          variants={fadeUp}
          className="flex flex-col min-w-0 gap-2 md:col-span-2 lg:col-span-1"
        >
          <div className="flex items-baseline justify-between">
            <p
              className="t-mono opacity-75 inline-flex items-center gap-1.5"
              style={{ fontSize: "clamp(11px,2.6vw,14px)", letterSpacing: "0.08em" }}
            >
              <span className="live-dot" /> repos · live
            </p>
            <p
              className="t-mono-xs opacity-55"
              style={{ fontSize: "clamp(9px,2.2vw,12px)" }}
            >
              {Math.min(liveRepos.length, repoCount)} of {repoCount}
            </p>
          </div>
          <ul
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-x-[clamp(10px,2vw,18px)] pt-1.5"
            style={{ borderTop: "1px solid rgba(192,68,15,0.18)" }}
          >
            {liveRepos.map((r) => (
              <li key={r.id} className="min-w-0">
                <a
                  href={r.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-baseline justify-between gap-2 py-[clamp(2px,0.4svh,4px)] group"
                >
                  <span className="inline-flex items-baseline gap-1.5 min-w-0">
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full shrink-0 translate-y-px"
                      style={{
                        background: langDots[r.language ?? ""] ?? "var(--orange-soft)",
                      }}
                    />
                    <span
                      className="t-display-med truncate link-line"
                      style={{ fontSize: "clamp(11px,2.6vw,14px)" }}
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
        </motion.div>
      </div>

      {/* Bottom band: contribution heatmap, full width */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col min-w-0 gap-2 pt-2.5 compact:pt-1.5"
        style={{ borderTop: "1px solid rgba(192,68,15,0.22)" }}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <p
            className="t-mono opacity-70 inline-flex items-center gap-1.5"
            style={{ fontSize: "clamp(10px,2.4vw,14px)" }}
          >
            {contrib ? (
              <>
                <span className="live-dot" /> contributions · 1y
              </>
            ) : (
              "activity · pushed"
            )}
          </p>
          <p
            className="t-mono-xs opacity-60 min-w-0"
            style={{ fontSize: "clamp(9px,2.2vw,12px)" }}
          >
            {contrib
              ? `${contrib.totalContributions} total · ${contrib.daysActive} active days · streak ${contrib.currentStreak}d · longest ${contrib.longestStreak}d`
              : `${years.length} yrs`}
          </p>
        </div>
        {contrib ? (
          <div className="flex flex-col gap-2 min-w-0">
            <div className="w-full max-w-full overflow-x-auto overflow-y-hidden scrollbar-styled-ink">
              <div className="w-fit mx-auto">
                <ContributionHeatmap contributions={contrib} cellSize={14} gap={3} />
              </div>
            </div>
            <div className="w-fit mx-auto">
              <ContributionLegend cellSize={10} />
            </div>
          </div>
        ) : (
          <>
            <ActivityBars
              years={years}
              maxYear={maxYear}
              height="clamp(56px,10svh,150px)"
            />
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
