"use client";

import { useEffect } from "react";
import { Fallback, FallbackAction } from "./fallback";

/* Catches client render throws — the four data fetches all fail closed
   (null/[]), so the realistic trigger is the animated tile tree, not SSR.
   ponytail: no global-error.tsx — that only fires when the root layout itself
   throws, and this layout is fonts plus static metadata. */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[portfolio] render error", error);
  }, [error]);

  return (
    <Fallback code="500" title="That broke.">
      <p className="t-mono-xs" style={{ opacity: 0.6, letterSpacing: "0.14em" }}>
        something threw on the way in — try again
      </p>
      <FallbackAction onClick={reset} label="retry →" />
    </Fallback>
  );
}
