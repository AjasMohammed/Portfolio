"use server";

import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { SESSION_COOKIE, safeEqual, sessionToken } from "@/lib/admin-auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/admin",
};

export async function login(formData: FormData) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) notFound();

  // 5 tries per 5 minutes per IP. Fails open like every other limiter here.
  if (!(await rateLimit("login", clientIp(await headers()), 5, 300))) {
    redirect("/admin/login?error=rate");
  }
  if (!safeEqual(String(formData.get("password") ?? ""), password)) {
    redirect("/admin/login?error=1");
  }

  (await cookies()).set(SESSION_COOKIE, sessionToken(password), {
    ...COOKIE_OPTS,
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).set(SESSION_COOKIE, "", { ...COOKIE_OPTS, maxAge: 0 });
  redirect("/admin/login");
}
