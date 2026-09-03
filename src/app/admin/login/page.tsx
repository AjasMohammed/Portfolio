import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { login } from "../actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

const ERRORS: Record<string, string> = {
  "1": "Wrong password.",
  rate: "Too many attempts. Try again in a few minutes.",
};

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Unset password = admin does not exist. 404 so the path gives nothing away.
  if (!process.env.ADMIN_PASSWORD) notFound();
  if (await isAdmin()) redirect("/admin");
  const { error } = await searchParams;
  const message = typeof error === "string" ? ERRORS[error] : undefined;

  return (
    <main className="flex h-full items-center justify-center bg-ink px-6 font-sans text-cream">
      <form
        action={login}
        className="w-full max-w-sm rounded-xl border border-cream/10 bg-cream/[0.04] p-8"
      >
        <p className="text-[11px] uppercase tracking-[0.2em] text-cream/50">
          ajasmohammed.space
        </p>
        <h1 className="mt-1 text-xl font-semibold">Analytics</h1>

        {/* Password managers want a username to file the entry under. */}
        <input type="text" name="username" autoComplete="username" value="admin" readOnly hidden />
        <label htmlFor="password" className="mt-8 block text-sm text-cream/70">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          aria-invalid={message ? true : undefined}
          aria-describedby={message ? "login-error" : undefined}
          className="mt-2 w-full rounded-md border border-cream/15 bg-ink px-3 py-2 text-cream outline-none transition-colors focus:border-orange focus:ring-1 focus:ring-orange"
        />
        {message && (
          <p id="login-error" role="alert" className="mt-3 text-sm text-rose-400">
            {message}
          </p>
        )}

        <button
          type="submit"
          className="mt-6 w-full rounded-md bg-orange py-2 text-sm font-medium text-ink transition-colors hover:bg-orange-soft focus-visible:ring-2 focus-visible:ring-cream focus-visible:outline-none"
        >
          Sign in
        </button>
      </form>
    </main>
  );
}
