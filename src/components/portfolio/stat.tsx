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
