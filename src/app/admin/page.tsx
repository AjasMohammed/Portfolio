import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, unauthorized } from "next/navigation";
import Link from "next/link";
import { timingSafeEqual } from "node:crypto";
import { getRecentVisits, getVisitCount, type Visit } from "@/lib/visits";
import { Bars, DailyChart, HourGrid, type BarItem, type DayPoint } from "./charts";

// Reads Redis on every request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "visits",
  robots: { index: false, follow: false },
};

// ponytail: hardcoded; make it ADMIN_TZ env if you ever move.
const TZ = "Asia/Kolkata";
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const RANGES = {
  "24h": { label: "24 hours", days: 1 },
  "7d": { label: "7 days", days: 7 },
  "30d": { label: "30 days", days: 30 },
  all: { label: "All", days: Infinity },
} as const;
type RangeKey = keyof typeof RANGES;

// Everything in the log that isn't a real inbound link.
const SELF_HOST = /ajasmohammed|localhost|\.vercel\.app$|^vercel\.com$/i;
// AS orgs that are datacenters, not people. Only fills for rows logged after
// the `isp` field shipped; older rows can't be classified.
const HOSTING =
  /amazon|aws|google|microsoft|azure|digitalocean|hetzner|ovh|linode|akamai|oracle|cloudflare|alibaba|tencent|vultr|contabo|fastly|leaseweb/i;

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
    ip, country, city, region, isp, device, os, browser, lang, vp,
    t,
    day: dayFmt.format(d),
    weekday: Math.max(0, WEEKDAYS.indexOf(parts.weekday)),
    hour: Number(parts.hour) % 24,
    refhost,
    bot: HOSTING.test(v.isp ?? ""),
    where: [v.city, v.region, v.country].filter(Boolean).join(", ") || "—",
  };
}

/* ───────────────────────── filters ───────────────────────── */

// Every dimension that can be clicked into a filter. Order = card order.
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

const UNKNOWN = "unknown";
const valueOf = (r: Row, k: Dim) => String(r[k] ?? "") || UNKNOWN;

function tally(rows: Row[], key: Dim, top = 8) {
  const m = new Map<string, number>();
  for (const r of rows) m.set(valueOf(r, key), (m.get(valueOf(r, key)) ?? 0) + 1);
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
      client: [rs[0].device, rs[0].os, rs[0].browser].filter(Boolean).join(" · "),
      bot: rs[0].bot,
    }))
    .sort((a, b) => b.visits - a.visits || b.last - a.last);
}
type Visitor = ReturnType<typeof groupByIp>[number];

/** Current URL with one filter toggled — the whole page re-renders against it. */
function toggleHref(
  range: RangeKey,
  active: Partial<Record<Dim, string>>,
  key: Dim,
  value: string,
) {
  const q = new URLSearchParams();
  if (range !== "7d") q.set("range", range);
  for (const [k, v] of Object.entries(active)) if (k !== key) q.set(k, v);
  if (active[key] !== value) q.set(key, value);
  const s = q.toString();
  return s ? `/admin?${s}` : "/admin";
}

