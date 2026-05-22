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

export function BioCollapsed({ github: _github }: { github: GithubData }) {
  const experienceYears = computeExperienceYears();
  const reduce = useReducedMotion();

  return (
    <>
      {/* Desktop / lg+ — full editorial layout */}
      <div className="hidden lg:flex flex-col w-full h-full gap-3 origin-left transition-transform duration-500 ease-out group-hover:scale-[0.94]">
        <div className="flex items-baseline justify-between gap-2 min-w-0">
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
        <div className="flex-1 flex flex-col justify-center min-h-0 gap-3" style={{ paddingTop: "clamp(10px,1.4svh,20px)" }}>
          <div className="flex items-end gap-3 min-w-0 flex-wrap">
            <motion.div
              className="flex items-end gap-2 shrink-0"
              initial={reduce ? false : { opacity: 0, y: 24, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.85, ease, delay: CONTENT_BASE_DELAY + 0.15 }}
            >
              <p
                className="t-retro"
                style={{
                  fontSize: "clamp(78px,8.6vw,180px)",
                  color: "var(--orange)",
                  lineHeight: 0.82,
                  textShadow:
                    "4px 4px 0 rgba(192,68,15,0.22), 8px 8px 0 rgba(192,68,15,0.08)",
                }}
              >
                <Counter to={experienceYears} startDelay={CONTENT_BASE_DELAY + 0.3} />+
              </p>
              <p
                className="t-mono pb-3"
                style={{
                  opacity: 0.7,
                  fontSize: "clamp(12px,1vw,16px)",
                  letterSpacing: "0.08em",
                  lineHeight: 1.15,
                }}
              >
                years
                <br />
                building
              </p>
            </motion.div>
            <h1
              className="t-display min-w-0"
              style={{ fontSize: "clamp(26px, 3.6vw, 58px)", lineHeight: 0.94, letterSpacing: "-0.01em" }}
            >
              <SplitText delay={CONTENT_BASE_DELAY + 0.4}>Software developer.</SplitText>
              <br />
              <SplitText
                className="t-serif"
                style={{ color: "var(--orange)", fontStyle: "italic" }}
                delay={CONTENT_BASE_DELAY + 0.7}
              >
                Quietly built.
              </SplitText>
            </h1>
          </div>
        </div>

        <motion.p
          className="t-body max-w-prose"
          style={{
            fontSize: "clamp(12px, 0.95vw, 16px)",
            lineHeight: 1.5,
            borderTop: "1px solid rgba(244,235,216,0.18)",
            paddingTop: "clamp(8px, 1svh, 12px)",
          }}
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 0.85, y: 0 }}
          transition={{ duration: 0.7, ease, delay: CONTENT_BASE_DELAY + 0.95 }}
        >
          {profile.summary}
        </motion.p>
      </div>

      {/* Mobile — diagonal 2×2 grid: stat top-left, title bottom-right */}
      <div className="flex lg:hidden flex-col w-full h-full justify-center gap-3 px-3 py-3">
        <div className="grid grid-cols-2 grid-rows-2 gap-2 flex-1 min-h-0">
          {/* Row 1 / Col 1 — stat, top-left aligned */}
          <motion.div
            className="flex items-start justify-start gap-2"
            initial={reduce ? false : { opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.75, ease, delay: CONTENT_BASE_DELAY + 0.15 }}
          >
            <p
              className="t-retro"
              style={{
                fontSize: "clamp(44px, 10vw, 130px)",
                color: "var(--orange)",
                lineHeight: 0.82,
                textShadow:
                  "3px 3px 0 rgba(192,68,15,0.22), 6px 6px 0 rgba(192,68,15,0.08)",
              }}
            >
              <Counter to={experienceYears} startDelay={CONTENT_BASE_DELAY + 0.3} />+
            </p>
            <p
              className="t-mono pt-2"
              style={{
                opacity: 0.7,
                fontSize: "clamp(10px, 1.4vw, 16px)",
                letterSpacing: "0.08em",
                lineHeight: 1.15,
              }}
            >
              years
              <br />
              building
            </p>
          </motion.div>

          {/* Row 1 / Col 2 — intentionally empty (gives the diagonal breathing room) */}
          <div aria-hidden />

          {/* Row 2 / Col 1 — intentionally empty */}
          <div aria-hidden />

          {/* Row 2 / Col 2 — role title, bottom-right aligned */}
          <div className="flex flex-col items-end justify-end text-right min-w-0">
            <h1
              className="t-display"
              style={{
                fontSize: "clamp(20px, 3.4vw, 38px)",
                lineHeight: 0.95,
                letterSpacing: "-0.015em",
              }}
            >
              <SplitText delay={CONTENT_BASE_DELAY + 0.4}>Software</SplitText>
              <SplitText delay={CONTENT_BASE_DELAY + 0.55}>developer.</SplitText>
            </h1>
            <motion.p
              className="t-serif mt-1"
              style={{
                color: "var(--orange)",
                fontSize: "clamp(11px, 2vw, 22px)",
                lineHeight: 1.15,
                fontStyle: "italic",
              }}
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 0.9 }}
              transition={{ duration: 0.6, ease, delay: CONTENT_BASE_DELAY + 0.85 }}
            >
              Quietly built.
            </motion.p>
          </div>
        </div>

        {/* Key details — highest education + current role */}
        <motion.div
          className="flex flex-col gap-2 min-w-0"
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: CONTENT_BASE_DELAY + 0.85 }}
        >
          <div
            className="min-w-0 pt-1.5"
            style={{ borderTop: "1px solid rgba(192,68,15,0.22)" }}
          >
            <p
              className="t-mono mb-1"
              style={{ opacity: 0.85, fontSize: "clamp(10px,1.2vw,13px)", letterSpacing: "0.08em" }}
            >
              <span style={{ opacity: 0.55 }}>$ </span>
              details
            </p>
            <dl
              className="t-code grid gap-x-[clamp(8px,1.4vw,16px)] gap-y-0.5 min-w-0"
              style={{
                gridTemplateColumns: "auto 1fr",
                fontSize: "clamp(10px,1.05vw,13px)",
                lineHeight: 1.5,
                paddingLeft: "1em",
                letterSpacing: 0,
              }}
            >
              {[
                { k: "Education", v: profile.education[0]?.degree ?? "" },
                { k: "Company", v: experiences[0]?.company ?? "" },
                { k: "Role", v: experiences[0]?.role ?? "" },
                { k: "Location", v: experiences[0]?.location ?? profile.location },
              ].map((row) => (
                <div key={row.k} className="contents">
                  <dt style={{ opacity: 0.55 }}>{row.k}</dt>
                  <dd
                    className="min-w-0"
                    style={{ opacity: 0.9, overflowWrap: "break-word", wordBreak: "break-word" }}
                  >
                    {row.v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
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

export function BioExpanded({ github }: { github: GithubData }) {
  const experienceYears = computeExperienceYears();

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="flex flex-col h-full overflow-y-auto scrollbar-styled-ink lg:grid lg:overflow-hidden lg:grid-cols-[1.2fr_1fr]"
      style={{ gap: "clamp(16px,1.6svh,28px)" }}
    >
      <motion.div
        variants={fadeUp}
        className="flex flex-col gap-4 min-w-0 scrollbar-styled-ink lg:min-h-0 lg:overflow-y-auto lg:overflow-x-hidden lg:justify-between"
      >
        <div className="flex flex-col gap-[clamp(10px,1.2svh,18px)] min-w-0">
          <p
            className="t-mono-xs"
            style={{ opacity: 0.65, fontSize: "clamp(10px,2.6vw,14px)", letterSpacing: "0.22em" }}
          >
            dev bio · since 2024
          </p>
          <div className="flex items-end gap-3 flex-wrap min-w-0">
            <div className="flex items-end gap-2 shrink-0">
              <p
                className="t-retro"
                style={{
                  fontSize: "clamp(64px,14vw,200px)",
                  color: "var(--orange)",
                  lineHeight: 0.82,
                  textShadow:
                    "4px 4px 0 rgba(192,68,15,0.22), 8px 8px 0 rgba(192,68,15,0.08)",
                }}
              >
                <Counter to={experienceYears} />+
              </p>
              <p
                className="t-mono pb-2"
                style={{
                  opacity: 0.75,
                  fontSize: "clamp(11px,2.6vw,17px)",
                  letterSpacing: "0.08em",
                  lineHeight: 1.15,
                }}
              >
                years
                <br />
                building
              </p>
            </div>
            <h2
              className="t-display min-w-0"
              style={{ fontSize: "clamp(22px, 6.5vw, 68px)", lineHeight: 0.92, letterSpacing: "-0.015em" }}
            >
              <SplitText delay={0.15}>Software developer.</SplitText>
              <br />
              <SplitText
                className="t-serif"
                style={{
                  color: "var(--orange)",
                  fontStyle: "italic",
                  fontSize: "clamp(15px, 4.2vw, 56px)",
                }}
                delay={0.4}
              >
                Patient backends,
              </SplitText>
              <br />
              <SplitText
                style={{ fontSize: "clamp(15px, 4.2vw, 56px)" }}
                delay={0.65}
              >
                honest interfaces.
              </SplitText>
            </h2>
          </div>
          <p
            className="t-serif max-w-prose"
            style={{
              opacity: 0.9,
              fontSize: "clamp(13px,3.4vw,20px)",
              lineHeight: 1.55,
              fontStyle: "italic",
              letterSpacing: "0.005em",
              borderLeft: "2px solid rgba(192,68,15,0.32)",
              paddingLeft: "clamp(10px,2.6vw,18px)",
              marginTop: "clamp(6px,0.8svh,12px)",
            }}
          >
            {profile.summary}
          </p>
        </div>
      </motion.div>

      <motion.div
        variants={fadeUp}
        className="flex flex-col gap-3 min-w-0 scrollbar-styled-ink lg:justify-between lg:min-h-0 lg:overflow-y-auto lg:overflow-x-hidden"
      >
        <div>
          <p
            className="t-mono opacity-70 mb-2"
            style={{ fontSize: "clamp(10px,2.6vw,14px)" }}
          >
            experience
          </p>
          <ul className="flex flex-col gap-[clamp(6px,1svh,10px)]">
            {experiences.map((e) => (
              <li key={e.company}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="t-display truncate py-1" style={{ fontSize: "clamp(13px,3.4vw,18px)" }}>
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
                  className="t-serif truncate"
                  style={{ color: "var(--orange)", fontSize: "clamp(11px,2.8vw,15px)" }}
                >
                  @ {e.company} · {e.location}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-0">
          <p
            className="t-mono opacity-70 mb-2"
            style={{ fontSize: "clamp(10px,2.6vw,14px)" }}
          >
            education
          </p>
          <ul className="flex flex-col gap-[clamp(6px,1svh,10px)]">
            {profile.education.map((e) => (
              <li key={`${e.institution}-${e.degree}`} className="min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="t-display truncate py-1" style={{ fontSize: "clamp(12px,3.2vw,17px)" }}>
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
                  className="t-serif truncate"
                  style={{ color: "var(--orange)", fontSize: "clamp(11px,2.8vw,15px)" }}
                >
                  @ {e.institution}
                  {e.location ? ` · ${e.location}` : ""}
                </p>
                {e.grade && (
                  <p
                    className="t-mono-xs opacity-55 mt-0.5"
                    style={{ fontSize: "clamp(9px,2.2vw,12px)" }}
                  >
                    {e.grade}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Contact block — icons + values */}
        <div className="min-w-0">
          <div className="flex items-baseline justify-between mb-2">
            <p
              className="t-mono opacity-70"
              style={{ fontSize: "clamp(10px,2.6vw,14px)" }}
            >
              reach me
            </p>
            <p
              className="t-mono-xs opacity-60"
              style={{ fontSize: "clamp(9px,2.2vw,12px)" }}
            >
              {github.user ? `${github.user.followers} followers` : "online"}
            </p>
          </div>
          <ul className="flex flex-col gap-0.5">
            {contactIcons.map((c) => (
              <li key={c.name} style={{ borderTop: "1px solid rgba(192,68,15,0.18)" }}>
                <a
                  href={c.href}
                  target={c.ext ? "_blank" : undefined}
                  rel={c.ext ? "noreferrer" : undefined}
                  className="flex items-center justify-between gap-3 py-1.5 min-w-0 group"
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
                    className="t-display truncate link-line text-right"
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
