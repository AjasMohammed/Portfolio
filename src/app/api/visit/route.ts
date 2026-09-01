import { NextResponse } from "next/server";
import { getVisitCount, logVisit } from "@/lib/visits";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const runtime = "nodejs";

type ClientMeta = {
  tz?: string;
  vp?: string;
  lang?: string;
  ref?: string;
};

function parseUA(ua: string) {
  let device = "desktop";
  if (/iPad|Tablet|PlayBook/i.test(ua)) device = "tablet";
  else if (/Mobi|Android|iPhone|iPod|webOS|BlackBerry/i.test(ua)) device = "mobile";

  let browser = "Other";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/OPR\/|Opera/i.test(ua)) browser = "Opera";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/Chrome\//i.test(ua)) browser = "Chrome";
  else if (/Safari\//i.test(ua)) browser = "Safari";

  let os = "Other";
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Mac OS X/i.test(ua)) os = "macOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  return { device, browser, os };
}

function cap(s: string | undefined | null, max: number): string | undefined {
  if (!s) return undefined;
  const t = s.trim();
  if (!t) return undefined;
  return t.length > max ? t.slice(0, max) : t;
}

export async function POST(request: Request) {
  // Local dev shares the production Redis via .env — read the counter but
  // don't inflate it. Set VISITS_LOG_IN_DEV=1 to test the write path.
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.VISITS_LOG_IN_DEV !== "1"
  ) {
    const count = await getVisitCount();
    return NextResponse.json({ ok: true, count: count ?? 0, dev: true });
  }

  if (!(await rateLimit("visit", clientIp(request), 10, 60))) {
    return NextResponse.json({ error: "too many requests" }, { status: 429 });
  }

  let client: ClientMeta = {};
  try {
    client = (await request.json()) as ClientMeta;
  } catch {
    // No JSON body — fine, we'll log just the headers we can see.
  }

  const h = request.headers;
  const ua = h.get("user-agent") ?? "";
  const { device, browser, os } = parseUA(ua);

  // Cloudflare puts geo on the request's `cf` object, not on headers — only
  // country is mirrored as a header (cf-ipcountry). There is no cf-ipcity or
  // cf-region header, so city/region have to come from `cf` or not at all.
  // Wrapped because getCloudflareContext() only resolves inside workerd.
  // Narrowed to the three fields logged rather than pulling in
  // @cloudflare/workers-types — its globals redefine fetch/Response and turn
  // res.json() into `unknown` across the client components.
  let cf: { country?: string; city?: string; region?: string } | undefined;
  try {
    cf = getCloudflareContext().cf as typeof cf;
  } catch {
    // Not on Workers (build-time analysis, `next start`) — headers only.
  }

  const country = cf?.country ?? h.get("cf-ipcountry") ?? undefined;
  const city = cf?.city ?? undefined;
  const region = cf?.region ?? undefined;

  const acceptLang = h.get("accept-language")?.split(",")[0]?.trim();
  const referer = h.get("referer") ?? undefined;

  const meta: Record<string, string> = {};
  const set = (k: string, v: string | undefined | null) => {
    const c = cap(v, 200);
    if (c) meta[k] = c;
  };
  set("ts", new Date().toISOString());
  set("country", country);
  set("city", city);
  set("region", region);
  set("device", device);
  set("browser", browser);
  set("os", os);
  set("tz", client.tz);
  set("vp", client.vp);
  set("lang", client.lang ?? acceptLang);
  set("ref", client.ref ?? referer);

  const count = await logVisit(meta);
  if (count === null) {
    return NextResponse.json(
      { error: "visits storage not configured" },
      { status: 503 },
    );
  }
  return NextResponse.json({ ok: true, count });
}
