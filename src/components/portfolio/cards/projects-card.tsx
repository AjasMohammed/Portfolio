"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { projects, type ProjectItem } from "@/data/profile";
import { CONTENT_BASE_DELAY, ease } from "../constants";
import { SplitText } from "../split-text";
import { fadeUp, stagger } from "../animations";

/* ───────────────────────── PROJECTS · PREVIEWS ───────────────────────── */

/* Cover art stands in until a screenshot exists in `preview`. It's built from
   the project's own initial so it reads as deliberate art, not a broken image. */
function PreviewFrame({
  project,
  sizes,
  rounded = true,
}: {
  project: ProjectItem;
  sizes: string;
  /** Off when the frame sits inside browser chrome that already has a border. */
  rounded?: boolean;
}) {
  return (
    <div
      className="relative w-full overflow-hidden aspect-video"
      style={{
        // Own container so the fallback initial scales to the frame, not the grid.
        containerType: "inline-size",
        borderRadius: rounded ? "clamp(4px,0.4vw,8px)" : undefined,
        border: rounded ? "1px solid rgba(192,68,15,0.22)" : undefined,
        background:
          "linear-gradient(135deg, rgba(192,68,15,0.16), rgba(192,68,15,0.04) 55%, rgba(192,68,15,0.12))",
      }}
    >
      {project.preview ? (
        <Image
          src={project.preview}
          alt={`${project.name} preview`}
          fill
          sizes={sizes}
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="t-retro"
            style={{ fontSize: "26cqw", lineHeight: 1, opacity: 0.22 }}
          >
            {project.name.charAt(0)}
          </span>
        </div>
      )}
    </div>
  );
}

/* The live site inside a browser chrome. The iframe renders at desktop width
   and is scaled down to the card, so visitors see the real desktop layout
   rather than the site's mobile breakpoint. It only mounts once clicked —
   three third-party sites booting on dialog open is a lot of main thread. */
const FRAME_W = 1440;

function hostOf(url?: string) {
  return url ? new URL(url).hostname.replace(/^www\./, "") : "";
}

