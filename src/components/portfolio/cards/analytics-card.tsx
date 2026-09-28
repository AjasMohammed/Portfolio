"use client";

import { useMemo, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import { experiences, profile } from "@/data/profile";
import type { Contributions, GithubData } from "@/lib/github";
import { ease, CONTENT_BASE_DELAY, langDots } from "../constants";
import { SplitText } from "../split-text";
import { fadeUp, stagger } from "../animations";
import { SocialIcon } from "../social-icon";
import { Counter } from "../stat";
import {
  ContributionHeatmap,
  ContributionLegend,
  LEVEL_COLORS,
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

  // joined year
  const joinedYear = github.user
    ? new Date(github.user.created_at).getFullYear()
    : null;

  return { years, joinedYear };
}

const MONTHS = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];

export function parseMonthYear(str: string): number | null {
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

/* Skill pill — shared by the tile strip and the expanded listing */
/* Keycap — the key's edge is an inset shadow, not a thick border, so the
   press (1px drop + thinner edge) is transform + paint only: the box never
   changes size and the wrapped rows never reflow. Fixed 24px tall, so the
   clipped strips below cut cleanly between rows.
   `wave` (tile only): hovering the tile presses the keys left → right, like
   the stack being typed out; each key's delay is its index. */
function SkillChip({ children, wave }: { children: string; wave?: number }) {
  return (
    <span
      className={`t-code inline-flex items-center shrink-0 whitespace-nowrap rounded-[5px] border shadow-[inset_0_-2px_0_rgba(35,21,16,0.26)] transition-[translate,box-shadow] duration-200 ease-out hover:translate-y-px hover:shadow-[inset_0_-1px_0_rgba(35,21,16,0.26)] motion-reduce:transition-none ${
        wave === undefined
          ? ""
          : "group-hover:translate-y-px group-hover:shadow-[inset_0_-1px_0_rgba(35,21,16,0.26)]"
      }`}
      style={{
        fontSize: "clamp(10.5px,0.76vw,12px)",
        lineHeight: "16px",
        padding: "2px 8px 4px",
        borderColor: "rgba(35,21,16,0.32)",
        background: "rgba(255,251,242,0.7)",
        color: "var(--ink)",
        transitionDelay: wave === undefined ? undefined : `${wave * 45}ms`,
      }}
    >
      {children.toLowerCase()}
    </span>
  );
}

/* Recent-weeks heatmap whose cells scale to the column width — the full
   ContributionHeatmap sizes cells in px, which can't fit a fluid tile. */
function MiniHeatmap({
  contributions,
  weeks = 20,
}: {
  contributions: Contributions;
  weeks?: number;
}) {
  const recent = contributions.weeks.slice(-weeks);
  return (
    <div
      className="grid w-full gap-0.5"
      style={{
        gridAutoFlow: "column",
        gridTemplateRows: "repeat(7, auto)",
        gridTemplateColumns: `repeat(${recent.length}, minmax(0, 1fr))`,
      }}
      aria-hidden
    >
      {recent.flatMap((week, wi) =>
        Array.from({ length: 7 }, (_, di) => {
          const day = week[di];
          return (
            <span
              key={`${wi}-${di}`}
              className="aspect-square rounded-xs"
              style={{ background: day ? LEVEL_COLORS[day.level] : "transparent" }}
            />
          );
        }),
      )}
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
  const { years, joinedYear } = useMemo(() => buildAnalytics(github), [github]);
  const yearsOnGithub = joinedYear ? new Date().getFullYear() - joinedYear : null;
  const heroYears = yearsOnGithub ?? computeExperienceYears();
  const maxYear = Math.max(1, ...years.map((y) => y.count));
  const reduce = useReducedMotion();
  const contrib = github.contributions;
  // A few from each group so the strip reads as the whole stack, not just languages
  const chips = skillGroups().flatMap((g) => g.items.slice(0, 3));

  const stats = [
    { k: "years", v: heroYears },
    { k: "repos", v: github.ownedRepos.length },
    contrib
      ? { k: "contribs", v: contrib.totalContributions }
      : { k: "stars", v: github.totalStars },
  ];

  const colHidden = reduce ? false : { opacity: 0, y: 18 };
  const labelStyle = { opacity: 0.7, fontSize: "clamp(10px,0.78vw,12px)" };

  return (
    <>
      {/* Mobile — compact: stat + title, plus skill chips and activity chart */}
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
            <SplitText
              className="t-serif"
              style={{ color: "var(--orange)", fontWeight: 400 }}
              delay={CONTENT_BASE_DELAY + 0.55}
            >
              stack.
            </SplitText>
          </h2>
        </div>

        {/* Skill chips — fill the middle of the tall phone tile; the tablet
            tile is a short row and only fits headings + activity. */}
        <motion.div
          className="hidden max-[639px]:flex flex-wrap shrink-0 gap-1.5 overflow-hidden"
          style={{ height: 24 }}
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: CONTENT_BASE_DELAY + 0.7 }}
        >
          {chips.map((c, i) => (
            <SkillChip key={c} wave={i}>{c}</SkillChip>
          ))}
        </motion.div>

        {/* Mini activity chart */}
        <motion.div
          className="flex flex-col gap-1"
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: CONTENT_BASE_DELAY + 0.85 }}
        >
          <div className="flex items-baseline justify-between">
            <p className="t-mono-xs" style={{ opacity: 0.75, fontSize: "clamp(10px,1.2vw,12px)" }}>
              pushed · activity
            </p>
            <p className="t-mono-xs" style={{ opacity: 0.55, fontSize: "clamp(10px,1.2vw,12px)" }}>
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
                style={{ fontSize: "clamp(10px,1.1vw,12px)", letterSpacing: "0.06em" }}
              >
                &apos;{String(y.year).slice(2)}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Desktop / lg+ — heading + stat strip left, recent-weeks heatmap right,
          skill chips along the bottom. The full listing lives in the expanded view. */}
      <div className="hidden lg:flex flex-col w-full h-full gap-3 compact:gap-2 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className="t-mono-xs shrink-0" style={labelStyle}>
            skills · github
          </p>
          <p className="t-mono-xs shrink-0 inline-flex items-center gap-1.5" style={labelStyle}>
            <span className="live-dot" />
            {joinedYear ? `since ${joinedYear}` : "github"}
          </p>
        </div>

        <div className="grid flex-1 min-h-0 items-center gap-[clamp(16px,2vw,40px)] grid-cols-[1.05fr_0.95fr]">
          {/* Left: heading + stat strip */}
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
            <ul className="grid grid-cols-3 gap-x-[clamp(8px,1vw,16px)] min-w-0">
              {stats.map((s, i) => (
                <motion.li
                  key={s.k}
                  className="min-w-0 pt-1.5 compact:pt-1"
                  style={{ borderTop: "1px solid rgba(35,21,16,0.22)" }}
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
                    style={{ opacity: 0.65, fontSize: "clamp(10px,0.7vw,11px)", letterSpacing: "0.1em" }}
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

          {/* Right: last ~20 weeks of contributions (activity bars without a token) */}
          <motion.div
            className="flex flex-col justify-center gap-2 min-w-0 min-h-0 pl-[clamp(12px,1.2vw,22px)]"
            style={{ borderLeft: "1px solid rgba(35,21,16,0.22)" }}
            initial={colHidden}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: CONTENT_BASE_DELAY + 0.35 }}
          >
            <p className="t-mono-xs inline-flex items-center gap-1.5 truncate" style={labelStyle}>
              {contrib ? (
                <>
                  <span className="live-dot" /> recent activity
                </>
              ) : (
                "pushed · activity"
              )}
            </p>
            {contrib ? (
              <>
                <MiniHeatmap contributions={contrib} />
                <p className="t-mono-xs truncate" style={{ ...labelStyle, opacity: 0.55 }}>
                  {contrib.daysActive} active days · longest {contrib.longestStreak}d
                </p>
              </>
            ) : (
              <ActivityBars years={years} maxYear={maxYear} height="clamp(60px,10svh,120px)" />
            )}
          </motion.div>
        </div>

        {/* Bottom: one clipped row of skill chips — overflow wraps out of view.
            Right-aligned: the portrait sticker overlaps this tile's bottom-left. */}
        <motion.div
          className="flex flex-wrap justify-end gap-1.5 overflow-hidden pt-2.5 compact:pt-1.5 pl-[20%]"
          style={{ borderTop: "1px solid rgba(35,21,16,0.22)", maxHeight: 36 }}
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: CONTENT_BASE_DELAY + 0.9 }}
        >
          {chips.map((c, i) => (
            <SkillChip key={c} wave={i}>{c}</SkillChip>
          ))}
        </motion.div>
      </div>
    </>
  );
}