/** All Redis reading + shaping. Kept out of the component so the render stays pure. */
async function load(range: RangeKey, active: Partial<Record<Dim, string>>) {
  const [total, raw] = await Promise.all([getVisitCount(), getRecentVisits(1000)]);
  const all = raw.map(shape).filter((r): r is Row => r !== null);

  const now = Date.now();
  const days = RANGES[range].days;
  const since = days === Infinity ? 0 : now - days * 86_400_000;
  const inRange = all.filter((r) => r.t >= since);
  // Filters stack: a row must match every active dimension.
  const rows = inRange.filter((r) =>
    Object.entries(active).every(([k, v]) => valueOf(r, k as Dim) === v),
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

  const busiest = [...perDay.entries()].sort((a, b) => b[1] - a[1])[0];
  return { total, inRange, rows, daily, grid, busiest, visitors: groupByIp(rows) };
}

/* ───────────────────────── auth ───────────────────────── */

/**
 * HTTP Basic. The browser's native prompt is the whole login UI — no session,
 * no cookie, no form; it resends the credentials on every request for the rest
 * of the tab session. Username is ignored.
 */
async function requireAdmin() {
  const expected = process.env.ADMIN_PASSWORD;
  // Unset password = admin does not exist. 404 so the path gives nothing away.
  if (!expected) notFound();

  const [scheme, encoded] = ((await headers()).get("authorization") ?? "").split(" ");
  if (scheme === "Basic" && encoded) {
    const decoded = Buffer.from(encoded, "base64").toString();
    const supplied = decoded.slice(decoded.indexOf(":") + 1);
    const a = Buffer.from(supplied);
    const b = Buffer.from(expected);
    if (a.length === b.length && timingSafeEqual(a, b)) return;
  }
  unauthorized();
}

/* ───────────────────────── page ───────────────────────── */

export default async function Admin({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]);
  const rangeParam = one("range");
  const range: RangeKey =
    rangeParam && rangeParam in RANGES ? (rangeParam as RangeKey) : "7d";

  const active: Partial<Record<Dim, string>> = {};
  for (const [k] of DIMENSIONS) {
    const v = one(k);
    if (v) active[k] = v;
  }

  const { total, inRange, rows, daily, grid, busiest, visitors } = await load(
    range,
    active,
  );

  const n = rows.length;
  const bots = rows.filter((r) => r.bot).length;
  const mobile = rows.filter((r) => r.device !== "desktop").length;

  const rangeHref = (k: RangeKey) => {
    const q = new URLSearchParams();
    if (k !== "7d") q.set("range", k);
    for (const [dk, dv] of Object.entries(active)) q.set(dk, dv);
    const s = q.toString();
    return s ? `/admin?${s}` : "/admin";
  };

  return (
    // globals.css sets `overflow: hidden` on html/body for the fixed-viewport
    // portfolio, so this page has to be its own scroll container.
    <main className="h-full overflow-y-auto bg-ink px-6 py-8 font-sans text-cream">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cream-deep/70">
            all-time visits
          </p>
          <p className="text-5xl font-semibold leading-none">
            {total?.toLocaleString() ?? "?"}
          </p>
        </div>
        <nav className="flex gap-1 text-sm" aria-label="Time range">
          {(Object.keys(RANGES) as RangeKey[]).map((k) => (
            <Link
              key={k}
              href={rangeHref(k)}
              aria-current={k === range ? "page" : undefined}
              className={
                "rounded px-3 py-1.5 transition-colors " +
                (k === range ? "bg-orange text-ink" : "text-cream-deep hover:bg-cream/10")
              }
            >
              {RANGES[k].label}
            </Link>
          ))}
        </nav>
      </header>

      {/* One filter row, above everything it scopes. */}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-cream-deep/70">
          {Object.keys(active).length ? "Filtered by" : "Click any bar below to filter"}
        </span>
        {Object.entries(active).map(([k, v]) => (
          <Link
            key={k}
            href={toggleHref(range, active, k as Dim, v)}
            className="group flex items-center gap-1.5 rounded-full border border-orange/50 bg-orange/15 px-2.5 py-1 transition-colors hover:bg-orange/25"
          >
            <span className="text-cream-deep">{k}</span>
            <span className="font-medium">{v}</span>
            <span className="text-cream-deep group-hover:text-cream">×</span>
          </Link>
        ))}
        {Object.keys(active).length > 1 && (
          <Link
            href={range === "7d" ? "/admin" : `/admin?range=${range}`}
            className="rounded-full px-2 py-1 text-cream-deep underline decoration-dotted hover:text-cream"
          >
            clear all
          </Link>
        )}
      </div>

      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat
          label={range === "all" ? "Visits · in log" : `Visits · last ${RANGES[range].label}`}
          value={n.toLocaleString()}
          sub={n !== inRange.length ? `of ${inRange.length} before filters` : undefined}
        />
        <Stat
          label="Unique IPs"
          value={String(visitors.filter((v) => v.ip !== UNKNOWN).length)}
          sub={
            n
              ? `${(n / Math.max(1, visitors.length)).toFixed(1)} visits each`
              : undefined
          }
        />
        <Stat
          label="Busiest day"
          value={busiest?.[1] ? String(busiest[1]) : "—"}
          sub={busiest?.[1] ? busiest[0] : undefined}
        />
        <Stat
          label="Mobile / tablet"
          value={n ? `${Math.round((mobile / n) * 100)}%` : "—"}
          sub={`${mobile} of ${n}`}
        />
        <Stat
          label="Likely bots"
          value={n ? `${Math.round((bots / n) * 100)}%` : "—"}
          sub={`${bots} on hosting networks`}
        />
      </section>

      <Card title="Visits per day" className="mt-6">
        <DailyChart data={daily} />
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[3fr_2fr]">
        <Card title={`When people visit · weekday × hour (${TZ})`}>
          <HourGrid grid={grid} weekdays={WEEKDAYS} />
        </Card>
        <Card title="Screens">
          <Bars items={barItems(rows, "vp", range, active)} total={n} />
        </Card>
      </div>

      <section className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {DIMENSIONS.filter(([k]) => k !== "vp" && k !== "ip").map(([key, label]) => (
          <Card key={key} title={label}>
            <Bars items={barItems(rows, key, range, active)} total={n} />
          </Card>
        ))}
      </section>

      <Card
        title={`Visitors · ${visitors.length} unique ${visitors.length === 1 ? "address" : "addresses"} · click one to filter the whole page`}
        className="mt-6"
      >
        <VisitorTable
          visitors={visitors.slice(0, 100)}
          range={range}
          active={active}
        />
      </Card>

      <Card
        title={`Recent visits · showing ${Math.min(100, n)} of ${n} · the table every chart above is computed from`}
        className="mt-6"
      >
        <VisitTable rows={rows.slice(0, 100)} />
      </Card>
    </main>
  );
}

