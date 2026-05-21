"use client";

import { motion } from "framer-motion";
import { profile } from "@/data/profile";
import type { GithubData } from "@/lib/github";
import { langDots } from "../constants";
import { SplitText } from "../split-text";
import { fadeUp, stagger } from "../animations";

/* ───────────────────────── SKILLS ───────────────────────── */

export function skillGroups() {
  return [
    { key: "Languages", items: profile.skills.languages },
    { key: "Frameworks", items: profile.skills.frameworks },
    { key: "Databases", items: profile.skills.databases },
    { key: "Tooling", items: profile.skills.tools },
  ];
}

export function SkillsCollapsed({ github }: { github: GithubData }) {
  const groups = skillGroups();
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  const top = github.topLanguages[0]?.name ?? "Python";

  return (
    <div className="flex flex-col justify-between w-full h-full gap-2 min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <p className="t-mono opacity-70">tools, daily</p>
        <p className="t-mono opacity-60 shrink-0">{total} total</p>
      </div>

      <h3
        className="t-display"
        style={{ fontSize: "clamp(24px, 3vw, 48px)", lineHeight: 0.94 }}
      >
        <SplitText delay={0.1}>{top}</SplitText>
        <span className="t-serif" style={{ color: "var(--orange)", fontSize: "0.55em" }}>
          {" "}
          <SplitText delay={0.4} className="t-serif">most used</SplitText>
        </span>
      </h3>

      <div className="flex flex-wrap gap-1">
        {profile.skills.frameworks.slice(0, 4).map((f) => (
          <span
            key={f}
            className="t-mono-xs px-1.5 py-0.5"
            style={{ border: "1px solid rgba(192,68,15,0.3)", borderRadius: 999 }}
          >
            {f}
          </span>
        ))}
      </div>
    </div>
  );
}

export function SkillsExpanded({ github }: { github: GithubData }) {
  const groups = skillGroups();
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="grid h-full" style={{ gridTemplateColumns: "1.1fr 2fr", gap: "clamp(24px,2.4vw,48px)" }}>
      <motion.div variants={fadeUp} className="flex flex-col justify-between gap-3 min-w-0">
        <div>
          <p className="t-mono opacity-70 mb-2">the stack</p>
          <h2 className="t-display" style={{ fontSize: "clamp(26px,3.4vw,58px)", lineHeight: 0.92 }}>
            <SplitText delay={0.1}>Pragmatic,</SplitText>
            <br />
            <SplitText className="t-serif" style={{ color: "var(--orange)" }} delay={0.36}>not</SplitText>{" "}
            <SplitText delay={0.55}>trendy.</SplitText>
          </h2>
        </div>
        <div>
          <p className="t-mono opacity-70 mb-1">measured on github</p>
          <div className="flex flex-wrap gap-1">
            {github.topLanguages.map((l) => (
              <span key={l.name} className="t-mono-xs px-1.5 py-0.5 inline-flex items-center gap-1" style={{ border: "1px solid rgba(192,68,15,0.3)", borderRadius: 999 }}>
                <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: langDots[l.name] ?? "var(--orange)" }} />
                {l.name} · {l.count}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="grid h-full gap-x-[clamp(14px,1.4vw,24px)] gap-y-[clamp(8px,1.2svh,14px)] min-h-0" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        {groups.map((g) => (
          <div key={g.key} className="flex flex-col pt-[clamp(6px,0.8svh,10px)] min-w-0" style={{ borderTop: "1px solid rgba(192,68,15,0.22)" }}>
            <div className="flex items-baseline justify-between mb-1">
              <p className="t-mono opacity-80">{g.key}</p>
              <p className="t-mono-xs opacity-50">{String(g.items.length).padStart(2, "0")}</p>
            </div>
            <ul className="flex flex-wrap gap-x-[clamp(6px,0.8vw,12px)] gap-y-0 min-w-0">
              {g.items.map((it) => (
                <li
                  key={it}
                  className="t-display text-[clamp(13px,1.2vw,20px)] min-w-0 max-w-full"
                  style={{ lineHeight: 1.05, overflowWrap: "break-word", wordBreak: "break-word" }}
                >
                  {it}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}
