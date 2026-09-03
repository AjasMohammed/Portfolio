import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getRecentVisits, getVisitCount, type Visit } from "@/lib/visits";
import { isAdmin } from "@/lib/admin-auth";
import { logout } from "./actions";
import {
  Bars,
  DailyChart,
  HourGrid,
  type BarItem,
  type DayPoint,
} from "./charts";

// Reads Redis on every request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Analytics",
  robots: { index: false, follow: false },
};

// ponytail: hardcoded; make it ADMIN_TZ env if you ever move.
const TZ = "Asia/Kolkata";
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const RANGES = {
  "24h": { label: "24h", long: "24 hours", days: 1 },
  "7d": { label: "7d", long: "7 days", days: 7 },
  "30d": { label: "30d", long: "30 days", days: 30 },
  all: { label: "All", long: "all time", days: Infinity },
} as const;
type RangeKey = keyof typeof RANGES;
const DEFAULT_RANGE: RangeKey = "7d";

// Everything in the log that isn't a real inbound link.
const SELF_HOST = /ajasmohammed|localhost|\.vercel\.app$|^vercel\.com$/i;
// AS orgs that are datacenters, not people. Only fills for rows logged after
// the `isp` field shipped; older rows lean on the client tells below.
const HOSTING =
  /amazon|aws|google|microsoft|azure|digitalocean|hetzner|ovh|linode|akamai|oracle|cloudflare|alibaba|tencent|vultr|contabo|fastly|leaseweb/i;

/**
 * Datacenter AS org is the clean signal, but it is missing on every row logged
 * before it shipped, so fall back to what a headless client gives away anyway:
 * a container clock (real browsers report a city zone, never bare UTC), a POSIX
 * locale no browser emits, headless Chrome's default 800x600, or a spoofed UA
 * that contradicts the viewport it reports alongside it.
 * ponytail: heuristic, so the UI says "bot?" — tighten only if it misfires.
 */
function looksAutomated(v: Visit): boolean {
  if (HOSTING.test(v.isp ?? "")) return true;
  if (/@posix$/i.test(v.lang ?? "")) return true;
  if (v.tz === "UTC" || v.tz === "Etc/Unknown") return true;
  if (v.vp === "800x600") return true;
  const w = Number(v.vp?.split("x")[0]);
  if (!w) return false;
  // Phone UA at desktop width, or desktop UA at phone width.
  return v.device === "mobile" ? w >= 1024 : w < 500;
}

/* ───────────────────────── data shaping ───────────────────────── */

type Row = {
  ip?: string;
  country?: string;
  city?: string;
  region?: string;
  isp?: string;
  device?: string;
  os?: string;
  browser?: string;
  lang?: string;
  vp?: string;
  t: number;
  day: string;
  weekday: number;
  hour: number;
  refhost: string;
  bot: boolean;
  where: string;
};

const dayFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const dayLabelFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  weekday: "short",
  month: "short",
  day: "numeric",
});
const partsFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  weekday: "short",
  hour: "numeric",
  hour12: false,
});
const timeFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function shape(v: Visit): Row | null {
  const t = Date.parse(v.ts);
  if (Number.isNaN(t)) return null;
  const d = new Date(t);
  const parts = Object.fromEntries(
    partsFmt.formatToParts(d).map((p) => [p.type, p.value]),
  );
  let refhost = "direct";
  if (v.ref) {
    try {
      const host = new URL(v.ref).hostname.replace(/^www\./, "");
      refhost = SELF_HOST.test(host) ? "self (reload / nav)" : host;
    } catch {
      refhost = v.ref;
    }
  }
  const { ip, country, city, region, isp, device, os, browser, lang, vp } = v;
  return {
    ip,
    country,
    city,
    region,
    isp,
    device,
    os,
    browser,
    lang,
    vp,
    t,
    day: dayFmt.format(d),
    weekday: Math.max(0, WEEKDAYS.indexOf(parts.weekday)),
    hour: Number(parts.hour) % 24,
    refhost,
    bot: looksAutomated(v),
    where: [v.city, v.region, v.country].filter(Boolean).join(", ") || "—",
  };
}

