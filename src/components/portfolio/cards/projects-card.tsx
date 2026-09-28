"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { type ProjectItem } from "@/data/profile";
import { CONTENT_BASE_DELAY, ease } from "../constants";
import { LiveClock } from "../stat";

/* ───────────────────────── PROJECTS · PREVIEWS ───────────────────────── */

/* A project's screenshot, with whatever should stand in when there isn't one.
   `preview` is often a URL rendered on demand by a screenshot service rather
   than a file in the repo, so a load failure is a real case, not a typo — the
   fallback has to cover it or the tile shows an empty box. */
function ProjectShot({
  project,
  sizes,
  fallback,
  alt = "",
  objectTop = true,
}: {
  project: ProjectItem;
  sizes: string;
  fallback: React.ReactNode;
  alt?: string;
  /** Screenshots are tall; anchoring top keeps the site's header in frame. */
  objectTop?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (!project.preview || failed) return <>{fallback}</>;
  return (
    <Image
      src={project.preview}
      alt={alt}
      fill
      sizes={sizes}
      draggable={false}
      onError={() => setFailed(true)}
      className={`object-cover ${objectTop ? "object-top" : ""}`}
    />
  );
}

/* Cover art stands in until a screenshot exists in `preview`. It's built from
   the project's own initial so it reads as deliberate art, not a broken image. */
function PreviewFrame({
  project,
  sizes,
  rounded = true,
  fill = false,
}: {
  project: ProjectItem;
  sizes: string;
  /** Off when the frame sits inside browser chrome that already has a border. */
  rounded?: boolean;
  /** Fill the parent's height instead of imposing 16:9. */
  fill?: boolean;
}) {
  return (
    <div
      className={`relative w-full overflow-hidden ${fill ? "h-full" : "aspect-video"}`}
      style={{
        // Own container so the fallback initial scales to the frame, not the grid.
        containerType: "inline-size",
        borderRadius: rounded ? "clamp(4px,0.4vw,8px)" : undefined,
        border: rounded ? "1px solid rgba(35,21,16,0.22)" : undefined,
        background:
          "linear-gradient(135deg, rgba(35,21,16,0.16), rgba(35,21,16,0.04) 55%, rgba(35,21,16,0.12))",
      }}
    >
      <ProjectShot
        project={project}
        sizes={sizes}
        alt={`${project.name} preview`}
        fallback={
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="t-retro"
              style={{ fontSize: "26cqw", lineHeight: 1, opacity: 0.22 }}
            >
              {project.name.charAt(0)}
            </span>
          </div>
        }
      />
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
  fill = false,
}: {
  project: ProjectItem;
  sizes: string;
  /** Owned by the grid — going live widens the card to the full row. */
  live: boolean;
  onToggle: () => void;
  /** Viewport takes most of the dialog height instead of 16:9 of the width —
      the focus view wants a page you can actually read, not a letterbox. */
  fill?: boolean;
}) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const boxRef = useRef<HTMLDivElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const host = hostOf(project.url);
  const scale = box.w / FRAME_W;
  // `cqw` can't be divided into a unitless scale factor with broad support,
  // so measure the box instead.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) =>
      setBox({ w: e.contentRect.width, h: e.contentRect.height }),
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
      className={`w-full overflow-hidden ${fill ? "flex flex-col flex-1 min-h-0" : ""}`}
      style={{
        borderRadius: "clamp(6px,0.5vw,10px)",
        border: "1px solid rgba(35,21,16,0.22)",
      }}
    >
      {/* chrome bar */}
      <div
        ref={barRef}
        className="flex items-center gap-2 px-2 py-1.5 min-w-0"
        style={{ background: "rgba(35,21,16,0.10)" }}
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
          style={{ opacity: 0.6, fontSize: "clamp(10px,0.72vw,12px)" }}
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
            style={{ fontSize: "clamp(10px,0.72vw,12px)", opacity: 0.75 }}
          >
            {live ? "stop" : "load live"}
          </button>
        )}
      </div>

      <div
        ref={boxRef}
        className={`relative w-full overflow-hidden ${fill ? "flex-1 min-h-0" : "aspect-video"}`}
      >
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
              // In fill mode the iframe covers the box's real height, so the
              // embedded site gets a full-page viewport rather than 16:9.
              height: fill ? box.h / scale : FRAME_W * (9 / 16),
              transform: `scale(${scale})`,
            }}
          />
        ) : (
          <PreviewFrame project={project} sizes={sizes} rounded={false} fill={fill} />
        )}
      </div>
    </div>
  );
}

