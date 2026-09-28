"use client";

import { motion, useReducedMotion } from "framer-motion";
import { experiences, profile } from "@/data/profile";
import type { GithubData } from "@/lib/github";
import { ease, CONTENT_BASE_DELAY } from "../constants";
import { SplitText } from "../split-text";
import { fadeUp, stagger } from "../animations";
import { SocialIcon } from "../social-icon";
import { Counter } from "../stat";
import { computeExperienceYears, parseMonthYear } from "./analytics-card";

/* Headline from `profile.headline` — first sentence is the poster line, split
   at its comma for the two-tone stack; the second sentence is the caption. */
const [HEAD_LEAD = "", HEAD_TAIL = ""] = profile.headline.split(/(?<=\.)\s+/);
const [HEAD_A, HEAD_B] = HEAD_LEAD.split(/(?<=,)\s+/);

const RULE = "1px solid rgba(35,21,16,0.2)";

/* ── Career timeline ──────────────────────────────────────────────────────
   One row per role on a shared time axis — the overlaps (a contract running
   alongside the full-time role) are the story a plain list can't tell.
   Everything is derived from `experiences`, so it can't drift from the
   expanded card. */
/* Whole months, not ms: the bar widths are SSR'd, and a ms clock (or the
   server's UTC vs the visitor's local midnight) would differ at hydration.
   `now` is the end of the current UTC month — same on server and client. */
const monthIndex = (str: string) => {
  const t = parseMonthYear(str);
  if (t === null) return null;
  const d = new Date(t);
  return d.getFullYear() * 12 + d.getMonth();
};
const today = new Date();
const NOW = today.getUTCFullYear() * 12 + today.getUTCMonth() + 1;
const CAREER = experiences
  .map((e) => {
    const [from, to = ""] = e.period.split(/\s*[-–]\s*/);
    const start = monthIndex(from);
    const live = /present/i.test(to);
    // +1: through the end of the closing month, so a short stint still draws
    const end = live ? NOW : (monthIndex(to) ?? start ?? NOW) + 1;
    return start === null ? null : { ...e, start, end, live };
  })
  .filter((e) => e !== null)
  .sort((a, b) => a.start - b.start);
const T0 = Math.min(...CAREER.map((e) => e.start));
const SPAN = Math.max(1, NOW - T0);
const pct = (m: number) => ((m - T0) / SPAN) * 100;
const YEAR_TICKS = Array.from(
  { length: Math.floor((NOW - 1) / 12) - Math.floor(T0 / 12) },
  (_, i) => Math.floor(T0 / 12) + i + 1,
);

