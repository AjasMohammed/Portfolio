import { NextResponse } from "next/server";
import { logVisit } from "@/lib/visits";

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

function decodeIfEncoded(v: string | undefined): string | undefined {
  if (!v) return v;
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

export async function POST(request: Request) {
  let client: ClientMeta = {};
  try {
    client = (await request.json()) as ClientMeta;
  } catch {
    // No JSON body — fine, we'll log just the headers we can see.
  }

  const h = request.headers;
  const ua = h.get("user-agent") ?? "";
  const { device, browser, os } = parseUA(ua);

  const country =
    h.get("x-vercel-ip-country") ??
    h.get("cf-ipcountry") ??
    h.get("x-country-code") ??
    undefined;
  const city =
    decodeIfEncoded(h.get("x-vercel-ip-city") ?? undefined) ??
    h.get("cf-ipcity") ??
    undefined;
  const region =
    h.get("x-vercel-ip-country-region") ??
    h.get("cf-region") ??
    h.get("x-vercel-ip-country-region-code") ??
    undefined;

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