/* One per window, all different — the kinds of work, not who it was for.
   Cycled so a longer or shorter project list still labels every window. */
const WORK_KINDS = ["freelance", "contract", "personal", "concept"];

/* ─── collapsed stack: the real pages, not a drawing of one ──────────────
   Each window in the cascade frames its own screenshot, anchored top-left so
   the part in frame is the site's header. Windows without a screenshot keep
   the wireframe below. */

/** Windows are 115% of the stack box, so only their top-left corner is in frame. */
const STACK_OVERSIZE = 1.15;

function StackWireframe({ kind }: { kind: string }) {
  return (
    <div className="px-2 pt-2 flex flex-col gap-1.5">
      <p
        className="t-mono-xs"
        style={{
          color: "var(--orange-deep)",
          opacity: 0.75,
          fontSize: "clamp(10px,0.62vw,11px)",
        }}
      >
        {kind}
      </p>
      {[70, 46, 58].map((w, b) => (
        <span
          key={b}
          className="block rounded-full"
          style={{ width: `${w}%`, height: 4, background: "rgba(35,21,16,0.18)" }}
        />
      ))}
    </div>
  );
}

export function ProjectsCollapsed({ items }: { items: ProjectItem[] }) {
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
          style={{ opacity: 0.7, fontSize: "clamp(10px,0.78vw,12px)" }}
        >
          my works
        </p>
        <p
          className="t-mono-xs shrink-0 flex items-center gap-1.5"
          style={{ opacity: 0.6, fontSize: "clamp(10px,0.78vw,12px)" }}
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
        style={{ fontSize: "clamp(18px,2.1vw,36px)" }}
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
          All sizes: tablet/phone tiles are tall too — without this the card
          is a bare headline over dead space. */}
      <motion.div
        className="relative flex-1 min-h-0 mt-[clamp(4px,1svh,16px)] overflow-hidden"
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
        {items.map((p, i) => (
          <motion.div
            key={p.name}
            className="absolute overflow-hidden flex flex-col"
            variants={{
              rest: { x: 0, y: 0 },
              // Fan down-right so every corner stays legible, and lift the
              // whole stack a little so the frontmost one isn't cropped.
              hover: { x: i * 16, y: i * 12 - 10 },
            }}
            transition={{ duration: 0.4, ease }}
            style={{
              top: `${i * 15}%`,
              left: `${i * 11}%`,
              width: `${STACK_OVERSIZE * 100}%`,
              height: `${STACK_OVERSIZE * 100}%`,
              // Later windows sit in front, so they have to paint over the one
              // behind — the depth cue is the drop shadow, not transparency.
              zIndex: i + 1,
              borderRadius: 8,
              border: "1px solid rgba(35,21,16,0.3)",
              background: "var(--cream-soft)",
              boxShadow: "0 10px 30px rgba(35,21,16,0.20)",
            }}
          >
            <div
              className="flex gap-1 px-2 py-1.5 shrink-0"
              style={{ background: "rgba(35,21,16,0.12)" }}
            >
              {["#e06c4a", "#e8b04b", "#7fb069"].map((c) => (
                <span
                  key={c}
                  className="block rounded-full"
                  style={{ width: 5, height: 5, background: c, opacity: 0.7 }}
                />
              ))}
            </div>

            {/* Decorative: the expanded card names this work properly, so the
                stack stays out of the accessibility tree. */}
            <div className="relative flex-1 min-h-0 overflow-hidden" aria-hidden>
              <ProjectShot
                project={p}
                sizes="(min-width: 768px) 30vw, 90vw"
                /* Only the top-left corner of each window is in frame, so the
                   label and the wireframe bars live there. */
                fallback={<StackWireframe kind={WORK_KINDS[i % WORK_KINDS.length]} />}
              />
            </div>
          </motion.div>
        ))}
      </motion.div>

    </motion.div>
  );
}

