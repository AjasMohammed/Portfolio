"use client";

import { useState, type ReactNode } from "react";

/* ───────────────────────── tooltip ───────────────────────── */

type TipState = { x: number; y: number; body: ReactNode } | null;

/**
 * Anchors the tooltip to the hovered mark's box rather than the pointer, so it
 * doesn't jitter and works identically for keyboard focus.
 */
function useTip() {
  const [tip, setTip] = useState<TipState>(null);
  const show = (e: { currentTarget: EventTarget | null }, body: ReactNode) => {
    const el = e.currentTarget as HTMLElement | null;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setTip({ x: r.left + r.width / 2, y: r.top, body });
  };
  return { tip, show, hide: () => setTip(null) };
}

function Tip({ tip }: { tip: TipState }) {
  if (!tip) return null;
  return (
    <div
      role="tooltip"
      className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-[calc(100%+10px)] whitespace-nowrap rounded-md border border-cream/15 bg-[#31201a] px-2.5 py-1.5 text-xs shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
      style={{ left: tip.x, top: tip.y }}
    >
      {tip.body}
    </div>
  );
}

/** Value leads, label follows — the reader already knows which mark they're on. */
function TipRow({ value, label }: { value: string; label: string }) {
  return (
    <>
      <span className="font-semibold tabular-nums text-cream">{value}</span>{" "}
      <span className="text-cream-deep">{label}</span>
    </>
  );
}

const plural = (n: number) => `${n} visit${n === 1 ? "" : "s"}`;

/* ───────────────────────── daily bars ───────────────────────── */

function niceMax(v: number) {
  if (v <= 5) return 5;
  const p = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / p) * p;
}

export type DayPoint = { day: string; label: string; count: number };