function barItems(
  rows: Row[],
  key: Dim,
  range: RangeKey,
  active: Partial<Record<Dim, string>>,
): BarItem[] {
  return tally(rows, key).map(([name, value]) => ({
    name,
    value,
    href: toggleHref(range, active, key, name),
    active: active[key] === name,
  }));
}

/* ───────────────────────── pieces ───────────────────────── */

function Card({
  title,
  className = "",
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`rounded-lg border border-cream/10 bg-cream/[0.03] p-4 ${className}`}>
      <h2 className="mb-3 text-sm text-cream-deep">{title}</h2>
      {children}
    </section>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-cream/10 bg-cream/[0.03] p-4">
      <p className="text-xs text-cream-deep">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {sub && <p className="text-xs text-cream-deep/70">{sub}</p>}
    </div>
  );
}

function VisitorTable({
  visitors,
  range,
  active,
}: {
  visitors: Visitor[];
  range: RangeKey;
  active: Partial<Record<Dim, string>>;
}) {
  if (!visitors.length)
    return <p className="text-sm text-cream-deep/70">no visits match these filters</p>;
  const max = Math.max(...visitors.map((v) => v.visits));
  return (
    <div className="overflow-x-auto">
      <table className="w-full whitespace-nowrap text-left text-xs tabular-nums">
        <thead className="text-cream-deep">
          <tr>
            {["IP", "Visits", "Days", "First seen", "Last seen", "Location", "Network", "Client"].map(
              (h) => (
                <th key={h} className="pb-2 pr-4 font-normal">
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {visitors.map((v) => (
            <tr
              key={v.ip}
              className={
                "border-t border-cream/10 " +
                (active.ip === v.ip ? "bg-cream/10" : "hover:bg-cream/5") +
                (v.bot ? " text-cream-deep/60" : "")
              }
            >
              <td className="py-1.5 pr-4">
                <Link
                  href={toggleHref(range, active, "ip", v.ip)}
                  className="rounded outline-none hover:text-orange focus-visible:ring-1 focus-visible:ring-cream"
                >
                  {active.ip === v.ip && <span className="mr-1 text-orange">✓</span>}
                  {v.ip}
                </Link>
              </td>
              {/* Bar in the cell: relative frequency without a second chart. */}
              <td className="py-1.5 pr-4">
                <span className="flex items-center gap-2">
                  <span className="w-6 text-right">{v.visits}</span>
                  <span
                    className="h-1.5 rounded-r-[3px] bg-orange"
                    style={{ width: `${(v.visits / max) * 48}px` }}
                  />
                </span>
              </td>
              <td className="pr-4">{v.days}</td>
              <td className="pr-4">{timeFmt.format(new Date(v.first))}</td>
              <td className="pr-4">{timeFmt.format(new Date(v.last))}</td>
              <td className="max-w-[16rem] truncate pr-4">{v.where}</td>
              <td className="max-w-[12rem] truncate pr-4">
                {v.isp ?? "—"}
                {v.bot && <span className="ml-1 rounded bg-cream/10 px-1">bot?</span>}
              </td>
              <td className="pr-4">{v.client}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {visitors.some((v) => v.ip === UNKNOWN) && (
        <p className="mt-3 text-xs text-cream-deep/70">
          <b>unknown</b> = visits logged before IP capture shipped.
        </p>
      )}
    </div>
  );
}

function VisitTable({ rows }: { rows: Row[] }) {
  if (!rows.length)
    return <p className="text-sm text-cream-deep/70">no visits match these filters</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full whitespace-nowrap text-left text-xs tabular-nums">
        <thead className="text-cream-deep">
          <tr>
            {["Time", "IP", "Location", "Network", "Client", "Screen", "Lang", "From"].map((h) => (
              <th key={h} className="pb-2 pr-4 font-normal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              className={
                "border-t border-cream/10 hover:bg-cream/5 " +
                (r.bot ? "text-cream-deep/60" : "")
              }
            >
              <td className="py-1.5 pr-4">{timeFmt.format(new Date(r.t))}</td>
              <td className="pr-4">{r.ip ?? "—"}</td>
              <td className="max-w-[16rem] truncate pr-4">{r.where}</td>
              <td className="max-w-[12rem] truncate pr-4">
                {r.isp ?? "—"}
                {r.bot && <span className="ml-1 rounded bg-cream/10 px-1">bot?</span>}
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
