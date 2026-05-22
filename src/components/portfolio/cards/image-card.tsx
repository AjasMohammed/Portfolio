"use client";

import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { certificates } from "@/data/profile";
import { ease, CONTENT_BASE_DELAY, LETTER_INK } from "../constants";
import { SplitText } from "../split-text";

/* Keywords highlighted in the cover letter — companies, projects, and
   marquee tools. Order in the list doesn't matter; the highlighter sorts
   by length so phrases like "Django REST Framework" win over "Django". */
const COVER_LETTER_KEYWORDS = [
  // Companies
  "Neumeral Technologies", "Neumeral",
  "Allwin Technologies",
  "Imiot TechnoLabs",
  // Projects
  "Learnabble", "Neusler", "GitAI",
  // Frameworks & libraries
  "Django REST Framework", "Django ORM", "Django",
  "FastAPI", "Wagtail", "React", "Next.js",
  "Celery", "Redis", "Docker", "Ansible",
  "LangChain", "GitPython",
  // Languages
  "Python", "SQL",
  // Other
  "HackerRank", "YouTube API", "Odoo",
  "REST APIs", "RESTful APIs",
];

const KEYWORD_HIGHLIGHT_STYLE: CSSProperties = {
  fontWeight: 600,
  letterSpacing: "0.08em",
};

function buildKeywordHighlighter(keywords: string[]) {
  const sorted = [...keywords].sort((a, b) => b.length - a.length);
  const pattern = sorted
    .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const regex = new RegExp(`(?<![A-Za-z])(${pattern})(?![A-Za-z])`, "gi");
  const seen = new Set<string>();
  return (text: string): ReactNode[] => {
    const parts = text.split(regex);
    return parts.map((part, i) => {
      if (i % 2 === 0) return part;
      const key = part.toLowerCase();
      if (seen.has(key)) return part;
      seen.add(key);
      return (
        <span key={i} style={KEYWORD_HIGHLIGHT_STYLE}>
          {part}
        </span>
      );
    });
  };
}

/* ───────────────────────── IMAGE ───────────────────────── */

export function ImageInner() {
  const reduce = useReducedMotion();
  return (
    <div className="relative h-full w-full overflow-hidden" style={{ borderRadius: "inherit" }}>
      {/* Image with vertical clip-path wipe reveal */}
      <motion.div
        className="absolute inset-0"
        initial={reduce ? false : { clipPath: "inset(100% 0 0 0)" }}
        animate={{ clipPath: "inset(0% 0 0 0)" }}
        transition={{ duration: 1.1, ease, delay: CONTENT_BASE_DELAY }}
      >
        <Image
          src="/images/portrait.jpeg"
          alt="Illustrated portrait of Ajas Mohammed"
          fill
          sizes="(max-width: 1024px) 100vw, 34vw"
          priority
          className="object-cover object-top scale-[1.08] transition-transform duration-500 ease-out group-hover:scale-100"
        />
      </motion.div>
      {/* Top fade so the chrome overlay text stays legible */}
      <div
        className="absolute inset-x-0 top-0 h-[22%] pointer-events-none"
        style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.32), transparent)" }}
      />
      <div className="absolute left-3 right-3 bottom-3 hidden lg:flex items-end justify-between gap-2 text-cream">
        <div className="min-w-0">
          <p className="t-display text-[clamp(18px,1.8vw,30px)] leading-none overflow-hidden flex flex-col py-2">
            <SplitText delay={CONTENT_BASE_DELAY + 0.8}>Ajas</SplitText>
            <SplitText delay={CONTENT_BASE_DELAY + 0.95}>Mohammed</SplitText>
          </p>
          <motion.p
            className="t-mono-xs mt-1.5 opacity-85 truncate"
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 0.85, y: 0 }}
            transition={{ duration: 0.5, ease, delay: CONTENT_BASE_DELAY + 1.15 }}
          >
            est. 2024 · py · django · react
          </motion.p>
        </div>
        <motion.p
          className="t-mono-xs opacity-85 shrink-0"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 0.85 }}
          transition={{ duration: 0.5, ease, delay: CONTENT_BASE_DELAY + 1.25 }}
        >
          fig.01 / 01
        </motion.p>
      </div>
    </div>
  );
}

