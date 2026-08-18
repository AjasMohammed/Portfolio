"use client";

import { motion, useReducedMotion } from "framer-motion";
import { experiences, profile } from "@/data/profile";
import type { GithubData } from "@/lib/github";
import { ease, CONTENT_BASE_DELAY } from "../constants";
import { SplitText } from "../split-text";
import { fadeUp, stagger } from "../animations";
import { SocialIcon } from "../social-icon";
import { Counter } from "../stat";
import { computeExperienceYears } from "./analytics-card";

/* ── Dossier facts ────────────────────────────────────────────────────────
   The collapsed tile is an ID card, not an essay: four scannable rows, all
   derived from `profile`/`experiences` so nothing here can drift from the
   expanded card. Short framework names only — the dossier column is ~240px
   and "Django REST Framework" alone overruns it. */
const CURRENT_ROLE =
  experiences.find((e) => /present/i.test(e.period)) ?? experiences[0];
const STACK = profile.skills.frameworks.filter((f) => f.length <= 8).slice(0, 2);
const SINCE = CURRENT_ROLE.period.split(/\s*[-–]\s*/)[0];

const SPECS = [
  { k: "now", v: CURRENT_ROLE.company },
  { k: "stack", v: STACK.join(" · ") },
  { k: "since", v: SINCE },
  { k: "base", v: profile.location },
];

/* Lead sentence only. The full summary lives in the expanded card — a tile
   that gets truncated mid-word reads as a bug, not as a teaser. */
const SUMMARY_LEAD = profile.summary.split(/(?<=\.)\s+/)[0];

const RULE = "1px solid rgba(192,68,15,0.2)";

