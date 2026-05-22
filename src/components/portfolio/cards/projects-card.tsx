"use client";

import { motion } from "framer-motion";
import { profile, projects } from "@/data/profile";
import type { GithubData, GithubRepo } from "@/lib/github";
import { langDots } from "../constants";
import { fadeUp, stagger } from "../animations";
import { Stat } from "../stat";

/* ───────────────────────── PROJECTS / GITHUB ───────────────────────── */

export function ProjectsCollapsed({ github }: { github: GithubData }) {
  const headline = github.ownedRepos.slice(0, 8);
  const repoCount = github.ownedRepos.length;

  return (
    <div className="flex flex-col justify-between w-full h-full gap-2">
      {/* Top: live numbers */}
      <div className="grid grid-cols-3 gap-2 min-w-0">
        <Stat label="public repos" value={repoCount} />
        <Stat label="stars" value={github.totalStars} />
        <Stat
          label="latest"
          value={github.latestRepo?.name ?? "—"}
          mono
        />
      </div>

      {/* Middle: marquee of repo names */}
      <div className="relative overflow-hidden h-[clamp(46px,6svh,72px)] flex items-center">
        <div className="marquee-track t-display text-[clamp(18px,1.9vw,30px)]" style={{ lineHeight: 1 }}>
          {[...headline, ...headline].map((r, i) => (
            <span key={`${r.id}-${i}`} className="mx-3 inline-flex items-baseline gap-1.5">
              {r.name}
              <span className="t-serif" style={{ color: "var(--orange)", fontSize: "0.55em" }}>
                /{r.language ?? "—"}
              </span>
              <span style={{ opacity: 0.35 }}>·</span>
            </span>
          ))}
        </div>
      </div>

      {/* Bottom: language chips */}
      <div
        className="flex flex-wrap gap-1 pt-2"
        style={{ borderTop: "1px solid rgba(192,68,15,0.22)" }}
      >
        {github.topLanguages.slice(0, 5).map((l) => (
          <span
            key={l.name}
            className="t-mono-xs px-1.5 py-0.5 inline-flex items-center gap-1"
            style={{ border: "1px solid rgba(192,68,15,0.3)", borderRadius: 999 }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: langDots[l.name] ?? "var(--orange)" }}
            />
            {l.name} · {l.count}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ProjectsExpanded({ github }: { github: GithubData }) {
  const featured = projects;
  const liveRepos = github.ownedRepos.slice(0, 10);

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="grid h-full min-h-0"
      style={{ gridTemplateColumns: "1fr 1.5fr", gap: "clamp(16px,1.6vw,32px)" }}
    >
      {/* Left: featured curated projects */}
      <motion.div variants={fadeUp} className="flex flex-col min-h-0 min-w-0">
        <p className="t-mono opacity-70 mb-1.5">featured · curated</p>
        <ul className="flex flex-col gap-[clamp(6px,1svh,12px)] overflow-hidden">
          {featured.map((p, i) => (
            <li
              key={p.name}
              className="pt-[clamp(6px,0.9svh,10px)] min-w-0"
              style={{ borderTop: i === 0 ? undefined : "1px solid rgba(192,68,15,0.18)" }}
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="t-display text-[clamp(16px,1.5vw,24px)] truncate">{p.name}</p>
                <p className="t-mono-xs opacity-60 shrink-0">{p.context.split(",")[0]}</p>
              </div>
              <p className="t-serif text-[clamp(12px,0.9vw,15px)] line-clamp-2" style={{ color: "var(--orange)" }}>
                {p.description}
              </p>
              <p className="t-mono-xs mt-1 opacity-70 truncate">
                {p.technologies.slice(0, 5).join(" · ")}
              </p>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Right: live GitHub repos */}
      <motion.div variants={fadeUp} className="flex flex-col min-h-0 min-w-0">
        <div className="flex items-baseline justify-between mb-1.5">
          <p className="t-mono opacity-70 inline-flex items-center gap-1.5">
            <span className="live-dot" /> live · github
          </p>
          <a
            href={profile.social.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="t-mono link-line"
            style={{ opacity: 0.75 }}
          >
            @{profile.social.githubUser} ↗
          </a>
        </div>
        <ul
          className="grid gap-[clamp(5px,0.7svh,8px)] overflow-hidden auto-rows-fr min-h-0"
          style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
        >
          {liveRepos.map((r) => (
            <RepoTile key={r.id} repo={r} />
          ))}
        </ul>
      </motion.div>
    </motion.div>
  );
}

export function RepoTile({ repo }: { repo: GithubRepo }) {
  return (
    <li>
      <a
        href={repo.html_url}
        target="_blank"
        rel="noreferrer"
        className="flex flex-col min-h-0 min-w-0 justify-between px-2.5 py-1.5 transition-transform hover:-translate-y-0.5"
        style={{
          border: "1px solid rgba(192,68,15,0.2)",
          borderRadius: "clamp(4px,0.35vw,6px)",
        }}
      >
        <div className="flex items-baseline justify-between gap-2 min-w-0">
          <p className="t-display text-[clamp(12px,1vw,16px)] truncate">
            {repo.name}
          </p>
          <p className="t-mono-xs opacity-60 shrink-0">
            {formatRelative(repo.pushed_at)}
          </p>
        </div>
        <p className="t-body text-[clamp(10px,0.72vw,12px)] line-clamp-1" style={{ opacity: 0.72 }}>
          {repo.description ?? "no description"}
        </p>
        <div className="flex items-center gap-2.5 min-w-0">
          {repo.language && (
            <span className="t-mono-xs inline-flex items-center gap-1 truncate">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: langDots[repo.language] ?? "var(--orange)" }}
              />
              {repo.language}
            </span>
          )}
          {repo.stargazers_count > 0 && (
            <span className="t-mono-xs opacity-70">★ {repo.stargazers_count}</span>
          )}
          {repo.forks_count > 0 && (
            <span className="t-mono-xs opacity-70">⑂ {repo.forks_count}</span>
          )}
        </div>
      </a>
    </li>
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