export const coverLetterParagraphs = [
  "I'm Ajas Mohammed — a Python developer based in Kochi, India, with around two years of hands-on experience building backend systems, REST APIs, and full-stack web applications for content publishing and learning platforms.",
  "I currently work as a Software Developer at Neumeral Technologies, where I design and implement REST APIs with Django and Django REST Framework, build asynchronous workflows with Celery and Redis, and refactor legacy codebases for maintainability, scalability, and performance. I also containerize services with Docker and automate deployments using Ansible.",
  "Before that, I worked at Allwin Technologies as a Backend Developer designing scalable RESTful APIs, and started out as a Python Django intern at Imiot TechnoLabs, shipping backend features and bug fixes remotely.",
  "A few things I've built along the way: Learnabble, a learning portal where I built backend services, optimized Django ORM queries, and integrated the YouTube API and Odoo for course data synchronization; Neusler, a Django and Wagtail publishing platform I refactored through caching strategies, CMS enhancements, and new API endpoints; and GitAI, a FastAPI application I wrote that generates structured Git commit messages using LangChain prompt pipelines and GitPython.",
  "Day to day I reach for Python, Django, Django REST Framework, FastAPI, Wagtail, React and Next.js — backed by PostgreSQL, MySQL or SQLite, with Docker, Redis, Celery, Ansible and Linux for the plumbing. I'm certified in Python, SQL, REST APIs and problem solving through HackerRank.",
  "I care about code that ages well, queries that don't surprise anyone in production, and small careful changes over heroic rewrites. If you're building something patient and useful, I'd love to talk — every door (email, phone, GitHub, LinkedIn, resume) is on the contact card.",
];

/* Compact mobile version — fits the expanded card without scrolling */
export const coverLetterParagraphsMobile = [
  "I'm Ajas — a Python developer in Kochi with around two years of experience. Django, FastAPI, and async pipelines under the hood; a bit of React and Next.js on the surface. Currently @ Neumeral, building REST APIs and refactoring legacy code.",
  "Things I've shipped along the way: Learnabble (a learning portal), Neusler (a Wagtail publishing platform), and GitAI (a FastAPI + LangChain commit-message tool). HackerRank certified in Python, SQL, and REST APIs.",
  "I care about code that ages well and small careful changes over heroic rewrites. If you're building something patient and useful, I'd love to talk — every door is on the contact card.",
];

