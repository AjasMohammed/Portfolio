"use client";

import { useSyncExternalStore } from "react";

export type PerfTier = "high" | "low";

type NavigatorMaybe = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
};

// One-shot — detected on first client read, never re-checked.
let cached: PerfTier | null = null;

function detectTier(): PerfTier {
  if (cached !== null) return cached;
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

  cached = isLow ? "low" : "high";
  return cached;
}

const subscribe = () => () => {};
const getServerSnapshot = (): PerfTier => "high";

/**
 * Cheap, one-shot detection of devices that can't run the continuously-running
 * visual flourishes (blur orbs, mix-blend grain, JS-driven hover shadows)
 * without dropping frames during the shared-layout card expand animation.
 * SSR/first paint assumes "high"; the client snapshot corrects it on hydration.
 */
export function usePerfTier(): PerfTier {
  return useSyncExternalStore(subscribe, detectTier, getServerSnapshot);
}
