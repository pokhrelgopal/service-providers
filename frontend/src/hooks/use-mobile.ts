import * as React from "react";

const MOBILE_BREAKPOINT = 768;

/** True on viewports narrower than the mobile breakpoint. Uses
 * useSyncExternalStore (lint-clean, no setState-in-effect, SSR-safe). */
export function useIsMobile() {
  const subscribe = React.useCallback((onChange: () => void) => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return React.useSyncExternalStore(
    subscribe,
    () => window.innerWidth < MOBILE_BREAKPOINT,
    () => false,
  );
}
