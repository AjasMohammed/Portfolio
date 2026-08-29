import type { Metadata } from "next";
import { Fallback, FallbackAction } from "./fallback";

// The site is one route, so everything else is a stale link or a crawler
// guess — keep those out of the index.
export const metadata: Metadata = {
  title: "Not found — Ajas Mohammed",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <Fallback code="404" title="Nothing here.">
      <p className="t-mono-xs" style={{ opacity: 0.6, letterSpacing: "0.14em" }}>
        this site is one page — that link has gone stale
      </p>
      <FallbackAction href="/" label="back to the start →" />
    </Fallback>
  );
}