export function ImageExpanded() {
  const highlightDesktop = buildKeywordHighlighter(COVER_LETTER_KEYWORDS);
  const highlightMobile = buildKeywordHighlighter(COVER_LETTER_KEYWORDS);
  return (
    <div
      className="flex flex-col h-full overflow-y-auto scrollbar-styled lg:grid lg:overflow-hidden lg:grid-cols-[1fr_clamp(220px,20vw,320px)]"
      style={{
        gap: "clamp(16px,1.6svh,28px)",
      }}
    >
      <div
        className="flex flex-col min-w-0 gap-4 scrollbar-styled lg:overflow-y-auto lg:overflow-x-hidden lg:min-h-0 lg:w-[60vw]"
      >
        {/* Mobile only — small round avatar at top-right above the letter */}
        <div className="flex justify-end lg:hidden">
          <Image
            src="/images/portrait.jpeg"
            alt="Portrait of Ajas Mohammed"
            width={200}
            height={200}
            sizes="96px"
            className="object-cover object-top shrink-0"
            style={{
              width: "clamp(64px, 18vw, 96px)",
              height: "clamp(64px, 18vw, 96px)",
              borderRadius: 9999,
              border: "1px solid rgba(192,68,15,0.32)",
            }}
          />
        </div>

        <div className="min-w-0">
          <div
            className="flex flex-col gap-[clamp(8px,1.2svh,16px)]"
            style={{ color: LETTER_INK }}
          >
            <p
              className="t-body"
              style={{
                fontSize: "clamp(13px,3.4vw,21px)",
                lineHeight: 1.55,
                opacity: 0.95,
              }}
            >
              Hello,
            </p>

            {/* Desktop — full multi-paragraph letter */}
            <div className="hidden lg:flex lg:flex-col gap-[clamp(8px,1.2svh,16px)]">
              {coverLetterParagraphs.map((p, i) => (
                <p
                  key={i}
                  className="t-body"
                  style={{
                    fontSize: "clamp(13px,3.4vw,21px)",
                    lineHeight: 1.55,
                    opacity: 0.92,
                  }}
                >
                  {highlightDesktop(p)}
                </p>
              ))}
            </div>

            {/* Mobile — compact letter that fits without scrolling */}
            <div className="flex flex-col gap-[clamp(8px,1.2svh,16px)] lg:hidden">
              {coverLetterParagraphsMobile.map((p, i) => (
                <p
                  key={i}
                  className="t-body"
                  style={{
                    fontSize: "clamp(13px,3.4vw,21px)",
                    lineHeight: 1.55,
                    opacity: 0.92,
                  }}
                >
                  {highlightMobile(p)}
                </p>
              ))}
            </div>

            <div className="flex flex-col gap-1 mt-2">
              <p
                className="t-serif"
                style={{
                  fontSize: "clamp(13px,3.4vw,21px)",
                  lineHeight: 1.4,
                  opacity: 0.85,
                  fontStyle: "italic",
                }}
              >
                Sincerely,
              </p>
              <p
                className="t-display"
                style={{
                  fontSize: "clamp(16px,4vw,26px)",
                  letterSpacing: "-0.005em",
                }}
              >
                Ajas Mohammed
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        className="flex flex-col gap-[clamp(10px,1.4svh,22px)] min-w-0 scrollbar-styled lg:min-h-0 lg:overflow-y-auto lg:overflow-x-hidden"
      >
        {/* Portrait — desktop only (mobile already shows it in the collapsed card) */}
        <Image
          src="/images/portrait.jpeg"
          alt="Illustrated portrait"
          width={853}
          height={1280}
          sizes="320px"
          className="hidden lg:block h-auto w-full self-start"
          style={{ borderRadius: "clamp(12px,1.2vw,20px)" }}
        />

        {certificates.length > 0 && (
          <div className="min-w-0">
            <div className="flex items-baseline justify-between mb-2">
              <p
                className="t-mono"
                style={{
                  opacity: 0.7,
                  fontSize: "clamp(10px,2.6vw,14px)",
                  letterSpacing: "0.08em",
                }}
              >
                certificates · verified
              </p>
              <p
                className="t-mono-xs opacity-55 shrink-0"
                style={{ fontSize: "clamp(9px,2.4vw,12px)" }}
              >
                {String(certificates.length).padStart(2, "0")}
              </p>
            </div>
            <ul className="flex flex-col gap-[clamp(6px,0.7svh,10px)]">
              {certificates.map((c) => (
                <li key={c.url} className="min-w-0">
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 transition-transform hover:-translate-y-0.5"
                    style={{
                      padding: "clamp(8px,2vw,12px) clamp(10px,2.4vw,14px)",
                      border: "1px solid rgba(192,68,15,0.28)",
                      borderRadius: "clamp(8px,2vw,12px)",
                      background: "rgba(192,68,15,0.04)",
                    }}
                  >
                    <div className="min-w-0">
                      <p
                        className="t-display truncate"
                        style={{
                          fontSize: "clamp(12px,3vw,17px)",
                          fontWeight: 700,
                          letterSpacing: "-0.005em",
                          lineHeight: 1.15,
                        }}
                      >
                        {c.title}
                      </p>
                      <p
                        className="t-serif truncate"
                        style={{
                          color: "rgba(192,68,15,0.78)",
                          fontSize: "clamp(10px,2.4vw,13px)",
                          lineHeight: 1.2,
                        }}
                      >
                        {c.level} · {c.issuer.toLowerCase()}
                      </p>
                    </div>
                    <span
                      className="t-mono-xs inline-flex items-center gap-1 shrink-0"
                      style={{ opacity: 0.85 }}
                    >
                      <span className="live-dot" />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
