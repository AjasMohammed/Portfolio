import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { TESTIMONIALS_CACHE_TAG } from "@/lib/testimonials";

export const runtime = "nodejs";

function secretsMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  // timingSafeEqual requires equal lengths; length comparison leaks only the
  // secret's length, not its content.
  return a.length === b.length && timingSafeEqual(a, b);
}

async function handle(request: Request) {
  const secret = process.env.TESTIMONIALS_REVALIDATE_SECRET;
  // Fail closed: with no secret configured this endpoint would otherwise be
  // a free cache-busting loop against the GitHub API and the sheet CSV.
  if (!secret) {
    return NextResponse.json(
      { error: "revalidation is not configured" },
      { status: 503 },
    );
  }
  // Header only — a ?secret= query string would leak into access/CDN logs.
  const provided = request.headers.get("x-revalidate-secret");
  if (!provided || !secretsMatch(provided, secret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  // "max" = stale-while-revalidate; the old `{ expire: 0 }` reproduced the
  // deprecated blocking cache-miss behavior.
  revalidateTag(TESTIMONIALS_CACHE_TAG, "max");
  revalidatePath("/");
  return NextResponse.json({
    ok: true,
    revalidated: { tag: TESTIMONIALS_CACHE_TAG, path: "/" },
  });
}

export const GET = handle;
export const POST = handle;