/* ───────────────────────── filters ───────────────────────── */

// Every dimension that can be clicked into a filter.
const DIMENSIONS = [
  ["ip", "IP"],
  ["country", "Country"],
  ["city", "City"],
  ["refhost", "Referrer"],
  ["browser", "Browser"],
  ["os", "OS"],
  ["device", "Device"],
  ["isp", "Network"],
  ["lang", "Language"],
  ["vp", "Screen"],
] as const;
type Dim = (typeof DIMENSIONS)[number][0];
type Active = Partial<Record<Dim, string>>;
const LABEL = Object.fromEntries(DIMENSIONS) as Record<Dim, string>;
// Cards in the small-multiples grid. Country and Referrer get their own slot
// beside the charts; IP is the visitors table.
const SMALL: Dim[] = ["browser", "os", "device", "isp", "lang", "vp", "city"];

const UNKNOWN = "unknown";
const valueOf = (r: Row, k: Dim) => String(r[k] ?? "") || UNKNOWN;

function tally(rows: Row[], key: Dim, top = 7) {
  const m = new Map<string, number>();
  for (const r of rows)
    m.set(valueOf(r, key), (m.get(valueOf(r, key)) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, top);
}

/**
 * One row per IP: how often they came back, and when. Rows come newest-first
 * out of Redis, so rs[0] is that visitor's latest visit.
 */
function groupByIp(rows: Row[]) {
  const m = new Map<string, Row[]>();
  for (const r of rows) {
    const ip = r.ip ?? UNKNOWN;
    const list = m.get(ip);
    if (list) list.push(r);
    else m.set(ip, [r]);
  }
  return [...m.values()]
    .map((rs) => ({
      ip: rs[0].ip ?? UNKNOWN,
      visits: rs.length,
      days: new Set(rs.map((r) => r.day)).size,
      first: rs[rs.length - 1].t,
      last: rs[0].t,
      where: rs[0].where,
      isp: rs[0].isp,
      client: [rs[0].device, rs[0].os, rs[0].browser]
        .filter(Boolean)
        .join(" · "),
      bot: rs[0].bot,
    }))
    .sort((a, b) => b.visits - a.visits || b.last - a.last);
}
type Visitor = ReturnType<typeof groupByIp>[number];

function href(range: RangeKey, active: Active) {
  const q = new URLSearchParams();
  if (range !== DEFAULT_RANGE) q.set("range", range);
  for (const [k, v] of Object.entries(active)) q.set(k, v);
  const s = q.toString();
  return s ? `/admin?${s}` : "/admin";
}

/** Current URL with one filter toggled — the whole page re-renders against it. */
function toggleHref(range: RangeKey, active: Active, key: Dim, value: string) {
  const next: Active = { ...active };
  if (next[key] === value) delete next[key];
  else next[key] = value;
  return href(range, next);
}

/** All Redis reading + shaping. Kept out of the component so the render stays pure. */
async function load(range: RangeKey, active: Active) {
  const [total, raw] = await Promise.all([
    getVisitCount(),
    getRecentVisits(1000),
  ]);
  const all = raw.map(shape).filter((r): r is Row => r !== null);
  // Filters stack: a row must match every active dimension.
  const matches = (r: Row) =>
    Object.entries(active).every(([k, v]) => valueOf(r, k as Dim) === v);

  const now = Date.now();
  const days = RANGES[range].days;
  const since = days === Infinity ? 0 : now - days * 86_400_000;
  const inRange = all.filter((r) => r.t >= since);
  const rows = inRange.filter(matches);
  // Same-length window immediately before, for the KPI deltas. Null for "all".
  const prev =
    days === Infinity
      ? null
      : all.filter(
          (r) => r.t >= since - days * 86_400_000 && r.t < since && matches(r),
        );

  // Daily buckets, zero-filled across the range so quiet days show as gaps.
  const start = days === Infinity ? (inRange.at(-1)?.t ?? now) : since;
  const perDay = new Map<string, number>();
  for (let t = start; t <= now; t += 86_400_000) {
    perDay.set(dayFmt.format(new Date(t)), 0);
  }
  for (const r of rows) perDay.set(r.day, (perDay.get(r.day) ?? 0) + 1);
  const daily: DayPoint[] = [...perDay.entries()].map(([day, count]) => ({
    day,
    count,
    label: dayLabelFmt.format(new Date(`${day}T12:00:00Z`)),
  }));

  const grid = Array.from({ length: 7 }, () => new Array<number>(24).fill(0));
  for (const r of rows) grid[r.weekday][r.hour] += 1;

  return { total, inRange, rows, prev, daily, grid, visitors: groupByIp(rows) };
}

/** The numbers every KPI card is built from, for one set of rows. */
function measure(rows: Row[]) {
  const n = rows.length;
  const byIp = groupByIp(rows).filter((v) => v.ip !== UNKNOWN);
  const returning = byIp.filter((v) => v.visits > 1).length;
  return {
    visits: n,
    visitors: byIp.length,
    returning: byIp.length ? returning / byIp.length : 0,
    mobile: n ? rows.filter((r) => r.device !== "desktop").length / n : 0,
    bots: n ? rows.filter((r) => r.bot).length / n : 0,
  };
}

/* ───────────────────────── page ───────────────────────── */

export default async function Admin({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!process.env.ADMIN_PASSWORD) notFound();
  if (!(await isAdmin())) redirect("/admin/login");

  const sp = await searchParams;
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]);
  const rangeParam = one("range");
  const range: RangeKey =
    rangeParam && rangeParam in RANGES
      ? (rangeParam as RangeKey)
      : DEFAULT_RANGE;

  const active: Active = {};
  for (const [k] of DIMENSIONS) {
    const v = one(k);
    if (v) active[k] = v;
  }

  const { total, inRange, rows, prev, daily, grid, visitors } = await load(
    range,
    active,
  );
  const cur = measure(rows);
  const before = prev ? measure(prev) : null;
  const filters = Object.entries(active) as [Dim, string][];
  const vs = before
    ? `vs previous ${RANGES[range].long}`
    : "no comparison for all time";
  const bars = (key: Dim, top?: number): BarItem[] =>
    tally(rows, key, top).map(([name, value]) => ({
      name,
      value,
      href: toggleHref(range, active, key, name),
      active: active[key] === name,
    }));

  return (
    // globals.css sets `overflow: hidden` on html/body for the fixed-viewport
    // portfolio, so this page has to be its own scroll container.
    <div className="h-full overflow-y-auto bg-ink font-sans text-cream">
      <header className="sticky top-0 z-20 border-b border-cream/10 bg-ink/90 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div className="flex items-baseline gap-3">
            <h1 className="text-base font-semibold">Analytics</h1>
            <span className="text-xs text-cream/50">
              ajasmohammed.space · {total?.toLocaleString() ?? "?"} visits all
              time
            </span>
          </div>
          <div className="flex items-center gap-3">
            <nav
              aria-label="Time range"
              className="flex rounded-lg border border-cream/10 bg-cream/[0.04] p-0.5 text-xs"
            >
              {(Object.keys(RANGES) as RangeKey[]).map((k) => (
                <Link
                  key={k}
                  href={href(k, active)}
                  aria-current={k === range ? "page" : undefined}
                  className={
                    "rounded-md px-3 py-1.5 transition-colors " +
                    (k === range
                      ? "bg-cream/10 font-medium text-cream"
                      : "text-cream/60 hover:text-cream")
                  }
                >
                  {RANGES[k].label}
                </Link>
              ))}
            </nav>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-md px-2 py-1.5 text-xs text-cream/60 transition-colors hover:text-cream"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="space-y-4 px-6 py-5">
        {/* One filter row, above everything it scopes. */}
        <div className="flex min-h-7 flex-wrap items-center gap-2 text-xs">
          <span className="text-cream/50">
            {filters.length
              ? "Filtered by"
              : "Click any bar or row below to filter"}
          </span>
          {filters.map(([k, v]) => (
            <Link
              key={k}
              href={toggleHref(range, active, k, v)}
              className="group flex items-center gap-1.5 rounded-full border border-orange/40 bg-orange/10 py-1 pr-2 pl-2.5 transition-colors hover:bg-orange/20"
            >
              <span className="text-cream/60">{LABEL[k]}</span>
              <span className="font-medium">{v}</span>
              <span
                aria-label="remove"
                className="text-cream/50 group-hover:text-cream"
              >
                ×
              </span>
            </Link>
          ))}
          {filters.length > 1 && (
            <Link
              href={href(range, {})}
              className="px-1 text-cream/50 underline decoration-dotted underline-offset-2 hover:text-cream"
            >
              clear all
            </Link>
          )}
        </div>

        {/* KPIs — what a five-second look should leave behind. */}
        <section className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          <Kpi
            label="Visits"
            value={cur.visits.toLocaleString()}
            sub={
              cur.visits !== inRange.length
                ? `of ${inRange.length.toLocaleString()} before filters`
                : `last ${RANGES[range].long}`
            }
            delta={<Delta now={cur.visits} prev={before?.visits} vs={vs} />}
          >
            <Sparkline points={daily.map((d) => d.count)} />
          </Kpi>
          <Kpi
            label="Unique visitors"
            value={cur.visitors.toLocaleString()}
            sub={
              cur.visitors
                ? `${(cur.visits / cur.visitors).toFixed(1)} visits each`
                : "by IP · logged from the next deploy"
            }
            delta={<Delta now={cur.visitors} prev={before?.visitors} vs={vs} />}
          />
          <Kpi
            label="Returning"
            value={pct(cur.returning)}
            sub="visitors seen more than once"
            delta={
              <Delta
                now={cur.returning}
                prev={before?.returning}
                vs={vs}
                points
              />
            }
          />
          <Kpi
            label="Mobile / tablet"
            value={pct(cur.mobile)}
            sub="share of visits"
            delta={
              <Delta
                now={cur.mobile}
                prev={before?.mobile}
                vs={vs}
                points
                neutral
              />
            }
          />
          <Kpi
            label="Likely bots"
            value={pct(cur.bots)}
            sub="hosting network or headless tells"
            delta={
              <Delta now={cur.bots} prev={before?.bots} vs={vs} points invert />
            }
          />
        </section>

        {/* Trends. */}
        <section className="grid grid-cols-12 gap-4">
          <Card className="col-span-12 xl:col-span-8" title="Visits per day">
            <DailyChart data={daily} />
          </Card>
          <Card
            className="col-span-12 md:col-span-6 xl:col-span-4"
            title="Countries"
          >
            <Bars items={bars("country")} total={cur.visits} />
          </Card>
          <Card
            className="col-span-12 xl:col-span-8"
            title="Activity by weekday and hour"
            meta={TZ}
          >
            <HourGrid grid={grid} weekdays={WEEKDAYS} />
          </Card>
          <Card
            className="col-span-12 md:col-span-6 xl:col-span-4"
            title="Referrers"
          >
            <Bars items={bars("refhost")} total={cur.visits} />
          </Card>
        </section>

        {/* Small multiples. */}
        <section className="grid grid-cols-12 gap-4">
          {SMALL.map((key) => (
            <Card
              key={key}
              className="col-span-12 sm:col-span-6 xl:col-span-3"
              title={LABEL[key]}
            >
              <Bars items={bars(key, 5)} total={cur.visits} />
            </Card>
          ))}
        </section>

        {/* Detail. */}
        <Card
          title="Visitors"
          meta={`${visitors.length} ${visitors.length === 1 ? "address" : "addresses"} · by visits`}
        >
          <VisitorTable
            visitors={visitors.slice(0, 100)}
            range={range}
            active={active}
          />
        </Card>
        <Card
          title="Recent visits"
          meta={`${Math.min(100, cur.visits)} of ${cur.visits} · the rows every chart above is computed from`}
        >
          <VisitTable rows={rows.slice(0, 100)} />
        </Card>
      </main>
    </div>
  );
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