function SpecList({ size = "clamp(10px,0.82vw,12.5px)" }: { size?: string }) {
  return (
    <dl className="grid min-w-0" style={{ gridTemplateColumns: "auto 1fr" }}>
      {SPECS.map((row) => (
        <div key={row.k} className="contents">
          <dt
            className="t-mono-xs"
            style={{
              opacity: 0.5,
              borderTop: RULE,
              paddingBlock: "clamp(3px,0.5svh,6px)",
              paddingRight: "clamp(8px,1vw,14px)",
              fontSize: "clamp(9px,0.68vw,11px)",
            }}
          >
            {row.k}
          </dt>
          <dd
            className="t-display-med min-w-0 text-right"
            style={{
              borderTop: RULE,
              paddingBlock: "clamp(3px,0.5svh,6px)",
              fontSize: size,
              lineHeight: 1.25,
              opacity: 0.92,
              overflowWrap: "anywhere",
            }}
          >
            {row.v}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* ── Watermark ────────────────────────────────────────────────────────────
   This tile is a data page — four fields, a stamp of years, a name set in
   display type — so it carries what a data page carries: a guilloché seal.
   Engine-turned rosettes are rings of overlapping circles struck by a
   geometric lathe, and that's exactly how these are built: two plates of
   circles, generated from the geometry rather than shipped as art, so there
   is no image request and it stays crisp at any tile size.
   At rest it's a watermark. Hover counter-rotates the plates and inks them
   in, and the moiré where they cross slides as they turn — the document
   authenticating under the cursor, the same "hovering pays you back" idea
   the works tile's window cascade runs on.
   Desktop only: the phone tile is one column of text with nothing behind. */
const PLATES = [
  // `radius` under `orbit` on purpose: the circles trace a band and leave the
  // middle open, so the spec rows sitting over the seal's centre stay clean.
  // Two plates of the same geometry with different counts — that mismatch is
  // what makes the moiré, and what makes it crawl when they counter-rotate.
  { n: 34, radius: 36, orbit: 64, w: 0.45, o: 0.055, oh: 0.15, spin: "13deg" },
  { n: 25, radius: 36, orbit: 64, w: 0.45, o: 0.045, oh: 0.12, spin: "-19deg" },
];

/* The engraved edge — what tells you it's a seal and not a doily. */
const TICKS = Array.from({ length: 24 }, (_, i) => i * 15);

function BioSeal() {
  return (
    <div
      aria-hidden
      className="hidden lg:block absolute -z-10 pointer-events-none"
      style={{
        // Struck into the bottom-right corner and running off both edges, the
        // way a seal is stamped at the foot of a document — the dossier's own
        // rows keep the middle of the tile, which is theirs.
        bottom: "-26%",
        right: "-13%",
        width: "clamp(180px, 52%, 300px)",
        aspectRatio: "1",
        // Feathered so the plates dissolve instead of ending on a hard arc.
        maskImage:
          "radial-gradient(closest-side, #000 64%, rgba(0,0,0,0.45) 86%, transparent 100%)",
        WebkitMaskImage:
          "radial-gradient(closest-side, #000 64%, rgba(0,0,0,0.45) 86%, transparent 100%)",
      }}
    >
      <svg
        className="h-full w-full"
        viewBox="-120 -120 240 240"
        fill="none"
        stroke="var(--orange)"
      >
        <g
          className="bio-ring"
          style={{
            ["--o" as string]: 0.07,
            ["--oh" as string]: 0.17,
            ["--spin" as string]: "-8deg",
            ["--d" as string]: "0.02s",
          }}
        >
          <circle r="112" strokeWidth="0.6" />
          <circle r="106" strokeWidth="0.35" />
          {TICKS.map((deg) => (
            <line
              key={deg}
              x1="106"
              y1="0"
              x2="112"
              y2="0"
              strokeWidth="0.7"
              transform={`rotate(${deg})`}
            />
          ))}
        </g>

        {PLATES.map((plate, i) => (
          <g
            key={plate.n}
            className="bio-ring"
            style={{
              ["--o" as string]: plate.o,
              ["--oh" as string]: plate.oh,
              ["--spin" as string]: plate.spin,
              ["--d" as string]: `${0.06 + i * 0.06}s`,
            }}
          >
            {Array.from({ length: plate.n }, (_, k) => {
              const a = ((k / plate.n) * Math.PI * 2).toFixed(4);
              return (
                <circle
                  key={k}
                  cx={(plate.orbit * Math.cos(+a)).toFixed(1)}
                  cy={(plate.orbit * Math.sin(+a)).toFixed(1)}
                  r={plate.radius}
                  strokeWidth={plate.w}
                />
              );
            })}
          </g>
        ))}
      </svg>
    </div>
  );
}

export function BioCollapsed() {
  const experienceYears = computeExperienceYears();
  const reduce = useReducedMotion();

  return (
    <>
      <BioSeal />

      {/* Desktop / lg+ — dossier: headline left, spec column right.
          Everything on the left is indented past the portrait tile's foreground,
          which bleeds ~30px over this card's left edge for its full height. */}
      <div className="hidden lg:flex flex-col w-full h-full gap-[clamp(6px,0.9svh,12px)] origin-left transition-transform duration-500 ease-out group-hover:scale-[0.94]">
        <div className="flex items-baseline justify-between gap-2 min-w-0 pl-[clamp(12px,1.4vw,22px)]">
          <p
            className="t-mono-xs"
            style={{ opacity: 0.7, fontSize: "clamp(10px,0.78vw,13px)", letterSpacing: "0.18em" }}
          >
            dev bio
          </p>
          <p
            className="t-mono-xs shrink-0"
            style={{ opacity: 0.55, fontSize: "clamp(10px,0.78vw,13px)", letterSpacing: "0.18em" }}
          >
            python
          </p>
        </div>

        <div className="flex-1 min-h-0 flex items-stretch gap-[clamp(12px,1.4vw,22px)]">
          {/* Headline */}
          <div className="flex-1 min-w-0 flex flex-col justify-center pl-[clamp(12px,1.4vw,22px)]">
            <h1
              className="t-display"
              style={{
                // cqw cap: the headline column is a little over half the card,
                // so a vw clamp alone breaks "developer." across two lines.
                fontSize: "min(clamp(22px,2.9vw,46px), 7.4cqw)",
                lineHeight: 0.92,
              }}
            >
              <SplitText delay={CONTENT_BASE_DELAY + 0.2}>Software</SplitText>
              <SplitText delay={CONTENT_BASE_DELAY + 0.4}>developer.</SplitText>
            </h1>
            <motion.p
              className="t-serif"
              style={{
                color: "var(--orange)",
                fontSize: "min(clamp(18px,2.2vw,36px), 5.8cqw)",
                paddingTop: "clamp(4px,0.6svh,10px)",
              }}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 0.95, y: 0 }}
              transition={{ duration: 0.7, ease, delay: CONTENT_BASE_DELAY + 0.7 }}
            >
              Quietly built.
            </motion.p>
          </div>

          {/* Spec column — outlined numeral so it reads as a caption to the
              headline, not as a second hero stat competing with the ring card. */}
          <motion.div
            className="shrink-0 flex flex-col justify-center gap-[clamp(8px,1.2svh,16px)] min-w-0"
            style={{
              width: "43%",
              maxWidth: 280,
              borderLeft: RULE,
              paddingLeft: "clamp(10px,1.2vw,18px)",
            }}
            initial={reduce ? false : { opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease, delay: CONTENT_BASE_DELAY + 0.55 }}
          >
            <div className="flex items-end gap-2 min-w-0">
              <p
                className="t-retro"
                style={{
                  fontSize: "min(clamp(34px,4vw,62px), 10cqw)",
                  color: "transparent",
                  WebkitTextStroke: "1.5px var(--orange)",
                  lineHeight: 0.8,
                }}
              >
                <Counter to={experienceYears} startDelay={CONTENT_BASE_DELAY + 0.7} />+
              </p>
              <p
                className="t-mono-xs pb-1"
                style={{ opacity: 0.6, fontSize: "clamp(9px,0.68vw,11px)", lineHeight: 1.3 }}
              >
                yrs
                <br />
                shipping
              </p>
            </div>
            <SpecList />
          </motion.div>
        </div>

        <motion.p
          className="compact:hidden pl-[clamp(12px,1.4vw,22px)]"
          style={{
            // Jost, not the display face: three lines of Fugaz One at the foot
            // of the tile turn into a wall.
            fontFamily: "var(--font-futura), system-ui, sans-serif",
            fontSize: "clamp(11px,0.88vw,14px)",
            lineHeight: 1.6,
            letterSpacing: "0.025em",
            borderTop: RULE,
            paddingTop: "clamp(8px,1svh,12px)",
          }}
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 0.82, y: 0 }}
          transition={{ duration: 0.7, ease, delay: CONTENT_BASE_DELAY + 0.9 }}
        >
          {SUMMARY_LEAD}
        </motion.p>
      </div>

      {/* Mobile — same dossier, stacked: headline over stat over specs */}
      <div className="flex lg:hidden flex-col w-full h-full justify-between gap-3 px-3 py-3">
        <div className="flex items-baseline justify-between gap-2 min-w-0">
          <p className="t-mono-xs" style={{ opacity: 0.7, letterSpacing: "0.18em" }}>
            dev bio
          </p>
          <p className="t-mono-xs shrink-0" style={{ opacity: 0.55, letterSpacing: "0.18em" }}>
            python
          </p>
        </div>

        <div className="flex items-end justify-between gap-3 min-w-0">
          <h1
            className="t-display min-w-0"
            style={{
              // cqw cap: the stat shares this row, so a vw clamp alone wraps
              // "developer." mid-word on tablet widths. 6.4cqw (not 7.4) keeps
              // it intact down to 320px-wide phones.
              fontSize: "min(clamp(16px,3.4vw,38px), 6.4cqw)",
              lineHeight: 0.95,
            }}
          >
            <SplitText delay={CONTENT_BASE_DELAY + 0.2}>Software</SplitText>
            <SplitText delay={CONTENT_BASE_DELAY + 0.4}>developer.</SplitText>
          </h1>
          <motion.div
            className="flex items-end gap-1.5 shrink-0"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: CONTENT_BASE_DELAY + 0.55 }}
          >
            <p
              className="t-retro"
              style={{
                fontSize: "min(clamp(34px,9vw,64px), 16cqw)",
                color: "transparent",
                WebkitTextStroke: "1.5px var(--orange)",
                lineHeight: 0.8,
              }}
            >
              <Counter to={experienceYears} startDelay={CONTENT_BASE_DELAY + 0.7} />+
            </p>
            <p
              className="t-mono-xs pb-1"
              style={{ opacity: 0.6, fontSize: "clamp(9px,1.6vw,11px)", lineHeight: 1.3 }}
            >
              yrs
              <br />
              shipping
            </p>
          </motion.div>
        </div>

        <motion.p
          className="t-serif"
          style={{ color: "var(--orange)", fontSize: "clamp(16px,4vw,26px)" }}
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 0.95 }}
          transition={{ duration: 0.6, ease, delay: CONTENT_BASE_DELAY + 0.7 }}
        >
          Quietly built.
        </motion.p>

        <motion.div
          className="min-w-0"
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: CONTENT_BASE_DELAY + 0.9 }}
        >
          <SpecList size="clamp(10px,2.4vw,14px)" />
        </motion.div>
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
              border: "1px solid rgba(192,68,15,0.3)",
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
        style={{ fontSize: "clamp(10px,2.6vw,14px)" }}
      >
        <span style={{ opacity: 0.55 }}>$ </span>
        {text}
      </p>
      {right && (
        <p
          className="t-mono-xs opacity-60"
          style={{ fontSize: "clamp(9px,2.2vw,12px)" }}
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
            style={{ opacity: 0.65, fontSize: "clamp(10px,2.6vw,13px)", letterSpacing: "0.22em" }}
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
                style={{ opacity: 0.6, fontSize: "clamp(9px,2vw,11px)", lineHeight: 1.3 }}
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
              fontFamily: "var(--font-futura), system-ui, sans-serif",
              fontSize: "clamp(13px,3.2vw,17px)",
              lineHeight: 1.6,
              letterSpacing: "0.03em",
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
                    style={{ color: "var(--orange)", opacity: 0.65, fontSize: "clamp(9px,0.66vw,11px)" }}
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
            fontFamily: "var(--font-futura), system-ui, sans-serif",
            fontSize: "clamp(11px,2.4vw,14px)",
            lineHeight: 1.45,
            letterSpacing: "0.025em",
          }}
        >
          <span
            className="t-mono-xs"
            style={{ color: "var(--orange)", opacity: 0.85, marginRight: "0.5em", letterSpacing: "0.18em" }}
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
                    style={{ fontSize: "clamp(9px,2.2vw,12px)" }}
                  >
                    {e.period}
                  </p>
                </div>
                <p
                  style={{
                    color: "var(--orange)",
                    fontFamily: "var(--font-futura), system-ui, sans-serif",
                    letterSpacing: "0.04em",
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
                      style={{ fontSize: "clamp(9px,2.2vw,12px)" }}
                    >
                      {e.period}
                    </p>
                  )}
                </div>
                <p
                  style={{
                    color: "var(--orange)",
                    fontFamily: "var(--font-futura), system-ui, sans-serif",
                    letterSpacing: "0.04em",
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
                      style={{ fontSize: "clamp(10px,2.6vw,14px)" }}
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