export function AnalyticsExpanded({ github }: { github: GithubData }) {
  const { years, joinedYear } = useMemo(
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
    { k: "repos", v: repoCount },
    contrib
      ? { k: "contribs · 1y", v: contrib.totalContributions }
      : { k: "stars", v: github.totalStars },
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
            fontFamily: "var(--font-grift), system-ui, sans-serif",
            fontWeight: 600,
            lineHeight: 0.95,
            letterSpacing: "-0.03em",
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
          style={{ fontSize: "clamp(10px,2.4vw,12px)" }}
        >
          <span className="live-dot" />
          <SocialIcon name="github" size={12} /> @{profile.social.githubUser} ↗
        </a>
      </motion.div>

      {/* Stat strip — 2-up on phones, one 4-up band from sm */}
      <motion.ul
        variants={fadeUp}
        className="grid grid-cols-2 sm:grid-cols-4 lg:max-w-[min(760px,60%)] gap-x-[clamp(12px,1.6vw,28px)] gap-y-[clamp(8px,1.2svh,14px)]"
      >
        {stats.map((s) => (
          <li
            key={s.k}
            className="min-w-0 pt-1.5 compact:pt-1"
            style={{ borderTop: "1px solid rgba(35,21,16,0.22)" }}
          >
            <p
              className="t-mono-xs truncate"
              style={{
                opacity: 0.65,
                fontSize: "clamp(10px,2.2vw,11px)",
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

      {/* Body: skills | repos — stacks on phones, 2-col from md */}
      <div className="grid gap-x-[clamp(18px,3vw,56px)] gap-y-[clamp(16px,2.4svh,26px)] md:grid-cols-[1.35fr_1fr] lg:flex-1">
        {/* Skills — chip groups */}
        <motion.div variants={fadeUp} className="flex flex-col min-w-0 gap-2">
          <div className="flex items-baseline justify-between">
            <p
              className="t-mono opacity-75"
              style={{ fontSize: "clamp(11px,2.6vw,12px)", letterSpacing: "0.08em" }}
            >
              skills
            </p>
            <p
              className="t-mono-xs opacity-55"
              style={{ fontSize: "clamp(10px,2.2vw,12px)" }}
            >
              {groups.reduce((n, g) => n + g.items.length, 0)} total
            </p>
          </div>
          <div className="flex flex-col gap-[clamp(8px,1.2svh,14px)] min-w-0">
            {groups.map((g) => (
              <div
                key={g.key}
                className="min-w-0 pt-1.5"
                style={{ borderTop: "1px solid rgba(35,21,16,0.18)" }}
              >
                <div className="flex items-baseline justify-between mb-0.5">
                  <p
                    className="t-mono opacity-85"
                    style={{
                      fontSize: "clamp(10px,2.4vw,12px)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    <span style={{ opacity: 0.55 }}>$ </span>
                    {g.key.toLowerCase()}
                  </p>
                  <p
                    className="t-mono-xs opacity-50"
                    style={{ fontSize: "clamp(10px,2.2vw,12px)" }}
                  >
                    {String(g.items.length).padStart(2, "0")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {g.items.map((it) => (
                    <SkillChip key={it}>{it}</SkillChip>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Repos — live list */}
        <motion.div variants={fadeUp} className="flex flex-col min-w-0 gap-2">
          <div className="flex items-baseline justify-between">
            <p
              className="t-mono opacity-75 inline-flex items-center gap-1.5"
              style={{ fontSize: "clamp(11px,2.6vw,12px)", letterSpacing: "0.08em" }}
            >
              <span className="live-dot" /> repos · live
            </p>
            <p
              className="t-mono-xs opacity-55"
              style={{ fontSize: "clamp(10px,2.2vw,12px)" }}
            >
              {Math.min(liveRepos.length, repoCount)} of {repoCount}
            </p>
          </div>
          <ul
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-x-[clamp(10px,2vw,18px)] pt-1.5"
            style={{ borderTop: "1px solid rgba(35,21,16,0.18)" }}
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
                    style={{ fontSize: "clamp(10px,2.2vw,12px)" }}
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
        style={{ borderTop: "1px solid rgba(35,21,16,0.22)" }}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <p
            className="t-mono opacity-70 inline-flex items-center gap-1.5"
            style={{ fontSize: "clamp(10px,2.4vw,12px)" }}
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
            style={{ fontSize: "clamp(10px,2.2vw,12px)" }}
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
                  style={{ fontSize: "clamp(10px,2.2vw,12px)" }}
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
