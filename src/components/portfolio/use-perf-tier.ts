"use client";

import { useEffect, useState } from "react";

export type PerfTier = "high" | "low";

type NavigatorMaybe = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
};

/**
 * Cheap, one-shot detection that we run on mount and never re-check.
 * The goal is to disable continuously-running visual flourishes (blur orbs,
 * mix-blend grain, JS-driven hover shadows) on devices that can't handle them
 * without dropping frames during the shared-layout card expand animation.
 */
export function usePerfTier(): PerfTier {
  const [tier, setTier] = useState<PerfTier>("high");

  useEffect(() => {
    const nav = navigator as NavigatorMaybe;
    const cores = nav.hardwareConcurrency ?? 8;
    const mem = nav.deviceMemory ?? 8;
    const saveData = nav.connection?.saveData ?? false;
    const effective = nav.connection?.effectiveType ?? "";
    const coarse = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const isLow =
      reduce ||
      saveData ||
      mem <= 2 ||
      cores <= 2 ||
      effective === "slow-2g" ||
      effective === "2g" ||
      (coarse && cores <= 4);

    setTier(isLow ? "low" : "high");
  }, []);

  return tier;
}