function CareerTimeline({ size = "clamp(10px,0.8vw,12.5px)" }: { size?: string }) {
  const reduce = useReducedMotion();
  return (
    <div
      className="grid min-w-0 items-center gap-x-[clamp(8px,1vw,14px)] gap-y-[clamp(4px,0.7svh,8px)]"
      style={{ gridTemplateColumns: "minmax(0, 36%) minmax(0, 1fr)" }}
      role="img"
      aria-label={`Career: ${CAREER.map((e) => `${e.company}, ${e.period}`).join("; ")}`}
    >
      {/* Year ticks — own row, same columns as the bars below */}
      <span />
      <div className="relative h-3.5">
        {YEAR_TICKS.map((y) => (
          <span
            key={y}
            className="t-mono-xs absolute top-0 -translate-x-1/2"
            style={{ left: `${pct(y * 12)}%`, opacity: 0.5, fontSize: 10 }}
          >
            &apos;{String(y).slice(2)}
          </span>
        ))}
      </div>

      {CAREER.map((e, i) => (
        // `title` on the cells, not the wrapper: a display:contents box has no
        // hit area, so a tooltip there never shows.
        <div key={e.company} className="contents">
          <p
            title={`${e.role} · ${e.period}`}
            className={`t-display-med truncate transition-opacity duration-500 ${
              e.live ? "opacity-95" : "opacity-60 group-hover:opacity-90"
            }`}
            style={{ fontSize: size, lineHeight: 1.2 }}
          >
            {e.company.split(" · ")[0]}
          </p>
          <div className="relative h-2 min-w-0" title={`${e.role} · ${e.period}`}>
            {/* Year gridlines behind the bar */}
            {YEAR_TICKS.map((y) => (
              <span
                key={y}
                className="absolute -top-1 -bottom-1 w-px"
                style={{ left: `${pct(y * 12)}%`, background: "rgba(35,21,16,0.14)" }}
              />
            ))}
            {/* Hovering the tile inks the past roles in, one after another —
                colour only, so it can't fight framer's scaleX entrance. */}
            <motion.span
              className={`absolute inset-y-0 origin-left rounded-full transition-colors duration-500 ${
                e.live ? "bg-(--orange)" : "bg-[rgba(35,21,16,0.38)] group-hover:bg-(--orange-deep)"
              }`}
              style={{
                left: `${pct(e.start)}%`,
                width: `${Math.max(1.5, pct(e.end) - pct(e.start))}%`,
                transitionDelay: `${i * 70}ms`,
              }}
              initial={reduce ? false : { scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, ease, delay: CONTENT_BASE_DELAY + 0.8 + i * 0.1 }}
            />
            {e.live && (
              <span
                className="live-dot absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                style={{ left: "100%", color: "var(--orange)" }}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* Outlined years numeral — a caption to the headline, not a second hero stat */
function YearsStamp({ size }: { size: string }) {
  return (
    <div className="flex items-end gap-1.5 shrink-0">
      <p
        className="t-retro"
        style={{
          fontSize: size,
          color: "transparent",
          WebkitTextStroke: "1.5px var(--orange)",
          lineHeight: 0.8,
        }}
      >
        <Counter to={computeExperienceYears()} startDelay={CONTENT_BASE_DELAY + 0.7} />+
      </p>
      <p
        className="t-mono-xs pb-1"
        style={{ opacity: 0.6, fontSize: "clamp(10px,0.68vw,11px)", lineHeight: 1.3 }}
      >
        yrs
        <br />
        shipping
      </p>
    </div>
  );
}

export function BioCollapsed() {
  const reduce = useReducedMotion();
  const label = { opacity: 0.7, fontSize: "clamp(10px,0.78vw,12px)" };

  const header = (
    <div className="flex items-baseline justify-between gap-2 min-w-0">
      <p className="t-mono-xs" style={label}>
        dev bio
      </p>
      <p className="t-mono-xs truncate" style={{ ...label, opacity: 0.55 }}>
        {profile.role} · {profile.location.split(",")[0]}
      </p>
    </div>
  );

  const headline = (fontSize: string, serifSize: string) => (
    // split-inline: SplitText stacks each word as a block by default
    <h1 className="t-display split-inline flex-1 min-w-0" style={{ fontSize, lineHeight: 0.95 }}>
      <SplitText delay={CONTENT_BASE_DELAY + 0.2}>{HEAD_A}</SplitText>
      <br />
      <SplitText
        className="t-serif"
        style={{ color: "var(--orange)", fontWeight: 400, fontSize: serifSize }}
        delay={CONTENT_BASE_DELAY + 0.4}
      >
        {HEAD_B}
      </SplitText>
    </h1>
  );

  const timeline = (size?: string) => (
    <motion.div
      className="min-w-0"
      style={{ borderTop: RULE, paddingTop: "clamp(8px,1.2svh,14px)" }}
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease, delay: CONTENT_BASE_DELAY + 0.7 }}
    >
      <div className="flex items-baseline justify-between mb-1.5">
        <p className="t-mono-xs" style={{ ...label, opacity: 0.6 }}>
          career
        </p>
        <p className="t-mono-xs" style={{ ...label, opacity: 0.5 }}>
          {String(CAREER.length).padStart(2, "0")} roles
        </p>
      </div>
      <CareerTimeline size={size} />
    </motion.div>
  );

  return (
    <>
      {/* Desktop / lg+ — headline + years stamp over a career timeline.
          Indented past the portrait tile's foreground, which bleeds ~30px
          over this card's left edge for its full height. */}
      <div className="hidden lg:flex flex-col w-full h-full gap-[clamp(8px,1.2svh,16px)] pl-[clamp(12px,1.4vw,22px)]">
        {header}
        <div className="flex-1 min-h-0 flex flex-col justify-center gap-[clamp(6px,1svh,12px)]">
          <div className="flex items-end justify-between gap-4 min-w-0">
            {/* cqw caps: the stamp shares this row, so a vw clamp alone
                wraps "backends," mid-line on narrow desktops. */}
            {headline("min(clamp(24px,2.9vw,48px), 6.4cqw)", "1.05em")}
            <YearsStamp size="min(clamp(34px,4vw,62px), 10cqw)" />
          </div>
          <motion.p
            className="t-body compact:hidden"
            style={{ fontSize: "clamp(11px,0.9vw,14px)", lineHeight: 1.5 }}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 0.75, y: 0 }}
            transition={{ duration: 0.6, ease, delay: CONTENT_BASE_DELAY + 0.6 }}
          >
            {HEAD_TAIL}
          </motion.p>
        </div>
        {timeline()}
      </div>

      {/* Mobile — same pieces, tighter */}
      <div className="flex lg:hidden flex-col w-full h-full justify-between gap-3 px-3 py-3">
        {header}
        <div className="flex items-end justify-between gap-3 min-w-0">
          {headline("min(clamp(18px,3.4vw,38px), 6.2cqw)", "1.05em")}
          <YearsStamp size="min(clamp(34px,9vw,64px), 14cqw)" />
        </div>
        {timeline("clamp(10px,2.4vw,13px)")}
      </div>
    </>
  );
}

/* Reusable contact icon row — used in Bio collapsed + expanded */
export const contactIcons = [
  { name: "github", label: "github", href: profile.social.githubUrl, ext: true },
  { name: "linkedin", label: "linkedin", href: profile.social.linkedinUrl, ext: true },
  { name: "mail", label: "email", href: `mailto:${profile.email}`, ext: false },
  { name: "phone", label: "phone", href: `tel:${profile.phone}`, ext: false },
  { name: "resume", label: "resume", href: profile.resumeUrl, ext: false },
];

export function contactValue(name: string) {
  switch (name) {
    case "github": return `@${profile.social.githubUser}`;
    case "linkedin": return `in/${profile.social.linkedinHandle}`;
    case "mail": return profile.email;
    case "phone": return profile.phone;
    case "resume": return "download pdf";
    default: return "";
  }
}

export function ContactIconRow({ size = 18 }: { size?: number }) {
  return (
    <ul className="flex items-center gap-1.5">
      {contactIcons.map((c) => (
        <li key={c.name}>
          <a
            href={c.href}
            target={c.ext ? "_blank" : undefined}
            rel={c.ext ? "noreferrer" : undefined}
            aria-label={c.label}
            title={c.label}
            className="inline-flex items-center justify-center transition-all hover:-translate-y-0.5 hover:scale-110"
            style={{
              width: size + 14,
              height: size + 14,
              borderRadius: "999px",
              border: "1px solid rgba(35,21,16,0.3)",
            }}
          >
            <SocialIcon name={c.name} size={size} />
          </a>
        </li>
      ))}
    </ul>
  );
}

/* Small mono section label — "experience · 04" style. The count is data, not
   decoration: it tells you the list is complete before you read it. */
function SectionLabel({
  text,
  right,
}: {
  text: string;
  right?: string;
}) {
  return (
    <div className="flex items-baseline justify-between mb-2">
      <p
        className="t-mono opacity-70"
        style={{ fontSize: "clamp(10px,2.6vw,12px)" }}
      >
        <span style={{ opacity: 0.55 }}>$ </span>
        {text}
      </p>
      {right && (
        <p
          className="t-mono-xs opacity-60"
          style={{ fontSize: "clamp(10px,2.2vw,12px)" }}
        >
          {right}
        </p>
      )}
    </div>
  );
}

export function BioExpanded({ github }: { github: GithubData }) {
  const experienceYears = computeExperienceYears();

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="flex flex-col h-full overflow-y-auto scrollbar-styled-ink lg:grid lg:grid-cols-[1.15fr_1fr]"
      style={{ gap: "clamp(16px,2.2vw,44px)" }}
    >
      {/* ── Left — identity ─────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col gap-[clamp(10px,1.4svh,18px)] min-w-0 lg:justify-between"
      >
        <div className="flex flex-col gap-[clamp(8px,1.1svh,16px)] min-w-0">
          <p
            className="t-mono-xs"
            style={{ opacity: 0.65, fontSize: "clamp(10px,2.6vw,12px)" }}
          >
            dev bio · dossier
          </p>

          {/* Masthead — headline left, outlined stat right, mirroring the tile */}
          <div className="flex items-start justify-between gap-4 min-w-0">
            <h2
              className="t-display min-w-0"
              style={{ fontSize: "clamp(26px,5vw,66px)", lineHeight: 0.92 }}
            >
              <SplitText delay={0.1}>Software</SplitText>
              <SplitText delay={0.28}>developer.</SplitText>
            </h2>
            <div className="flex items-end gap-2 shrink-0 pt-1">
              <p
                className="t-retro"
                style={{
                  fontSize: "clamp(40px,5vw,92px)",
                  color: "transparent",
                  WebkitTextStroke: "clamp(1.3px,0.13vw,2px) var(--orange)",
                  lineHeight: 0.8,
                }}
              >
                <Counter to={experienceYears} />+
              </p>
              <p
                className="t-mono-xs pb-1"
                style={{ opacity: 0.6, fontSize: "clamp(10px,2vw,11px)", lineHeight: 1.3 }}
              >
                yrs
                <br />
                shipping
              </p>
            </div>
          </div>

          <p
            className="t-serif"
            style={{
              color: "var(--orange)",
              fontSize: "clamp(18px,2.6vw,38px)",
              lineHeight: 1.02,
            }}
          >
            Patient backends, honest interfaces.
          </p>

          <p
            className="max-w-prose"
            style={{
              opacity: 0.88,
              fontFamily: "var(--font-grift), system-ui, sans-serif",
              fontSize: "clamp(13px,3.2vw,17px)",
              lineHeight: 1.6,
              borderTop: RULE,
              paddingTop: "clamp(8px,1.1svh,14px)",
            }}
          >
            {profile.summary}
          </p>

          <div className="flex flex-col gap-1 min-w-0" style={{ marginTop: "clamp(4px,0.6svh,10px)" }}>
            <SectionLabel
              text="i can build"
              right={`${String(profile.capabilities.length).padStart(2, "0")} kinds`}
            />
            <ul
              className="grid min-w-0 gap-x-[clamp(12px,1.8vw,28px)]"
              style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
            >
              {profile.capabilities.map((item, i) => (
                <li
                  key={item}
                  className="flex items-baseline gap-[clamp(6px,1vw,12px)] min-w-0"
                  style={{ borderTop: RULE, paddingBlock: "clamp(3px,0.5svh,7px)" }}
                >
                  <span
                    className="t-code shrink-0"
                    style={{ color: "var(--orange-deep)", opacity: 0.65, fontSize: "clamp(10px,0.66vw,11px)" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="t-display-med min-w-0"
                    style={{
                      fontSize: "clamp(11px,1.3vw,15px)",
                      lineHeight: 1.1,
                      overflowWrap: "break-word",
                    }}
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p
          className="max-w-prose compact:hidden"
          style={{
            opacity: 0.8,
            fontFamily: "var(--font-grift), system-ui, sans-serif",
            fontSize: "clamp(11px,2.4vw,14px)",
            lineHeight: 1.45,
          }}
        >
          <span
            className="t-mono-xs"
            style={{ color: "var(--orange)", opacity: 0.85, marginRight: "0.5em" }}
          >
            psst —
          </span>
          secretly a vibe coder too. cursor and claude code in the loop, so things ship faster without the patience tax.
        </p>
      </motion.div>

      {/* ── Right — record ──────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col gap-[clamp(12px,1.8svh,26px)] min-w-0 lg:justify-between"
      >
        <div className="min-w-0">
          <SectionLabel
            text="experience"
            right={String(experiences.length).padStart(2, "0")}
          />
          <ul className="flex flex-col">
            {experiences.map((e) => (
              <li
                key={e.company}
                className="min-w-0"
                style={{ borderTop: RULE, paddingBlock: "clamp(5px,0.8svh,9px)" }}
              >
                <div className="flex items-baseline justify-between gap-3 min-w-0">
                  <p
                    className="t-display-med min-w-0"
                    style={{ fontSize: "clamp(13px,3.4vw,17px)", lineHeight: 1.15 }}
                  >
                    {e.role}
                  </p>
                  <p
                    className="t-mono-xs opacity-60 shrink-0"
                    style={{ fontSize: "clamp(10px,2.2vw,12px)" }}
                  >
                    {e.period}
                  </p>
                </div>
                <p
                  style={{
                    color: "rgba(35,21,16,0.62)",
                    fontFamily: "var(--font-grift), system-ui, sans-serif",
                    lineHeight: 1.3,
                    fontSize: "clamp(11px,2.8vw,14px)",
                    overflowWrap: "break-word",
                  }}
                >
                  @ {e.company} · {e.location}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-0">
          <SectionLabel
            text="education"
            right={String(profile.education.length).padStart(2, "0")}
          />
          <ul className="flex flex-col">
            {profile.education.map((e) => (
              <li
                key={`${e.institution}-${e.degree}`}
                className="min-w-0"
                style={{ borderTop: RULE, paddingBlock: "clamp(5px,0.8svh,9px)" }}
              >
                <div className="flex items-baseline justify-between gap-3 min-w-0">
                  <p
                    className="t-display-med min-w-0"
                    style={{ fontSize: "clamp(12px,3.2vw,15px)", lineHeight: 1.15 }}
                  >
                    {e.degree}
                  </p>
                  {e.period && (
                    <p
                      className="t-mono-xs opacity-60 shrink-0"
                      style={{ fontSize: "clamp(10px,2.2vw,12px)" }}
                    >
                      {e.period}
                    </p>
                  )}
                </div>
                <p
                  style={{
                    color: "rgba(35,21,16,0.62)",
                    fontFamily: "var(--font-grift), system-ui, sans-serif",
                    lineHeight: 1.3,
                    fontSize: "clamp(11px,2.8vw,14px)",
                    overflowWrap: "break-word",
                  }}
                >
                  @ {e.institution}
                  {e.location ? ` · ${e.location}` : ""}
                  {e.grade ? ` · ${e.grade}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-0">
          <SectionLabel
            text="reach me"
            right={github.user ? `${github.user.followers} followers` : "online"}
          />
          <ul className="flex flex-col">
            {contactIcons.map((c) => (
              <li key={c.name} style={{ borderTop: RULE }}>
                <a
                  href={c.href}
                  target={c.ext ? "_blank" : undefined}
                  rel={c.ext ? "noreferrer" : undefined}
                  className="flex items-center justify-between gap-3 min-w-0 group"
                  style={{ paddingBlock: "clamp(5px,0.7svh,8px)" }}
                >
                  <span className="inline-flex items-center gap-2 min-w-0 shrink-0">
                    <span style={{ color: "var(--orange)" }}>
                      <SocialIcon name={c.name} size={15} />
                    </span>
                    <span
                      className="t-mono opacity-75"
                      style={{ fontSize: "clamp(10px,2.6vw,12px)" }}
                    >
                      {c.label}
                    </span>
                  </span>
                  <span
                    className="t-display-med truncate link-line text-right"
                    style={{ fontSize: "clamp(11px,2.8vw,16px)" }}
                  >
                    {contactValue(c.name)}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </motion.div>
  );
}
