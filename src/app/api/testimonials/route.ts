import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_NAME = 80;
const MAX_ROLE = 80;
const MAX_MESSAGE = 1200;
const MAX_EMAIL = 120;

function trimAndCap(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  return v.trim().slice(0, max);
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  // Honeypot: hidden field that real browsers don't fill.
  if (typeof body._gotcha === "string" && body._gotcha.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const name = trimAndCap(body.name, MAX_NAME);
  const role = trimAndCap(body.role, MAX_ROLE);
  const message = trimAndCap(body.message, MAX_MESSAGE);
  const email = trimAndCap(body.email, MAX_EMAIL);

  if (!name || !message || !role) {
    return NextResponse.json(
      { error: "name, role, and message are required" },
      { status: 400 },
    );
  }

  const action = process.env.TESTIMONIALS_FORM_ACTION_URL;
  const entryName = process.env.TESTIMONIALS_ENTRY_NAME;
  const entryRole = process.env.TESTIMONIALS_ENTRY_ROLE;
  const entryMessage = process.env.TESTIMONIALS_ENTRY_MESSAGE;
  const entryEmail = process.env.TESTIMONIALS_ENTRY_EMAIL;

  if (!action || !entryName || !entryMessage) {
    console.error(
      "[testimonials] missing TESTIMONIALS_FORM_ACTION_URL / TESTIMONIALS_ENTRY_NAME / TESTIMONIALS_ENTRY_MESSAGE",
    );
    return NextResponse.json(
      { error: "server is not configured to accept submissions yet" },
      { status: 503 },
    );
  }

  const form = new URLSearchParams();
  form.set(entryName, name);
  form.set(entryMessage, message);
  if (entryRole && role) form.set(entryRole, role);
  if (entryEmail && email) form.set(entryEmail, email);

  try {
    // Google Forms responds with a 200 HTML page on success; we don't follow.
    const res = await fetch(action, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "ajas-portfolio-testimonials",
      },
      body: form.toString(),
      redirect: "manual",
      cache: "no-store",
    });
    // 200 OK or 302 redirect both mean accepted.
    if (res.status >= 200 && res.status < 400) {
      return NextResponse.json({ ok: true });
    }
    console.error("[testimonials] google form !ok", res.status);
    return NextResponse.json(
      { error: "submission failed" },
      { status: 502 },
    );
  } catch (e) {
    console.error("[testimonials] fetch threw", e);
    return NextResponse.json({ error: "submission failed" }, { status: 502 });
  }
}
