import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";

// HTTP Basic auth gate for /admin. The browser's native password prompt is
// the whole login UI — no session, no cookie, no form. The browser resends the
// credentials on every request for the rest of the tab session.
export function proxy(request: NextRequest) {
  const expected = process.env.ADMIN_PASSWORD;
  // Unset password = admin does not exist. 404 rather than 401 so the path
  // gives nothing away.
  if (!expected) return new NextResponse(null, { status: 404 });

  const auth = request.headers.get("authorization") ?? "";
  const [scheme, encoded] = auth.split(" ");
  if (scheme === "Basic" && encoded) {
    const decoded = Buffer.from(encoded, "base64").toString();
    // Username is ignored; anything before the first colon.
    const supplied = decoded.slice(decoded.indexOf(":") + 1);
    const a = Buffer.from(supplied);
    const b = Buffer.from(expected);
    if (a.length === b.length && timingSafeEqual(a, b)) return NextResponse.next();
  }

  return new NextResponse("auth required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="admin", charset="UTF-8"' },
  });
}

export const config = { matcher: "/admin/:path*" };
