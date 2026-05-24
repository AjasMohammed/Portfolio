import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { TESTIMONIALS_CACHE_TAG } from "@/lib/testimonials";

export const runtime = "nodejs";

async function handle(request: Request) {
  const secret = process.env.TESTIMONIALS_REVALIDATE_SECRET;
  if (secret) {
    const provided =
      request.headers.get("x-revalidate-secret") ??
      new URL(request.url).searchParams.get("secret");
    if (provided !== secret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }
  revalidateTag(TESTIMONIALS_CACHE_TAG);
  revalidatePath("/");
  return NextResponse.json({
    ok: true,
    revalidated: { tag: TESTIMONIALS_CACHE_TAG, path: "/" },
  });
}

export const GET = handle;
export const POST = handle;