/* ─────────────────────── PROJECTS · EXPANDED (grid) ───────────────────────
   The collapsed card's window stack is the tease; here every project sits
   full size in a grid. Clicking a screenshot swaps to a focus view with
   the live embed. */

const TILE_LINKS = "clamp(10px,0.8vw,12px)";
const CHROME_FONT = "clamp(9px,0.72vw,12px)";

/* "Salon site, North Paravur · freelance" → "freelance". It sits next to a
   real project name, so it's read from the data, never made up. */
const kindOf = (p: ProjectItem) =>
  p.context.split(/[,·]/).at(-1)?.trim() ?? "";

function TileLinks({ project }: { project: ProjectItem }) {
  if (!project.url && !project.repo) return null;
  return (
    <div className="flex flex-wrap gap-3">
      {project.url && (
        <a
          href={project.url}
          target="_blank"
          rel="noreferrer"
          className="t-mono link-line"
          style={{ fontSize: TILE_LINKS }}
        >
          live ↗
        </a>
      )}
      {project.repo && (
        <a
          href={project.repo}
          target="_blank"
          rel="noreferrer"
          className="t-mono link-line"
          style={{ fontSize: TILE_LINKS }}
        >
          source ↗
        </a>
      )}
    </div>
  );
}

function WindowChromeBar({ project }: { project: ProjectItem }) {
  const host = hostOf(project.url);
  return (
    <div
      className="flex items-center gap-2 px-2 py-1.5 min-w-0 shrink-0"
      style={{ background: "rgba(35,21,16,0.10)" }}
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
      <span className="t-mono-xs truncate" style={{ opacity: 0.6, fontSize: CHROME_FONT }}>
        {host || kindOf(project)}
      </span>
    </div>
  );
}

/* Opening a project swaps the grid for this focus view: the live site (or its
   screenshot when the site refuses framing) plus the write-up. */
function FocusView({ project, onBack }: { project: ProjectItem; onBack: () => void }) {
  const canEmbed = Boolean(project.url) && project.embeddable !== false;
  // Opening the window IS the request to see the site, so the embed loads
  // immediately — still only ever one at a time.
  const [live, setLive] = useState(canEmbed);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease }}
      className="flex flex-col flex-1 min-h-0 min-w-0 gap-[clamp(6px,1svh,12px)]"
    >
      {/* One slim line of chrome — everything else is the site itself. */}
      <div className="flex items-baseline gap-3 min-w-0 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="t-mono link-line shrink-0 cursor-pointer"
          style={{ fontSize: TILE_LINKS }}
        >
          ← all work
        </button>
        <h3
          className="t-display truncate"
          style={{ fontSize: "clamp(16px,1.6vw,26px)", lineHeight: 1 }}
        >
          {project.name}
        </h3>
        <span
          className="t-mono-xs truncate hidden lg:inline"
          style={{ opacity: 0.55, fontSize: "clamp(10px,0.65vw,11px)" }}
        >
          {project.context}
        </span>
        <span className="ml-auto shrink-0">
          <TileLinks project={project} />
        </span>
      </div>

      {/* The write-up, repeated above the embed so it stays in view once
          the grid is gone. Compact: three short rows above the embed. */}
      <div className="flex flex-col gap-1 min-w-0 shrink-0 compact:hidden">
        <p
          className="t-serif"
          style={{ color: "var(--orange)", fontSize: "clamp(13px,1.1vw,17px)", lineHeight: 1.35 }}
        >
          {project.description}
        </p>
        {project.highlights.length > 0 && (
          <p
            className="t-mono-xs"
            style={{ opacity: 0.7, fontSize: "clamp(10px,0.72vw,12px)", lineHeight: 1.5, letterSpacing: "0.06em" }}
          >
            {project.highlights.join("  ·  ")}
          </p>
        )}
      </div>

      <LivePreview
        project={project}
        sizes="92vw"
        live={live && canEmbed}
        onToggle={() => setLive((v) => !v)}
        fill
      />
    </motion.div>
  );
}