export function DailyChart({ data }: { data: DayPoint[] }) {
  const { tip, show, hide } = useTip();
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(1, ...data.map((d) => d.count)));
  const peak = Math.max(...data.map((d) => d.count));
  const ticks = [max, max / 2, 0];
  // Cap x-labels at ~8 so they never collide.
  const every = Math.max(1, Math.ceil(data.length / 8));

  return (
    <div className="flex gap-2">
      <Tip tip={tip} />
      <div className="relative w-8 shrink-0 text-right text-[10px] tabular-nums text-cream-deep/70">
        {ticks.map((t) => (
          <span
            key={t}
            className="absolute right-0 -translate-y-1/2"
            style={{ top: `${(1 - t / max) * 160}px` }}
          >
            {t}
          </span>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <div className="relative h-40" onMouseLeave={() => { hide(); setHover(null); }}>
          {ticks.map((t) => (
            <div
              key={t}
              className="absolute inset-x-0 border-t border-cream/10"
              style={{ top: `${(1 - t / max) * 100}%` }}
            />
          ))}
          <div className="absolute inset-0 flex items-end gap-[2px]">
            {data.map((d, i) => (
              <button
                key={d.day}
                type="button"
                aria-label={`${d.label}: ${plural(d.count)}`}
                // The whole column is the hit target, not the painted bar.
                className="relative flex h-full flex-1 cursor-default items-end justify-center outline-none"
                onMouseEnter={(e) => {
                  setHover(i);
                  show(e, <TipRow value={String(d.count)} label={`visits · ${d.label}`} />);
                }}
                onFocus={(e) => {
                  setHover(i);
                  show(e, <TipRow value={String(d.count)} label={`visits · ${d.label}`} />);
                }}
                onBlur={() => { hide(); setHover(null); }}
              >
                {hover === i && <span className="absolute inset-0 bg-cream/[0.07]" />}
                {d.count === peak && d.count > 0 && (
                  <span className="absolute -top-4 text-[10px] tabular-nums text-cream-deep">
                    {d.count}
                  </span>
                )}
                <span
                  className={
                    "w-full max-w-6 rounded-t-[4px] transition-colors " +
                    (hover === i ? "bg-orange-soft" : "bg-orange")
                  }
                  style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count ? 2 : 0 }}
                />
              </button>
            ))}
          </div>
        </div>
        {/* Absolutely placed so a label is never squeezed by its bar's width. */}
        <div className="relative mt-1 h-4 text-[10px] text-cream-deep/70">
          {data.map((d, i) =>
            i % every === 0 || i === data.length - 1 ? (
              <span
                key={d.day}
                className="absolute -translate-x-1/2 whitespace-nowrap"
                style={{ left: `${((i + 0.5) / data.length) * 100}%` }}
              >
                {d.day.slice(5)}
              </span>
            ) : null,
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── weekday × hour heatmap ───────────────────────── */

// Same ramp as the GitHub contribution heatmap on the public page.
const LEVELS = [
  "rgba(192,68,15,0.08)",
  "rgba(240,128,71,0.40)",
  "rgba(234,90,26,0.65)",
  "rgba(234,90,26,0.85)",
  "rgba(192,68,15,1)",
];

export function HourGrid({ grid, weekdays }: { grid: number[][]; weekdays: string[] }) {
  const { tip, show, hide } = useTip();
  const max = Math.max(1, ...grid.flat());
  const level = (v: number) =>
    v === 0 ? 0 : Math.min(4, 1 + Math.floor((v / max) * 3.999));
  return (
    <div className="overflow-x-auto">
      <Tip tip={tip} />
      <div
        className="grid min-w-[560px] gap-[2px] text-[10px] text-cream-deep/70"
        style={{ gridTemplateColumns: "2.5rem repeat(24, minmax(0, 1fr))" }}
        onMouseLeave={hide}
      >
        <div />
        {Array.from({ length: 24 }, (_, h) => (
          <div key={h} className="text-center">
            {h % 3 === 0 ? h : ""}
          </div>
        ))}
        {grid.map((row, d) => (
          <div key={d} className="contents">
            <div className="pr-2 leading-4">{weekdays[d]}</div>
            {row.map((v, h) => {
              const when = `${weekdays[d]} ${String(h).padStart(2, "0")}:00`;
              return (
                <button
                  key={h}
                  type="button"
                  aria-label={`${when}: ${plural(v)}`}
                  className="h-4 cursor-default rounded-[2px] outline-none transition-transform hover:scale-125 focus-visible:scale-125 focus-visible:ring-1 focus-visible:ring-cream"
                  style={{ background: LEVELS[level(v)] }}
                  onMouseEnter={(e) => show(e, <TipRow value={String(v)} label={`visits · ${when}`} />)}
                  onFocus={(e) => show(e, <TipRow value={String(v)} label={`visits · ${when}`} />)}
                  onBlur={hide}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-cream-deep/70">
        <span>less</span>
        {LEVELS.map((c) => (
          <span key={c} className="h-2.5 w-2.5 rounded-[2px]" style={{ background: c }} />
        ))}
        <span>more · peak {max}</span>
      </div>
    </div>
  );
}

/* ───────────────────────── breakdown bars ───────────────────────── */

export type BarItem = {
  name: string;
  value: number;
  href: string;
  active: boolean;
};

export function Bars({ items, total }: { items: BarItem[]; total: number }) {
  const { tip, show, hide } = useTip();
  const max = Math.max(1, ...items.map((i) => i.value));
  if (!items.length) return <p className="text-sm text-cream-deep/70">no data</p>;
  return (
    <ul className="space-y-1.5 text-sm" onMouseLeave={hide}>
      <Tip tip={tip} />
      {items.map((it) => {
        const pct = total ? Math.round((it.value / total) * 100) : 0;
        return (
          <li key={it.name}>
            <a
              href={it.href}
              className={
                "group grid grid-cols-[7.5rem_1fr_4.5rem] items-center gap-2 rounded px-1 py-0.5 outline-none focus-visible:ring-1 focus-visible:ring-cream " +
                (it.active ? "bg-cream/10" : "hover:bg-cream/5")
              }
              onMouseEnter={(e) =>
                show(
                  e,
                  <TipRow
                    value={`${it.value} (${pct}%)`}
                    label={`${it.name} · click to ${it.active ? "clear" : "filter"}`}
                  />,
                )
              }
              onFocus={(e) => show(e, <TipRow value={`${it.value} (${pct}%)`} label={it.name} />)}
              onBlur={hide}
            >
              <span className="truncate text-cream-deep group-hover:text-cream">
                {it.active && <span className="mr-1 text-orange">✓</span>}
                {it.name}
              </span>
              <span
                className={
                  "h-2.5 rounded-r-[4px] transition-colors " +
                  (it.active ? "bg-orange-soft" : "bg-orange group-hover:bg-orange-soft")
                }
                style={{ width: `${(it.value / max) * 100}%` }}
              />
              <span className="text-right tabular-nums">
                {it.value}
                <span className="ml-1 text-cream-deep/60">{pct}%</span>
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