function LivePreview({
  project,
  sizes,
  live,
  onToggle,
}: {
  project: ProjectItem;
  sizes: string;
  /** Owned by the grid — going live widens the card to the full row. */
  live: boolean;
  onToggle: () => void;
}) {
  const [scale, setScale] = useState(0);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const host = hostOf(project.url);
  // `cqw` can't be divided into a unitless scale factor with broad support,
  // so measure the box instead.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) =>
      setScale(e.contentRect.width / FRAME_W),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Going live re-flows the card to full width, which usually pushes it out of
  // view — follow it, or the click reads as "nothing happened".
  useEffect(() => {
    // `start` on the chrome bar, not the frame — the stop button has to stay
    // reachable once the embed fills the dialog.
    if (live) barRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [live]);

  const canEmbed = Boolean(project.url) && project.embeddable !== false;

  return (
    <div
      className="w-full overflow-hidden"
      style={{
        borderRadius: "clamp(6px,0.5vw,10px)",
        border: "1px solid rgba(192,68,15,0.22)",
      }}
    >
      {/* chrome bar */}
      <div
        ref={barRef}
        className="flex items-center gap-2 px-2 py-1.5 min-w-0"
        style={{ background: "rgba(192,68,15,0.10)" }}
      >
        <span className="flex gap-1 shrink-0">
          {["#e06c4a", "#e8b04b", "#7fb069"].map((c) => (
            <span
              key={c}
              className="block rounded-full"
              style={{ width: 7, height: 7, background: c, opacity: 0.7 }}
            />
          ))}
        </span>
        <span
          className="t-mono-xs truncate"
          style={{ opacity: 0.6, fontSize: "clamp(9px,0.72vw,12px)" }}
        >
          {host}
        </span>
        {canEmbed && (
          <button
            type="button"
            onClick={onToggle}
            // Below md the card is too narrow to embed usefully — the
            // screenshot plus the `live ↗` link serves phones better.
            className="t-mono-xs ml-auto shrink-0 link-line cursor-pointer hidden md:inline"
            style={{ fontSize: "clamp(9px,0.72vw,12px)", opacity: 0.75 }}
          >
            {live ? "stop" : "load live"}
          </button>
        )}
      </div>

      <div ref={boxRef} className="relative w-full aspect-video overflow-hidden">
        {live && scale > 0 ? (
          <iframe
            src={project.url}
            title={`${project.name} live preview`}
            loading="lazy"
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            className="absolute top-0 left-0 origin-top-left border-0"
            style={{
              width: FRAME_W,
              height: FRAME_W * (9 / 16),
              transform: `scale(${scale})`,
            }}
          />
        ) : (
          <PreviewFrame project={project} sizes={sizes} rounded={false} />
        )}
      </div>
    </div>
  );
}

/* One per window, all different — the kinds of work, not who it was for.
   Cycled so a longer or shorter project list still labels every window. */
const WORK_KINDS = ["freelance", "contract", "personal", "concept"];

export function ProjectsCollapsed() {
  return (
    <motion.div
      className="flex flex-col w-full h-full min-w-0 gap-[clamp(4px,0.8svh,12px)]"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: CONTENT_BASE_DELAY + 0.2, ease }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <p
          className="t-mono-xs shrink-0"
          style={{ opacity: 0.7, fontSize: "clamp(10px,0.78vw,13px)", letterSpacing: "0.18em" }}
        >
          my works
        </p>
        <p
          className="t-mono-xs shrink-0 flex items-center gap-1.5"
          style={{ opacity: 0.6, fontSize: "clamp(10px,0.78vw,13px)" }}
        >
          <span className="live-dot" style={{ color: "#7fb069" }} />
          in production
        </p>
      </div>

      {/* No project names here on purpose — the roster changes, the pitch
          doesn't. Names, screenshots, and live embeds are all in the expanded
          card; this face just says what kind of work it is. */}
      <p
        className="t-display leading-[0.9]"
        style={{ fontSize: "clamp(22px,2.7vw,46px)" }}
      >
        Shipped.
        <br />
        <span className="t-serif" style={{ color: "var(--orange)" }}>
          Still live.
        </span>
      </p>

      {/* A cascade of browser windows — one per build, echoing the chrome the
          expanded card puts the live sites in. Each window is bigger than the
          box, so only its top-left corner is in frame and the rest runs off the
          tile; hovering fans the stack apart. Nothing in it to go stale.
          Desktop only: the tablet and phone tiles are one row tall. */}
      <motion.div
        className="relative flex-1 min-h-0 hidden lg:block mt-[clamp(4px,1svh,16px)] overflow-hidden"
        // Cancel the card's own padding on two sides so the windows run into
        // the bottom-right corner instead of floating in a margin.
        style={{
          marginRight: "calc(-1 * clamp(14px,1.5vw,22px))",
          marginBottom: "calc(-1 * clamp(18px,2.2svh,28px))",
        }}
        initial="rest"
        animate="rest"
        whileHover="hover"
      >
        {projects.map((p, i) => (
          <motion.div
            key={p.name}
            className="absolute overflow-hidden"
            variants={{
              rest: { x: 0, y: 0, opacity: 0.4 + i * 0.18 },
              // Fan down-right so every corner stays legible, and lift the
              // whole stack a little so the frontmost one isn't cropped.
              hover: {
                x: i * 16,
                y: i * 12 - 10,
                opacity: Math.min(1, 0.55 + i * 0.18),
              },
            }}
            transition={{ duration: 0.4, ease }}
            style={{
              top: `${i * 15}%`,
              left: `${i * 11}%`,
              width: "115%",
              height: "115%",
              borderRadius: 8,
              border: "1px solid rgba(192,68,15,0.3)",
              background: "rgba(255,247,232,0.92)",
            }}
          >
            <div
              className="flex gap-1 px-2 py-1.5"
              style={{ background: "rgba(192,68,15,0.12)" }}
            >
              {["#e06c4a", "#e8b04b", "#7fb069"].map((c) => (
                <span
                  key={c}
                  className="block rounded-full"
                  style={{ width: 5, height: 5, background: c, opacity: 0.7 }}
                />
              ))}
            </div>

            {/* Only the top-left corner of each window is in frame, so the
                label and the wireframe bars live there. */}
            <div className="px-2 pt-2 flex flex-col gap-1.5">
              <p
                className="t-mono-xs"
                style={{
                  color: "var(--orange)",
                  opacity: 0.75,
                  letterSpacing: "0.16em",
                  fontSize: "clamp(8px,0.62vw,11px)",
                }}
              >
                {WORK_KINDS[i % WORK_KINDS.length]}
              </p>
              {[70, 46, 58].map((w, b) => (
                <span
                  key={b}
                  className="block rounded-full"
                  style={{
                    width: `${w}%`,
                    height: 4,
                    background: "rgba(192,68,15,0.18)",
                  }}
                />
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>

    </motion.div>
  );
}

export function ProjectsExpanded() {
  // One embed at a time — several live client sites at once is a lot of
  // third-party JS for a portfolio dialog.
  const [livePreview, setLivePreview] = useState<string | null>(null);

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="flex flex-col h-full min-w-0 overflow-x-hidden overflow-y-auto scrollbar-styled-ink gap-[clamp(14px,1.8svh,26px)]"
    >
      <motion.div variants={fadeUp} className="flex items-end justify-between gap-3 min-w-0">
        <h2
          className="t-display text-[clamp(30px,9vw,68px)] lg:text-[clamp(26px,3.2vw,52px)]"
          style={{ lineHeight: 0.92 }}
        >
          <SplitText delay={0.1}>Selected</SplitText>{" "}
          <SplitText className="t-serif" style={{ color: "var(--orange)" }} delay={0.32}>
            work.
          </SplitText>
        </h2>
        <p
          className="t-mono-xs shrink-0 pb-1"
          style={{ opacity: 0.6, fontSize: "clamp(9px,0.8vw,13px)", letterSpacing: "0.12em" }}
        >
          {projects.length} projects
        </p>
      </motion.div>

      <div
        className="grid gap-[clamp(14px,1.6vw,28px)] grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      >
        {projects.map((p) => (
          <motion.article
            variants={fadeUp}
            key={p.name}
            // The live card takes the whole row: at one third of the width the
            // embed is a moving thumbnail, at full width it's usable.
            className={`flex flex-col min-w-0 gap-2 pt-[clamp(8px,1svh,12px)] ${
              livePreview === p.name ? "md:col-span-2 lg:col-span-3" : ""
            }`}
            style={{ borderTop: "1px solid rgba(192,68,15,0.22)" }}
          >
            <LivePreview
              project={p}
              sizes="(max-width: 767px) 92vw, (max-width: 1279px) 46vw, 31vw"
              live={livePreview === p.name}
              onToggle={() =>
                setLivePreview((cur) => (cur === p.name ? null : p.name))
              }
            />

            <div className="flex items-baseline justify-between gap-2 min-w-0">
              <h3
                className="t-display-med truncate"
                style={{ fontSize: "clamp(18px,2vw,30px)", lineHeight: 1 }}
              >
                {p.name}
              </h3>
              <p
                className="t-mono-xs shrink-0"
                style={{ opacity: 0.55, fontSize: "clamp(9px,0.8vw,12px)" }}
              >
                {p.context.split(",")[0]}
              </p>
            </div>

            <p
              className="t-serif"
              style={{
                color: "var(--orange)",
                fontSize: "clamp(13px,1.05vw,18px)",
                lineHeight: 1.4,
              }}
            >
              {p.description}
            </p>

            <ul className="flex flex-col gap-1">
              {p.highlights.map((h) => (
                <li
                  key={h}
                  className="t-body flex items-baseline gap-2"
                  style={{ fontSize: "clamp(11px,0.85vw,14px)", lineHeight: 1.45, opacity: 0.85 }}
                >
                  <span className="opacity-50 shrink-0">·</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-2 min-w-0">
              <p
                className="t-code wrap-break-word"
                style={{
                  fontSize: "clamp(10px,0.8vw,13px)",
                  lineHeight: 1.6,
                  opacity: 0.8,
                  letterSpacing: 0,
                }}
              >
                {p.technologies.map((t) => t.toLowerCase()).join(" · ")}
              </p>
              {(p.url || p.repo) && (
                <div className="flex flex-wrap gap-3 mt-1.5">
                  {p.url && (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="t-mono link-line"
                      style={{ fontSize: "clamp(10px,0.8vw,13px)" }}
                    >
                      live ↗
                    </a>
                  )}
                  {p.repo && (
                    <a
                      href={p.repo}
                      target="_blank"
                      rel="noreferrer"
                      className="t-mono link-line"
                      style={{ fontSize: "clamp(10px,0.8vw,13px)" }}
                    >
                      source ↗
                    </a>
                  )}
                </div>
              )}
            </div>
          </motion.article>
        ))}
      </div>
    </motion.div>
  );
}

export function formatRelative(iso: string) {
  const d = new Date(iso);
  const now = Date.now();
  const diff = Math.max(0, now - d.getTime());
  const day = 24 * 60 * 60 * 1000;
  if (diff < day) return "today";
  if (diff < 7 * day) return `${Math.round(diff / day)}d`;
  if (diff < 30 * day) return `${Math.round(diff / (7 * day))}w`;
  if (diff < 365 * day) return `${Math.round(diff / (30 * day))}mo`;
  return `${Math.round(diff / (365 * day))}y`;
}