export function ProjectsExpanded({ items }: { items: ProjectItem[] }) {
  const [focused, setFocused] = useState<string | null>(null);

  const focusedProject = items.find((p) => p.name === focused) ?? null;

  return (
    <div className="flex flex-col h-full min-w-0 overflow-x-hidden overflow-y-auto scrollbar-styled-ink gap-[clamp(10px,1.4svh,16px)]">
      {/* menu bar */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="flex items-center gap-3 min-w-0 shrink-0 pb-[clamp(6px,0.8svh,10px)]"
        style={{ borderBottom: "1px solid rgba(35,21,16,0.22)" }}
      >
        <span
          className="t-display-med shrink-0"
          style={{ fontSize: "clamp(14px,1.2vw,20px)", lineHeight: 1 }}
        >
          <span style={{ color: "var(--orange)" }}>● </span>
          Selected work
        </span>
        <span
          className="t-mono-xs hidden md:inline truncate"
          style={{ opacity: 0.5, fontSize: CHROME_FONT }}
        >
          {focusedProject ? "~/works/" + hostOf(focusedProject.url) : "click a site to open it live"}
        </span>
        <span
          className="t-mono-xs ml-auto shrink-0 flex items-center gap-1.5"
          style={{ opacity: 0.6, fontSize: CHROME_FONT }}
        >
          <span className="live-dot" style={{ color: "#7fb069" }} />
          all live
        </span>
        <span className="t-mono-xs shrink-0" style={{ opacity: 0.6, fontSize: CHROME_FONT }}>
          <LiveClock />
        </span>
      </motion.div>

      {focusedProject ? (
        <FocusView
          key={focusedProject.name}
          project={focusedProject}
          onBack={() => setFocused(null)}
        />
      ) : (
        <>
          {/* Every project at once, flat and full size — a screenshot you can
              actually read, the pitch under it, and one click to the live
              site. One column on phones, up to three on wide screens. */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[clamp(10px,1.2vw,16px)] pb-2">
            {items.map((p, i) => (
              <motion.article
                key={p.name}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                // Tight: this only starts once the card has finished FLIPping
                // open, so a long stagger is dead time tacked onto the expand.
                transition={{ duration: 0.4, delay: 0.04 + i * 0.05, ease }}
                className="flex flex-col min-w-0 overflow-hidden"
                style={{
                  borderRadius: "clamp(6px,0.5vw,10px)",
                  border: "1px solid rgba(35,21,16,0.22)",
                  background: "var(--cream-soft)",
                }}
              >
                <WindowChromeBar project={p} />
                <button
                  type="button"
                  onClick={() => setFocused(p.name)}
                  aria-label={`Open ${p.name}`}
                  className="group relative block aspect-video overflow-hidden cursor-pointer"
                >
                  <PreviewFrame project={p} sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 92vw" rounded={false} />
                  <span
                    className="t-mono-xs absolute right-2 bottom-2 px-2 py-1 opacity-0 translate-y-1 transition-[opacity,transform] duration-200 group-hover:opacity-100 group-hover:translate-y-0 group-focus-visible:opacity-100 group-focus-visible:translate-y-0"
                    style={{
                      fontSize: CHROME_FONT,
                      borderRadius: 6,
                      background: "rgba(251,246,233,0.92)",
                      border: "1px solid rgba(35,21,16,0.22)",
                    }}
                  >
                    open ⤢
                  </span>
                </button>
                <div className="flex flex-col gap-1.5 p-3">
                  <p
                    className="t-mono-xs"
                    style={{
                      color: "var(--orange-deep)",
                      fontSize: "clamp(10px,0.65vw,11px)",
                    }}
                  >
                    {kindOf(p)}
                  </p>
                  <h3 className="t-display" style={{ fontSize: "clamp(18px,1.6vw,26px)", lineHeight: 1 }}>
                    {p.name}
                  </h3>
                  <p
                    className="t-serif"
                    style={{ color: "var(--orange)", fontSize: "clamp(13px,1.05vw,16px)", lineHeight: 1.4 }}
                  >
                    {p.description}
                  </p>
                  <TileLinks project={p} />
                </div>
              </motion.article>
            ))}
          </div>
        </>
      )}
    </div>
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
