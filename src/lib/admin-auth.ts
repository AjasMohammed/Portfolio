import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "admin_session";

/**
 * Stateless session: an HMAC of a constant under the password. Nothing to
 * store, and changing the password signs every browser out. ponytail: no
 * expiry inside the token — the cookie's maxAge is the expiry.
 */
export function sessionToken(password: string) {
  return createHmac("sha256", password).update("admin-session-v1").digest("hex");
}

export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function isAdmin() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  const token = (await cookies()).get(SESSION_COOKIE)?.value ?? "";
  return safeEqual(token, sessionToken(password));
}