/* ───────────────────────── pieces ───────────────────────── */

function Card({
  title,
  meta,
  className = "",
  children,
}: {
  title: string;
  meta?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-xl border border-cream/10 bg-cream/[0.04] p-5 ${className}`}
    >
      <header className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium">{title}</h2>
        {meta && <span className="truncate text-xs text-cream/50">{meta}</span>}
      </header>
      {children}
    </section>
  );
}

/** Label → value → comparison → context, same order on every card. */
function Kpi({
  label,
  value,
  sub,
  delta,
  children,
}: {
  label: string;
  value: string;
  sub: string;
  delta: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-cream/10 bg-cream/[0.04] p-5">
      <p className="text-xs font-medium text-cream/60">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-4">
        <p className="text-3xl font-semibold tabular-nums tracking-tight">
          {value}
        </p>
        {children && (
          <div className="w-24 shrink-0 pb-1 text-orange/70">{children}</div>
        )}
      </div>
      <div className="mt-2">{delta}</div>
      <p className="mt-1 text-xs text-cream/50">{sub}</p>
    </div>
  );
}

/**
 * Change against the previous window. Counts compare as a percentage; shares
 * (`points`) as percentage points, since "+50% of a 2% share" misleads.
 * `invert` = down is good (bots). `neutral` = neither direction is good.
 */
function Delta({
  now,
  prev,
  vs,
  points = false,
  invert = false,
  neutral = false,
}: {
  now: number;
  prev?: number;
  vs: string;
  points?: boolean;
  invert?: boolean;
  neutral?: boolean;
}) {
  const muted = "text-xs text-cream/40";
  if (prev === undefined) return <p className={muted}>{vs}</p>;

  let text: string;
  let dir = Math.sign(now - prev);
  if (points) {
    const d = Math.round((now - prev) * 100);
    dir = Math.sign(d);
    text = d === 0 ? "no change" : `${d > 0 ? "+" : ""}${d} pts`;
  } else if (prev === 0) {
    text = now === 0 ? "no change" : "new";
  } else {
    const d = Math.round(((now - prev) / prev) * 100);
    dir = Math.sign(d);
    text = d === 0 ? "no change" : `${d > 0 ? "+" : ""}${d}%`;
  }

  const good = invert ? dir < 0 : dir > 0;
  const color =
    dir === 0 || neutral
      ? "text-cream/60"
      : good
        ? "text-emerald-400"
        : "text-rose-400";
  return (
    <p className="flex items-baseline gap-1.5 text-xs">
      <span className={`font-medium tabular-nums ${color}`}>
        {dir > 0 ? "▲ " : dir < 0 ? "▼ " : ""}
        {text}
      </span>
      <span className="text-cream/40">{vs}</span>
    </p>
  );
}

/** Server-rendered trend line. Decoration only — the daily chart below has the numbers. */
function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const w = 96;
  const h = 28;
  const max = Math.max(1, ...points);
  const d = points
    .map(
      (v, i) =>
        `${(i / (points.length - 1)) * w},${h - 1 - (v / max) * (h - 2)}`,
    )
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-7 w-full"
      preserveAspectRatio="none"
      aria-hidden
    >
      <polyline
        points={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

const TH =
  "pb-2 pr-4 text-left text-[11px] font-medium tracking-wider text-cream/50 uppercase";
const TR = "border-t border-cream/[0.06] hover:bg-cream/[0.04]";

function VisitorTable({
  visitors,
  range,
  active,
}: {
  visitors: Visitor[];
  range: RangeKey;
  active: Active;
}) {
  if (!visitors.length) return <Empty />;
  const max = Math.max(...visitors.map((v) => v.visits));
  return (
    <>
      <div className="overflow-x-auto overflow-y-hidden">
        <table className="w-full whitespace-nowrap text-[13px] tabular-nums">
          <thead>
            <tr>
              {[
                "IP",
                "Visits",
                "Days",
                "First seen",
                "Last seen",
                "Location",
                "Network",
                "Client",
              ].map((h) => (
                <th key={h} className={TH}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visitors.map((v) => (
              <tr
                key={v.ip}
                className={
                  TR +
                  (active.ip === v.ip ? " bg-cream/[0.07]" : "") +
                  (v.bot ? " text-cream/50" : "")
                }
              >
                <td className="py-2 pr-4 font-mono text-xs">
                  <Link
                    href={toggleHref(range, active, "ip", v.ip)}
                    className="rounded outline-none hover:text-orange focus-visible:ring-1 focus-visible:ring-cream"
                  >
                    {active.ip === v.ip && (
                      <span className="mr-1 text-orange">✓</span>
                    )}
                    {v.ip}
                  </Link>
                </td>
                {/* Bar in the cell: relative frequency without a second chart. */}
                <td className="py-2 pr-4">
                  <span className="flex items-center gap-2">
                    <span className="w-6 text-right">{v.visits}</span>
                    <span
                      className="h-1.5 rounded-r-[3px] bg-orange"
                      style={{ width: `${(v.visits / max) * 56}px` }}
                    />
                  </span>
                </td>
                <td className="pr-4">{v.days}</td>
                <td className="pr-4 text-cream/70">
                  {timeFmt.format(new Date(v.first))}
                </td>
                <td className="pr-4 text-cream/70">
                  {timeFmt.format(new Date(v.last))}
                </td>
                <td className="max-w-[16rem] truncate pr-4">{v.where}</td>
                <td className="max-w-[12rem] truncate pr-4">
                  {v.isp ?? "—"}
                  {v.bot && <Tag>bot?</Tag>}
                </td>
                <td className="pr-4">{v.client}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {visitors.some((v) => v.ip === UNKNOWN) && (
        <p className="mt-3 text-xs text-cream/50">
          <b className="font-medium text-cream/70">unknown</b> = visits logged
          before IP capture shipped.
        </p>
      )}
    </>
  );
}

function VisitTable({ rows }: { rows: Row[] }) {
  if (!rows.length) return <Empty />;
  return (
    <div className="overflow-x-auto overflow-y-hidden">
      <table className="w-full whitespace-nowrap text-[13px] tabular-nums">
        <thead>
          <tr>
            {[
              "Time",
              "IP",
              "Location",
              "Network",
              "Client",
              "Screen",
              "Lang",
              "From",
            ].map((h) => (
              <th key={h} className={TH}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={TR + (r.bot ? " text-cream/50" : "")}>
              <td className="py-2 pr-4 text-cream/70">
                {timeFmt.format(new Date(r.t))}
              </td>
              <td className="pr-4 font-mono text-xs">{r.ip ?? "—"}</td>
              <td className="max-w-[16rem] truncate pr-4">{r.where}</td>
              <td className="max-w-[12rem] truncate pr-4">
                {r.isp ?? "—"}
                {r.bot && <Tag>bot?</Tag>}
              </td>
              <td className="pr-4">
                {[r.device, r.os, r.browser].filter(Boolean).join(" · ")}
              </td>
              <td className="pr-4">{r.vp ?? ""}</td>
              <td className="pr-4">{r.lang ?? ""}</td>
              <td className="max-w-[14rem] truncate pr-4">{r.refhost}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-1.5 rounded bg-cream/10 px-1 py-px text-[10px] text-cream/70">
      {children}
    </span>
  );
}

function Empty() {
  return (
    <p className="text-sm text-cream/50">No visits match these filters.</p>
  );
}
