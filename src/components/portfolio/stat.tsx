"use client";

import { useEffect, useState } from "react";

/* ───────────────────────── Stat / Atmosphere ───────────────────────── */

export function Stat({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: number | string;
  mono?: boolean;
}) {
  const num = typeof value === "number" ? <Counter to={value} /> : value;
  return (
    <div className="min-w-0">
      <p className="t-mono-xs" style={{ opacity: 0.65 }}>{label}</p>
      <p
        className={`${mono ? "t-mono" : "t-num"} mt-0.5 truncate`}
        style={{ fontSize: mono ? "clamp(11px,0.9vw,14px)" : "clamp(20px,2vw,32px)" }}
      >
        {num}
      </p>
    </div>
  );
}

/* Kochi wall clock as a leaf — it owns the 1s interval, so the tick re-renders
   only this text node, never the card embedding it. Renders the placeholder on
   the server and first client paint (a server-rendered time is stale by
   hydration, and the mismatch is a hydration error). */
const IST_CLOCK = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "Asia/Kolkata",
});

export function LiveClock({ placeholder = "--:--:--" }: { placeholder?: string }) {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setNow(IST_CLOCK.format(new Date()));
    // First reading via rAF: lands on the next paint without setting state
    // synchronously inside the effect body.
    const raf = requestAnimationFrame(tick);
    const id = setInterval(tick, 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, []);
  return <>{now ?? placeholder}</>;
}

export function Counter({ to, startDelay = 0 }: { to: number; startDelay?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    let startTime: number | null = null;
    const dur = 900;
    const step = (t: number) => {
      if (startTime === null) startTime = t;
      const p = Math.min(1, (t - startTime) / dur);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(eased * to));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    const delayMs = Math.max(0, startDelay * 1000);
    const timer = setTimeout(() => {
      raf = requestAnimationFrame(step);
    }, delayMs);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [to, startDelay]);
  return <>{n}</>;
}
