import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Returns true only after client-side mount. Hydration-safe and lint-clean
 * (no effect / setState) — used to gate client-only reads like localStorage.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
